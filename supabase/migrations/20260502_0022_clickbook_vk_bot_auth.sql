-- 20260502_0022_clickbook_vk_bot_auth.sql
-- VK community bot auth + VK notifications for ClickBook.
-- This is intentionally independent from VK OAuth redirect_uri / VK ID Business profile.

create extension if not exists pgcrypto;

create table if not exists public.sloty_vk_accounts (
  vk_id text primary key,
  user_id uuid,
  screen_name text,
  domain text,
  first_name text,
  last_name text,
  full_name text,
  email text,
  phone text,
  photo_url text,
  raw_profile jsonb not null default '{}'::jsonb,
  last_login_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.sloty_vk_accounts add column if not exists user_id uuid;
alter table public.sloty_vk_accounts add column if not exists screen_name text;
alter table public.sloty_vk_accounts add column if not exists domain text;
alter table public.sloty_vk_accounts add column if not exists first_name text;
alter table public.sloty_vk_accounts add column if not exists last_name text;
alter table public.sloty_vk_accounts add column if not exists full_name text;
alter table public.sloty_vk_accounts add column if not exists email text;
alter table public.sloty_vk_accounts add column if not exists phone text;
alter table public.sloty_vk_accounts add column if not exists photo_url text;
alter table public.sloty_vk_accounts add column if not exists raw_profile jsonb not null default '{}'::jsonb;
alter table public.sloty_vk_accounts add column if not exists last_login_at timestamptz;
alter table public.sloty_vk_accounts add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.sloty_vk_accounts add column if not exists updated_at timestamptz not null default timezone('utc', now());

create table if not exists public.sloty_vk_login_requests (
  token text primary key,
  status text not null default 'pending',
  vk_user_id text,
  peer_id bigint,
  first_name text,
  last_name text,
  screen_name text,
  photo_url text,
  metadata jsonb not null default '{}'::jsonb,
  confirmed_at timestamptz,
  consumed_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.sloty_vk_login_requests add column if not exists status text;
alter table public.sloty_vk_login_requests add column if not exists vk_user_id text;
alter table public.sloty_vk_login_requests add column if not exists peer_id bigint;
alter table public.sloty_vk_login_requests add column if not exists first_name text;
alter table public.sloty_vk_login_requests add column if not exists last_name text;
alter table public.sloty_vk_login_requests add column if not exists screen_name text;
alter table public.sloty_vk_login_requests add column if not exists photo_url text;
alter table public.sloty_vk_login_requests add column if not exists metadata jsonb;
alter table public.sloty_vk_login_requests add column if not exists confirmed_at timestamptz;
alter table public.sloty_vk_login_requests add column if not exists consumed_at timestamptz;
alter table public.sloty_vk_login_requests add column if not exists expires_at timestamptz;
alter table public.sloty_vk_login_requests add column if not exists created_at timestamptz;
alter table public.sloty_vk_login_requests add column if not exists updated_at timestamptz;

update public.sloty_vk_login_requests
set
  status = coalesce(nullif(status, ''), 'pending'),
  metadata = coalesce(metadata, '{}'::jsonb),
  created_at = coalesce(created_at, timezone('utc', now())),
  updated_at = coalesce(updated_at, timezone('utc', now())),
  expires_at = coalesce(expires_at, timezone('utc', now()) + interval '10 minutes');

alter table public.sloty_vk_login_requests alter column status set default 'pending';
alter table public.sloty_vk_login_requests alter column status set not null;
alter table public.sloty_vk_login_requests alter column metadata set default '{}'::jsonb;
alter table public.sloty_vk_login_requests alter column metadata set not null;
alter table public.sloty_vk_login_requests alter column expires_at set not null;
alter table public.sloty_vk_login_requests alter column created_at set default timezone('utc', now());
alter table public.sloty_vk_login_requests alter column created_at set not null;
alter table public.sloty_vk_login_requests alter column updated_at set default timezone('utc', now());
alter table public.sloty_vk_login_requests alter column updated_at set not null;

alter table public.sloty_vk_login_requests drop constraint if exists sloty_vk_login_requests_status_check;
alter table public.sloty_vk_login_requests
  add constraint sloty_vk_login_requests_status_check
  check (status in ('pending', 'confirmed', 'consumed', 'expired'));

create index if not exists sloty_vk_login_requests_status_expires_idx
  on public.sloty_vk_login_requests (status, expires_at);

create index if not exists sloty_vk_login_requests_vk_user_idx
  on public.sloty_vk_login_requests (vk_user_id)
  where vk_user_id is not null;

create table if not exists public.sloty_vk_bot_accounts (
  vk_user_id text primary key,
  user_id uuid,
  peer_id bigint,
  first_name text,
  last_name text,
  full_name text,
  screen_name text,
  photo_url text,
  messages_allowed boolean not null default true,
  last_message_at timestamptz,
  last_login_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.sloty_vk_bot_accounts add column if not exists user_id uuid;
alter table public.sloty_vk_bot_accounts add column if not exists peer_id bigint;
alter table public.sloty_vk_bot_accounts add column if not exists first_name text;
alter table public.sloty_vk_bot_accounts add column if not exists last_name text;
alter table public.sloty_vk_bot_accounts add column if not exists full_name text;
alter table public.sloty_vk_bot_accounts add column if not exists screen_name text;
alter table public.sloty_vk_bot_accounts add column if not exists photo_url text;
alter table public.sloty_vk_bot_accounts add column if not exists messages_allowed boolean;
alter table public.sloty_vk_bot_accounts add column if not exists last_message_at timestamptz;
alter table public.sloty_vk_bot_accounts add column if not exists last_login_at timestamptz;
alter table public.sloty_vk_bot_accounts add column if not exists metadata jsonb;
alter table public.sloty_vk_bot_accounts add column if not exists created_at timestamptz;
alter table public.sloty_vk_bot_accounts add column if not exists updated_at timestamptz;

update public.sloty_vk_bot_accounts
set
  messages_allowed = coalesce(messages_allowed, true),
  metadata = coalesce(metadata, '{}'::jsonb),
  created_at = coalesce(created_at, timezone('utc', now())),
  updated_at = coalesce(updated_at, timezone('utc', now()));

alter table public.sloty_vk_bot_accounts alter column messages_allowed set default true;
alter table public.sloty_vk_bot_accounts alter column messages_allowed set not null;
alter table public.sloty_vk_bot_accounts alter column metadata set default '{}'::jsonb;
alter table public.sloty_vk_bot_accounts alter column metadata set not null;
alter table public.sloty_vk_bot_accounts alter column created_at set default timezone('utc', now());
alter table public.sloty_vk_bot_accounts alter column created_at set not null;
alter table public.sloty_vk_bot_accounts alter column updated_at set default timezone('utc', now());
alter table public.sloty_vk_bot_accounts alter column updated_at set not null;

create index if not exists sloty_vk_bot_accounts_user_idx
  on public.sloty_vk_bot_accounts (user_id)
  where user_id is not null;

create index if not exists sloty_vk_bot_accounts_peer_idx
  on public.sloty_vk_bot_accounts (peer_id)
  where peer_id is not null;

create index if not exists sloty_vk_bot_accounts_allowed_idx
  on public.sloty_vk_bot_accounts (messages_allowed, updated_at desc);

-- Drop experimental FKs to auth.users if any old patch created them.
do $$
declare
  r record;
begin
  for r in
    select conrelid::regclass::text as table_name, conname
    from pg_constraint
    where contype = 'f'
      and conrelid in (
        'public.sloty_vk_accounts'::regclass,
        'public.sloty_vk_bot_accounts'::regclass
      )
  loop
    execute format('alter table %s drop constraint if exists %I', r.table_name, r.conname);
  end loop;
end $$;

alter table public.sloty_vk_accounts alter column user_id drop not null;
alter table public.sloty_vk_bot_accounts alter column user_id drop not null;

grant select, insert, update, delete on public.sloty_vk_accounts to service_role;
grant select, insert, update, delete on public.sloty_vk_login_requests to service_role;
grant select, insert, update, delete on public.sloty_vk_bot_accounts to service_role;

grant select on public.sloty_vk_accounts to authenticated;
grant select on public.sloty_vk_bot_accounts to authenticated;

-- Clean expired one-time login requests.
update public.sloty_vk_login_requests
set status = 'expired', updated_at = timezone('utc', now())
where status = 'pending'
  and expires_at < timezone('utc', now());
