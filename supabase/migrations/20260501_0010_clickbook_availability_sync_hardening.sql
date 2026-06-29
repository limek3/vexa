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

commit;
