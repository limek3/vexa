-- 20260502_0016_clickbook_telegram_auth_hardening.sql
-- Final hardening for ClickBook Telegram auth/session and current dashboard data.
-- Safe to run after RUN_ALL_CLICKBOOK_SQL.sql. It does not delete application data.

begin;

create extension if not exists pgcrypto;

create or replace function public.sloty_now_utc()
returns timestamptz
language sql
stable
as $$
  select timezone('utc', now());
$$;

create or replace function public.sloty_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = public.sloty_now_utc();
  return new;
end;
$$;

create or replace function public.touch_sloty_generic_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = public.sloty_now_utc();
  return new;
end;
$$;

create or replace function public.sloty_normalize_phone(value text)
returns text
language sql
immutable
as $$
  select nullif(regexp_replace(coalesce(value, ''), '[^0-9]+', '', 'g'), '');
$$;

create table if not exists public.sloty_workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  slug text not null unique,
  profile jsonb not null default '{}'::jsonb,
  data jsonb not null default '{}'::jsonb,
  appearance jsonb,
  created_at timestamptz not null default public.sloty_now_utc(),
  updated_at timestamptz not null default public.sloty_now_utc()
);

alter table public.sloty_workspaces add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.sloty_workspaces add column if not exists profile jsonb not null default '{}'::jsonb;
alter table public.sloty_workspaces add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.sloty_workspaces add column if not exists appearance jsonb;
alter table public.sloty_workspaces add column if not exists created_at timestamptz not null default public.sloty_now_utc();
alter table public.sloty_workspaces add column if not exists updated_at timestamptz not null default public.sloty_now_utc();

create unique index if not exists sloty_workspaces_owner_id_key on public.sloty_workspaces (owner_id) where owner_id is not null;
create index if not exists sloty_workspaces_slug_idx on public.sloty_workspaces (slug);
create index if not exists sloty_workspaces_owner_idx on public.sloty_workspaces (owner_id);

drop trigger if exists trg_touch_sloty_workspaces_updated_at on public.sloty_workspaces;
create trigger trg_touch_sloty_workspaces_updated_at
before update on public.sloty_workspaces
for each row execute function public.sloty_touch_updated_at();

create table if not exists public.sloty_workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.sloty_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'manager', 'assistant')),
  invited_by uuid references auth.users(id) on delete set null,
  invited_email text,
  display_name text,
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default public.sloty_now_utc(),
  updated_at timestamptz not null default public.sloty_now_utc(),
  unique (workspace_id, user_id)
);

create table if not exists public.sloty_bookings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.sloty_workspaces(id) on delete cascade,
  master_slug text not null,
  client_name text not null,
  client_phone text not null,
  service text not null,
  booking_date date not null,
  booking_time text not null,
  comment text,
  status text not null default 'new',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default public.sloty_now_utc(),
  updated_at timestamptz not null default public.sloty_now_utc()
);

alter table public.sloty_bookings add column if not exists client_id uuid;
alter table public.sloty_bookings add column if not exists start_at timestamptz;
alter table public.sloty_bookings add column if not exists end_at timestamptz;
alter table public.sloty_bookings add column if not exists duration_minutes integer;
alter table public.sloty_bookings add column if not exists price_amount numeric(12,2);
alter table public.sloty_bookings add column if not exists currency text not null default 'RUB';
alter table public.sloty_bookings add column if not exists source text;
alter table public.sloty_bookings add column if not exists channel text;
alter table public.sloty_bookings add column if not exists cancel_reason text;
alter table public.sloty_bookings add column if not exists confirmed_at timestamptz;
alter table public.sloty_bookings add column if not exists completed_at timestamptz;
alter table public.sloty_bookings add column if not exists cancelled_at timestamptz;
alter table public.sloty_bookings add column if not exists no_show_at timestamptz;
alter table public.sloty_bookings add column if not exists reminder_sent_at timestamptz;
alter table public.sloty_bookings add column if not exists status_check_sent_at timestamptz;
alter table public.sloty_bookings add column if not exists metadata jsonb not null default '{}'::jsonb;

update public.sloty_bookings
set status = case
  when status in ('new', 'confirmed', 'completed', 'no_show', 'cancelled') then status
  when status in ('done', 'visited', 'finished', 'paid') then 'completed'
  when status in ('missed', 'noshow', 'no-show') then 'no_show'
  when status in ('canceled', 'cancelled_by_client') then 'cancelled'
  else 'new'
end
where status is null
   or status not in ('new', 'confirmed', 'completed', 'no_show', 'cancelled');

alter table public.sloty_bookings drop constraint if exists sloty_bookings_status_check;
alter table public.sloty_bookings
  add constraint sloty_bookings_status_check
  check (status in ('new', 'confirmed', 'completed', 'no_show', 'cancelled'));

create index if not exists sloty_bookings_workspace_id_idx on public.sloty_bookings (workspace_id, created_at desc);
create index if not exists sloty_bookings_master_slug_idx on public.sloty_bookings (master_slug);
create index if not exists sloty_bookings_date_idx on public.sloty_bookings (workspace_id, booking_date, booking_time);
create index if not exists sloty_bookings_status_idx on public.sloty_bookings (workspace_id, status);
create index if not exists sloty_bookings_workspace_date_time_idx on public.sloty_bookings (workspace_id, booking_date, booking_time);
create index if not exists sloty_bookings_status_check_idx on public.sloty_bookings (workspace_id, status, booking_date, booking_time);
create unique index if not exists sloty_bookings_active_slot_unique
  on public.sloty_bookings (workspace_id, booking_date, booking_time)
  where status not in ('cancelled', 'no_show');

drop trigger if exists trg_touch_sloty_bookings_updated_at on public.sloty_bookings;
create trigger trg_touch_sloty_bookings_updated_at
before update on public.sloty_bookings
for each row execute function public.touch_sloty_generic_updated_at();

create table if not exists public.sloty_chat_threads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.sloty_workspaces(id) on delete cascade,
  client_name text not null,
  client_phone text not null,
  channel text not null default 'Telegram',
  segment text default 'new',
  source text,
  next_visit date,
  is_priority boolean not null default false,
  bot_connected boolean not null default true,
  last_message_preview text,
  last_message_at timestamptz not null default public.sloty_now_utc(),
  unread_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default public.sloty_now_utc(),
  updated_at timestamptz not null default public.sloty_now_utc()
);

alter table public.sloty_chat_threads add column if not exists segment text default 'new';
alter table public.sloty_chat_threads add column if not exists source text;
alter table public.sloty_chat_threads add column if not exists next_visit date;
alter table public.sloty_chat_threads add column if not exists is_priority boolean not null default false;
alter table public.sloty_chat_threads add column if not exists bot_connected boolean not null default true;
alter table public.sloty_chat_threads add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.sloty_chat_threads drop constraint if exists sloty_chat_threads_channel_check;
alter table public.sloty_chat_threads
  add constraint sloty_chat_threads_channel_check
  check (channel in ('Telegram', 'MAX', 'VK', 'Instagram', 'telegram', 'vk', 'instagram', 'max'));

create index if not exists sloty_chat_threads_workspace_idx on public.sloty_chat_threads (workspace_id, last_message_at desc);
create index if not exists sloty_chat_threads_workspace_phone_idx on public.sloty_chat_threads (workspace_id, client_phone);

drop trigger if exists trg_touch_sloty_chat_threads_updated_at on public.sloty_chat_threads;
create trigger trg_touch_sloty_chat_threads_updated_at
before update on public.sloty_chat_threads
for each row execute function public.touch_sloty_generic_updated_at();

create table if not exists public.sloty_chat_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.sloty_workspaces(id) on delete cascade,
  thread_id uuid not null references public.sloty_chat_threads(id) on delete cascade,
  author text not null,
  body text not null,
  delivery_state text,
  via_bot boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default public.sloty_now_utc()
);

alter table public.sloty_chat_messages drop constraint if exists sloty_chat_messages_author_check;
alter table public.sloty_chat_messages
  add constraint sloty_chat_messages_author_check
  check (author in ('client', 'master', 'system'));

alter table public.sloty_chat_messages drop constraint if exists sloty_chat_messages_delivery_state_check;
alter table public.sloty_chat_messages
  add constraint sloty_chat_messages_delivery_state_check
  check (delivery_state is null or delivery_state in ('queued', 'sent', 'delivered', 'read'));

create index if not exists sloty_chat_messages_thread_idx on public.sloty_chat_messages (thread_id, created_at asc);
create index if not exists sloty_chat_messages_workspace_thread_idx on public.sloty_chat_messages (workspace_id, thread_id, created_at asc);

create table if not exists public.sloty_services (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.sloty_workspaces(id) on delete cascade,
  name text not null,
  duration integer not null default 60,
  price numeric(12,2) not null default 0,
  status text not null default 'active',
  visible boolean not null default true,
  category text,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default public.sloty_now_utc(),
  updated_at timestamptz not null default public.sloty_now_utc(),
  unique (workspace_id, name)
);

alter table public.sloty_services drop constraint if exists sloty_services_status_check;
alter table public.sloty_services
  add constraint sloty_services_status_check
  check (status in ('active', 'seasonal', 'draft'));

create index if not exists sloty_services_workspace_idx on public.sloty_services (workspace_id, sort_order, name);

drop trigger if exists trg_touch_sloty_services_updated_at on public.sloty_services;
create trigger trg_touch_sloty_services_updated_at
before update on public.sloty_services
for each row execute function public.touch_sloty_generic_updated_at();

create table if not exists public.sloty_availability_days (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.sloty_workspaces(id) on delete cascade,
  weekday_index integer,
  date date,
  label text,
  status text not null default 'workday',
  slots jsonb not null default '[]'::jsonb,
  breaks jsonb not null default '[]'::jsonb,
  custom boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default public.sloty_now_utc(),
  updated_at timestamptz not null default public.sloty_now_utc()
);

alter table public.sloty_availability_days drop constraint if exists sloty_availability_days_weekday_index_check;
alter table public.sloty_availability_days
  add constraint sloty_availability_days_weekday_index_check
  check (weekday_index is null or weekday_index between 0 and 6);

alter table public.sloty_availability_days drop constraint if exists sloty_availability_days_status_check;
alter table public.sloty_availability_days
  add constraint sloty_availability_days_status_check
  check (status in ('workday', 'short', 'day-off'));

create unique index if not exists sloty_availability_days_weekday_unique
  on public.sloty_availability_days (workspace_id, weekday_index)
  where weekday_index is not null and date is null;
create unique index if not exists sloty_availability_days_date_unique
  on public.sloty_availability_days (workspace_id, date)
  where date is not null;
create index if not exists sloty_availability_days_workspace_idx on public.sloty_availability_days (workspace_id, date, weekday_index);

drop trigger if exists trg_touch_sloty_availability_days_updated_at on public.sloty_availability_days;
create trigger trg_touch_sloty_availability_days_updated_at
before update on public.sloty_availability_days
for each row execute function public.touch_sloty_generic_updated_at();

create table if not exists public.sloty_message_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.sloty_workspaces(id) on delete cascade,
  title text not null,
  channel text not null default 'Telegram',
  content text not null default '',
  variables jsonb not null default '[]'::jsonb,
  conversion text,
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default public.sloty_now_utc(),
  updated_at timestamptz not null default public.sloty_now_utc()
);

create index if not exists sloty_message_templates_workspace_idx on public.sloty_message_templates (workspace_id, created_at);

drop trigger if exists trg_touch_sloty_message_templates_updated_at on public.sloty_message_templates;
create trigger trg_touch_sloty_message_templates_updated_at
before update on public.sloty_message_templates
for each row execute function public.touch_sloty_generic_updated_at();

create table if not exists public.sloty_telegram_accounts (
  telegram_id bigint primary key,
  user_id uuid references auth.users(id) on delete cascade,
  username text,
  first_name text,
  last_name text,
  photo_url text,
  auth_date timestamptz,
  chat_id bigint,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default public.sloty_now_utc(),
  updated_at timestamptz not null default public.sloty_now_utc()
);

alter table public.sloty_telegram_accounts add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.sloty_telegram_accounts add column if not exists username text;
alter table public.sloty_telegram_accounts add column if not exists first_name text;
alter table public.sloty_telegram_accounts add column if not exists last_name text;
alter table public.sloty_telegram_accounts add column if not exists photo_url text;
alter table public.sloty_telegram_accounts add column if not exists auth_date timestamptz;
alter table public.sloty_telegram_accounts add column if not exists chat_id bigint;
alter table public.sloty_telegram_accounts add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.sloty_telegram_accounts add column if not exists created_at timestamptz not null default public.sloty_now_utc();
alter table public.sloty_telegram_accounts add column if not exists updated_at timestamptz not null default public.sloty_now_utc();

create unique index if not exists sloty_telegram_accounts_user_idx on public.sloty_telegram_accounts (user_id) where user_id is not null;
create index if not exists sloty_telegram_accounts_chat_idx on public.sloty_telegram_accounts (chat_id) where chat_id is not null;

drop trigger if exists trg_touch_sloty_telegram_accounts_updated_at on public.sloty_telegram_accounts;
create trigger trg_touch_sloty_telegram_accounts_updated_at
before update on public.sloty_telegram_accounts
for each row execute function public.sloty_touch_updated_at();

create table if not exists public.sloty_telegram_login_requests (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  status text not null default 'pending',
  telegram_id bigint,
  username text,
  first_name text,
  last_name text,
  photo_url text,
  chat_id bigint,
  message_id bigint,
  confirmed_at timestamptz,
  consumed_at timestamptz,
  expires_at timestamptz not null default (public.sloty_now_utc() + interval '10 minutes'),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default public.sloty_now_utc(),
  updated_at timestamptz not null default public.sloty_now_utc()
);

alter table public.sloty_telegram_login_requests add column if not exists telegram_id bigint;
alter table public.sloty_telegram_login_requests add column if not exists username text;
alter table public.sloty_telegram_login_requests add column if not exists first_name text;
alter table public.sloty_telegram_login_requests add column if not exists last_name text;
alter table public.sloty_telegram_login_requests add column if not exists photo_url text;
alter table public.sloty_telegram_login_requests add column if not exists chat_id bigint;
alter table public.sloty_telegram_login_requests add column if not exists message_id bigint;
alter table public.sloty_telegram_login_requests add column if not exists confirmed_at timestamptz;
alter table public.sloty_telegram_login_requests add column if not exists consumed_at timestamptz;
alter table public.sloty_telegram_login_requests add column if not exists expires_at timestamptz not null default (public.sloty_now_utc() + interval '10 minutes');
alter table public.sloty_telegram_login_requests add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.sloty_telegram_login_requests add column if not exists updated_at timestamptz not null default public.sloty_now_utc();

alter table public.sloty_telegram_login_requests drop constraint if exists sloty_telegram_login_requests_status_check;
alter table public.sloty_telegram_login_requests
  add constraint sloty_telegram_login_requests_status_check
  check (status in ('pending', 'confirmed', 'consumed', 'expired'));

create index if not exists sloty_telegram_login_requests_token_idx on public.sloty_telegram_login_requests (token);
create index if not exists sloty_telegram_login_requests_status_idx on public.sloty_telegram_login_requests (status, expires_at);

drop trigger if exists trg_touch_sloty_telegram_login_requests_updated_at on public.sloty_telegram_login_requests;
create trigger trg_touch_sloty_telegram_login_requests_updated_at
before update on public.sloty_telegram_login_requests
for each row execute function public.sloty_touch_updated_at();

create table if not exists public.sloty_booking_telegram_links (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  workspace_id uuid not null references public.sloty_workspaces(id) on delete cascade,
  booking_id uuid not null,
  master_slug text not null,
  booking_snapshot jsonb,
  status text not null default 'pending',
  telegram_id bigint,
  chat_id bigint,
  username text,
  first_name text,
  last_name text,
  confirmed_at timestamptz,
  reminder_24h_sent_at timestamptz,
  reminder_2h_sent_at timestamptz,
  expires_at timestamptz not null default (public.sloty_now_utc() + interval '24 hours'),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default public.sloty_now_utc(),
  updated_at timestamptz not null default public.sloty_now_utc()
);

alter table public.sloty_booking_telegram_links add column if not exists username text;
alter table public.sloty_booking_telegram_links add column if not exists first_name text;
alter table public.sloty_booking_telegram_links add column if not exists last_name text;
alter table public.sloty_booking_telegram_links add column if not exists confirmed_at timestamptz;
alter table public.sloty_booking_telegram_links add column if not exists reminder_24h_sent_at timestamptz;
alter table public.sloty_booking_telegram_links add column if not exists reminder_2h_sent_at timestamptz;
alter table public.sloty_booking_telegram_links add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.sloty_booking_telegram_links add column if not exists updated_at timestamptz not null default public.sloty_now_utc();

alter table public.sloty_booking_telegram_links drop constraint if exists sloty_booking_telegram_links_status_check;
alter table public.sloty_booking_telegram_links
  add constraint sloty_booking_telegram_links_status_check
  check (status in ('pending', 'confirmed', 'expired'));

create index if not exists sloty_booking_telegram_links_token_idx on public.sloty_booking_telegram_links (token);
create index if not exists sloty_booking_telegram_links_booking_idx on public.sloty_booking_telegram_links (booking_id);
create index if not exists sloty_booking_telegram_links_workspace_booking_idx on public.sloty_booking_telegram_links (workspace_id, booking_id);
create index if not exists sloty_booking_telegram_links_workspace_chat_idx on public.sloty_booking_telegram_links (workspace_id, chat_id) where chat_id is not null;
create index if not exists sloty_booking_telegram_links_reminder_idx
  on public.sloty_booking_telegram_links (status, chat_id, reminder_24h_sent_at, reminder_2h_sent_at)
  where status = 'confirmed' and chat_id is not null;

drop trigger if exists trg_touch_sloty_booking_telegram_links_updated_at on public.sloty_booking_telegram_links;
create trigger trg_touch_sloty_booking_telegram_links_updated_at
before update on public.sloty_booking_telegram_links
for each row execute function public.sloty_touch_updated_at();

create table if not exists public.sloty_support_reports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.sloty_workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  type text not null default 'bug',
  title text not null default '',
  message text not null default '',
  status text not null default 'new',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default public.sloty_now_utc(),
  updated_at timestamptz not null default public.sloty_now_utc()
);

alter table public.sloty_support_reports drop constraint if exists sloty_support_reports_status_check;
alter table public.sloty_support_reports
  add constraint sloty_support_reports_status_check
  check (status in ('new', 'in_progress', 'resolved', 'closed'));
create index if not exists sloty_support_reports_status_idx on public.sloty_support_reports (status, created_at desc);

create table if not exists public.sloty_workspace_subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.sloty_workspaces(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default public.sloty_now_utc(),
  updated_at timestamptz not null default public.sloty_now_utc(),
  unique (workspace_id)
);

create table if not exists public.sloty_subscription_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.sloty_workspaces(id) on delete cascade,
  subscription_id uuid references public.sloty_workspace_subscriptions(id) on delete cascade,
  event_type text not null,
  amount numeric(12,2),
  currency text not null default 'RUB',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default public.sloty_now_utc()
);

create table if not exists public.sloty_marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.sloty_workspaces(id) on delete cascade,
  title text not null,
  channel text not null default 'telegram',
  status text not null default 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  budget numeric(12,2),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default public.sloty_now_utc(),
  updated_at timestamptz not null default public.sloty_now_utc()
);

create table if not exists public.sloty_clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.sloty_workspaces(id) on delete cascade,
  name text not null,
  phone text,
  phone_normalized text generated always as (public.sloty_normalize_phone(phone)) stored,
  segment text not null default 'new',
  source text,
  is_vip boolean not null default false,
  last_visit date,
  next_visit date,
  total_visits integer not null default 0,
  total_revenue numeric(12,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default public.sloty_now_utc(),
  updated_at timestamptz not null default public.sloty_now_utc()
);

create index if not exists sloty_clients_workspace_idx on public.sloty_clients (workspace_id, segment, updated_at desc);

create or replace function public.sloty_can_access_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.sloty_workspaces w
    where w.id = target_workspace_id and w.owner_id = auth.uid()
  )
  or exists (
    select 1 from public.sloty_workspace_members m
    where m.workspace_id = target_workspace_id and m.user_id = auth.uid()
  );
$$;

create or replace function public.sloty_can_manage_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.sloty_workspaces w
    where w.id = target_workspace_id and w.owner_id = auth.uid()
  )
  or exists (
    select 1 from public.sloty_workspace_members m
    where m.workspace_id = target_workspace_id and m.user_id = auth.uid() and m.role in ('owner', 'manager')
  );
$$;

alter table public.sloty_workspaces enable row level security;
alter table public.sloty_workspace_members enable row level security;
alter table public.sloty_bookings enable row level security;
alter table public.sloty_chat_threads enable row level security;
alter table public.sloty_chat_messages enable row level security;
alter table public.sloty_services enable row level security;
alter table public.sloty_availability_days enable row level security;
alter table public.sloty_message_templates enable row level security;
alter table public.sloty_telegram_accounts enable row level security;
alter table public.sloty_telegram_login_requests enable row level security;
alter table public.sloty_booking_telegram_links enable row level security;
alter table public.sloty_support_reports enable row level security;
alter table public.sloty_workspace_subscriptions enable row level security;
alter table public.sloty_subscription_events enable row level security;
alter table public.sloty_marketing_campaigns enable row level security;
alter table public.sloty_clients enable row level security;

-- Service role policies for API routes that use SUPABASE_SERVICE_ROLE_KEY.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'sloty_workspaces',
    'sloty_workspace_members',
    'sloty_bookings',
    'sloty_chat_threads',
    'sloty_chat_messages',
    'sloty_services',
    'sloty_availability_days',
    'sloty_message_templates',
    'sloty_telegram_accounts',
    'sloty_telegram_login_requests',
    'sloty_booking_telegram_links',
    'sloty_support_reports',
    'sloty_workspace_subscriptions',
    'sloty_subscription_events',
    'sloty_marketing_campaigns',
    'sloty_clients'
  ] loop
    execute format('drop policy if exists %I on public.%I', 'service role manages ' || table_name, table_name);
    execute format(
      'create policy %I on public.%I for all using (auth.role() = ''service_role'') with check (auth.role() = ''service_role'')',
      'service role manages ' || table_name,
      table_name
    );
    execute format('grant all on public.%I to service_role', table_name);
    execute format('grant select on public.%I to authenticated', table_name);
  end loop;
end $$;

-- Owner/member policies for browser-authenticated reads/writes.
drop policy if exists "sloty owner manages workspaces" on public.sloty_workspaces;
create policy "sloty owner manages workspaces"
on public.sloty_workspaces
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "sloty owner can read workspace members" on public.sloty_workspace_members;
create policy "sloty owner can read workspace members"
on public.sloty_workspace_members
for select
using (public.sloty_can_access_workspace(workspace_id));

drop policy if exists "sloty owner can manage workspace members" on public.sloty_workspace_members;
create policy "sloty owner can manage workspace members"
on public.sloty_workspace_members
for all
using (public.sloty_can_manage_workspace(workspace_id))
with check (public.sloty_can_manage_workspace(workspace_id));

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'sloty_bookings',
    'sloty_chat_threads',
    'sloty_chat_messages',
    'sloty_services',
    'sloty_availability_days',
    'sloty_message_templates',
    'sloty_support_reports',
    'sloty_workspace_subscriptions',
    'sloty_subscription_events',
    'sloty_marketing_campaigns',
    'sloty_clients'
  ] loop
    execute format('drop policy if exists %I on public.%I', 'sloty owner can read ' || table_name, table_name);
    execute format(
      'create policy %I on public.%I for select using (public.sloty_can_access_workspace(workspace_id))',
      'sloty owner can read ' || table_name,
      table_name
    );
    execute format('drop policy if exists %I on public.%I', 'sloty owner can manage ' || table_name, table_name);
    execute format(
      'create policy %I on public.%I for all using (public.sloty_can_manage_workspace(workspace_id)) with check (public.sloty_can_manage_workspace(workspace_id))',
      'sloty owner can manage ' || table_name,
      table_name
    );
  end loop;
end $$;

drop policy if exists "users read own telegram account" on public.sloty_telegram_accounts;
create policy "users read own telegram account"
on public.sloty_telegram_accounts
for select
using (user_id = auth.uid());

-- Public profile/booking pages need read access to published workspaces.
drop policy if exists "public read workspaces" on public.sloty_workspaces;
create policy "public read workspaces"
on public.sloty_workspaces
for select
to anon, authenticated
using (true);

grant usage on schema public to anon, authenticated, service_role;

-- Keep old expired auth starts from blocking repeated manual testing.
update public.sloty_telegram_login_requests
set status = 'expired', updated_at = public.sloty_now_utc()
where status = 'pending'
  and expires_at < public.sloty_now_utc();

commit;
