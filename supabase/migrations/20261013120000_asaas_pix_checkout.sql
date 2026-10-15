-- Pix checkout through Asaas: a Pix charge is an order whose provider_reference holds the Asaas payment id (pay_...).
-- The Asaas webhook only names the payment; the server re-reads it from the Asaas API before calling this function.

create table public.asaas_webhook_events (
  event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);
alter table public.asaas_webhook_events enable row level security;
revoke all on table public.asaas_webhook_events from public, anon, authenticated;

-- Releases access for a Pix order once Asaas reports the payment as received (or confirmed).
-- Idempotent per webhook event id, and per order: a second event for a confirmed order returns true without a second grant.
create or replace function public.fulfill_asaas_pix(
  p_event_id text,
  p_event_type text,
  p_order_id uuid,
  p_payment_id text,
  p_amount_minor bigint
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  if p_event_id is null or p_event_id = '' or p_event_type not in ('PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED') then
    raise exception 'Unsupported Asaas event.' using errcode = '22023';
  end if;

  insert into public.asaas_webhook_events(event_id, event_type)
  values (p_event_id, p_event_type)
  on conflict (event_id) do nothing;
  if not found then return false; end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.currency <> 'BRL' or v_order.provider_reference is distinct from p_payment_id then
    raise exception 'Asaas payment does not match order.' using errcode = '22023';
  end if;
  if round(v_order.amount * 100)::bigint <> p_amount_minor then
    raise exception 'Asaas amount does not match order.' using errcode = '22023';
  end if;
  if v_order.status = 'confirmed' then return true; end if;
  if v_order.status <> 'pending' then raise exception 'Order is not payable.' using errcode = '22023'; end if;

  perform public.release_order_access(p_order_id, 'asaas', p_payment_id);
  return true;
end;
$$;
revoke all on function public.fulfill_asaas_pix(text, text, uuid, text, bigint) from public, anon, authenticated;
grant execute on function public.fulfill_asaas_pix(text, text, uuid, text, bigint) to service_role;
