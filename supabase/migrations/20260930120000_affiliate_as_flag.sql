-- Afiliado como flag: @id unico (profiles.username) + isAffiliate via affiliate_profiles.
-- Nao remove o enum 'affiliate' (compat); apenas para de usar como role primaria.

-- (a) Todo signup vira 'student'; affiliate_profiles segue criado com referral_code = username (@id de tudo).
create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text := lower(btrim(coalesce(new.raw_user_meta_data ->> 'username', '')));
  attributed_code text;
begin
  if requested_username = '' then
    requested_username := 'user-' || substr(replace(new.id::text, '-', ''), 1, 16);
  end if;
  if not public.is_affiliate_username_available(requested_username) then
    raise exception 'ID indisponível. Use um ID único de 3 a 24 caracteres.' using errcode = '22023';
  end if;

  insert into public.profiles (id, display_name, username)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''), requested_username);

  insert into public.app_roles (user_id, role)
  values (new.id, 'student')
  on conflict (user_id, role) do nothing;

  insert into public.affiliate_profiles (user_id, referral_code, commission_bps, active)
  values (new.id, requested_username, 2000, true)
  on conflict (user_id) do nothing;

  attributed_code := public.resolve_affiliate_referral_code(new.raw_user_meta_data ->> 'referral_code');
  if attributed_code is not null then
    insert into public.affiliate_events (referral_code, event_type, user_id, source_path)
    values (attributed_code, 'signup', new.id, '/login');
  end if;

  return new;
end;
$$;
revoke all on function public.create_profile_for_new_user() from public, anon, authenticated;

-- (b) join_affiliate_program idempotente para student e admin (sem bloqueio de admin).
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

  select referral_code, active into existing_code, existing_active
  from public.affiliate_profiles where user_id = current_user_id;
  if existing_code is not null then
    if not existing_active then raise exception 'Affiliate account is inactive.' using errcode = '42501'; end if;
    return existing_code;
  end if;

  select username into new_code from public.profiles where id = current_user_id;
  if new_code is null then raise exception 'Profile ID is unavailable.' using errcode = '55000'; end if;

  insert into public.affiliate_profiles (user_id, referral_code, commission_bps, active)
  values (current_user_id, new_code, 2000, true)
  on conflict (user_id) do update set active = true
  returning referral_code into new_code;
  return new_code;
end;
$$;
revoke all on function public.join_affiliate_program() from public, anon;
grant execute on function public.join_affiliate_program() to authenticated;

-- (c) Backfill: affiliate_profiles faltantes a partir de profiles.username.
insert into public.affiliate_profiles (user_id, referral_code, commission_bps, active)
select p.id, p.username, 2000, true
from public.profiles as p
left join public.affiliate_profiles as a on a.user_id = p.id
where a.user_id is null
  and p.username ~ '^[a-z][a-z0-9_-]{2,23}$'
on conflict (user_id) do nothing;

-- (d) is_affiliate_username_available continua valendo como verificacao de @id unico
-- (profiles.username). Nenhuma alteracao necessaria; mantida pela migration anterior.
