-- Persist learner activity, reviews, certificates, referrals, and payout requests.
alter table public.profiles
  add column if not exists learning_profile jsonb not null default '{}'::jsonb,
  add column if not exists security_checklist text[] not null default '{}'::text[];

grant update (learning_profile, security_checklist) on public.profiles to authenticated;
create policy "profiles: admin reads all" on public.profiles for select to authenticated
  using ((select public.has_role('admin')));

create table public.learning_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  profile_key text not null check (profile_key in ('explorador', 'analista', 'protetor')),
  answers jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.learning_profiles enable row level security;
grant select, insert, update on public.learning_profiles to authenticated;
create policy "learning profile: owner reads" on public.learning_profiles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "learning profile: owner writes" on public.learning_profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "learning profile: owner updates" on public.learning_profiles for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create table public.student_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null default '',
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(btrim(body)) between 20 and 400),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);
create or replace function public.set_student_review_metadata()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select coalesce(nullif(btrim(profile.display_name), ''), 'Aluno')
    into new.author_name
    from public.profiles as profile
    where profile.id = new.user_id;
  new.status := 'pending';
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.set_student_review_metadata() from public, anon, authenticated;
create trigger before_student_review_insert
  before insert on public.student_reviews
  for each row execute function public.set_student_review_metadata();
create index student_reviews_public_idx on public.student_reviews (status, created_at desc);
alter table public.student_reviews enable row level security;
grant select on public.student_reviews to anon, authenticated;
grant insert (user_id, rating, body) on public.student_reviews to authenticated;
grant update (rating, body, status, updated_at) on public.student_reviews to authenticated;
grant delete on public.student_reviews to authenticated;
create policy "reviews: public reads approved" on public.student_reviews for select to anon, authenticated
  using (status = 'approved');
create policy "reviews: owner reads own" on public.student_reviews for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "reviews: owner submits with active access" on public.student_reviews for insert to authenticated
  with check ((select auth.uid()) = user_id and (select public.has_active_course_access()));
create policy "reviews: owner edits pending" on public.student_reviews for update to authenticated
  using ((select auth.uid()) = user_id and status = 'pending')
  with check ((select auth.uid()) = user_id and status = 'pending');
create policy "reviews: admin moderates" on public.student_reviews for all to authenticated
  using ((select public.has_role('admin')))
  with check ((select public.has_role('admin')));
create policy "reviews: owner removes pending" on public.student_reviews for delete to authenticated
  using ((select auth.uid()) = user_id and status = 'pending');

create table public.course_certificates (
  user_id uuid primary key references auth.users (id) on delete cascade,
  certificate_code text not null unique,
  issued_at timestamptz not null default now()
);
alter table public.course_certificates enable row level security;
grant select on public.course_certificates to authenticated;
create policy "certificates: owner or admin reads" on public.course_certificates for select to authenticated
  using ((select auth.uid()) = user_id or (select public.has_role('admin')));

alter table public.commission_entries
  add column payout_request_id uuid references public.payout_requests (id) on delete set null;

create or replace function public.issue_course_certificate()
returns table (certificate_code text, issued_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  module_total bigint;
  lesson_total bigint;
  completed_total bigint;
  passed_modules bigint;
begin
  if current_user_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;
  if not (select public.has_active_course_access()) then
    raise exception 'Active course access required.' using errcode = '42501';
  end if;

  select count(*) into module_total from public.course_modules where published;
  select count(*) into lesson_total from public.lessons where published;
  if module_total = 0 or lesson_total = 0 then
    raise exception 'Course catalog is not published.' using errcode = '55000';
  end if;

  select count(*) into completed_total
  from public.lesson_progress as progress
  join public.lessons as lesson on lesson.id = progress.lesson_id and lesson.published
  where progress.user_id = current_user_id;
  select count(distinct attempt.module_id) into passed_modules
  from public.quiz_attempts as attempt
  join public.course_modules as module on module.id = attempt.module_id and module.published
  where attempt.user_id = current_user_id and attempt.passed;

  if completed_total < lesson_total or passed_modules < module_total then
    raise exception 'Complete all lessons and module reviews first.' using errcode = '55000';
  end if;

  insert into public.course_certificates (user_id, certificate_code)
  values (
    current_user_id,
    'CM-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))
  )
  on conflict (user_id) do nothing;

  return query
  select certificate.certificate_code, certificate.issued_at
  from public.course_certificates as certificate
  where certificate.user_id = current_user_id;
end;
$$;
revoke all on function public.issue_course_certificate() from public, anon;
grant execute on function public.issue_course_certificate() to authenticated;

create or replace function public.record_affiliate_click(p_code text, p_visitor_id uuid, p_source_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized_code text := upper(btrim(coalesce(p_code, '')));
  normalized_path text := left(coalesce(p_source_path, '/'), 256);
begin
  if normalized_code !~ '^[A-Z0-9_-]{3,32}$' or p_visitor_id is null or normalized_path not like '/%' then
    return;
  end if;
  if not exists (
    select 1 from public.affiliate_profiles
    where referral_code = normalized_code and active
  ) then
    return;
  end if;
  if exists (
    select 1 from public.affiliate_events
    where referral_code = normalized_code and event_type = 'click'
      and visitor_id = p_visitor_id::text and created_at > now() - interval '24 hours'
  ) then
    return;
  end if;
  insert into public.affiliate_events (referral_code, event_type, visitor_id, source_path)
  values (normalized_code, 'click', p_visitor_id::text, normalized_path);
end;
$$;
revoke all on function public.record_affiliate_click(text, uuid, text) from public;
grant execute on function public.record_affiliate_click(text, uuid, text) to anon, authenticated;

create policy "orders: affiliate reads attributed orders" on public.orders for select to authenticated
  using (exists (
    select 1 from public.affiliate_profiles as affiliate
    where affiliate.user_id = (select auth.uid())
      and affiliate.active
      and affiliate.referral_code = orders.referral_code
  ));

create or replace function public.request_affiliate_payout(p_currency text)
returns table (payout_id uuid, requested_amount numeric)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  available_amount numeric(14, 4);
  new_payout_id uuid;
begin
  if current_user_id is null or p_currency not in ('BRL', 'SOL') then
    raise exception 'Valid affiliate session and currency required.' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.affiliate_profiles
    where user_id = current_user_id and active
  ) then
    raise exception 'Active affiliate account required.' using errcode = '42501';
  end if;

  perform 1 from public.commission_entries
  where affiliate_user_id = current_user_id
    and currency = p_currency and status = 'available'
  for update;

  select coalesce(sum(amount), 0) into available_amount
  from public.commission_entries
  where affiliate_user_id = current_user_id
    and currency = p_currency and status = 'available';
  if available_amount <= 0 then
    raise exception 'No available commission for this currency.' using errcode = '55000';
  end if;

  update public.commission_entries set status = 'requested'
  where affiliate_user_id = current_user_id
    and currency = p_currency and status = 'available';
  insert into public.payout_requests (affiliate_user_id, amount, currency, status)
  values (current_user_id, available_amount, p_currency, 'requested')
  returning id into new_payout_id;
  update public.commission_entries set payout_request_id = new_payout_id
  where affiliate_user_id = current_user_id
    and currency = p_currency and status = 'requested' and payout_request_id is null;

  return query select new_payout_id, available_amount;
end;
$$;
revoke all on function public.request_affiliate_payout(text) from public, anon;
grant execute on function public.request_affiliate_payout(text) to authenticated;

create or replace function public.process_affiliate_payout(p_payout_id uuid, p_result text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  payout public.payout_requests%rowtype;
begin
  if not (select public.has_role('admin')) then
    raise exception 'Admin role required.' using errcode = '42501';
  end if;
  if p_result not in ('paid', 'rejected') then
    raise exception 'Result must be paid or rejected.' using errcode = '22023';
  end if;

  select * into payout from public.payout_requests
  where id = p_payout_id for update;
  if not found or payout.status <> 'requested' then
    raise exception 'Payout request is unavailable.' using errcode = '55000';
  end if;

  update public.payout_requests set status = p_result where id = p_payout_id;
  update public.commission_entries set status = case when p_result = 'paid' then 'paid' else 'available' end
  where payout_request_id = p_payout_id and status = 'requested';
  if p_result = 'rejected' then
    update public.commission_entries set payout_request_id = null
    where payout_request_id = p_payout_id and status = 'available';
  end if;
end;
$$;
revoke all on function public.process_affiliate_payout(uuid, text) from public, anon;
grant execute on function public.process_affiliate_payout(uuid, text) to authenticated;
