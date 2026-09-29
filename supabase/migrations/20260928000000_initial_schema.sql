-- Starter schema for the Cripto Mentoria Supabase integration.
-- Apply only after creating a Supabase project and reviewing the access model.

create type public.app_role as enum ('student', 'admin', 'affiliate');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table public.app_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.plans (
  id text primary key check (id in ('month', 'quarter', 'lifetime')),
  name text not null,
  duration_days integer,
  price_brl integer not null check (price_brl > 0),
  price_sol numeric(12, 4) not null check (price_sol > 0),
  active boolean not null default true
);

insert into public.plans (id, name, duration_days, price_brl, price_sol) values
  ('month', '1 mês', 30, 29900, 0.4),
  ('quarter', '3 meses', 90, 54900, 0.7),
  ('lifetime', 'Vitalício', null, 69900, 0.9);

create table public.course_modules (
  id text primary key,
  ordinal smallint not null unique,
  title text not null,
  subtitle text not null default '',
  published boolean not null default false
);

create table public.lessons (
  id text primary key,
  module_id text not null references public.course_modules (id) on delete cascade,
  ordinal smallint not null,
  title text not null,
  duration_minutes smallint not null check (duration_minutes > 0),
  published boolean not null default false,
  unique (module_id, ordinal)
);

create table public.lesson_content (
  lesson_id text primary key references public.lessons (id) on delete cascade,
  content jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id text not null references public.plans (id),
  status text not null check (status in ('pending', 'active', 'expired', 'refunded', 'cancelled')),
  starts_at timestamptz,
  expires_at timestamptz,
  provider text,
  provider_reference text unique,
  created_at timestamptz not null default now()
);

create table public.lesson_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null references public.lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  module_id text not null references public.course_modules (id) on delete cascade,
  score smallint not null check (score >= 0),
  total smallint not null check (total > 0 and score <= total),
  passed boolean not null,
  created_at timestamptz not null default now()
);

create table public.affiliate_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  referral_code text not null unique,
  commission_bps smallint not null default 2000 check (commission_bps between 0 and 10000),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete restrict,
  plan_id text not null references public.plans (id),
  currency text not null check (currency in ('BRL', 'SOL')),
  amount numeric(14, 4) not null check (amount > 0),
  status text not null check (status in ('pending', 'confirmed', 'refunded', 'failed')),
  referral_code text references public.affiliate_profiles (referral_code),
  provider_reference text unique,
  created_at timestamptz not null default now()
);

create table public.affiliate_events (
  id uuid primary key default gen_random_uuid(),
  referral_code text not null references public.affiliate_profiles (referral_code),
  event_type text not null check (event_type in ('click', 'signup', 'sale')),
  visitor_id text,
  user_id uuid references auth.users (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  source_path text,
  created_at timestamptz not null default now()
);

create table public.commission_entries (
  id uuid primary key default gen_random_uuid(),
  affiliate_user_id uuid not null references public.affiliate_profiles (user_id) on delete restrict,
  order_id uuid not null references public.orders (id) on delete restrict,
  amount numeric(14, 4) not null check (amount >= 0),
  currency text not null check (currency in ('BRL', 'SOL')),
  status text not null check (status in ('pending', 'available', 'requested', 'paid', 'reversed')),
  created_at timestamptz not null default now(),
  unique (affiliate_user_id, order_id)
);

create table public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  affiliate_user_id uuid not null references public.affiliate_profiles (user_id) on delete restrict,
  amount numeric(14, 4) not null check (amount > 0),
  currency text not null check (currency in ('BRL', 'SOL')),
  status text not null check (status in ('requested', 'approved', 'paid', 'rejected')),
  created_at timestamptz not null default now()
);

create function public.has_role(required_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.app_roles
    where user_id = (select auth.uid()) and role = required_role
  );
$$;

create function public.has_active_course_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = (select auth.uid())
      and status = 'active'
      and (expires_at is null or expires_at > now())
  );
$$;

create function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

revoke all on function public.has_role(public.app_role) from public, anon;
revoke all on function public.has_active_course_access() from public, anon;
grant execute on function public.has_role(public.app_role) to authenticated;
grant execute on function public.has_active_course_access() to authenticated;

alter table public.profiles enable row level security;
alter table public.app_roles enable row level security;
alter table public.plans enable row level security;
alter table public.course_modules enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_content enable row level security;
alter table public.subscriptions enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.affiliate_profiles enable row level security;
alter table public.orders enable row level security;
alter table public.affiliate_events enable row level security;
alter table public.commission_entries enable row level security;
alter table public.payout_requests enable row level security;

revoke all on table public.profiles, public.app_roles, public.plans, public.course_modules, public.lessons,
  public.lesson_content, public.subscriptions, public.lesson_progress, public.quiz_attempts,
  public.affiliate_profiles, public.orders, public.affiliate_events, public.commission_entries,
  public.payout_requests from anon, authenticated;

grant select on public.plans, public.course_modules, public.lessons to anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant select on public.app_roles, public.subscriptions, public.affiliate_profiles, public.orders,
  public.affiliate_events, public.commission_entries, public.payout_requests to authenticated;
grant select on public.lesson_content to authenticated;
grant select, insert, update on public.lesson_progress to authenticated;
grant select on public.quiz_attempts to authenticated;
grant insert, update, delete on public.plans, public.course_modules, public.lessons, public.lesson_content to authenticated;

create policy "profiles: user reads own" on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "profiles: user updates own display name" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "roles: user reads own roles" on public.app_roles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "plans: list active plans" on public.plans for select to anon, authenticated
  using (active or (select public.has_role('admin')));
create policy "plans: admin insert" on public.plans for insert to authenticated
  with check ((select public.has_role('admin')));
create policy "plans: admin update" on public.plans for update to authenticated
  using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
create policy "plans: admin delete" on public.plans for delete to authenticated
  using ((select public.has_role('admin')));

create policy "modules: published list or admin" on public.course_modules for select to anon, authenticated
  using (published or (select public.has_role('admin')));
create policy "modules: admin insert" on public.course_modules for insert to authenticated
  with check ((select public.has_role('admin')));
create policy "modules: admin update" on public.course_modules for update to authenticated
  using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
create policy "modules: admin delete" on public.course_modules for delete to authenticated
  using ((select public.has_role('admin')));

create policy "lessons: published metadata or admin" on public.lessons for select to anon, authenticated
  using (published or (select public.has_role('admin')));
create policy "lessons: admin insert" on public.lessons for insert to authenticated
  with check ((select public.has_role('admin')));
create policy "lessons: admin update" on public.lessons for update to authenticated
  using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
create policy "lessons: admin delete" on public.lessons for delete to authenticated
  using ((select public.has_role('admin')));

create policy "lesson content: active students or admin" on public.lesson_content for select to authenticated
  using ((select public.has_active_course_access()) or (select public.has_role('admin')));
create policy "lesson content: admin insert" on public.lesson_content for insert to authenticated
  with check ((select public.has_role('admin')));
create policy "lesson content: admin update" on public.lesson_content for update to authenticated
  using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
create policy "lesson content: admin delete" on public.lesson_content for delete to authenticated
  using ((select public.has_role('admin')));

create policy "subscriptions: user reads own" on public.subscriptions for select to authenticated
  using ((select auth.uid()) = user_id or (select public.has_role('admin')));
create policy "progress: active student reads own" on public.lesson_progress for select to authenticated
  using ((select auth.uid()) = user_id and ((select public.has_active_course_access()) or (select public.has_role('admin'))));
create policy "progress: active student creates own" on public.lesson_progress for insert to authenticated
  with check ((select auth.uid()) = user_id and ((select public.has_active_course_access()) or (select public.has_role('admin'))));
create policy "progress: active student updates own" on public.lesson_progress for update to authenticated
  using ((select auth.uid()) = user_id and ((select public.has_active_course_access()) or (select public.has_role('admin'))))
  with check ((select auth.uid()) = user_id and ((select public.has_active_course_access()) or (select public.has_role('admin'))));
create policy "quiz attempts: user reads own" on public.quiz_attempts for select to authenticated
  using ((select auth.uid()) = user_id or (select public.has_role('admin')));

create policy "affiliate profile: user reads own" on public.affiliate_profiles for select to authenticated
  using ((select auth.uid()) = user_id or (select public.has_role('admin')));
create policy "orders: user or admin reads" on public.orders for select to authenticated
  using ((select auth.uid()) = user_id or (select public.has_role('admin')));
create policy "affiliate events: affiliate sees own code" on public.affiliate_events for select to authenticated
  using (exists (
    select 1 from public.affiliate_profiles as affiliate
    where affiliate.user_id = (select auth.uid()) and affiliate.referral_code = affiliate_events.referral_code
  ) or (select public.has_role('admin')));
create policy "commissions: affiliate sees own" on public.commission_entries for select to authenticated
  using ((select auth.uid()) = affiliate_user_id or (select public.has_role('admin')));
create policy "payouts: affiliate sees own" on public.payout_requests for select to authenticated
  using ((select auth.uid()) = affiliate_user_id or (select public.has_role('admin')));

-- Orders, entitlements, affiliate events, commissions and payout requests are intentionally
-- written by trusted Edge Functions/webhooks only. Never accept payment status, quiz score,
-- affiliate attribution or an admin role as client-authoritative input.
