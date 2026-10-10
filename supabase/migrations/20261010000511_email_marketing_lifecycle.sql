create table public.email_marketing_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  kind text not null check (kind in ('welcome', 'first_lesson', 'reengagement')),
  email_segment text not null check (email_segment in ('active', 'inactive')),
  email_locale text not null default 'pt-BR' check (email_locale in ('pt-BR', 'en', 'es')),
  campaign_key text not null,
  idempotency_key text not null unique,
  payload jsonb,
  status text not null default 'pending' check (status in ('pending', 'processing', 'sent', 'failed', 'suppressed')),
  attempts smallint not null default 0 check (attempts between 0 and 5),
  available_at timestamptz not null default now(),
  first_attempt_at timestamptz,
  claimed_at timestamptz,
  resend_email_id text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, kind, campaign_key)
);

create index email_marketing_queue_ready_idx
  on public.email_marketing_queue (available_at, created_at)
  where status in ('pending', 'processing');

create table public.email_marketing_deliveries (
  queue_id uuid primary key references public.email_marketing_queue (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  email text not null,
  kind text not null,
  idempotency_key text not null unique,
  resend_email_id text,
  sent_at timestamptz not null default now()
);

create table public.email_marketing_events (
  event_id text primary key,
  event_type text not null,
  resend_email_id text,
  email text,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now()
);

create table public.email_marketing_suppressions (
  email text primary key,
  reason text not null check (reason in ('unsubscribe', 'bounce', 'complaint')),
  source text not null,
  created_at timestamptz not null default now()
);

create table public.email_marketing_contacts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  resend_subscribed boolean not null default false,
  email_segment text check (email_segment in ('active', 'inactive')),
  updated_at timestamptz not null default now()
);

create table public.email_marketing_user_locks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  queue_id uuid not null references public.email_marketing_queue (id) on delete cascade,
  claimed_at timestamptz default now(),
  last_attempt_at timestamptz not null default now(),
  last_sent_at timestamptz
);

alter table public.email_marketing_queue enable row level security;
alter table public.email_marketing_deliveries enable row level security;
alter table public.email_marketing_events enable row level security;
alter table public.email_marketing_suppressions enable row level security;
alter table public.email_marketing_contacts enable row level security;
alter table public.email_marketing_user_locks enable row level security;

revoke all on table public.email_marketing_queue, public.email_marketing_deliveries,
  public.email_marketing_events, public.email_marketing_suppressions, public.email_marketing_contacts,
  public.email_marketing_user_locks from public, anon, authenticated;
grant select, insert, update, delete on public.email_marketing_queue to service_role;
grant select, insert, update, delete on public.email_marketing_deliveries to service_role;
grant select, insert, update, delete on public.email_marketing_events to service_role;
grant select, insert, update, delete on public.email_marketing_suppressions to service_role;
grant select, insert, update, delete on public.email_marketing_contacts to service_role;
grant select, insert, update, delete on public.email_marketing_user_locks to service_role;

-- Make suppression precedence atomic: unsubscribe may be cleared by later
-- consent, while a later unsubscribe can never downgrade a bounce/complaint.
create function public.record_email_marketing_suppression(
  p_email text, p_reason text, p_source text, p_created_at timestamptz default now()
)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.email_marketing_suppressions (email, reason, source, created_at)
  values (lower(p_email), p_reason, p_source, p_created_at)
  on conflict (email) do update
    set reason = excluded.reason,
        source = excluded.source,
        created_at = greatest(public.email_marketing_suppressions.created_at, excluded.created_at)
    where public.email_marketing_suppressions.reason not in ('bounce', 'complaint')
       or excluded.reason in ('bounce', 'complaint');
$$;

revoke all on function public.record_email_marketing_suppression(text, text, text, timestamptz) from public, anon, authenticated;
grant execute on function public.record_email_marketing_suppression(text, text, text, timestamptz) to service_role;

create or replace function public.claim_email_marketing_queue(p_limit integer default 25)
returns setof public.email_marketing_queue
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.email_marketing_queue as queue
  set status = 'sent',
      resend_email_id = delivery.resend_email_id,
      claimed_at = null,
      last_error = null,
      updated_at = now()
  from public.email_marketing_deliveries as delivery
  where delivery.queue_id = queue.id and queue.status <> 'sent';

  update public.email_marketing_queue
  set status = 'failed',
      claimed_at = null,
      last_error = coalesce(last_error, 'Retry window exceeded Resend idempotency retention.'),
      updated_at = now()
  where status in ('pending', 'processing')
    and first_attempt_at < now() - interval '20 hours';

  update public.email_marketing_queue
  set status = case when attempts >= 5 then 'failed' else 'pending' end,
      claimed_at = null,
      available_at = now(),
      updated_at = now()
  where status = 'processing' and claimed_at < now() - interval '15 minutes';

  return query
  with preferred as (
    select distinct on (queue.user_id) queue.id, queue.available_at, queue.created_at
    from public.email_marketing_queue as queue
    where queue.status = 'pending'
      and queue.attempts < 5
      and queue.available_at <= now()
      and (queue.first_attempt_at is null or queue.first_attempt_at >= now() - interval '20 hours')
      and not exists (
        select 1 from public.email_marketing_deliveries as delivery
        where delivery.queue_id = queue.id
      )
      and not exists (
        select 1 from public.email_marketing_deliveries as delivery
        where delivery.user_id = queue.user_id
          and delivery.sent_at >= now() - interval '24 hours'
      )
      and not exists (
        select 1 from public.email_marketing_user_locks as user_lock
        where user_lock.user_id = queue.user_id
          and user_lock.queue_id <> queue.id
          and (user_lock.claimed_at > now() - interval '15 minutes'
            or user_lock.last_attempt_at > now() - interval '24 hours'
            or user_lock.last_sent_at > now() - interval '24 hours')
      )
    order by queue.user_id,
      case queue.kind when 'welcome' then 1 when 'first_lesson' then 2 else 3 end,
      queue.available_at, queue.created_at
  ), picked as (
    select queue.id
    from public.email_marketing_queue as queue
    join preferred on preferred.id = queue.id
    order by preferred.available_at, preferred.created_at
    for update of queue skip locked
    limit greatest(1, least(coalesce(p_limit, 25), 100))
  ), locked_users as (
    insert into public.email_marketing_user_locks as user_lock (user_id, queue_id, claimed_at, last_attempt_at)
    select queue.user_id, queue.id, now(), now()
    from public.email_marketing_queue as queue
    join picked on picked.id = queue.id
    on conflict (user_id) do update
      set queue_id = excluded.queue_id, claimed_at = now(), last_attempt_at = now()
      where user_lock.queue_id = excluded.queue_id
        or ((user_lock.claimed_at is null or user_lock.claimed_at <= now() - interval '15 minutes')
          and (user_lock.last_attempt_at <= now() - interval '24 hours'
            and (user_lock.last_sent_at is null
              or user_lock.last_sent_at <= now() - interval '24 hours')))
    returning user_id, queue_id
  )
  update public.email_marketing_queue as queue
  set status = 'processing',
      attempts = queue.attempts + 1,
      claimed_at = now(),
      first_attempt_at = coalesce(queue.first_attempt_at, now()),
      updated_at = now()
  from picked join locked_users on locked_users.queue_id = picked.id
  where queue.id = picked.id
  returning queue.*;
end;
$$;

revoke all on function public.claim_email_marketing_queue(integer) from public, anon, authenticated;
grant execute on function public.claim_email_marketing_queue(integer) to service_role;
