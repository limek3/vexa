-- Optional patch for older Supabase databases.
-- Keeps Web / Telegram / VK clients in one scheme and lets Web chats be stored.

alter table if exists public.sloty_chat_threads
  drop constraint if exists sloty_chat_threads_channel_check;

alter table if exists public.sloty_chat_threads
  add constraint sloty_chat_threads_channel_check
  check (channel in ('Telegram', 'Instagram', 'VK', 'Web'));

create table if not exists public.sloty_clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.sloty_workspaces(id) on delete cascade,
  name text not null,
  phone text not null default '',
  phone_normalized text generated always as (regexp_replace(coalesce(phone, ''), '\\D', '', 'g')) stored,
  segment text not null default 'new' check (segment in ('new', 'regular', 'sleeping')),
  source text,
  is_vip boolean not null default false,
  last_visit date,
  next_visit date,
  total_visits integer not null default 0,
  total_revenue numeric not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sloty_clients_workspace_phone_idx
  on public.sloty_clients(workspace_id, phone_normalized);
