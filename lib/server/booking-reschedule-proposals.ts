import 'server-only';

import type { Booking, MasterProfile } from '@/lib/types';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { createChatMessage, updateChatThread } from '@/lib/server/supabase-chats';
import { getAppUrl, sendTelegramMessage } from '@/lib/server/telegram-bot';
import { bookingCode, bookingServicesText } from '@/lib/server/booking-context';
import { buildVkKeyboard, sendVkMessage } from '@/lib/server/vk-bot';

type ProposalStatus = 'pending' | 'accepted' | 'declined' | 'expired';
type ProposalAction = 'accept' | 'decline';
type ProposalSource = 'telegram' | 'vk';

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

type ProposalRow = {
  id: string;
  workspace_id: string;
  thread_id: string;
  booking_id: string;
  proposed_date: string;
  proposed_time: string;
  message: string | null;
  status: ProposalStatus;
  created_at: string;
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

function formatProposalDate(date: string, time: string) {
  return `${date} ${time}`.trim();
}

export function buildTelegramRescheduleProposalReplyMarkup(proposalId: string) {
  return {
    inline_keyboard: [
      [{ text: '✅ Подтвердить перенос', callback_data: `rs:${proposalId}:a` }],
      [{ text: '❌ Не подходит', callback_data: `rs:${proposalId}:d` }],
    ],
  };
}

export function buildVkRescheduleProposalKeyboard(proposalId: string) {
  return buildVkKeyboard([
    [
      {
        label: '✅ Подтвердить перенос',
        action: 'reschedule_proposal_accept',
        color: 'positive',
        payload: { proposal_id: proposalId },
      },
      {
        label: '❌ Не подходит',
        action: 'reschedule_proposal_decline',
        color: 'negative',
        payload: { proposal_id: proposalId },
      },
    ],
  ]);
}

export function buildRescheduleProposalText(params: {
  booking: Booking;
  proposedDate: string;
  proposedTime: string;
  message?: string | null;
}) {
  return [
    `Здравствуйте, ${params.booking.clientName}!`,
    '',
    'Мастер предлагает перенести запись.',
    '',
    `Запись: ${bookingCode(params.booking)}`,
    '',
    'Услуги:',
    bookingServicesText(params.booking),
    '',
    'Новое время:',
    params.proposedDate,
    params.proposedTime,
    '',
    'Выберите действие ниже:',
    '✅ «Подтвердить перенос» — если время подходит.',
    '❌ «Не подходит» — если нужно другое время.',
  ].join('\n');
}

async function getThreadMetadata(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  workspaceId: string,
  threadId: string,
) {
  const { data } = await admin
    .from('sloty_chat_threads')
    .select('metadata')
    .eq('id', threadId)
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  return data?.metadata && typeof data.metadata === 'object'
    ? (data.metadata as Record<string, unknown>)
    : {};
}

async function getWorkspace(admin: ReturnType<typeof createSupabaseAdminClient>, workspaceId: string) {
  const { data, error } = await admin
    .from('sloty_workspaces')
    .select('id,slug,owner_id,profile,data')
    .eq('id', workspaceId)
    .maybeSingle();

  if (error) throw error;
  return (data as WorkspaceRow | null) ?? null;
}

async function syncWorkspaceBooking(params: {
  admin: ReturnType<typeof createSupabaseAdminClient>;
  workspace: WorkspaceRow;
  bookingId: string;
  patch: Record<string, unknown> & { metadata?: Record<string, unknown> };
}) {
  const workspaceData =
    params.workspace.data && typeof params.workspace.data === 'object' ? params.workspace.data : {};
  const jsonBookings = Array.isArray(workspaceData.bookings)
    ? (workspaceData.bookings as Array<Record<string, unknown>>)
    : [];

  if (jsonBookings.length === 0) return;

  const nextBookings = jsonBookings.map((item) => {
    if (item.id !== params.bookingId) return item;
    const currentMetadata =
      item.metadata && typeof item.metadata === 'object' ? (item.metadata as Record<string, unknown>) : {};
    return {
      ...item,
      ...params.patch,
      metadata: {
        ...currentMetadata,
        ...(params.patch.metadata ?? {}),
      },
    };
  });

  await params.admin
    .from('sloty_workspaces')
    .update({ data: { ...workspaceData, bookings: nextBookings } })
    .eq('id', params.workspace.id);
}

export async function createRescheduleProposal(params: {
  workspaceId: string;
  threadId: string;
  bookingId: string;
  proposedDate: string;
  proposedTime: string;
  message?: string | null;
}) {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data: bookingRow, error: bookingError } = await admin
    .from('sloty_bookings')
    .select('*')
    .eq('id', params.bookingId)
    .eq('workspace_id', params.workspaceId)
    .maybeSingle();

  if (bookingError) throw bookingError;
  if (!bookingRow) throw new Error('booking_not_found');

  const booking = mapBookingRow(bookingRow as BookingRow);

  const { data: inserted, error } = await admin
    .from('sloty_booking_reschedule_proposals')
    .insert({
      workspace_id: params.workspaceId,
      thread_id: params.threadId,
      booking_id: params.bookingId,
      proposed_date: params.proposedDate,
      proposed_time: params.proposedTime,
      message: params.message ?? null,
      status: 'pending',
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .maybeSingle();

  if (error) throw error;
  const proposal = inserted as ProposalRow;
  const text = buildRescheduleProposalText({
    booking,
    proposedDate: params.proposedDate,
    proposedTime: params.proposedTime,
    message: params.message,
  });
  const threadMetadata = await getThreadMetadata(admin, params.workspaceId, params.threadId);

  await updateChatThread(params.workspaceId, params.threadId, {
    segment: 'followup',
    isPriority: true,
    lastMessagePreview: `Предложен перенос: ${formatProposalDate(params.proposedDate, params.proposedTime)}`,
    lastMessageAt: now,
    metadata: {
      ...threadMetadata,
      rescheduleProposalId: proposal.id,
      rescheduleProposalStatus: 'pending',
      rescheduleProposalDate: params.proposedDate,
      rescheduleProposalTime: params.proposedTime,
      activeAlert: {
        type: 'reschedule_request',
        status: 'proposal_sent',
        bookingId: params.bookingId,
        proposalId: proposal.id,
        createdAt: now,
        message: `Клиенту предложен перенос на ${formatProposalDate(params.proposedDate, params.proposedTime)}. Ждём подтверждение.`,
      },
    },
  }).catch(() => null);

  await createChatMessage(params.workspaceId, {
    threadId: params.threadId,
    author: 'system',
    body: `Предложен перенос на ${formatProposalDate(params.proposedDate, params.proposedTime)}. Клиенту отправлены кнопки подтверждения.`,
    deliveryState: 'sent',
    viaBot: true,
    metadata: { kind: 'reschedule_proposal', proposalId: proposal.id, bookingId: params.bookingId },
  }).catch(() => null);

  return { proposal, booking, text };
}

async function notifyMasterAboutProposalAction(params: {
  admin: ReturnType<typeof createSupabaseAdminClient>;
  workspace: WorkspaceRow;
  booking: Booking;
  proposal: ProposalRow;
  action: ProposalAction;
  source: ProposalSource;
}) {
  const ownerId = params.workspace.owner_id;
  if (!ownerId) return;

  const accepted = params.action === 'accept';
  const message = [
    accepted ? 'Клиент подтвердил перенос ✅' : 'Клиенту не подошло время ⚠️',
    '',
    `Клиент: ${params.booking.clientName}`,
    `Услуга: ${params.booking.service}`,
    `Время: ${formatProposalDate(params.proposal.proposed_date, params.proposal.proposed_time)}`,
    `Канал: ${params.source === 'vk' ? 'VK' : 'Telegram'}`,
    '',
    accepted ? 'Запись обновлена в базе.' : 'Предложите другой слот в чате.',
  ].join('\n');

  const tasks: Array<Promise<unknown>> = [];

  const { data: telegramAccount } = await params.admin
    .from('sloty_telegram_accounts')
    .select('chat_id')
    .eq('user_id', ownerId)
    .maybeSingle();
  const telegramChatId = telegramAccount?.chat_id as number | string | null | undefined;
  if (telegramChatId) tasks.push(sendTelegramMessage({ chatId: telegramChatId, text: message }));

  const { data: vkAccount } = await params.admin
    .from('sloty_vk_bot_accounts')
    .select('peer_id')
    .eq('user_id', ownerId)
    .eq('messages_allowed', true)
    .maybeSingle();
  const vkPeerId = vkAccount?.peer_id as number | string | null | undefined;
  if (vkPeerId) tasks.push(sendVkMessage({ peerId: vkPeerId, message }));

  await Promise.allSettled(tasks);
}

export async function handleRescheduleProposalAction(params: {
  proposalId: string;
  action: ProposalAction;
  source: ProposalSource;
  directClientRef?: Record<string, unknown>;
}) {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data: proposalRow, error: proposalError } = await admin
    .from('sloty_booking_reschedule_proposals')
    .select('*')
    .eq('id', params.proposalId)
    .maybeSingle();

  if (proposalError) throw proposalError;
  if (!proposalRow) return { ok: false as const, reason: 'proposal_not_found' as const };

  const proposal = proposalRow as ProposalRow;
  if (proposal.status !== 'pending') {
    return { ok: true as const, alreadyHandled: true as const, status: proposal.status };
  }

  const { data: bookingRow, error: bookingError } = await admin
    .from('sloty_bookings')
    .select('*')
    .eq('id', proposal.booking_id)
    .eq('workspace_id', proposal.workspace_id)
    .maybeSingle();

  if (bookingError) throw bookingError;
  if (!bookingRow) return { ok: false as const, reason: 'booking_not_found' as const };

  const booking = mapBookingRow(bookingRow as BookingRow);
  const workspace = await getWorkspace(admin, proposal.workspace_id);
  if (!workspace) return { ok: false as const, reason: 'workspace_not_found' as const };

  const accepted = params.action === 'accept';
  const nextStatus: ProposalStatus = accepted ? 'accepted' : 'declined';
  const bookingMetadata =
    (bookingRow as BookingRow).metadata && typeof (bookingRow as BookingRow).metadata === 'object'
      ? ((bookingRow as BookingRow).metadata as Record<string, unknown>)
      : {};

  await admin
    .from('sloty_booking_reschedule_proposals')
    .update({ status: nextStatus, responded_at: now, response_source: params.source, updated_at: now })
    .eq('id', proposal.id);

  if (accepted) {
    await admin
      .from('sloty_bookings')
      .update({
        status: 'confirmed',
        source: params.source === 'vk' ? 'ВК' : 'ТГ',
        channel: params.source,
        booking_date: proposal.proposed_date,
        booking_time: proposal.proposed_time,
        confirmed_at: now,
        cancelled_at: null,
        cancel_reason: null,
        updated_at: now,
        metadata: {
          ...bookingMetadata,
          acceptedRescheduleProposalId: proposal.id,
          rescheduledFromDate: booking.date,
          rescheduledFromTime: booking.time,
          rescheduledAt: now,
          lastClientAction: 'reschedule_proposal_accept',
          lastClientActionSource: params.source,
          lastClientActionAt: now,
        },
      })
      .eq('id', booking.id)
      .eq('workspace_id', proposal.workspace_id);

    await syncWorkspaceBooking({
      admin,
      workspace,
      bookingId: booking.id,
      patch: {
        status: 'confirmed',
        source: params.source === 'vk' ? 'ВК' : 'ТГ',
        channel: params.source,
        date: proposal.proposed_date,
        time: proposal.proposed_time,
        confirmedAt: now,
        cancelledAt: null,
        cancelReason: null,
        metadata: {
          acceptedRescheduleProposalId: proposal.id,
          rescheduledFromDate: booking.date,
          rescheduledFromTime: booking.time,
          rescheduledAt: now,
          lastClientAction: 'reschedule_proposal_accept',
          lastClientActionSource: params.source,
          lastClientActionAt: now,
        },
      },
    }).catch(() => null);
  } else {
    await admin
      .from('sloty_bookings')
      .update({
        source: params.source === 'vk' ? 'ВК' : 'ТГ',
        channel: params.source,
        updated_at: now,
        metadata: {
          ...bookingMetadata,
          declinedRescheduleProposalId: proposal.id,
          declinedRescheduleAt: now,
          lastClientAction: 'reschedule_proposal_decline',
          lastClientActionSource: params.source,
          lastClientActionAt: now,
        },
      })
      .eq('id', booking.id)
      .eq('workspace_id', proposal.workspace_id);

    await syncWorkspaceBooking({
      admin,
      workspace,
      bookingId: booking.id,
      patch: {
        source: params.source === 'vk' ? 'ВК' : 'ТГ',
        channel: params.source,
        metadata: {
          declinedRescheduleProposalId: proposal.id,
          declinedRescheduleAt: now,
          lastClientAction: 'reschedule_proposal_decline',
          lastClientActionSource: params.source,
          lastClientActionAt: now,
        },
      },
    }).catch(() => null);
  }

  const preview = accepted
    ? `Клиент подтвердил перенос на ${formatProposalDate(proposal.proposed_date, proposal.proposed_time)}`
    : `Клиенту не подошёл перенос на ${formatProposalDate(proposal.proposed_date, proposal.proposed_time)}`;
  const threadMetadata = await getThreadMetadata(admin, proposal.workspace_id, proposal.thread_id);

  await updateChatThread(proposal.workspace_id, proposal.thread_id, {
    segment: accepted ? 'active' : 'followup',
    source: params.source === 'vk' ? 'ВК' : 'ТГ',
    channel: params.source === 'vk' ? 'VK' : 'Telegram',
    nextVisit: accepted ? `${proposal.proposed_date}T${proposal.proposed_time}:00` : null,
    isPriority: !accepted,
    lastMessagePreview: preview,
    lastMessageAt: now,
    metadata: {
      ...threadMetadata,
      ...(params.directClientRef ?? {}),
      bookingId: booking.id,
      rescheduleProposalId: proposal.id,
      rescheduleProposalStatus: nextStatus,
      activeAlert: accepted
        ? null
        : {
            type: 'reschedule_request',
            status: 'open',
            bookingId: booking.id,
            proposalId: proposal.id,
            createdAt: now,
            message: 'Клиенту не подошло предложенное время. Предложите другой слот.',
          },
    },
  }).catch(() => null);

  await createChatMessage(proposal.workspace_id, {
    threadId: proposal.thread_id,
    author: 'system',
    body: accepted
      ? `Клиент подтвердил перенос ✅\nНовое время: ${formatProposalDate(proposal.proposed_date, proposal.proposed_time)}\nЗапись обновлена в базе.`
      : `Клиенту не подошёл перенос ⚠️\nПредложенное время: ${formatProposalDate(proposal.proposed_date, proposal.proposed_time)}\nНужно подобрать другой слот.`,
    deliveryState: 'delivered',
    viaBot: true,
    metadata: { kind: accepted ? 'reschedule_proposal_accepted' : 'reschedule_proposal_declined', proposalId: proposal.id, bookingId: booking.id },
  }).catch(() => null);

  await notifyMasterAboutProposalAction({
    admin,
    workspace,
    booking: { ...booking, date: proposal.proposed_date, time: proposal.proposed_time, status: accepted ? 'confirmed' : booking.status },
    proposal,
    action: params.action,
    source: params.source,
  }).catch(() => null);

  return {
    ok: true as const,
    accepted,
    booking: { ...booking, date: proposal.proposed_date, time: proposal.proposed_time, status: accepted ? 'confirmed' as const : booking.status },
    workspaceSlug: workspace.slug,
    appUrl: getAppUrl(),
  };
}

export function parseTelegramRescheduleProposalCallback(data?: string) {
  const match = data?.match(/^rs:([a-f0-9-]+):(a|d)$/i);
  if (!match) return null;
  return { proposalId: match[1], action: match[2] === 'a' ? 'accept' as const : 'decline' as const };
}
