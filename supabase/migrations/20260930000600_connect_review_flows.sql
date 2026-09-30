create table public.learning_review_schedule (
  user_id uuid not null references auth.users (id) on delete cascade,
  card_id text not null check (card_id in ('blockchain', 'custody', 'limit-order', 'liquidity', 'dca', 'defi', 'risk')),
  due_at timestamptz not null,
  interval_days smallint not null check (interval_days in (1, 3)),
  updated_at timestamptz not null default now(),
  primary key (user_id, card_id)
);
alter table public.learning_review_schedule enable row level security;
revoke all on table public.learning_review_schedule from public, anon, authenticated;
grant select, insert, update, delete on public.learning_review_schedule to authenticated;
create policy "review schedule: owner reads active course" on public.learning_review_schedule
  for select to authenticated
  using ((select auth.uid()) = user_id and (select public.has_active_course_access()));
create policy "review schedule: owner creates active course" on public.learning_review_schedule
  for insert to authenticated
  with check ((select auth.uid()) = user_id and (select public.has_active_course_access()));
create policy "review schedule: owner updates active course" on public.learning_review_schedule
  for update to authenticated
  using ((select auth.uid()) = user_id and (select public.has_active_course_access()))
  with check ((select auth.uid()) = user_id and (select public.has_active_course_access()));
create policy "review schedule: owner deletes active course" on public.learning_review_schedule
  for delete to authenticated
  using ((select auth.uid()) = user_id and (select public.has_active_course_access()));

create or replace function public.submit_student_review(p_rating smallint, p_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  submitted_review_id uuid;
  normalized_body text := btrim(coalesce(p_body, ''));
begin
  if current_user_id is null or not (select public.has_active_course_access()) then
    raise exception 'Active course access required.' using errcode = '42501';
  end if;
  if p_rating not between 1 and 5 or char_length(normalized_body) not between 20 and 400 then
    raise exception 'A rating from 1 to 5 and a comment from 20 to 400 characters are required.' using errcode = '22023';
  end if;

  insert into public.student_reviews (user_id, rating, body)
  values (current_user_id, p_rating, normalized_body)
  on conflict (user_id) do update
    set rating = excluded.rating,
        body = excluded.body,
        status = 'pending',
        updated_at = now()
  returning id into submitted_review_id;

  return submitted_review_id;
end;
$$;
revoke all on function public.submit_student_review(smallint, text) from public, anon;
grant execute on function public.submit_student_review(smallint, text) to authenticated;
