import { NextResponse } from 'next/server';

import type { Booking } from '@/lib/types';
import type { ChatChannel, ChatDeliveryState, ChatSegment, ChatThreadRecord } from '@/lib/chat-types';
import { requireAuthUser } from '@/lib/server/require-auth-user';
import { sendClientTelegramMessage } from '@/lib/server/client-telegram';
import { sendClientVkMessage } from '@/lib/server/client-vk';
import { isNotificationEnabled } from '@/lib/server/notification-settings';
import { listBookingsByWorkspace } from '@/lib/server/supabase-bookings';
import {
  createChatMessage,
  createChatThread,
  deleteChatThread,
  fetchChatThreadByBookingId,
  listChatsForWorkspace,
  listChatMessages,
  updateChatThread,
} from '@/lib/server/supabase-chats';
import { fetchWorkspaceForUser, updateWorkspace } from '@/lib/server/supabase-workspaces';
import {
  buildTelegramRescheduleProposalReplyMarkup,
  buildVkRescheduleProposalKeyboard,
  createRescheduleProposal,
} from '@/lib/server/booking-reschedule-proposals';
import { bookingMasterToClientText, bookingMessageText, bookingShortContext, bookingThreadMetadata } from '@/lib/server/booking-context';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function mergeBookings(tableBookings: Booking[], jsonBookings: Booking[]) {
  const map = new Map<string, Booking>();

  for (const booking of [...jsonBookings, ...tableBookings]) {
    if (!booking?.id) continue;
    map.set(booking.id, booking);
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}


function chatChannelFromBooking(booking: Booking): ChatChannel {
  const raw = `${booking.channel ?? ''} ${booking.source ?? ''}`.toLowerCase();

  if (raw.includes('vk') || raw.includes('вк')) return 'VK';
  if (raw.includes('telegram') || raw.includes('tg') || raw.includes('телеграм') || raw.includes('тг')) return 'Telegram';
  if (raw.includes('web') || raw.includes('site') || raw.includes('сайт') || raw.includes('публич')) return 'Web';

  return 'Web';
}

function botConnectedFromChannel(channel: ChatChannel) {
  return channel !== 'Web';
}


type ChatBookingContext = {
  id: string;
  code?: string | null;
  service?: string | null;
  services?: string[];
  date?: string | null;
  time?: string | null;
  masterName?: string | null;
};

function normalizeClientPhone(value?: string | null) {
  return String(value ?? '').replace(/\D+/g, '');
}

function clientThreadKey(thread: Pick<ChatThreadRecord, 'clientPhone' | 'clientName' | 'metadata'>) {
  const keys = clientThreadKeys(thread as Pick<ChatThreadRecord, 'clientPhone' | 'clientName' | 'metadata'>);
  return keys[0] ?? '';
}

function metadataString(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(Math.trunc(value));
  if (typeof value === 'string' && value.trim()) return value.trim();
  return '';
}

function normalizedName(value?: string | null) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function clientThreadKeys(thread: Pick<ChatThreadRecord, 'clientPhone' | 'clientName' | 'metadata'>) {
  const keys = new Set<string>();
  const phone = normalizeClientPhone(thread.clientPhone);
  const name = normalizedName(thread.clientName);
  const telegramChatId = metadataString(thread.metadata?.clientTelegramChatId);
  const vkPeerId = metadataString(thread.metadata?.clientVkPeerId);
  const vkUserId = metadataString(thread.metadata?.clientVkUserId);

  if (phone) keys.add(`phone:${phone}`);
  if (telegramChatId) keys.add(`tg:${telegramChatId}`);
  if (vkPeerId) keys.add(`vkpeer:${vkPeerId}`);
  if (vkUserId) keys.add(`vk:${vkUserId}`);
  if (name) keys.add(`name:${name}`);

  return Array.from(keys);
}

function uniqueStrings(values: unknown[]) {
  const seen = new Set<string>();
  const next: string[] = [];

  values.forEach((value) => {
    if (typeof value !== 'string') return;
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    next.push(trimmed);
  });

  return next;
}

function bookingContextsFromMetadata(metadata?: Record<string, unknown> | null) {
  const contexts: ChatBookingContext[] = [];

  const rawContexts = metadata?.bookingContexts;
  if (Array.isArray(rawContexts)) {
    rawContexts.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const row = item as Record<string, unknown>;
      const id = typeof row.id === 'string' ? row.id : typeof row.bookingId === 'string' ? row.bookingId : '';
      if (!id) return;
      contexts.push({
        id,
        code: typeof row.code === 'string' ? row.code : typeof row.bookingCode === 'string' ? row.bookingCode : null,
        service: typeof row.service === 'string' ? row.service : null,
        services: Array.isArray(row.services)
          ? row.services.filter((service): service is string => typeof service === 'string' && service.trim().length > 0)
          : typeof row.service === 'string'
            ? [row.service]
            : [],
        date: typeof row.date === 'string' ? row.date : typeof row.bookingDate === 'string' ? row.bookingDate : null,
        time: typeof row.time === 'string' ? row.time : typeof row.bookingTime === 'string' ? row.bookingTime : null,
        masterName: typeof row.masterName === 'string' ? row.masterName : null,
      });
    });
  }

  const bookingId = typeof metadata?.bookingId === 'string' ? metadata.bookingId : '';
  if (bookingId && !contexts.some((context) => context.id === bookingId)) {
    const services = Array.isArray(metadata?.services)
      ? metadata.services.filter((service): service is string => typeof service === 'string' && service.trim().length > 0)
      : typeof metadata?.service === 'string'
        ? [metadata.service]
        : [];

    contexts.push({
      id: bookingId,
      code: typeof metadata?.bookingCode === 'string' ? metadata.bookingCode : null,
      service: typeof metadata?.service === 'string' ? metadata.service : services[0] ?? null,
      services,
      date: typeof metadata?.bookingDate === 'string' ? metadata.bookingDate : null,
      time: typeof metadata?.bookingTime === 'string' ? metadata.bookingTime : null,
      masterName: typeof metadata?.masterName === 'string' ? metadata.masterName : null,
    });
  }

  return contexts;
}

function contextFromBooking(booking: Booking): ChatBookingContext {
  const metadata = bookingThreadMetadata(booking);
  return {
    id: booking.id,
    code: typeof metadata.bookingCode === 'string' ? metadata.bookingCode : null,
    service: booking.service,
    services: Array.isArray(metadata.services) ? metadata.services as string[] : [booking.service].filter(Boolean),
    date: booking.date,
    time: booking.time,
    masterName: typeof metadata.masterName === 'string' ? metadata.masterName : null,
  };
}

function mergeBookingContexts(contexts: ChatBookingContext[]) {
  const map = new Map<string, ChatBookingContext>();

  contexts.forEach((context) => {
    if (!context.id) return;
    const current = map.get(context.id);
    map.set(context.id, {
      ...(current ?? {}),
      ...context,
      services: uniqueStrings([...(current?.services ?? []), ...(context.services ?? []), context.service ?? '']),
    });
  });

  return Array.from(map.values()).sort((left, right) => {
    const leftDate = `${left.date ?? ''} ${left.time ?? ''}`;
    const rightDate = `${right.date ?? ''} ${right.time ?? ''}`;
    return rightDate.localeCompare(leftDate);
  });
}

function mergeThreadMessages(threads: ChatThreadRecord[]) {
  const seen = new Set<string>();
  const messages = threads.flatMap((thread) => thread.messages ?? []);

  return messages
    .filter((message) => {
      const normalizedBody = message.body.replace(/\s+/g, ' ').trim();
      const key = [message.author, normalizedBody, Math.floor(new Date(message.createdAt).getTime() / 1000)].join('|');
      if (seen.has(message.id) || seen.has(key)) return false;
      seen.add(message.id);
      seen.add(key);
      return true;
    })
    .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
}

function mergeThreadsByClient(threads: ChatThreadRecord[]) {
  const groups: ChatThreadRecord[][] = [];
  const keyToGroupIndex = new Map<string, number>();

  threads.forEach((thread) => {
    const keys = clientThreadKeys(thread);

    if (keys.length === 0) {
      groups.push([thread]);
      return;
    }

    const matchingIndexes = Array.from(new Set(keys
      .map((key) => keyToGroupIndex.get(key))
      .filter((index): index is number => typeof index === 'number')));

    if (matchingIndexes.length === 0) {
      const index = groups.length;
      groups.push([thread]);
      keys.forEach((key) => keyToGroupIndex.set(key, index));
      return;
    }

    const primaryIndex = matchingIndexes[0];
    groups[primaryIndex].push(thread);

    for (const mergeIndex of matchingIndexes.slice(1).sort((a, b) => b - a)) {
      if (mergeIndex === primaryIndex) continue;
      const moving = groups[mergeIndex];
      groups[primaryIndex].push(...moving);
      groups.splice(mergeIndex, 1);

      for (const [key, index] of Array.from(keyToGroupIndex.entries())) {
        if (index === mergeIndex) keyToGroupIndex.set(key, primaryIndex);
        if (index > mergeIndex) keyToGroupIndex.set(key, index - 1);
      }
    }

    keys.forEach((key) => keyToGroupIndex.set(key, primaryIndex));
  });

  const result: ChatThreadRecord[] = [];

  for (const group of groups) {
    const sorted = [...group].sort((left, right) => new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime());
    const primary = sorted[0];
    const contexts = mergeBookingContexts(sorted.flatMap((item) => bookingContextsFromMetadata(item.metadata)));
    const messages = mergeThreadMessages(sorted);
    const lastMessage = messages.at(-1);
    const bookingIds = uniqueStrings([
      ...sorted.flatMap((item) => Array.isArray(item.metadata?.bookingIds) ? item.metadata.bookingIds : []),
      ...contexts.map((context) => context.id),
      ...sorted.map((item) => typeof item.metadata?.bookingId === 'string' ? item.metadata.bookingId : ''),
    ]);
    const nonWebChannel = sorted.find((item) => item.channel !== 'Web')?.channel ?? primary.channel;
    const bestPhone = sorted.find((item) => normalizeClientPhone(item.clientPhone))?.clientPhone ?? primary.clientPhone;
    const bestName = sorted.find((item) => normalizedName(item.clientName))?.clientName ?? primary.clientName;

    result.push({
      ...primary,
      clientName: bestName,
      clientPhone: bestPhone,
      channel: nonWebChannel,
      botConnected: sorted.some((item) => item.botConnected),
      isPriority: sorted.some((item) => item.isPriority),
      segment: sorted.some((item) => item.segment === 'new') ? 'new' : primary.segment,
      unreadCount: sorted.reduce((sum, item) => sum + (item.unreadCount ?? 0), 0),
      lastMessagePreview: lastMessage?.body ?? primary.lastMessagePreview,
      lastMessageAt: lastMessage?.createdAt ?? primary.lastMessageAt,
      messages,
      metadata: {
        ...(primary.metadata ?? {}),
        clientTelegramChatId: sorted.find((item) => item.metadata?.clientTelegramChatId)?.metadata?.clientTelegramChatId ?? primary.metadata?.clientTelegramChatId,
        clientTelegramId: sorted.find((item) => item.metadata?.clientTelegramId)?.metadata?.clientTelegramId ?? primary.metadata?.clientTelegramId,
        clientVkPeerId: sorted.find((item) => item.metadata?.clientVkPeerId)?.metadata?.clientVkPeerId ?? primary.metadata?.clientVkPeerId,
        clientVkUserId: sorted.find((item) => item.metadata?.clientVkUserId)?.metadata?.clientVkUserId ?? primary.metadata?.clientVkUserId,
        bookingId: typeof primary.metadata?.bookingId === 'string' ? primary.metadata.bookingId : bookingIds[0] ?? undefined,
        bookingIds,
        bookingContexts: contexts,
        mergedThreadIds: sorted.map((item) => item.id),
      },
    });
  }

  return result.sort((left, right) => new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime());
}

function bookingContextMessagePrefix(booking: Booking, text: string) {
  return bookingMessageText({
    title: 'Сообщение от мастера',
    booking,
    footer: ['Сообщение:', text].join('\n'),
  });
}

function synthesizeThreadsFromBookings(workspaceId: string, bookings: Booking[]): ChatThreadRecord[] {
  return bookings.map((booking) => {
    const body = `Новая запись: ${bookingShortContext(booking)}`;
    const channel = chatChannelFromBooking(booking);

    return {
      id: `booking-thread-${booking.id}`,
      workspaceId,
      clientName: booking.clientName,
      clientPhone: booking.clientPhone,
      channel,
      segment: 'new',
      source: booking.source ?? (channel === 'Web' ? 'Web' : 'Публичная страница'),
      nextVisit: booking.date,
      isPriority: false,
      botConnected: botConnectedFromChannel(channel),
      lastMessagePreview: booking.comment || body,
      lastMessageAt: booking.createdAt,
      unreadCount: 1,
      createdAt: booking.createdAt,
      updatedAt: booking.createdAt,
      metadata: {
        fallback: true,
        ...bookingThreadMetadata(booking),
        bookingContexts: [contextFromBooking(booking)],
      },
      messages: [
        {
          id: `booking-message-${booking.id}`,
          threadId: `booking-thread-${booking.id}`,
          author: 'client' as const,
          body,
          deliveryState: null,
          viaBot: false,
          createdAt: booking.createdAt,
          metadata: {
            bookingId: booking.id,
            service: booking.service,
            date: booking.date,
            time: booking.time,
          },
        },
        ...(booking.comment
          ? [
              {
                id: `booking-comment-${booking.id}`,
                threadId: `booking-thread-${booking.id}`,
                author: 'client' as const,
                body: booking.comment,
                deliveryState: null,
                viaBot: false,
                createdAt: booking.createdAt,
                metadata: {
                  bookingId: booking.id,
                  kind: 'comment',
                },
              },
            ]
          : []),
      ],
    } satisfies ChatThreadRecord;
  });
}

function chatThreadIdentities(thread: ChatThreadRecord) {
  const ids = new Set<string>([`id:${thread.id}`]);

  if (typeof thread.metadata?.bookingId === 'string') {
    ids.add(`booking:${thread.metadata.bookingId}`);
  }

  if (Array.isArray(thread.metadata?.bookingIds)) {
    thread.metadata.bookingIds.forEach((item) => {
      if (typeof item === 'string' && item.trim()) ids.add(`booking:${item}`);
    });
  }

  return ids;
}

function chatThreadIdentity(thread: ChatThreadRecord) {
  return Array.from(chatThreadIdentities(thread))[0] || thread.id;
}

function getDeletedChatKeys(workspace: { data?: Record<string, unknown> | null }) {
  const raw = workspace.data?.deletedChatKeys;
  return new Set(
    Array.isArray(raw)
      ? raw.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [],
  );
}

function chatDeleteKeys(thread: Pick<ChatThreadRecord, 'id' | 'clientPhone' | 'clientName' | 'metadata'>) {
  const bookingId = typeof thread.metadata?.bookingId === 'string' ? thread.metadata.bookingId : null;
  const bookingIds = Array.isArray(thread.metadata?.bookingIds)
    ? thread.metadata.bookingIds.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];

  return [
    `id:${thread.id}`,
    `client:${clientThreadKey(thread)}`,
    bookingId ? `booking:${bookingId}` : null,
    ...bookingIds.map((id) => `booking:${id}`),
  ].filter(Boolean) as string[];
}

function isThreadDeleted(thread: ChatThreadRecord, deletedKeys: Set<string>) {
  return chatDeleteKeys(thread).some((key) => deletedKeys.has(key));
}

function mergePersistedAndFallbackThreads(
  threads: ChatThreadRecord[],
  fallbackThreads: ChatThreadRecord[],
  deletedKeys = new Set<string>(),
) {
  const visibleThreads = threads.filter((thread) => !isThreadDeleted(thread, deletedKeys));
  const seen = new Set<string>();

  visibleThreads.forEach((thread) => {
    chatThreadIdentities(thread).forEach((identity) => seen.add(identity));
  });

  return mergeThreadsByClient([
    ...visibleThreads,
    ...fallbackThreads.filter((thread) => {
      const identities = Array.from(chatThreadIdentities(thread));
      return !identities.some((identity) => seen.has(identity)) && !isThreadDeleted(thread, deletedKeys);
    }),
  ]);
}

async function getMergedBookings(workspace: NonNullable<Awaited<ReturnType<typeof fetchWorkspaceForUser>>>) {
  const jsonBookings = Array.isArray(workspace.data?.bookings)
    ? (workspace.data.bookings as Booking[])
    : [];
  const tableBookings = await listBookingsByWorkspace(workspace.id).catch(() => [] as Booking[]);
  return mergeBookings(tableBookings, jsonBookings);
}

function getBookingThreadKey(threadId: string) {
  return threadId.startsWith('booking-thread-') ? threadId.replace(/^booking-thread-/, '') : null;
}

function findBookingForThread(threadId: string, bookings: Booking[]) {
  const key = getBookingThreadKey(threadId);
  if (!key) return null;

  return bookings.find((booking) => booking.id === key) ?? null;
}


function threadMatchesBookingClient(thread: ChatThreadRecord, booking: Booking) {
  const phone = normalizeClientPhone(booking.clientPhone);
  const threadPhone = normalizeClientPhone(thread.clientPhone);
  const name = normalizedName(booking.clientName);
  const threadName = normalizedName(thread.clientName);

  return Boolean(
    (phone && threadPhone && phone === threadPhone) ||
    (phone && Array.isArray(thread.metadata?.bookingContexts) && JSON.stringify(thread.metadata.bookingContexts).includes(phone)) ||
    (name && threadName && name === threadName),
  );
}

function appendBookingContextMetadata(base: Record<string, unknown> | null | undefined, booking: Booking) {
  const currentContexts = bookingContextsFromMetadata(base ?? {});
  const currentBookingIds = Array.isArray(base?.bookingIds)
    ? base.bookingIds.filter((item): item is string => typeof item === 'string')
    : [];
  const nextContexts = mergeBookingContexts([...currentContexts, contextFromBooking(booking)]);

  return {
    ...(base ?? {}),
    ...bookingThreadMetadata(booking, null, base ?? {}),
    bookingIds: uniqueStrings([...currentBookingIds, booking.id]),
    bookingContexts: nextContexts,
    activeBookingId: booking.id,
  };
}

async function findExistingClientThread(workspaceId: string, booking: Booking) {
  const threads = await listChatsForWorkspace(workspaceId).catch(() => [] as ChatThreadRecord[]);
  const byBooking = threads.find((thread) => {
    const ids = Array.isArray(thread.metadata?.bookingIds)
      ? thread.metadata.bookingIds.filter((item): item is string => typeof item === 'string')
      : [];
    return thread.metadata?.bookingId === booking.id || ids.includes(booking.id);
  });

  if (byBooking) return byBooking;

  return threads.find((thread) => threadMatchesBookingClient(thread, booking)) ?? null;
}

async function resolveThreadForMessage(params: {
  workspaceId: string;
  threadId: string;
  bookings: Booking[];
}) {
  const currentThreads = await listChatsForWorkspace(params.workspaceId).catch(() => [] as ChatThreadRecord[]);
  const current = currentThreads.find((thread) => thread.id === params.threadId);
  if (current) return current;

  const booking = findBookingForThread(params.threadId, params.bookings);
  if (!booking) return null;

  const bookingIds = [booking.id];

  const existing = await findExistingClientThread(params.workspaceId, booking);

  if (existing) {
    const metadata = appendBookingContextMetadata(existing.metadata, booking);
    await updateChatThread(params.workspaceId, existing.id, {
      clientName: existing.clientName || booking.clientName,
      clientPhone: existing.clientPhone || booking.clientPhone,
      nextVisit: existing.nextVisit ?? booking.date,
      botConnected: existing.botConnected,
      metadata,
    }).catch(() => null);
    return {
      ...existing,
      clientName: existing.clientName || booking.clientName,
      clientPhone: existing.clientPhone || booking.clientPhone,
      nextVisit: existing.nextVisit ?? booking.date,
      metadata,
      messages: existing.messages ?? [],
    } satisfies ChatThreadRecord;
  }

  const channel = chatChannelFromBooking(booking);

  const created = await createChatThread(params.workspaceId, {
    clientName: booking.clientName,
    clientPhone: booking.clientPhone,
    channel,
    segment: 'active',
    source: booking.source ?? (channel === 'Web' ? 'Web' : 'Публичная страница'),
    nextVisit: booking.date,
    botConnected: botConnectedFromChannel(channel),
    lastMessagePreview: `Новая запись: ${booking.service} · ${booking.date} ${booking.time}`,
    lastMessageAt: booking.createdAt,
    unreadCount: 0,
    metadata: {
      ...appendBookingContextMetadata(bookingThreadMetadata(booking), booking),
      createdFromFallbackThread: true,
    },
  });

  return created ? { ...created, messages: [] } : null;
}

function getThreadBookingId(thread: ChatThreadRecord | null, bookings: Booking[], requestedBookingId?: string | null) {
  const bookingIds = Array.isArray(thread?.metadata?.bookingIds)
    ? thread?.metadata?.bookingIds.filter((item): item is string => typeof item === 'string')
    : [];

  if (requestedBookingId && (bookingIds.includes(requestedBookingId) || bookings.some((booking) => booking.id === requestedBookingId))) {
    return requestedBookingId;
  }

  const activeBookingId = typeof thread?.metadata?.activeBookingId === 'string' ? thread.metadata.activeBookingId : null;
  if (activeBookingId && (bookingIds.length === 0 || bookingIds.includes(activeBookingId))) return activeBookingId;

  const metadataBookingId = typeof thread?.metadata?.bookingId === 'string' ? thread.metadata.bookingId : null;
  if (metadataBookingId) return metadataBookingId;

  return bookingIds[0] ?? null;
}

function isDuplicateOutgoingMessage(params: {
  author: 'master' | 'system';
  text: string;
  clientMessageKey?: string | null;
  message: { author: string; body: string; createdAt: string; metadata?: Record<string, unknown> };
}) {
  if (params.message.author !== params.author) return false;

  const metadata = params.message.metadata ?? {};
  if (params.clientMessageKey && metadata.clientMessageKey === params.clientMessageKey) return true;

  const left = (params.message.body ?? '').replace(/\s+/g, ' ').trim();
  const right = params.text.replace(/\s+/g, ' ').trim();
  if (!left || left !== right) return false;

  const createdAt = new Date(params.message.createdAt).getTime();
  if (!Number.isFinite(createdAt)) return true;

  return Math.abs(Date.now() - createdAt) < 3 * 60 * 1000;
}

export async function GET() {
  try {
    const user = await requireAuthUser();
    const workspace = await fetchWorkspaceForUser(user);

    if (!workspace) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const bookings = await getMergedBookings(workspace);
    const fallbackThreads = synthesizeThreadsFromBookings(workspace.id, bookings);

    try {
      const threads = await listChatsForWorkspace(workspace.id);
      return NextResponse.json({
        workspaceId: workspace.id,
        threads: mergePersistedAndFallbackThreads(threads, fallbackThreads, getDeletedChatKeys(workspace)),
      });
    } catch {
      return NextResponse.json({
        workspaceId: workspace.id,
        threads: mergeThreadsByClient(fallbackThreads.filter((thread) => !isThreadDeleted(thread, getDeletedChatKeys(workspace)))),
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    if (message === 'unauthorized') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuthUser();
    const workspace = await fetchWorkspaceForUser(user);

    if (!workspace) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const bodyType = body.type === 'thread' ? 'thread' : body.type === 'message' ? 'message' : undefined;

    if (bodyType === 'thread') {
      const clientName = typeof body.clientName === 'string' ? body.clientName.trim() : '';
      const clientPhone = typeof body.clientPhone === 'string' ? body.clientPhone.trim() : '';
      const channel: ChatChannel = body.channel === 'VK' ? 'VK' : body.channel === 'Instagram' ? 'Instagram' : body.channel === 'Web' ? 'Web' : 'Telegram';

      if (!clientName || !clientPhone) {
        return NextResponse.json({ error: 'client_name_and_phone_required' }, { status: 400 });
      }

      const thread = await createChatThread(workspace.id, {
        clientName,
        clientPhone,
        channel,
        botConnected: botConnectedFromChannel(channel),
        segment: 'new',
        unreadCount: 0,
      });

      return NextResponse.json({ thread });
    }

    const threadId = typeof body.threadId === 'string' ? body.threadId : '';
    const text = typeof body.body === 'string' ? body.body.trim() : '';
    const author: 'master' | 'system' = body.author === 'system' ? 'system' : 'master';
    const viaBot = body.viaBot === true;
    const rescheduleProposal =
      body.rescheduleProposal && typeof body.rescheduleProposal === 'object'
        ? (body.rescheduleProposal as Record<string, unknown>)
        : null;
    const proposedDate = typeof rescheduleProposal?.date === 'string' ? rescheduleProposal.date : '';
    const proposedTime = typeof rescheduleProposal?.time === 'string' && rescheduleProposal.time
      ? rescheduleProposal.time
      : '12:30';

    const clientMessageKey = typeof body.clientMessageKey === 'string' ? body.clientMessageKey : null;
    const requestedBookingId = typeof body.bookingId === 'string' ? body.bookingId : null;

    const requestedDeliveryState: ChatDeliveryState | null =
      body.deliveryState === 'queued' ||
      body.deliveryState === 'sent' ||
      body.deliveryState === 'delivered' ||
      body.deliveryState === 'read' ||
      body.deliveryState === 'failed'
        ? body.deliveryState
        : null;

    if (!threadId || !text) {
      return NextResponse.json({ error: 'thread_id_and_body_required' }, { status: 400 });
    }

    const bookings = await getMergedBookings(workspace);
    const thread = await resolveThreadForMessage({
      workspaceId: workspace.id,
      threadId,
      bookings,
    });

    if (!thread) {
      return NextResponse.json({ error: 'thread_not_found' }, { status: 404 });
    }

    const recentMessages = await listChatMessages(workspace.id, [thread.id]).catch(() => []);
    const duplicateMessage = [...recentMessages]
      .reverse()
      .find((message) => isDuplicateOutgoingMessage({ author, text, clientMessageKey, message }));

    if (duplicateMessage) {
      return NextResponse.json({
        message: duplicateMessage,
        threadId: thread.id,
        duplicate: true,
        telegramDelivered: false,
        vkDelivered: false,
        rescheduleProposalId: null,
      });
    }

    const canSendToClient = isNotificationEnabled(workspace, {
      id: 'chat-message',
      titleIncludes: 'чат',
      audience: 'client',
      fallback: true,
    });

    const bookingId = getThreadBookingId(thread, bookings, requestedBookingId);
    let outgoingText = text;
    let rescheduleProposalId: string | null = null;
    let telegramReplyMarkup: Record<string, unknown> | undefined;
    let vkKeyboard: Record<string, unknown> | undefined;

    if (bookingId && proposedDate) {
      const proposal = await createRescheduleProposal({
        workspaceId: workspace.id,
        threadId: thread.id,
        bookingId,
        proposedDate,
        proposedTime,
        message: text,
      }).catch(() => null);

      if (proposal) {
        outgoingText = proposal.text;
        rescheduleProposalId = proposal.proposal.id;
        telegramReplyMarkup = buildTelegramRescheduleProposalReplyMarkup(proposal.proposal.id);
        vkKeyboard = buildVkRescheduleProposalKeyboard(proposal.proposal.id);
      }
    }

    const bookingForOutgoing = bookingId ? bookings.find((booking) => booking.id === bookingId) ?? null : null;

    if (bookingForOutgoing && !rescheduleProposalId && author === 'master') {
      outgoingText = bookingContextMessagePrefix(bookingForOutgoing, text);
    }

    const telegramDelivered = canSendToClient && thread.channel === 'Telegram'
      ? await sendClientTelegramMessage({
          workspaceId: workspace.id,
          bookingId,
          clientPhone: thread.clientPhone,
          clientName: thread.clientName,
          directChatId:
            typeof thread.metadata?.clientTelegramChatId === 'number' || typeof thread.metadata?.clientTelegramChatId === 'string'
              ? thread.metadata.clientTelegramChatId
              : null,
          text: outgoingText,
          replyMarkup: telegramReplyMarkup,
        }).catch(() => false)
      : false;

    const vkDelivered = canSendToClient && thread.channel === 'VK'
      ? await sendClientVkMessage({
          workspaceId: workspace.id,
          bookingId,
          clientPhone: thread.clientPhone,
          clientName: thread.clientName,
          directPeerId:
            typeof thread.metadata?.clientVkPeerId === 'number' || typeof thread.metadata?.clientVkPeerId === 'string'
              ? thread.metadata.clientVkPeerId
              : null,
          text: outgoingText,
          keyboard: vkKeyboard,
        }).catch(() => false)
      : false;

    const deliveredToClient = telegramDelivered || vkDelivered;

    const deliveryState: ChatDeliveryState | null = deliveredToClient
      ? 'delivered'
      : thread.channel === 'Web'
        ? 'queued'
        : requestedDeliveryState ?? (viaBot ? 'queued' : 'sent');

    const message = await createChatMessage(workspace.id, {
      threadId: thread.id,
      author,
      body: text,
      deliveryState,
      viaBot: viaBot || deliveredToClient,
      metadata: {
        bookingId,
        sentToClientTelegram: telegramDelivered,
        sentToClientVk: vkDelivered,
        sourceThreadId: threadId,
        ...(clientMessageKey ? { clientMessageKey } : {}),
        ...(rescheduleProposalId ? { kind: 'reschedule_proposal', rescheduleProposalId, proposedDate, proposedTime } : {}),
      },
    });

    await updateChatThread(workspace.id, thread.id, {
      lastMessagePreview: text,
      lastMessageAt: message?.createdAt ?? new Date().toISOString(),
      unreadCount: 0,
      segment: author === 'system' ? 'followup' : 'active',
      botConnected: deliveredToClient || thread.botConnected,
      metadata: {
        ...(thread.metadata ?? {}),
        ...(bookingId ? { activeBookingId: bookingId } : {}),
        lastTelegramDelivery: telegramDelivered ? 'delivered' : thread.channel === 'Telegram' ? 'queued' : 'not_needed',
        lastVkDelivery: vkDelivered ? 'delivered' : thread.channel === 'VK' ? 'queued' : 'not_needed',
        webFallback: thread.channel === 'Web' ? 'phone_contact_required' : undefined,
        ...(rescheduleProposalId ? {
          rescheduleProposalId,
          rescheduleProposalStatus: 'pending',
          rescheduleProposalDate: proposedDate,
          rescheduleProposalTime: proposedTime,
          activeAlert: {
            type: 'reschedule_request',
            status: 'proposal_sent',
            bookingId,
            proposalId: rescheduleProposalId,
            createdAt: new Date().toISOString(),
            message: `Клиенту предложен перенос на ${proposedDate} ${proposedTime}. Ждём подтверждение.`,
          },
        } : {}),
      },
    });

    return NextResponse.json({ message, threadId: thread.id, telegramDelivered, vkDelivered, rescheduleProposalId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    if (message === 'unauthorized') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAuthUser();
    const workspace = await fetchWorkspaceForUser(user);

    if (!workspace) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const body = (await request.json()) as {
      threadId?: string;
      patch?: Partial<{
        clientName: string;
        clientPhone: string;
        channel: ChatChannel;
        segment: ChatSegment;
        nextVisit: string | null;
        isPriority: boolean;
        botConnected: boolean;
        unreadCount: number;
      }>;
    };

    if (!body.threadId || !body.patch) {
      return NextResponse.json({ error: 'thread_id_and_patch_required' }, { status: 400 });
    }

    const thread = await updateChatThread(workspace.id, body.threadId, body.patch);
    return NextResponse.json({ thread });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    if (message === 'unauthorized') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireAuthUser();
    const workspace = await fetchWorkspaceForUser(user);

    if (!workspace) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const body = (await request.json()) as {
      threadId?: string;
    };

    if (!body.threadId) {
      return NextResponse.json({ error: 'thread_id_required' }, { status: 400 });
    }

    const bookings = await getMergedBookings(workspace);
    const fallbackThreads = synthesizeThreadsFromBookings(workspace.id, bookings);
    const persistedThreads = await listChatsForWorkspace(workspace.id).catch(() => [] as ChatThreadRecord[]);
    const targetThread =
      persistedThreads.find((thread) => thread.id === body.threadId) ??
      fallbackThreads.find((thread) => thread.id === body.threadId);

    const nextDeletedKeys = Array.from(
      new Set([
        ...getDeletedChatKeys(workspace),
        ...(targetThread ? chatDeleteKeys(targetThread) : [`id:${body.threadId}`]),
      ]),
    );

    await updateWorkspace(workspace.id, {
      data: {
        ...(workspace.data ?? {}),
        deletedChatKeys: nextDeletedKeys,
      },
    }).catch(() => undefined);

    await deleteChatThread(workspace.id, body.threadId).catch(() => undefined);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    if (message === 'unauthorized') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
