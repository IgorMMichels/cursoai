alter table public.profiles add column username text;

do $$
declare
  profile_row record;
  candidate text;
begin
  for profile_row in
    select id, display_name from public.profiles order by id
  loop
    candidate := left(
      btrim(regexp_replace(lower(coalesce(profile_row.display_name, '')), '[^a-z0-9_-]+', '-', 'g'), '-_'),
      24
    );
    candidate := btrim(candidate, '-_');

    if candidate !~ '^[a-z][a-z0-9_-]{2,23}$'
      or candidate = any(array['landing', 'login', 'admin', 'curso', 'afiliar', 'afiliado', 'acesso', 'quiz'])
      or exists (select 1 from public.profiles where username = candidate)
    then
      candidate := 'user-' || substr(replace(profile_row.id::text, '-', ''), 1, 16);
      while exists (select 1 from public.profiles where username = candidate) loop
        candidate := 'user-' || substr(md5(profile_row.id::text || candidate), 1, 16);
      end loop;
    end if;

    update public.profiles set username = candidate where id = profile_row.id;
  end loop;
end;
$$;

alter table public.profiles alter column username set not null;
alter table public.profiles add constraint profiles_username_key unique (username);
alter table public.profiles add constraint profiles_username_format
  check (username ~ '^[a-z][a-z0-9_-]{2,23}$');

create table public.affiliate_referral_aliases (
  alias text primary key check (alias ~ '^[a-z0-9_-]{3,32}$'),
  affiliate_user_id uuid not null references public.affiliate_profiles (user_id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.affiliate_referral_aliases enable row level security;
revoke all on public.affiliate_referral_aliases from public, anon, authenticated;

insert into public.affiliate_referral_aliases (alias, affiliate_user_id)
select lower(affiliate.referral_code), affiliate.user_id
from public.affiliate_profiles as affiliate
join public.profiles as profile on profile.id = affiliate.user_id
where lower(affiliate.referral_code) <> profile.username
  and not exists (
    select 1
    from public.affiliate_profiles as other_affiliate
    join public.profiles as other_profile on other_profile.id = other_affiliate.user_id
    where other_profile.username = lower(affiliate.referral_code)
      and other_affiliate.user_id <> affiliate.user_id
  )
on conflict (alias) do nothing;

alter table public.orders drop constraint orders_referral_code_fkey;
alter table public.orders add constraint orders_referral_code_fkey
  foreign key (referral_code) references public.affiliate_profiles (referral_code) on update cascade;
alter table public.affiliate_events drop constraint affiliate_events_referral_code_fkey;
alter table public.affiliate_events add constraint affiliate_events_referral_code_fkey
  foreign key (referral_code) references public.affiliate_profiles (referral_code) on update cascade;

update public.affiliate_profiles
set referral_code = 'legacy-' || replace(user_id::text, '-', '');

update public.affiliate_profiles as affiliate
set referral_code = profile.username
from public.profiles as profile
where profile.id = affiliate.user_id;

alter table public.affiliate_profiles add constraint affiliate_profiles_referral_code_format
  check (referral_code ~ '^[a-z][a-z0-9_-]{2,23}$');

create or replace function public.is_affiliate_username_available(p_username text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  normalized_username text := lower(btrim(coalesce(p_username, '')));
begin
  if normalized_username !~ '^[a-z][a-z0-9_-]{2,23}$'
    or normalized_username = any(array['landing', 'login', 'admin', 'curso', 'afiliar', 'afiliado', 'acesso', 'quiz'])
  then
    return false;
  end if;

  return not exists (
    select 1 from public.profiles where username = normalized_username
  );
end;
$$;
revoke all on function public.is_affiliate_username_available(text) from public;
grant execute on function public.is_affiliate_username_available(text) to anon, authenticated;

create or replace function public.resolve_affiliate_referral_code(p_code text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select affiliate.referral_code
  from public.affiliate_profiles as affiliate
  where affiliate.active
    and affiliate.referral_code = lower(btrim(coalesce(p_code, '')))
  union all
  select affiliate.referral_code
  from public.affiliate_referral_aliases as alias
  join public.affiliate_profiles as affiliate on affiliate.user_id = alias.affiliate_user_id
  where affiliate.active
    and alias.alias = lower(btrim(coalesce(p_code, '')))
    and not exists (
      select 1 from public.affiliate_profiles as current_code
      where current_code.active and current_code.referral_code = lower(btrim(coalesce(p_code, '')))
    )
  limit 1;
$$;
revoke all on function public.resolve_affiliate_referral_code(text) from public, anon, authenticated;

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
  values (new.id, 'student'), (new.id, 'affiliate')
  on conflict (user_id, role) do nothing;

  insert into public.affiliate_profiles (user_id, referral_code, commission_bps, active)
  values (new.id, requested_username, 2000, true);

  attributed_code := public.resolve_affiliate_referral_code(new.raw_user_meta_data ->> 'referral_code');
  if attributed_code is not null then
    insert into public.affiliate_events (referral_code, event_type, user_id, source_path)
    values (attributed_code, 'signup', new.id, '/login');
  end if;

  return new;
end;
$$;
revoke all on function public.create_profile_for_new_user() from public, anon, authenticated;

create or replace function public.record_affiliate_click(p_code text, p_visitor_id uuid, p_source_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_code text := lower(btrim(coalesce(p_code, '')));
  resolved_code text;
  normalized_path text := left(coalesce(p_source_path, '/'), 256);
begin
  if normalized_code !~ '^[a-z0-9_-]{3,32}$' or p_visitor_id is null or normalized_path not like '/%' then
    return;
  end if;

  resolved_code := public.resolve_affiliate_referral_code(normalized_code);
  if resolved_code is null then return; end if;

  if exists (
    select 1 from public.affiliate_events
    where referral_code = resolved_code and event_type = 'click'
      and visitor_id = p_visitor_id::text and created_at > now() - interval '24 hours'
  ) then
    return;
  end if;

  insert into public.affiliate_events (referral_code, event_type, visitor_id, source_path)
  values (resolved_code, 'click', p_visitor_id::text, normalized_path);
end;
$$;
revoke all on function public.record_affiliate_click(text, uuid, text) from public;
grant execute on function public.record_affiliate_click(text, uuid, text) to anon, authenticated;

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

  select username into new_code from public.profiles where id = current_user_id;
  if new_code is null then raise exception 'Profile ID is unavailable.' using errcode = '55000'; end if;

  insert into public.app_roles (user_id, role) values (current_user_id, 'affiliate') on conflict do nothing;
  insert into public.affiliate_profiles (user_id, referral_code, commission_bps, active)
  values (current_user_id, new_code, 2000, true);
  return new_code;
end;
$$;
revoke all on function public.join_affiliate_program() from public, anon;
grant execute on function public.join_affiliate_program() to authenticated;
