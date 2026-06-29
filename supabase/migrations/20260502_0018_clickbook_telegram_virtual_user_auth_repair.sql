-- ClickBook Telegram Auth final repair
--
-- Why this exists:
-- Supabase Auth Admin can return a generic "Internal Server Error" while creating
-- synthetic Telegram auth.users rows. The app now has a deterministic Telegram
-- app-session fallback. For that fallback to be able to create profiles/workspaces,
-- public ClickBook tables must not require owner/member IDs to exist in auth.users.

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
  metadata jsonb not null default '{}'::jsonb,
  confirmed_at timestamptz,
  consumed_at timestamptz,
  expires_at timestamptz not null default (timezone('utc', now()) + interval '10 minutes'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sloty_telegram_accounts (
  telegram_id bigint primary key,
  user_id uuid,
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

alter table public.sloty_telegram_accounts add column if not exists user_id uuid;
alter table public.sloty_telegram_accounts add column if not exists username text;
alter table public.sloty_telegram_accounts add column if not exists first_name text;
alter table public.sloty_telegram_accounts add column if not exists last_name text;
alter table public.sloty_telegram_accounts add column if not exists photo_url text;
alter table public.sloty_telegram_accounts add column if not exists auth_date timestamptz;
alter table public.sloty_telegram_accounts add column if not exists chat_id bigint;
alter table public.sloty_telegram_accounts add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.sloty_telegram_accounts add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.sloty_telegram_accounts add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.sloty_telegram_login_requests add column if not exists telegram_id bigint;
alter table public.sloty_telegram_login_requests add column if not exists username text;
alter table public.sloty_telegram_login_requests add column if not exists first_name text;
alter table public.sloty_telegram_login_requests add column if not exists last_name text;
alter table public.sloty_telegram_login_requests add column if not exists photo_url text;
alter table public.sloty_telegram_login_requests add column if not exists chat_id bigint;
alter table public.sloty_telegram_login_requests add column if not exists message_id bigint;
alter table public.sloty_telegram_login_requests add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.sloty_telegram_login_requests add column if not exists confirmed_at timestamptz;
alter table public.sloty_telegram_login_requests add column if not exists consumed_at timestamptz;
alter table public.sloty_telegram_login_requests add column if not exists expires_at timestamptz not null default (timezone('utc', now()) + interval '10 minutes');
alter table public.sloty_telegram_login_requests add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.sloty_telegram_login_requests add column if not exists updated_at timestamptz not null default timezone('utc', now());

-- The custom Telegram app-session can use deterministic virtual UUIDs that are
-- not stored in auth.users. Drop public-table foreign keys to auth.users so
-- Telegram users can still own workspaces and create profiles when GoTrue fails.
do $$
declare
  constraint_row record;
begin
  for constraint_row in
    select
      conrelid::regclass as table_name,
      conname as constraint_name
    from pg_constraint
    where contype = 'f'
      and confrelid = 'auth.users'::regclass
      and connamespace = 'public'::regnamespace
  loop
    execute format(
      'alter table %s drop constraint if exists %I',
      constraint_row.table_name,
      constraint_row.constraint_name
    );
  end loop;
end $$;

-- Old migrations created telegram_accounts.user_id as NOT NULL + unique + FK.
-- For the virtual fallback it must be a plain nullable UUID field.
alter table public.sloty_telegram_accounts alter column user_id drop not null;
drop index if exists public.sloty_telegram_accounts_user_idx;
create index if not exists sloty_telegram_accounts_user_idx
  on public.sloty_telegram_accounts (user_id)
  where user_id is not null;

create index if not exists sloty_telegram_accounts_chat_idx
  on public.sloty_telegram_accounts (chat_id)
  where chat_id is not null;

create index if not exists sloty_telegram_login_requests_status_idx
  on public.sloty_telegram_login_requests (status, expires_at);

-- Make status values tolerant if an old CHECK constraint exists.
do $$
declare
  constraint_row record;
begin
  for constraint_row in
    select conname
    from pg_constraint
    where conrelid = 'public.sloty_telegram_login_requests'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format(
      'alter table public.sloty_telegram_login_requests drop constraint if exists %I',
      constraint_row.conname
    );
  end loop;
end $$;

alter table public.sloty_telegram_login_requests
  add constraint sloty_telegram_login_requests_status_check
  check (status in ('pending', 'confirmed', 'consumed', 'expired'));

-- Clean stale requests so the next login starts from a predictable state.
update public.sloty_telegram_login_requests
set status = 'expired', updated_at = timezone('utc', now())
where status = 'pending'
  and expires_at < timezone('utc', now());

delete from public.sloty_telegram_login_requests
where created_at < timezone('utc', now()) - interval '24 hours';

grant select, insert, update, delete on public.sloty_telegram_login_requests to service_role;
grant select, insert, update, delete on public.sloty_telegram_accounts to service_role;
grant select on public.sloty_telegram_accounts to authenticated;
