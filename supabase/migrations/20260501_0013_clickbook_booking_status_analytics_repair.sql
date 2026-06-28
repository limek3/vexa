begin;

alter table public.sloty_bookings add column if not exists status text not null default 'new';
alter table public.sloty_bookings add column if not exists no_show_at timestamptz;
alter table public.sloty_bookings add column if not exists status_check_sent_at timestamptz;
alter table public.sloty_bookings add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.sloty_bookings add column if not exists source text;
alter table public.sloty_bookings add column if not exists channel text;
alter table public.sloty_bookings add column if not exists duration_minutes integer;
alter table public.sloty_bookings add column if not exists price_amount numeric(12,2);


update public.sloty_bookings
set status = case
  when status in ('new', 'confirmed', 'completed', 'no_show', 'cancelled') then status
  when status in ('done', 'visited', 'finished', 'paid') then 'completed'
  when status in ('missed', 'noshow', 'no-show') then 'no_show'
  when status in ('canceled', 'cancelled_by_client') then 'cancelled'
  else 'new'
end
where status is null
   or status not in ('new', 'confirmed', 'completed', 'no_show', 'cancelled');

alter table public.sloty_bookings drop constraint if exists sloty_bookings_status_check;
alter table public.sloty_bookings
  add constraint sloty_bookings_status_check
  check (status in ('new', 'confirmed', 'completed', 'no_show', 'cancelled'));

update public.sloty_bookings
set source = case
  when lower(coalesce(source, channel, '')) like '%инст%' or lower(coalesce(source, channel, '')) like '%insta%' then 'Инстаграм'
  when lower(coalesce(source, channel, '')) like '%vk%' or lower(coalesce(source, channel, '')) like '%вк%' or lower(coalesce(source, channel, '')) like '%max%' or lower(coalesce(source, channel, '')) like '%макс%' then 'ВК'
  else 'ТГ'
end,
channel = case
  when lower(coalesce(source, channel, '')) like '%инст%' or lower(coalesce(source, channel, '')) like '%insta%' then 'instagram'
  when lower(coalesce(source, channel, '')) like '%vk%' or lower(coalesce(source, channel, '')) like '%вк%' or lower(coalesce(source, channel, '')) like '%max%' or lower(coalesce(source, channel, '')) like '%макс%' then 'vk'
  else 'telegram'
end
where source is null
   or channel is null
   or lower(source) in ('max', 'макс')
   or lower(channel) in ('max', 'макс');

create index if not exists sloty_bookings_status_check_idx
  on public.sloty_bookings (workspace_id, status, booking_date, booking_time);

commit;
