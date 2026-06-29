-- ClickBook VK ID auth
-- Custom VK ID OAuth 2.1 + PKCE flow stores VK accounts separately from Supabase Auth.
-- user_id is intentionally a plain UUID without FK to auth.users because ClickBook
-- can use deterministic virtual app-session users for Telegram/VK when GoTrue fails.

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

-- Drop possible old FK if a previous experimental table referenced auth.users.
do $$
declare
  constraint_row record;
begin
  for constraint_row in
    select conname
    from pg_constraint
    where conrelid = 'public.sloty_vk_accounts'::regclass
      and contype = 'f'
  loop
    execute format(
      'alter table public.sloty_vk_accounts drop constraint if exists %I',
      constraint_row.conname
    );
  end loop;
end $$;

alter table public.sloty_vk_accounts alter column user_id drop not null;

create index if not exists sloty_vk_accounts_user_idx
  on public.sloty_vk_accounts (user_id)
  where user_id is not null;

create index if not exists sloty_vk_accounts_email_idx
  on public.sloty_vk_accounts (lower(email))
  where email is not null;

create index if not exists sloty_vk_accounts_last_login_idx
  on public.sloty_vk_accounts (last_login_at desc nulls last);

grant select, insert, update, delete on public.sloty_vk_accounts to service_role;
grant select on public.sloty_vk_accounts to authenticated;
