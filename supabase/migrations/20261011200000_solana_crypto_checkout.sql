-- Solana (SOL) checkout: orders carry a unique on-chain reference, the exact amount in lamports and an expiry.
-- orders.provider_reference is already unique (orders_provider_reference_key); for SOL orders it holds the
-- transaction signature, so one signature can release at most one order.
alter table public.orders
  add column if not exists reference text,
  add column if not exists amount_lamports bigint,
  add column if not exists expires_at timestamptz;

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending', 'confirmed', 'refunded', 'failed', 'expired'));

alter table public.orders add constraint orders_sol_payment_fields_check
  check (currency <> 'SOL' or (reference is not null and amount_lamports > 0 and expires_at is not null)) not valid;

create unique index orders_reference_key on public.orders (reference) where reference is not null;
create index orders_pending_sol_idx on public.orders (created_at) where currency = 'SOL' and status = 'pending';

-- Shared access release: marks the order confirmed, grants the subscription and claims the Founder seal.
-- Extracted from fulfill_stripe_checkout so Stripe and Solana release access through the same code.
create or replace function public.release_order_access(p_order_id uuid, p_provider text, p_reference text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_duration integer;
  v_latest_expiry timestamptz;
  v_has_lifetime boolean;
  v_starts_at timestamptz;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Order not found.' using errcode = '22023'; end if;

  update public.orders set status = 'confirmed' where id = p_order_id;
  select duration_days into v_duration from public.plans where id = v_order.plan_id;
  if v_duration is null then
    update public.subscriptions set status = 'expired'
      where user_id = v_order.user_id and status = 'active' and expires_at is not null;
    insert into public.subscriptions(user_id, plan_id, status, starts_at, expires_at, provider, provider_reference)
      values (v_order.user_id, v_order.plan_id, 'active', now(), null, p_provider, p_reference);
  else
    select coalesce(bool_or(expires_at is null), false), max(expires_at)
      into v_has_lifetime, v_latest_expiry
      from public.subscriptions
      where user_id = v_order.user_id and status = 'active'
        and (expires_at is null or expires_at > now());
    if not v_has_lifetime then
      v_starts_at := greatest(now(), coalesce(v_latest_expiry, now()));
      insert into public.subscriptions(user_id, plan_id, status, starts_at, expires_at, provider, provider_reference)
        values (v_order.user_id, v_order.plan_id, 'active', v_starts_at, v_starts_at + make_interval(days => v_duration), p_provider, p_reference);
    end if;
  end if;

  perform public.claim_founder_for_order(p_order_id);
end;
$$;
revoke all on function public.release_order_access(uuid, text, text) from public, anon, authenticated;
grant execute on function public.release_order_access(uuid, text, text) to service_role;

-- Same behavior as before; the release steps now live in release_order_access.
create or replace function public.fulfill_stripe_checkout(
  p_event_id text,
  p_event_type text,
  p_order_id uuid,
  p_session_id text,
  p_amount_minor bigint,
  p_currency text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  if p_event_id is null or p_event_id = '' or p_event_type not in ('checkout.session.completed', 'checkout.session.async_payment_succeeded') then
    raise exception 'Unsupported Stripe event.' using errcode = '22023';
  end if;

  insert into public.stripe_webhook_events(event_id, event_type)
  values (p_event_id, p_event_type)
  on conflict (event_id) do nothing;
  if not found then return false; end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.provider_reference is distinct from p_session_id then
    raise exception 'Stripe session does not match order.' using errcode = '22023';
  end if;
  if lower(v_order.currency) <> lower(p_currency)
    or round(v_order.amount * 100)::bigint <> p_amount_minor then
    raise exception 'Stripe amount does not match order.' using errcode = '22023';
  end if;
  if v_order.status = 'confirmed' then return true; end if;
  if v_order.status <> 'pending' then raise exception 'Order is not payable.' using errcode = '22023'; end if;

  perform public.release_order_access(p_order_id, 'stripe', p_session_id);
  return true;
end;
$$;
revoke all on function public.fulfill_stripe_checkout(text, text, uuid, text, bigint, text) from public, anon, authenticated;
grant execute on function public.fulfill_stripe_checkout(text, text, uuid, text, bigint, text) to service_role;

-- Releases access for a Solana order after the server verified the transfer on-chain.
-- Returns true when the order is confirmed (including when it already was with this signature).
-- Raises unique_violation (23505) if the signature already released a different order.
create or replace function public.fulfill_crypto_order(
  p_order_id uuid,
  p_signature text,
  p_amount_lamports bigint,
  p_block_time timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  if p_signature is null or length(p_signature) < 64 then
    raise exception 'Invalid signature.' using errcode = '22023';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.currency <> 'SOL' or v_order.reference is null then
    raise exception 'Order is not a Solana order.' using errcode = '22023';
  end if;
  if v_order.status = 'confirmed' then
    return v_order.provider_reference is not distinct from p_signature;
  end if;
  if v_order.amount_lamports is distinct from p_amount_lamports then
    raise exception 'Solana amount does not match order.' using errcode = '22023';
  end if;
  -- A payment included in a block after the order expired is not accepted; one made in time but verified late is.
  if p_block_time is null or p_block_time > v_order.expires_at + interval '1 minute' then
    raise exception 'Payment arrived after the order expired.' using errcode = '22023';
  end if;
  if v_order.status not in ('pending', 'expired') then
    raise exception 'Order is not payable.' using errcode = '22023';
  end if;

  update public.orders set provider_reference = p_signature where id = p_order_id;
  perform public.release_order_access(p_order_id, 'solana', p_signature);
  return true;
end;
$$;
revoke all on function public.fulfill_crypto_order(uuid, text, bigint, timestamptz) from public, anon, authenticated;
grant execute on function public.fulfill_crypto_order(uuid, text, bigint, timestamptz) to service_role;
