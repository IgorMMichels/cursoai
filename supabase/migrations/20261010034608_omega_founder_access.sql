-- Add founder identity and a capped first-25 claim, assigned only to confirmed orders.
alter table public.plans
  drop constraint if exists plans_id_check,
  add constraint plans_id_check check (id in ('month', 'quarter', 'annual', 'lifetime'));

alter table public.profiles
  add column if not exists is_founder boolean not null default false,
  add column if not exists founder_number smallint unique check (founder_number between 1 and 25);

create table if not exists public.founder_claims (
  founder_number smallint primary key check (founder_number between 1 and 25),
  user_id uuid not null unique references auth.users(id) on delete restrict,
  order_id uuid not null unique references public.orders(id) on delete restrict,
  claimed_at timestamptz not null default now()
);
alter table public.founder_claims enable row level security;
revoke all on table public.founder_claims from anon, authenticated;

create or replace function public.claim_founder_for_order(p_order_id uuid)
returns smallint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_number smallint;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.status <> 'confirmed' then return null; end if;
  select founder_number into v_number from public.profiles where id = v_order.user_id and is_founder;
  if found then return v_number; end if;
  if exists (select 1 from public.founder_claims where order_id = p_order_id) then
    select founder_number into v_number from public.founder_claims where order_id = p_order_id;
    return v_number;
  end if;
  perform pg_advisory_xact_lock(704251);
  select (coalesce(max(founder_number), 0) + 1)::smallint into v_number from public.founder_claims;
  if v_number > 25 then return null; end if;
  insert into public.founder_claims(founder_number, user_id, order_id)
  values (v_number, v_order.user_id, p_order_id);
  update public.profiles set is_founder = true, founder_number = v_number where id = v_order.user_id;
  return v_number;
end;
$$;
revoke all on function public.claim_founder_for_order(uuid) from public, anon, authenticated;
grant execute on function public.claim_founder_for_order(uuid) to service_role;
