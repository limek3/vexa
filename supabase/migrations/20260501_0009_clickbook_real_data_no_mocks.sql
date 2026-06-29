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

commit;
