-- Entitlements are active only inside their configured validity window.
create or replace function public.has_active_course_access()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = (select auth.uid())
      and status = 'active'
      and (starts_at is null or starts_at <= now())
      and (expires_at is null or expires_at > now())
  );
$$;
