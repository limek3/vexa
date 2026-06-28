import 'server-only';

import type { Booking, MasterProfile } from '@/lib/types';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import {
  createChatMessage,
  createChatThread,
  fetchChatThreadByBookingId,
  updateChatThread,
} from '@/lib/server/supabase-chats';
import {
  sendMasterBookingConfirmedNotice,
  sendMasterRescheduleRequestNotification,
  sendTelegramMessage,
  getAppUrl,
} from '@/lib/server/telegram-bot';
import {
  sendMasterVkBookingConfirmedNotice,
  sendMasterVkRescheduleRequestNotification,
  sendVkMessage,
  buildVkKeyboard,
} from '@/lib/server/vk-bot';
import { bookingMessageText, bookingShortContext, bookingThreadMetadata } from '@/lib/server/booking-context';

type ClientBookingAction = 'confirm' | 'reschedule' | 'cancel';
type ClientActionSource = 'telegram' | 'vk';

type BookingRow = {
  id: string;
  workspace_id: string;
  master_slug: string;
  client_name: string;
  client_phone: string;
  service: string;
  booking_date: string;
  booking_time: string;
  comment: string | null;
  status: Booking['status'];
  created_at: string;
  duration_minutes?: number | null;
  price_amount?: number | null;
  source?: string | null;
  channel?: string | null;
  confirmed_at?: string | null;
  completed_at?: string | null;
  no_show_at?: string | null;
  cancelled_at?: string | null;
  cancel_reason?: string | null;
  metadata?: Record<string, unknown> | null;
};

type WorkspaceRow = {
  id: string;
  slug: string;
  owner_id: string | null;
  profile: MasterProfile | null;
  data: Record<string, unknown> | null;
};

function mapBookingRow(row: BookingRow): Booking {
  return {
    id: row.id,
    masterSlug: row.master_slug,
    clientName: row.client_name,
    clientPhone: row.client_phone,
    service: row.service,
    date: row.booking_date,
    time: row.booking_time,
    comment: row.comment ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    durationMinutes: row.duration_minutes ?? undefined,
    priceAmount: row.price_amount ?? undefined,
    source: row.source ?? undefined,
    channel: row.channel ?? undefined,
    confirmedAt: row.confirmed_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    noShowAt: row.no_show_at ?? undefined,
    cancelledAt: row.cancelled_at ?? undefined,
    cancelReason: row.cancel_reason ?? undefined,
    metadata: row.metadata ?? undefined,
  };
}

function sourceLabel(source: ClientActionSource) {
  return source === 'vk' ? 'VK' : 'Telegram';
}

function actionPreview(action: ClientBookingAction, booking: Booking, source: ClientActionSource) {
  if (action === 'confirm') {
    return `Клиент подтвердил запись: ${booking.service} · ${booking.date} ${booking.time}`;
  }

  if (action === 'cancel') {
    return `❌ Клиент хочет отменить запись: ${booking.service} · ${booking.date} ${booking.time} · ${sourceLabel(source)}`;
  }

  return `⚠️ Клиент хочет перенос: ${booking.service} · ${booking.date} ${booking.time} · ${sourceLabel(source)}`;
}

function actionMessage(action: ClientBookingAction, booking: Booking, source: ClientActionSource) {
  if (action === 'confirm') {
    return [
      'Клиент подтвердил запись ✅',
      '',
      `Услуга: ${booking.service}`,
      `Время: ${booking.date} ${booking.time}`,
      `Канал: ${sourceLabel(source)}`,
    ].join('\n');
  }

  if (action === 'cancel') {
    return [
      '❌ Клиент хочет отменить запись',
      '',
      `Услуга: ${booking.service}`,
      `Время: ${booking.date} ${booking.time}`,
      `Канал: ${sourceLabel(source)}`,
      '',
      'Ответьте клиенту в этом чате и подтвердите дальнейшие действия.',
    ].join('\n');
  }

  return [
    '⚠️ Клиент хочет перенос',
    '',
    `Услуга: ${booking.service}`,
    `Старое время: ${booking.date} ${booking.time}`,
    `Канал: ${sourceLabel(source)}`,
    '',
    'Слот освобождён. Подберите новое время и ответьте клиенту в этом чате.',
  ].join('\n');
}

async function syncWorkspaceBooking(params: {
  admin: ReturnType<typeof createSupabaseAdminClient>;
  workspace: WorkspaceRow;
  bookingId: string;
  status: Booking['status'];
  action: ClientBookingAction;
  source: ClientActionSource;
  now: string;
}) {
  const workspaceData =
    params.workspace.data && typeof params.workspace.data === 'object'
      ? params.workspace.data
      : {};

  const jsonBookings = Array.isArray(workspaceData.bookings)
    ? (workspaceData.bookings as Array<Record<string, unknown>>)
    : [];

  if (jsonBookings.length === 0) return;

  const nextBookings = jsonBookings.map((item) => {
    if (item.id !== params.bookingId) return item;

    const metadata =
      item.metadata && typeof item.metadata === 'object'
        ? (item.metadata as Record<string, unknown>)
        : {};

    return {
      ...item,
      status: params.status,
      channel: params.source,
      ...(params.action === 'confirm' ? { confirmedAt: params.now } : {}),
      ...(params.action === 'reschedule'
        ? {
            cancelledAt: params.now,
            cancelReason: 'client_reschedule_requested',
            rescheduleRequestedAt: params.now,
            rescheduleRequestChannel: sourceLabel(params.source),
          }
        : {}),
      ...(params.action === 'cancel'
        ? {
            cancelledAt: params.now,
            cancelReason: 'client_cancel_requested',
            cancelRequestedAt: params.now,
            cancelRequestChannel: sourceLabel(params.source),
          }
        : {}),
      metadata: {
        ...metadata,
        lastClientAction: params.action,
        lastClientActionSource: params.source,
        lastClientActionAt: params.now,
        ...(params.action === 'reschedule'
          ? {
              rescheduleRequested: true,
              rescheduleRequestedAt: params.now,
              rescheduleRequestChannel: params.source,
            }
          : {}),
        ...(params.action === 'cancel'
          ? {
              cancelRequested: true,
              cancelRequestedAt: params.now,
              cancelRequestChannel: params.source,
            }
          : {}),
      },
    };
  });

  await params.admin
    .from('sloty_workspaces')
    .update({ data: { ...workspaceData, bookings: nextBookings } })
    .eq('id', params.workspace.id);
}

async function upsertChatAlert(params: {
  workspaceId: string;
  booking: Booking;
  action: ClientBookingAction;
  source: ClientActionSource;
  now: string;
  directClientRef?: Record<string, unknown>;
}) {
  const preview = actionPreview(params.action, params.booking, params.source);
  const messageBody = actionMessage(params.action, params.booking, params.source);
  const existingThread = await fetchChatThreadByBookingId(params.workspaceId, params.booking.id).catch(() => null);

  const baseMetadata = existingThread?.metadata ?? {};
  const previousBookingIds = Array.isArray(baseMetadata.bookingIds)
    ? (baseMetadata.bookingIds as unknown[]).filter((item): item is string => typeof item === 'string')
    : [];

  const activeAlert =
    params.action === 'reschedule' || params.action === 'cancel'
      ? {
          type: params.action === 'cancel' ? 'cancel_request' : 'reschedule_request',
          status: 'open',
          bookingId: params.booking.id,
          channel: params.source,
          createdAt: params.now,
          message: preview,
        }
      : null;

  const metadata = {
    ...baseMetadata,
    bookingId: params.booking.id,
    bookingIds: [...new Set([...previousBookingIds, params.booking.id])],
    lastClientAction: params.action,
    lastClientActionSource: params.source,
    lastClientActionAt: params.now,
    ...(params.directClientRef ?? {}),
    ...(params.action === 'reschedule'
      ? {
          activeAlert,
          rescheduleRequested: true,
          rescheduleRequestedAt: params.now,
          rescheduleRequestBookingId: params.booking.id,
          rescheduleRequestChannel: params.source,
        }
      : params.action === 'cancel'
        ? {
            activeAlert,
            cancelRequested: true,
            cancelRequestedAt: params.now,
            cancelRequestBookingId: params.booking.id,
            cancelRequestChannel: params.source,
          }
      : {
          activeAlert: baseMetadata.activeAlert &&
            typeof baseMetadata.activeAlert === 'object' &&
            (baseMetadata.activeAlert as Record<string, unknown>).bookingId === params.booking.id
              ? null
              : baseMetadata.activeAlert ?? null,
        }),
  };

  const thread = existingThread
    ? await updateChatThread(params.workspaceId, existingThread.id, {
        channel: params.source === 'vk' ? 'VK' : existingThread.channel,
        source: existingThread.source ?? params.booking.source ?? sourceLabel(params.source),
        segment: params.action === 'reschedule' || params.action === 'cancel' ? 'followup' : 'active',
        nextVisit: params.action === 'reschedule' || params.action === 'cancel' ? null : params.booking.date,
        isPriority: params.action === 'reschedule' || params.action === 'cancel' ? true : existingThread.isPriority,
        botConnected: true,
        lastMessagePreview: preview,
        lastMessageAt: params.now,
        unreadCount: (existingThread.unreadCount ?? 0) + 1,
        metadata: {
          ...bookingThreadMetadata(params.booking, null, metadata),
          ...metadata,
        },
      }).catch(() => existingThread)
    : await createChatThread(params.workspaceId, {
        clientName: params.booking.clientName,
        clientPhone: params.booking.clientPhone,
        channel: params.source === 'vk' ? 'VK' : 'Telegram',
        segment: params.action === 'reschedule' || params.action === 'cancel' ? 'followup' : 'active',
        source: params.booking.source ?? sourceLabel(params.source),
        nextVisit: params.action === 'reschedule' || params.action === 'cancel' ? null : params.booking.date,
        isPriority: params.action === 'reschedule' || params.action === 'cancel',
        botConnected: true,
        lastMessagePreview: preview,
        lastMessageAt: params.now,
        unreadCount: 1,
        metadata: {
          ...bookingThreadMetadata(params.booking, null, metadata),
          ...metadata,
        },
      }).catch(() => null);

  if (!thread?.id) return null;

  await createChatMessage(params.workspaceId, {
    threadId: thread.id,
    author: 'system',
    body: messageBody,
    deliveryState: 'delivered',
    viaBot: true,
    metadata: {
      bookingId: params.booking.id,
      kind: params.action === 'cancel' ? 'cancel_request' : params.action === 'reschedule' ? 'reschedule_request' : 'client_confirmed',
      source: params.source,
      alert: params.action === 'reschedule' || params.action === 'cancel',
    },
  }).catch(() => null);

  return thread;
}

async function notifyMaster(params: {
  admin: ReturnType<typeof createSupabaseAdminClient>;
  workspace: WorkspaceRow;
  booking: Booking;
  action: ClientBookingAction;
  source: ClientActionSource;
}) {
  const ownerId = params.workspace.owner_id;
  if (!ownerId) return;

  const tasks: Array<Promise<unknown>> = [];

  const { data: telegramAccount } = await params.admin
    .from('sloty_telegram_accounts')
    .select('chat_id')
    .eq('user_id', ownerId)
    .maybeSingle();

  const telegramChatId = telegramAccount?.chat_id as number | string | null | undefined;

  if (telegramChatId) {
    tasks.push(
      params.action === 'reschedule'
        ? sendMasterRescheduleRequestNotification({
            chatId: telegramChatId,
            booking: params.booking,
            profile: params.workspace.profile,
            workspaceSlug: params.workspace.slug,
            source: sourceLabel(params.source),
          })
        : params.action === 'cancel'
          ? sendTelegramMessage({
              chatId: telegramChatId,
              text: bookingMessageText({
                title: 'Клиент хочет отменить запись ❌',
                booking: params.booking,
                profile: params.workspace.profile,
                includeClient: true,
                includePhone: true,
                source: sourceLabel(params.source),
                footer: 'В чатах КликБук создано предупреждение. Ответьте клиенту и подтвердите дальнейшие действия.',
              }),
              replyMarkup: {
                inline_keyboard: [
                  [
                    {
                      text: 'Открыть чат',
                      web_app: { url: `${getAppUrl()}/app?redirectTo=${encodeURIComponent('/dashboard/chats')}` },
                    },
                  ],
                  [{ text: 'Веб-кабинет', url: `${getAppUrl()}/dashboard/chats` }],
                ],
              },
            })
        : sendMasterBookingConfirmedNotice({
            chatId: telegramChatId,
            booking: params.booking,
            profile: params.workspace.profile,
            workspaceSlug: params.workspace.slug,
            source: sourceLabel(params.source),
          }),
    );
  }

  const { data: vkAccount } = await params.admin
    .from('sloty_vk_bot_accounts')
    .select('peer_id')
    .eq('user_id', ownerId)
    .eq('messages_allowed', true)
    .maybeSingle();

  const vkPeerId = vkAccount?.peer_id as number | string | null | undefined;

  if (vkPeerId) {
    tasks.push(
      params.action === 'reschedule'
        ? sendMasterVkRescheduleRequestNotification({
            peerId: vkPeerId,
            booking: params.booking,
            profile: params.workspace.profile,
            workspaceSlug: params.workspace.slug,
            source: sourceLabel(params.source),
          })
        : params.action === 'cancel'
          ? sendVkMessage({
              peerId: vkPeerId,
              message: bookingMessageText({
                title: 'Клиент хочет отменить запись ❌',
                booking: params.booking,
                profile: params.workspace.profile,
                includeClient: true,
                includePhone: true,
                source: sourceLabel(params.source),
                footer: 'В чатах КликБук создано предупреждение. Ответьте клиенту и подтвердите дальнейшие действия.',
              }),
              keyboard: buildVkKeyboard([
                [{ label: 'Открыть чаты', action: 'open_url', url: `${getAppUrl()}/dashboard/chats`, color: 'primary' }],
                [{ label: 'Кабинет', action: 'open_url', url: `${getAppUrl()}/dashboard`, color: 'secondary' }],
              ]),
            })
        : sendMasterVkBookingConfirmedNotice({
            peerId: vkPeerId,
            booking: params.booking,
            profile: params.workspace.profile,
            workspaceSlug: params.workspace.slug,
            source: sourceLabel(params.source),
          }),
    );
  }

  if (tasks.length > 0) {
    await Promise.allSettled(tasks);
  }
}

export async function handleClientBookingAction(params: {
  bookingId: string;
  action: ClientBookingAction;
  source: ClientActionSource;
  directClientRef?: Record<string, unknown>;
}) {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data: bookingRow, error: bookingError } = await admin
    .from('sloty_bookings')
    .select('*')
    .eq('id', params.bookingId)
    .maybeSingle();

  if (bookingError) throw bookingError;
  if (!bookingRow) return { ok: false as const, reason: 'booking_not_found' as const };

  const booking = mapBookingRow(bookingRow as BookingRow);
  const workspaceId = (bookingRow as BookingRow).workspace_id;

  const { data: workspaceRow, error: workspaceError } = await admin
    .from('sloty_workspaces')
    .select('id,slug,owner_id,profile,data')
    .eq('id', workspaceId)
    .maybeSingle();

  if (workspaceError) throw workspaceError;
  if (!workspaceRow) return { ok: false as const, reason: 'workspace_not_found' as const };

  const workspace = workspaceRow as WorkspaceRow;
  const nextStatus: Booking['status'] = params.action === 'confirm' ? 'confirmed' : 'cancelled';

  const currentMetadata =
    (bookingRow as BookingRow).metadata && typeof (bookingRow as BookingRow).metadata === 'object'
      ? ((bookingRow as BookingRow).metadata as Record<string, unknown>)
      : {};

  const { data: updatedRow, error: updateError } = await admin
    .from('sloty_bookings')
    .update({
      status: nextStatus,
      channel: params.source,
      updated_at: now,
      metadata: {
        ...currentMetadata,
        lastClientAction: params.action,
        lastClientActionSource: params.source,
        lastClientActionAt: now,
        ...(params.action === 'reschedule'
          ? {
              rescheduleRequested: true,
              rescheduleRequestedAt: now,
              rescheduleRequestChannel: params.source,
            }
          : {}),
        ...(params.action === 'cancel'
          ? {
              cancelRequested: true,
              cancelRequestedAt: now,
              cancelRequestChannel: params.source,
            }
          : {}),
      },
      ...(params.action === 'confirm' ? { confirmed_at: now } : {}),
      ...(params.action === 'reschedule'
        ? { cancelled_at: now, cancel_reason: 'client_reschedule_requested' }
        : {}),
      ...(params.action === 'cancel'
        ? { cancelled_at: now, cancel_reason: 'client_cancel_requested' }
        : {}),
    })
    .eq('id', params.bookingId)
    .select('*')
    .maybeSingle();

  if (updateError) throw updateError;

  const updatedBooking = updatedRow ? mapBookingRow(updatedRow as BookingRow) : { ...booking, status: nextStatus };

  await syncWorkspaceBooking({
    admin,
    workspace,
    bookingId: params.bookingId,
    status: nextStatus,
    action: params.action,
    source: params.source,
    now,
  }).catch(() => null);

  await upsertChatAlert({
    workspaceId,
    booking: updatedBooking,
    action: params.action,
    source: params.source,
    now,
    directClientRef: params.directClientRef,
  }).catch(() => null);

  await notifyMaster({
    admin,
    workspace,
    booking: updatedBooking,
    action: params.action,
    source: params.source,
  }).catch(() => null);

  return {
    ok: true as const,
    booking: updatedBooking,
    workspaceId,
    workspaceSlug: workspace.slug,
  };
}
