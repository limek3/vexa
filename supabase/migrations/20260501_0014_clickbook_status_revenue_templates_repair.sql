-- ClickBook: simplify booking status logic and make revenue fact-based.
-- A booked slot is already accepted by the specialist schedule, so legacy "new"
-- bookings are converted to "confirmed/scheduled". Real revenue is counted in code
-- only after the visit is marked as completed.

begin;

alter table if exists public.sloty_bookings
  add column if not exists confirmed_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists no_show_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists status_check_sent_at timestamptz;

update public.sloty_bookings
set
  status = 'confirmed',
  confirmed_at = coalesce(confirmed_at, created_at, timezone('utc', now())),
  updated_at = timezone('utc', now())
where status = 'new';

-- Normalize visible client sources. MAX is temporarily disabled and folded into VK.
update public.sloty_bookings
set
  source = 'ВК',
  channel = 'vk',
  updated_at = timezone('utc', now())
where lower(coalesce(source, '')) in ('max', 'макс')
   or lower(coalesce(channel, '')) in ('max', 'макс');

-- Keep JSON fallback bookings in workspaces aligned with the same status model.
update public.sloty_workspaces workspace
set data = jsonb_set(
  coalesce(workspace.data, '{}'::jsonb),
  '{bookings}',
  coalesce((
    select jsonb_agg(
      case
        when booking_item->>'status' = 'new' then
          jsonb_set(
            jsonb_set(booking_item, '{status}', '"confirmed"'::jsonb, true),
            '{confirmedAt}',
            to_jsonb(coalesce(booking_item->>'confirmedAt', booking_item->>'createdAt', timezone('utc', now())::text)),
            true
          )
        when lower(coalesce(booking_item->>'source', '')) in ('max', 'макс')
          or lower(coalesce(booking_item->>'channel', '')) in ('max', 'макс') then
          jsonb_set(jsonb_set(booking_item, '{source}', '"ВК"'::jsonb, true), '{channel}', '"vk"'::jsonb, true)
        else booking_item
      end
      order by ordinality
    )
    from jsonb_array_elements(coalesce(workspace.data->'bookings', '[]'::jsonb)) with ordinality as items(booking_item, ordinality)
  ), '[]'::jsonb),
  true
)
where jsonb_typeof(coalesce(workspace.data->'bookings', '[]'::jsonb)) = 'array';

-- Refresh default template links and remove old placeholder domains.
update public.sloty_message_templates
set
  channel = case
    when lower(coalesce(channel, '')) like '%max%' then 'VK'
    when lower(coalesce(channel, '')) like '%vk%' or lower(coalesce(channel, '')) like '%вк%' then 'VK'
    else channel
  end,
  content = replace(replace(content, 'klikbuk.ru/book', 'https://www.кликбук.рф/m/{{slug}}'), 'klikbuk.com/book', 'https://www.кликбук.рф/m/{{slug}}'),
  updated_at = timezone('utc', now())
where true;

commit;
