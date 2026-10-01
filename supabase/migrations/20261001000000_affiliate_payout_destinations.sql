alter table public.affiliate_profiles
  add column payout_pix_key text,
  add column payout_sol_address text;

alter table public.payout_requests
  add column payout_destination text;

grant update (payout_pix_key, payout_sol_address) on public.affiliate_profiles to authenticated;

create policy "affiliate: user updates own payout destinations"
  on public.affiliate_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.request_affiliate_payout(p_currency text)
returns table (payout_id uuid, requested_amount numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  available_amount numeric(14, 4);
  destination text;
  new_payout_id uuid;
begin
  if current_user_id is null or p_currency not in ('BRL', 'SOL') then
    raise exception 'Valid affiliate session and currency required.' using errcode = '42501';
  end if;

  select case when p_currency = 'BRL' then payout_pix_key else payout_sol_address end
    into destination
  from public.affiliate_profiles
  where user_id = current_user_id and active;

  if not found then
    raise exception 'Active affiliate account required.' using errcode = '42501';
  end if;
  if nullif(btrim(destination), '') is null then
    raise exception 'Configure a payout destination before requesting a payout.' using errcode = '55000';
  end if;

  perform 1 from public.commission_entries
  where affiliate_user_id = current_user_id
    and currency = p_currency and status = 'available'
  for update;

  select coalesce(sum(amount), 0) into available_amount
  from public.commission_entries
  where affiliate_user_id = current_user_id
    and currency = p_currency and status = 'available';
  if available_amount <= 0 then
    raise exception 'No available commission for this currency.' using errcode = '55000';
  end if;

  update public.commission_entries set status = 'requested'
  where affiliate_user_id = current_user_id
    and currency = p_currency and status = 'available';
  insert into public.payout_requests (affiliate_user_id, amount, currency, status, payout_destination)
  values (current_user_id, available_amount, p_currency, 'requested', destination)
  returning id into new_payout_id;
  update public.commission_entries set payout_request_id = new_payout_id
  where affiliate_user_id = current_user_id
    and currency = p_currency and status = 'requested' and payout_request_id is null;

  return query select new_payout_id, available_amount;
end;
$$;

revoke all on function public.request_affiliate_payout(text) from public, anon;
grant execute on function public.request_affiliate_payout(text) to authenticated;
