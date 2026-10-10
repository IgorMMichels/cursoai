-- Adds the international annual access plan without changing the established
-- Brazilian prices or the existing lifetime plan.
alter table public.plans
  drop constraint if exists plans_id_check,
  drop constraint if exists plans_price_brl_check,
  alter column price_brl drop not null;

alter table public.plans
  add constraint plans_id_check check (id in ('month', 'quarter', 'annual', 'lifetime')),
  add constraint plans_price_brl_check check (price_brl is null or price_brl > 0);

insert into public.plans (id, name, duration_days, price_brl, price_sol)
values ('annual', 'Anual', 365, null, 1.6)
on conflict (id) do update set
  name = excluded.name,
  duration_days = excluded.duration_days,
  price_brl = excluded.price_brl,
  price_sol = excluded.price_sol,
  active = true;

alter table public.orders drop constraint if exists orders_currency_check;
alter table public.orders add constraint orders_currency_check check (currency in ('BRL', 'USD', 'EUR', 'SOL'));
