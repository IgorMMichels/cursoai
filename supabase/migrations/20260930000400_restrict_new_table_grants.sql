-- Supabase default table privileges can grant broad direct access even when RLS exists.
-- Keep access explicit; the quiz keys remain reachable only through checked RPCs.
alter default privileges for role postgres in schema public
  revoke all on tables from public, anon, authenticated;

revoke all on table public.learning_profiles, public.course_certificates,
  public.module_quiz_questions, public.student_reviews
  from public, anon, authenticated;

grant select, insert, update on public.learning_profiles to authenticated;
grant select on public.course_certificates to authenticated;

grant select on public.student_reviews to anon, authenticated;
grant insert (user_id, rating, body) on public.student_reviews to authenticated;
grant update (rating, body, status, updated_at) on public.student_reviews to authenticated;
grant delete on public.student_reviews to authenticated;
