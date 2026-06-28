import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { sendMasterVisitCheck, sendTelegramMessage } from '@/lib/server/telegram-bot';
import { sendClientVkBookingReminder } from '@/lib/server/vk-bot';
import { getMasterAddress, getMasterLocationMode, getMasterRouteUrl } from '@/lib/location-links';
import { bookingCode, bookingServicesText } from '@/lib/server/booking-context';
import type { Booking, MasterProfile } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ReminderLinkRow = {
  id: string;
  workspace_id: string;
  booking_id: string;
  booking_snapshot: Booking | null;
  chat_id: number | null;
  reminder_24h_sent_at: string | null;
  reminder_2h_sent_at: string | null;
  status_check_sent_at?: string | null;
};

type VkReminderLinkRow = {
  id: string;
  workspace_id: string;
  booking_id: string;
  booking_snapshot: Booking | null;
  peer_id: number | null;
  reminder_24h_sent_at: string | null;
  reminder_2h_sent_at: string | null;
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
  duration_minutes?: number | null;
  status_check_sent_at?: string | null;
};

function isCronAllowed(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
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
    durationMinutes: row.duration_minutes ?? undefined,
    statusCheckSentAt: row.status_check_sent_at ?? undefined,
  };
}

function bookingStartsAt(booking: Booking) {
  const [hours = '0', minutes = '0'] = booking.time.split(':');
  return new Date(`${booking.date}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`);
}


function bookingEndsAt(booking: Booking) {
  const startsAt = bookingStartsAt(booking).getTime();
  const duration = typeof booking.durationMinutes === 'number' && booking.durationMinutes > 0 ? booking.durationMinutes : 60;
  return new Date(startsAt + duration * 60 * 1000);
}

function shouldAskMasterForVisitResult(booking: Booking) {
  if (booking.status === 'completed' || booking.status === 'no_show' || booking.status === 'cancelled') return false;
  return Date.now() >= bookingEndsAt(booking).getTime() + 15 * 60 * 1000;
}

async function resolveOwnerChatId(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  workspaceId: string,
) {
  const { data: workspace } = await admin
    .from('sloty_workspaces')
    .select('owner_id')
    .eq('id', workspaceId)
    .maybeSingle();

  const ownerId = workspace?.owner_id as string | undefined;
  if (!ownerId) return null;

  const { data: account } = await admin
    .from('sloty_telegram_accounts')
    .select('chat_id')
    .eq('user_id', ownerId)
    .maybeSingle();

  const chatId = account?.chat_id;
  return typeof chatId === 'number' || typeof chatId === 'string' ? chatId : null;
}

function buildVisitPlaceLines(profile: MasterProfile | null) {
  if (!profile || getMasterLocationMode(profile) !== 'address') return ['Формат: онлайн'];

  const address = getMasterAddress(profile);
  const routeUrl = getMasterRouteUrl(profile);

  return [
    address ? `Адрес: ${address}` : null,
    routeUrl ? `Маршрут Яндекс.Карты: ${routeUrl}` : null,
  ].filter(Boolean) as string[];
}

function shouldSendReminder(booking: Booking, hoursBefore: number) {
  const startsAt = bookingStartsAt(booking).getTime();
  const now = Date.now();
  const diffMs = startsAt - now;
  const targetMs = hoursBefore * 60 * 60 * 1000;

  return diffMs > 0 && diffMs <= targetMs;
}

async function resolveBooking(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  row: Pick<ReminderLinkRow, 'booking_id' | 'booking_snapshot'>,
) {
  const { data: bookingRow } = await admin
    .from('sloty_bookings')
    .select('*')
    .eq('id', row.booking_id)
    .maybeSingle();

  if (bookingRow) return mapBookingRow(bookingRow as BookingRow);
  return row.booking_snapshot;
}

async function resolveProfile(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  workspaceId: string,
) {
  const { data } = await admin
    .from('sloty_workspaces')
    .select('profile')
    .eq('id', workspaceId)
    .maybeSingle();

  return (data?.profile as MasterProfile | undefined) ?? null;
}


function clientTelegramMenuReplyMarkup() {
  return {
    keyboard: [
      [{ text: '📋 Мои записи' }, { text: '💬 Написать мастеру' }],
      [{ text: '🔁 Перенос / отмена' }, { text: '🆘 Помощь' }],
    ],
    resize_keyboard: true,
    one_time_keyboard: false,
    is_persistent: true,
    input_field_placeholder: 'Выберите действие или напишите сообщение…',
  };
}

async function sendReminder(params: {
  chatId: number;
  booking: Booking;
  profile: MasterProfile | null;
  hoursBefore: number;
}) {
  const masterName = params.profile?.name || 'мастеру';
  const when = params.hoursBefore >= 24 ? 'завтра' : `через ${params.hoursBefore} часа`;
  const placeLines = buildVisitPlaceLines(params.profile);

  await sendTelegramMessage({
    chatId: params.chatId,
    text: [
      'Напоминание ⏰',
      '',
      `У вас ${when} запись к ${masterName}.`,
      '',
      `Запись: ${bookingCode(params.booking)}`,
      '',
      'Услуги:',
      bookingServicesText(params.booking),
      '',
      `Дата: ${params.booking.date}`,
      `Время: ${params.booking.time}`,
      ...placeLines,
      '',
      params.hoursBefore >= 24
        ? 'Для подтверждения, переноса или сообщения мастеру используйте нижнее меню.'
        : 'Скоро визит.\nНиже адрес и маршрут, если приём проходит по адресу. Хорошего визита!',
    ]
      .filter(Boolean)
      .join('\n'),
    replyMarkup: clientTelegramMenuReplyMarkup(),
  });
}


export async function GET(request: Request) {
  if (!isCronAllowed(request)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const admin = createSupabaseAdminClient();
  const sent: string[] = [];
  const failed: string[] = [];

  const { data, error } = await admin
    .from('sloty_booking_telegram_links')
    .select('*')
    .eq('status', 'confirmed')
    .not('chat_id', 'is', null)
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  for (const rowRaw of data ?? []) {
    const row = rowRaw as ReminderLinkRow;
    if (!row.chat_id) continue;

    try {
      const booking = await resolveBooking(admin, row);
      if (!booking || booking.status === 'cancelled' || booking.status === 'completed' || booking.status === 'no_show') continue;

      const profile = await resolveProfile(admin, row.workspace_id);

      if (!booking.statusCheckSentAt && shouldAskMasterForVisitResult(booking)) {
        const masterChatId = await resolveOwnerChatId(admin, row.workspace_id);
        if (masterChatId) {
          await sendMasterVisitCheck({ chatId: masterChatId, booking, profile });
          await admin
            .from('sloty_bookings')
            .update({ status_check_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq('id', booking.id)
            .then(() => undefined, () => undefined);
          sent.push(row.id + ':visit-check');
          continue;
        }
      }

      if (!row.reminder_24h_sent_at && shouldSendReminder(booking, 24)) {
        await sendReminder({ chatId: row.chat_id, booking, profile, hoursBefore: 24 });
        await admin
          .from('sloty_booking_telegram_links')
          .update({ reminder_24h_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', row.id);
        sent.push(`${row.id}:24h`);
        continue;
      }

      if (!row.reminder_2h_sent_at && shouldSendReminder(booking, 2)) {
        await sendReminder({ chatId: row.chat_id, booking, profile, hoursBefore: 2 });
        await admin
          .from('sloty_booking_telegram_links')
          .update({ reminder_2h_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', row.id);
        sent.push(`${row.id}:2h`);
      }
    } catch {
      failed.push(row.id);
    }
  }

  const { data: vkData, error: vkError } = await admin
    .from('sloty_booking_vk_links')
    .select('*')
    .eq('status', 'confirmed')
    .not('peer_id', 'is', null)
    .limit(100);

  if (!vkError) {
    for (const rowRaw of vkData ?? []) {
      const row = rowRaw as VkReminderLinkRow;
      if (!row.peer_id) continue;

      try {
        const booking = await resolveBooking(admin, row);
        if (!booking || booking.status === 'cancelled' || booking.status === 'completed' || booking.status === 'no_show') continue;

        const profile = await resolveProfile(admin, row.workspace_id);

        if (!row.reminder_24h_sent_at && shouldSendReminder(booking, 24)) {
          await sendClientVkBookingReminder({ peerId: row.peer_id, booking, profile, hoursBefore: 24 });
          await admin
            .from('sloty_booking_vk_links')
            .update({ reminder_24h_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq('id', row.id);
          sent.push(`${row.id}:vk-24h`);
          continue;
        }

        if (!row.reminder_2h_sent_at && shouldSendReminder(booking, 2)) {
          await sendClientVkBookingReminder({ peerId: row.peer_id, booking, profile, hoursBefore: 2 });
          await admin
            .from('sloty_booking_vk_links')
            .update({ reminder_2h_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq('id', row.id);
          sent.push(`${row.id}:vk-2h`);
        }
      } catch {
        failed.push(`${row.id}:vk`);
      }
    }
  }

  const { data: activeBookingRows } = await admin
    .from('sloty_bookings')
    .select('*')
    .in('status', ['new', 'confirmed'])
    .is('status_check_sent_at', null)
    .limit(100);

  for (const bookingRowRaw of activeBookingRows ?? []) {
    const bookingRow = bookingRowRaw as BookingRow & { workspace_id: string };
    try {
      const booking = mapBookingRow(bookingRow);
      if (!shouldAskMasterForVisitResult(booking)) continue;
      const workspaceId = bookingRow.workspace_id;
      const masterChatId = await resolveOwnerChatId(admin, workspaceId);
      if (!masterChatId) continue;
      const profile = await resolveProfile(admin, workspaceId);
      await sendMasterVisitCheck({ chatId: masterChatId, booking, profile });
      await admin
        .from('sloty_bookings')
        .update({ status_check_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', booking.id)
        .then(() => undefined, () => undefined);
      sent.push(booking.id + ':visit-check');
    } catch {
      failed.push((bookingRowRaw as { id?: string }).id ?? 'booking');
    }
  }

  return NextResponse.json({ ok: true, checked: data?.length ?? 0, sent, failed });
}
