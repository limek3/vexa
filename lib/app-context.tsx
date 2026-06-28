'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { useLocale } from '@/lib/locale-context';
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase/client';
import {
  CLICKBOOK_AUTH_SESSION_READY_EVENT,
  authorizeTelegramMiniAppSession,
  getStoredTelegramAppSessionToken,
  getTelegramAppSessionHeaders,
  hasTelegramMiniAppRuntime,
} from '@/lib/telegram-miniapp-auth-client';
import { parseServices, slugify } from '@/lib/utils';
import { buildWorkspaceSeed, type WorkspaceSections, type WorkspaceSnapshot } from '@/lib/workspace-store';
import { getDemoBookings, getDemoProfile, saveStoredDemoProfile, SLOTY_DEMO_SLUG } from '@/lib/demo-data';
import { isDashboardDemoEnabled } from '@/lib/dashboard-demo';
import type {
  Booking,
  BookingFormValues,
  BookingStatus,
  MasterProfile,
  MasterProfileFormValues,
} from '@/lib/types';

interface SaveProfileResult {
  success: boolean;
  error?: string;
  profile?: MasterProfile;
}

interface CreateBookingResult {
  success: boolean;
  error?: string;
  booking?: Booking;
  telegramConfirmationUrl?: string | null;
  vkConfirmationUrl?: string | null;
}

type SaveProfileValues = MasterProfileFormValues &
  Partial<
    Pick<
      MasterProfile,
      'priceHint' | 'experienceLabel' | 'responseTime' | 'workGallery' | 'reviews' | 'rating' | 'reviewCount' | 'locationMode' | 'address' | 'mapUrl'
    >
  >;

interface AppContextValue {
  hasHydrated: boolean;
  workspaceId: string | null;
  ownedProfile: MasterProfile | null;
  profiles: MasterProfile[];
  bookings: Booking[];
  workspaceData: WorkspaceSections;
  saveProfile: (values: SaveProfileValues) => Promise<SaveProfileResult>;
  createBooking: (masterSlug: string, values: BookingFormValues) => Promise<CreateBookingResult>;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => Promise<void>;
  updateWorkspaceSection: <T>(section: string, value: T) => Promise<boolean>;
  refreshWorkspace: () => Promise<void>;
  getProfileBySlug: (slug: string) => MasterProfile | null;
  getDemoProfileBySlug: (slug: string) => MasterProfile | null;
  getBookingsBySlug: (slug: string) => Booking[];
  getDemoBookingsBySlug: (slug: string) => Booking[];
  getPublicPath: (slug: string) => string;
}

const AppContext = createContext<AppContextValue | null>(null);

function buildProfile(values: SaveProfileValues, previous?: MasterProfile | null): MasterProfile {
  const priceHint = 'priceHint' in values ? values.priceHint?.trim() || undefined : previous?.priceHint;
  const experienceLabel =
    'experienceLabel' in values ? values.experienceLabel?.trim() || undefined : previous?.experienceLabel;
  const responseTime = 'responseTime' in values ? values.responseTime?.trim() || undefined : previous?.responseTime;
  const workGallery = values.workGallery ?? previous?.workGallery;
  const reviews = values.reviews ?? previous?.reviews;
  const locationMode = 'locationMode' in values ? values.locationMode ?? previous?.locationMode ?? 'online' : previous?.locationMode ?? 'online';
  const address = 'address' in values ? values.address?.trim() || undefined : previous?.address;
  const mapUrl = 'mapUrl' in values ? values.mapUrl?.trim() || undefined : previous?.mapUrl;
  const rating = typeof values.rating === 'number' ? values.rating : previous?.rating;
  const reviewCount = typeof values.reviewCount === 'number' ? values.reviewCount : previous?.reviewCount;

  return {
    id: previous?.id ?? crypto.randomUUID(),
    slug: slugify(values.slug || values.name),
    name: values.name.trim(),
    profession: values.profession.trim(),
    city: values.city.trim(),
    bio: values.bio.trim(),
    services: parseServices(values.servicesText),
    phone: values.phone.trim() || undefined,
    telegram: values.telegram.trim() || undefined,
    whatsapp: values.whatsapp.trim() || undefined,
    locationMode,
    address,
    mapUrl,
    hidePhone: values.hidePhone,
    hideTelegram: values.hideTelegram,
    hideWhatsapp: values.hideWhatsapp,
    avatar: values.avatar.trim() || undefined,
    priceHint,
    experienceLabel,
    responseTime,
    workGallery,
    reviews,
    rating,
    reviewCount,
    createdAt: previous?.createdAt ?? new Date().toISOString(),
  };
}

const BOOKING_STATUSES: BookingStatus[] = ['new', 'confirmed', 'completed', 'no_show', 'cancelled'];

function valueToString(value: unknown, fallback = '') {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

function optionalString(value: unknown) {
  const text = valueToString(value);
  return text || undefined;
}

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeServiceList(value: unknown): string[] {
  const rawItems = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? parseServices(value)
      : [];

  return Array.from(
    new Map(
      rawItems
        .map((item) => {
          if (typeof item === 'string' || typeof item === 'number') return valueToString(item);
          const row = objectRecord(item);
          return valueToString(row.name ?? row.title ?? row.label ?? row.service);
        })
        .filter(Boolean)
        .map((item) => [item.toLowerCase(), item] as const),
    ).values(),
  );
}

function normalizeLocationMode(value: unknown): MasterProfile['locationMode'] {
  return value === 'address' ? 'address' : 'online';
}

function normalizeWorkGallery(value: unknown): MasterProfile['workGallery'] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      const row = objectRecord(item);
      const title = valueToString(row.title ?? row.name);
      const image = valueToString(row.image ?? row.url ?? row.src);
      if (!title && !image) return null;

      return {
        id: valueToString(row.id, `work-${index}`),
        title,
        image,
        note: optionalString(row.note ?? row.description),
      };
    })
    .filter((item): item is NonNullable<MasterProfile['workGallery']>[number] => Boolean(item));
}

function normalizeReviews(value: unknown): MasterProfile['reviews'] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      const row = objectRecord(item);
      const author = valueToString(row.author ?? row.name ?? row.clientName);
      const text = valueToString(row.text ?? row.message ?? row.comment);
      if (!author && !text) return null;

      const rating = Number(row.rating ?? 5);

      return {
        id: valueToString(row.id, `review-${index}`),
        author: author || 'Клиент',
        text,
        rating: Number.isFinite(rating) ? Math.min(5, Math.max(1, rating)) : 5,
        dateLabel: optionalString(row.dateLabel ?? row.date),
        service: optionalString(row.service),
      };
    })
    .filter((item): item is NonNullable<MasterProfile['reviews']>[number] => Boolean(item));
}

function normalizeProfile(value: unknown): MasterProfile | null {
  const row = objectRecord(value);
  if (Object.keys(row).length === 0) return null;

  const rawName = valueToString(row.name ?? row.masterName ?? row.title ?? row.displayName);
  const rawSlug = valueToString(row.slug ?? row.username);
  const name = rawName || 'Профиль мастера';
  const slug = slugify(rawSlug || name) || 'master';
  const services = normalizeServiceList(row.services ?? row.servicesText);
  const rating = Number(row.rating);
  const reviewCount = Number(row.reviewCount ?? row.review_count);

  return {
    id: valueToString(row.id, slug),
    slug,
    name,
    profession: valueToString(row.profession ?? row.specialization, 'Специалист'),
    city: valueToString(row.city, 'Город'),
    bio: valueToString(row.bio ?? row.description, 'Описание профиля'),
    services,
    phone: optionalString(row.phone),
    telegram: optionalString(row.telegram),
    whatsapp: optionalString(row.whatsapp ?? row.vk),
    locationMode: normalizeLocationMode(row.locationMode ?? row.location_mode),
    address: optionalString(row.address),
    mapUrl: optionalString(row.mapUrl ?? row.map_url),
    hidePhone: Boolean(row.hidePhone ?? row.hide_phone),
    hideTelegram: Boolean(row.hideTelegram ?? row.hide_telegram),
    hideWhatsapp: Boolean(row.hideWhatsapp ?? row.hide_whatsapp),
    avatar: optionalString(row.avatar ?? row.avatarUrl ?? row.photo),
    rating: Number.isFinite(rating) ? rating : undefined,
    reviewCount: Number.isFinite(reviewCount) ? reviewCount : undefined,
    responseTime: optionalString(row.responseTime ?? row.response_time),
    experienceLabel: optionalString(row.experienceLabel ?? row.experience_label),
    priceHint: optionalString(row.priceHint ?? row.price_hint),
    reviews: normalizeReviews(row.reviews),
    workGallery: normalizeWorkGallery(row.workGallery ?? row.work_gallery),
    createdAt: valueToString(row.createdAt ?? row.created_at, new Date().toISOString()),
  };
}

function normalizeBookingStatus(value: unknown): BookingStatus {
  return BOOKING_STATUSES.includes(value as BookingStatus) ? (value as BookingStatus) : 'new';
}

function normalizeBooking(value: unknown, index: number): Booking | null {
  const row = objectRecord(value);
  if (Object.keys(row).length === 0) return null;

  const clientName = valueToString(row.clientName ?? row.client_name ?? row.name, 'Клиент');
  const clientPhone = valueToString(row.clientPhone ?? row.client_phone ?? row.phone, '');
  const service = valueToString(row.service ?? row.serviceName ?? row.service_name, 'Услуга');
  const date = valueToString(row.date, new Date().toISOString().slice(0, 10));
  const time = valueToString(row.time, '10:00').slice(0, 5);
  const createdAt = valueToString(row.createdAt ?? row.created_at, new Date().toISOString());
  const priceAmount = Number(row.priceAmount ?? row.price_amount);
  const durationMinutes = Number(row.durationMinutes ?? row.duration_minutes);
  const metadata = row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
    ? (row.metadata as Record<string, unknown>)
    : undefined;

  return {
    id: valueToString(row.id, `booking-${index}-${date}-${time}`),
    masterSlug: valueToString(row.masterSlug ?? row.master_slug ?? row.slug),
    clientName,
    clientPhone,
    service,
    date,
    time,
    comment: optionalString(row.comment),
    status: normalizeBookingStatus(row.status),
    createdAt,
    source: optionalString(row.source),
    channel: optionalString(row.channel),
    priceAmount: Number.isFinite(priceAmount) ? priceAmount : undefined,
    durationMinutes: Number.isFinite(durationMinutes) ? durationMinutes : undefined,
    confirmedAt: optionalString(row.confirmedAt ?? row.confirmed_at),
    completedAt: optionalString(row.completedAt ?? row.completed_at),
    noShowAt: optionalString(row.noShowAt ?? row.no_show_at),
    cancelledAt: optionalString(row.cancelledAt ?? row.cancelled_at),
    cancelReason: optionalString(row.cancelReason ?? row.cancel_reason),
    statusCheckSentAt: optionalString(row.statusCheckSentAt ?? row.status_check_sent_at),
    metadata,
  };
}

function normalizeBookings(value: unknown, fallbackSlug?: string) {
  if (!Array.isArray(value)) return [] as Booking[];

  return value
    .map((item, index) => normalizeBooking(item, index))
    .filter((item): item is Booking => Boolean(item))
    .map((booking) => ({
      ...booking,
      masterSlug: booking.masterSlug || fallbackSlug || '',
    }));
}

function normalizeWorkspaceData(value: unknown, fallbackSlug?: string): WorkspaceSections {
  const source = objectRecord(value);
  const bookings = normalizeBookings(source.bookings, fallbackSlug);

  return {
    ...source,
    bookings,
  } as WorkspaceSections;
}

function buildBooking(masterSlug: string, values: BookingFormValues): Omit<Booking, 'id' | 'status' | 'createdAt'> {
  return {
    masterSlug,
    clientName: values.clientName.trim(),
    clientPhone: values.clientPhone.trim(),
    service: values.service.trim(),
    date: values.date,
    time: values.time,
    comment: values.comment.trim() || undefined,
  };
}

function detectBookingClientChannel() {
  if (typeof window === 'undefined') {
    return { sourceChannel: 'web', source: 'Web', clientContext: {} as Record<string, unknown> };
  }

  const telegramWebApp = (window as typeof window & { Telegram?: { WebApp?: { initData?: string } } }).Telegram?.WebApp;
  const params = new URLSearchParams(window.location.search);
  const hasTelegramContext = Boolean(telegramWebApp?.initData) || params.has('tgWebAppData') || params.get('source') === 'telegram';
  const hasVkContext = Boolean(params.get('vk_app_id') || params.get('viewer_id') || params.get('vk_user_id') || params.get('source') === 'vk');

  if (hasTelegramContext) {
    return {
      sourceChannel: 'telegram',
      source: 'Telegram',
      clientContext: { entry: 'telegram', hasInitData: Boolean(telegramWebApp?.initData) },
    };
  }

  if (hasVkContext) {
    return {
      sourceChannel: 'vk',
      source: 'VK',
      clientContext: { entry: 'vk' },
    };
  }

  return {
    sourceChannel: 'web',
    source: 'Web',
    clientContext: { entry: 'public_page' },
  };
}

async function parseJson<T>(response: Response) {
  return (await response.json()) as T;
}

async function getAuthHeaders(includeJson = false) {
  const headers: Record<string, string> = includeJson
    ? { 'Content-Type': 'application/json' }
    : {};

  try {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch {
    // Cookie-based Telegram app auth can still work without the fallback header.
  }

  Object.assign(headers, getTelegramAppSessionHeaders());

  return headers;
}

function mergeHeaders(...sources: Array<HeadersInit | undefined>) {
  const headers = new Headers();

  for (const source of sources) {
    if (!source) continue;
    new Headers(source).forEach((value, key) => headers.set(key, value));
  }

  return headers;
}

async function ensureTelegramMiniAppSessionIfNeeded(options?: { force?: boolean; waitMs?: number }) {
  if (!hasTelegramMiniAppRuntime()) return;

  const hasStoredToken = Boolean(getStoredTelegramAppSessionToken());
  if (hasStoredToken && !options?.force) return;

  await authorizeTelegramMiniAppSession(options);
}

async function fetchWithTelegramMiniAppRetry(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);

  if (response.status !== 401) {
    return response;
  }

  await ensureTelegramMiniAppSessionIfNeeded({ force: true, waitMs: 2600 });

  if (Object.keys(getTelegramAppSessionHeaders()).length === 0) {
    return response;
  }

  return fetch(input, {
    ...init,
    credentials: init?.credentials ?? 'include',
    cache: init?.cache ?? 'no-store',
    headers: mergeHeaders(init?.headers, await getAuthHeaders(false)),
  });
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { copy, locale } = useLocale();
  const pathname = usePathname();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [ownedProfile, setOwnedProfile] = useState<MasterProfile | null>(null);
  const [storedBookings, setStoredBookings] = useState<Booking[]>([]);
  const [workspaceData, setWorkspaceData] = useState<WorkspaceSections>({});

  const applySnapshot = useCallback((snapshot: WorkspaceSnapshot | null) => {
    if (!snapshot) {
      setWorkspaceId(null);
      setOwnedProfile(null);
      setStoredBookings([]);
      setWorkspaceData({});
      return;
    }

    const safeProfile = normalizeProfile(snapshot.profile);
    const safeData = normalizeWorkspaceData(snapshot.data, safeProfile?.slug ?? snapshot.slug);
    const safeBookings = Array.isArray(safeData.bookings) ? safeData.bookings : [];

    setWorkspaceId(valueToString(snapshot.id));
    setOwnedProfile(safeProfile);
    setStoredBookings(safeBookings);
    setWorkspaceData(safeData);
  }, []);

  const refreshWorkspace = useCallback(async () => {
    try {
      await ensureTelegramMiniAppSessionIfNeeded({ waitMs: 1400 });

      const response = await fetchWithTelegramMiniAppRetry('/api/workspace', {
        credentials: 'include',
        cache: 'no-store',
        headers: await getAuthHeaders(),
      });

      if (response.status === 401 || response.status === 404) {
        applySnapshot(null);
        return;
      }

      if (!response.ok) {
        throw new Error('workspace_fetch_failed');
      }

      const snapshot = await parseJson<WorkspaceSnapshot>(response);
      applySnapshot(snapshot);
    } catch {
      applySnapshot(null);
    }
  }, [applySnapshot]);

  useEffect(() => {
    let active = true;

    if (pathname === '/app') {
      setHasHydrated(true);
      return () => {
        active = false;
      };
    }

    (async () => {
      await refreshWorkspace();
      if (active) {
        setHasHydrated(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [pathname, refreshWorkspace]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleAuthReady = () => {
      if (pathname === '/app') return;
      void refreshWorkspace();
    };

    window.addEventListener(CLICKBOOK_AUTH_SESSION_READY_EVENT, handleAuthReady);

    return () => {
      window.removeEventListener(CLICKBOOK_AUTH_SESSION_READY_EVENT, handleAuthReady);
    };
  }, [pathname, refreshWorkspace]);

  const profiles = useMemo(() => {
    return ownedProfile ? [ownedProfile] : [];
  }, [ownedProfile]);

  const bookings = useMemo(() => {
    return [...storedBookings].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [storedBookings]);

  const getProfileBySlug = useCallback(
    (slug: string) => profiles.find((profile) => profile.slug === slug) ?? null,
    [profiles],
  );

  const getDemoProfileBySlug = useCallback(
    (slug: string) => getDemoProfile(slug, locale),
    [locale],
  );

  const getBookingsBySlug = useCallback(
    (slug: string) => bookings.filter((booking) => booking.masterSlug === slug),
    [bookings],
  );

  const getDemoBookingsBySlug = useCallback(
    (slug: string) => getDemoBookings(slug, locale),
    [locale],
  );

  const validateProfile = useCallback(
    (values: MasterProfileFormValues, existingProfile?: MasterProfile | null) => {
      const slug = slugify(values.slug || values.name);
      const services = parseServices(values.servicesText);

      if (!values.name.trim()) return copy.validation.masterName;
      if (!values.profession.trim()) return copy.validation.profession;
      if (!values.city.trim()) return copy.validation.city;
      if (!values.bio.trim()) return copy.validation.bio;
      if (!slug) return copy.validation.slug;
      if (services.length === 0) return copy.validation.services;

      return null;
    },
    [copy.validation],
  );

  const validateBooking = useCallback(
    (values: BookingFormValues) => {
      if (!values.clientName.trim()) return copy.validation.clientName;
      if (!values.clientPhone.trim()) return copy.validation.clientPhone;
      if (!values.service.trim()) return copy.validation.service;
      if (!values.date) return copy.validation.date;
      if (!values.time) return copy.validation.time;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const selectedDate = new Date(`${values.date}T00:00:00`);
      if (selectedDate.getTime() < today.getTime()) return copy.validation.pastDate;

      return null;
    },
    [copy.validation],
  );

  const saveProfile = useCallback(
    async (values: SaveProfileValues): Promise<SaveProfileResult> => {
      const error = validateProfile(values, ownedProfile);
      if (error) {
        return { success: false, error };
      }

      const demoMode =
        typeof window !== 'undefined' &&
        isDashboardDemoEnabled(new URLSearchParams(window.location.search || ''));
      const previousProfile = demoMode ? getDemoProfile(SLOTY_DEMO_SLUG, locale) : ownedProfile;
      const nextProfile = buildProfile(
        demoMode ? { ...values, slug: SLOTY_DEMO_SLUG } : values,
        previousProfile,
      );

      if (demoMode) {
        saveStoredDemoProfile(nextProfile);
        return {
          success: true,
          profile: nextProfile,
        };
      }

      try {
        const response = await fetchWithTelegramMiniAppRetry('/api/profile', {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
          headers: await getAuthHeaders(true),
          body: JSON.stringify({
            workspaceId,
            profile: nextProfile,
            locale,
          }),
        });

        if (response.status === 401) {
          return {
            success: false,
            error: locale === 'ru' ? 'Сессия истекла. Войдите снова.' : 'Session expired. Please sign in again.',
          };
        }

        if (response.status === 409) {
          return { success: false, error: copy.validation.slugTaken };
        }

        if (response.status === 402) {
          const payload = await parseJson<{ limit?: number }>(response).catch(() => ({}));
          return {
            success: false,
            error: locale === 'ru'
              ? `На текущем тарифе можно сохранить до ${payload.limit ?? 5} активных услуг. Уменьшите список или смените тариф.`
              : `Your current plan allows up to ${payload.limit ?? 5} active services. Reduce the list or change the plan.`,
          };
        }

        if (!response.ok) {
          return {
            success: false,
            error: locale === 'ru' ? 'Не удалось сохранить данные. Попробуйте ещё раз.' : 'Could not save the data. Please try again.',
          };
        }

        const snapshot = await parseJson<WorkspaceSnapshot>(response);
        const nextData = Object.keys(snapshot.data ?? {}).length > 0
          ? snapshot.data
          : buildWorkspaceSeed(nextProfile, snapshot.data?.bookings as Booking[] ?? [], locale);

        applySnapshot({
          ...snapshot,
          data: nextData,
        });

        return {
          success: true,
          profile: nextProfile,
        };
      } catch {
        return {
          success: false,
          error: locale === 'ru' ? 'Не удалось сохранить данные. Попробуйте ещё раз.' : 'Could not save the data. Please try again.',
        };
      }
    },
    [applySnapshot, copy.validation.slugTaken, locale, ownedProfile, validateProfile, workspaceId],
  );

  const createBooking = useCallback(
    async (masterSlug: string, values: BookingFormValues): Promise<CreateBookingResult> => {
      const error = validateBooking(values);

      if (error) {
        return { success: false, error };
      }

      try {
        const response = await fetch('/api/bookings', {
          method: 'POST',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            masterSlug,
            values: buildBooking(masterSlug, values),
            ...detectBookingClientChannel(),
          }),
        });

        if (response.status === 409) {
          return {
            success: false,
            error: locale === 'ru'
              ? 'Это время уже занято или недоступно в графике. Выберите другой слот.'
              : 'This time is already booked or unavailable. Please choose another slot.',
          };
        }

        if (!response.ok) {
          return {
            success: false,
            error: locale === 'ru' ? 'Не удалось сохранить данные. Попробуйте ещё раз.' : 'Could not save the data. Please try again.',
          };
        }

        const payload = await parseJson<{ booking: Booking; telegram?: { url?: string | null } | null; telegramConfirmationUrl?: string | null; vk?: { url?: string | null } | null; vkConfirmationUrl?: string | null }>(response);

        if (ownedProfile?.slug === masterSlug) {
          setStoredBookings((current) => [payload.booking, ...current]);
          setWorkspaceData((current) => ({
            ...current,
            bookings: [payload.booking, ...(Array.isArray(current.bookings) ? (current.bookings as Booking[]) : storedBookings)],
          }));
        }

        return {
          success: true,
          booking: payload.booking,
          telegramConfirmationUrl: payload.telegram?.url ?? payload.telegramConfirmationUrl ?? null,
          vkConfirmationUrl: payload.vk?.url ?? payload.vkConfirmationUrl ?? null,
        };
      } catch {
        return {
          success: false,
          error: locale === 'ru' ? 'Не удалось сохранить данные. Попробуйте ещё раз.' : 'Could not save the data. Please try again.',
        };
      }
    },
    [locale, ownedProfile?.slug, storedBookings, validateBooking],
  );

  const updateWorkspaceSection = useCallback(
    async <T,>(section: string, value: T) => {
      if (!workspaceId) return false;

      setWorkspaceData((current) => ({
        ...current,
        [section]: value,
      }));

      if (section === 'bookings' && Array.isArray(value)) {
        setStoredBookings(value as Booking[]);
      }

      try {
        const response = await fetchWithTelegramMiniAppRetry('/api/workspace/section', {
          method: 'PATCH',
          credentials: 'include',
          cache: 'no-store',
          headers: await getAuthHeaders(true),
          body: JSON.stringify({
            workspaceId,
            section,
            value,
          }),
        });

        if (!response.ok) {
          await refreshWorkspace();
          return false;
        }

        return true;
      } catch {
        return false;
      }
    },
    [workspaceId, refreshWorkspace],
  );

  const updateBookingStatus = useCallback(
    async (bookingId: string, status: BookingStatus) => {
      if (!workspaceId) throw new Error('workspace_required');

      const optimisticBookings = bookings.map((booking) => (booking.id === bookingId ? { ...booking, status } : booking));
      setStoredBookings(optimisticBookings);
      setWorkspaceData((current) => ({
        ...current,
        bookings: optimisticBookings,
      }));

      try {
        const response = await fetchWithTelegramMiniAppRetry('/api/bookings', {
          method: 'PATCH',
          credentials: 'include',
          cache: 'no-store',
          headers: await getAuthHeaders(true),
          body: JSON.stringify({
            bookingId,
            status,
          }),
        });

        if (!response.ok) {
          throw new Error('booking_status_update_failed');
        }

        const payload = await parseJson<{ booking: Booking }>(response);
        const confirmedBookings = optimisticBookings.map((booking) =>
          booking.id === bookingId ? payload.booking : booking,
        );

        setStoredBookings(confirmedBookings);
        setWorkspaceData((current) => ({
          ...current,
          bookings: confirmedBookings,
        }));
      } catch {
        await refreshWorkspace();
        throw new Error('booking_status_update_failed');
      }
    },
    [bookings, refreshWorkspace, workspaceId],
  );

  const getPublicPath = useCallback((slug: string) => `/m/${slug}`, []);

  const value = useMemo<AppContextValue>(
    () => ({
      hasHydrated,
      workspaceId,
      ownedProfile,
      profiles,
      bookings,
      workspaceData,
      saveProfile,
      createBooking,
      updateBookingStatus,
      updateWorkspaceSection,
      refreshWorkspace,
      getProfileBySlug,
      getDemoProfileBySlug,
      getBookingsBySlug,
      getDemoBookingsBySlug,
      getPublicPath,
    }),
    [
      bookings,
      createBooking,
      getBookingsBySlug,
      getDemoBookingsBySlug,
      getDemoProfileBySlug,
      getProfileBySlug,
      getPublicPath,
      hasHydrated,
      ownedProfile,
      profiles,
      refreshWorkspace,
      saveProfile,
      updateBookingStatus,
      updateWorkspaceSection,
      workspaceData,
      workspaceId,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }

  return context;
}