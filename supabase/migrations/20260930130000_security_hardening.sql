-- Security hardening (closed scope): tighten direct grants, route review
-- moderation through admin-only RPCs, add owner-only avatar updates.
-- Out of scope (untouched): subscriptions/orders, learning_profile /
-- security_checklist, no webhooks. Existing policies are preserved.

-- 1) student_reviews: drop broad update(status, updated_at)/delete, keep minimal grants.
-- Previous grants (20260930000100, 20260930000400): select to anon +
-- authenticated, insert(user_id, rating, body), update(rating, body, status,
-- updated_at), delete to authenticated. Policies stay as-is.
revoke all on table public.student_reviews from public, anon, authenticated;
grant select on public.student_reviews to anon, authenticated;
grant insert (user_id, rating, body) on public.student_reviews to authenticated;
grant update (rating, body) on public.student_reviews to authenticated;

create or replace function public.moderate_review(p_id uuid, p_result text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.has_role('admin')) then
    raise exception 'Admin role required.' using errcode = '42501';
  end if;
  if p_result not in ('approved', 'rejected') then
    raise exception 'Result must be approved or rejected.' using errcode = '22023';
  end if;
  update public.student_reviews set status = p_result, updated_at = now() where id = p_id;
  if not found then
    raise exception 'Review not found.' using errcode = '55000';
  end if;
end;
$$;
revoke all on function public.moderate_review(uuid, text) from public, anon;
grant execute on function public.moderate_review(uuid, text) to authenticated;

create or replace function public.delete_review(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.has_role('admin')) then
    raise exception 'Admin role required.' using errcode = '42501';
  end if;
  delete from public.student_reviews where id = p_id;
  if not found then
    raise exception 'Review not found.' using errcode = '55000';
  end if;
end;
$$;
revoke all on function public.delete_review(uuid) from public, anon;
grant execute on function public.delete_review(uuid) to authenticated;

-- 2) Lesson bodies / answer keys / quiz questions: revoke direct writes from
-- client roles. Select grants and admin-only policies are preserved; reads and
-- writes of answers stay gated by RLS plus the checked SECURITY DEFINER RPCs
-- (verify_lesson_exercise, get_module_quiz, submit_module_quiz).
revoke insert, update, delete on table public.lesson_content from public, anon, authenticated;
revoke insert, update, delete on table public.lesson_exercise_keys from public, anon, authenticated;
revoke insert, update, delete on table public.module_quiz_questions from public, anon, authenticated;
grant select on public.lesson_content to authenticated;
grant select on public.lesson_exercise_keys to authenticated;
grant select on public.module_quiz_questions to authenticated;

-- 3) profile-avatars bucket: add owner-only update on storage.objects, mirroring
-- the existing owner insert/delete policies. Bucket definition stays public.
drop policy if exists "profile avatars: owner updates" on storage.objects;
create policy "profile avatars: owner updates"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
