import type { Locale } from '@/lib/i18n';
import {
  getBillingPlan,
  getLocalizedPlans,
  getPlanLimits,
  isFinitePlanLimit,
  normalizeBillingCycle,
  normalizeSubscriptionPlanId,
  normalizeSubscriptionStatus,
  type BillingCycle,
  type SubscriptionPlanId,
  type SubscriptionStatus,
} from '@/lib/billing-plans';
import type { Booking, BookingStatus, MasterProfile } from '@/lib/types';

export interface ServiceInsight {
  id: string;
  name: string;
  duration: number;
  price: number;
  status: 'active' | 'seasonal' | 'draft';
  visible: boolean;
  bookings: number;
  revenue: number;
  popularity: number;
  category: string;
}


export interface ClientBookingSummary {
  id: string;
  code: string;
  service: string;
  services: string[];
  date: string;
  time: string;
  status: BookingStatus;
  source?: string;
  channel?: string;
}

export interface ClientInsight {
  id: string;
  name: string;
  phone: string;
  lastVisit: string;
  nextVisit?: string;
  visits: number;
  averageCheck: number;
  totalRevenue: number;
  segment: 'new' | 'regular' | 'sleeping';
  favorite: boolean;
  note: string;
  source: string;
  service: string;
  hasReschedule?: boolean;
  rescheduleCount?: number;
  bookings?: ClientBookingSummary[];
  activeBookingCount?: number;
  serviceList?: string[];
}


export interface DailyInsight {
  date: string;
  label: string;
  visitors: number;
  requests: number;
  confirmed: number;
  revenue: number;
  newClients: number;
  pageViews: number;
}

export interface ChannelInsight {
  id: string;
  label: string;
  visitors: number;
  bookings: number;
  revenue: number;
  conversion: number;
}

export interface WeeklyLoadInsight {
  week: string;
  bookings: number;
  hours: number;
  utilization: number;
}

export interface PeakHourInsight {
  hour: string;
  bookings: number;
}

export interface MessageTemplateInsight {
  id: string;
  title: string;
  channel: string;
  conversion: string;
  variables: string[];
  content: string;
}

export interface AvailabilityDayInsight {
  id: string;
  label: string;
  status: 'workday' | 'short' | 'day-off';
  slots: string[];
  breaks: string[];
}

export interface IntegrationInsight {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'recommended' | 'available';
  hint: string;
}

export interface NotificationInsight {
  id: string;
  title: string;
  description: string;
  channel: 'push' | 'email' | 'telegram' | 'vk';
  enabled: boolean;
  critical?: boolean;
}

export interface PaymentInsight {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'refunded';
  method: string;
  plan: string;
}

export interface WorkspaceSubscriptionInsight {
  id: string | null;
  planId: SubscriptionPlanId;
  planName: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  nextChargeLabel: string;
  paymentMethodLabel: string;
  cancelAtPeriodEnd: boolean;
  provider: string;
}

export interface SubscriptionEventInsight {
  id: string;
  eventType: string;
  amount: number;
  currency: string;
  planId?: string;
  planName?: string;
  status?: string;
  method?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface SubscriptionPlan {
  id: 'start' | 'pro' | 'studio' | 'premium';
  name: string;
  description: string;
  monthly: number;
  yearly: number;
  popular?: boolean;
  features: string[];
}

export interface LimitInsight {
  id: string;
  label: string;
  used: number;
  total: number;
  accent?: 'success' | 'warning';
}

export interface WorkspaceDataset {
  services: ServiceInsight[];
  clients: ClientInsight[];
  daily: DailyInsight[];
  channels: ChannelInsight[];
  weeklyLoad: WeeklyLoadInsight[];
  peakHours: PeakHourInsight[];
  templates: MessageTemplateInsight[];
  availability: AvailabilityDayInsight[];
  integrations: IntegrationInsight[];
  notifications: NotificationInsight[];
  payments: PaymentInsight[];
  plans: SubscriptionPlan[];
  subscription: WorkspaceSubscriptionInsight;
  limits: LimitInsight[];
  totals: {
    bookings: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    revenue: number;
    visitors: number;
    conversion: number;
    averageCheck: number;
    newClients: number;
    returnRate: number;
  };
}

const SOURCE_LABELS: Record<Locale, string[]> = {
  ru: ['Web', 'ТГ', 'ВК', 'Инстаграм'],
  en: ['Web', 'Telegram', 'VK', 'Instagram'],
};

const CATEGORY_LABELS: Record<Locale, string[]> = {
  ru: ['Базовый уход', 'Популярное', 'Дизайн', 'Поддержка', 'Дополнительно'],
  en: ['Core care', 'Popular', 'Design', 'Support', 'Add-on'],
};

const NOTES: Record<Locale, string[]> = {
  ru: [
    'Любит утренние слоты и быстро подтверждает время.',
    'Чаще приходит перед выходными, ценит напоминания.',
    'Хорошо реагирует на деликатное сообщение после визита.',
    'Обычно записывается повторно через 3–4 недели.',
    'Хорошо реагирует на сообщения с готовой ссылкой.',
  ],
  en: [
    'Prefers morning slots and confirms fast.',
    'Usually books before weekends and likes reminders.',
    'Responds well to a soft post-visit follow-up.',
    'Typically comes back every 3–4 weeks.',
    'Reacts well to a short message with the booking link.',
  ],
};

function normalizeDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function dayLabel(date: Date, locale: Locale) {
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function hashSeed(input: string) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function seededFloat(seed: string) {
  const value = Math.sin(hashSeed(seed)) * 10000;
  return value - Math.floor(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getBookingDateTime(booking: Booking) {
  return new Date(`${booking.date}T${booking.time}:00`);
}

function sum(values: number[]) {
  return values.reduce((total, current) => total + current, 0);
}

function normalizeSourceLabel(value: unknown, locale: Locale): string {
  const raw = String(value ?? '').trim().toLowerCase();
  const ru = locale === 'ru';
  if (raw.includes('инст') || raw.includes('insta') || raw.includes('instagram')) return ru ? 'Инстаграм' : 'Instagram';
  if (raw.includes('вк') || raw.includes('vk') || raw.includes('max') || raw.includes('макс')) return ru ? 'ВК' : 'VK';
  if (raw.includes('web') || raw.includes('site') || raw.includes('сайт') || raw.includes('публич') || raw.includes('public')) return 'Web';
  if (raw.includes('tg') || raw.includes('тг') || raw.includes('telegram') || raw.includes('телеграм')) return ru ? 'ТГ' : 'Telegram';
  return 'Web';
}

function serviceDurationFromName(service: string, fallback: number) {
  const match = service.match(/(\d{2,3})\s*(?:мин|min)/i);
  return match ? Number(match[1]) : fallback;
}

function servicePriceFromName(service: string, fallback: number) {
  const match = service.match(/(?:от|from)?\s*([\d\s]{3,})\s*(?:₽|р|rub)/i);
  if (!match?.[1]) return fallback;
  const parsed = Number(match[1].replace(/\s+/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function bookingPrice(booking: Booking, services: ServiceInsight[]) {
  if (typeof booking.priceAmount === 'number' && booking.priceAmount > 0) return Math.round(booking.priceAmount);
  const service = services.find((item) => item.name === booking.service);
  return service?.price ?? servicePriceFromName(booking.service, 0);
}

function countsAsRevenue(booking: Booking) {
  return booking.status === 'completed';
}

function countsAsScheduledBooking(booking: Booking) {
  return booking.status === 'new' || booking.status === 'confirmed' || booking.status === 'completed';
}

function countsAsActiveBooking(booking: Booking) {
  return booking.status !== 'cancelled' && booking.status !== 'no_show';
}

function servicePriceByName(service: string, serviceIndex: number) {
  const seed = hashSeed(`${service}-${serviceIndex}`);
  return 1800 + (seed % 8) * 350 + serviceIndex * 250;
}

function serviceDurationByName(service: string, serviceIndex: number) {
  const options = [45, 60, 75, 90, 105];
  const seed = hashSeed(`${service}-${serviceIndex}-duration`);
  return options[seed % options.length];
}

function buildServices(profile: MasterProfile, bookings: Booking[], locale: Locale): ServiceInsight[] {
  const categories = CATEGORY_LABELS[locale];
  const totalBookings = Math.max(1, bookings.length);

  return profile.services.map((service, index) => {
    const price = servicePriceFromName(service, servicePriceByName(service, index));
    const duration = serviceDurationFromName(service, serviceDurationByName(service, index));
    const related = bookings.filter((booking) => booking.service === service);
    const bookingsCount = related.length;
    const revenue = related
      .filter(countsAsRevenue)
      .reduce((total, booking) => total + (booking.priceAmount ?? price), 0);

    return {
      id: `${profile.slug}-service-${index}`,
      name: service,
      duration,
      price,
      status: 'active',
      visible: true,
      bookings: bookingsCount,
      revenue,
      popularity: Math.round((bookingsCount / totalBookings) * 100),
      category: categories[index % categories.length],
    };
  });
}


function normalizeBookingServiceList(value: string) {
  const raw = String(value || '').trim();
  if (!raw) return ['Услуга не указана'];

  const cleaned = raw
    .replace(/[-–—_]{3,}\s*входит\s*:?\s*-?/gi, '')
    .replace(/\s+входит\s*:?\s*-?\s*$/gi, '')
    .replace(/^[-–—_\s]+$/g, '')
    .trim();

  if (!cleaned || /^[-–—_:\s]+$/i.test(cleaned)) return ['Услуга не указана'];

  const parts = cleaned
    .split(/\n|;|\s\+\s|,\s(?=[А-ЯA-ZЁ])|\s·\s/g)
    .map((item) => item.replace(/^[-–—_\s]+/, '').replace(/[-–—_\s]+$/, '').trim())
    .filter(Boolean);

  return parts.length > 0 ? parts : ['Услуга не указана'];
}

function bookingCodeFromId(id: string) {
  const compact = String(id || '').replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase();
  return compact ? `#CB-${compact}` : '#CB';
}

function bookingSummaryFromBooking(booking: Booking): ClientBookingSummary {
  return {
    id: booking.id,
    code: bookingCodeFromId(booking.id),
    service: booking.service,
    services: normalizeBookingServiceList(booking.service),
    date: booking.date,
    time: booking.time,
    status: booking.status,
    source: booking.source,
    channel: booking.channel,
  };
}

function buildClients(bookings: Booking[], services: ServiceInsight[], locale: Locale): ClientInsight[] {
  const serviceMap = new Map(services.map((service) => [service.name, service]));
  const grouped = new Map<string, Booking[]>();

  bookings.forEach((booking) => {
    const key = booking.clientPhone || booking.clientName;
    const next = grouped.get(key) ?? [];
    next.push(booking);
    grouped.set(key, next);
  });

  return Array.from(grouped.entries())
    .map(([key, items], index) => {
      const now = Date.now();
      const sorted = [...items].sort((a, b) => getBookingDateTime(b).getTime() - getBookingDateTime(a).getTime());
      const sortedAsc = [...items].sort((a, b) => getBookingDateTime(a).getTime() - getBookingDateTime(b).getTime());
      const futureItems = sortedAsc.filter((booking) => getBookingDateTime(booking).getTime() > now);
      const pastItems = sorted.filter((booking) => getBookingDateTime(booking).getTime() <= now);
      const nextBooking = futureItems[0];
      const lastVisit = pastItems[0] ?? sortedAsc[0] ?? sorted[0];
      const revenueBookings = sorted.filter(countsAsRevenue);
      const totalRevenue = revenueBookings.reduce((total, booking) => {
        const service = serviceMap.get(booking.service);
        return total + (booking.priceAmount ?? service?.price ?? servicePriceFromName(booking.service, 2400));
      }, 0);
      const averageCheck = revenueBookings.length > 0 ? Math.round(totalRevenue / revenueBookings.length) : 0;
      const daysSince = pastItems[0]
        ? Math.round((now - getBookingDateTime(pastItems[0]).getTime()) / 86400000)
        : 0;
      const hasReschedule = sorted.some((booking) => {
        const metadata = booking.metadata && typeof booking.metadata === 'object' ? booking.metadata : {};
        return booking.cancelReason === 'client_reschedule_requested' ||
          Boolean(metadata.rescheduleRequested) ||
          Boolean(metadata.acceptedRescheduleProposalId) ||
          Boolean(metadata.declinedRescheduleProposalId) ||
          Boolean(metadata.rescheduledFromDate);
      });
      const rescheduleCount = sorted.filter((booking) => {
        const metadata = booking.metadata && typeof booking.metadata === 'object' ? booking.metadata : {};
        return booking.cancelReason === 'client_reschedule_requested' ||
          Boolean(metadata.rescheduleRequested) ||
          Boolean(metadata.acceptedRescheduleProposalId) ||
          Boolean(metadata.declinedRescheduleProposalId) ||
          Boolean(metadata.rescheduledFromDate);
      }).length;
      const hasNoShow = sorted.some((booking) => booking.status === 'no_show' || booking.status === 'cancelled');
      const latestStatus = sorted[0]?.status;
      const segment: ClientInsight['segment'] =
        latestStatus === 'no_show' || latestStatus === 'cancelled' || hasNoShow || (!nextBooking && pastItems[0] && daysSince > 45)
          ? 'sleeping'
          : pastItems.length >= 2
            ? 'regular'
            : 'new';
      const source = normalizeSourceLabel(sorted[0].source ?? sorted[0].channel, locale);

      const bookingSummaries = sorted.map(bookingSummaryFromBooking);
      const activeBookingSummaries = bookingSummaries.filter((booking) =>
        booking.status !== 'cancelled' && booking.status !== 'no_show' && booking.status !== 'completed'
      );
      const serviceList = Array.from(new Set(bookingSummaries.flatMap((booking) => booking.services)));

      return {
        id: key,
        name: sorted[0].clientName,
        phone: sorted[0].clientPhone,
        lastVisit: lastVisit.date,
        nextVisit: nextBooking?.date,
        visits: sorted.length,
        averageCheck,
        totalRevenue,
        segment,
        favorite: sorted.length >= 3 || totalRevenue >= 10000,
        note: String(sorted[0].comment ?? '').trim(),
        source,
        service: serviceList[0] ?? sorted[0].service,
        hasReschedule,
        rescheduleCount,
        bookings: bookingSummaries,
        activeBookingCount: activeBookingSummaries.length,
        serviceList,
      };
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
}

function getRequestDate(booking: Booking, todayIso: string) {
  const raw = typeof booking.createdAt === 'string' ? booking.createdAt.slice(0, 10) : '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return todayIso;

  // A request cannot happen in the future. Old fallback data sometimes used
  // the visit date as createdAt, which made analytics show future заявки/traffic.
  return raw > todayIso ? todayIso : raw;
}

function buildDaily(profile: MasterProfile, bookings: Booking[], services: ServiceInsight[], locale: Locale): DailyInsight[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = normalizeDate(today);

  // Dashboard analytics are operational: last 30 calendar days ending today.
  // Future visits belong to the schedule, not to factual traffic/request charts.
  const rangeStart = new Date(today);
  rangeStart.setDate(today.getDate() - 29);

  const requestDateByBookingId = new Map<string, string>();
  const firstClientVisit = new Map<string, string>();

  [...bookings]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .forEach((booking) => {
      const requestDate = getRequestDate(booking, todayIso);
      requestDateByBookingId.set(booking.id, requestDate);
      const key = booking.clientPhone || booking.clientName;
      if (!firstClientVisit.has(key)) {
        firstClientVisit.set(key, requestDate);
      }
    });

  return Array.from({ length: 30 }, (_, offset) => {
    const date = new Date(rangeStart);
    date.setDate(rangeStart.getDate() + offset);
    const iso = normalizeDate(date);
    const dayBookings = bookings.filter((booking) => booking.date === iso);
    const createdBookings = bookings.filter((booking) => requestDateByBookingId.get(booking.id) === iso);
    const requests = createdBookings.length;
    const confirmed = dayBookings.filter((booking) => countsAsScheduledBooking(booking)).length;
    const revenue = dayBookings
      .filter(countsAsRevenue)
      .reduce((total, booking) => total + bookingPrice(booking, services), 0);
    const newClients = createdBookings.filter((booking) => {
      const key = booking.clientPhone || booking.clientName;
      return firstClientVisit.get(key) === iso;
    }).length;

    return {
      date: iso,
      label: dayLabel(date, locale),
      visitors: requests,
      requests,
      confirmed,
      revenue,
      newClients,
      pageViews: requests,
    };
  });
}

function buildChannels(profile: MasterProfile, daily: DailyInsight[], locale: Locale, bookings: Booking[], services: ServiceInsight[]): ChannelInsight[] {
  void daily;

  const sourceLabels = SOURCE_LABELS[locale];
  const grouped = new Map<string, { visitors: number; bookings: number; revenue: number }>();

  for (const label of sourceLabels) {
    grouped.set(label, { visitors: 0, bookings: 0, revenue: 0 });
  }

  for (const booking of bookings) {
    const label = normalizeSourceLabel(booking.source ?? booking.channel, locale);
    const item = grouped.get(label) ?? { visitors: 0, bookings: 0, revenue: 0 };
    item.visitors += 1;
    item.bookings += countsAsScheduledBooking(booking) ? 1 : 0;
    item.revenue += countsAsRevenue(booking) ? bookingPrice(booking, services) : 0;
    grouped.set(label, item);
  }

  return Array.from(grouped.entries())
    .map(([label, item]) => ({
      id: `${profile.slug}-channel-${label.toLowerCase()}`,
      label,
      visitors: item.visitors,
      bookings: item.bookings,
      revenue: item.revenue,
      conversion: item.visitors > 0 ? Number(((item.bookings / item.visitors) * 100).toFixed(1)) : 0,
    }))
    .sort((left, right) => right.bookings - left.bookings || right.visitors - left.visitors);
}

function buildWeeklyLoad(profile: MasterProfile, daily: DailyInsight[]): WeeklyLoadInsight[] {
  void profile;

  return Array.from({ length: 6 }, (_, index) => {
    const start = index * 5;
    const slice = daily.slice(start, start + 5);
    const bookings = sum(slice.map((item) => item.confirmed));
    const hours = Math.round(bookings);
    const utilization = bookings > 0 ? Math.min(100, Math.round((hours / 40) * 100)) : 0;

    return {
      week: `W${index + 1}`,
      bookings,
      hours,
      utilization,
    };
  });
}

function buildPeakHours(profile: MasterProfile, bookings: Booking[]): PeakHourInsight[] {
  void profile;

  return Array.from({ length: 10 }, (_, index) => {
    const hour = 9 + index;
    const label = `${String(hour).padStart(2, '0')}:00`;
    const actual = bookings.filter((booking) => Number(booking.time.split(':')[0]) === hour).length;

    return {
      hour: label,
      bookings: actual,
    };
  });
}

function buildTemplates(locale: Locale): MessageTemplateInsight[] {
  return locale === 'ru'
    ? [
        {
          id: 'confirm',
          title: 'Запись создана',
          channel: locale === 'ru' ? 'ВК / Телеграм' : 'VK / Telegram',
          conversion: '74%',
          variables: ['{{имя}}', '{{дата}}', '{{время}}', '{{услуга}}'],
          content: 'Здравствуйте, {{имя}}! Ваша запись на {{услуга}} создана: {{дата}} в {{время}}. Быстрая ссылка: https://кликбук.рф/m/{{slug}}',
        },
        {
          id: 'reminder',
          title: 'Напоминание за день',
          channel: locale === 'ru' ? 'Пуш / ВК' : 'Push / VK',
          conversion: '68%',
          variables: ['{{имя}}', '{{дата}}', '{{время}}'],
          content: 'Напоминаю о визите завтра, {{имя}}. Жду вас {{дата}} в {{время}}. Если понадобится сдвинуть время — дайте знать.',
        },
        {
          id: 'thanks',
          title: 'Спасибо после визита',
          channel: locale === 'ru' ? 'Телеграм' : 'Telegram',
          conversion: '42%',
          variables: ['{{имя}}', 'https://кликбук.рф/m/{{slug}}'],
          content: 'Спасибо за визит, {{имя}}! Буду рада видеть вас снова. Сохраните ссылку https://кликбук.рф/m/{{slug}}, чтобы в следующий раз записаться быстрее.',
        },
        {
          id: 'return',
          title: 'Возврат клиента',
          channel: 'VK',
          conversion: '31%',
          variables: ['{{имя}}', 'https://кликбук.рф/m/{{slug}}'],
          content: 'Здравствуйте, {{имя}}! У меня появились новые удобные слоты на ближайшие недели. Вот быстрая ссылка для записи: https://кликбук.рф/m/{{slug}}',
        },
      ]
    : [
        {
          id: 'confirm',
          title: 'Booking created',
          channel: locale === 'ru' ? 'ВК / Телеграм' : 'VK / Telegram',
          conversion: '74%',
          variables: ['{{name}}', '{{date}}', '{{time}}', '{{service}}'],
          content: 'Hi {{name}}! Your {{service}} booking is created for {{date}} at {{time}}. Quick link: https://кликбук.рф/m/{{slug}}',
        },
        {
          id: 'reminder',
          title: 'Reminder message',
          channel: locale === 'ru' ? 'Пуш / ВК' : 'Push / VK',
          conversion: '68%',
          variables: ['{{name}}', '{{date}}', '{{time}}'],
          content: 'A quick reminder about your appointment tomorrow, {{name}} — {{date}} at {{time}}. Let me know if you need to adjust the time.',
        },
        {
          id: 'thanks',
          title: 'Post-visit thank you',
          channel: locale === 'ru' ? 'Телеграм' : 'Telegram',
          conversion: '42%',
          variables: ['{{name}}', 'https://кликбук.рф/m/{{slug}}'],
          content: 'Thanks for coming, {{name}}. I would love to see you again. Save this link https://кликбук.рф/m/{{slug}} to book faster next time.',
        },
        {
          id: 'return',
          title: 'Return invitation',
          channel: 'VK',
          conversion: '31%',
          variables: ['{{name}}', 'https://кликбук.рф/m/{{slug}}'],
          content: 'Hi {{name}}! New time slots are open for the coming weeks. Here is the quick booking link: https://кликбук.рф/m/{{slug}}',
        },
      ];
}

function buildAvailability(locale: Locale): AvailabilityDayInsight[] {
  return locale === 'ru'
    ? [
        { id: 'mon', label: 'Понедельник', status: 'workday', slots: ['09:00–13:00', '14:00–19:00'], breaks: ['13:00–14:00'] },
        { id: 'tue', label: 'Вторник', status: 'workday', slots: ['10:00–14:00', '15:00–20:00'], breaks: ['14:00–15:00'] },
        { id: 'wed', label: 'Среда', status: 'short', slots: ['11:00–17:00'], breaks: ['14:00–14:30'] },
        { id: 'thu', label: 'Четверг', status: 'workday', slots: ['09:00–13:00', '14:00–19:00'], breaks: ['13:00–14:00'] },
        { id: 'fri', label: 'Пятница', status: 'workday', slots: ['09:00–12:00', '13:00–18:00'], breaks: ['12:00–13:00'] },
        { id: 'sat', label: 'Суббота', status: 'short', slots: ['10:00–15:00'], breaks: [] },
        { id: 'sun', label: 'Воскресенье', status: 'day-off', slots: [], breaks: [] },
      ]
    : [
        { id: 'mon', label: 'Monday', status: 'workday', slots: ['09:00–13:00', '14:00–19:00'], breaks: ['13:00–14:00'] },
        { id: 'tue', label: 'Tuesday', status: 'workday', slots: ['10:00–14:00', '15:00–20:00'], breaks: ['14:00–15:00'] },
        { id: 'wed', label: 'Wednesday', status: 'short', slots: ['11:00–17:00'], breaks: ['14:00–14:30'] },
        { id: 'thu', label: 'Thursday', status: 'workday', slots: ['09:00–13:00', '14:00–19:00'], breaks: ['13:00–14:00'] },
        { id: 'fri', label: 'Friday', status: 'workday', slots: ['09:00–12:00', '13:00–18:00'], breaks: ['12:00–13:00'] },
        { id: 'sat', label: 'Saturday', status: 'short', slots: ['10:00–15:00'], breaks: [] },
        { id: 'sun', label: 'Sunday', status: 'day-off', slots: [], breaks: [] },
      ];
}

function buildIntegrations(locale: Locale): IntegrationInsight[] {
  return locale === 'ru'
    ? [
        { id: 'telegram', name: 'Телеграм', description: 'Подтверждения и быстрые уведомления в личные сообщения.', status: 'connected', hint: 'Подключён и синхронизирует новые заявки.' },
        { id: 'whatsapp', name: 'ВК', description: 'Отправка ссылки, напоминаний и статусов визита.', status: 'connected', hint: 'Активен для клиентских шаблонов.' },
        { id: 'instagram', name: 'Ссылка из Инстаграм', description: 'Ссылка в профиле и метки переходов на публичную страницу.', status: 'recommended', hint: 'Высокий потенциал конверсии из профиля.' },
        { id: 'calendar', name: 'Календарь', description: 'Экспорт подтверждённых визитов в рабочий календарь.', status: 'available', hint: 'Помогает избежать накладок по времени.' },
        { id: 'site', name: 'Taplink / сайт', description: 'Встроить кнопку записи на ваш внешний сайт.', status: 'available', hint: 'Полезно для студий и команд.' },
      ]
    : [
        { id: 'telegram', name: 'Telegram', description: 'Confirmations and fast alerts in direct messages.', status: 'connected', hint: 'Already syncing new requests.' },
        { id: 'whatsapp', name: 'ВК', description: 'Send the link, reminders, and visit status updates.', status: 'connected', hint: 'Enabled for client templates.' },
        { id: 'instagram', name: 'Instagram link', description: 'Track clicks from bio to the public booking page.', status: 'recommended', hint: 'High conversion potential from profile traffic.' },
        { id: 'calendar', name: 'Calendar', description: 'Export confirmed appointments to your calendar.', status: 'available', hint: 'Prevents time overlaps.' },
        { id: 'site', name: 'Website / Taplink', description: 'Embed the booking button on an external site.', status: 'available', hint: 'Useful for studios and teams.' },
      ];
}

function buildNotifications(locale: Locale): NotificationInsight[] {
  return locale === 'ru'
    ? [
        { id: 'new-request', title: 'Новая заявка', description: 'Уведомлять сразу после отправки формы в Телеграм и кабинете.', channel: 'telegram', enabled: true, critical: true },
        { id: 'visit-reminder', title: 'Напоминание клиенту', description: 'Отправлять клиенту подтверждение и напоминания через Telegram.', channel: 'telegram', enabled: true },
        { id: 'chat-message', title: 'Сообщение клиенту', description: 'Доставлять исходящие сообщения из чата клиенту через бота.', channel: 'telegram', enabled: true },
        { id: 'cancellation', title: 'Отмена или перенос', description: 'Сразу сообщать об изменении записи в Телеграм.', channel: 'telegram', enabled: true, critical: true },
        { id: 'schedule-change', title: 'Изменение графика', description: 'Отправлять себе сводку в ВК о блокировках и спецдатах.', channel: 'vk', enabled: false },
        { id: 'weekly-digest', title: 'Недельная сводка', description: 'Доход, конверсия и загрузка по неделе.', channel: 'email', enabled: true },
      ]
    : [
        { id: 'new-request', title: 'New request', description: 'Notify in Telegram and inside the workspace right after the form is sent.', channel: 'telegram', enabled: true, critical: true },
        { id: 'visit-reminder', title: 'Client reminder', description: 'Send confirmations and reminders to the client via Telegram.', channel: 'telegram', enabled: true },
        { id: 'chat-message', title: 'Client chat message', description: 'Deliver outgoing chat messages to the client through the bot.', channel: 'telegram', enabled: true },
        { id: 'cancellation', title: 'Cancellation or reschedule', description: 'Alert immediately in Telegram when an appointment changes.', channel: 'telegram', enabled: true, critical: true },
        { id: 'schedule-change', title: 'Schedule changes', description: 'Send a VK summary about blocked time and special dates.', channel: 'vk', enabled: false },
        { id: 'weekly-digest', title: 'Weekly digest', description: 'Revenue, conversion, and load summary for the week.', channel: 'email', enabled: true },
      ];
}

function formatBillingDate(value: string | null | undefined, locale: Locale) {
  if (!value) return locale === 'ru' ? 'не запланировано' : 'not scheduled';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return locale === 'ru' ? 'не запланировано' : 'not scheduled';

  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getStringFromRecord(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function getBooleanFromRecord(record: Record<string, unknown>, key: string, fallback = false) {
  const value = record[key];
  return typeof value === 'boolean' ? value : fallback;
}

export function normalizeSubscriptionInsight(value: unknown, locale: Locale): WorkspaceSubscriptionInsight {
  const row = value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

  const metadata = row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
    ? (row.metadata as Record<string, unknown>)
    : {};

  const planId = normalizeSubscriptionPlanId(
    row.planId ?? row.plan_id ?? row.plan ?? metadata.planId ?? metadata.plan_id ?? metadata.plan,
  );
  const plan = getBillingPlan(planId);
  const status = normalizeSubscriptionStatus(row.status ?? metadata.status);
  const billingCycle = normalizeBillingCycle(row.billingCycle ?? row.billing_cycle ?? metadata.billingCycle ?? metadata.billing_cycle);
  const currentPeriodStart = getStringFromRecord(row, ['currentPeriodStart', 'current_period_start']);
  const currentPeriodEnd = getStringFromRecord(row, ['currentPeriodEnd', 'current_period_end']);
  const paymentMethodLabel =
    getStringFromRecord(row, ['paymentMethodLabel', 'payment_method_label']) ??
    getStringFromRecord(metadata, ['paymentMethodLabel', 'payment_method_label', 'method']) ??
    (locale === 'ru' ? 'Не привязана' : 'Not connected');

  return {
    id: getStringFromRecord(row, ['id']),
    planId,
    planName: plan.name,
    status,
    billingCycle,
    currentPeriodStart,
    currentPeriodEnd,
    nextChargeLabel: plan.monthly === 0 ? (locale === 'ru' ? 'Бесплатный тариф' : 'Free plan') : formatBillingDate(currentPeriodEnd, locale),
    paymentMethodLabel,
    cancelAtPeriodEnd: getBooleanFromRecord(row, 'cancelAtPeriodEnd') || getBooleanFromRecord(row, 'cancel_at_period_end'),
    provider: getStringFromRecord(row, ['provider']) ?? getStringFromRecord(metadata, ['provider']) ?? 'manual',
  };
}

export function normalizeSubscriptionEvents(value: unknown): SubscriptionEventInsight[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => {
      const row = item as Record<string, unknown>;
      const metadata = row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
        ? (row.metadata as Record<string, unknown>)
        : {};
      const amount = typeof row.amount === 'number'
        ? row.amount
        : Number(row.amount ?? metadata.amount ?? 0);

      return {
        id: String(row.id ?? `subscription-event-${index}`),
        eventType: String(row.eventType ?? row.event_type ?? metadata.eventType ?? 'subscription_event'),
        amount: Number.isFinite(amount) ? amount : 0,
        currency: String(row.currency ?? metadata.currency ?? 'RUB'),
        planId: getStringFromRecord(row, ['planId', 'plan_id', 'plan']) ?? getStringFromRecord(metadata, ['planId', 'plan_id', 'plan']) ?? undefined,
        planName: getStringFromRecord(row, ['planName', 'plan_name']) ?? getStringFromRecord(metadata, ['planName', 'plan_name']) ?? undefined,
        status: getStringFromRecord(row, ['status']) ?? getStringFromRecord(metadata, ['status']) ?? undefined,
        method: getStringFromRecord(row, ['method']) ?? getStringFromRecord(metadata, ['method']) ?? undefined,
        createdAt: String(row.createdAt ?? row.created_at ?? new Date().toISOString()),
        metadata,
      } satisfies SubscriptionEventInsight;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function buildSubscriptionPayments(locale: Locale, events: SubscriptionEventInsight[] = []): PaymentInsight[] {
  return events
    .filter((event) => event.amount > 0 || event.eventType.includes('payment'))
    .map((event) => {
      const plan = getBillingPlan(event.planId);
      const status: PaymentInsight['status'] = event.eventType.includes('refund')
        ? 'refunded'
        : event.eventType.includes('pending') || event.status === 'pending'
          ? 'pending'
          : 'paid';

      return {
        id: event.id,
        date: formatBillingDate(event.createdAt, locale),
        amount: event.amount,
        status,
        method: event.method || (locale === 'ru' ? 'Ручная активация' : 'Manual activation'),
        plan: event.planName || plan.name,
      };
    });
}

function buildPlans(locale: Locale): SubscriptionPlan[] {
  return getLocalizedPlans(locale) as SubscriptionPlan[];
}

export function buildLimits(
  services: ServiceInsight[],
  clients: ClientInsight[],
  locale: Locale,
  planId: SubscriptionPlanId = 'start',
): LimitInsight[] {
  const limits = getPlanLimits(planId);
  const totalLabel = (value: number) => (isFinitePlanLimit(value) ? value : 9999);

  return [
    {
      id: 'services',
      label: locale === 'ru' ? 'Активные услуги' : 'Active services',
      used: services.filter((service) => service.status !== 'draft').length,
      total: totalLabel(limits.services),
    },
    {
      id: 'clients',
      label: locale === 'ru' ? 'Клиенты в месяц' : 'Clients per month',
      used: clients.length,
      total: totalLabel(limits.clients),
    },
    {
      id: 'reminders',
      label: locale === 'ru' ? 'Напоминания' : 'Reminders',
      used: 0,
      total: totalLabel(limits.reminders),
      accent: 'warning',
    },
    {
      id: 'exports',
      label: locale === 'ru' ? 'Экспорты данных' : 'Data exports',
      used: 0,
      total: totalLabel(limits.exports),
      accent: 'success',
    },
    {
      id: 'templates',
      label: locale === 'ru' ? 'Шаблоны сообщений' : 'Message templates',
      used: 0,
      total: totalLabel(limits.templates),
    },
  ];
}

export function buildWorkspaceDataset(
  profile: MasterProfile,
  bookings: Booking[],
  locale: Locale,
): WorkspaceDataset {
  const services = buildServices(profile, bookings, locale);
  const clients = buildClients(bookings, services, locale);
  const daily = buildDaily(profile, bookings, services, locale);
  const channels = buildChannels(profile, daily, locale, bookings, services);
  const weeklyLoad = buildWeeklyLoad(profile, daily);
  const peakHours = buildPeakHours(profile, bookings);
  const paidBookings = bookings.filter(countsAsRevenue);
  const totalsRevenue = sum(paidBookings.map((booking) => bookingPrice(booking, services)));
  const visitors = sum(daily.map((item) => item.visitors));
  const confirmed = bookings.filter((booking) => countsAsScheduledBooking(booking)).length;
  const completed = bookings.filter((booking) => booking.status === 'completed').length;

  const totals = {
    bookings: bookings.length,
    confirmed,
    completed,
    cancelled: bookings.filter((booking) => booking.status === 'cancelled' || booking.status === 'no_show').length,
    revenue: totalsRevenue,
    visitors,
    conversion: visitors > 0 ? Number(((sum(daily.map((item) => item.confirmed)) / visitors) * 100).toFixed(1)) : 0,
    averageCheck: paidBookings.length > 0 ? Math.round(totalsRevenue / paidBookings.length) : 0,
    newClients: sum(daily.map((item) => item.newClients)),
    returnRate: clients.length > 0 ? Number(((clients.filter((client) => client.segment === 'regular').length / clients.length) * 100).toFixed(1)) : 0,
  };

  return {
    services,
    clients,
    daily,
    channels,
    weeklyLoad,
    peakHours,
    templates: buildTemplates(locale),
    availability: buildAvailability(locale),
    integrations: buildIntegrations(locale),
    notifications: buildNotifications(locale),
    payments: buildSubscriptionPayments(locale),
    plans: buildPlans(locale),
    subscription: normalizeSubscriptionInsight(null, locale),
    limits: buildLimits(services, clients, locale, 'start'),
    totals,
  };
}

export function bookingStatusLabel(status: BookingStatus, locale: Locale) {
  if (locale === 'ru') {
    return {
      new: 'Новая',
      confirmed: 'Запланирована',
      completed: 'Пришёл',
      no_show: 'Не пришёл',
      cancelled: 'Отменена',
    }[status];
  }

  return {
    new: 'New',
    confirmed: 'Scheduled',
    completed: 'Arrived',
    no_show: 'No-show',
    cancelled: 'Cancelled',
  }[status];
}

export function formatCurrency(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(value / 100);
}
