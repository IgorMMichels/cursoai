alter table public.email_preferences
  add column email_locale text not null default 'pt-BR'
    check (email_locale in ('pt-BR', 'en', 'es'));

grant update (email_locale) on public.email_preferences to authenticated;

update public.email_preferences as preference
set email_locale = users.raw_user_meta_data ->> 'email_locale'
from auth.users as users
where users.id = preference.user_id
  and users.raw_user_meta_data ->> 'email_locale' in ('pt-BR', 'en', 'es');

create or replace function public.create_email_preferences_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  opted_in boolean := lower(coalesce(new.raw_user_meta_data ->> 'marketing_opt_in', 'false')) = 'true';
  locale text := new.raw_user_meta_data ->> 'email_locale';
begin
  insert into public.email_preferences (user_id, marketing_opt_in, consent_granted_at, consent_source, email_locale)
  values (new.id, opted_in, case when opted_in then now() else null end, 'account_signup',
    case when locale in ('pt-BR', 'en', 'es') then locale else 'pt-BR' end)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function public.create_email_preferences_for_new_user() from public, anon, authenticated;

create schema if not exists email_private;
revoke all on schema email_private from public, anon, authenticated;

-- Only a trigger on the existing owner-protected preferences table can invoke
-- this function. Language metadata affects copy, never authorization.
create function email_private.sync_auth_email_locale()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update auth.users
  set raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{email_locale}', to_jsonb(new.email_locale), true)
  where id = new.user_id;
  return new;
end;
$$;

revoke all on function email_private.sync_auth_email_locale() from public, anon, authenticated;

create trigger sync_auth_email_locale
  after update of email_locale on public.email_preferences
  for each row when (old.email_locale is distinct from new.email_locale)
  execute function email_private.sync_auth_email_locale();
