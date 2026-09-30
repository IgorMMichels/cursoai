create or replace function public.join_affiliate_program()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  existing_code text;
  existing_active boolean;
  new_code text;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if (select public.has_role('admin')) then
    raise exception 'Administrators cannot enroll as affiliates.' using errcode = '42501';
  end if;

  select referral_code, active into existing_code, existing_active
    from public.affiliate_profiles where user_id = current_user_id;
  if existing_code is not null then
    if not existing_active then raise exception 'Affiliate account is inactive.' using errcode = '42501'; end if;
    return existing_code;
  end if;

  new_code := 'CZ' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  insert into public.app_roles (user_id, role) values (current_user_id, 'affiliate') on conflict do nothing;
  insert into public.affiliate_profiles (user_id, referral_code, commission_bps, active)
    values (current_user_id, new_code, 2000, true);
  return new_code;
end;
$$;
revoke all on function public.join_affiliate_program() from public, anon;
grant execute on function public.join_affiliate_program() to authenticated;
