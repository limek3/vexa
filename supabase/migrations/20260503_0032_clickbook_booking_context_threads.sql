-- ClickBook booking context repair.
-- One booking must have its own chat context, while source and communication channel stay separate.

begin;

alter table if exists public.sloty_chat_threads
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists source text,
  add column if not exists next_visit date,
  add column if not exists bot_connected boolean not null default true;

alter table if exists public.sloty_chat_messages
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table if exists public.sloty_booking_telegram_links
  add column if not exists confirmed_at timestamptz,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table if exists public.sloty_booking_vk_links
  add column if not exists confirmed_at timestamptz,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

commit;

-- Indexes are wrapped because expression indexes cannot be created with IF TABLE EXISTS syntax.
do $$
begin
  if to_regclass('public.sloty_chat_threads') is not null then
    execute 'create index if not exists sloty_chat_threads_workspace_booking_ctx_idx on public.sloty_chat_threads (workspace_id, ((metadata->>''bookingId'')))';
    execute 'create index if not exists sloty_chat_threads_metadata_gin_idx on public.sloty_chat_threads using gin (metadata)';
  end if;

  if to_regclass('public.sloty_chat_messages') is not null then
    execute 'create index if not exists sloty_chat_messages_metadata_booking_idx on public.sloty_chat_messages (((metadata->>''bookingId'')))';
  end if;

  if to_regclass('public.sloty_booking_telegram_links') is not null then
    execute 'create index if not exists sloty_booking_telegram_links_chat_status_idx on public.sloty_booking_telegram_links (chat_id, status, confirmed_at desc) where chat_id is not null';
  end if;

  if to_regclass('public.sloty_booking_vk_links') is not null then
    execute 'create index if not exists sloty_booking_vk_links_peer_status_idx on public.sloty_booking_vk_links (peer_id, status, confirmed_at desc) where peer_id is not null';
  end if;
end $$;

-- Backfill booking metadata for threads that already reference a booking id.
do $$
begin
  if to_regclass('public.sloty_chat_threads') is not null
     and to_regclass('public.sloty_bookings') is not null then

    update public.sloty_chat_threads t
    set
      source = coalesce(t.source, b.source, 'Web'),
      next_visit = coalesce(t.next_visit, b.booking_date),
      metadata =
        coalesce(t.metadata, '{}'::jsonb)
        || jsonb_build_object(
          'bookingId', b.id::text,
          'bookingIds', jsonb_build_array(b.id::text),
          'bookingCode', '#CB-' || upper(substr(regexp_replace(b.id::text, '[^a-zA-Z0-9]', '', 'g'), 1, 6)),
          'masterSlug', b.master_slug,
          'masterName', coalesce(w.profile->>'name', b.master_slug, 'мастер'),
          'service', b.service,
          'services', jsonb_build_array(b.service),
          'bookingDate', b.booking_date::text,
          'bookingTime', b.booking_time,
          'source', coalesce(b.source, t.source, 'Web'),
          'channel', b.channel
        ),
      updated_at = timezone('utc', now())
    from public.sloty_bookings b
    left join public.sloty_workspaces w on w.id = b.workspace_id
    where t.workspace_id = b.workspace_id
      and (
        t.metadata->>'bookingId' = b.id::text
        or (
          jsonb_typeof(t.metadata->'bookingIds') = 'array'
          and (t.metadata->'bookingIds') ? b.id::text
        )
      );

    -- For old phone-based threads without booking context, attach the closest matching booking.
    -- This avoids losing old chats while new code creates one thread per booking.
    with candidates as (
      select distinct on (t.id)
        t.id as thread_id,
        b.id as booking_id,
        b.workspace_id,
        b.master_slug,
        b.client_name,
        b.client_phone,
        b.service,
        b.booking_date,
        b.booking_time,
        b.source,
        b.channel,
        w.profile
      from public.sloty_chat_threads t
      join public.sloty_bookings b
        on b.workspace_id = t.workspace_id
       and regexp_replace(coalesce(b.client_phone, ''), '[^0-9]', '', 'g') = regexp_replace(coalesce(t.client_phone, ''), '[^0-9]', '', 'g')
      left join public.sloty_workspaces w on w.id = b.workspace_id
      where coalesce(t.metadata, '{}'::jsonb)->>'bookingId' is null
      order by
        t.id,
        case when t.next_visit is not null and b.booking_date = t.next_visit then 0 else 1 end,
        b.booking_date desc,
        b.booking_time desc,
        b.created_at desc
    )
    update public.sloty_chat_threads t
    set
      source = coalesce(t.source, c.source, 'Web'),
      next_visit = coalesce(t.next_visit, c.booking_date),
      metadata =
        coalesce(t.metadata, '{}'::jsonb)
        || jsonb_build_object(
          'bookingId', c.booking_id::text,
          'bookingIds', jsonb_build_array(c.booking_id::text),
          'bookingCode', '#CB-' || upper(substr(regexp_replace(c.booking_id::text, '[^a-zA-Z0-9]', '', 'g'), 1, 6)),
          'masterSlug', c.master_slug,
          'masterName', coalesce(c.profile->>'name', c.master_slug, 'мастер'),
          'service', c.service,
          'services', jsonb_build_array(c.service),
          'bookingDate', c.booking_date::text,
          'bookingTime', c.booking_time,
          'source', coalesce(c.source, t.source, 'Web'),
          'channel', c.channel
        ),
      updated_at = timezone('utc', now())
    from candidates c
    where t.id = c.thread_id;
  end if;
end $$;
