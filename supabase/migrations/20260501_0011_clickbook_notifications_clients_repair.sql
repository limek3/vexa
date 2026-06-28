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

commit;
