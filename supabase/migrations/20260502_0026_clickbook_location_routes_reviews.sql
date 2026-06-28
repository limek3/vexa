-- ClickBook — address/routes + token review links after completed visits.

create table if not exists public.sloty_booking_review_links (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  workspace_id uuid not null references public.sloty_workspaces(id) on delete cascade,
  booking_id uuid not null references public.sloty_bookings(id) on delete cascade,
  master_slug text not null,
  client_name text,
  service text,
  status text not null default 'pending' check (status in ('pending', 'sent', 'submitted', 'expired')),
  rating numeric,
  review_text text,
  review_id text,
  expires_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sloty_booking_review_links add column if not exists token text;
alter table public.sloty_booking_review_links add column if not exists workspace_id uuid references public.sloty_workspaces(id) on delete cascade;
alter table public.sloty_booking_review_links add column if not exists booking_id uuid references public.sloty_bookings(id) on delete cascade;
alter table public.sloty_booking_review_links add column if not exists master_slug text;
alter table public.sloty_booking_review_links add column if not exists client_name text;
alter table public.sloty_booking_review_links add column if not exists service text;
alter table public.sloty_booking_review_links add column if not exists status text not null default 'pending';
alter table public.sloty_booking_review_links add column if not exists rating numeric;
alter table public.sloty_booking_review_links add column if not exists review_text text;
alter table public.sloty_booking_review_links add column if not exists review_id text;
alter table public.sloty_booking_review_links add column if not exists expires_at timestamptz;
alter table public.sloty_booking_review_links add column if not exists submitted_at timestamptz;
alter table public.sloty_booking_review_links add column if not exists created_at timestamptz not null default now();
alter table public.sloty_booking_review_links add column if not exists updated_at timestamptz not null default now();

create unique index if not exists sloty_booking_review_links_token_key
  on public.sloty_booking_review_links(token);

create index if not exists sloty_booking_review_links_workspace_idx
  on public.sloty_booking_review_links(workspace_id, created_at desc);

create index if not exists sloty_booking_review_links_booking_idx
  on public.sloty_booking_review_links(booking_id, status);

create or replace function public.touch_sloty_booking_review_links_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_sloty_booking_review_links_updated_at on public.sloty_booking_review_links;
create trigger trg_touch_sloty_booking_review_links_updated_at
before update on public.sloty_booking_review_links
for each row
execute function public.touch_sloty_booking_review_links_updated_at();

alter table public.sloty_booking_review_links enable row level security;

drop policy if exists "service role manages sloty booking review links" on public.sloty_booking_review_links;
create policy "service role manages sloty booking review links"
on public.sloty_booking_review_links
for all
to service_role
using (true)
with check (true);
