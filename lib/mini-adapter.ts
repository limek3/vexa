/**
 * Адаптер мини-приложения: приводит реальные данные workspace/Supabase
 * к компактным моделям, которые используют экраны miniapp.
 */

import type { Booking, MasterProfile } from '@/lib/types';
import type {
  MasterInfo, Service, Appointment, Client, Thread, Message, ApptStatus,
  Template, ScheduleDay,
} from '@/lib/mini-demo';
import type { ChatThreadRecord, ChatMessageRecord } from '@/lib/chat-types';

// ─── Subscription ────────────────────────────────
export interface SubscriptionInfo {
  plan: string;
  planLabel: string;
  status: string;
  currentPeriodEnd: string | null;
  price: string;
  cycle: 'monthly' | 'yearly';
  features: string[];
  limits: {
    services: number;
    bookings: number;
    clients: number;
    templates: number;
    storage: number;
  };
  usage: {
    services: number;
    bookings: number;
    clients: number;
    templates: number;
    storage: number;
  };
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Базовый',
  start: 'Старт',
  pro: 'Pro',
  studio: 'Studio',
  premium: 'Premium',
  business: 'Бизнес',
};

const PLAN_FEATURES: Record<string, string[]> = {
  free: ['Базовая страница записи', 'Ограниченные записи', 'Telegram-бот'],
  start: ['Страница записи', 'Клиентская база', 'Telegram-бот'],
  pro: ['Больше записей и клиентов', 'Шаблоны сообщений', 'Аналитика по записям', 'Интеграции TG/ВК'],
  studio: ['Всё из Pro', 'Расширенные лимиты', 'Продвижение и каналы', 'Приоритетная поддержка'],
  premium: ['Максимальные лимиты', 'Расширенная аналитика', 'Брендинг и автоматизации', 'Приоритетная поддержка'],
  business: ['Всё из Pro', 'Несколько мастеров', 'Брендинг страницы', 'Webhook API'],
};

const DEFAULT_LIMITS = { services: 50, bookings: 1000, clients: 1000, templates: 50, storage: 5 };

function toNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/\s+/g, '').replace(',', '.'));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function cleanString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function normalizeStatus(value: unknown): Service['status'] {
  return value === 'seasonal' || value === 'draft' || value === 'active' ? value : 'active';
}

function normalizePriceFromName(name: string) {
  const match = name.match(/(?:от\s*)?([\d\s]{3,})\s*(?:₽|р|руб|rub)/i);
  return match?.[1] ? toNumber(match[1], 0) : 0;
}

function bookingDateTimeMs(booking: Pick<Booking, 'date' | 'time'>) {
  const ms = new Date(`${booking.date}T${booking.time || '00:00'}:00`).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function formatDateLabel(dateIso?: string) {
  if (!dateIso) return '';
  const date = new Date(`${dateIso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateIso;
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function isActiveBooking(status: string) {
  return status === 'new' || status === 'confirmed';
}

function isBillableBooking(status: string) {
  return status === 'completed';
}

export function adaptSubscription(billing: any, bookings: Booking[], services: number, templates: number): SubscriptionInfo {
  const plan = String(billing?.subscription?.planId ?? billing?.subscription?.plan ?? 'start').toLowerCase();
  const cycle = (billing?.subscription?.billingCycle === 'yearly' ? 'yearly' : 'monthly') as 'monthly' | 'yearly';
  const limits = { ...DEFAULT_LIMITS, ...(billing?.limits ?? {}) };
  const periodEnd = billing?.subscription?.currentPeriodEnd ?? null;
  const status = billing?.subscription?.status ?? 'active';

  const price = plan === 'free' ? '0 ₽'
    : plan === 'start' ? (cycle === 'yearly' ? '3 900 ₽ / год' : '390 ₽ / мес')
    : plan === 'pro' ? (cycle === 'yearly' ? '7 900 ₽ / год' : '790 ₽ / мес')
    : plan === 'studio' ? (cycle === 'yearly' ? '14 900 ₽ / год' : '1 490 ₽ / мес')
    : plan === 'premium' || plan === 'business' ? (cycle === 'yearly' ? '19 900 ₽ / год' : '1 990 ₽ / мес')
    : '— ₽';

  const clientKeys = new Set<string>();
  for (const b of bookings) clientKeys.add(`${b.clientName}|${b.clientPhone || ''}`);

  const sinceMonth = new Date();
  sinceMonth.setDate(1);
  sinceMonth.setHours(0, 0, 0, 0);
  const bookingsThisMonth = bookings.filter((b) => new Date(`${b.date}T00:00:00`) >= sinceMonth).length;

  return {
    plan,
    planLabel: PLAN_LABELS[plan] ?? plan,
    status,
    currentPeriodEnd: periodEnd,
    price,
    cycle,
    features: PLAN_FEATURES[plan] ?? PLAN_FEATURES.pro!,
    limits,
    usage: {
      services,
      bookings: bookingsThisMonth,
      clients: clientKeys.size,
      templates,
      storage: 0.6,
    },
  };
}

// ─── Master profile ─────────────────────────────────
export function adaptMaster(profile: MasterProfile | null, workspaceData?: Record<string, unknown> | null): MasterInfo {
  if (!profile) {
    return {
      name: 'Загрузка...',
      firstName: '...',
      username: '@—',
      city: '',
      rating: 0,
      service: '',
      link: '/m/',
      phone: '',
      bio: '',
      avatar: '',
      socials: { tg: '', vk: '', ig: '' },
    };
  }

  const socialSource = (workspaceData?.profileSocials && typeof workspaceData.profileSocials === 'object' && !Array.isArray(workspaceData.profileSocials))
    ? (workspaceData.profileSocials as Record<string, unknown>)
    : {};

  return {
    name: profile.name || 'Мастер',
    firstName: (profile.name || '').split(' ')[0] || 'Мастер',
    username: profile.telegram ? `@${profile.telegram.replace(/^@/, '')}` : `@${profile.slug}`,
    city: profile.city || '',
    rating: profile.rating ?? 0,
    service: profile.profession || '',
    link: `/m/${profile.slug}`,
    phone: profile.phone || '',
    bio: profile.bio || '',
    avatar: profile.avatar || '',
    socials: {
      tg: profile.telegram || '',
      vk: cleanString(socialSource.vk),
      ig: cleanString(socialSource.ig),
    },
  };
}

// ─── Services ────────────────────────────────────────
export function adaptServices(
  profile: MasterProfile | null,
  workspaceData?: Record<string, unknown> | null,
  bookings: Booking[] = [],
): Service[] {
  const stored = Array.isArray(workspaceData?.services) ? workspaceData?.services as Record<string, unknown>[] : [];
  const source = stored.length > 0
    ? stored
    : (profile?.services ?? []).map((name, index) => ({ id: `profile-service-${index + 1}`, name }));

  const activeBookings = bookings.filter((booking) => booking.status !== 'cancelled' && booking.status !== 'no_show');
  const totalActive = Math.max(1, activeBookings.length);

  return source
    .map((item, i) => {
      const name = cleanString(item.name);
      if (!name) return null;

      const related = activeBookings.filter((booking) => booking.service.trim().toLowerCase() === name.toLowerCase());
      const completed = related.filter((booking) => isBillableBooking(booking.status));
      const storedPopularity = toNumber(item.popularity, 0);
      const count = Math.round(toNumber(item.bookings ?? item.count, related.length || 0));
      const price = Math.max(0, Math.round(toNumber(item.price, normalizePriceFromName(name))));
      const revenue = Math.max(0, toNumber(item.revenue, completed.reduce((sum, booking) => sum + (booking.priceAmount ?? price), 0)));
      const status = normalizeStatus(item.status);
      const visible = typeof item.visible === 'boolean' ? item.visible : true;

      return {
        n: Math.round(toNumber(item.n ?? item.sortOrder ?? item.sort_order, i + 1)),
        id: cleanString(item.id, `service-${i + 1}`),
        name,
        price,
        duration: Math.max(5, Math.round(toNumber(item.duration, 60))),
        popularity: related.length > 0 ? related.length / totalActive : (storedPopularity > 1 ? storedPopularity / 100 : storedPopularity),
        count: related.length || count,
        revenue,
        category: cleanString(item.category, 'Основное'),
        status,
        visible,
      } satisfies Service;
    })
    .filter((item): item is Service => Boolean(item))
    .sort((a, b) => a.n - b.n || a.name.localeCompare(b.name, 'ru'));
}

// ─── Bookings → Appointments ────────────────────────
const STATUS_MAP: Record<string, ApptStatus> = {
  new: 'scheduled',
  confirmed: 'scheduled',
  completed: 'completed',
  no_show: 'cancelled',
  cancelled: 'cancelled',
};

const STATUS_LABEL: Record<string, string> = {
  new: 'Новая',
  confirmed: 'Подтверждена',
  completed: 'Завершена',
  no_show: 'Не пришёл',
  cancelled: 'Отменена',
};

export function adaptAppointments(bookings: Booking[]): Appointment[] {
  if (!bookings || bookings.length === 0) return [];

  const sorted = [...bookings].sort((a, b) => bookingDateTimeMs(a) - bookingDateTimeMs(b));
  const now = Date.now();
  const firstActiveIdx = sorted.findIndex(
    (b) => isActiveBooking(b.status) && bookingDateTimeMs(b) >= now - 15 * 60 * 1000,
  );

  return sorted.map((b, i) => ({
    id: b.id,
    date: b.date,
    dateLabel: formatDateLabel(b.date),
    time: b.time,
    name: b.clientName || 'Клиент',
    service: b.service || 'Услуга',
    status: i === firstActiveIdx ? 'in-focus' : (STATUS_MAP[b.status] ?? 'scheduled'),
    statusLabel: STATUS_LABEL[b.status] ?? 'Запланирована',
    rawStatus: b.status,
    phone: b.clientPhone || '',
    dur: b.durationMinutes || 60,
    price: b.priceAmount ?? 0,
    source: b.source ?? b.channel,
  }));
}

// ─── Clients ────────────────────────────────────────
export function adaptClients(bookings: Booking[]): Client[] {
  if (!bookings || bookings.length === 0) return [];

  const map = new Map<string, Client>();
  for (const b of bookings) {
    const phone = String(b.clientPhone || '').trim();
    const name = String(b.clientName || 'Клиент').trim();
    const key = phone ? `phone:${phone.replace(/\D+/g, '')}` : `name:${name.toLowerCase()}`;
    const existing = map.get(key);
    const visitCounts = b.status !== 'cancelled' && b.status !== 'no_show';
    const price = b.status === 'completed' ? (b.priceAmount || 0) : 0;

    if (existing) {
      existing.visits += visitCounts ? 1 : 0;
      existing.total += price;
      if (!existing.phone && phone) existing.phone = phone;
    } else {
      map.set(key, {
        name,
        phone,
        visits: visitCounts ? 1 : 0,
        total: price,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total || b.visits - a.visits || a.name.localeCompare(b.name, 'ru'));
}

// ─── Threads/Messages ───────────────────────────────
function adaptChatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'вчера';
  if (diffDays < 30) return `${diffDays} дн`;
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function adaptChatChannel(ch: string): Thread['channel'] {
  if (ch === 'Telegram') return 'TG';
  if (ch === 'VK') return 'ВК';
  if (ch === 'Instagram') return 'IG';
  return 'Web';
}

interface MiniThreadBookingContext {
  id: string;
  service?: string | null;
  date?: string | null;
  time?: string | null;
}

function readMiniThreadBookingContexts(metadata?: Record<string, unknown> | null): MiniThreadBookingContext[] {
  const contexts: MiniThreadBookingContext[] = [];
  const rawContexts = metadata?.bookingContexts;

  if (Array.isArray(rawContexts)) {
    rawContexts.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const row = item as Record<string, unknown>;
      const id = typeof row.id === 'string' ? row.id : typeof row.bookingId === 'string' ? row.bookingId : '';
      if (!id) return;
      contexts.push({
        id,
        service: typeof row.service === 'string' ? row.service : null,
        date: typeof row.date === 'string' ? row.date : typeof row.bookingDate === 'string' ? row.bookingDate : null,
        time: typeof row.time === 'string' ? row.time : typeof row.bookingTime === 'string' ? row.bookingTime : null,
      });
    });
  }

  const bookingId = typeof metadata?.bookingId === 'string' ? metadata.bookingId : '';
  if (bookingId && !contexts.some((context) => context.id === bookingId)) {
    contexts.push({
      id: bookingId,
      service: typeof metadata?.service === 'string' ? metadata.service : null,
      date: typeof metadata?.bookingDate === 'string' ? metadata.bookingDate : null,
      time: typeof metadata?.bookingTime === 'string' ? metadata.bookingTime : null,
    });
  }

  return contexts;
}

function activeMiniThreadBookingContext(metadata?: Record<string, unknown> | null) {
  const contexts = readMiniThreadBookingContexts(metadata);
  const activeBookingId = typeof metadata?.activeBookingId === 'string' ? metadata.activeBookingId : null;
  const proposalBookingId = typeof metadata?.rescheduleProposalBookingId === 'string' ? metadata.rescheduleProposalBookingId : null;
  return (
    contexts.find((context) => context.id === activeBookingId) ??
    contexts.find((context) => context.id === proposalBookingId) ??
    contexts[0] ??
    null
  );
}

export function adaptMessages(records: ChatMessageRecord[]): Message[] {
  return records.map((m) => ({
    from: m.author === 'client' ? 'them' : 'me',
    text: m.body,
    t: new Date(m.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
  }));
}

export function adaptThreads(records: ChatThreadRecord[]): Thread[] {
  return records.map((r) => {
    const bookingContext = activeMiniThreadBookingContext(r.metadata);
    return {
      id: r.id,
      name: r.clientName || 'Клиент',
      last: r.lastMessagePreview ?? '',
      time: adaptChatTime(r.lastMessageAt),
      lastMessageAtMs: new Date(r.lastMessageAt).getTime(),
      channel: adaptChatChannel(r.channel),
      unread: r.unreadCount ?? 0,
      messages: adaptMessages(r.messages ?? []),
      phone: r.clientPhone || undefined,
      nextVisit: bookingContext?.date ?? r.nextVisit ?? null,
      bookingId: bookingContext?.id ?? (typeof r.metadata?.bookingId === 'string' ? r.metadata.bookingId : null),
      bookingDate: bookingContext?.date ?? r.nextVisit ?? null,
      bookingTime: bookingContext?.time ?? null,
      bookingService: bookingContext?.service ?? null,
      segment: r.segment,
      isPriority: r.isPriority,
      botConnected: r.botConnected,
    };
  });
}

export const ADAPTED_THREADS: Thread[] = [];
export const ADAPTED_MESSAGES: Message[] = [];

// ─── Schedule ───────────────────────────────────────
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const WEEKDAY_IDS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function weekdayFromEntry(entry: Record<string, unknown>) {
  const raw = entry.weekdayIndex ?? entry.weekday_index ?? entry.dayIndex ?? entry.day_index ?? entry.weekday ?? entry.dayOfWeek ?? entry.day_of_week;
  const numeric = toNumber(raw, Number.NaN);
  if (Number.isFinite(numeric) && numeric >= 0 && numeric <= 6) return Math.trunc(numeric);

  const id = cleanString(entry.id).toLowerCase();
  const byId = WEEKDAY_IDS.indexOf(id);
  if (byId >= 0) return byId;

  const label = cleanString(entry.label).toLowerCase();
  const byShort = WEEKDAYS.findIndex((day) => day.toLowerCase() === label);
  if (byShort >= 0) return byShort;
  return null;
}

function parseWindow(value: string) {
  const [fromRaw, toRaw] = value.replace(/—/g, '–').replace(/-/g, '–').split('–').map((part) => part.trim());
  return { from: (fromRaw || '10:00').slice(0, 5), to: (toRaw || '20:00').slice(0, 5) };
}

function availabilityWindow(entry: Record<string, unknown>, fallbackIndex: number) {
  const slots = Array.isArray(entry.slots) ? entry.slots.map((x) => cleanString(x)).filter(Boolean) : [];
  if (slots.length > 0) {
    const windows = slots.map(parseWindow).sort((a, b) => a.from.localeCompare(b.from));
    return { from: windows[0]?.from ?? '10:00', to: windows[windows.length - 1]?.to ?? '20:00' };
  }

  const from = cleanString(entry.startTime ?? entry.from ?? entry.start, fallbackIndex === 5 ? '11:00' : '10:00').slice(0, 5);
  const to = cleanString(entry.endTime ?? entry.to ?? entry.end, fallbackIndex === 5 ? '17:00' : '20:00').slice(0, 5);
  return { from, to };
}

export function adaptSchedule(workspaceData: any): ScheduleDay[] {
  const av = Array.isArray(workspaceData?.availability) ? workspaceData.availability as Record<string, unknown>[] : [];

  return WEEKDAYS.map((d, i) => {
    const entry = av.find((x) => weekdayFromEntry(x) === i);
    if (!entry) {
      return {
        d,
        from: i === 6 ? '—' : i === 5 ? '11:00' : '10:00',
        to: i === 6 ? '—' : i === 5 ? '17:00' : '20:00',
        on: i !== 6,
      };
    }

    const status = cleanString(entry.status);
    const explicitEnabled = typeof entry.enabled === 'boolean' ? entry.enabled
      : typeof entry.on === 'boolean' ? entry.on
      : typeof entry.isWorkingDay === 'boolean' ? entry.isWorkingDay
      : undefined;
    const enabled = explicitEnabled ?? status !== 'day-off';
    const win = availabilityWindow(entry, i);

    return {
      d,
      from: enabled ? win.from : '—',
      to: enabled ? win.to : '—',
      on: Boolean(enabled),
    };
  });
}

// ─── Templates ──────────────────────────────────────
export function adaptTemplates(workspaceData: any): Template[] {
  const list = workspaceData?.templates;
  if (!list || !Array.isArray(list) || list.length === 0) return [];
  return list.map((t: any, i: number) => ({
    id: String(t.id ?? `tpl-${i}`),
    name: String(t.name ?? t.title ?? `Шаблон ${i + 1}`),
    body: String(t.body ?? t.text ?? t.message ?? t.content ?? ''),
  }));
}

// ─── Revenue week ───────────────────────────────────
export function adaptRevenueWeek(bookings: Booking[]): { d: string; v: number; active: boolean }[] {
  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const result: Record<string, number> = Object.fromEntries(days.map((d) => [d, 0]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayWd = (today.getDay() + 6) % 7; // Mon=0
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - todayWd);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  for (const b of bookings) {
    if (!isBillableBooking(b.status)) continue;
    const d = new Date(`${b.date}T00:00:00`);
    if (Number.isNaN(d.getTime()) || d < weekStart || d >= weekEnd) continue;
    const wd = days[(d.getDay() + 6) % 7]!;
    result[wd] = (result[wd] ?? 0) + (b.priceAmount || 0);
  }

  return days.map((d, i) => ({
    d,
    v: result[d]!,
    active: i === todayWd,
  }));
}
