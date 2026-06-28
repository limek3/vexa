-- ClickBook VK bot send diagnostics
-- No destructive changes. Keeps the debug table available for incoming and outgoing VK bot events.

create table if not exists public.sloty_vk_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_type text,
  group_id bigint,
  vk_user_id text,
  peer_id bigint,
  text text,
  ref text,
  status text not null default 'received',
  error text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists sloty_vk_webhook_events_created_idx
  on public.sloty_vk_webhook_events(created_at desc);

create index if not exists sloty_vk_webhook_events_user_idx
  on public.sloty_vk_webhook_events(vk_user_id);

alter table public.sloty_vk_webhook_events enable row level security;

do $$
begin
  create policy "sloty_vk_webhook_events_service_role_all"
    on public.sloty_vk_webhook_events
    for all
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');
exception
  when duplicate_object then null;
end $$;
