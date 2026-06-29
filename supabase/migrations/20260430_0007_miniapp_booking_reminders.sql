-- ClickBook — Telegram Mini App auth + client booking reminders
-- Run after the base ClickBook schema.

begin;

create table if not exists public.sloty_telegram_accounts (
  telegram_id bigint primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  username text,
  first_name text,
  last_name text,
  photo_url text,
  auth_date timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.sloty_telegram_accounts
  add column if not exists chat_id bigint;

create index if not exists sloty_telegram_accounts_user_idx
  on public.sloty_telegram_accounts (user_id);

create index if not exists sloty_telegram_accounts_chat_idx
  on public.sloty_telegram_accounts (chat_id)
  where chat_id is not null;

create table if not exists public.sloty_telegram_login_requests (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'consumed', 'expired')),
  telegram_id bigint,
  username text,
  first_name text,
  last_name text,
  photo_url text,
  chat_id bigint,
  message_id bigint,
  confirmed_at timestamptz,
  consumed_at timestamptz,
  expires_at timestamptz not null default (timezone('utc', now()) + interval '10 minutes'),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists sloty_telegram_login_requests_token_idx
  on public.sloty_telegram_login_requests (token);

create index if not exists sloty_telegram_login_requests_status_idx
  on public.sloty_telegram_login_requests (status, expires_at);

create table if not exists public.sloty_booking_telegram_links (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  workspace_id uuid not null references public.sloty_workspaces(id) on delete cascade,
  booking_id uuid not null,
  master_slug text not null,
  booking_snapshot jsonb,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'expired')),
  telegram_id bigint,
  chat_id bigint,
  username text,
  first_name text,
  last_name text,
  confirmed_at timestamptz,
  reminder_24h_sent_at timestamptz,
  reminder_2h_sent_at timestamptz,
  expires_at timestamptz not null default (timezone('utc', now()) + interval '24 hours'),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists sloty_booking_telegram_links_token_idx
  on public.sloty_booking_telegram_links (token);

create index if not exists sloty_booking_telegram_links_booking_idx
  on public.sloty_booking_telegram_links (booking_id);

create index if not exists sloty_booking_telegram_links_reminder_idx
  on public.sloty_booking_telegram_links (status, chat_id, reminder_24h_sent_at, reminder_2h_sent_at)
  where status = 'confirmed' and chat_id is not null;

alter table public.sloty_telegram_accounts enable row level security;
alter table public.sloty_telegram_login_requests enable row level security;
alter table public.sloty_booking_telegram_links enable row level security;

drop policy if exists "service role manages telegram accounts" on public.sloty_telegram_accounts;
create policy "service role manages telegram accounts"
on public.sloty_telegram_accounts
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "users read own telegram account" on public.sloty_telegram_accounts;
create policy "users read own telegram account"
on public.sloty_telegram_accounts
for select
using (user_id = auth.uid());

drop policy if exists "service role manages telegram login requests" on public.sloty_telegram_login_requests;
create policy "service role manages telegram login requests"
on public.sloty_telegram_login_requests
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

drop policy if exists "service role manages booking telegram links" on public.sloty_booking_telegram_links;
create policy "service role manages booking telegram links"
on public.sloty_booking_telegram_links
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

grant select on public.sloty_telegram_accounts to authenticated;

grant all on public.sloty_telegram_accounts to service_role;
grant all on public.sloty_telegram_login_requests to service_role;
grant all on public.sloty_booking_telegram_links to service_role;

commit;
