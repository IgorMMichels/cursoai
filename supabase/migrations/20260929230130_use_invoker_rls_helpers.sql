-- Keep RLS helper functions inside caller privileges; users only inspect their own rows.
create or replace function public.has_role(required_role public.app_role)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.app_roles
    where user_id = (select auth.uid()) and role = required_role
  );
$$;

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
      and (expires_at is null or expires_at > now())
  );
$$;

-- Anonymous policies must not call helpers executable only by authenticated users.
drop policy "plans: list active plans" on public.plans;
create policy "plans: list active plans" on public.plans
  for select to anon using (active);
create policy "plans: active or admin" on public.plans
  for select to authenticated
  using (active or (select public.has_role('admin')));

drop policy "modules: published list or admin" on public.course_modules;
create policy "modules: published list" on public.course_modules
  for select to anon using (published);
create policy "modules: published list or admin" on public.course_modules
  for select to authenticated
  using (published or (select public.has_role('admin')));

drop policy "lessons: published metadata or admin" on public.lessons;
create policy "lessons: published metadata" on public.lessons
  for select to anon using (published);
create policy "lessons: published metadata or admin" on public.lessons
  for select to authenticated
  using (published or (select public.has_role('admin')));
