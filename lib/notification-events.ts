import type { Booking } from '@/lib/types';
import type { Appointment, Thread } from '@/lib/mini-demo';

export type NotificationTone = 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
export type NotificationKind = 'booking' | 'message' | 'reschedule' | 'payment' | 'review' | 'system';

export interface NotificationEvent {
  id: string;
  kind: NotificationKind;
  tone: NotificationTone;
  icon: string;
  title: string;
  text: string;
  time: string;
  sortAt: number;
  unread?: boolean;
  href?: string;
  source?: string;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function parseDateMs(value?: string | null) {
  if (!value) return 0;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function bookingDateTimeMs(date?: string, time?: string) {
  if (!date) return 0;
  const ms = new Date(`${date}T${time || '00:00'}:00`).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function formatDate(date?: string, time?: string) {
  if (!date) return time || 'время не указано';
  const d = new Date(`${date}T00:00:00`);
  const label = Number.isFinite(d.getTime())
    ? d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
    : date;
  return `${label}${time ? ` · ${time}` : ''}`;
}

function relative(ms: number) {
  if (!ms) return 'недавно';
  const diff = Date.now() - ms;
  if (diff < 60_000) return 'только что';
  if (diff < 3_600_000) return `${Math.max(1, Math.round(diff / 60_000))} мин`;
  if (diff < 86_400_000) return `${Math.round(diff / 3_600_000)} ч`;
  if (diff < 604_800_000) return `${Math.round(diff / 86_400_000)} дн`;
  return new Date(ms).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function normalizeStatus(status?: string) {
  return String(status || '').toLowerCase();
}

export function buildBookingEventNotifications(bookings: Booking[] = []): NotificationEvent[] {
  const events: NotificationEvent[] = [];

  for (const booking of bookings) {
    const meta = asRecord(booking.metadata);
    const client = booking.clientName || 'Клиент';
    const service = booking.service || 'услуга';
    const visitLabel = formatDate(booking.date, booking.time);
    const status = normalizeStatus(booking.status);
    const createdAt = parseDateMs(booking.createdAt) || bookingDateTimeMs(booking.date, booking.time);
    const rescheduleAt = parseDateMs(booking.rescheduleRequestedAt)
      || parseDateMs(String(meta.rescheduleRequestedAt || ''))
      || createdAt;

    const hasRescheduleRequest = booking.cancelReason === 'client_reschedule_requested'
      || Boolean(booking.rescheduleRequestedAt)
      || Boolean(meta.rescheduleRequested)
      || Boolean(meta.rescheduleRequestBookingId);
    const acceptedReschedule = Boolean(meta.acceptedRescheduleProposalId) || meta.rescheduleProposalStatus === 'accepted';
    const declinedReschedule = Boolean(meta.declinedRescheduleProposalId) || meta.rescheduleProposalStatus === 'declined';

    if (hasRescheduleRequest) {
      events.push({
        id: `reschedule-${booking.id}`,
        kind: 'reschedule',
        tone: 'warning',
        icon: 'refresh-cw',
        title: 'Клиент просит перенос',
        text: `${client} · ${service} · было ${visitLabel}`,
        time: relative(rescheduleAt),
        sortAt: rescheduleAt,
        unread: true,
        href: '/dashboard/today',
        source: booking.source || booking.channel || 'booking',
      });
    }

    if (acceptedReschedule) {
      const nextDate = String(meta.rescheduledFromDate ? booking.date : (meta.rescheduleProposalDate || booking.rescheduleProposedDate || booking.date || ''));
      const nextTime = String(meta.rescheduleProposalTime || booking.rescheduleProposedTime || booking.time || '');
      const sortAt = parseDateMs(String(meta.rescheduledAt || '')) || createdAt;
      events.push({
        id: `reschedule-accepted-${booking.id}`,
        kind: 'reschedule',
        tone: 'success',
        icon: 'badge-check',
        title: 'Клиент подтвердил перенос',
        text: `${client} · новое время ${formatDate(nextDate, nextTime)}`,
        time: relative(sortAt),
        sortAt,
        href: '/dashboard/today',
        source: booking.source || booking.channel || 'booking',
      });
    }

    if (declinedReschedule) {
      const sortAt = parseDateMs(String(meta.declinedRescheduleAt || '')) || createdAt;
      events.push({
        id: `reschedule-declined-${booking.id}`,
        kind: 'reschedule',
        tone: 'danger',
        icon: 'circle-x',
        title: 'Клиент отклонил перенос',
        text: `${client} · нужно предложить другое окно`,
        time: relative(sortAt),
        sortAt,
        unread: true,
        href: '/dashboard/chats',
        source: booking.source || booking.channel || 'booking',
      });
    }

    if (status === 'new') {
      events.push({
        id: `new-${booking.id}`,
        kind: 'booking',
        tone: 'accent',
        icon: 'calendar-plus',
        title: 'Новая запись',
        text: `${client} · ${service} · ${visitLabel}`,
        time: relative(createdAt),
        sortAt: createdAt,
        unread: true,
        href: '/dashboard/today',
        source: booking.source || booking.channel || 'booking',
      });
    }

    if (status === 'cancelled' && !hasRescheduleRequest) {
      const sortAt = parseDateMs(booking.cancelledAt) || createdAt;
      events.push({
        id: `cancelled-${booking.id}`,
        kind: 'booking',
        tone: 'danger',
        icon: 'calendar-x',
        title: 'Запись отменена',
        text: `${client} · ${service} · ${visitLabel}`,
        time: relative(sortAt),
        sortAt,
        unread: true,
        href: '/dashboard/today',
        source: booking.source || booking.channel || 'booking',
      });
    }

    if (status === 'no_show') {
      const sortAt = parseDateMs(booking.noShowAt) || bookingDateTimeMs(booking.date, booking.time) || createdAt;
      events.push({
        id: `noshow-${booking.id}`,
        kind: 'booking',
        tone: 'warning',
        icon: 'user-x',
        title: 'Клиент не пришёл',
        text: `${client} · ${service} · ${visitLabel}`,
        time: relative(sortAt),
        sortAt,
        href: '/dashboard/today',
        source: booking.source || booking.channel || 'booking',
      });
    }
  }

  return dedupeAndSort(events);
}

export function buildMiniEventNotifications(appointments: Appointment[] = [], threads: Thread[] = []): NotificationEvent[] {
  const bookingEvents: NotificationEvent[] = appointments.flatMap((appt) => {
    const id = appt.id || `${appt.name}-${appt.date}-${appt.time}`;
    const status = normalizeStatus(appt.rawStatus || appt.status);
    const visitMs = bookingDateTimeMs(appt.date, appt.time) || Date.now();
    const visitLabel = formatDate(appt.date, appt.time);
    const events: NotificationEvent[] = [];
    const text = `${appt.name} · ${appt.service} · ${visitLabel}`;

    if (status === 'new') {
      events.push({ id: `mini-new-${id}`, kind: 'booking', tone: 'accent', icon: 'calendar-plus', title: 'Новая запись', text, time: relative(visitMs), sortAt: visitMs, unread: true, source: appt.source || 'booking' });
    }
    if (status === 'cancelled') {
      events.push({ id: `mini-cancel-${id}`, kind: 'booking', tone: 'danger', icon: 'calendar-x', title: 'Запись отменена', text, time: relative(visitMs), sortAt: visitMs, unread: true, source: appt.source || 'booking' });
    }
    if (status === 'no_show') {
      events.push({ id: `mini-noshow-${id}`, kind: 'booking', tone: 'warning', icon: 'user-x', title: 'No-show', text, time: relative(visitMs), sortAt: visitMs, source: appt.source || 'booking' });
    }

    return events;
  });

  const chatEvents: NotificationEvent[] = threads
    .filter((thread) => thread.unread > 0)
    .map((thread) => ({
      id: `mini-chat-${thread.id}`,
      kind: 'message',
      tone: 'accent',
      icon: thread.botConnected ? 'bot' : 'message-circle',
      title: thread.botConnected ? 'Событие от бота' : 'Новое сообщение',
      text: `${thread.name}: ${thread.last || 'Новое входящее'}`,
      time: thread.time || 'недавно',
      sortAt: Date.now() - 1_000 * Number(thread.unread || 1),
      unread: true,
      source: thread.channel,
    }));

  return dedupeAndSort([...chatEvents, ...bookingEvents]);
}

export function unreadEventCount(events: NotificationEvent[]) {
  return events.filter((event) => event.unread).length;
}

function dedupeAndSort(events: NotificationEvent[]) {
  const seen = new Set<string>();
  return events
    .filter((event) => {
      if (seen.has(event.id)) return false;
      seen.add(event.id);
      return true;
    })
    .sort((a, b) => b.sortAt - a.sortAt)
    .slice(0, 30);
}
