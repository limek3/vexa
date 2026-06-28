-- ClickBook: client-confirmed reschedule proposals from chat

create table if not exists public.sloty_booking_reschedule_proposals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.sloty_workspaces(id) on delete cascade,
  thread_id uuid null references public.sloty_chat_threads(id) on delete set null,
  booking_id uuid not null references public.sloty_bookings(id) on delete cascade,
  proposed_date date not null,
  proposed_time text not null,
  message text null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')),
  response_source text null check (response_source in ('telegram', 'vk')),
  responded_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.sloty_booking_reschedule_proposals enable row level security;

create index if not exists idx_sloty_booking_reschedule_proposals_workspace
  on public.sloty_booking_reschedule_proposals(workspace_id, created_at desc);

create index if not exists idx_sloty_booking_reschedule_proposals_booking
  on public.sloty_booking_reschedule_proposals(booking_id, created_at desc);

create index if not exists idx_sloty_booking_reschedule_proposals_status
  on public.sloty_booking_reschedule_proposals(status, created_at desc);

drop policy if exists "Service role can manage booking reschedule proposals" on public.sloty_booking_reschedule_proposals;
create policy "Service role can manage booking reschedule proposals"
  on public.sloty_booking_reschedule_proposals
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Workspace owners can read booking reschedule proposals" on public.sloty_booking_reschedule_proposals;
create policy "Workspace owners can read booking reschedule proposals"
  on public.sloty_booking_reschedule_proposals
  for select
  using (
    exists (
      select 1
      from public.sloty_workspaces w
      where w.id = sloty_booking_reschedule_proposals.workspace_id
        and w.owner_id = auth.uid()
    )
  );

alter table public.sloty_bookings add column if not exists cancel_reason text;
alter table public.sloty_bookings add column if not exists metadata jsonb not null default '{}'::jsonb;
