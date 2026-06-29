import { NextResponse } from 'next/server';

import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import {
  answerVkMessageEvent,
  editVkMessage,
  deleteVkMessage,
  getAppUrl,
  getVkBotGroupId,
  getVkBotUserProfile,
  sendVkBotAuthFallbackMessage,
  sendVkBotBookingsMessage,
  sendVkBotFaqAnswerMessage,
  sendVkBotFaqMessage,
  sendVkBotNotificationsMessage,
  sendVkBotSupportMessage,
  sendClientVkBookingConfirmation,
  sendVkBotWelcomeMessage,
  sendVkLoginConfirmedMessage,
  sendVkMessage,
  buildVkKeyboard,
  buildVkReplyKeyboard,
  buildVkCallbackReplyKeyboard,
  buildVkClientMenuKeyboard,
} from '@/lib/server/vk-bot';
import { handleClientBookingAction } from '@/lib/server/booking-client-actions';
import { handleRescheduleProposalAction } from '@/lib/server/booking-reschedule-proposals';
import { createChatMessage, createChatThread, fetchChatThreadByBookingId, listChatsForWorkspace, updateChatThread } from '@/lib/server/supabase-chats';
import { bookingChoiceText, bookingClientCardText, bookingMessageText, bookingSelectionLabel, bookingThreadMetadata } from '@/lib/server/booking-context';
import type { Booking, MasterProfile } from '@/lib/types';
import {
  buildVkLoginToken,
  createVkBotVirtualUser,
  upsertVkBotAccount,
  upsertVkOauthAccountFromBot,
} from '@/lib/server/vk-bot-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type VkCallbackPayload = {
  type?: string;
  group_id?: number;
  secret?: string;
  object?: any;
};

type VkBookingLinkRow = {
  token: string;
  status: 'pending' | 'confirmed' | 'expired';
  workspace_id: string;
  booking_id: string;
  master_slug: string;
  booking_snapshot: Booking | null;
  expires_at: string;
  metadata?: Record<string, unknown> | null;
};

type BookingRow = {
  id: string;
  master_slug: string;
  client_name: string;
  client_phone: string;
  service: string;
  booking_date: string;
  booking_time: string;
  comment: string | null;
  status: Booking['status'];
  created_at: string;
  source?: string | null;
  channel?: string | null;
};

function textResponse(value: string, init?: ResponseInit) {
  return new Response(value, {
    status: init?.status ?? 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

function getConfirmationCode() {
  return (process.env.VK_BOT_CONFIRMATION_CODE || process.env.VK_CALLBACK_CONFIRMATION_CODE || '').trim();
}

function getCallbackSecret() {
  return (process.env.VK_BOT_SECRET || process.env.VK_CALLBACK_SECRET || '').trim();
}

function getExpectedGroupId() {
  const value = getVkBotGroupId();
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? Math.trunc(id) : null;
}

function verifyVkCallback(payload: VkCallbackPayload) {
  const expectedSecret = getCallbackSecret();

  if (expectedSecret && payload.secret !== expectedSecret) {
    return false;
  }

  const expectedGroupId = getExpectedGroupId();

  if (expectedGroupId && payload.group_id && Number(payload.group_id) !== expectedGroupId) {
    return false;
  }

  return true;
}

function logVkWebhookError(label: string, error: unknown) {
  console.error('[vk-webhook]', label, error instanceof Error ? error.message : error);
}


function safeString(value: unknown, max = 1000) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > max ? `${trimmed.slice(0, max)}...` : trimmed;
}

async function writeVkWebhookLog(params: {
  eventType?: string;
  groupId?: number | null;
  vkUserId?: number | string | null;
  peerId?: number | string | null;
  text?: unknown;
  ref?: unknown;
  status?: string;
  error?: unknown;
  payload?: unknown;
}) {
  try {
    await createSupabaseAdminClient().from('sloty_vk_webhook_events').insert({
      event_type: params.eventType ?? null,
      group_id: params.groupId ?? null,
      vk_user_id: params.vkUserId != null ? String(params.vkUserId) : null,
      peer_id: params.peerId != null ? Number(params.peerId) : null,
      text: safeString(params.text),
      ref: safeString(params.ref),
      status: params.status ?? 'received',
      error: params.error instanceof Error ? params.error.message : safeString(params.error),
      payload: params.payload && typeof params.payload === 'object' ? params.payload : {},
    });
  } catch {
    // Debug logging must never break VK callback delivery.
  }
}


async function sendVkReply(params: {
  label: string;
  peerId: number | string;
  textPreview?: string | null;
  send: () => Promise<unknown>;
}) {
  try {
    const result = await params.send();

    await writeVkWebhookLog({
      eventType: 'message_send',
      peerId: params.peerId,
      text: params.textPreview ?? params.label,
      status: 'sent',
      payload: {
        label: params.label,
        result: result && typeof result === 'object' ? result : { value: result },
      },
    });

    return result;
  } catch (error) {
    logVkWebhookError(`send:${params.label}`, error);

    await writeVkWebhookLog({
      eventType: 'message_send',
      peerId: params.peerId,
      text: params.textPreview ?? params.label,
      status: 'send_error',
      error,
      payload: { label: params.label },
    });

    return null;
  }
}

function isStartLikeText(value: unknown) {
  if (typeof value !== 'string') return false;
  const text = value.trim().toLowerCase();
  return text === '/start' || text === 'start' || text === 'начать' || text === 'старт' || text === 'меню';
}

function normalizedText(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function isFaqLikeText(value: unknown) {
  const text = normalizedText(value);
  return text === 'faq' || text === '/faq' || text === 'вопросы' || text === 'частые вопросы';
}

function isSupportLikeText(value: unknown) {
  const text = normalizedText(value);
  return text === 'поддержка' || text === '/support' || text === 'связь' || text === 'помощь';
}

function isNotificationLikeText(value: unknown) {
  const text = normalizedText(value);
  return text === 'уведомления' || text === '/notifications';
}

function isBookingsLikeText(value: unknown) {
  const text = normalizedText(value);
  return text === 'записи' || text === '/bookings' || text === 'мои записи' || text.includes('мои записи') || text.includes('выбрать запись');
}

type VkClientMenuAction =
  | 'bookings'
  | 'write'
  | 'reschedule_cancel'
  | 'help'
  | 'back'
  | 'reschedule'
  | 'cancel';

function vkClientMenuActionFromText(value: unknown): VkClientMenuAction | null {
  const text = normalizedText(value).replace(/ё/g, 'е');
  if (!text) return null;
  if (text.includes('хочу перенести') || text.includes('перенести')) return 'reschedule';
  if (text.includes('хочу отменить') || text.includes('отменить')) return 'cancel';
  if (text.includes('мои записи')) return 'bookings';
  if (text.includes('написать мастеру') || text.includes('мастеру') || text.includes('выбрать запись')) return 'write';
  if (text.includes('перенос') || text.includes('отмена')) return 'reschedule_cancel';
  if (text.includes('помощ') || text === 'sos') return 'help';
  if (text.includes('назад')) return 'back';
  return null;
}

function extractVkBookingButtonIndex(value: unknown) {
  const match = String(value ?? '').trim().match(/^(\d{1,2})(?:\s|\.|·|$)/);
  if (!match) return null;
  const index = Number(match[1]) - 1;
  return Number.isInteger(index) && index >= 0 ? index : null;
}

function normalizePayload(value: unknown): Record<string, unknown> | null {
  if (!value) return null;

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }

  return typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function extractAuthTokenFromValue(value: unknown) {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/(?:^|[\s:/?&=])auth_([a-f0-9]{32,64})(?:\b|$)/i) || trimmed.match(/^([a-f0-9]{32,64})$/i);
  return match?.[1] ?? null;
}

function extractAuthToken(message: Record<string, unknown> | null, eventPayload?: Record<string, unknown> | null) {
  const directCandidates = [
    message?.text,
    message?.ref,
    message?.ref_source,
    message?.payload,
    eventPayload?.token,
    eventPayload?.auth_token,
    eventPayload?.payload,
  ];

  for (const candidate of directCandidates) {
    const token = extractAuthTokenFromValue(candidate);
    if (token) return token;
  }

  const payloadObject = normalizePayload(message?.payload);

  if (payloadObject) {
    const token =
      extractAuthTokenFromValue(payloadObject.token) ||
      extractAuthTokenFromValue(payloadObject.auth_token) ||
      extractAuthTokenFromValue(payloadObject.start_param);

    if (token) return token;
  }

  return null;
}


function extractBookingTokenFromValue(value: unknown) {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/(?:^|[\s:/?&=])booking_([a-f0-9]{64})(?:\b|$)/i);
  return match?.[1] ?? null;
}

function extractBookingToken(message: Record<string, unknown> | null, eventPayload?: Record<string, unknown> | null) {
  const directCandidates = [
    message?.text,
    message?.ref,
    message?.ref_source,
    message?.payload,
    eventPayload?.token,
    eventPayload?.booking_token,
    eventPayload?.payload,
  ];

  for (const candidate of directCandidates) {
    const token = extractBookingTokenFromValue(candidate);
    if (token) return token;
  }

  const payloadObject = normalizePayload(message?.payload);

  if (payloadObject) {
    const token =
      extractBookingTokenFromValue(payloadObject.token) ||
      extractBookingTokenFromValue(payloadObject.booking_token) ||
      extractBookingTokenFromValue(payloadObject.start_param);

    if (token) return token;
  }

  return null;
}

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
    source: row.source ?? undefined,
    channel: row.channel ?? undefined,
  };
}

function numberValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Math.trunc(Number(value));
  return null;
}

async function confirmVkLogin(params: {
  token: string;
  vkUserId: number | string;
  peerId: number | string;
}) {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data: requestRow, error: readError } = await admin
    .from('sloty_vk_login_requests')
    .select('*')
    .eq('token', params.token)
    .maybeSingle();

  if (readError) throw readError;

  if (!requestRow) {
    await sendVkReply({
      label: 'login_request_not_found',
      peerId: params.peerId,
      textPreview: 'Не нашли запрос на вход.',
      send: () => sendVkMessage({
        peerId: params.peerId,
        message: 'Не нашли запрос на вход. Вернитесь на сайт и нажмите «Войти через VK» ещё раз.',
      }),
    });
    return false;
  }

  if (requestRow.status !== 'pending' || new Date(requestRow.expires_at).getTime() < Date.now()) {
    try {
      await admin
        .from('sloty_vk_login_requests')
        .update({ status: 'expired', updated_at: now })
        .eq('token', params.token)
        .eq('status', 'pending');
    } catch {}

    await sendVkReply({
      label: 'login_request_expired',
      peerId: params.peerId,
      textPreview: 'Ссылка входа устарела или уже использована.',
      send: () => sendVkMessage({
        peerId: params.peerId,
        message: 'Ссылка входа устарела или уже использована. Вернитесь на сайт и нажмите «Войти через VK» ещё раз.',
      }),
    });
    return false;
  }

  const profile = await getVkBotUserProfile(params.vkUserId).catch(() => ({
    vkId: String(params.vkUserId),
    firstName: null,
    lastName: null,
    fullName: null,
    screenName: null,
    domain: null,
    photoUrl: null,
    rawProfile: { source: 'vk_callback_fallback' },
  }));
  const linkUserId =
    requestRow.metadata &&
    requestRow.metadata.mode === 'link' &&
    typeof requestRow.metadata.link_user_id === 'string'
      ? requestRow.metadata.link_user_id
      : null;

  const user = createVkBotVirtualUser(profile, linkUserId);

  await upsertVkBotAccount(admin, {
    userId: user.id,
    vkUserId: profile.vkId,
    peerId: params.peerId,
    profile,
    messagesAllowed: true,
    metadata: {
      source: 'vk_callback_auth',
      token: params.token,
    },
  });

  await upsertVkOauthAccountFromBot(admin, { userId: user.id, profile }).catch((error) => {
    logVkWebhookError('vk account mirror skipped', error);
  });

  const { error: updateError } = await admin
    .from('sloty_vk_login_requests')
    .update({
      status: 'confirmed',
      vk_user_id: profile.vkId,
      peer_id: Number(params.peerId),
      first_name: profile.firstName,
      last_name: profile.lastName,
      screen_name: profile.screenName || profile.domain,
      photo_url: profile.photoUrl,
      confirmed_at: now,
      updated_at: now,
      metadata: {
        ...(requestRow.metadata ?? {}),
        profile: profile.rawProfile ?? {},
      },
    })
    .eq('token', params.token)
    .eq('status', 'pending');

  if (updateError) throw updateError;

  await sendVkReply({
    label: 'login_confirmed',
    peerId: params.peerId,
    textPreview: 'Вход в КликБук через VK подтверждён.',
    send: () => sendVkLoginConfirmedMessage({
      peerId: params.peerId,
      token: params.token,
    }),
  });

  return true;
}



async function handleVkBookingStart(params: {
  token: string;
  vkUserId: number | string;
  peerId: number | string;
  profile: Awaited<ReturnType<typeof getVkBotUserProfile>>;
}) {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data: linkRow, error: linkError } = await admin
    .from('sloty_booking_vk_links')
    .select('*')
    .eq('token', params.token)
    .eq('status', 'pending')
    .maybeSingle();

  if (linkError) throw linkError;

  const link = linkRow as VkBookingLinkRow | null;

  if (!link) {
    await sendVkReply({
      label: 'vk_booking_link_not_found',
      peerId: params.peerId,
      textPreview: 'Ссылка записи уже использована или устарела.',
      send: () => sendVkMessage({
        peerId: params.peerId,
        message: 'Ссылка подтверждения уже использована или устарела. Вернитесь на страницу записи и создайте новую заявку.',
      }),
    });
    return;
  }

  const expired = link.expires_at && new Date(link.expires_at).getTime() < Date.now();

  if (expired) {
    await admin
      .from('sloty_booking_vk_links')
      .update({ status: 'expired', updated_at: now })
      .eq('token', params.token);

    await sendVkReply({
      label: 'vk_booking_link_expired',
      peerId: params.peerId,
      textPreview: 'Ссылка подтверждения устарела.',
      send: () => sendVkMessage({
        peerId: params.peerId,
        message: 'Ссылка подтверждения устарела. Но запись уже создана — мастер получил заявку.',
      }),
    });
    return;
  }

  const { data: workspaceRow } = await admin
    .from('sloty_workspaces')
    .select('profile')
    .eq('id', link.workspace_id)
    .maybeSingle();

  const profile = (workspaceRow?.profile as MasterProfile | undefined) ?? null;

  await admin
    .from('sloty_booking_vk_links')
    .update({
      status: 'confirmed',
      vk_user_id: String(params.vkUserId),
      peer_id: Number(params.peerId),
      first_name: params.profile.firstName ?? null,
      last_name: params.profile.lastName ?? null,
      screen_name: params.profile.screenName || params.profile.domain || null,
      photo_url: params.profile.photoUrl ?? null,
      confirmed_at: now,
      updated_at: now,
      metadata: {
        source: 'vk_booking_link',
        profile: params.profile.rawProfile ?? {},
      },
    })
    .eq('token', params.token)
    .eq('status', 'pending');

  const result = await handleClientBookingAction({
    bookingId: link.booking_id,
    action: 'confirm',
    source: 'vk',
    directClientRef: {
      clientVkPeerId: params.peerId,
      clientVkUserId: String(params.vkUserId),
    },
  });

  const booking = result.ok ? result.booking : link.booking_snapshot;

  if (!booking) {
    await sendVkReply({
      label: 'vk_booking_not_found',
      peerId: params.peerId,
      textPreview: 'Запись не найдена.',
      send: () => sendVkMessage({
        peerId: params.peerId,
        message: 'Запись не найдена. Мастер всё равно получил заявку, но уведомления подключить не удалось.',
      }),
    });
    return;
  }

  const clientLinks = await getConfirmedVkBookingLinks(params.peerId, 8);
  const response = await sendClientVkBookingConfirmation({
    peerId: params.peerId,
    booking,
    profile,
  });
  await rememberVkClientMenuMessage(clientLinks.length ? clientLinks : [link], extractVkConversationMessageId(response));
}


function vkLinkMetadata(link: VkBookingLinkRow) {
  return link.metadata && typeof link.metadata === 'object' ? link.metadata : {};
}


function normalizePhone(value?: string | null) {
  return String(value ?? '').replace(/\D+/g, '');
}

function normalizeName(value?: string | null) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function vkThreadMatchesBooking(thread: Awaited<ReturnType<typeof listChatsForWorkspace>>[number], booking: Booking, peerId: number | string, vkUserId?: number | string) {
  const phone = normalizePhone(booking.clientPhone);
  const threadPhone = normalizePhone(thread.clientPhone);
  const name = normalizeName(booking.clientName);
  const threadName = normalizeName(thread.clientName);

  return Boolean(
    String(thread.metadata?.clientVkPeerId ?? '') === String(peerId) ||
    (vkUserId != null && String(thread.metadata?.clientVkUserId ?? '') === String(vkUserId)) ||
    (phone && threadPhone && phone === threadPhone) ||
    (name && threadName && name === threadName),
  );
}

async function findVkClientThread(workspaceId: string, booking: Booking, peerId: number | string, vkUserId?: number | string) {
  const threads = await listChatsForWorkspace(workspaceId).catch(() => [] as Awaited<ReturnType<typeof listChatsForWorkspace>>);
  const byBooking = threads.find((thread) => {
    const bookingIds = Array.isArray(thread.metadata?.bookingIds)
      ? thread.metadata.bookingIds.filter((item): item is string => typeof item === 'string')
      : [];
    return thread.metadata?.bookingId === booking.id || bookingIds.includes(booking.id);
  });
  if (byBooking) return byBooking;

  return threads.find((thread) => vkThreadMatchesBooking(thread, booking, peerId, vkUserId)) ?? null;
}

function mergeVkBookingMetadata(base: Record<string, unknown> | null | undefined, booking: Booking, peerId: number | string, vkUserId: number | string) {
  const bookingMetadata = bookingThreadMetadata(booking, null, base ?? {});
  const currentIds = Array.isArray(base?.bookingIds)
    ? base.bookingIds.filter((item): item is string => typeof item === 'string')
    : [];
  const currentContexts = Array.isArray(base?.bookingContexts) ? base.bookingContexts : [];
  const nextContext = {
    id: booking.id,
    bookingId: booking.id,
    code: bookingMetadata.bookingCode,
    bookingCode: bookingMetadata.bookingCode,
    service: booking.service,
    services: bookingMetadata.services,
    date: booking.date,
    bookingDate: booking.date,
    time: booking.time,
    bookingTime: booking.time,
    masterName: bookingMetadata.masterName,
  };

  return {
    ...(base ?? {}),
    ...bookingMetadata,
    bookingIds: Array.from(new Set([...currentIds, booking.id])),
    bookingContexts: [
      ...currentContexts.filter((item) => !(item && typeof item === 'object' && (item as Record<string, unknown>).id === booking.id)),
      nextContext,
    ],
    activeBookingId: booking.id,
    clientVkPeerId: peerId,
    clientVkUserId: String(vkUserId),
  };
}

function extractVkConversationMessageId(response: unknown) {
  if (!response || typeof response !== 'object') return null;
  const value = (response as { response?: unknown }).response;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  if (value && typeof value === 'object') {
    const payload = value as Record<string, unknown>;
    const candidates = [
      payload.conversation_message_id,
      payload.conversationMessageId,
      payload.cmid,
      payload.message_id,
      payload.messageId,
      payload.id,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'number' && Number.isFinite(candidate)) return Math.trunc(candidate);
      if (typeof candidate === 'string' && /^\d+$/.test(candidate)) return Number(candidate);
    }
  }
  return null;
}

function getStoredVkClientMenuMessageId(links: VkBookingLinkRow[]) {
  for (const link of links) {
    const messageId = vkLinkMetadata(link).clientVkMenuMessageId;
    if (typeof messageId === 'number') return messageId;
    if (typeof messageId === 'string' && /^\d+$/.test(messageId)) return Number(messageId);
  }
  return null;
}

async function rememberVkClientMenuMessage(links: VkBookingLinkRow[], messageId: number | null) {
  if (!messageId || links.length === 0) return;

  const admin = createSupabaseAdminClient();

  for (const link of links) {
    const metadata = vkLinkMetadata(link);
    const { error } = await admin
      .from('sloty_booking_vk_links')
      .update({ metadata: { ...metadata, clientVkMenuMessageId: messageId }, updated_at: new Date().toISOString() })
      .eq('token', link.token);

    if (error) logVkWebhookError('remember vk client menu metadata failed', error);
  }
}

async function sendOrEditVkClientCard(params: {
  peerId: number | string;
  links: VkBookingLinkRow[];
  message: string;
  keyboard: Record<string, unknown>;
}) {
  const previousMessageId = getStoredVkClientMenuMessageId(params.links);

  if (previousMessageId) {
    try {
      await editVkMessage({
        peerId: params.peerId,
        conversationMessageId: previousMessageId,
        message: params.message,
        keyboard: params.keyboard,
      });
      await rememberVkClientMenuMessage(params.links, previousMessageId);
      return;
    } catch (error) {
      logVkWebhookError('edit vk client menu card', error);
      await deleteVkMessage({ peerId: params.peerId, conversationMessageId: previousMessageId }).catch((deleteError) =>
        logVkWebhookError('delete stale vk client menu card', deleteError),
      );
    }
  }

  const result = await sendVkMessage({
    peerId: params.peerId,
    message: params.message,
    keyboard: params.keyboard,
  });
  await rememberVkClientMenuMessage(params.links, extractVkConversationMessageId(result));
}

async function sendVkClientPersistentMenu(_peerId: number | string, _token?: string | null) {
  // VK does not need a separate service message like “menu enabled”.
  // Client buttons are rendered under the current bot card via inline keyboard, like in VK UI.
}

async function getConfirmedVkBookingLinks(peerId: number | string, limit = 8) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('sloty_booking_vk_links')
    .select('*')
    .eq('peer_id', Number(peerId))
    .eq('status', 'confirmed')
    .order('confirmed_at', { ascending: false })
    .limit(limit);

  if (error) {
    logVkWebhookError('get confirmed vk booking links', error);
    return [] as VkBookingLinkRow[];
  }

  return Array.isArray(data) ? (data as VkBookingLinkRow[]) : [];
}

function getActiveVkChatContextLink(links: VkBookingLinkRow[]) {
  const now = Date.now();

  return links.find((link) => {
    const activeAt = vkLinkMetadata(link).activeChatContextAt;
    const time = typeof activeAt === 'string' ? new Date(activeAt).getTime() : 0;
    return time > 0 && now - time < 30 * 60 * 1000;
  }) ?? null;
}


function vkClientMode(links: VkBookingLinkRow[]) {
  const modes = links
    .map((link) => vkLinkMetadata(link).clientMode)
    .filter((mode): mode is string => typeof mode === 'string' && Boolean(mode));

  return (
    modes.find((mode) => mode === 'choosing_action_booking') ??
    modes.find((mode) => mode === 'choosing_chat_booking') ??
    modes.find((mode) => mode === 'booking_action') ??
    modes.find((mode) => mode === 'writing_to_master') ??
    'idle'
  );
}

async function setVkClientState(links: VkBookingLinkRow[], state: Record<string, unknown>) {
  if (links.length === 0) return;
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  for (const link of links) {
    const metadata = vkLinkMetadata(link);
    const { error } = await admin
      .from('sloty_booking_vk_links')
      .update({ metadata: { ...metadata, ...state }, updated_at: now })
      .eq('token', link.token);

    if (error) logVkWebhookError('set vk client state failed', error);
  }
}

function buildVkClientBackKeyboard() {
  return buildVkCallbackReplyKeyboard([[{ label: '⬅️ Назад', action: 'client_back', color: 'secondary' }]]);
}

function buildVkClientActionKeyboard() {
  return buildVkCallbackReplyKeyboard([
    [
      { label: '🔁 Перенести', action: 'client_action_reschedule', color: 'primary' },
      { label: '❌ Отменить', action: 'client_action_cancel', color: 'negative' },
    ],
    [
      { label: '💬 Мастеру', action: 'client_write', color: 'secondary' },
      { label: '⬅️ Назад', action: 'client_back', color: 'secondary' },
    ],
  ]);
}

async function getVkBookingFromLink(link: VkBookingLinkRow) {
  const admin = createSupabaseAdminClient();
  const { data: bookingRow, error: bookingError } = await admin
    .from('sloty_bookings')
    .select('*')
    .eq('id', link.booking_id)
    .maybeSingle();

  if (bookingError) logVkWebhookError('vk booking from link read booking', bookingError);

  const booking = bookingRow ? mapBookingRow(bookingRow as BookingRow) : link.booking_snapshot;

  const { data: workspaceRow, error: workspaceError } = await admin
    .from('sloty_workspaces')
    .select('profile')
    .eq('id', link.workspace_id)
    .maybeSingle();

  if (workspaceError) logVkWebhookError('vk booking from link read workspace', workspaceError);

  return { booking, profile: (workspaceRow?.profile as MasterProfile | undefined) ?? null };
}

async function sendVkClientBookingDetails(params: {
  peerId: number | string;
  link: VkBookingLinkRow;
  title?: string;
  actionMode?: boolean;
}) {
  const { booking, profile } = await getVkBookingFromLink(params.link);

  if (!booking) {
    await sendVkMessage({
      peerId: params.peerId,
      message: 'Запись не найдена. Откройте «Мои записи» или напишите мастеру обычным сообщением.',
      keyboard: buildVkClientMenuKeyboard(),
    });
    return;
  }

  const links = await getConfirmedVkBookingLinks(params.peerId, 8);
  await sendOrEditVkClientCard({
    peerId: params.peerId,
    links: links.length > 0 ? links : [params.link],
    message: bookingClientCardText({
      title: params.title || 'Ваша запись',
      booking,
      profile,
      footer: params.actionMode
        ? 'Выберите действие снизу.'
        : 'Теперь напишите сообщение мастеру.',
    }),
    keyboard: params.actionMode ? buildVkClientActionKeyboard() : buildVkClientMenuKeyboard(),
  });
}

async function sendVkClientBookingChoice(peerId: number | string, mode: 'choosing_chat_booking' | 'choosing_action_booking' = 'choosing_chat_booking') {
  const links = await getConfirmedVkBookingLinks(peerId, 8);

  if (links.length === 0) {
    await sendVkBotBookingsMessage({ peerId });
    return;
  }

  if (links.length === 1) {
    await setVkClientState(links, {
      clientMode: mode === 'choosing_action_booking' ? 'booking_action' : 'writing_to_master',
      activeChatContextAt: new Date().toISOString(),
    });
    await sendVkClientBookingDetails({
      peerId,
      link: links[0],
      title: mode === 'choosing_action_booking' ? 'Действия по записи' : 'Выбрана запись для переписки',
      actionMode: mode === 'choosing_action_booking',
    });
    return;
  }

  await setVkClientState(links, { clientMode: mode });

  const rows: Array<Array<{ label: string; action: string; token?: string | null; color?: 'primary' | 'secondary' }>> = [];
  const buttons: Array<{ label: string; action: string; token?: string | null; color?: 'primary' | 'secondary' }> = [];

  for (const [index, link] of links.entries()) {
    buttons.push({
      label: String(index + 1),
      action: 'client_chat_context',
      token: link.token,
      color: 'primary',
    });
  }

  for (let i = 0; i < buttons.length; i += 4) {
    rows.push(buttons.slice(i, i + 4));
  }

  rows.push([{ label: '⬅️ Назад', action: 'client_back', color: 'secondary' }]);

  const listLines = ['Выберите номер записи:', ''];
  for (const [index, link] of links.entries()) {
    const { booking, profile } = await getVkBookingFromLink(link);
    if (!booking) continue;
    listLines.push(`${index + 1}. ${bookingSelectionLabel(booking, profile)}`);
  }

  await sendOrEditVkClientCard({
    peerId,
    links,
    message: listLines.join('\n').trim(),
    keyboard: buildVkCallbackReplyKeyboard(rows),
  });
}

async function selectVkClientChatContext(params: {
  peerId: number | string;
  token?: string | null;
}) {
  if (!params.token) return false;

  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const links = await getConfirmedVkBookingLinks(params.peerId, 8);
  const currentMode = vkClientMode(links);

  const { data: linkRow, error } = await admin
    .from('sloty_booking_vk_links')
    .select('*')
    .eq('token', params.token)
    .eq('status', 'confirmed')
    .maybeSingle();

  if (error) logVkWebhookError('select vk client context read', error);

  const link = linkRow as VkBookingLinkRow | null;
  if (!link) return false;

  await setVkClientState(links, {
    clientMode: currentMode === 'choosing_action_booking' ? 'booking_action' : 'writing_to_master',
    activeChatContextAt: null,
  });
  await setVkClientState([link], { activeChatContextAt: now });

  await sendVkClientBookingDetails({
    peerId: params.peerId,
    link,
    title: currentMode === 'choosing_action_booking' ? 'Действия по записи' : 'Выбрана запись для переписки',
    actionMode: currentMode === 'choosing_action_booking',
  });

  return true;
}


async function handleVkClientMenuBookingAction(params: {
  peerId: number | string;
  vkUserId: number | string;
  action: 'reschedule' | 'cancel';
}) {
  const links = await getConfirmedVkBookingLinks(params.peerId, 8);
  const link = getActiveVkChatContextLink(links) ?? (links.length === 1 ? links[0] : null);

  if (!link) {
    await sendVkClientBookingChoice(params.peerId, 'choosing_action_booking');
    return;
  }

  const result = await handleClientBookingAction({
    bookingId: link.booking_id,
    action: params.action,
    source: 'vk',
    directClientRef: {
      clientVkPeerId: params.peerId,
      clientVkUserId: String(params.vkUserId),
    },
  }).catch((error) => {
    logVkWebhookError('vk client menu booking action failed', error);
    return null;
  });

  await setVkClientState(links, { clientMode: 'writing_to_master', activeChatContextAt: null });
  await setVkClientState([link], { activeChatContextAt: new Date().toISOString() });

  await sendOrEditVkClientCard({
    peerId: params.peerId,
    links,
    message: result?.ok
      ? params.action === 'reschedule'
        ? 'Запрос на перенос отправлен мастеру.'
        : 'Запрос на отмену отправлен мастеру.'
      : 'Не удалось отправить запрос мастеру. Напишите сообщение обычным текстом.',
    keyboard: buildVkClientMenuKeyboard(),
  });
}

async function handleClientVkChatMessage(params: {
  vkUserId: number | string;
  peerId: number | string;
  text?: unknown;
}) {
  const text = typeof params.text === 'string' ? params.text.trim() : '';
  if (!text || text.startsWith('/')) return false;

  const admin = createSupabaseAdminClient();

  const confirmedLinks = await getConfirmedVkBookingLinks(params.peerId, 8);
  const activeContextLink = getActiveVkChatContextLink(confirmedLinks);
  const link = confirmedLinks.length > 1 ? activeContextLink : confirmedLinks[0] ?? null;

  if (confirmedLinks.length > 1 && !activeContextLink) {
    await sendVkClientBookingChoice(params.peerId);
    return true;
  }

  if (!link) return false;

  const { data: bookingRow } = await admin
    .from('sloty_bookings')
    .select('*')
    .eq('id', link.booking_id)
    .maybeSingle();

  const booking = bookingRow ? mapBookingRow(bookingRow as BookingRow) : link.booking_snapshot;
  if (!booking) return false;

  const now = new Date().toISOString();
  const existingThread = await findVkClientThread(link.workspace_id, booking, params.peerId, params.vkUserId).catch(() => null);

  const thread = existingThread
    ? await updateChatThread(link.workspace_id, existingThread.id, {
        channel: 'VK',
        botConnected: true,
        lastMessagePreview: text,
        lastMessageAt: now,
        unreadCount: (existingThread.unreadCount ?? 0) + 1,
        metadata: mergeVkBookingMetadata(existingThread.metadata ?? {}, booking, params.peerId, params.vkUserId),
      }).catch(() => existingThread)
    : await createChatThread(link.workspace_id, {
        clientName: booking.clientName,
        clientPhone: booking.clientPhone,
        channel: 'VK',
        segment: 'active',
        source: 'VK-бот',
        nextVisit: booking.date,
        botConnected: true,
        lastMessagePreview: text,
        lastMessageAt: now,
        unreadCount: 1,
        metadata: mergeVkBookingMetadata(bookingThreadMetadata(booking), booking, params.peerId, params.vkUserId),
      }).catch(() => null);

  if (!thread?.id) return false;

  await createChatMessage(link.workspace_id, {
    threadId: thread.id,
    author: 'client',
    body: text,
    deliveryState: null,
    viaBot: true,
    metadata: {
      bookingId: booking.id,
      source: 'vk_inbox',
      clientVkPeerId: params.peerId,
    },
  }).catch((error) => logVkWebhookError('client vk chat message create', error));

  return true;
}

async function createDirectVkLoginToken(params: {
  vkUserId: number | string;
  peerId: number | string;
  profile: Awaited<ReturnType<typeof getVkBotUserProfile>>;
}) {
  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const token = buildVkLoginToken();
  const user = createVkBotVirtualUser(params.profile);

  await upsertVkBotAccount(admin, {
    userId: user.id,
    vkUserId: params.profile.vkId,
    peerId: params.peerId,
    profile: params.profile,
    messagesAllowed: true,
    metadata: { source: 'vk_start_no_code_direct_login' },
  });

  await upsertVkOauthAccountFromBot(admin, { userId: user.id, profile: params.profile }).catch((error) => {
    logVkWebhookError('vk account mirror skipped', error);
  });

  const { error } = await admin.from('sloty_vk_login_requests').insert({
    token,
    status: 'confirmed',
    vk_user_id: params.profile.vkId,
    peer_id: Number(params.peerId),
    first_name: params.profile.firstName,
    last_name: params.profile.lastName,
    screen_name: params.profile.screenName || params.profile.domain,
    photo_url: params.profile.photoUrl,
    confirmed_at: now,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    metadata: {
      next: '/dashboard',
      mode: 'login',
      source: 'vk_start_no_code_direct_login',
      profile: params.profile.rawProfile ?? {},
    },
  });

  if (error) throw error;

  return token;
}

async function handleMessageNew(payload: VkCallbackPayload) {
  const message = payload.object?.message && typeof payload.object.message === 'object'
    ? (payload.object.message as Record<string, unknown>)
    : payload.object && typeof payload.object === 'object'
      ? (payload.object as Record<string, unknown>)
      : null;

  const vkUserId = numberValue(message?.from_id);
  const peerId = numberValue(message?.peer_id) ?? vkUserId;

  if (!message || !vkUserId || !peerId) return;

  const token = extractAuthToken(message);
  const bookingToken = extractBookingToken(message);

  if (token) {
    await confirmVkLogin({ token, vkUserId, peerId });
    return;
  }

  const profile = await getVkBotUserProfile(vkUserId).catch(() => ({
    vkId: String(vkUserId),
    firstName: null,
    lastName: null,
    fullName: null,
    screenName: null,
    domain: null,
    photoUrl: null,
    rawProfile: { source: 'message_new_fallback' },
  }));
  const user = createVkBotVirtualUser(profile);

  await upsertVkBotAccount(createSupabaseAdminClient(), {
    userId: user.id,
    vkUserId: profile.vkId,
    peerId,
    profile,
    messagesAllowed: true,
    metadata: {
      source: 'message_new',
      lastText: typeof message.text === 'string' ? message.text : null,
      ref: typeof message.ref === 'string' ? message.ref : null,
      refSource: typeof message.ref_source === 'string' ? message.ref_source : null,
    },
  }).catch((error) => logVkWebhookError('remember vk user', error));

  if (bookingToken) {
    await handleVkBookingStart({ token: bookingToken, vkUserId, peerId, profile });
    return;
  }

  if (isStartLikeText(message.text)) {
    const directLoginToken = await createDirectVkLoginToken({ vkUserId, peerId, profile });

    await sendVkReply({
      label: 'vk_start_direct_login',
      peerId,
      textPreview: 'КликБук готов к входу через VK.',
      send: () => sendVkLoginConfirmedMessage({
        peerId,
        token: directLoginToken,
      }),
    });
    return;
  }

  const clientMenuAction = vkClientMenuActionFromText(message.text);
  const clientLinksForText = await getConfirmedVkBookingLinks(peerId, 8);
  const clientModeForText = vkClientMode(clientLinksForText);
  const numberedTextLinkIndex = extractVkBookingButtonIndex(message.text);
  const numberedTextLink = numberedTextLinkIndex !== null ? clientLinksForText[numberedTextLinkIndex] ?? null : null;
  const commandConversationMessageId = numberValue(message.conversation_message_id) ?? numberValue(message.id);

  if ((clientMenuAction || numberedTextLink) && commandConversationMessageId) {
    await deleteVkMessage({ peerId, conversationMessageId: commandConversationMessageId }).catch(() => null);
  }

  if (clientMenuAction === 'back') {
    await setVkClientState(clientLinksForText, { clientMode: 'idle', activeChatContextAt: null });
    await sendOrEditVkClientCard({
      peerId,
      links: clientLinksForText,
      message: 'Главное меню.',
      keyboard: buildVkClientMenuKeyboard(),
    });
    return;
  }

  if (clientMenuAction === 'help') {
    await sendOrEditVkClientCard({
      peerId,
      links: clientLinksForText,
      message: 'Помощь: выберите запись, напишите мастеру или запросите перенос/отмену.',
      keyboard: buildVkClientMenuKeyboard(),
    });
    return;
  }

  if (clientMenuAction === 'bookings') {
    await sendVkClientBookingChoice(peerId, 'choosing_chat_booking');
    return;
  }

  if (clientMenuAction === 'write') {
    const activeLink = getActiveVkChatContextLink(clientLinksForText);
    if (clientLinksForText.length === 1 || activeLink) {
      const link = activeLink ?? clientLinksForText[0];
      await setVkClientState(clientLinksForText, { clientMode: 'writing_to_master', activeChatContextAt: null });
      await setVkClientState([link], { activeChatContextAt: new Date().toISOString() });
      await sendVkClientBookingDetails({ peerId, link, title: 'Запись выбрана' });
      return;
    }
    await sendVkClientBookingChoice(peerId, 'choosing_chat_booking');
    return;
  }

  if (clientMenuAction === 'reschedule_cancel') {
    const activeLink = getActiveVkChatContextLink(clientLinksForText);
    if (clientLinksForText.length === 1 || activeLink) {
      const link = activeLink ?? clientLinksForText[0];
      await setVkClientState(clientLinksForText, { clientMode: 'booking_action', activeChatContextAt: null });
      await setVkClientState([link], { activeChatContextAt: new Date().toISOString() });
      await sendVkClientBookingDetails({ peerId, link, title: 'Действия по записи', actionMode: true });
      return;
    }
    await sendVkClientBookingChoice(peerId, 'choosing_action_booking');
    return;
  }

  if (clientMenuAction === 'reschedule' || clientMenuAction === 'cancel') {
    await handleVkClientMenuBookingAction({ peerId, vkUserId, action: clientMenuAction });
    return;
  }

  if (numberedTextLink && clientModeForText === 'choosing_chat_booking') {
    await selectVkClientChatContext({ peerId, token: numberedTextLink.token });
    return;
  }

  if (numberedTextLink && clientModeForText === 'choosing_action_booking') {
    await selectVkClientChatContext({ peerId, token: numberedTextLink.token });
    return;
  }

  if (isFaqLikeText(message.text)) {
    await sendVkReply({
      label: 'faq_from_text',
      peerId,
      textPreview: 'FAQ КликБук.',
      send: () => sendVkBotFaqMessage({ peerId }),
    });
    return;
  }

  if (isSupportLikeText(message.text)) {
    await sendVkReply({
      label: 'support_from_text',
      peerId,
      textPreview: 'Поддержка КликБук.',
      send: () => sendVkBotSupportMessage({ peerId }),
    });
    return;
  }

  if (isNotificationLikeText(message.text)) {
    await sendVkReply({
      label: 'notifications_from_text',
      peerId,
      textPreview: 'Уведомления VK.',
      send: () => sendVkBotNotificationsMessage({ peerId }),
    });
    return;
  }

  if (isBookingsLikeText(message.text)) {
    await sendVkClientBookingChoice(peerId);
    return;
  }

  const clientChatHandled = await handleClientVkChatMessage({ vkUserId, peerId, text: message.text });
  if (clientChatHandled) return;

  await sendVkReply({
    label: 'auth_fallback',
    peerId,
    textPreview: 'Главное меню КликБук.',
    send: () => sendVkBotAuthFallbackMessage({ peerId }),
  });
}


async function editOrSendVkCard(params: {
  peerId: number | string;
  conversationMessageId?: number | null;
  message: string;
  keyboard: Record<string, unknown>;
}) {
  if (params.conversationMessageId) {
    try {
      await editVkMessage({
        peerId: params.peerId,
        conversationMessageId: params.conversationMessageId,
        message: params.message,
        keyboard: params.keyboard,
      });
      return;
    } catch (error) {
      logVkWebhookError('edit vk card fallback', error);
    }
  }

  await sendVkMessage({ peerId: params.peerId, message: params.message, keyboard: params.keyboard });
}

async function handleMessageEvent(payload: VkCallbackPayload) {
  const object = payload.object && typeof payload.object === 'object' ? (payload.object as Record<string, unknown>) : null;
  const eventPayload = normalizePayload(object?.payload);
  const vkUserId = numberValue(object?.user_id);
  const peerId = numberValue(object?.peer_id) ?? vkUserId;
  const eventId = typeof object?.event_id === 'string' ? object.event_id : null;
  const conversationMessageId = numberValue(object?.conversation_message_id) ?? numberValue(object?.message_id);

  if (!object || !vkUserId || !peerId || !eventId) return;

  const action = typeof eventPayload?.action === 'string' ? eventPayload.action : null;
  const token = extractAuthToken(null, eventPayload);
  const appUrl = getAppUrl();

  if (action === 'reschedule_proposal_accept' || action === 'reschedule_proposal_decline') {
    const proposalId = typeof eventPayload?.proposal_id === 'string' ? eventPayload.proposal_id : null;
    const proposalAction = action === 'reschedule_proposal_accept' ? 'accept' : 'decline';

    if (!proposalId) {
      await answerVkMessageEvent({ eventId, userId: vkUserId, peerId, text: 'Предложение переноса не найдено.' })
        .catch((error) => logVkWebhookError('answer reschedule proposal missing id', error));
      return;
    }

    const result = await handleRescheduleProposalAction({
      proposalId,
      action: proposalAction,
      source: 'vk',
      directClientRef: { clientVkPeerId: peerId, clientVkUserId: String(vkUserId) },
    }).catch((error) => {
      logVkWebhookError('vk reschedule proposal action', error);
      return null;
    });

    await answerVkMessageEvent({
      eventId,
      userId: vkUserId,
      peerId,
      text: result?.ok
        ? proposalAction === 'accept'
          ? 'Перенос подтверждён.'
          : 'Мастер подберёт другой слот.'
        : 'Не удалось обработать перенос.',
    }).catch((error) => logVkWebhookError('answer vk reschedule proposal action', error));

    const clientText = result?.ok
      ? proposalAction === 'accept'
        ? 'Спасибо, перенос подтверждён ✅\n\nЗапись обновлена.\nКнопки больше не активны.'
        : 'Поняли, это время не подходит.\n\nМастер подберёт другой слот и ответит вам в этом чате.\nКнопки больше не активны.'
      : 'Не удалось обработать перенос.\n\nНапишите мастеру обычным сообщением в этот диалог.';

    if (conversationMessageId) {
      await editVkMessage({
        peerId,
        conversationMessageId,
        message: clientText,
        keyboard: null,
      }).catch((error) => logVkWebhookError('edit vk reschedule proposal message', error));
    } else {
      await sendVkReply({
        label: proposalAction === 'accept' ? 'reschedule_proposal_accepted' : 'reschedule_proposal_declined',
        peerId,
        textPreview: proposalAction === 'accept' ? 'Перенос подтверждён.' : 'Нужно другое время.',
        send: () => sendVkMessage({ peerId, message: clientText }),
      });
    }
    return;
  }

  if (action === 'client_booking_confirm' || action === 'client_booking_reschedule') {
    const bookingId = typeof eventPayload?.booking_id === 'string' ? eventPayload.booking_id : null;
    const clientAction = action === 'client_booking_confirm' ? 'confirm' : 'reschedule';

    if (!bookingId) {
      await answerVkMessageEvent({
        eventId,
        userId: vkUserId,
        peerId,
        text: 'Запись не найдена.',
      }).catch((error) => logVkWebhookError('answer client booking missing id', error));
      return;
    }

    const result = await handleClientBookingAction({
      bookingId,
      action: clientAction,
      source: 'vk',
      directClientRef: {
        clientVkPeerId: peerId,
        clientVkUserId: String(vkUserId),
      },
    }).catch((error) => {
      logVkWebhookError('client vk booking action', error);
      return null;
    });

    await answerVkMessageEvent({
      eventId,
      userId: vkUserId,
      peerId,
      text:
        result?.ok && clientAction === 'confirm'
          ? 'Запись подтверждена.'
          : result?.ok
            ? 'Запрос на перенос отправлен мастеру.'
            : 'Не удалось обработать действие.',
    }).catch((error) => logVkWebhookError('answer client booking action', error));

    const clientText = result?.ok && clientAction === 'confirm'
      ? 'Спасибо, запись подтверждена ✅\n\nЗапись обновлена.\nКнопки больше не активны.'
      : result?.ok
        ? 'Поняли, запрос на перенос отправлен мастеру.\n\nСлот освобождён. Мастер подберёт новое время и ответит вам в этом чате.'
        : 'Не удалось обработать действие.\n\nНапишите мастеру обычным сообщением в этот диалог.';

    if (conversationMessageId) {
      await editVkMessage({
        peerId,
        conversationMessageId,
        message: clientText,
        keyboard: null,
      }).catch((error) => logVkWebhookError('edit vk client booking action message', error));
    } else {
      await sendVkReply({
        label: clientAction === 'confirm' ? 'client_booking_confirmed' : 'client_booking_reschedule_requested',
        peerId,
        textPreview: clientAction === 'confirm' ? 'Запись подтверждена.' : 'Запрос на перенос отправлен мастеру.',
        send: () => sendVkMessage({ peerId, message: clientText }),
      });
    }
    return;
  }

  if (action === 'open_dashboard') {
    let dashboardToken = token;

    if (!dashboardToken) {
      try {
        const profile = await getVkBotUserProfile(vkUserId).catch(() => ({
          vkId: String(vkUserId),
          firstName: null,
          lastName: null,
          fullName: null,
          screenName: null,
          domain: null,
          photoUrl: null,
          rawProfile: { source: 'open_dashboard_callback_fallback' },
        }));
        dashboardToken = await createDirectVkLoginToken({ vkUserId, peerId, profile });
      } catch (error) {
        logVkWebhookError('create direct token from button', error);
      }
    }

    if (!dashboardToken) {
      await answerVkMessageEvent({
        eventId,
        userId: vkUserId,
        peerId,
        text: 'Не удалось создать вход. Отправьте /start и нажмите кнопку ещё раз.',
      }).catch((error) => logVkWebhookError('answer open dashboard without token', error));
      return;
    }

    try {
      const admin = createSupabaseAdminClient();
      const { data: row } = await admin
        .from('sloty_vk_login_requests')
        .select('status, expires_at')
        .eq('token', dashboardToken)
        .maybeSingle();

      if (row && row.status === 'pending' && new Date(row.expires_at).getTime() >= Date.now()) {
        await confirmVkLogin({ token: dashboardToken, vkUserId, peerId });
      }
    } catch (error) {
      logVkWebhookError('lazy confirm from button', error);
    }

    await answerVkMessageEvent({
      eventId,
      userId: vkUserId,
      peerId,
      link: `${appUrl}/api/auth/vk/complete?token=${encodeURIComponent(dashboardToken)}`,
    }).catch((error) => logVkWebhookError('answer open dashboard', error));
    return;
  }

  if (action === 'open_url') {
    const url = typeof eventPayload?.url === 'string' ? eventPayload.url : appUrl;
    const safeUrl = url.startsWith(appUrl) ? url : appUrl;

    await answerVkMessageEvent({
      eventId,
      userId: vkUserId,
      peerId,
      link: safeUrl,
    }).catch((error) => logVkWebhookError('answer open url', error));
    return;
  }

  if (action === 'notifications' || action === 'notifications_enabled') {
    await answerVkMessageEvent({
      eventId,
      userId: vkUserId,
      peerId,
      text: 'Уведомления VK включены.',
    }).catch((error) => logVkWebhookError('answer notifications', error));

    await sendVkReply({
      label: 'notifications_menu',
      peerId,
      textPreview: 'Уведомления VK включены.',
      send: () => sendVkBotNotificationsMessage({ peerId, token }),
    });
    return;
  }

  if (action === 'client_bookings') {
    await answerVkMessageEvent({
      eventId,
      userId: vkUserId,
      peerId,
      text: 'Показываю ваши записи.',
    }).catch((error) => logVkWebhookError('answer client bookings', error));

    await sendVkClientBookingChoice(peerId);
    return;
  }


  if (action === 'client_write') {
    await answerVkMessageEvent({ eventId, userId: vkUserId, peerId, text: 'Выберите запись для переписки.' })
      .catch((error) => logVkWebhookError('answer client write', error));
    await sendVkClientBookingChoice(peerId, 'choosing_chat_booking');
    return;
  }

  if (action === 'client_reschedule_cancel') {
    await answerVkMessageEvent({ eventId, userId: vkUserId, peerId, text: 'Выберите запись для действия.' })
      .catch((error) => logVkWebhookError('answer client reschedule cancel', error));
    await sendVkClientBookingChoice(peerId, 'choosing_action_booking');
    return;
  }

  if (action === 'client_back') {
    await answerVkMessageEvent({ eventId, userId: vkUserId, peerId, text: 'Главное меню.' })
      .catch((error) => logVkWebhookError('answer client back', error));
    const links = await getConfirmedVkBookingLinks(peerId, 8);
    await setVkClientState(links, { clientMode: 'idle' });
    await sendOrEditVkClientCard({
      peerId,
      links,
      message: 'Главное меню.',
      keyboard: buildVkClientMenuKeyboard(token),
    });
    return;
  }

  if (action === 'client_action_reschedule' || action === 'client_action_cancel') {
    const isCancel = action === 'client_action_cancel';
    await answerVkMessageEvent({
      eventId,
      userId: vkUserId,
      peerId,
      text: isCancel ? 'Запрос на отмену отправлен.' : 'Запрос на перенос отправлен.',
    }).catch((error) => logVkWebhookError('answer client action request', error));

    await handleVkClientMenuBookingAction({
      vkUserId,
      peerId,
      action: isCancel ? 'cancel' : 'reschedule',
    });
    return;
  }

  if (action === 'client_chat_context') {
    await answerVkMessageEvent({
      eventId,
      userId: vkUserId,
      peerId,
      text: 'Запись выбрана. Напишите следующее сообщение.',
    }).catch((error) => logVkWebhookError('answer client chat context', error));

    await selectVkClientChatContext({ peerId, token: typeof eventPayload?.token === 'string' ? eventPayload.token : token });
    return;
  }

  if (action === 'bookings') {
    await answerVkMessageEvent({
      eventId,
      userId: vkUserId,
      peerId,
      text: 'Открыл раздел записей в боте.',
    }).catch((error) => logVkWebhookError('answer bookings', error));

    const clientLinks = await getConfirmedVkBookingLinks(peerId, 1);
    if (clientLinks.length > 0) {
      await sendVkClientBookingChoice(peerId);
    } else {
      await sendVkReply({
        label: 'bookings_menu',
        peerId,
        textPreview: 'Мои записи.',
        send: () => sendVkBotBookingsMessage({ peerId, token }),
      });
    }
    return;
  }

  if (action === 'faq' || action === 'help' || action === 'support') {
    await answerVkMessageEvent({ eventId, userId: vkUserId, peerId, text: 'Помощь открыта.' })
      .catch((error) => logVkWebhookError('answer client help', error));

    const links = await getConfirmedVkBookingLinks(peerId, 8);
    if (links.length > 0) {
      await sendOrEditVkClientCard({
        peerId,
        links,
        message: 'Помощь: выберите запись, напишите мастеру или запросите перенос/отмену.',
        keyboard: buildVkClientMenuKeyboard(token),
      });
      return;
    }

    await editOrSendVkCard({
      peerId,
      conversationMessageId,
      message: [
        'FAQ КликБук',
        '',
        'Выберите тему ниже — ответ появится в этой же карточке.',
      ].join('\n'),
      keyboard: buildVkFaqKeyboard(token),
    });
    return;
  }

  if (action === 'faq_login' || action === 'faq_bookings' || action === 'faq_notifications' || action === 'faq_tariffs') {
    const topic = action.replace('faq_', '') as 'login' | 'bookings' | 'notifications' | 'tariffs';

    await answerVkMessageEvent({
      eventId,
      userId: vkUserId,
      peerId,
      text: 'Ответ отправлен в диалог.',
    }).catch((error) => logVkWebhookError(`answer ${action}`, error));

    await sendVkReply({
      label: action,
      peerId,
      textPreview: `FAQ: ${topic}`,
      send: () => sendVkBotFaqAnswerMessage({ peerId, token, topic }),
    });
    return;
  }

  if (action === 'support' || action === 'support_human') {
    await answerVkMessageEvent({ eventId, userId: vkUserId, peerId, text: 'Поддержка открыта.' })
      .catch((error) => logVkWebhookError('answer support', error));

    await editOrSendVkCard({
      peerId,
      conversationMessageId,
      message: ['Поддержка КликБук', '', 'Напишите вопрос обычным сообщением. Если нужно — откройте FAQ.'].join('\n'),
      keyboard: buildVkSupportKeyboard(token),
    });
    return;
  }

  if (action === 'back_main' || action === 'noop') {
    await answerVkMessageEvent({ eventId, userId: vkUserId, peerId, text: 'Главное меню.' })
      .catch((error) => logVkWebhookError('answer main menu', error));

    await editOrSendVkCard({
      peerId,
      conversationMessageId,
      message: ['КликБук на связи ✅', '', 'Выберите действие ниже.'].join('\n'),
      keyboard: buildVkMainMenuKeyboard(token),
    });
    return;
  }

  await answerVkMessageEvent({
    eventId,
    userId: vkUserId,
    peerId,
    text: 'Я отправил главное меню в диалог.',
  }).catch((error) => logVkWebhookError('answer unknown event', error));

  await sendVkReply({
    label: 'unknown_action_menu',
    peerId,
    textPreview: 'Главное меню КликБук.',
    send: () => sendVkBotWelcomeMessage({ peerId, token }),
  });
}

async function handleMessageAllow(payload: VkCallbackPayload) {
  const object = payload.object && typeof payload.object === 'object' ? (payload.object as Record<string, unknown>) : null;
  const vkUserId = numberValue(object?.user_id);

  if (!vkUserId) return;

  const profile = await getVkBotUserProfile(vkUserId).catch(() => ({
    vkId: String(vkUserId),
    firstName: null,
    lastName: null,
    fullName: null,
    screenName: null,
    domain: null,
    photoUrl: null,
    rawProfile: { source: 'message_allow_fallback' },
  }));
  const user = createVkBotVirtualUser(profile);

  await upsertVkBotAccount(createSupabaseAdminClient(), {
    userId: user.id,
    vkUserId: profile.vkId,
    peerId: vkUserId,
    profile,
    messagesAllowed: true,
    metadata: { source: 'message_allow' },
  }).catch((error) => logVkWebhookError('message allow upsert', error));

  const directLoginToken = await createDirectVkLoginToken({ vkUserId, peerId: vkUserId, profile }).catch(() => null);

  await sendVkReply({
    label: 'message_allow_welcome',
    peerId: vkUserId,
    textPreview: 'Сообщения VK подключены к КликБук.',
    send: () => sendVkBotWelcomeMessage({ peerId: vkUserId, token: directLoginToken }),
  });
}

async function handleMessageDeny(payload: VkCallbackPayload) {
  const object = payload.object && typeof payload.object === 'object' ? (payload.object as Record<string, unknown>) : null;
  const vkUserId = numberValue(object?.user_id);

  if (!vkUserId) return;

  try {
    await createSupabaseAdminClient()
      .from('sloty_vk_bot_accounts')
      .update({ messages_allowed: false, updated_at: new Date().toISOString() })
      .eq('vk_user_id', String(vkUserId));
  } catch {}
}

export async function POST(request: Request) {
  let payload: VkCallbackPayload;

  try {
    payload = (await request.json()) as VkCallbackPayload;
  } catch {
    return textResponse('bad request', { status: 400 });
  }

  if (payload.type === 'confirmation') {
    if (!verifyVkCallback(payload)) return textResponse('forbidden', { status: 403 });

    const code = getConfirmationCode();
    return textResponse(code || 'missing_confirmation_code');
  }

  if (!verifyVkCallback(payload)) {
    return textResponse('forbidden', { status: 403 });
  }

  try {
    const messageForLog = payload.object?.message && typeof payload.object.message === 'object'
      ? payload.object.message
      : payload.object && typeof payload.object === 'object'
        ? payload.object
        : null;
    const vkUserIdForLog = numberValue(messageForLog?.from_id ?? messageForLog?.user_id);
    const peerIdForLog = numberValue(messageForLog?.peer_id) ?? vkUserIdForLog;

    await writeVkWebhookLog({
      eventType: payload.type,
      groupId: payload.group_id ?? null,
      vkUserId: vkUserIdForLog,
      peerId: peerIdForLog,
      text: messageForLog?.text,
      ref: messageForLog?.ref ?? messageForLog?.ref_source,
      status: 'received',
      payload,
    });

    if (payload.type === 'message_new') {
      await handleMessageNew(payload);
    } else if (payload.type === 'message_event') {
      await handleMessageEvent(payload);
    } else if (payload.type === 'message_allow') {
      await handleMessageAllow(payload);
    } else if (payload.type === 'message_deny') {
      await handleMessageDeny(payload);
    }
  } catch (error) {
    logVkWebhookError(payload.type || 'unknown', error);
    await writeVkWebhookLog({
      eventType: payload.type,
      groupId: payload.group_id ?? null,
      status: 'error',
      error,
      payload,
    });
  }

  return textResponse('ok');
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: '/api/vk/webhook',
    groupId: getVkBotGroupId() || null,
    hasAccessToken: Boolean(process.env.VK_BOT_ACCESS_TOKEN || process.env.VK_GROUP_ACCESS_TOKEN),
    hasConfirmationCode: Boolean(getConfirmationCode()),
    hasSecret: Boolean(getCallbackSecret()),
  });
}
