-- ClickBook analytics/clients cleanup migration
-- Safe to run multiple times.

begin;

-- Normalize old MAX source values into VK.
update public.sloty_bookings
set source = 'ВК', channel = 'vk'
where lower(coalesce(source, '')) in ('max', 'макс')
   or lower(coalesce(channel, '')) in ('max', 'макс');

-- Planned bookings are not revenue. Keep status simple: scheduled until arrival/no-show/cancelled.
update public.sloty_bookings
set status = 'confirmed'
where status = 'new';

commit;
