-- New accounts receive least-privilege student access. Admin and affiliate
-- roles stay provisioned by a trusted operator, never by browser metadata.
create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_referral text := upper(btrim(coalesce(new.raw_user_meta_data ->> 'referral_code', '')));
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));

  insert into public.app_roles (user_id, role)
  values (new.id, 'student')
  on conflict (user_id, role) do nothing;

  -- Store attribution only for an active, provisioned affiliate code.
  if requested_referral <> '' and exists (
    select 1
    from public.affiliate_profiles
    where referral_code = requested_referral and active
  ) then
    insert into public.affiliate_events (referral_code, event_type, user_id, source_path)
    values (requested_referral, 'signup', new.id, '/login');
  end if;

  return new;
end;
$$;

-- A trigger invokes this function; clients must not call it as an RPC.
revoke all on function public.create_profile_for_new_user() from public, anon, authenticated;

-- Give existing accounts least-privilege access only when they have no role.
insert into public.app_roles (user_id, role)
select users.id, 'student'::public.app_role
from auth.users as users
where not exists (
  select 1 from public.app_roles as roles where roles.user_id = users.id
)
on conflict (user_id, role) do nothing;
