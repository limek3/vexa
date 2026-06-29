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

commit;
