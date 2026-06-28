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
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists sloty_telegram_accounts_user_idx
  on public.sloty_telegram_accounts (user_id)
  where user_id is not null;

create index if not exists sloty_telegram_accounts_chat_idx
  on public.sloty_telegram_accounts (chat_id)
  where chat_id is not null;

create table if not exists public.sloty_telegram_login_requests (
  token text primary key,
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
  expires_at timestamptz not null default (timezone('utc', now()) + interval '10 minutes'),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint sloty_telegram_login_requests_status_check
    check (status in ('pending', 'confirmed', 'expired', 'consumed'))
);

create index if not exists sloty_telegram_login_requests_status_idx
  on public.sloty_telegram_login_requests (status, expires_at);

alter table public.sloty_telegram_accounts enable row level security;
alter table public.sloty_telegram_login_requests enable row level security;

drop policy if exists "service role manages telegram accounts" on public.sloty_telegram_accounts;
create policy "service role manages telegram accounts"
on public.sloty_telegram_accounts
for all
to service_role
using (true)
with check (true);

drop policy if exists "users read own telegram account" on public.sloty_telegram_accounts;
create policy "users read own telegram account"
on public.sloty_telegram_accounts
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "service role manages telegram login requests" on public.sloty_telegram_login_requests;
create policy "service role manages telegram login requests"
on public.sloty_telegram_login_requests
for all
to service_role
using (true)
with check (true);

grant select on public.sloty_telegram_accounts to authenticated;
grant all on public.sloty_telegram_accounts to service_role;
grant all on public.sloty_telegram_login_requests to service_role;
