-- ClickBook Telegram bot auth flow
-- Run after the main ClickBook schema.

begin;

create extension if not exists pgcrypto;

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

alter table public.sloty_telegram_accounts enable row level security;
alter table public.sloty_telegram_login_requests enable row level security;

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

grant select on public.sloty_telegram_accounts to authenticated;
grant all on public.sloty_telegram_accounts to service_role;
grant all on public.sloty_telegram_login_requests to service_role;

commit;
