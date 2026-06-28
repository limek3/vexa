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
  status text not null default 'new' check (status in ('new', 'confirmed', 'completed', 'cancelled')),
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

alter table public.sloty_bookings drop constraint if exists sloty_bookings_status_check;
alter table public.sloty_bookings add constraint sloty_bookings_status_check check (status in ('new', 'confirmed', 'completed', 'cancelled'));

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

commit;
