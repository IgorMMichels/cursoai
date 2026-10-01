create table public.journeys (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  ordinal integer not null,
  title text not null,
  short_desc text not null default '',
  long_desc text not null default '',
  icon text not null default 'BookOpen',
  color text not null default 'mint',
  level text not null default 'iniciante' check (level in ('iniciante', 'intermediario', 'avancado')),
  cover_url text,
  published boolean not null default false
);
alter table public.journeys enable row level security;
revoke all on public.journeys from public, anon, authenticated;
grant select on public.journeys to anon, authenticated;
grant insert, update, delete on public.journeys to authenticated;
create policy "journeys: published list" on public.journeys for select to anon
  using (published);
create policy "journeys: published or admin" on public.journeys for select to authenticated
  using (published or (select public.has_role('admin')));
create policy "journeys: admin insert" on public.journeys for insert to authenticated
  with check ((select public.has_role('admin')));
create policy "journeys: admin update" on public.journeys for update to authenticated
  using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
create policy "journeys: admin delete" on public.journeys for delete to authenticated
  using ((select public.has_role('admin')));

insert into public.journeys (id, ordinal, title, short_desc, long_desc, icon, color, level, published)
values ('cripto-do-zero', 4, 'Cripto do Zero', 'Aprenda fundamentos, segurança e decisões conscientes em cripto.',
        'Sua trilha original de fundamentos de criptoativos, carteiras, segurança, análise e gestão de risco.',
        'BookOpen', 'lilac', 'iniciante', true);
alter table public.course_modules add column journey_id text references public.journeys(id);
alter table public.course_modules drop constraint course_modules_journey_id_fkey;
alter table public.course_modules add constraint course_modules_journey_id_fkey foreign key (journey_id) references public.journeys(id) on update cascade on delete cascade;
update public.course_modules set journey_id = 'cripto-do-zero' where journey_id is null;
alter table public.course_modules alter column journey_id set not null;
alter table public.course_modules drop constraint course_modules_ordinal_key;
alter table public.course_modules add constraint course_modules_journey_ordinal_key unique (journey_id, ordinal);
create index course_modules_journey_idx on public.course_modules (journey_id, ordinal);

-- Hide modules and lessons when parent journey is unpublished.
drop policy "modules: published list or admin" on public.course_modules;
drop policy "modules: published list" on public.course_modules;
create policy "modules: published list" on public.course_modules for select to anon
  using (published and exists (select 1 from public.journeys j where j.id = journey_id and j.published));
create policy "modules: published list or admin" on public.course_modules for select to authenticated
  using ((published and exists (select 1 from public.journeys j where j.id = journey_id and j.published)) or (select public.has_role('admin')));
drop policy "lessons: published metadata or admin" on public.lessons;
drop policy "lessons: published metadata" on public.lessons;
create policy "lessons: published metadata" on public.lessons for select to anon
  using (published and exists (select 1 from public.course_modules m where m.id = module_id and m.published));
create policy "lessons: published metadata or admin" on public.lessons for select to authenticated
  using ((published and exists (select 1 from public.course_modules m where m.id = module_id and m.published)) or (select public.has_role('admin')));
create policy "progress: admin reads" on public.lesson_progress for select to authenticated
  using ((select public.has_role('admin')));
drop policy "progress: active student creates own" on public.lesson_progress;
drop policy "progress: active student updates own" on public.lesson_progress;
create policy "progress: active student creates own" on public.lesson_progress for insert to authenticated
  with check (
    (select auth.uid()) = user_id and (
      (select public.has_role('admin')) or (
        (select public.has_active_course_access()) and exists (
          select 1 from public.lessons l
          join public.course_modules m on m.id = l.module_id
          join public.journeys j on j.id = m.journey_id
          where l.id = lesson_id and l.published and m.published and j.published
        )
      )
    )
  );
create policy "progress: active student updates own" on public.lesson_progress for update to authenticated
  using ((select auth.uid()) = user_id and ((select public.has_active_course_access()) or (select public.has_role('admin'))))
  with check (
    (select auth.uid()) = user_id and (
      (select public.has_role('admin')) or (
        (select public.has_active_course_access()) and exists (
          select 1 from public.lessons l
          join public.course_modules m on m.id = l.module_id
          join public.journeys j on j.id = m.journey_id
          where l.id = lesson_id and l.published and m.published and j.published
        )
      )
    )
  );
grant insert, update, delete on public.lesson_content to authenticated;
grant select, insert, update, delete on public.lesson_exercise_keys to authenticated;
create policy "exercise keys: admin only" on public.lesson_exercise_keys for all to authenticated
  using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
grant select, insert, update, delete on public.module_quiz_questions to authenticated;
drop policy "lesson content: active students or admin" on public.lesson_content;
create policy "lesson content: active students or admin" on public.lesson_content for select to authenticated
  using ((select public.has_role('admin')) or (
    (select public.has_active_course_access()) and exists (
      select 1 from public.lessons l
      join public.course_modules m on m.id = l.module_id
      join public.journeys j on j.id = m.journey_id
      where l.id = lesson_id and l.published and m.published and j.published
    )
  ));

-- A hidden journey must not leave its lesson checks or quizzes callable by ID.
create or replace function public.verify_lesson_exercise(p_lesson_id text, p_answer_index integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected_answer smallint;
begin
  if (select auth.uid()) is null or not (select public.has_active_course_access()) then
    raise exception 'Active course access required.' using errcode = '42501';
  end if;
  select answer.answer_index into expected_answer
  from public.lesson_exercise_keys as answer
  join public.lessons as lesson on lesson.id = answer.lesson_id and lesson.published
  join public.course_modules as module on module.id = lesson.module_id and module.published
  join public.journeys as journey on journey.id = module.journey_id and journey.published
  where answer.lesson_id = p_lesson_id;
  if not found then
    raise exception 'Published exercise not found.' using errcode = '22023';
  end if;
  return expected_answer = p_answer_index;
end;
$$;
revoke all on function public.verify_lesson_exercise(text, integer) from public, anon;
grant execute on function public.verify_lesson_exercise(text, integer) to authenticated;

create or replace function public.get_module_quiz(p_module_id text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  question_set jsonb;
begin
  if (select auth.uid()) is null or not (select public.has_active_course_access()) then
    raise exception 'Active course access required.' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.course_modules as module
    join public.journeys as journey on journey.id = module.journey_id
    where module.id = p_module_id and module.published and journey.published
  ) then
    raise exception 'Published module not found.' using errcode = '22023';
  end if;
  select questions into question_set from public.module_quiz_questions where module_id = p_module_id;
  if question_set is null then raise exception 'Quiz unavailable.' using errcode = '55000'; end if;
  return (select jsonb_agg(jsonb_build_object('question', question -> 'question', 'options', question -> 'options') order by ordinal)
    from jsonb_array_elements(question_set) with ordinality as quiz(question, ordinal));
end;
$$;
revoke all on function public.get_module_quiz(text) from public, anon;
grant execute on function public.get_module_quiz(text) to authenticated;

create or replace function public.submit_module_quiz(p_module_id text, p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  question_set jsonb;
  answer_count integer;
  question_rec record;
  submitted_answer integer;
  expected_answer integer;
  earned integer := 0;
  feedback jsonb := '[]'::jsonb;
  did_pass boolean;
begin
  if current_user_id is null or not (select public.has_active_course_access()) then
    raise exception 'Active course access required.' using errcode = '42501';
  end if;
  if jsonb_typeof(p_answers) <> 'array' then
    raise exception 'Answers must be an array.' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.course_modules as module
    join public.journeys as journey on journey.id = module.journey_id
    where module.id = p_module_id and module.published and journey.published
  ) then
    raise exception 'Published module not found.' using errcode = '22023';
  end if;
  select questions into question_set from public.module_quiz_questions where module_id = p_module_id;
  if question_set is null then raise exception 'Quiz unavailable.' using errcode = '55000'; end if;
  answer_count := jsonb_array_length(question_set);
  if jsonb_array_length(p_answers) <> answer_count then
    raise exception 'Answer count does not match quiz.' using errcode = '22023';
  end if;
  for question_rec in
    select question, ordinal from jsonb_array_elements(question_set) with ordinality as quiz(question, ordinal)
  loop
    if jsonb_typeof(p_answers -> (question_rec.ordinal - 1)) <> 'number' then
      raise exception 'Each answer must be a numeric option index.' using errcode = '22023';
    end if;
    submitted_answer := (p_answers ->> (question_rec.ordinal - 1))::integer;
    expected_answer := (question_rec.question ->> 'answer')::integer;
    if submitted_answer < 0 or submitted_answer >= jsonb_array_length(question_rec.question -> 'options') then
      raise exception 'Answer option index is out of range.' using errcode = '22023';
    end if;
    if submitted_answer = expected_answer then earned := earned + 1; end if;
    feedback := feedback || jsonb_build_array(jsonb_build_object(
      'selected', submitted_answer,
      'correct', submitted_answer = expected_answer,
      'correct_option', expected_answer,
      'explanation', question_rec.question -> 'explanation'
    ));
  end loop;
  did_pass := earned * 3 >= answer_count * 2;
  insert into public.quiz_attempts (user_id, module_id, score, total, passed)
    values (current_user_id, p_module_id, earned, answer_count, did_pass);
  return jsonb_build_object('score', earned, 'total', answer_count, 'passed', did_pass, 'feedback', feedback);
end;
$$;
revoke all on function public.submit_module_quiz(text, jsonb) from public, anon;
grant execute on function public.submit_module_quiz(text, jsonb) to authenticated;
