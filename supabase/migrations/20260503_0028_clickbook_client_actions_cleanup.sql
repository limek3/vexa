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
