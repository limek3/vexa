-- ClickBook Telegram auth repair after manually deleting users from Supabase Auth.
-- This does not create Auth users; the app recreates/relinks them on next Telegram login.

create extension if not exists pgcrypto;

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

-- If Auth user was deleted by hand but old Telegram link remained, this stale UUID
-- makes the app look logged in while inserts into owner_id can fail. Clear it.
update public.sloty_telegram_accounts ta
set
  user_id = null,
  updated_at = timezone('utc', now()),
  metadata = coalesce(ta.metadata, '{}'::jsonb) || jsonb_build_object(
    'repair', 'cleared_deleted_auth_user',
    'repair_at', timezone('utc', now())
  )
where ta.user_id is not null
  and not exists (
    select 1
    from auth.users au
    where au.id = ta.user_id
  );

-- Same protection for an old workspace owner_id if the table was created before
-- the FK/cascade was active. The next successful login/profile save can attach
-- a fresh owner id again.
update public.sloty_workspaces w
set
  owner_id = null,
  updated_at = timezone('utc', now())
where w.owner_id is not null
  and not exists (
    select 1
    from auth.users au
    where au.id = w.owner_id
  );

-- Old/half-consumed Telegram browser login attempts should not poison the next login.
update public.sloty_telegram_login_requests
set
  status = 'expired',
  updated_at = timezone('utc', now())
where status in ('pending', 'confirmed')
  and expires_at < timezone('utc', now());
