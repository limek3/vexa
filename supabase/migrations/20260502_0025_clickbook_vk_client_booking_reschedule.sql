-- 20260502_0025_clickbook_vk_client_booking_reschedule.sql
-- VK client booking links + unified client confirm/reschedule alerts for chats.

create extension if not exists pgcrypto;

create table if not exists public.sloty_booking_vk_links (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  workspace_id uuid not null references public.sloty_workspaces(id) on delete cascade,
  booking_id uuid not null,
  master_slug text not null,
  booking_snapshot jsonb,
  status text not null default 'pending',
  vk_user_id text,
  peer_id bigint,
  first_name text,
  last_name text,
  screen_name text,
  photo_url text,
  confirmed_at timestamptz,
  reminder_24h_sent_at timestamptz,
  reminder_2h_sent_at timestamptz,
  expires_at timestamptz not null default (timezone('utc', now()) + interval '24 hours'),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.sloty_booking_vk_links add column if not exists token text;
alter table public.sloty_booking_vk_links add column if not exists workspace_id uuid;
alter table public.sloty_booking_vk_links add column if not exists booking_id uuid;
alter table public.sloty_booking_vk_links add column if not exists master_slug text;
alter table public.sloty_booking_vk_links add column if not exists booking_snapshot jsonb;
alter table public.sloty_booking_vk_links add column if not exists status text;
alter table public.sloty_booking_vk_links add column if not exists vk_user_id text;
alter table public.sloty_booking_vk_links add column if not exists peer_id bigint;
alter table public.sloty_booking_vk_links add column if not exists first_name text;
alter table public.sloty_booking_vk_links add column if not exists last_name text;
alter table public.sloty_booking_vk_links add column if not exists screen_name text;
alter table public.sloty_booking_vk_links add column if not exists photo_url text;
alter table public.sloty_booking_vk_links add column if not exists confirmed_at timestamptz;
alter table public.sloty_booking_vk_links add column if not exists reminder_24h_sent_at timestamptz;
alter table public.sloty_booking_vk_links add column if not exists reminder_2h_sent_at timestamptz;
alter table public.sloty_booking_vk_links add column if not exists expires_at timestamptz;
alter table public.sloty_booking_vk_links add column if not exists metadata jsonb;
alter table public.sloty_booking_vk_links add column if not exists created_at timestamptz;
alter table public.sloty_booking_vk_links add column if not exists updated_at timestamptz;

update public.sloty_booking_vk_links
set
  status = coalesce(nullif(status, ''), 'pending'),
  metadata = coalesce(metadata, '{}'::jsonb),
  expires_at = coalesce(expires_at, timezone('utc', now()) + interval '24 hours'),
  created_at = coalesce(created_at, timezone('utc', now())),
  updated_at = coalesce(updated_at, timezone('utc', now()));

alter table public.sloty_booking_vk_links alter column status set default 'pending';
alter table public.sloty_booking_vk_links alter column status set not null;
alter table public.sloty_booking_vk_links alter column expires_at set default (timezone('utc', now()) + interval '24 hours');
alter table public.sloty_booking_vk_links alter column expires_at set not null;
alter table public.sloty_booking_vk_links alter column metadata set default '{}'::jsonb;
alter table public.sloty_booking_vk_links alter column metadata set not null;
alter table public.sloty_booking_vk_links alter column created_at set default timezone('utc', now());
alter table public.sloty_booking_vk_links alter column created_at set not null;
alter table public.sloty_booking_vk_links alter column updated_at set default timezone('utc', now());
alter table public.sloty_booking_vk_links alter column updated_at set not null;

alter table public.sloty_booking_vk_links drop constraint if exists sloty_booking_vk_links_status_check;
alter table public.sloty_booking_vk_links
  add constraint sloty_booking_vk_links_status_check
  check (status in ('pending', 'confirmed', 'expired'));

create unique index if not exists sloty_booking_vk_links_token_key
  on public.sloty_booking_vk_links(token);

create index if not exists sloty_booking_vk_links_token_idx
  on public.sloty_booking_vk_links(token);

create index if not exists sloty_booking_vk_links_booking_idx
  on public.sloty_booking_vk_links(booking_id);

create index if not exists sloty_booking_vk_links_workspace_booking_idx
  on public.sloty_booking_vk_links(workspace_id, booking_id);

create index if not exists sloty_booking_vk_links_workspace_peer_idx
  on public.sloty_booking_vk_links(workspace_id, peer_id)
  where peer_id is not null;

create index if not exists sloty_booking_vk_links_reminder_idx
  on public.sloty_booking_vk_links(status, peer_id, reminder_24h_sent_at, reminder_2h_sent_at)
  where status = 'confirmed' and peer_id is not null;

alter table public.sloty_bookings add column if not exists cancel_reason text;
alter table public.sloty_bookings add column if not exists cancelled_at timestamptz;
alter table public.sloty_bookings add column if not exists confirmed_at timestamptz;
alter table public.sloty_bookings add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.sloty_chat_threads add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.sloty_chat_messages add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.sloty_booking_vk_links enable row level security;

do $$
begin
  create policy "sloty_booking_vk_links_service_role_all"
    on public.sloty_booking_vk_links
    for all
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');
exception
  when duplicate_object then null;
end $$;

grant all on public.sloty_booking_vk_links to service_role;

-- Optional safety: keep statuses compatible with client reschedule/no-show flow.
alter table public.sloty_bookings drop constraint if exists sloty_bookings_status_check;
alter table public.sloty_bookings
  add constraint sloty_bookings_status_check
  check (status in ('new', 'confirmed', 'completed', 'no_show', 'cancelled'));
