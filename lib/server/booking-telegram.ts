import 'server-only';

import crypto from 'node:crypto';
import type { Booking, MasterProfile } from '@/lib/types';
import { supabaseRestRequest } from '@/lib/server/supabase-rest';
import { getTelegramBotDeepLink, sendMasterBookingNotification } from '@/lib/server/telegram-bot';

type TelegramAccountRow = {
  telegram_id: number;
  user_id: string;
  chat_id: number | null;
};

type TelegramLoginRequestRow = {
  chat_id: number | null;
};

function buildBookingToken() {
  // Telegram deep-link payload is limited to 64 chars.
  // We send payload as `b_<token>`, so keep token short enough.
  return crypto.randomBytes(24).toString('hex');
}

export async function createClientTelegramBookingLink(params: {
  workspaceId: string;
  masterSlug: string;
  booking: Booking;
}) {
  const token = buildBookingToken();

  await supabaseRestRequest('/rest/v1/sloty_booking_telegram_links', {
    method: 'POST',
    body: JSON.stringify([
      {
        token,
        workspace_id: params.workspaceId,
        booking_id: params.booking.id,
        master_slug: params.masterSlug,
        booking_snapshot: params.booking,
        status: 'pending',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    ]),
  });

  return {
    token,
    url: getTelegramBotDeepLink(`b_${token}`),
  };
}

export async function notifyWorkspaceOwnerAboutBooking(params: {
  ownerId?: string | null;
  workspaceSlug: string;
  profile?: MasterProfile | null;
  booking: Booking;
}) {
  if (!params.ownerId) return false;

  try {
    const response = await supabaseRestRequest(
      `/rest/v1/sloty_telegram_accounts?user_id=eq.${encodeURIComponent(params.ownerId)}&select=telegram_id,user_id,chat_id&limit=1`,
    );

    const rows = (await response.json()) as TelegramAccountRow[];
    const account = rows[0];
    let chatId = account?.chat_id;

    // Older Telegram logins could store chat_id only in login requests.
    // Fallback keeps master notifications working without forcing a relogin.
    if (!chatId && account?.telegram_id) {
      const loginResponse = await supabaseRestRequest(
        `/rest/v1/sloty_telegram_login_requests?telegram_id=eq.${encodeURIComponent(String(account.telegram_id))}&chat_id=not.is.null&select=chat_id&order=confirmed_at.desc&limit=1`,
      );
      const loginRows = (await loginResponse.json()) as TelegramLoginRequestRow[];
      chatId = loginRows[0]?.chat_id ?? null;
    }

    if (!chatId) return false;

    await sendMasterBookingNotification({
      chatId,
      booking: params.booking,
      profile: params.profile,
      workspaceSlug: params.workspaceSlug,
    });

    return true;
  } catch {
    return false;
  }
}
