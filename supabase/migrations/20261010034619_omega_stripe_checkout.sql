-- Stripe-hosted one-time checkout and webhook fulfillment.
alter table public.orders drop constraint if exists orders_currency_check;
alter table public.orders add constraint orders_currency_check check (currency in ('BRL', 'USD', 'EUR', 'SOL'));

create table public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);
alter table public.stripe_webhook_events enable row level security;
revoke all on table public.stripe_webhook_events from public, anon, authenticated;

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
  v_duration integer;
  v_latest_expiry timestamptz;
  v_has_lifetime boolean;
  v_starts_at timestamptz;
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

  update public.orders set status = 'confirmed' where id = p_order_id;
  select duration_days into v_duration from public.plans where id = v_order.plan_id;
  if v_duration is null then
    update public.subscriptions set status = 'expired'
      where user_id = v_order.user_id and status = 'active' and expires_at is not null;
    insert into public.subscriptions(user_id, plan_id, status, starts_at, expires_at, provider, provider_reference)
      values (v_order.user_id, v_order.plan_id, 'active', now(), null, 'stripe', p_session_id);
  else
    select coalesce(bool_or(expires_at is null), false), max(expires_at)
      into v_has_lifetime, v_latest_expiry
      from public.subscriptions
      where user_id = v_order.user_id and status = 'active'
        and (expires_at is null or expires_at > now());
    if not v_has_lifetime then
      v_starts_at := greatest(now(), coalesce(v_latest_expiry, now()));
      insert into public.subscriptions(user_id, plan_id, status, starts_at, expires_at, provider, provider_reference)
        values (v_order.user_id, v_order.plan_id, 'active', v_starts_at, v_starts_at + make_interval(days => v_duration), 'stripe', p_session_id);
    end if;
  end if;

  perform public.claim_founder_for_order(p_order_id);
  return true;
end;
$$;
revoke all on function public.fulfill_stripe_checkout(text, text, uuid, text, bigint, text) from public, anon, authenticated;
grant execute on function public.fulfill_stripe_checkout(text, text, uuid, text, bigint, text) to service_role;
