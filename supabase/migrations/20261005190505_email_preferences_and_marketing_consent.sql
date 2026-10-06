create table public.email_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  marketing_opt_in boolean not null default false,
  consent_granted_at timestamptz,
  consent_revoked_at timestamptz,
  consent_source text not null default 'account_signup' check (consent_source in ('account_signup', 'account_preferences')),
  updated_at timestamptz not null default now()
);

alter table public.email_preferences enable row level security;

revoke all on table public.email_preferences from public, anon, authenticated;
grant select on table public.email_preferences to authenticated;
grant update (marketing_opt_in) on table public.email_preferences to authenticated;

create policy "Users can read their own email preferences"
  on public.email_preferences for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can update their own marketing preference"
  on public.email_preferences for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.create_email_preferences_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  opted_in boolean := lower(coalesce(new.raw_user_meta_data ->> 'marketing_opt_in', 'false')) = 'true';
begin
  insert into public.email_preferences (
    user_id, marketing_opt_in, consent_granted_at, consent_source
  ) values (
    new.id,
    opted_in,
    case when opted_in then now() else null end,
    'account_signup'
  ) on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.create_email_preferences_for_new_user() from public, anon, authenticated;

create trigger on_auth_user_created_email_preferences
  after insert on auth.users
  for each row execute procedure public.create_email_preferences_for_new_user();

insert into public.email_preferences (user_id)
select users.id
from auth.users as users
on conflict (user_id) do nothing;

create or replace function public.track_email_preference_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.marketing_opt_in is distinct from old.marketing_opt_in then
    new.updated_at := now();
    new.consent_source := 'account_preferences';
    if new.marketing_opt_in then
      new.consent_granted_at := now();
      new.consent_revoked_at := null;
    else
      new.consent_revoked_at := now();
    end if;
  end if;
  return new;
end;
$$;

create trigger track_email_preference_change
  before update on public.email_preferences
  for each row execute procedure public.track_email_preference_change();
