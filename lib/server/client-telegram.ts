import 'server-only';

import type { Booking } from '@/lib/types';
import { supabaseRestRequest } from '@/lib/server/supabase-rest';
import { sendTelegramMessage } from '@/lib/server/telegram-bot';

type BookingTelegramLinkRow = {
  booking_id: string | null;
  workspace_id: string;
  chat_id: number | null;
  telegram_id: number | null;
  status: string;
  confirmed_at: string | null;
  booking_snapshot: Booking | null;
};

function normalizePhone(value?: string | null) {
  return (value ?? '').replace(/\D+/g, '');
}

async function listConfirmedClientLinks(workspaceId: string) {
  const response = await supabaseRestRequest(
    `/rest/v1/sloty_booking_telegram_links?workspace_id=eq.${encodeURIComponent(workspaceId)}&status=eq.confirmed&select=booking_id,workspace_id,chat_id,telegram_id,status,confirmed_at,booking_snapshot&order=confirmed_at.desc.nullslast`,
  );

  return (await response.json()) as BookingTelegramLinkRow[];
}

export async function findClientTelegramChatId(params: {
  workspaceId: string;
  bookingId?: string | null;
  clientPhone?: string | null;
  clientName?: string | null;
  directChatId?: number | string | null;
}) {
  if (params.directChatId) return params.directChatId;
  const rows = await listConfirmedClientLinks(params.workspaceId);
  const normalizedPhone = normalizePhone(params.clientPhone);

  const exact = params.bookingId
    ? rows.find((row) => row.booking_id === params.bookingId && row.chat_id)
    : null;

  if (exact?.chat_id) return exact.chat_id;

  if (normalizedPhone) {
    const byPhone = rows.find((row) => {
      const snapshotPhone = normalizePhone(row.booking_snapshot?.clientPhone);
      return row.chat_id && snapshotPhone && snapshotPhone === normalizedPhone;
    });

    if (byPhone?.chat_id) return byPhone.chat_id;
  }

  const normalizedName = (params.clientName ?? '').trim().toLowerCase();
  if (normalizedName) {
    const byName = rows.find((row) =>
      row.chat_id &&
      (row.booking_snapshot?.clientName ?? '').trim().toLowerCase() === normalizedName,
    );

    if (byName?.chat_id) return byName.chat_id;
  }

  return null;
}

export async function sendClientTelegramMessage(params: {
  workspaceId: string;
  bookingId?: string | null;
  clientPhone?: string | null;
  clientName?: string | null;
  directChatId?: number | string | null;
  text: string;
  replyMarkup?: Record<string, unknown>;
}) {
  const chatId = await findClientTelegramChatId({
    workspaceId: params.workspaceId,
    bookingId: params.bookingId,
    clientPhone: params.clientPhone,
    clientName: params.clientName,
    directChatId: params.directChatId,
  });

  if (!chatId) return false;

  await sendTelegramMessage({
    chatId,
    text: params.text,
    replyMarkup: params.replyMarkup,
  });

  return true;
}
