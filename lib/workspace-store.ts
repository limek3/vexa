
import type { AppearanceSettings } from '@/lib/appearance';
import type { Locale } from '@/lib/i18n';
import {
  buildSubscriptionPayments,
  buildWorkspaceDataset,
  buildLimits,
  type AvailabilityDayInsight,
  type ClientInsight,
  type MessageTemplateInsight,
  type NotificationInsight,
  type ServiceInsight,
  normalizeSubscriptionEvents,
  normalizeSubscriptionInsight,
  type WorkspaceDataset,
} from '@/lib/master-workspace';
import type { Booking, MasterProfile } from '@/lib/types';

export const WORKSPACE_ID_STORAGE_KEY = 'sloty-workspace-id';

export interface WorkspaceSections {
  bookings?: Booking[];
  services?: ServiceInsight[];
  availability?: AvailabilityDayInsight[];
  templates?: MessageTemplateInsight[];
  notifications?: unknown[];
  chats?: unknown[];
  appearance?: AppearanceSettings;
  quietHours?: boolean;
  fallbackEmail?: boolean;
  subscription?: unknown;
  subscriptionEvents?: unknown[];
  clientNotes?: Record<string, string>;
  clientReminders?: Record<string, { text?: string; remindAt?: string; updatedAt?: string }>;
  clientFavorites?: Record<string, boolean>;
  [key: string]: unknown;
}

export interface WorkspaceSnapshot {
  id: string;
  ownerId?: string;
  slug: string;
  profile: MasterProfile;
  data: WorkspaceSections;
  appearance?: Partial<AppearanceSettings> | null;
  createdAt?: string;
  updatedAt?: string;
}

function normalizeNotificationItems(
  value: unknown[] | undefined,
  fallback: NotificationInsight[],
): NotificationInsight[] {
  if (!Array.isArray(value) || value.length === 0) return fallback;

  const fallbackById = new Map(fallback.map((item) => [item.id, item]));
  const usedIds = new Set<string>();
  const normalized = value.map((item, index) => {
    if (!item || typeof item !== 'object') return fallback[index] ?? fallback[0];
    const candidate = item as Record<string, unknown>;
    const id = String(candidate.id ?? fallback[index]?.id ?? `notification-${index}`);
    const fallbackItem = fallbackById.get(id) ?? fallback[index] ?? fallback[0];
    usedIds.add(id);

    return {
      id,
      title: String(candidate.title ?? fallbackItem?.title ?? ''),
      description: String(candidate.description ?? fallbackItem?.description ?? ''),
      channel: (candidate.channel === 'push' || candidate.channel === 'email' || candidate.channel === 'telegram' || candidate.channel === 'vk'
        ? candidate.channel
        : fallbackItem?.channel ?? 'telegram') as NotificationInsight['channel'],
      enabled: typeof candidate.enabled === 'boolean' ? candidate.enabled : fallbackItem?.enabled ?? true,
      critical: typeof candidate.critical === 'boolean' ? candidate.critical : fallbackItem?.critical,
    };
  });

  for (const item of fallback) {
    if (!usedIds.has(item.id)) normalized.push(item);
  }

  return normalized;
}


function normalizeClientTextMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key, item]) => key && typeof item === 'string')
      .map(([key, item]) => [key, item as string]),
  );
}

function normalizeClientBooleanMap(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key, item]) => key && typeof item === 'boolean')
      .map(([key, item]) => [key, item as boolean]),
  );
}


function parsePriceFromName(name: string, fallback = 0) {
  const match = name.match(/(?:от|from)?\s*([\d\s]{3,})\s*(?:₽|р|rub)/i);
  if (!match?.[1]) return fallback;
  const value = Number(match[1].replace(/\s+/g, ''));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function countsAsRevenue(status: string) {
  return status === 'completed';
}

function countsAsScheduled(status: string) {
  return status === 'new' || status === 'confirmed' || status === 'completed';
}

function sourceLabel(value: unknown, locale: Locale) {
  const raw = String(value ?? '').toLowerCase();
  const ru = locale === 'ru';
  if (raw.includes('инст') || raw.includes('insta') || raw.includes('instagram')) return ru ? 'Инстаграм' : 'Instagram';
  if (raw.includes('вк') || raw.includes('vk') || raw.includes('max') || raw.includes('макс')) return ru ? 'ВК' : 'VK';
  if (raw.includes('web') || raw.includes('site') || raw.includes('сайт') || raw.includes('публич') || raw.includes('public')) return 'Web';
  if (raw.includes('tg') || raw.includes('тг') || raw.includes('telegram') || raw.includes('телеграм')) return ru ? 'ТГ' : 'Telegram';
  return 'Web';
}

function rebuildStoredServiceMetrics(services: ServiceInsight[], bookings: Booking[]) {
  const total = Math.max(1, bookings.length);
  return services.map((service) => {
    const related = bookings.filter((booking) => booking.service === service.name);
    const price = service.price || parsePriceFromName(service.name, 0);
    const revenue = related.filter((booking) => countsAsRevenue(booking.status)).reduce((sum, booking) => sum + (booking.priceAmount ?? price), 0);
    return {
      ...service,
      price,
      bookings: related.length,
      revenue,
      popularity: Math.round((related.length / total) * 100),
    };
  });
}

function overlayClientExtras(clients: ClientInsight[], sections: WorkspaceSections): ClientInsight[] {
  const notes = normalizeClientTextMap(sections.clientNotes);
  const favorites = normalizeClientBooleanMap(sections.clientFavorites);

  if (Object.keys(notes).length === 0 && Object.keys(favorites).length === 0) return clients;

  return clients.map((client) => {
    const note = notes[client.id] ?? notes[client.phone];
    const favorite = favorites[client.id] ?? favorites[client.phone];

    return {
      ...client,
      ...(note !== undefined ? { note } : {}),
      ...(favorite !== undefined ? { favorite } : {}),
    };
  });
}

export function buildWorkspaceSeed(
  profile: MasterProfile,
  bookings: Booking[],
  locale: Locale,
): WorkspaceSections {
  const dataset = buildWorkspaceDataset(profile, bookings, locale);

  return {
    bookings,
    services: dataset.services,
    availability: dataset.availability,
    templates: dataset.templates,
    notifications: dataset.notifications,
    chats: [],
    quietHours: false,
    fallbackEmail: true,
  };
}

export function buildWorkspaceDatasetFromStored(
  profile: MasterProfile,
  bookings: Booking[],
  locale: Locale,
  sections: WorkspaceSections | null | undefined,
): WorkspaceDataset {
  const base = buildWorkspaceDataset(profile, bookings, locale);
  const source = sections ?? {};

  const effectiveServices = Array.isArray(source.services) && source.services.length > 0
    ? rebuildStoredServiceMetrics(source.services as ServiceInsight[], bookings)
    : base.services;
  const serviceMap = new Map(effectiveServices.map((service) => [service.name, service]));
  const daily = base.daily.map((day) => {
    const dayBookings = bookings.filter((booking) => booking.date === day.date);
    const confirmed = dayBookings.filter((booking) => countsAsScheduled(booking.status)).length;
    const revenue = dayBookings
      .filter((booking) => countsAsRevenue(booking.status))
      .reduce((sum, booking) => sum + (booking.priceAmount ?? serviceMap.get(booking.service)?.price ?? parsePriceFromName(booking.service, 0)), 0);
    return { ...day, visitors: day.requests, confirmed, revenue, pageViews: day.requests };
  });
  const channelMap = new Map<string, { visitors: number; bookings: number; revenue: number }>();
  for (const booking of bookings) {
    const label = sourceLabel(booking.source ?? booking.channel, locale);
    const next = channelMap.get(label) ?? { visitors: 0, bookings: 0, revenue: 0 };
    next.visitors += 1;
    next.bookings += countsAsScheduled(booking.status) ? 1 : 0;
    next.revenue += countsAsRevenue(booking.status) ? (booking.priceAmount ?? serviceMap.get(booking.service)?.price ?? parsePriceFromName(booking.service, 0)) : 0;
    channelMap.set(label, next);
  }
  const channelLabels = locale === 'ru' ? ['Web', 'ТГ', 'ВК', 'Инстаграм'] : ['Web', 'Telegram', 'VK', 'Instagram'];
  const channels = channelLabels.map((label) => {
    const canonical = label === 'ТГ' ? 'Telegram' : label === 'ВК' ? 'VK' : label;
    const item = channelMap.get(label) ?? channelMap.get(canonical) ?? { visitors: 0, bookings: 0, revenue: 0 };
    const display = label;
    return {
      id: profile.slug + '-channel-' + display.toLowerCase(),
      label: display,
      visitors: item.visitors,
      bookings: item.bookings,
      revenue: item.revenue,
      conversion: item.visitors > 0 ? Number(((item.bookings / item.visitors) * 100).toFixed(1)) : 0,
    };
  });
  const visitors = daily.reduce((sum, item) => sum + item.visitors, 0);
  const confirmed = bookings.filter((booking) => countsAsScheduled(booking.status)).length;
  const activeBookings = bookings.filter((booking) => booking.status !== 'cancelled' && booking.status !== 'no_show');
  const revenue = activeBookings.filter((booking) => countsAsRevenue(booking.status)).reduce((sum, booking) => sum + (booking.priceAmount ?? serviceMap.get(booking.service)?.price ?? parsePriceFromName(booking.service, 0)), 0);

  const subscription = normalizeSubscriptionInsight(source.subscription, locale);
  const subscriptionEvents = normalizeSubscriptionEvents(source.subscriptionEvents);
  const clients = overlayClientExtras(base.clients, source);

  return {
    ...base,
    services: effectiveServices,
    daily,
    channels,
    availability: Array.isArray(source.availability) && source.availability.length > 0 ? (source.availability as AvailabilityDayInsight[]) : base.availability,
    templates: Array.isArray(source.templates) && source.templates.length > 0 ? (source.templates as MessageTemplateInsight[]) : base.templates,
    notifications: normalizeNotificationItems(source.notifications as unknown[] | undefined, base.notifications),
    clients,
    subscription,
    payments: buildSubscriptionPayments(locale, subscriptionEvents),
    limits: buildLimits(effectiveServices, clients, locale, subscription.planId),
    totals: {
      ...base.totals,
      confirmed,
      completed: bookings.filter((booking) => countsAsRevenue(booking.status)).length,
      cancelled: bookings.filter((booking) => booking.status === 'cancelled' || booking.status === 'no_show').length,
      revenue,
      visitors,
      conversion: visitors > 0 ? Number(((confirmed / visitors) * 100).toFixed(1)) : 0,
      averageCheck: bookings.filter((booking) => countsAsRevenue(booking.status)).length > 0 ? Math.round(revenue / bookings.filter((booking) => countsAsRevenue(booking.status)).length) : 0,
    },
  };
}
