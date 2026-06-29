import { NextResponse } from 'next/server';

import { isSlotAvailable, normalizeAvailabilityDays, normalizeServiceDetails } from '@/lib/availability';
import { buildWorkspaceSeed } from '@/lib/workspace-store';
import type { Booking } from '@/lib/types';
import type { ChatChannel } from '@/lib/chat-types';
import { requireAuthUser } from '@/lib/server/require-auth-user';
import { createClientTelegramBookingLink, notifyWorkspaceOwnerAboutBooking } from '@/lib/server/booking-telegram';
import { createClientVkBookingLink, notifyWorkspaceOwnerAboutBookingVk } from '@/lib/server/booking-vk';
import { sendClientTelegramMessage } from '@/lib/server/client-telegram';
import { sendClientVkMessage } from '@/lib/server/client-vk';
import { isNotificationEnabled } from '@/lib/server/notification-settings';
import { createBookingRecord, listBookingsByWorkspace, updateBookingRecord } from '@/lib/server/supabase-bookings';
import {
  createChatMessage,
  createChatThread,
  fetchChatThreadByBookingId,
  updateChatThread,
} from '@/lib/server/supabase-chats';
import { upsertClientFromBooking, type ClientSourceChannel } from '@/lib/server/supabase-clients';
import { listAvailabilityDays, listServices } from '@/lib/server/supabase-workspace-sections';
import {
  fetchWorkspaceForUser,
  fetchWorkspaceBySlug,
  updateWorkspace,
} from '@/lib/server/supabase-workspaces';
import { bookingMessageText, bookingShortContext, bookingThreadMetadata } from '@/lib/server/booking-context';
import {
  buildTelegramRescheduleProposalReplyMarkup,
  buildVkRescheduleProposalKeyboard,
  createRescheduleProposal,
} from '@/lib/server/booking-reschedule-proposals';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type BookingSourceInfo = {
  channel: ClientSourceChannel;
  source: 'Web' | 'Telegram' | 'VK';
  chatChannel: ChatChannel;
  botConnected: boolean;
  communicationScenario: string;
};

function normalizeIncomingChannel(value: unknown, source: unknown): ClientSourceChannel {
  const raw = `${typeof value === 'string' ? value : ''} ${typeof source === 'string' ? source : ''}`.trim().toLowerCase();

  if (raw.includes('vk') || raw.includes('вк')) return 'vk';
  if (raw.includes('tg') || raw.includes('telegram') || raw.includes('телеграм')) return 'telegram';
  return 'web';
}

function getBookingSourceInfo(value: unknown, source: unknown): BookingSourceInfo {
  const channel = normalizeIncomingChannel(value, source);

  if (channel === 'telegram') {
    return {
      channel,
      source: 'Telegram',
      chatChannel: 'Telegram',
      botConnected: true,
      communicationScenario: 'telegram_bot',
    };
  }

  if (channel === 'vk') {
    return {
      channel,
      source: 'VK',
      chatChannel: 'VK',
      botConnected: true,
      communicationScenario: 'vk_bot',
    };
  }

  return {
    channel: 'web',
    source: 'Web',
    chatChannel: 'Web',
    botConnected: false,
    communicationScenario: 'phone_fallback_without_bot',
  };
}

function buildClientBooking(
  masterSlug: string,
  values: Omit<Booking, 'id' | 'masterSlug' | 'status' | 'createdAt'>,
  sourceInfo: BookingSourceInfo,
): Booking {
  return {
    id: crypto.randomUUID(),
    masterSlug,
    clientName: values.clientName.trim(),
    clientPhone: values.clientPhone.trim(),
    service: values.service.trim(),
    date: values.date,
    time: values.time,
    comment: values.comment?.trim() || undefined,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
    confirmedAt: new Date().toISOString(),
    source: sourceInfo.source,
    channel: sourceInfo.channel,
    metadata: {
      ...(values.metadata ?? {}),
      sourceChannel: sourceInfo.channel,
      communicationScenario: sourceInfo.communicationScenario,
      clientWithoutBot: sourceInfo.channel === 'web',
    },
  };
}

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

function getAvailabilityKey(item: unknown) {
  if (!item || typeof item !== 'object') return crypto.randomUUID();
  const day = item as Record<string, unknown>;

  if (typeof day.date === 'string' && day.date) return `date:${day.date}`;
  if (typeof day.weekdayIndex === 'number') return `weekday:${day.weekdayIndex}`;
  if (typeof day.weekday_index === 'number') return `weekday:${day.weekday_index}`;
  if (typeof day.id === 'string' && day.id) return `id:${day.id}`;

  return crypto.randomUUID();
}

function mergeAvailability(...sources: unknown[][]) {
  const map = new Map<string, unknown>();

  for (const source of sources) {
    for (const item of source) {
      if (!item || typeof item !== 'object') continue;
      map.set(getAvailabilityKey(item), item);
    }
  }

  return Array.from(map.values());
}

function resolveAvailability(params: {
  seedAvailability: unknown[];
  storedAvailability: unknown[];
  normalizedAvailability: unknown[];
}) {
  const seed = normalizeAvailabilityDays(params.seedAvailability);
  const stored = normalizeAvailabilityDays(params.storedAvailability);
  const normalized = normalizeAvailabilityDays(params.normalizedAvailability);

  if (stored.length > 0) {
    return normalizeAvailabilityDays(mergeAvailability(seed.filter((day) => !day.date), stored));
  }

  if (normalized.length > 0) {
    return normalizeAvailabilityDays(mergeAvailability(seed.filter((day) => !day.date), normalized));
  }

  return seed;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      masterSlug?: string;
      values?: Omit<Booking, 'id' | 'masterSlug' | 'status' | 'createdAt'>;
      sourceChannel?: string;
      source?: string;
      clientContext?: Record<string, unknown>;
    };

    if (!body.masterSlug || !body.values) {
      return NextResponse.json({ error: 'master_slug_and_values_required' }, { status: 400 });
    }

    const workspace = await fetchWorkspaceBySlug(body.masterSlug);

    if (!workspace) {
      return NextResponse.json({ error: 'master_not_found' }, { status: 404 });
    }

    const jsonBookings = Array.isArray(workspace.data?.bookings)
      ? (workspace.data.bookings as Booking[])
      : [];
    const tableBookings = await listBookingsByWorkspace(workspace.id).catch(() => [] as Booking[]);
    const currentBookings = mergeBookings(tableBookings, jsonBookings);

    const requestedService = body.values.service.trim();
    const profileServices = Array.isArray(workspace.profile?.services) ? workspace.profile.services : [];
    const normalizedServices = await listServices(workspace.id).catch(() => []);
    const storedServiceDetails = normalizeServiceDetails(workspace.data?.services);
    const seed = buildWorkspaceSeed(workspace.profile, currentBookings, 'ru');
    const effectiveServiceDetails = storedServiceDetails.length > 0
      ? storedServiceDetails
      : normalizedServices.length > 0
        ? normalizedServices
        : seed.services ?? [];
    const selectedServiceDetail = effectiveServiceDetails.find(
      (service) =>
        service.name === requestedService &&
        service.visible !== false &&
        service.status !== 'draft',
    );
    const hasServiceInDetails = Boolean(selectedServiceDetail);
    const hasServiceInProfile = profileServices.includes(requestedService);

    if (!hasServiceInDetails && !hasServiceInProfile) {
      return NextResponse.json({ error: 'service_not_available' }, { status: 400 });
    }

    const storedAvailability = Array.isArray(workspace.data?.availability)
      ? workspace.data.availability
      : [];
    const normalizedAvailability = await listAvailabilityDays(workspace.id).catch(() => []);
    const availability = resolveAvailability({
      seedAvailability: seed.availability ?? [],
      storedAvailability,
      normalizedAvailability,
    });
    const bookedSlots = currentBookings.map((item) => ({
      id: item.id,
      date: item.date,
      time: item.time,
      service: item.service,
      status: item.status,
    }));

    if (
      !isSlotAvailable({
        availability,
        date: body.values.date,
        time: body.values.time,
        serviceName: requestedService,
        services: effectiveServiceDetails,
        bookedSlots,
      })
    ) {
      return NextResponse.json({ error: 'slot_unavailable' }, { status: 409 });
    }

    const sourceInfo = getBookingSourceInfo(body.sourceChannel, body.source);
    const booking: Booking = {
      ...buildClientBooking(body.masterSlug, body.values, sourceInfo),
      durationMinutes: selectedServiceDetail?.duration,
      priceAmount: selectedServiceDetail?.price,
      metadata: {
        ...(body.values.metadata ?? {}),
        sourceChannel: sourceInfo.channel,
        source: sourceInfo.source,
        clientContext: body.clientContext ?? {},
        communicationScenario: sourceInfo.communicationScenario,
        clientWithoutBot: sourceInfo.channel === 'web',
      },
    };

    let persistedBooking = booking;
    let nextBookings = [booking, ...currentBookings];

    try {
      persistedBooking = (await createBookingRecord(workspace.id, booking)) ?? booking;
      const refreshedTableBookings = await listBookingsByWorkspace(workspace.id).catch(() => [] as Booking[]);
      nextBookings = mergeBookings(refreshedTableBookings, [persistedBooking, ...jsonBookings]);
    } catch {
      nextBookings = [persistedBooking, ...currentBookings];
    }

    const clientRecord = await upsertClientFromBooking({
      workspaceId: workspace.id,
      booking: persistedBooking,
      source: sourceInfo.source,
      channel: sourceInfo.channel,
      communicationScenario: sourceInfo.communicationScenario,
      metadata: {
        clientContext: body.clientContext ?? {},
        sourceChannel: sourceInfo.channel,
      },
    }).catch(() => null);

    if (clientRecord?.id) {
      persistedBooking = {
        ...persistedBooking,
        metadata: {
          ...(persistedBooking.metadata ?? {}),
          clientId: clientRecord.id,
          clientCardSynced: true,
        },
      };
      nextBookings = nextBookings.map((item) => (item.id === persistedBooking.id ? persistedBooking : item));
    }

    await updateWorkspace(workspace.id, {
      data: {
        ...(workspace.data ?? {}),
        bookings: nextBookings,
      },
    });

    let telegramBookingLink: { token: string; url: string | null } | null = null;
    let vkBookingLink: { token: string; url: string | null } | null = null;

    try {
      telegramBookingLink = await createClientTelegramBookingLink({
        workspaceId: workspace.id,
        masterSlug: body.masterSlug,
        booking: persistedBooking,
      });
    } catch {
      telegramBookingLink = null;
    }

    try {
      vkBookingLink = await createClientVkBookingLink({
        workspaceId: workspace.id,
        masterSlug: body.masterSlug,
        booking: persistedBooking,
      });
    } catch {
      vkBookingLink = null;
    }

    if (
      isNotificationEnabled(workspace, {
        id: 'new-request',
        titleIncludes: 'новая',
        audience: 'master',
        fallback: true,
      })
    ) {
      try {
        await Promise.allSettled([
          notifyWorkspaceOwnerAboutBooking({
            ownerId: workspace.ownerId ?? null,
            workspaceSlug: workspace.slug,
            profile: workspace.profile,
            booking: persistedBooking,
          }),
          notifyWorkspaceOwnerAboutBookingVk({
            ownerId: workspace.ownerId ?? null,
            workspaceSlug: workspace.slug,
            profile: workspace.profile,
            booking: persistedBooking,
          }),
        ]);
      } catch {
        // Booking must stay successful even if bot notifications fail.
      }
    }

    try {
      const existingThread = await fetchChatThreadByBookingId(workspace.id, persistedBooking.id);
      const bookingSummary = `Новая запись: ${bookingShortContext(persistedBooking)}`;

      const thread =
        existingThread ??
        (await createChatThread(workspace.id, {
          clientName: persistedBooking.clientName,
          clientPhone: persistedBooking.clientPhone,
          channel: sourceInfo.chatChannel,
          segment: 'new',
          source: sourceInfo.source,
          nextVisit: persistedBooking.date,
          botConnected: sourceInfo.botConnected,
          unreadCount: 1,
          isPriority: false,
          lastMessagePreview: bookingSummary,
          lastMessageAt: persistedBooking.createdAt,
          metadata: bookingThreadMetadata(persistedBooking, workspace.profile, {
            communicationScenario: sourceInfo.communicationScenario,
          }),
        }));

      if (thread) {
        await createChatMessage(workspace.id, {
          threadId: thread.id,
          author: 'client',
          body: bookingMessageText({
            title: 'Новая запись',
            booking: persistedBooking,
            profile: workspace.profile,
            includeClient: false,
            source: sourceInfo.source,
          }),
          deliveryState: null,
          viaBot: false,
          metadata: {
            bookingId: persistedBooking.id,
            service: persistedBooking.service,
            date: persistedBooking.date,
            time: persistedBooking.time,
          },
        });

        if (persistedBooking.comment) {
          await createChatMessage(workspace.id, {
            threadId: thread.id,
            author: 'client',
            body: persistedBooking.comment,
            deliveryState: null,
            viaBot: false,
            metadata: {
              bookingId: persistedBooking.id,
              kind: 'comment',
            },
          });
        }

        const sentToClientTelegram = sourceInfo.channel === 'telegram' && isNotificationEnabled(workspace, {
          id: 'visit-reminder',
          titleIncludes: 'напомин',
          audience: 'client',
          fallback: true,
        })
          ? await sendClientTelegramMessage({
              workspaceId: workspace.id,
              bookingId: persistedBooking.id,
              clientPhone: persistedBooking.clientPhone,
              clientName: persistedBooking.clientName,
              text: bookingMessageText({
                title: 'Запись создана ✅',
                booking: persistedBooking,
                profile: workspace.profile,
                footer: 'Если потребуется перенос — ответьте в этот чат или дождитесь напоминания с кнопками.',
              }),
            }).catch(() => false)
          : false;

        await updateChatThread(workspace.id, thread.id, {
          clientName: persistedBooking.clientName,
          clientPhone: persistedBooking.clientPhone,
          segment: 'new',
          nextVisit: persistedBooking.date,
          lastMessagePreview: persistedBooking.comment || bookingSummary,
          lastMessageAt: persistedBooking.createdAt,
          unreadCount: (existingThread?.unreadCount ?? 0) + 1,
          botConnected: sourceInfo.botConnected || sentToClientTelegram || thread.botConnected,
          metadata: {
            ...(thread.metadata ?? {}),
            ...bookingThreadMetadata(persistedBooking, workspace.profile),
            bookingIds: [persistedBooking.id],
            lastClientTelegramDelivery: sentToClientTelegram ? 'delivered' : sourceInfo.channel === 'telegram' ? 'pending_link' : 'phone_fallback',
            communicationScenario: sourceInfo.communicationScenario,
          },
        });
      }
    } catch {
      // /api/chats can synthesize chat rows from bookings if normalized chat tables fail.
    }

    return NextResponse.json({
      booking: persistedBooking,
      workspaceId: workspace.id,
      telegram: telegramBookingLink,
      telegramConfirmationUrl: telegramBookingLink?.url ?? null,
      vk: vkBookingLink,
      vkConfirmationUrl: vkBookingLink?.url ?? null,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'unknown_error' }, { status: 500 });
  }
}

type BookingAction =
  | 'confirm'
  | 'complete'
  | 'no_show'
  | 'cancel'
  | 'request_reschedule'
  | 'decline_reschedule'
  | 'offer_reschedule'
  | 'accept_reschedule';

type RescheduleStatus = 'none' | 'requested' | 'offered' | 'accepted' | 'declined' | 'done';

type BookingPatchBody = {
  bookingId?: string;
  status?: Booking['status'];
  action?: BookingAction;
  transferStatus?: RescheduleStatus;
  transferRequested?: boolean;
  rescheduleReason?: string;
  transferReason?: string;
  proposedDate?: string;
  proposedTime?: string;
  date?: string;
  time?: string;
  message?: string;
};

function isBookingStatus(value: unknown): value is Booking['status'] {
  return value === 'new' || value === 'confirmed' || value === 'completed' || value === 'no_show' || value === 'cancelled';
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanIsoDate(value: unknown) {
  const text = cleanText(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

function cleanTime(value: unknown) {
  const text = cleanText(value);
  return /^\d{2}:\d{2}/.test(text) ? text.slice(0, 5) : '';
}

function statusSystemText(status: Booking['status'], booking: Booking) {
  if (status === 'confirmed') return `Запись подтверждена: ${bookingShortContext(booking)}`;
  if (status === 'completed') return `Запись завершена: ${bookingShortContext(booking)}`;
  if (status === 'no_show') return `Клиент не пришёл: ${bookingShortContext(booking)}`;
  if (status === 'cancelled') return `Запись отменена: ${bookingShortContext(booking)}`;
  return `Статус записи обновлён: ${bookingShortContext(booking)}`;
}

function clientStatusTitle(status: Booking['status']) {
  if (status === 'confirmed') return 'Запись подтверждена ✅';
  if (status === 'completed') return 'Визит завершён ✅';
  if (status === 'no_show') return 'Отметка по записи';
  if (status === 'cancelled') return 'Запись отменена';
  return 'Статус записи обновлён';
}

function mergeBookingMetadata(booking: Booking, patch: Record<string, unknown>) {
  return {
    ...(booking.metadata ?? {}),
    ...patch,
  };
}

function applyBookingPatch(booking: Booking, patch: Partial<Booking> & { metadata?: Record<string, unknown> }) {
  return {
    ...booking,
    ...patch,
    metadata: patch.metadata ? { ...(booking.metadata ?? {}), ...patch.metadata } : booking.metadata,
  } satisfies Booking;
}

function buildRescheduleAlert(params: {
  type: 'request' | 'offered' | 'declined' | 'done';
  bookingId: string;
  now: string;
  reason?: string;
  date?: string;
  time?: string;
}) {
  if (params.type === 'request') {
    return {
      type: 'reschedule_request',
      status: 'open',
      bookingId: params.bookingId,
      createdAt: params.now,
      message: params.reason || 'Клиент запросил перенос. Нужно подобрать новое время.',
    };
  }

  if (params.type === 'offered') {
    return {
      type: 'reschedule_request',
      status: 'proposal_sent',
      bookingId: params.bookingId,
      createdAt: params.now,
      message: `Клиенту предложен перенос на ${params.date} ${params.time}. Ждём подтверждение.`,
    };
  }

  if (params.type === 'declined') {
    return {
      type: 'reschedule_request',
      status: 'declined_by_master',
      bookingId: params.bookingId,
      createdAt: params.now,
      message: 'Запрос на перенос закрыт мастером.',
    };
  }

  return null;
}

async function touchBookingThread(params: {
  workspaceId: string;
  booking: Booking;
  systemMessage?: string;
  metadataPatch?: Record<string, unknown>;
  priority?: boolean;
}) {
  const thread = await fetchChatThreadByBookingId(params.workspaceId, params.booking.id).catch(() => null);
  if (!thread) return null;

  const now = new Date().toISOString();

  if (params.systemMessage) {
    await createChatMessage(params.workspaceId, {
      threadId: thread.id,
      author: 'system',
      body: params.systemMessage,
      deliveryState: 'sent',
      viaBot: true,
      metadata: {
        kind: 'booking_action',
        bookingId: params.booking.id,
      },
    }).catch(() => null);
  }

  await updateChatThread(params.workspaceId, thread.id, {
    nextVisit: params.booking.status === 'cancelled' ? null : params.booking.date,
    isPriority: typeof params.priority === 'boolean' ? params.priority : thread.isPriority,
    lastMessagePreview: params.systemMessage ?? thread.lastMessagePreview,
    lastMessageAt: params.systemMessage ? now : thread.lastMessageAt,
    metadata: {
      ...(thread.metadata ?? {}),
      ...bookingThreadMetadata(params.booking),
      bookingId: params.booking.id,
      ...(params.metadataPatch ?? {}),
    },
  }).catch(() => null);

  return thread;
}

async function notifyClientAboutStatus(params: {
  workspace: NonNullable<Awaited<ReturnType<typeof fetchWorkspaceForUser>>>;
  booking: Booking;
  threadChannel?: ChatChannel | null;
}) {
  if (params.booking.status !== 'confirmed' && params.booking.status !== 'cancelled') return;
  if (!isNotificationEnabled(params.workspace, { id: 'chat-message', titleIncludes: 'чат', audience: 'client', fallback: true })) return;

  const title = clientStatusTitle(params.booking.status);
  const text = bookingMessageText({
    title,
    booking: params.booking,
    profile: params.workspace.profile,
    footer: params.booking.status === 'confirmed'
      ? 'Если потребуется перенос — ответьте в этот чат.'
      : 'Если нужно подобрать другое время — напишите мастеру.',
  });

  const channel = params.threadChannel ?? (String(params.booking.channel ?? '').toLowerCase().includes('vk') ? 'VK' : String(params.booking.channel ?? '').toLowerCase().includes('telegram') ? 'Telegram' : null);

  if (channel === 'Telegram') {
    await sendClientTelegramMessage({
      workspaceId: params.workspace.id,
      bookingId: params.booking.id,
      clientPhone: params.booking.clientPhone,
      clientName: params.booking.clientName,
      text,
    }).catch(() => false);
  }

  if (channel === 'VK') {
    await sendClientVkMessage({
      workspaceId: params.workspace.id,
      bookingId: params.booking.id,
      clientPhone: params.booking.clientPhone,
      clientName: params.booking.clientName,
      text,
    }).catch(() => false);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireAuthUser();
    const body = (await request.json()) as BookingPatchBody;

    if (!body.bookingId) {
      return NextResponse.json({ error: 'booking_id_required' }, { status: 400 });
    }

    const workspace = await fetchWorkspaceForUser(user);

    if (!workspace) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }

    const bookingId = body.bookingId;
    const jsonBookings = Array.isArray(workspace.data?.bookings) ? (workspace.data.bookings as Booking[]) : [];
    const tableBookings = await listBookingsByWorkspace(workspace.id).catch(() => [] as Booking[]);
    const currentBookings = mergeBookings(tableBookings, jsonBookings);
    const currentBooking = currentBookings.find((booking) => booking.id === bookingId);

    if (!currentBooking) {
      return NextResponse.json({ error: 'booking_not_found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const action = body.action;
    const transferStatus = body.transferStatus;
    const reason = cleanText(body.rescheduleReason ?? body.transferReason);
    const proposedDate = cleanIsoDate(body.proposedDate ?? body.date);
    const proposedTime = cleanTime(body.proposedTime ?? body.time);

    let bookingPatch: Partial<Booking> & { metadata?: Record<string, unknown> } = {};
    let systemMessage = '';
    let threadPriority: boolean | undefined;
    let threadMetadataPatch: Record<string, unknown> = {};
    let shouldNotifyClient = false;
    let shouldOfferReschedule = false;

    if (body.status !== undefined) {
      if (!isBookingStatus(body.status)) {
        return NextResponse.json({ error: 'invalid_booking_status' }, { status: 400 });
      }
      bookingPatch.status = body.status;
    }

    if (action === 'confirm') bookingPatch.status = 'confirmed';
    if (action === 'complete') bookingPatch.status = 'completed';
    if (action === 'no_show') bookingPatch.status = 'no_show';
    if (action === 'cancel') bookingPatch.status = 'cancelled';

    if (bookingPatch.status) {
      if (bookingPatch.status === 'confirmed') bookingPatch.confirmedAt = now;
      if (bookingPatch.status === 'completed') bookingPatch.completedAt = now;
      if (bookingPatch.status === 'no_show') bookingPatch.noShowAt = now;
      if (bookingPatch.status === 'cancelled') bookingPatch.cancelledAt = now;
      systemMessage = statusSystemText(bookingPatch.status, applyBookingPatch(currentBooking, bookingPatch));
      shouldNotifyClient = bookingPatch.status === 'confirmed' || bookingPatch.status === 'cancelled';
    }

    if (action === 'request_reschedule' || body.transferRequested === true || transferStatus === 'requested') {
      const activeAlert = buildRescheduleAlert({ type: 'request', bookingId, now, reason });
      bookingPatch.metadata = mergeBookingMetadata(currentBooking, {
        rescheduleRequested: true,
        transferRequested: true,
        rescheduleStatus: 'requested',
        transferStatus: 'requested',
        rescheduleReason: reason || undefined,
        transferReason: reason || undefined,
        rescheduleRequestedAt: now,
        transferRequestedAt: now,
        activeAlert,
      });
      systemMessage = `Клиент запросил перенос: ${bookingShortContext(currentBooking)}${reason ? `\nПричина: ${reason}` : ''}`;
      threadPriority = true;
      threadMetadataPatch = {
        rescheduleRequested: true,
        rescheduleStatus: 'requested',
        activeAlert,
      };
    }

    if (action === 'decline_reschedule' || transferStatus === 'declined') {
      const activeAlert = buildRescheduleAlert({ type: 'declined', bookingId, now });
      bookingPatch.metadata = mergeBookingMetadata(currentBooking, {
        rescheduleRequested: false,
        transferRequested: false,
        rescheduleStatus: 'declined',
        transferStatus: 'declined',
        rescheduleClosedAt: now,
        activeAlert,
      });
      systemMessage = `Запрос на перенос закрыт мастером: ${bookingShortContext(currentBooking)}`;
      threadPriority = false;
      threadMetadataPatch = {
        rescheduleRequested: false,
        rescheduleStatus: 'declined',
        activeAlert,
      };
    }

    if (action === 'offer_reschedule') {
      if (!proposedDate || !proposedTime) {
        return NextResponse.json({ error: 'proposed_date_and_time_required' }, { status: 400 });
      }
      const activeAlert = buildRescheduleAlert({ type: 'offered', bookingId, now, date: proposedDate, time: proposedTime });
      bookingPatch.metadata = mergeBookingMetadata(currentBooking, {
        rescheduleRequested: true,
        transferRequested: true,
        rescheduleStatus: 'offered',
        transferStatus: 'requested',
        rescheduleProposedDate: proposedDate,
        rescheduleProposedTime: proposedTime,
        rescheduleOfferedAt: now,
        activeAlert,
      });
      systemMessage = `Мастер предложил перенос на ${proposedDate} ${proposedTime}: ${bookingShortContext(currentBooking)}`;
      threadPriority = true;
      threadMetadataPatch = {
        rescheduleRequested: true,
        rescheduleStatus: 'offered',
        rescheduleProposalDate: proposedDate,
        rescheduleProposalTime: proposedTime,
        activeAlert,
      };
      shouldOfferReschedule = true;
    }

    if (action === 'accept_reschedule' || transferStatus === 'accepted' || transferStatus === 'done') {
      if (!proposedDate || !proposedTime) {
        return NextResponse.json({ error: 'date_and_time_required' }, { status: 400 });
      }
      bookingPatch = {
        ...bookingPatch,
        status: 'confirmed',
        date: proposedDate,
        time: proposedTime,
        confirmedAt: now,
        metadata: mergeBookingMetadata(currentBooking, {
          rescheduleRequested: false,
          transferRequested: false,
          rescheduleStatus: 'done',
          transferStatus: 'done',
          rescheduledFromDate: currentBooking.date,
          rescheduledFromTime: currentBooking.time,
          rescheduledAt: now,
          activeAlert: null,
        }),
      };
      systemMessage = `Запись перенесена на ${proposedDate} ${proposedTime}: ${currentBooking.clientName}`;
      threadPriority = false;
      threadMetadataPatch = {
        rescheduleRequested: false,
        rescheduleStatus: 'done',
        activeAlert: null,
      };
      shouldNotifyClient = true;
    }

    if (!bookingPatch.status && !bookingPatch.date && !bookingPatch.time && !bookingPatch.metadata) {
      return NextResponse.json({ error: 'booking_action_required' }, { status: 400 });
    }

    const optimisticBooking = applyBookingPatch(currentBooking, bookingPatch);
    let nextBookings = currentBookings.map((booking) => (booking.id === bookingId ? optimisticBooking : booking));
    let updatedBooking: Booking | null = optimisticBooking;

    try {
      updatedBooking = await updateBookingRecord(workspace.id, bookingId, {
        status: bookingPatch.status,
        date: bookingPatch.date,
        time: bookingPatch.time,
        confirmedAt: bookingPatch.confirmedAt ?? undefined,
        completedAt: bookingPatch.completedAt ?? undefined,
        noShowAt: bookingPatch.noShowAt ?? undefined,
        cancelledAt: bookingPatch.cancelledAt ?? undefined,
        metadata: bookingPatch.metadata,
      });

      const refreshedTableBookings = await listBookingsByWorkspace(workspace.id).catch(() => [] as Booking[]);
      nextBookings = mergeBookings(refreshedTableBookings, nextBookings.map((booking) => (booking.id === bookingId && updatedBooking ? updatedBooking : booking)));
    } catch {
      updatedBooking = optimisticBooking;
    }

    if (!updatedBooking) {
      return NextResponse.json({ error: 'booking_not_found' }, { status: 404 });
    }

    await updateWorkspace(workspace.id, {
      data: {
        ...(workspace.data ?? {}),
        bookings: nextBookings,
      },
    });

    const thread = await touchBookingThread({
      workspaceId: workspace.id,
      booking: updatedBooking,
      systemMessage,
      metadataPatch: threadMetadataPatch,
      priority: threadPriority,
    });

    let rescheduleProposalId: string | null = null;
    let telegramDelivered = false;
    let vkDelivered = false;

    if (shouldOfferReschedule && thread && proposedDate && proposedTime) {
      const proposal = await createRescheduleProposal({
        workspaceId: workspace.id,
        threadId: thread.id,
        bookingId: updatedBooking.id,
        proposedDate,
        proposedTime,
        message: body.message || `Предлагаю перенести запись на ${proposedDate} ${proposedTime}.`,
      }).catch(() => null);

      if (proposal) {
        rescheduleProposalId = proposal.proposal.id;

        if (thread.channel === 'Telegram') {
          telegramDelivered = await sendClientTelegramMessage({
            workspaceId: workspace.id,
            bookingId: updatedBooking.id,
            clientPhone: updatedBooking.clientPhone,
            clientName: updatedBooking.clientName,
            directChatId: typeof thread.metadata?.clientTelegramChatId === 'number' || typeof thread.metadata?.clientTelegramChatId === 'string'
              ? thread.metadata.clientTelegramChatId
              : null,
            text: proposal.text,
            replyMarkup: buildTelegramRescheduleProposalReplyMarkup(proposal.proposal.id),
          }).catch(() => false);
        }

        if (thread.channel === 'VK') {
          vkDelivered = await sendClientVkMessage({
            workspaceId: workspace.id,
            bookingId: updatedBooking.id,
            clientPhone: updatedBooking.clientPhone,
            clientName: updatedBooking.clientName,
            directPeerId: typeof thread.metadata?.clientVkPeerId === 'number' || typeof thread.metadata?.clientVkPeerId === 'string'
              ? thread.metadata.clientVkPeerId
              : null,
            text: proposal.text,
            keyboard: buildVkRescheduleProposalKeyboard(proposal.proposal.id),
          }).catch(() => false);
        }
      }
    } else if (shouldNotifyClient) {
      await notifyClientAboutStatus({ workspace, booking: updatedBooking, threadChannel: thread?.channel ?? null }).catch(() => null);
    }

    return NextResponse.json({
      booking: updatedBooking,
      workspaceId: workspace.id,
      rescheduleProposalId,
      telegramDelivered,
      vkDelivered,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown_error';
    if (message === 'unauthorized') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
