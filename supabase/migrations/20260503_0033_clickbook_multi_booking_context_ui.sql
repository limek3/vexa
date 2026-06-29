-- ClickBook multi-booking context repair.
-- Keeps several bookings for one client separated by booking_id and stores selected Telegram chat context.

begin;

alter table if exists public.sloty_booking_telegram_links
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table if exists public.sloty_booking_vk_links
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table if exists public.sloty_chat_threads
  add column if not exists metadata jsonb not null default '{}'::jsonb;

commit;

do $$
begin
  if to_regclass('public.sloty_booking_telegram_links') is not null then
    execute 'create index if not exists sloty_booking_telegram_links_active_context_idx on public.sloty_booking_telegram_links (chat_id, status, ((metadata->>''activeChatContextAt'')) desc) where chat_id is not null';
  end if;

  if to_regclass('public.sloty_chat_threads') is not null then
    execute 'create index if not exists sloty_chat_threads_client_booking_ctx_idx on public.sloty_chat_threads (workspace_id, client_phone, ((metadata->>''bookingId'')))';
  end if;
end $$;

-- Refresh visible booking context on old threads after the new UI starts showing several records per client.
do $$
begin
  if to_regclass('public.sloty_chat_threads') is not null
     and to_regclass('public.sloty_bookings') is not null then
    update public.sloty_chat_threads t
    set metadata =
      coalesce(t.metadata, '{}'::jsonb)
      || jsonb_build_object(
        'bookingId', b.id::text,
        'bookingIds', jsonb_build_array(b.id::text),
        'bookingCode', '#CB-' || upper(substr(regexp_replace(b.id::text, '[^a-zA-Z0-9]', '', 'g'), 1, 6)),
        'service', b.service,
        'services', jsonb_build_array(coalesce(nullif(b.service, ''), 'Услуга не указана')),
        'bookingDate', b.booking_date::text,
        'bookingTime', b.booking_time,
        'source', coalesce(b.source, t.source, 'Web'),
        'channel', b.channel
      ),
      next_visit = coalesce(t.next_visit, b.booking_date),
      updated_at = timezone('utc', now())
    from public.sloty_bookings b
    where t.workspace_id = b.workspace_id
      and (
        t.metadata->>'bookingId' = b.id::text
        or t.id::text = ('booking-thread-' || b.id::text)
      );
  end if;
end $$;
