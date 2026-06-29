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
