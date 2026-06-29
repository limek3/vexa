-- CLICKBOOK FULL DATABASE FIXED 2026-05-02
-- Run this in Supabase SQL Editor for the current ClickBook project.
-- It includes the original project schema plus the final Telegram auth hardening block.


create extension if not exists pgcrypto;

create table if not exists public.sloty_workspaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  profile jsonb not null,
  data jsonb not null default '{}'::jsonb,
  appearance jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.touch_sloty_workspaces_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_touch_sloty_workspaces_updated_at on public.sloty_workspaces;
create trigger trg_touch_sloty_workspaces_updated_at
before update on public.sloty_workspaces
for each row
execute function public.touch_sloty_workspaces_updated_at();

alter table public.sloty_workspaces enable row level security;

create policy "service role manages sloty workspaces"
on public.sloty_workspaces
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
create extension if not exists pgcrypto;

alter table public.sloty_workspaces
  add column if not exists owner_id uuid references auth.users(id) on delete cascade;

create unique index if not exists sloty_workspaces_owner_id_key
  on public.sloty_workspaces (owner_id)
  where owner_id is not null;

create index if not exists sloty_workspaces_slug_idx
  on public.sloty_workspaces (slug);

create table if not exists public.sloty_workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.sloty_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'manager', 'assistant')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, user_id)
);

create table if not exists public.sloty_chat_threads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.sloty_workspaces(id) on delete cascade,
  client_name text not null,
  client_phone text not null,
  channel text not null default 'Telegram' check (channel in ('Telegram', 'MAX')),
  segment text,
  source text,
  next_visit date,
  is_priority boolean not null default false,
  bot_connected boolean not null default true,
  last_message_preview text,
  last_message_at timestamptz not null default timezone('utc', now()),
  unread_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.sloty_chat_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.sloty_workspaces(id) on delete cascade,
  thread_id uuid not null references public.sloty_chat_threads(id) on delete cascade,
  author text not null check (author in ('client', 'master', 'system')),
  body text not null,
  delivery_state text check (delivery_state in ('queued', 'sent', 'delivered', 'read')),
  via_bot boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create or replace function public.touch_sloty_generic_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_touch_sloty_chat_threads_updated_at on public.sloty_chat_threads;
create trigger trg_touch_sloty_chat_threads_updated_at
before update on public.sloty_chat_threads
for each row
execute function public.touch_sloty_generic_updated_at();

alter table public.sloty_workspace_members enable row level security;
alter table public.sloty_chat_threads enable row level security;
alter table public.sloty_chat_messages enable row level security;

create or replace function public.sloty_can_access_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.sloty_workspaces w
    where w.id = target_workspace_id
      and w.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.sloty_workspace_members m
    where m.workspace_id = target_workspace_id
      and m.user_id = auth.uid()
  );
$$;

drop policy if exists "sloty owner can read workspace members" on public.sloty_workspace_members;
create policy "sloty owner can read workspace members"
on public.sloty_workspace_members
for select
using (public.sloty_can_access_workspace(workspace_id));

drop policy if exists "sloty owner can manage workspace members" on public.sloty_workspace_members;
create policy "sloty owner can manage workspace members"
on public.sloty_workspace_members
for all
using (public.sloty_can_access_workspace(workspace_id))
with check (public.sloty_can_access_workspace(workspace_id));

drop policy if exists "sloty owner can read chat threads" on public.sloty_chat_threads;
create policy "sloty owner can read chat threads"
on public.sloty_chat_threads
for select
using (public.sloty_can_access_workspace(workspace_id));

drop policy if exists "sloty owner can manage chat threads" on public.sloty_chat_threads;
create policy "sloty owner can manage chat threads"
on public.sloty_chat_threads
for all
using (public.sloty_can_access_workspace(workspace_id))
with check (public.sloty_can_access_workspace(workspace_id));

drop policy if exists "sloty owner can read chat messages" on public.sloty_chat_messages;
create policy "sloty owner can read chat messages"
on public.sloty_chat_messages
for select
using (public.sloty_can_access_workspace(workspace_id));

drop policy if exists "sloty owner can manage chat messages" on public.sloty_chat_messages;
create policy "sloty owner can manage chat messages"
on public.sloty_chat_messages
for all
using (public.sloty_can_access_workspace(workspace_id))
with check (public.sloty_can_access_workspace(workspace_id));

drop policy if exists "sloty owner manages workspaces" on public.sloty_workspaces;
create policy "sloty owner manages workspaces"
on public.sloty_workspaces
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "service role manages sloty workspaces" on public.sloty_workspaces;
create policy "service role manages sloty workspaces"
on public.sloty_workspaces
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
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
  status text not null default 'new' check (status in ('new', 'confirmed', 'completed', 'no_show', 'cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists sloty_bookings_workspace_id_idx
  on public.sloty_bookings (workspace_id, created_at desc);

create index if not exists sloty_bookings_master_slug_idx
  on public.sloty_bookings (master_slug);

drop trigger if exists trg_touch_sloty_bookings_updated_at on public.sloty_bookings;
create trigger trg_touch_sloty_bookings_updated_at
before update on public.sloty_bookings
for each row
execute function public.touch_sloty_generic_updated_at();

alter table public.sloty_bookings enable row level security;

drop policy if exists "sloty owner can read bookings" on public.sloty_bookings;
create policy "sloty owner can read bookings"
on public.sloty_bookings
for select
using (public.sloty_can_access_workspace(workspace_id));

drop policy if exists "sloty owner can manage bookings" on public.sloty_bookings;
create policy "sloty owner can manage bookings"
on public.sloty_bookings
for all
using (public.sloty_can_access_workspace(workspace_id))
with check (public.sloty_can_access_workspace(workspace_id));

drop policy if exists "service role manages sloty bookings" on public.sloty_bookings;
create policy "service role manages sloty bookings"
on public.sloty_bookings
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
-- ClickBook / Sloty Supabase compatibility patch
-- Run after older migrations, or use together with the full schema from the project notes.
-- The important production fix here is: service_role must be able to write through PostgREST,
-- and the current app tables must match the Next.js API routes.

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

create or replace function public.touch_sloty_workspaces_updated_at()
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
  select nullif(regexp_replace(coalesce(value, ''), '[^0-9+]', '', 'g'), '');
$$;

create table if not exists public.sloty_workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  slug text not null,
  profile jsonb not null default '{}'::jsonb,
  data jsonb not null default '{}'::jsonb,
  appearance jsonb,
  name text,
  locale text not null default 'ru',
  timezone text not null default 'Europe/Amsterdam',
  currency text not null default 'RUB',
  is_published boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default public.sloty_now_utc(),
  updated_at timestamptz not null default public.sloty_now_utc(),
  deleted_at timestamptz
);

alter table public.sloty_workspaces add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.sloty_workspaces add column if not exists profile jsonb not null default '{}'::jsonb;
alter table public.sloty_workspaces add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.sloty_workspaces add column if not exists appearance jsonb;
alter table public.sloty_workspaces add column if not exists name text;
alter table public.sloty_workspaces add column if not exists locale text not null default 'ru';
alter table public.sloty_workspaces add column if not exists timezone text not null default 'Europe/Amsterdam';
alter table public.sloty_workspaces add column if not exists currency text not null default 'RUB';
alter table public.sloty_workspaces add column if not exists is_published boolean not null default true;
alter table public.sloty_workspaces add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.sloty_workspaces add column if not exists deleted_at timestamptz;

create unique index if not exists sloty_workspaces_owner_id_key
  on public.sloty_workspaces (owner_id)
  where owner_id is not null and deleted_at is null;

create unique index if not exists sloty_workspaces_slug_live_key
  on public.sloty_workspaces (slug)
  where deleted_at is null;

create index if not exists sloty_workspaces_slug_idx on public.sloty_workspaces (slug);
create index if not exists sloty_workspaces_owner_idx on public.sloty_workspaces (owner_id);

drop trigger if exists trg_touch_sloty_workspaces_updated_at on public.sloty_workspaces;
create trigger trg_touch_sloty_workspaces_updated_at
before update on public.sloty_workspaces
for each row execute function public.touch_sloty_workspaces_updated_at();

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
  status text not null default 'new' check (status in ('new', 'confirmed', 'completed', 'no_show', 'cancelled')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default public.sloty_now_utc(),
  updated_at timestamptz not null default public.sloty_now_utc()
);

alter table public.sloty_bookings add column if not exists client_id uuid;
alter table public.sloty_bookings add column if not exists client_phone_normalized text generated always as (public.sloty_normalize_phone(client_phone)) stored;
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
alter table public.sloty_bookings add column if not exists reminder_sent_at timestamptz;


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
alter table public.sloty_bookings add constraint sloty_bookings_status_check check (status in ('new', 'confirmed', 'completed', 'no_show', 'cancelled'));

create index if not exists sloty_bookings_workspace_id_idx on public.sloty_bookings (workspace_id, created_at desc);
create index if not exists sloty_bookings_master_slug_idx on public.sloty_bookings (master_slug);
create index if not exists sloty_bookings_date_idx on public.sloty_bookings (workspace_id, booking_date, booking_time);
create index if not exists sloty_bookings_status_idx on public.sloty_bookings (workspace_id, status);

drop trigger if exists trg_touch_sloty_bookings_updated_at on public.sloty_bookings;
create trigger trg_touch_sloty_bookings_updated_at
before update on public.sloty_bookings
for each row execute function public.touch_sloty_generic_updated_at();

create table if not exists public.sloty_chat_threads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.sloty_workspaces(id) on delete cascade,
  client_name text not null,
  client_phone text not null,
  channel text not null default 'Telegram' check (channel in ('Telegram', 'MAX')),
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

alter table public.sloty_chat_threads drop constraint if exists sloty_chat_threads_channel_check;
alter table public.sloty_chat_threads add constraint sloty_chat_threads_channel_check check (channel in ('Telegram', 'MAX'));
create index if not exists sloty_chat_threads_workspace_idx on public.sloty_chat_threads (workspace_id, last_message_at desc);

drop trigger if exists trg_touch_sloty_chat_threads_updated_at on public.sloty_chat_threads;
create trigger trg_touch_sloty_chat_threads_updated_at
before update on public.sloty_chat_threads
for each row execute function public.touch_sloty_generic_updated_at();

create table if not exists public.sloty_chat_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.sloty_workspaces(id) on delete cascade,
  thread_id uuid not null references public.sloty_chat_threads(id) on delete cascade,
  booking_id uuid references public.sloty_bookings(id) on delete set null,
  author text not null check (author in ('client', 'master', 'system', 'bot')),
  body text not null,
  delivery_state text check (delivery_state in ('queued', 'sent', 'delivered', 'read', 'failed')),
  via_bot boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default public.sloty_now_utc()
);

alter table public.sloty_chat_messages add column if not exists booking_id uuid references public.sloty_bookings(id) on delete set null;
alter table public.sloty_chat_messages drop constraint if exists sloty_chat_messages_author_check;
alter table public.sloty_chat_messages add constraint sloty_chat_messages_author_check check (author in ('client', 'master', 'system', 'bot'));
alter table public.sloty_chat_messages drop constraint if exists sloty_chat_messages_delivery_state_check;
alter table public.sloty_chat_messages add constraint sloty_chat_messages_delivery_state_check check (delivery_state in ('queued', 'sent', 'delivered', 'read', 'failed'));
create index if not exists sloty_chat_messages_thread_idx on public.sloty_chat_messages (thread_id, created_at asc);

create table if not exists public.sloty_support_reports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.sloty_workspaces(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  category text not null default 'bug' check (category in ('bug', 'idea', 'question')),
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved', 'closed')),
  message text not null,
  contact text,
  path text,
  locale text,
  user_agent text,
  telegram_message_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default public.sloty_now_utc(),
  updated_at timestamptz not null default public.sloty_now_utc()
);

create index if not exists sloty_support_reports_status_idx on public.sloty_support_reports (status, created_at desc);

drop trigger if exists trg_touch_sloty_support_reports_updated_at on public.sloty_support_reports;
create trigger trg_touch_sloty_support_reports_updated_at
before update on public.sloty_support_reports
for each row execute function public.sloty_touch_updated_at();

create or replace function public.sloty_can_access_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.role() = 'service_role'
    or exists (
      select 1 from public.sloty_workspaces w
      where w.id = target_workspace_id and w.owner_id = auth.uid() and w.deleted_at is null
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
  select auth.role() = 'service_role'
    or exists (
      select 1 from public.sloty_workspaces w
      where w.id = target_workspace_id and w.owner_id = auth.uid() and w.deleted_at is null
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
alter table public.sloty_support_reports enable row level security;

drop policy if exists "service role manages sloty workspaces" on public.sloty_workspaces;
create policy "service role manages sloty workspaces" on public.sloty_workspaces
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "sloty owner manages workspaces" on public.sloty_workspaces;
create policy "sloty owner manages workspaces" on public.sloty_workspaces
for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "sloty members can read workspaces" on public.sloty_workspaces;
create policy "sloty members can read workspaces" on public.sloty_workspaces
for select using (public.sloty_can_access_workspace(id));

drop policy if exists "service role manages sloty workspace members" on public.sloty_workspace_members;
create policy "service role manages sloty workspace members" on public.sloty_workspace_members
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "sloty members read workspace members" on public.sloty_workspace_members;
create policy "sloty members read workspace members" on public.sloty_workspace_members
for select using (public.sloty_can_access_workspace(workspace_id));

drop policy if exists "sloty managers manage workspace members" on public.sloty_workspace_members;
create policy "sloty managers manage workspace members" on public.sloty_workspace_members
for all using (public.sloty_can_manage_workspace(workspace_id)) with check (public.sloty_can_manage_workspace(workspace_id));

drop policy if exists "service role manages sloty bookings" on public.sloty_bookings;
create policy "service role manages sloty bookings" on public.sloty_bookings
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "sloty owner can read bookings" on public.sloty_bookings;
create policy "sloty owner can read bookings" on public.sloty_bookings
for select using (public.sloty_can_access_workspace(workspace_id));

drop policy if exists "sloty owner can manage bookings" on public.sloty_bookings;
create policy "sloty owner can manage bookings" on public.sloty_bookings
for all using (public.sloty_can_manage_workspace(workspace_id)) with check (public.sloty_can_manage_workspace(workspace_id));

drop policy if exists "service role manages sloty chat threads" on public.sloty_chat_threads;
create policy "service role manages sloty chat threads" on public.sloty_chat_threads
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "sloty owner can read chat threads" on public.sloty_chat_threads;
create policy "sloty owner can read chat threads" on public.sloty_chat_threads
for select using (public.sloty_can_access_workspace(workspace_id));

drop policy if exists "sloty owner can manage chat threads" on public.sloty_chat_threads;
create policy "sloty owner can manage chat threads" on public.sloty_chat_threads
for all using (public.sloty_can_manage_workspace(workspace_id)) with check (public.sloty_can_manage_workspace(workspace_id));

drop policy if exists "service role manages sloty chat messages" on public.sloty_chat_messages;
create policy "service role manages sloty chat messages" on public.sloty_chat_messages
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "sloty owner can read chat messages" on public.sloty_chat_messages;
create policy "sloty owner can read chat messages" on public.sloty_chat_messages
for select using (public.sloty_can_access_workspace(workspace_id));

drop policy if exists "sloty owner can manage chat messages" on public.sloty_chat_messages;
create policy "sloty owner can manage chat messages" on public.sloty_chat_messages
for all using (public.sloty_can_manage_workspace(workspace_id)) with check (public.sloty_can_manage_workspace(workspace_id));

drop policy if exists "service role manages support reports" on public.sloty_support_reports;
create policy "service role manages support reports" on public.sloty_support_reports
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "public can create support reports" on public.sloty_support_reports;
create policy "public can create support reports" on public.sloty_support_reports
for insert with check (true);

grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to authenticated, service_role;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges in schema public grant usage, select on sequences to authenticated, service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'sloty-public',
  'sloty-public',
  true,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "sloty public assets are readable" on storage.objects;
create policy "sloty public assets are readable"
on storage.objects for select
using (bucket_id = 'sloty-public');

drop policy if exists "service role manages sloty public assets" on storage.objects;
create policy "service role manages sloty public assets"
on storage.objects for all
using (bucket_id = 'sloty-public' and auth.role() = 'service_role')
with check (bucket_id = 'sloty-public' and auth.role() = 'service_role');


-- 20260501_0015_clickbook_analytics_clients_font_repair.sql
-- Normalize old MAX source values into VK and make legacy new statuses scheduled.
update public.sloty_bookings
set source = 'ВК', channel = 'vk'
where lower(coalesce(source, '')) in ('max', 'макс')
   or lower(coalesce(channel, '')) in ('max', 'макс');

update public.sloty_bookings
set status = 'confirmed'
where status = 'new';

commit;
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


-- 20260501_0015_clickbook_analytics_clients_font_repair.sql
-- Normalize old MAX source values into VK and make legacy new statuses scheduled.
update public.sloty_bookings
set source = 'ВК', channel = 'vk'
where lower(coalesce(source, '')) in ('max', 'макс')
   or lower(coalesce(channel, '')) in ('max', 'макс');

update public.sloty_bookings
set status = 'confirmed'
where status = 'new';

commit;
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


-- 20260501_0015_clickbook_analytics_clients_font_repair.sql
-- Normalize old MAX source values into VK and make legacy new statuses scheduled.
update public.sloty_bookings
set source = 'ВК', channel = 'vk'
where lower(coalesce(source, '')) in ('max', 'макс')
   or lower(coalesce(channel, '')) in ('max', 'макс');

update public.sloty_bookings
set status = 'confirmed'
where status = 'new';

commit;
-- ClickBook Telegram session hardening
-- Safe to run after 20260430_0007. It only adds missing columns/indexes/policies.

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
  chat_id bigint,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.sloty_telegram_accounts add column if not exists chat_id bigint;
alter table public.sloty_telegram_accounts add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.sloty_telegram_accounts add column if not exists updated_at timestamptz not null default timezone('utc', now());

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

alter table public.sloty_telegram_login_requests add column if not exists chat_id bigint;
alter table public.sloty_telegram_login_requests add column if not exists message_id bigint;
alter table public.sloty_telegram_login_requests add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.sloty_telegram_login_requests add column if not exists consumed_at timestamptz;
alter table public.sloty_telegram_login_requests add column if not exists updated_at timestamptz not null default timezone('utc', now());

create index if not exists sloty_telegram_accounts_user_idx
  on public.sloty_telegram_accounts (user_id);

create index if not exists sloty_telegram_accounts_chat_idx
  on public.sloty_telegram_accounts (chat_id)
  where chat_id is not null;

create index if not exists sloty_telegram_login_requests_token_idx
  on public.sloty_telegram_login_requests (token);

create index if not exists sloty_telegram_login_requests_status_idx
  on public.sloty_telegram_login_requests (status, expires_at);

create or replace function public.sloty_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_touch_sloty_telegram_accounts_updated_at on public.sloty_telegram_accounts;
create trigger trg_touch_sloty_telegram_accounts_updated_at
before update on public.sloty_telegram_accounts
for each row execute function public.sloty_touch_updated_at();

drop trigger if exists trg_touch_sloty_telegram_login_requests_updated_at on public.sloty_telegram_login_requests;
create trigger trg_touch_sloty_telegram_login_requests_updated_at
before update on public.sloty_telegram_login_requests
for each row execute function public.sloty_touch_updated_at();

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


-- 20260501_0015_clickbook_analytics_clients_font_repair.sql
-- Normalize old MAX source values into VK and make legacy new statuses scheduled.
update public.sloty_bookings
set source = 'ВК', channel = 'vk'
where lower(coalesce(source, '')) in ('max', 'макс')
   or lower(coalesce(channel, '')) in ('max', 'макс');

update public.sloty_bookings
set status = 'confirmed'
where status = 'new';

commit;
-- ClickBook real-data hardening
-- Keeps live mode connected to real bookings/availability and prevents double booking.

begin;

create extension if not exists pgcrypto;

alter table public.sloty_bookings add column if not exists duration_minutes integer;
alter table public.sloty_bookings add column if not exists price_amount numeric(12,2);
alter table public.sloty_bookings add column if not exists source text;
alter table public.sloty_bookings add column if not exists channel text;
alter table public.sloty_bookings add column if not exists metadata jsonb not null default '{}'::jsonb;

create unique index if not exists sloty_bookings_active_slot_unique
  on public.sloty_bookings (workspace_id, booking_date, booking_time)
  where status <> 'cancelled';

create index if not exists sloty_bookings_workspace_date_time_idx
  on public.sloty_bookings (workspace_id, booking_date, booking_time);

create index if not exists sloty_chat_threads_workspace_phone_idx
  on public.sloty_chat_threads (workspace_id, client_phone);

create index if not exists sloty_chat_messages_workspace_thread_idx
  on public.sloty_chat_messages (workspace_id, thread_id, created_at asc);

-- Optional normalized tables. The current app also stores editable sections in sloty_workspaces.data
-- for compatibility, but these tables are safe to keep for future API split.
create table if not exists public.sloty_services (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.sloty_workspaces(id) on delete cascade,
  name text not null,
  duration integer not null default 60,
  price numeric(12,2) not null default 0,
  status text not null default 'active' check (status in ('active', 'seasonal', 'draft')),
  visible boolean not null default true,
  category text,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (workspace_id, name)
);

-- Keep older service table versions compatible with live data screens.
alter table public.sloty_services add column if not exists duration integer not null default 60;
alter table public.sloty_services add column if not exists price numeric(12,2) not null default 0;
alter table public.sloty_services add column if not exists status text not null default 'active';
alter table public.sloty_services add column if not exists visible boolean not null default true;
alter table public.sloty_services add column if not exists category text;
alter table public.sloty_services add column if not exists sort_order integer not null default 0;
alter table public.sloty_services add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.sloty_services add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.sloty_services add column if not exists updated_at timestamptz not null default timezone('utc', now());

create table if not exists public.sloty_availability_days (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.sloty_workspaces(id) on delete cascade,
  weekday_index integer check (weekday_index between 0 and 6),
  date date,
  label text,
  status text not null default 'workday' check (status in ('workday', 'short', 'day-off')),
  slots jsonb not null default '[]'::jsonb,
  breaks jsonb not null default '[]'::jsonb,
  custom boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Existing ClickBook databases may already have this table from an older schema.
-- CREATE TABLE IF NOT EXISTS does not add missing columns, so keep the table shape aligned.
alter table public.sloty_availability_days add column if not exists weekday_index integer;
alter table public.sloty_availability_days add column if not exists date date;
alter table public.sloty_availability_days add column if not exists label text;
alter table public.sloty_availability_days add column if not exists status text not null default 'workday';
alter table public.sloty_availability_days add column if not exists slots jsonb not null default '[]'::jsonb;
alter table public.sloty_availability_days add column if not exists breaks jsonb not null default '[]'::jsonb;
alter table public.sloty_availability_days add column if not exists custom boolean not null default false;
alter table public.sloty_availability_days add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.sloty_availability_days add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.sloty_availability_days add column if not exists updated_at timestamptz not null default timezone('utc', now());

-- If an older schema used another weekday column name, copy it into the new field.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sloty_availability_days' and column_name = 'day_index'
  ) then
    execute 'update public.sloty_availability_days set weekday_index = day_index where weekday_index is null and day_index between 0 and 6';
  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sloty_availability_days' and column_name = 'day_of_week'
  ) then
    execute 'update public.sloty_availability_days set weekday_index = day_of_week where weekday_index is null and day_of_week between 0 and 6';
  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sloty_availability_days' and column_name = 'weekday'
  ) then
    execute 'update public.sloty_availability_days set weekday_index = weekday where weekday_index is null and weekday between 0 and 6';
  end if;
end $$;

do $$
begin
  alter table public.sloty_availability_days
    add constraint sloty_availability_days_weekday_index_check
    check (weekday_index is null or weekday_index between 0 and 6);
exception when duplicate_object then null;
end $$;

create unique index if not exists sloty_availability_days_weekday_unique
  on public.sloty_availability_days (workspace_id, weekday_index)
  where date is null;

create unique index if not exists sloty_availability_days_date_unique
  on public.sloty_availability_days (workspace_id, date)
  where date is not null;

create table if not exists public.sloty_message_templates (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.sloty_workspaces(id) on delete cascade,
  title text not null,
  channel text not null default 'Telegram',
  content text not null,
  variables jsonb not null default '[]'::jsonb,
  conversion text,
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Keep older template table versions compatible with live message templates.
alter table public.sloty_message_templates add column if not exists channel text not null default 'Telegram';
alter table public.sloty_message_templates add column if not exists content text;
alter table public.sloty_message_templates add column if not exists variables jsonb not null default '[]'::jsonb;
alter table public.sloty_message_templates add column if not exists conversion text;
alter table public.sloty_message_templates add column if not exists enabled boolean not null default true;
alter table public.sloty_message_templates add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.sloty_message_templates add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.sloty_message_templates add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.sloty_services enable row level security;
alter table public.sloty_availability_days enable row level security;
alter table public.sloty_message_templates enable row level security;

drop policy if exists "service role manages sloty services" on public.sloty_services;
create policy "service role manages sloty services" on public.sloty_services
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "sloty managers manage services" on public.sloty_services;
create policy "sloty managers manage services" on public.sloty_services
for all using (public.sloty_can_manage_workspace(workspace_id)) with check (public.sloty_can_manage_workspace(workspace_id));

drop policy if exists "service role manages sloty availability" on public.sloty_availability_days;
create policy "service role manages sloty availability" on public.sloty_availability_days
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "sloty managers manage availability" on public.sloty_availability_days;
create policy "sloty managers manage availability" on public.sloty_availability_days
for all using (public.sloty_can_manage_workspace(workspace_id)) with check (public.sloty_can_manage_workspace(workspace_id));

drop policy if exists "service role manages sloty templates" on public.sloty_message_templates;
create policy "service role manages sloty templates" on public.sloty_message_templates
for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "sloty managers manage templates" on public.sloty_message_templates;
create policy "sloty managers manage templates" on public.sloty_message_templates
for all using (public.sloty_can_manage_workspace(workspace_id)) with check (public.sloty_can_manage_workspace(workspace_id));

grant select, insert, update, delete on public.sloty_services to authenticated, service_role;
grant select, insert, update, delete on public.sloty_availability_days to authenticated, service_role;
grant select, insert, update, delete on public.sloty_message_templates to authenticated, service_role;


-- 20260501_0015_clickbook_analytics_clients_font_repair.sql
-- Normalize old MAX source values into VK and make legacy new statuses scheduled.
update public.sloty_bookings
set source = 'ВК', channel = 'vk'
where lower(coalesce(source, '')) in ('max', 'макс')
   or lower(coalesce(channel, '')) in ('max', 'макс');

update public.sloty_bookings
set status = 'confirmed'
where status = 'new';

commit;
-- ClickBook availability/service sync hardening
-- Safe to run repeatedly. It keeps the normalized live tables ready for public booking.

begin;

create extension if not exists pgcrypto;

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
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.sloty_services add column if not exists duration integer not null default 60;
alter table public.sloty_services add column if not exists price numeric(12,2) not null default 0;
alter table public.sloty_services add column if not exists status text not null default 'active';
alter table public.sloty_services add column if not exists visible boolean not null default true;
alter table public.sloty_services add column if not exists category text;
alter table public.sloty_services add column if not exists sort_order integer not null default 0;
alter table public.sloty_services add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.sloty_services add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.sloty_services add column if not exists updated_at timestamptz not null default timezone('utc', now());

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
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.sloty_availability_days add column if not exists weekday_index integer;
alter table public.sloty_availability_days add column if not exists date date;
alter table public.sloty_availability_days add column if not exists label text;
alter table public.sloty_availability_days add column if not exists status text not null default 'workday';
alter table public.sloty_availability_days add column if not exists slots jsonb not null default '[]'::jsonb;
alter table public.sloty_availability_days add column if not exists breaks jsonb not null default '[]'::jsonb;
alter table public.sloty_availability_days add column if not exists custom boolean not null default false;
alter table public.sloty_availability_days add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.sloty_availability_days add column if not exists created_at timestamptz not null default timezone('utc', now());
alter table public.sloty_availability_days add column if not exists updated_at timestamptz not null default timezone('utc', now());

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sloty_availability_days' and column_name = 'day_index'
  ) then
    execute 'update public.sloty_availability_days set weekday_index = day_index where weekday_index is null and day_index between 0 and 6';
  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sloty_availability_days' and column_name = 'day_of_week'
  ) then
    execute 'update public.sloty_availability_days set weekday_index = day_of_week where weekday_index is null and day_of_week between 0 and 6';
  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'sloty_availability_days' and column_name = 'weekday'
  ) then
    execute 'update public.sloty_availability_days set weekday_index = weekday where weekday_index is null and weekday between 0 and 6';
  end if;
end $$;

do $$
begin
  alter table public.sloty_availability_days
    add constraint sloty_availability_days_weekday_index_check
    check (weekday_index is null or weekday_index between 0 and 6);
exception when duplicate_object then null;
end $$;

create index if not exists sloty_services_workspace_idx on public.sloty_services (workspace_id, sort_order, name);
create index if not exists sloty_availability_days_workspace_idx on public.sloty_availability_days (workspace_id, date, weekday_index);
create unique index if not exists sloty_availability_days_weekday_unique
  on public.sloty_availability_days (workspace_id, weekday_index)
  where date is null;
create unique index if not exists sloty_availability_days_date_unique
  on public.sloty_availability_days (workspace_id, date)
  where date is not null;

grant select, insert, update, delete on public.sloty_services to authenticated, service_role;
grant select, insert, update, delete on public.sloty_availability_days to authenticated, service_role;


-- 20260501_0015_clickbook_analytics_clients_font_repair.sql
-- Normalize old MAX source values into VK and make legacy new statuses scheduled.
update public.sloty_bookings
set source = 'ВК', channel = 'vk'
where lower(coalesce(source, '')) in ('max', 'макс')
   or lower(coalesce(channel, '')) in ('max', 'макс');

update public.sloty_bookings
set status = 'confirmed'
where status = 'new';

commit;

-- 20260501_0011_clickbook_notifications_clients_repair.sql
begin;

alter table if exists public.sloty_booking_telegram_links
  add column if not exists chat_id bigint,
  add column if not exists telegram_id bigint,
  add column if not exists username text,
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists confirmed_at timestamptz,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table if exists public.sloty_chat_threads
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists bot_connected boolean not null default true;

alter table if exists public.sloty_chat_messages
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists delivery_state text,
  add column if not exists via_bot boolean not null default false;

alter table if exists public.sloty_chat_messages
  drop constraint if exists sloty_chat_messages_delivery_state_check;

alter table if exists public.sloty_chat_messages
  add constraint sloty_chat_messages_delivery_state_check
  check (delivery_state is null or delivery_state in ('queued', 'sent', 'delivered', 'read', 'failed'));

create index if not exists sloty_booking_telegram_links_workspace_chat_idx
  on public.sloty_booking_telegram_links(workspace_id, chat_id)
  where chat_id is not null;

create index if not exists sloty_booking_telegram_links_workspace_booking_idx
  on public.sloty_booking_telegram_links(workspace_id, booking_id)
  where booking_id is not null;


-- 20260501_0015_clickbook_analytics_clients_font_repair.sql
-- Normalize old MAX source values into VK and make legacy new statuses scheduled.
update public.sloty_bookings
set source = 'ВК', channel = 'vk'
where lower(coalesce(source, '')) in ('max', 'макс')
   or lower(coalesce(channel, '')) in ('max', 'макс');

update public.sloty_bookings
set status = 'confirmed'
where status = 'new';

commit;
-- 20260501_0012_clickbook_clients_chat_sources_repair.sql
begin;

-- Replace old MAX channel with VK and allow the current source/channel set.
update public.sloty_chat_threads
set channel = 'VK'
where channel = 'MAX';

alter table if exists public.sloty_chat_threads
  drop constraint if exists sloty_chat_threads_channel_check;

alter table if exists public.sloty_chat_threads
  add constraint sloty_chat_threads_channel_check
  check (channel in ('Telegram', 'Instagram', 'VK'));

-- Keep client CRM extras in workspace JSON. These columns are optional helpers for future normalized CRM screens.
alter table if exists public.sloty_clients add column if not exists note text;
alter table if exists public.sloty_clients add column if not exists reminder_text text;
alter table if exists public.sloty_clients add column if not exists reminder_at timestamptz;
alter table if exists public.sloty_clients add column if not exists source text;


-- 20260501_0015_clickbook_analytics_clients_font_repair.sql
-- Normalize old MAX source values into VK and make legacy new statuses scheduled.
update public.sloty_bookings
set source = 'ВК', channel = 'vk'
where lower(coalesce(source, '')) in ('max', 'макс')
   or lower(coalesce(channel, '')) in ('max', 'макс');

update public.sloty_bookings
set status = 'confirmed'
where status = 'new';

commit;
begin;

alter table public.sloty_bookings add column if not exists status text not null default 'new';
alter table public.sloty_bookings add column if not exists no_show_at timestamptz;
alter table public.sloty_bookings add column if not exists status_check_sent_at timestamptz;
alter table public.sloty_bookings add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.sloty_bookings add column if not exists source text;
alter table public.sloty_bookings add column if not exists channel text;
alter table public.sloty_bookings add column if not exists duration_minutes integer;
alter table public.sloty_bookings add column if not exists price_amount numeric(12,2);

alter table public.sloty_bookings drop constraint if exists sloty_bookings_status_check;
alter table public.sloty_bookings
  add constraint sloty_bookings_status_check
  check (status in ('new', 'confirmed', 'completed', 'no_show', 'cancelled'));

update public.sloty_bookings
set source = case
  when lower(coalesce(source, channel, '')) like '%инст%' or lower(coalesce(source, channel, '')) like '%insta%' then 'Инстаграм'
  when lower(coalesce(source, channel, '')) like '%vk%' or lower(coalesce(source, channel, '')) like '%вк%' or lower(coalesce(source, channel, '')) like '%max%' or lower(coalesce(source, channel, '')) like '%макс%' then 'ВК'
  else 'ТГ'
end,
channel = case
  when lower(coalesce(source, channel, '')) like '%инст%' or lower(coalesce(source, channel, '')) like '%insta%' then 'instagram'
  when lower(coalesce(source, channel, '')) like '%vk%' or lower(coalesce(source, channel, '')) like '%вк%' or lower(coalesce(source, channel, '')) like '%max%' or lower(coalesce(source, channel, '')) like '%макс%' then 'vk'
  else 'telegram'
end
where source is null
   or channel is null
   or lower(source) in ('max', 'макс')
   or lower(channel) in ('max', 'макс');

create index if not exists sloty_bookings_status_check_idx
  on public.sloty_bookings (workspace_id, status, booking_date, booking_time);


-- 20260501_0015_clickbook_analytics_clients_font_repair.sql
-- Normalize old MAX source values into VK and make legacy new statuses scheduled.
update public.sloty_bookings
set source = 'ВК', channel = 'vk'
where lower(coalesce(source, '')) in ('max', 'макс')
   or lower(coalesce(channel, '')) in ('max', 'макс');

update public.sloty_bookings
set status = 'confirmed'
where status = 'new';

commit;

-- ClickBook: simplify booking status logic and make revenue fact-based.
-- A booked slot is already accepted by the specialist schedule, so legacy "new"
-- bookings are converted to "confirmed/scheduled". Real revenue is counted in code
-- only after the visit is marked as completed.

begin;

alter table if exists public.sloty_bookings
  add column if not exists confirmed_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists no_show_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists status_check_sent_at timestamptz;

update public.sloty_bookings
set
  status = 'confirmed',
  confirmed_at = coalesce(confirmed_at, created_at, timezone('utc', now())),
  updated_at = timezone('utc', now())
where status = 'new';

-- Normalize visible client sources. MAX is temporarily disabled and folded into VK.
update public.sloty_bookings
set
  source = 'ВК',
  channel = 'vk',
  updated_at = timezone('utc', now())
where lower(coalesce(source, '')) in ('max', 'макс')
   or lower(coalesce(channel, '')) in ('max', 'макс');

-- Keep JSON fallback bookings in workspaces aligned with the same status model.
update public.sloty_workspaces workspace
set data = jsonb_set(
  coalesce(workspace.data, '{}'::jsonb),
  '{bookings}',
  coalesce((
    select jsonb_agg(
      case
        when booking_item->>'status' = 'new' then
          jsonb_set(
            jsonb_set(booking_item, '{status}', '"confirmed"'::jsonb, true),
            '{confirmedAt}',
            to_jsonb(coalesce(booking_item->>'confirmedAt', booking_item->>'createdAt', timezone('utc', now())::text)),
            true
          )
        when lower(coalesce(booking_item->>'source', '')) in ('max', 'макс')
          or lower(coalesce(booking_item->>'channel', '')) in ('max', 'макс') then
          jsonb_set(jsonb_set(booking_item, '{source}', '"ВК"'::jsonb, true), '{channel}', '"vk"'::jsonb, true)
        else booking_item
      end
      order by ordinality
    )
    from jsonb_array_elements(coalesce(workspace.data->'bookings', '[]'::jsonb)) with ordinality as items(booking_item, ordinality)
  ), '[]'::jsonb),
  true
)
where jsonb_typeof(coalesce(workspace.data->'bookings', '[]'::jsonb)) = 'array';

-- Refresh default template links and remove old placeholder domains.
update public.sloty_message_templates
set
  channel = case
    when lower(coalesce(channel, '')) like '%max%' then 'VK'
    when lower(coalesce(channel, '')) like '%vk%' or lower(coalesce(channel, '')) like '%вк%' then 'VK'
    else channel
  end,
  content = replace(replace(content, 'klikbuk.ru/book', 'https://www.кликбук.рф/m/{{slug}}'), 'klikbuk.com/book', 'https://www.кликбук.рф/m/{{slug}}'),
  updated_at = timezone('utc', now())
where true;


-- 20260501_0015_clickbook_analytics_clients_font_repair.sql
-- Normalize old MAX source values into VK and make legacy new statuses scheduled.
update public.sloty_bookings
set source = 'ВК', channel = 'vk'
where lower(coalesce(source, '')) in ('max', 'макс')
   or lower(coalesce(channel, '')) in ('max', 'макс');

update public.sloty_bookings
set status = 'confirmed'
where status = 'new';

commit;

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
-- 20260502_0019_clickbook_real_subscriptions.sql
-- Real persistent ClickBook subscriptions: Start by default, paid plans only when the DB says so.

create extension if not exists pgcrypto;

create or replace function public.sloty_now_utc()
returns timestamptz
language sql
stable
as $$
  select timezone('utc', now())::timestamptz;
$$;

create table if not exists public.sloty_workspace_subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.sloty_workspaces(id) on delete cascade,
  plan text not null default 'start',
  status text not null default 'active',
  billing_cycle text not null default 'monthly',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  provider text not null default 'manual',
  payment_method_label text,
  provider_customer_id text,
  provider_subscription_id text,
  trial_ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default public.sloty_now_utc(),
  updated_at timestamptz not null default public.sloty_now_utc(),
  unique (workspace_id)
);

alter table public.sloty_workspace_subscriptions add column if not exists plan text;
alter table public.sloty_workspace_subscriptions add column if not exists status text;
alter table public.sloty_workspace_subscriptions add column if not exists billing_cycle text;
alter table public.sloty_workspace_subscriptions add column if not exists current_period_start timestamptz;
alter table public.sloty_workspace_subscriptions add column if not exists current_period_end timestamptz;
alter table public.sloty_workspace_subscriptions add column if not exists cancel_at_period_end boolean;
alter table public.sloty_workspace_subscriptions add column if not exists provider text;
alter table public.sloty_workspace_subscriptions add column if not exists payment_method_label text;
alter table public.sloty_workspace_subscriptions add column if not exists provider_customer_id text;
alter table public.sloty_workspace_subscriptions add column if not exists provider_subscription_id text;
alter table public.sloty_workspace_subscriptions add column if not exists trial_ends_at timestamptz;
alter table public.sloty_workspace_subscriptions add column if not exists metadata jsonb;
alter table public.sloty_workspace_subscriptions add column if not exists created_at timestamptz;
alter table public.sloty_workspace_subscriptions add column if not exists updated_at timestamptz;

-- If an older DB used plan_id instead of plan, copy it without referencing a missing column statically.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'sloty_workspace_subscriptions'
      and column_name = 'plan_id'
  ) then
    execute 'update public.sloty_workspace_subscriptions set plan = coalesce(nullif(plan, ''''), nullif(plan_id, ''''), ''start'')';
  end if;
end $$;

update public.sloty_workspace_subscriptions
set
  plan = case
    when lower(coalesce(plan, '')) in ('free', 'base', 'basic', 'starter', 'start') then 'start'
    when lower(plan) in ('pro', 'studio', 'premium') then lower(plan)
    else 'start'
  end,
  status = case
    when lower(coalesce(status, '')) in ('active', 'trialing', 'past_due', 'cancelled', 'inactive') then lower(status)
    else 'active'
  end,
  billing_cycle = case
    when lower(coalesce(billing_cycle, '')) = 'yearly' then 'yearly'
    else 'monthly'
  end,
  current_period_start = coalesce(current_period_start, public.sloty_now_utc()),
  cancel_at_period_end = coalesce(cancel_at_period_end, false),
  provider = coalesce(nullif(provider, ''), 'manual'),
  metadata = coalesce(metadata, '{}'::jsonb),
  created_at = coalesce(created_at, public.sloty_now_utc()),
  updated_at = public.sloty_now_utc();

alter table public.sloty_workspace_subscriptions alter column plan set default 'start';
alter table public.sloty_workspace_subscriptions alter column plan set not null;
alter table public.sloty_workspace_subscriptions alter column status set default 'active';
alter table public.sloty_workspace_subscriptions alter column status set not null;
alter table public.sloty_workspace_subscriptions alter column billing_cycle set default 'monthly';
alter table public.sloty_workspace_subscriptions alter column billing_cycle set not null;
alter table public.sloty_workspace_subscriptions alter column cancel_at_period_end set default false;
alter table public.sloty_workspace_subscriptions alter column cancel_at_period_end set not null;
alter table public.sloty_workspace_subscriptions alter column provider set default 'manual';
alter table public.sloty_workspace_subscriptions alter column provider set not null;
alter table public.sloty_workspace_subscriptions alter column metadata set default '{}'::jsonb;
alter table public.sloty_workspace_subscriptions alter column metadata set not null;
alter table public.sloty_workspace_subscriptions alter column created_at set default public.sloty_now_utc();
alter table public.sloty_workspace_subscriptions alter column created_at set not null;
alter table public.sloty_workspace_subscriptions alter column updated_at set default public.sloty_now_utc();
alter table public.sloty_workspace_subscriptions alter column updated_at set not null;

alter table public.sloty_workspace_subscriptions drop constraint if exists sloty_workspace_subscriptions_plan_check;
alter table public.sloty_workspace_subscriptions
  add constraint sloty_workspace_subscriptions_plan_check
  check (plan in ('start', 'pro', 'studio', 'premium'));

alter table public.sloty_workspace_subscriptions drop constraint if exists sloty_workspace_subscriptions_status_check;
alter table public.sloty_workspace_subscriptions
  add constraint sloty_workspace_subscriptions_status_check
  check (status in ('active', 'trialing', 'past_due', 'cancelled', 'inactive'));

alter table public.sloty_workspace_subscriptions drop constraint if exists sloty_workspace_subscriptions_billing_cycle_check;
alter table public.sloty_workspace_subscriptions
  add constraint sloty_workspace_subscriptions_billing_cycle_check
  check (billing_cycle in ('monthly', 'yearly'));

create unique index if not exists sloty_workspace_subscriptions_workspace_unique
  on public.sloty_workspace_subscriptions (workspace_id);
create index if not exists sloty_workspace_subscriptions_plan_status_idx
  on public.sloty_workspace_subscriptions (plan, status);

create table if not exists public.sloty_subscription_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.sloty_workspaces(id) on delete cascade,
  subscription_id uuid references public.sloty_workspace_subscriptions(id) on delete cascade,
  event_type text not null,
  amount numeric(12,2) not null default 0,
  currency text not null default 'RUB',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default public.sloty_now_utc()
);

alter table public.sloty_subscription_events add column if not exists workspace_id uuid references public.sloty_workspaces(id) on delete cascade;
alter table public.sloty_subscription_events add column if not exists subscription_id uuid references public.sloty_workspace_subscriptions(id) on delete cascade;
alter table public.sloty_subscription_events add column if not exists event_type text;
alter table public.sloty_subscription_events add column if not exists amount numeric(12,2);
alter table public.sloty_subscription_events add column if not exists currency text;
alter table public.sloty_subscription_events add column if not exists metadata jsonb;
alter table public.sloty_subscription_events add column if not exists created_at timestamptz;

update public.sloty_subscription_events
set
  event_type = coalesce(nullif(event_type, ''), 'subscription_event'),
  amount = coalesce(amount, 0),
  currency = coalesce(nullif(currency, ''), 'RUB'),
  metadata = coalesce(metadata, '{}'::jsonb),
  created_at = coalesce(created_at, public.sloty_now_utc());

alter table public.sloty_subscription_events alter column event_type set not null;
alter table public.sloty_subscription_events alter column amount set default 0;
alter table public.sloty_subscription_events alter column amount set not null;
alter table public.sloty_subscription_events alter column currency set default 'RUB';
alter table public.sloty_subscription_events alter column currency set not null;
alter table public.sloty_subscription_events alter column metadata set default '{}'::jsonb;
alter table public.sloty_subscription_events alter column metadata set not null;
alter table public.sloty_subscription_events alter column created_at set default public.sloty_now_utc();
alter table public.sloty_subscription_events alter column created_at set not null;

create index if not exists sloty_subscription_events_workspace_created_idx
  on public.sloty_subscription_events (workspace_id, created_at desc);
create index if not exists sloty_subscription_events_subscription_idx
  on public.sloty_subscription_events (subscription_id, created_at desc);

-- Every existing workspace gets Start unless it already has a subscription.
insert into public.sloty_workspace_subscriptions (
  workspace_id,
  plan,
  status,
  billing_cycle,
  current_period_start,
  current_period_end,
  cancel_at_period_end,
  provider,
  payment_method_label,
  metadata
)
select
  w.id,
  'start',
  'active',
  'monthly',
  public.sloty_now_utc(),
  null,
  false,
  'manual',
  null,
  jsonb_build_object('planId', 'start', 'planName', 'Start', 'source', 'migration_default')
from public.sloty_workspaces w
where not exists (
  select 1
  from public.sloty_workspace_subscriptions s
  where s.workspace_id = w.id
)
on conflict (workspace_id) do nothing;

insert into public.sloty_subscription_events (
  workspace_id,
  subscription_id,
  event_type,
  amount,
  currency,
  metadata
)
select
  s.workspace_id,
  s.id,
  'subscription_created',
  0,
  'RUB',
  jsonb_build_object('planId', s.plan, 'planName', initcap(s.plan), 'status', s.status, 'method', 'migration')
from public.sloty_workspace_subscriptions s
where not exists (
  select 1
  from public.sloty_subscription_events e
  where e.subscription_id = s.id
    and e.event_type = 'subscription_created'
);

-- Keep updated_at fresh when the subscription changes.
create or replace function public.sloty_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = public.sloty_now_utc();
  return new;
end;
$$;

drop trigger if exists sloty_workspace_subscriptions_touch_updated_at on public.sloty_workspace_subscriptions;
create trigger sloty_workspace_subscriptions_touch_updated_at
before update on public.sloty_workspace_subscriptions
for each row execute function public.sloty_touch_updated_at();

alter table public.sloty_workspace_subscriptions enable row level security;
alter table public.sloty_subscription_events enable row level security;

-- MVP works through service_role in API routes. Keep read policies permissive for owner-based future Supabase client reads.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'sloty_workspace_subscriptions'
      and policyname = 'sloty_workspace_subscriptions_service_role_all'
  ) then
    create policy sloty_workspace_subscriptions_service_role_all
      on public.sloty_workspace_subscriptions
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'sloty_subscription_events'
      and policyname = 'sloty_subscription_events_service_role_all'
  ) then
    create policy sloty_subscription_events_service_role_all
      on public.sloty_subscription_events
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end $$;


-- =============================================================
-- 20260502_0020_clickbook_vk_id_auth.sql
-- =============================================================
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
-- 20260503_0028_clickbook_client_actions_cleanup.sql
-- Normalize real client sources after Telegram/VK confirmation actions.
-- VK wins if the booking has both a Telegram and a VK confirmation link.

alter table if exists public.sloty_bookings add column if not exists source text;
alter table if exists public.sloty_bookings add column if not exists channel text;

update public.sloty_bookings b
set channel = 'telegram',
    updated_at = now()
where exists (
  select 1
  from public.sloty_booking_telegram_links l
  where l.booking_id = b.id
    and l.status = 'confirmed'
    and l.chat_id is not null
);

update public.sloty_bookings b
set channel = 'vk',
    updated_at = now()
where exists (
  select 1
  from public.sloty_booking_vk_links l
  where l.booking_id = b.id
    and l.status = 'confirmed'
    and l.peer_id is not null
);

update public.sloty_chat_threads t
set channel = 'VK',
    updated_at = now()
where metadata ? 'clientVkPeerId'
   or metadata ? 'clientVkUserId';

update public.sloty_chat_threads t
set channel = 'Telegram',
    updated_at = now()
where (metadata ? 'clientTelegramChatId' or metadata ? 'clientTelegramId')
  and not (metadata ? 'clientVkPeerId' or metadata ? 'clientVkUserId');

