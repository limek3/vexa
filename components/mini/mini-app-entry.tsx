'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import {
  BarChart3,
  Bell,
  Home,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  Eye,
  LayoutDashboard,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  MoreVertical,
  Palette,
  Phone,
  Plus,
  RefreshCcw,
  Scissors,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Star,
  Trash2,
  UserRound,
  Users2,
  X,
  XCircle,
} from 'lucide-react';

import { BrandLogo } from '@/components/brand/brand-logo';
import { useApp } from '@/lib/app-context';
import {
  authorizeTelegramMiniAppSession,
  getTelegramAppSessionHeaders,
} from '@/lib/telegram-miniapp-auth-client';
import { cn } from '@/lib/utils';
import { getTelegramWebApp } from '@/lib/telegram-webapp-safe';
import type {
  Booking,
  BookingStatus,
  MasterProfile,
  MasterProfileFormValues,
  WorkGalleryItem,
} from '@/lib/types';

type MiniScreen =
  | 'today'
  | 'availability'
  | 'chats'
  | 'clients'
  | 'more'
  | 'profile'
  | 'services'
  | 'analytics'
  | 'appearance'
  | 'settings';

type MiniProfileSaveValues = MasterProfileFormValues &
  Partial<
    Pick<
      MasterProfile,
      | 'priceHint'
      | 'experienceLabel'
      | 'responseTime'
      | 'workGallery'
      | 'reviews'
      | 'rating'
      | 'reviewCount'
      | 'locationMode'
      | 'address'
      | 'mapUrl'
    >
  >;

type AvailabilityDay = {
  id: string;
  label: string;
  short: string;
  enabled: boolean;
  start: string;
  end: string;
  interval: number;
  breakStart?: string;
  breakEnd?: string;
  slots: string[];
};

type ServiceItem = {
  id: string;
  name: string;
  price: string;
  duration: string;
  category: string;
  status: 'active' | 'seasonal' | 'draft';
  visible: boolean;
};

type MiniChatMessage = {
  id: string;
  from: 'client' | 'master' | 'system';
  text: string;
  createdAt: string;
};

type MiniChatThread = {
  id: string;
  clientName: string;
  clientPhone?: string;
  source?: string;
  priority?: 'normal' | 'high' | 'low';
  botConnected?: boolean;
  lastMessage?: string;
  updatedAt?: string;
  messages: MiniChatMessage[];
};

const STATUS_META: Record<
  BookingStatus,
  {
    label: string;
    dot: string;
    pill: string;
  }
> = {
  new: {
    label: 'Новая',
    dot: 'bg-sky-400',
    pill: 'bg-sky-400/12 text-sky-100 border-sky-300/20',
  },
  confirmed: {
    label: 'Запланирована',
    dot: 'bg-blue-400',
    pill: 'bg-blue-400/12 text-blue-100 border-blue-300/20',
  },
  completed: {
    label: 'Пришла',
    dot: 'bg-emerald-400',
    pill: 'bg-emerald-400/12 text-emerald-100 border-emerald-300/20',
  },
  no_show: {
    label: 'Не пришла',
    dot: 'bg-orange-400',
    pill: 'bg-orange-400/12 text-orange-100 border-orange-300/20',
  },
  cancelled: {
    label: 'Отмена',
    dot: 'bg-rose-400',
    pill: 'bg-rose-400/12 text-rose-100 border-rose-300/20',
  },
};

const ACCENT_OPTIONS = [
  {
    id: 'mono',
    label: 'Моно',
    value: '#ffffff',
    soft: 'rgba(255,255,255,0.10)',
  },
  {
    id: 'blue',
    label: 'Синий',
    value: '#8bbcff',
    soft: 'rgba(139,188,255,0.14)',
  },
  {
    id: 'rose',
    label: 'Розовый',
    value: '#f5a3bd',
    soft: 'rgba(245,163,189,0.14)',
  },
  {
    id: 'gold',
    label: 'Золото',
    value: '#e8c77a',
    soft: 'rgba(232,199,122,0.14)',
  },
  {
    id: 'sage',
    label: 'Шалфей',
    value: '#a8d5ba',
    soft: 'rgba(168,213,186,0.14)',
  },
];

const DEFAULT_AVAILABILITY: AvailabilityDay[] = [
  {
    id: 'mon',
    label: 'Понедельник',
    short: 'Пн',
    enabled: true,
    start: '10:00',
    end: '20:00',
    interval: 60,
    breakStart: '14:00',
    breakEnd: '15:00',
    slots: ['10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00', '18:00', '19:00'],
  },
  {
    id: 'tue',
    label: 'Вторник',
    short: 'Вт',
    enabled: true,
    start: '10:00',
    end: '20:00',
    interval: 60,
    breakStart: '14:00',
    breakEnd: '15:00',
    slots: ['10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00', '18:00', '19:00'],
  },
  {
    id: 'wed',
    label: 'Среда',
    short: 'Ср',
    enabled: true,
    start: '10:00',
    end: '20:00',
    interval: 60,
    breakStart: '14:00',
    breakEnd: '15:00',
    slots: ['10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00', '18:00', '19:00'],
  },
  {
    id: 'thu',
    label: 'Четверг',
    short: 'Чт',
    enabled: true,
    start: '10:00',
    end: '20:00',
    interval: 60,
    breakStart: '14:00',
    breakEnd: '15:00',
    slots: ['10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00', '18:00', '19:00'],
  },
  {
    id: 'fri',
    label: 'Пятница',
    short: 'Пт',
    enabled: true,
    start: '10:00',
    end: '19:00',
    interval: 60,
    breakStart: '14:00',
    breakEnd: '15:00',
    slots: ['10:00', '11:00', '12:00', '13:00', '15:00', '16:00', '17:00', '18:00'],
  },
  {
    id: 'sat',
    label: 'Суббота',
    short: 'Сб',
    enabled: true,
    start: '11:00',
    end: '17:00',
    interval: 60,
    slots: ['11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
  },
  {
    id: 'sun',
    label: 'Воскресенье',
    short: 'Вс',
    enabled: false,
    start: '11:00',
    end: '17:00',
    interval: 60,
    slots: [],
  },
];

const RUB = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

function todayKey() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function addDaysKey(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function formatDayLabel(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`);

  if (Number.isNaN(date.getTime())) return dateKey;

  return date.toLocaleDateString('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatTime(value: string) {
  return value?.slice(0, 5) || '—';
}

function getBookingAmount(booking: Booking) {
  return typeof booking.priceAmount === 'number' && Number.isFinite(booking.priceAmount)
    ? booking.priceAmount
    : 0;
}

function getInitials(name?: string | null) {
  const safe = (name || 'КБ').trim();

  return safe
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function sortBookings(a: Booking, b: Booking) {
  return `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`);
}

function safeRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function safeArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function getString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function profileToForm(profile: MasterProfile | null): MiniProfileSaveValues {
  return {
    name: profile?.name ?? '',
    profession: profile?.profession ?? '',
    city: profile?.city ?? '',
    bio: profile?.bio ?? '',
    servicesText: profile?.services?.join('\n') ?? '',
    slug: profile?.slug ?? '',
    phone: profile?.phone ?? '',
    telegram: profile?.telegram ?? '',
    whatsapp: profile?.whatsapp ?? '',
    avatar: profile?.avatar ?? '',
    hidePhone: Boolean(profile?.hidePhone),
    hideTelegram: Boolean(profile?.hideTelegram),
    hideWhatsapp: Boolean(profile?.hideWhatsapp),
    priceHint: profile?.priceHint ?? '',
    experienceLabel: profile?.experienceLabel ?? '',
    responseTime: profile?.responseTime ?? '',
    address: profile?.address ?? '',
    mapUrl: profile?.mapUrl ?? '',
    locationMode: profile?.locationMode ?? 'online',
    workGallery: profile?.workGallery ?? [],
    reviews: profile?.reviews ?? [],
    rating: profile?.rating,
    reviewCount: profile?.reviewCount,
  };
}

function toMinutes(value: string) {
  const [h, m] = value.split(':').map((part) => Number(part));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

function fromMinutes(value: number) {
  const h = Math.floor(value / 60);
  const m = value % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function generateSlots(day: AvailabilityDay) {
  if (!day.enabled) return [];

  const start = toMinutes(day.start);
  const end = toMinutes(day.end);
  const breakStart = day.breakStart ? toMinutes(day.breakStart) : null;
  const breakEnd = day.breakEnd ? toMinutes(day.breakEnd) : null;
  const interval = Math.max(15, Number(day.interval) || 60);

  const slots: string[] = [];

  for (let current = start; current < end; current += interval) {
    const insideBreak =
      breakStart !== null && breakEnd !== null && current >= breakStart && current < breakEnd;

    if (!insideBreak) {
      slots.push(fromMinutes(current));
    }
  }

  return slots;
}

function normalizeAvailability(value: unknown): AvailabilityDay[] {
  if (!Array.isArray(value)) return DEFAULT_AVAILABILITY;

  const byId = new Map(
    value.map((item) => {
      const row = safeRecord(item);

      return [
        String(row.id || ''),
        {
          id: String(row.id || ''),
          label: String(row.label || ''),
          short: String(row.short || ''),
          enabled: row.enabled !== false,
          start: String(row.start || '10:00'),
          end: String(row.end || '20:00'),
          interval: Number(row.interval || 60),
          breakStart: typeof row.breakStart === 'string' ? row.breakStart : undefined,
          breakEnd: typeof row.breakEnd === 'string' ? row.breakEnd : undefined,
          slots: safeArray<string>(row.slots),
        } satisfies AvailabilityDay,
      ] as const;
    }),
  );

  return DEFAULT_AVAILABILITY.map((fallback) => {
    const saved = byId.get(fallback.id);
    if (!saved) return fallback;

    return {
      ...fallback,
      ...saved,
      label: fallback.label,
      short: fallback.short,
      slots: saved.slots.length > 0 ? saved.slots : generateSlots(saved),
    };
  });
}

function getAccentFromWorkspace(workspaceData: Record<string, unknown>) {
  const appearance = safeRecord(workspaceData.appearance);
  const id = String(
    appearance.accentTone ||
      appearance.publicAccent ||
      appearance.accent ||
      workspaceData.accentTone ||
      'mono',
  );

  return ACCENT_OPTIONS.find((item) => item.id === id) ?? ACCENT_OPTIONS[0];
}

function parseServicesFromProfile(profile: MasterProfile | null, workspaceData: Record<string, unknown>) {
  const stored = safeArray<Record<string, unknown>>(workspaceData.serviceCatalog);

  if (stored.length > 0) {
    return stored.map((item, index) => ({
      id: String(item.id || `service-${index}`),
      name: String(item.name || item.title || `Услуга ${index + 1}`),
      price: String(item.price || item.priceAmount || ''),
      duration: String(item.duration || item.durationMinutes || ''),
      category: String(item.category || 'Основное'),
      status:
        item.status === 'seasonal' || item.status === 'draft'
          ? item.status
          : 'active',
      visible: item.visible !== false,
    })) as ServiceItem[];
  }

  return (profile?.services ?? []).map((service, index) => {
    const priceMatch = service.match(/(\d[\d\s]*)\s*₽?/);
    const price = priceMatch ? priceMatch[1].replace(/\s/g, '') : '';

    return {
      id: `service-${index}`,
      name: service.replace(/\s*[—-]\s*\d[\d\s]*\s*₽?/, '').trim() || service,
      price,
      duration: '',
      category: 'Основное',
      status: 'active',
      visible: true,
    } satisfies ServiceItem;
  });
}

function serviceItemsToText(items: ServiceItem[]) {
  return items
    .filter((item) => item.visible && item.name.trim())
    .map((item) => {
      const price = item.price.trim() ? ` — ${item.price.trim()} ₽` : '';
      return `${item.name.trim()}${price}`;
    })
    .join('\n');
}

function normalizeChatThread(value: unknown, index: number): MiniChatThread {
  const row = safeRecord(value);
  const messages = safeArray<Record<string, unknown>>(row.messages).map((message, messageIndex) => ({
    id: String(message.id || `message-${index}-${messageIndex}`),
    from:
      message.from === 'master' || message.sender === 'master'
        ? 'master'
        : message.from === 'system' || message.sender === 'system'
          ? 'system'
          : 'client',
    text: String(message.text || message.body || message.message || ''),
    createdAt: String(message.createdAt || message.created_at || new Date().toISOString()),
  })) satisfies MiniChatMessage[];

  return {
    id: String(row.id || row.threadId || `thread-${index}`),
    clientName: String(row.clientName || row.client_name || row.name || `Клиент ${index + 1}`),
    clientPhone: typeof row.clientPhone === 'string' ? row.clientPhone : typeof row.phone === 'string' ? row.phone : undefined,
    source: typeof row.source === 'string' ? row.source : undefined,
    priority: row.priority === 'high' || row.priority === 'low' ? row.priority : 'normal',
    botConnected: row.botConnected !== false,
    lastMessage: String(row.lastMessage || row.last_message || messages.at(-1)?.text || ''),
    updatedAt: String(row.updatedAt || row.updated_at || new Date().toISOString()),
    messages,
  };
}

async function parseJsonSafe<T>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function fetchMini(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);

  Object.entries(getTelegramAppSessionHeaders()).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return fetch(path, {
    ...init,
    credentials: 'include',
    cache: 'no-store',
    headers,
  });
}

function MiniCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-[20px] border border-white/[0.08] bg-[#141414]/92 shadow-none backdrop-blur-[18px]',
        className,
      )}
    >
      {children}
    </section>
  );
}

function MiniLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
      {children}
    </div>
  );
}

function MiniButton({
  children,
  onClick,
  variant = 'secondary',
  disabled,
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'accent';
  disabled?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-10 items-center justify-center gap-2 rounded-[14px] px-3 text-[12px] font-semibold tracking-[-0.035em] transition active:scale-[0.985] disabled:pointer-events-none disabled:opacity-45',
        variant === 'primary' && 'bg-white text-black hover:bg-white/90',
        variant === 'accent' && 'bg-[var(--mini-accent)] text-black hover:opacity-90',
        variant === 'secondary' &&
          'border border-white/[0.08] bg-white/[0.055] text-white hover:bg-white/[0.08]',
        variant === 'danger' &&
          'border border-rose-300/15 bg-rose-400/10 text-rose-100 hover:bg-rose-400/14',
        variant === 'ghost' &&
          'bg-transparent text-white/55 hover:bg-white/[0.05] hover:text-white',
      )}
    >
      {children}
    </button>
  );
}

function StatusPill({ status }: { status: BookingStatus }) {
  const meta = STATUS_META[status] ?? STATUS_META.new;

  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-full border px-2 text-[10px] font-semibold tracking-[-0.03em]',
        meta.pill,
      )}
    >
      <span className={cn('size-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

function MiniInput({
  label,
  value,
  onChange,
  placeholder,
  textarea,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  textarea?: boolean;
  type?: string;
}) {
  const className =
    'cb-mini-input w-full rounded-[15px] border border-white/[0.08] bg-[#0d0d0d] px-3 text-[16px] font-medium tracking-[-0.035em] text-white outline-none placeholder:text-white/25 focus:border-white/[0.16] [appearance:none] [-webkit-appearance:none] shadow-none';

  return (
    <label className="block">
      <div className="mb-2 text-[11px] font-semibold tracking-[-0.03em] text-white/58">
        {label}
      </div>

      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={4}
          className={cn(className, 'min-h-[112px] resize-none py-3')}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={cn(className, 'h-11')}
        />
      )}
    </label>
  );
}

function MiniSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-[11px] font-semibold tracking-[-0.03em] text-white/58">
        {label}
      </div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="cb-mini-input cb-mini-select h-11 w-full rounded-[15px] border border-white/[0.08] bg-[#0d0d0d] px-3 text-[14px] font-medium tracking-[-0.035em] text-white outline-none focus:border-white/[0.16]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-[#141414] text-white">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function EmptyState({
  title,
  text,
  icon,
}: {
  title: string;
  text: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[18px] border border-dashed border-white/[0.08] bg-white/[0.025] px-5 py-7 text-center">
      <div className="mb-3 flex size-10 items-center justify-center rounded-[14px] border border-white/[0.08] bg-white/[0.045] text-white/55">
        {icon ?? <CalendarClock className="size-5" />}
      </div>
      <div className="text-[15px] font-semibold tracking-[-0.045em] text-white">
        {title}
      </div>
      <div className="mt-1 max-w-[230px] text-[12px] leading-5 text-white/42">
        {text}
      </div>
    </div>
  );
}

function MiniLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080808] px-6 text-white">
      <div className="flex w-full max-w-[310px] flex-col items-center rounded-[22px] border border-white/[0.08] bg-[#141414]/92 px-5 py-6 text-center">
        <BrandLogo />

        <div className="mt-5 size-8 animate-spin rounded-full border border-white/[0.08] border-t-white/60" />

        <div className="mt-5 text-[15px] font-semibold tracking-[-0.045em]">
          Загружаем кабинет
        </div>
        <div className="mt-1 max-w-[230px] text-[12px] leading-5 text-white/42">
          Проверяем Telegram-сессию и загружаем профиль мастера.
        </div>
      </div>
    </main>
  );
}

function closeTelegramMiniApp() {
  if (typeof window === 'undefined') return;
  try {
    getTelegramWebApp()?.close?.();
  } catch {}
}

function MiniShell({
  screen,
  setScreen,
  children,
  profile,
  onRefresh,
  accent,
}: {
  screen: MiniScreen;
  setScreen: (screen: MiniScreen) => void;
  children: ReactNode;
  profile: MasterProfile | null;
  onRefresh: () => void;
  accent: (typeof ACCENT_OPTIONS)[number];
}) {
  const shellStyle = {
    '--mini-accent': accent.value,
    '--mini-accent-soft': accent.soft,
    '--mini-shell-top-gap': 'calc(var(--tg-content-safe-top, 0px) + 12px)',
    '--mini-shell-bottom-gap': 'calc(var(--tg-content-safe-bottom, var(--tg-safe-bottom, 0px)) + 10px)',
  } as CSSProperties & Record<string, string>;

  const navItems: Array<{
    id: MiniScreen;
    label: string;
    icon: ReactNode;
  }> = [
    { id: 'today', label: 'Главная', icon: <Home className="size-[21px]" /> },
    { id: 'availability', label: 'Записи', icon: <CalendarClock className="size-[21px]" /> },
    { id: 'chats', label: 'Чаты', icon: <MessageCircle className="size-[21px]" /> },
    { id: 'clients', label: 'Клиенты', icon: <Users2 className="size-[21px]" /> },
    { id: 'more', label: 'Ещё', icon: <MoreHorizontal className="size-[22px]" /> },
  ];

  const topButtonClass =
    'flex size-10 shrink-0 items-center justify-center rounded-[15px] border border-white/[0.08] bg-white/[0.055] text-white/62 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] transition hover:bg-white/[0.075] hover:text-white/82 active:scale-95';

  return (
    <main
      data-mini-theme="dark"
      data-mini-mode="dark"
      style={shellStyle}
      className="cb-mini-app-root h-[var(--tg-viewport-height,100dvh)] min-h-[100svh] overflow-hidden bg-[#080808] text-white"
    >
      <div className="mx-auto flex h-full w-full max-w-[430px] flex-col px-3">
        <style>{`
          .cb-mini-shell-scroll { scrollbar-width: none; }
          .cb-mini-shell-scroll::-webkit-scrollbar { display: none; }
        `}</style>

        <header className="mt-[var(--mini-shell-top-gap)] mb-4 shrink-0 rounded-[25px] border border-white/[0.075] bg-[#111111]/82 px-3 py-3 shadow-[0_18px_52px_rgba(0,0,0,0.46),inset_0_1px_0_rgba(255,255,255,0.045)] backdrop-blur-[30px] backdrop-saturate-[1.25]">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[17px] border border-white/[0.08] bg-white/[0.06] shadow-[0_10px_26px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.05)]">
                {profile?.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar} alt="" className="size-full object-cover" />
                ) : (
                  <span className="text-[15px] font-bold tracking-[-0.05em] text-white/88">
                    {getInitials(profile?.name || 'КликБук')}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <div className="truncate text-[18px] font-semibold leading-none tracking-[-0.055em] text-white">
                  КликБук
                </div>
                <div className="mt-1 truncate text-[12px] font-medium uppercase tracking-[0.02em] text-white/38">
                  MINI APP
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={onRefresh}
                aria-label="Обновить"
                className={topButtonClass}
              >
                <Bell className="size-[18px]" strokeWidth={1.65} />
              </button>
              <button
                type="button"
                onClick={() => setScreen('appearance')}
                aria-label="Оформление"
                className={topButtonClass}
              >
                <Sun className="size-[18px]" strokeWidth={1.55} />
              </button>
              <button
                type="button"
                onClick={closeTelegramMiniApp}
                className="flex h-10 shrink-0 items-center rounded-[15px] border border-white/[0.08] bg-white/[0.055] px-3 text-[13px] font-semibold tracking-[-0.035em] text-white/58 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] transition hover:bg-white/[0.075] hover:text-white/82 active:scale-95"
              >
                Закрыть
              </button>
              <button
                type="button"
                onClick={() => setScreen('more')}
                aria-label="Ещё"
                className={topButtonClass}
              >
                <MoreVertical className="size-[18px]" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </header>

        <section className="cb-mini-shell-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pb-5">
          {children}
        </section>

        <nav className="shrink-0 pb-[var(--mini-shell-bottom-gap)] pt-2">
          <div className="grid grid-cols-5 gap-1 rounded-[25px] border border-white/[0.085] bg-[#111111]/84 p-1.5 shadow-[0_-20px_54px_rgba(0,0,0,0.46),inset_0_1px_0_rgba(255,255,255,0.045)] backdrop-blur-[30px] backdrop-saturate-[1.25]">
            {navItems.map((item) => {
              const active =
                screen === item.id ||
                (item.id === 'more' && ['profile', 'services', 'analytics', 'appearance', 'settings'].includes(screen));

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setScreen(item.id)}
                  className={cn(
                    'flex h-[62px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-[19px] text-[10px] font-medium tracking-[-0.04em] transition active:scale-[0.98]',
                    active
                      ? 'border border-white/[0.075] bg-white/[0.065] text-[var(--mini-accent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_22px_rgba(0,0,0,0.24)]'
                      : 'border border-transparent text-white/42 hover:bg-white/[0.035] hover:text-white/68',
                  )}
                >
                  <span className={cn('leading-none', active ? 'text-[var(--mini-accent)] drop-shadow-[0_0_10px_var(--mini-accent-soft)]' : 'text-current')}>
                    {item.icon}
                  </span>
                  <span className="truncate leading-none">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </main>
  );
}

function MiniOnboarding({
  onSave,
}: {
  onSave: (values: MiniProfileSaveValues) => Promise<{ success: boolean; error?: string }>;
}) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<MiniProfileSaveValues>({
    name: '',
    profession: '',
    city: '',
    bio: '',
    servicesText: '',
    slug: '',
    phone: '',
    telegram: '',
    whatsapp: '',
    avatar: '',
    hidePhone: false,
    hideTelegram: false,
    hideWhatsapp: false,
    priceHint: '',
    experienceLabel: '',
    responseTime: '',
    address: '',
    mapUrl: '',
    locationMode: 'online',
    workGallery: [],
    reviews: [],
  });

  const steps = [
    {
      title: 'Основное',
      text: 'Имя, город и описание.',
    },
    {
      title: 'Услуги',
      text: 'Что клиент сможет выбрать.',
    },
    {
      title: 'Контакты',
      text: 'Телефон, Telegram и ссылка.',
    },
  ];

  const update = <K extends keyof MiniProfileSaveValues>(
    key: K,
    value: MiniProfileSaveValues[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  async function handleNext() {
    setError('');

    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }

    setSaving(true);

    const result = await onSave({
      ...form,
      slug: form.slug || form.name,
      bio: form.bio || 'Онлайн-запись к мастеру через КликБук.',
    });

    setSaving(false);

    if (!result.success) {
      setError(result.error || 'Не удалось сохранить профиль.');
    }
  }

  return (
    <main
      data-mini-theme="dark"
      data-mini-mode="dark"
      className="cb-mini-app-root min-h-screen bg-[#080808] px-3 text-white"
      style={{
        paddingTop: 'calc(var(--tg-safe-top, 0px) + 10px)',
        paddingBottom: 'calc(var(--tg-safe-bottom, 0px) + 24px)',
      }}
    >
      <div className="mx-auto w-full max-w-[430px]">
        <header className="mb-5 flex items-center justify-between">
          <BrandLogo />
          <div className="rounded-full border border-white/[0.08] bg-white/[0.045] px-3 py-1 text-[10px] font-semibold text-white/52">
            {step + 1}/{steps.length}
          </div>
        </header>

        <section className="mb-4">
          <MiniLabel>быстрый старт</MiniLabel>
          <h1 className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.075em]">
            Создадим страницу
          </h1>
          <p className="mt-2 max-w-[320px] text-[13px] leading-5 text-white/45">
            Заполните минимум. Остальное можно донастроить позже.
          </p>
        </section>

        <MiniCard className="overflow-hidden">
          <div className="border-b border-white/[0.08] p-4">
            <div className="text-[20px] font-semibold tracking-[-0.06em]">
              {steps[step].title}
            </div>
            <div className="mt-1 text-[12px] leading-5 text-white/42">
              {steps[step].text}
            </div>
          </div>

          <div className="space-y-4 p-4">
            {step === 0 ? (
              <>
                <MiniInput
                  label="Имя или название"
                  value={form.name}
                  onChange={(value) => update('name', value)}
                  placeholder="Например, Анна Nails"
                />
                <MiniInput
                  label="Специализация"
                  value={form.profession}
                  onChange={(value) => update('profession', value)}
                  placeholder="Маникюр, тату, массаж..."
                />
                <MiniInput
                  label="Город"
                  value={form.city}
                  onChange={(value) => update('city', value)}
                  placeholder="Москва"
                />
                <MiniInput
                  label="Описание"
                  value={form.bio}
                  onChange={(value) => update('bio', value)}
                  placeholder="Коротко о себе"
                  textarea
                />
              </>
            ) : null}

            {step === 1 ? (
              <>
                <MiniInput
                  label="Услуги"
                  value={form.servicesText}
                  onChange={(value) => update('servicesText', value)}
                  placeholder={'Маникюр — 2500 ₽\nПедикюр — 3000 ₽\nКоррекция — 2000 ₽'}
                  textarea
                />
                <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.035] p-3 text-[12px] leading-5 text-white/42">
                  Каждую услугу лучше писать с новой строки.
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <MiniInput
                  label="Телефон"
                  value={form.phone}
                  onChange={(value) => update('phone', value)}
                  placeholder="+7..."
                />
                <MiniInput
                  label="Telegram"
                  value={form.telegram}
                  onChange={(value) => update('telegram', value)}
                  placeholder="@username"
                />
                <MiniInput
                  label="Ссылка"
                  value={form.slug}
                  onChange={(value) => update('slug', value)}
                  placeholder="anna-nails"
                />
              </>
            ) : null}

            {error ? (
              <div className="rounded-[16px] border border-rose-300/15 bg-rose-400/10 p-3 text-[12px] leading-5 text-rose-100">
                {error}
              </div>
            ) : null}
          </div>
        </MiniCard>

        <div className="mt-4 grid grid-cols-[96px_1fr] gap-2">
          <MiniButton
            variant="secondary"
            disabled={step === 0 || saving}
            onClick={() => setStep((current) => Math.max(0, current - 1))}
          >
            Назад
          </MiniButton>
          <MiniButton variant="primary" disabled={saving} onClick={handleNext}>
            {saving ? 'Сохраняем...' : step === steps.length - 1 ? 'Сохранить' : 'Далее'}
          </MiniButton>
        </div>
      </div>
    </main>
  );
}

function TodayScreen({
  bookings,
  onOpenBooking,
}: {
  bookings: Booking[];
  onOpenBooking: (booking: Booking) => void;
}) {
  const today = todayKey();

  const todayBookings = useMemo(
    () => bookings.filter((booking) => booking.date === today).sort(sortBookings),
    [bookings, today],
  );

  const upcomingBookings = useMemo(
    () =>
      bookings
        .filter((booking) => `${booking.date} ${booking.time}` >= `${today} 00:00`)
        .sort(sortBookings),
    [bookings, today],
  );

  const list = todayBookings.length > 0 ? todayBookings : upcomingBookings.slice(0, 5);
  const nearest = list[0] ?? null;
  const revenue = todayBookings.reduce((sum, booking) => sum + getBookingAmount(booking), 0);
  const riskCount = todayBookings.filter(
    (booking) => booking.status === 'new' || booking.status === 'no_show',
  ).length;

  return (
    <div className="space-y-3">
      <section>
        <MiniLabel>рабочий день</MiniLabel>
        <h1 className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.075em]">
          Сегодня
        </h1>
        <p className="mt-2 max-w-[320px] text-[12px] leading-5 text-white/42">
          Ближайшая запись, статусы, клиенты и быстрые действия.
        </p>
      </section>

      <div className="grid grid-cols-3 gap-2">
        <MiniCard className="p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/32">
            записи
          </div>
          <div className="mt-2 text-[22px] font-semibold tracking-[-0.07em]">
            {todayBookings.length}
          </div>
          <div className="text-[10px] text-white/35">сегодня</div>
        </MiniCard>

        <MiniCard className="p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/32">
            доход
          </div>
          <div className="mt-2 text-[22px] font-semibold tracking-[-0.07em]">
            {RUB.format(revenue)}
          </div>
          <div className="text-[10px] text-white/35">услуги</div>
        </MiniCard>

        <MiniCard className="p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/32">
            риск
          </div>
          <div className="mt-2 text-[22px] font-semibold tracking-[-0.07em]">
            {riskCount}
          </div>
          <div className="text-[10px] text-white/35">контроль</div>
        </MiniCard>
      </div>

      <MiniCard className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.08] p-4">
          <div>
            <MiniLabel>ближайшая</MiniLabel>
            <div className="mt-1 text-[12px] text-white/42">что нужно сделать сейчас</div>
          </div>

          <Link
            href="/dashboard"
            className="flex h-8 items-center gap-1.5 rounded-[11px] border border-white/[0.08] bg-white/[0.045] px-2.5 text-[11px] font-semibold text-white/58"
          >
            ПК <ExternalLink className="size-3" />
          </Link>
        </div>

        {nearest ? (
          <button
            type="button"
            onClick={() => onOpenBooking(nearest)}
            className="block w-full p-4 text-left active:scale-[0.995]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[34px] font-semibold leading-none tracking-[-0.08em]">
                  {formatTime(nearest.time)}
                </div>
                <div className="mt-3 text-[19px] font-semibold tracking-[-0.06em]">
                  {nearest.clientName}
                </div>
                <div className="mt-1 text-[12px] text-white/42">{nearest.service}</div>
              </div>

              <StatusPill status={nearest.status} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <span className="flex h-10 items-center justify-center rounded-[14px] bg-white text-[12px] font-semibold text-black">
                Открыть
              </span>
              <span className="flex h-10 items-center justify-center gap-2 rounded-[14px] border border-white/[0.08] bg-white/[0.055] text-[12px] font-semibold text-white">
                <Phone className="size-3.5" />
                Позвонить
              </span>
            </div>
          </button>
        ) : (
          <div className="p-4">
            <EmptyState
              title="Сегодня свободно"
              text="На сегодня нет записей. Можно проверить график или веб-кабинет."
            />
          </div>
        )}
      </MiniCard>

      <MiniCard className="overflow-hidden">
        <div className="border-b border-white/[0.08] p-4">
          <div className="text-[15px] font-semibold tracking-[-0.045em]">День</div>
          <div className="mt-1 text-[11px] text-white/38">
            компактный список записей
          </div>
        </div>

        <div className="space-y-2 p-3">
          {list.length > 0 ? (
            list.map((booking) => (
              <button
                key={booking.id}
                type="button"
                onClick={() => onOpenBooking(booking)}
                className="flex w-full items-center gap-3 rounded-[17px] border border-white/[0.07] bg-white/[0.035] p-3 text-left active:scale-[0.99]"
              >
                <div className="w-12 shrink-0 text-[17px] font-semibold tracking-[-0.06em]">
                  {formatTime(booking.time)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold tracking-[-0.04em]">
                    {booking.clientName}
                  </div>
                  <div className="mt-1 truncate text-[11px] text-white/38">
                    {booking.service} · {RUB.format(getBookingAmount(booking))}
                  </div>
                </div>

                <StatusPill status={booking.status} />
                <ChevronRight className="size-4 shrink-0 text-white/26" />
              </button>
            ))
          ) : (
            <EmptyState
              title="Записей пока нет"
              text="Когда клиенты начнут записываться, они появятся здесь."
            />
          )}
        </div>
      </MiniCard>
    </div>
  );
}

function AvailabilityScreen({
  workspaceData,
  updateWorkspaceSection,
}: {
  workspaceData: Record<string, unknown>;
  updateWorkspaceSection: <T>(section: string, value: T) => Promise<boolean>;
}) {
  const [days, setDays] = useState(() => normalizeAvailability(workspaceData.availability));
  const [selectedId, setSelectedId] = useState(days[0]?.id ?? 'mon');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const selectedDay = days.find((day) => day.id === selectedId) ?? days[0];

  useEffect(() => {
    setDays(normalizeAvailability(workspaceData.availability));
  }, [workspaceData.availability]);

  function updateDay(patch: Partial<AvailabilityDay>) {
    setDays((current) =>
      current.map((day) => {
        if (day.id !== selectedDay.id) return day;

        const next = {
          ...day,
          ...patch,
        };

        return {
          ...next,
          slots: generateSlots(next),
        };
      }),
    );
  }

  async function saveAvailability(nextDays = days) {
    setSaving(true);
    setMessage('');

    const ok = await updateWorkspaceSection('availability', nextDays);

    setSaving(false);
    setMessage(ok ? 'График сохранён.' : 'Не удалось сохранить график.');
  }

  async function copyMonday() {
    const monday = days.find((day) => day.id === 'mon') ?? days[0];

    const next = days.map((day) => {
      if (day.id === 'mon') return day;

      const copy = {
        ...day,
        enabled: monday.enabled,
        start: monday.start,
        end: monday.end,
        interval: monday.interval,
        breakStart: monday.breakStart,
        breakEnd: monday.breakEnd,
      };

      return {
        ...copy,
        slots: generateSlots(copy),
      };
    });

    setDays(next);
    await saveAvailability(next);
  }

  return (
    <div className="space-y-3">
      <section>
        <MiniLabel>рабочее время</MiniLabel>
        <h1 className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.075em]">
          График
        </h1>
        <p className="mt-2 text-[12px] leading-5 text-white/42">
          Управляйте днями, интервалами и слотами, которые увидит клиент.
        </p>
      </section>

      <div className="-mx-3 overflow-x-auto px-3">
        <div className="flex gap-2 pb-1">
          {days.map((day) => {
            const active = day.id === selectedDay.id;

            return (
              <button
                key={day.id}
                type="button"
                onClick={() => setSelectedId(day.id)}
                className={cn(
                  'min-w-[72px] rounded-[18px] border p-3 text-left transition active:scale-[0.98]',
                  active
                    ? 'border-white/[0.16] bg-white text-black'
                    : 'border-white/[0.08] bg-white/[0.045] text-white',
                )}
              >
                <div className="text-[13px] font-semibold tracking-[-0.04em]">
                  {day.short}
                </div>
                <div className={cn('mt-2 text-[20px] font-semibold tracking-[-0.07em]', active ? 'text-black' : 'text-white')}>
                  {day.enabled ? day.slots.length : '—'}
                </div>
                <div className={cn('text-[10px]', active ? 'text-black/45' : 'text-white/35')}>
                  слотов
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <MiniCard className="overflow-hidden">
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.08] p-4">
          <div>
            <div className="text-[20px] font-semibold tracking-[-0.06em]">
              {selectedDay.label}
            </div>
            <div className="mt-1 text-[12px] text-white/42">
              {selectedDay.enabled ? `${selectedDay.slots.length} доступных слотов` : 'выходной'}
            </div>
          </div>

          <button
            type="button"
            onClick={() => updateDay({ enabled: !selectedDay.enabled })}
            className={cn(
              'h-8 rounded-full border px-3 text-[11px] font-semibold',
              selectedDay.enabled
                ? 'border-[var(--mini-accent)] bg-[var(--mini-accent-soft)] text-white'
                : 'border-white/[0.08] bg-white/[0.045] text-white/45',
            )}
          >
            {selectedDay.enabled ? 'Рабочий' : 'Выходной'}
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div className="grid grid-cols-2 gap-3">
            <MiniInput
              label="Начало"
              type="time"
              value={selectedDay.start}
              onChange={(value) => updateDay({ start: value })}
            />
            <MiniInput
              label="Конец"
              type="time"
              value={selectedDay.end}
              onChange={(value) => updateDay({ end: value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MiniInput
              label="Перерыв с"
              type="time"
              value={selectedDay.breakStart ?? ''}
              onChange={(value) => updateDay({ breakStart: value })}
            />
            <MiniInput
              label="Перерыв до"
              type="time"
              value={selectedDay.breakEnd ?? ''}
              onChange={(value) => updateDay({ breakEnd: value })}
            />
          </div>

          <MiniSelect
            label="Шаг слота"
            value={String(selectedDay.interval)}
            onChange={(value) => updateDay({ interval: Number(value) })}
            options={[
              { value: '30', label: '30 минут' },
              { value: '45', label: '45 минут' },
              { value: '60', label: '60 минут' },
              { value: '90', label: '90 минут' },
              { value: '120', label: '120 минут' },
            ]}
          />

          <div>
            <div className="mb-2 text-[11px] font-semibold tracking-[-0.03em] text-white/58">
              Слоты клиента
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedDay.enabled && selectedDay.slots.length > 0 ? (
                selectedDay.slots.map((slot) => (
                  <span
                    key={slot}
                    className="rounded-full border border-white/[0.08] bg-white/[0.045] px-3 py-1.5 text-[12px] font-semibold text-white/72"
                  >
                    {slot}
                  </span>
                ))
              ) : (
                <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.035] p-3 text-[12px] text-white/42">
                  В этот день клиент не сможет выбрать время.
                </div>
              )}
            </div>
          </div>

          {message ? (
            <div className="rounded-[15px] border border-white/[0.08] bg-white/[0.035] p-3 text-[12px] text-white/58">
              {message}
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <MiniButton disabled={saving} onClick={() => void copyMonday()}>
              Копировать Пн
            </MiniButton>
            <MiniButton variant="accent" disabled={saving} onClick={() => void saveAvailability()}>
              {saving ? 'Сохраняем...' : 'Сохранить'}
            </MiniButton>
          </div>
        </div>
      </MiniCard>
    </div>
  );
}

function ChatsScreen() {
  const [threads, setThreads] = useState<MiniChatThread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [error, setError] = useState('');

  const selectedThread = threads.find((thread) => thread.id === selectedId) ?? null;

  const loadChats = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetchMini('/api/chats');

      if (!response.ok) {
        throw new Error('chats_load_failed');
      }

      const payload = await parseJsonSafe<Record<string, unknown>>(response);
      const rawThreads =
        safeArray(payload?.threads) ||
        safeArray(payload?.chats) ||
        safeArray(payload?.items);

      const normalized = rawThreads.map(normalizeChatThread);

      setThreads(normalized);
      setSelectedId((current) => current ?? normalized[0]?.id ?? null);
    } catch {
      setError('Не удалось загрузить чаты. Проверьте подключение бота.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadChats();
  }, [loadChats]);

  async function sendMessage(text = messageText) {
    const clean = text.trim();
    if (!clean || !selectedThread) return;

    const optimistic: MiniChatMessage = {
      id: `local-${Date.now()}`,
      from: 'master',
      text: clean,
      createdAt: new Date().toISOString(),
    };

    setThreads((current) =>
      current.map((thread) =>
        thread.id === selectedThread.id
          ? {
              ...thread,
              lastMessage: clean,
              updatedAt: optimistic.createdAt,
              messages: [...thread.messages, optimistic],
            }
          : thread,
      ),
    );

    setMessageText('');

    try {
      const response = await fetchMini('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId: selectedThread.id,
          message: clean,
          text: clean,
        }),
      });

      if (!response.ok) {
        throw new Error('message_send_failed');
      }

      const payload = await parseJsonSafe<Record<string, unknown>>(response);
      const maybeThread = payload?.thread || payload?.chat;

      if (maybeThread) {
        const normalized = normalizeChatThread(maybeThread, 0);
        setThreads((current) =>
          current.map((thread) => (thread.id === selectedThread.id ? normalized : thread)),
        );
      }
    } catch {
      setError('Сообщение добавлено локально, но API чата не ответил.');
    }
  }

  async function createThread() {
    const name = newClientName.trim();
    if (!name) return;

    const localThread: MiniChatThread = {
      id: `local-thread-${Date.now()}`,
      clientName: name,
      clientPhone: newClientPhone.trim(),
      priority: 'normal',
      botConnected: true,
      lastMessage: 'Новый диалог',
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `local-message-${Date.now()}`,
          from: 'system',
          text: 'Диалог создан из Mini App.',
          createdAt: new Date().toISOString(),
        },
      ],
    };

    setThreads((current) => [localThread, ...current]);
    setSelectedId(localThread.id);
    setNewClientName('');
    setNewClientPhone('');

    try {
      await fetchMini('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientName: name,
          clientPhone: newClientPhone.trim(),
          message: 'Диалог создан из Mini App.',
        }),
      });
    } catch {
      // Локальный поток уже создан.
    }
  }

  if (selectedThread) {
    return (
      <div className="space-y-3">
        <section className="flex items-start justify-between gap-3">
          <div>
            <MiniLabel>диалог</MiniLabel>
            <h1 className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.075em]">
              {selectedThread.clientName}
            </h1>
            <p className="mt-2 text-[12px] leading-5 text-white/42">
              {selectedThread.clientPhone || 'контакт не указан'} · {selectedThread.source || 'КликБук'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="flex size-9 items-center justify-center rounded-[13px] border border-white/[0.08] bg-white/[0.045] text-white/55"
          >
            <X className="size-4" />
          </button>
        </section>

        <MiniCard className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.08] p-3">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'size-2 rounded-full',
                  selectedThread.botConnected ? 'bg-emerald-400' : 'bg-white/25',
                )}
              />
              <span className="text-[11px] font-semibold text-white/48">
                {selectedThread.botConnected ? 'бот подключен' : 'бот не подключен'}
              </span>
            </div>

            <span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-2 py-1 text-[10px] font-semibold text-white/45">
              {selectedThread.priority === 'high' ? 'важный' : 'обычный'}
            </span>
          </div>

          <div className="max-h-[360px] space-y-2 overflow-y-auto p-3">
            {selectedThread.messages.length > 0 ? (
              selectedThread.messages.map((message) => {
                const mine = message.from === 'master';

                return (
                  <div
                    key={message.id}
                    className={cn('flex', mine ? 'justify-end' : 'justify-start')}
                  >
                    <div
                      className={cn(
                        'max-w-[78%] rounded-[17px] px-3 py-2 text-[13px] leading-5',
                        mine
                          ? 'bg-[var(--mini-accent)] text-black'
                          : message.from === 'system'
                            ? 'border border-white/[0.08] bg-white/[0.035] text-white/45'
                            : 'bg-white/[0.065] text-white',
                      )}
                    >
                      {message.text}
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                title="Сообщений нет"
                text="Напишите клиенту или выберите быстрый шаблон."
                icon={<MessageCircle className="size-5" />}
              />
            )}
          </div>

          <div className="border-t border-white/[0.08] p-3">
            <div className="mb-2 flex gap-2 overflow-x-auto">
              {['Подтверждаю запись', 'Пришлите удобное время', 'Напомню адрес', 'Спасибо за визит'].map(
                (template) => (
                  <button
                    key={template}
                    type="button"
                    onClick={() => void sendMessage(template)}
                    className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.045] px-3 py-1.5 text-[11px] font-semibold text-white/55"
                  >
                    {template}
                  </button>
                ),
              )}
            </div>

            <div className="grid grid-cols-[1fr_44px] gap-2">
              <input
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                placeholder="Сообщение клиенту..."
                className="h-11 rounded-[15px] border border-white/[0.08] bg-white/[0.055] px-3 text-[14px] font-medium text-white outline-none placeholder:text-white/25 focus:border-white/[0.16] focus:bg-white/[0.075]"
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                className="flex h-11 items-center justify-center rounded-[15px] bg-[var(--mini-accent)] text-black"
              >
                <Send className="size-4" />
              </button>
            </div>
          </div>
        </MiniCard>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <section>
        <MiniLabel>коммуникации</MiniLabel>
        <h1 className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.075em]">
          Чаты
        </h1>
        <p className="mt-2 text-[12px] leading-5 text-white/42">
          Клиенты, быстрые сообщения и шаблоны.
        </p>
      </section>

      <MiniCard className="space-y-3 p-4">
        <div className="text-[15px] font-semibold tracking-[-0.045em]">Новый диалог</div>
        <MiniInput
          label="Имя клиента"
          value={newClientName}
          onChange={setNewClientName}
          placeholder="Анна"
        />
        <MiniInput
          label="Телефон"
          value={newClientPhone}
          onChange={setNewClientPhone}
          placeholder="+7..."
        />
        <MiniButton variant="accent" onClick={() => void createThread()}>
          <Plus className="size-4" />
          Создать чат
        </MiniButton>
      </MiniCard>

      <MiniCard className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.08] p-4">
          <div>
            <div className="text-[15px] font-semibold tracking-[-0.045em]">Диалоги</div>
            <div className="mt-1 text-[11px] text-white/38">
              {loading ? 'загружаем...' : `${threads.length} чатов`}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadChats()}
            className="flex size-8 items-center justify-center rounded-[11px] border border-white/[0.08] bg-white/[0.045] text-white/55"
          >
            <RefreshCcw className="size-3.5" />
          </button>
        </div>

        <div className="space-y-2 p-3">
          {threads.length > 0 ? (
            threads.map((thread) => (
              <button
                key={thread.id}
                type="button"
                onClick={() => setSelectedId(thread.id)}
                className="flex w-full items-center gap-3 rounded-[17px] border border-white/[0.07] bg-white/[0.035] p-3 text-left"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-[14px] border border-white/[0.08] bg-white/[0.055] text-[11px] font-bold">
                  {getInitials(thread.clientName)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold tracking-[-0.04em]">
                    {thread.clientName}
                  </div>
                  <div className="mt-1 truncate text-[11px] text-white/38">
                    {thread.lastMessage || 'Открыть диалог'}
                  </div>
                </div>

                {thread.priority === 'high' ? (
                  <span className="size-2 rounded-full bg-[var(--mini-accent)]" />
                ) : null}

                <ChevronRight className="size-4 text-white/25" />
              </button>
            ))
          ) : (
            <EmptyState
              title={error || 'Чатов пока нет'}
              text="Создайте диалог или дождитесь первого сообщения от клиента."
              icon={<MessageCircle className="size-5" />}
            />
          )}
        </div>
      </MiniCard>
    </div>
  );
}

function ClientsScreen({
  bookings,
  onOpenBooking,
}: {
  bookings: Booking[];
  onOpenBooking: (booking: Booking) => void;
}) {
  const [selectedClientKey, setSelectedClientKey] = useState<string | null>(null);
  const [favoriteKeys, setFavoriteKeys] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const clients = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        name: string;
        phone: string;
        visits: number;
        total: number;
        last: string;
        service: string;
        bookings: Booking[];
      }
    >();

    bookings.forEach((booking) => {
      const key = booking.clientPhone || booking.clientName;
      const current = map.get(key);

      if (!current) {
        map.set(key, {
          key,
          name: booking.clientName,
          phone: booking.clientPhone,
          visits: 1,
          total: getBookingAmount(booking),
          last: booking.date,
          service: booking.service,
          bookings: [booking],
        });
        return;
      }

      current.visits += 1;
      current.total += getBookingAmount(booking);
      current.bookings.push(booking);

      if (booking.date > current.last) {
        current.last = booking.date;
        current.service = booking.service;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.last.localeCompare(a.last));
  }, [bookings]);

  const selectedClient = clients.find((client) => client.key === selectedClientKey) ?? null;

  if (selectedClient) {
    const favorite = favoriteKeys.includes(selectedClient.key);

    return (
      <div className="space-y-3">
        <section className="flex items-start justify-between gap-3">
          <div>
            <MiniLabel>карточка клиента</MiniLabel>
            <h1 className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.075em]">
              {selectedClient.name}
            </h1>
            <p className="mt-2 text-[12px] leading-5 text-white/42">
              {selectedClient.visits} визита · {RUB.format(selectedClient.total)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSelectedClientKey(null)}
            className="flex size-9 items-center justify-center rounded-[13px] border border-white/[0.08] bg-white/[0.045] text-white/55"
          >
            <X className="size-4" />
          </button>
        </section>

        <div className="grid grid-cols-2 gap-2">
          <MiniButton
            variant={favorite ? 'accent' : 'secondary'}
            onClick={() =>
              setFavoriteKeys((current) =>
                favorite
                  ? current.filter((key) => key !== selectedClient.key)
                  : [...current, selectedClient.key],
              )
            }
          >
            <Star className="size-4" />
            {favorite ? 'VIP' : 'В VIP'}
          </MiniButton>
          <MiniButton>
            <Phone className="size-4" />
            Позвонить
          </MiniButton>
        </div>

        <MiniCard className="space-y-3 p-4">
          <MiniInput
            label="Заметка мастера"
            value={notes[selectedClient.key] ?? ''}
            onChange={(value) =>
              setNotes((current) => ({
                ...current,
                [selectedClient.key]: value,
              }))
            }
            placeholder="Предпочтения, нюансы, что важно помнить..."
            textarea
          />
        </MiniCard>

        <MiniCard className="overflow-hidden">
          <div className="border-b border-white/[0.08] p-4">
            <div className="text-[15px] font-semibold tracking-[-0.045em]">История</div>
            <div className="mt-1 text-[11px] text-white/38">записи клиента</div>
          </div>

          <div className="space-y-2 p-3">
            {selectedClient.bookings.slice().sort(sortBookings).map((booking) => (
              <button
                key={booking.id}
                type="button"
                onClick={() => onOpenBooking(booking)}
                className="flex w-full items-center gap-3 rounded-[17px] border border-white/[0.07] bg-white/[0.035] p-3 text-left"
              >
                <div className="w-16 text-[12px] font-semibold text-white/58">
                  {formatDayLabel(booking.date)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold tracking-[-0.04em]">
                    {booking.service}
                  </div>
                  <div className="mt-1 text-[11px] text-white/38">
                    {formatTime(booking.time)} · {RUB.format(getBookingAmount(booking))}
                  </div>
                </div>
                <StatusPill status={booking.status} />
              </button>
            ))}
          </div>
        </MiniCard>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <section>
        <MiniLabel>база</MiniLabel>
        <h1 className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.075em]">
          Клиенты
        </h1>
        <p className="mt-2 text-[12px] leading-5 text-white/42">
          Карточки клиентов, визиты, суммы и история.
        </p>
      </section>

      <div className="grid grid-cols-3 gap-2">
        <MiniCard className="p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/32">
            всего
          </div>
          <div className="mt-2 text-[22px] font-semibold tracking-[-0.07em]">
            {clients.length}
          </div>
        </MiniCard>
        <MiniCard className="p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/32">
            VIP
          </div>
          <div className="mt-2 text-[22px] font-semibold tracking-[-0.07em]">
            {favoriteKeys.length}
          </div>
        </MiniCard>
        <MiniCard className="p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/32">
            визиты
          </div>
          <div className="mt-2 text-[22px] font-semibold tracking-[-0.07em]">
            {bookings.length}
          </div>
        </MiniCard>
      </div>

      <MiniCard className="overflow-hidden">
        <div className="space-y-2 p-3">
          {clients.length > 0 ? (
            clients.map((client) => (
              <button
                key={client.key}
                type="button"
                onClick={() => setSelectedClientKey(client.key)}
                className="flex w-full items-center gap-3 rounded-[17px] border border-white/[0.07] bg-white/[0.035] p-3 text-left"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-[14px] border border-white/[0.08] bg-white/[0.055] text-[11px] font-bold">
                  {getInitials(client.name)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-[13px] font-semibold tracking-[-0.04em]">
                      {client.name}
                    </div>
                    {favoriteKeys.includes(client.key) ? (
                      <Star className="size-3 fill-[var(--mini-accent)] text-[var(--mini-accent)]" />
                    ) : null}
                  </div>
                  <div className="mt-1 truncate text-[11px] text-white/38">
                    {client.visits} визита · {RUB.format(client.total)} · {formatDayLabel(client.last)}
                  </div>
                </div>

                <ChevronRight className="size-4 text-white/25" />
              </button>
            ))
          ) : (
            <EmptyState
              title="Клиентов пока нет"
              text="Клиенты появятся после первых записей."
              icon={<Users2 className="size-5" />}
            />
          )}
        </div>
      </MiniCard>
    </div>
  );
}

function ProfileScreen({
  profile,
  onSave,
  getPublicPath,
}: {
  profile: MasterProfile | null;
  onSave: (values: MiniProfileSaveValues) => Promise<{ success: boolean; error?: string }>;
  getPublicPath: (slug: string) => string;
}) {
  const [tab, setTab] = useState<'base' | 'place' | 'portfolio' | 'reviews' | 'contacts'>('base');
  const [form, setForm] = useState<MiniProfileSaveValues>(() => profileToForm(profile));
  const [portfolioText, setPortfolioText] = useState(
    (profile?.workGallery ?? []).map((item) => `${item.title || 'Работа'} | ${item.image || ''}`).join('\n'),
  );
  const [reviewsText, setReviewsText] = useState(
    (profile?.reviews ?? []).map((item) => `${item.author}: ${item.text}`).join('\n'),
  );
  const [saving, setSaving] = useState(false);
  const [resultText, setResultText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setForm(profileToForm(profile));
    setPortfolioText(
      (profile?.workGallery ?? []).map((item) => `${item.title || 'Работа'} | ${item.image || ''}`).join('\n'),
    );
    setReviewsText((profile?.reviews ?? []).map((item) => `${item.author}: ${item.text}`).join('\n'));
  }, [profile]);

  const publicUrl =
    typeof window !== 'undefined' && profile?.slug
      ? `${window.location.origin}${getPublicPath(profile.slug)}`
      : '';

  const update = <K extends keyof MiniProfileSaveValues>(
    key: K,
    value: MiniProfileSaveValues[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  function parsePortfolio(): WorkGalleryItem[] {
    return portfolioText
      .split('\n')
      .map((line, index) => {
        const [title, image] = line.split('|').map((part) => part.trim());

        if (!title && !image) return null;

        return {
          id: `work-${index}`,
          title: title || `Работа ${index + 1}`,
          image: image || '',
        };
      })
      .filter((item): item is WorkGalleryItem => Boolean(item));
  }

  function parseReviews() {
    return reviewsText
      .split('\n')
      .map((line, index) => {
        const [author, ...rest] = line.split(':');
        const text = rest.join(':').trim();

        if (!author.trim() && !text) return null;

        return {
          id: `review-${index}`,
          author: author.trim() || 'Клиент',
          text: text || line.trim(),
          rating: 5,
        };
      })
      .filter(Boolean) as NonNullable<MasterProfile['reviews']>;
  }

  async function handleSave() {
    setSaving(true);
    setResultText('');

    const result = await onSave({
      ...form,
      workGallery: parsePortfolio(),
      reviews: parseReviews(),
      reviewCount: parseReviews().length || form.reviewCount,
    });

    setSaving(false);
    setResultText(
      result.success ? 'Профиль сохранён.' : result.error || 'Не удалось сохранить профиль.',
    );
  }

  async function copyLink() {
    if (!publicUrl) return;

    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {}
  }

  const tabs = [
    { id: 'base', label: 'Основа' },
    { id: 'place', label: 'Место' },
    { id: 'portfolio', label: 'Портфолио' },
    { id: 'reviews', label: 'Отзывы' },
    { id: 'contacts', label: 'Контакты' },
  ] as const;

  return (
    <div className="space-y-3">
      <section>
        <MiniLabel>публичная страница</MiniLabel>
        <h1 className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.075em]">
          Профиль
        </h1>
        <p className="mt-2 text-[12px] leading-5 text-white/42">
          Та же логика профиля, но компактно для телефона.
        </p>
      </section>

      {publicUrl ? (
        <MiniCard className="p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/32">
            ссылка
          </div>
          <div className="mt-2 truncate text-[18px] font-semibold tracking-[-0.06em]">
            {getPublicPath(profile?.slug || '')}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <MiniButton onClick={copyLink}>
              <Copy className="size-4" />
              {copied ? 'Скопировано' : 'Копировать'}
            </MiniButton>
            <Link
              href={publicUrl}
              className="flex h-10 items-center justify-center gap-2 rounded-[14px] border border-white/[0.08] bg-white/[0.055] text-[12px] font-semibold tracking-[-0.035em] text-white"
            >
              <ExternalLink className="size-4" />
              Открыть
            </Link>
          </div>
        </MiniCard>
      ) : null}

      <div className="-mx-3 overflow-x-auto px-3">
        <div className="flex gap-2 pb-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                'h-9 shrink-0 rounded-full border px-3 text-[12px] font-semibold tracking-[-0.035em]',
                tab === item.id
                  ? 'border-[var(--mini-accent)] bg-[var(--mini-accent-soft)] text-white'
                  : 'border-white/[0.08] bg-white/[0.045] text-white/45',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <MiniCard className="space-y-4 p-4">
        {tab === 'base' ? (
          <>
            <MiniInput label="Фото / аватар" value={form.avatar} onChange={(value) => update('avatar', value)} placeholder="URL изображения" />
            <MiniInput label="Имя" value={form.name} onChange={(value) => update('name', value)} />
            <MiniInput label="Специализация" value={form.profession} onChange={(value) => update('profession', value)} />
            <MiniInput label="Город" value={form.city} onChange={(value) => update('city', value)} />
            <MiniInput label="Описание" value={form.bio} onChange={(value) => update('bio', value)} textarea />
            <MiniInput label="Опыт" value={getString(form.experienceLabel)} onChange={(value) => update('experienceLabel', value)} placeholder="5 лет опыта" />
            <MiniInput label="Средний чек / цена" value={getString(form.priceHint)} onChange={(value) => update('priceHint', value)} placeholder="от 2500 ₽" />
          </>
        ) : null}

        {tab === 'place' ? (
          <>
            <MiniSelect
              label="Формат работы"
              value={getString(form.locationMode, 'online')}
              onChange={(value) => update('locationMode', value as MasterProfile['locationMode'])}
              options={[
                { value: 'online', label: 'Без адреса / онлайн' },
                { value: 'address', label: 'Показывать адрес' },
              ]}
            />
            <MiniInput label="Адрес" value={getString(form.address)} onChange={(value) => update('address', value)} placeholder="Город, улица, дом" />
            <MiniInput label="Ссылка на карту" value={getString(form.mapUrl)} onChange={(value) => update('mapUrl', value)} placeholder="https://..." />
          </>
        ) : null}

        {tab === 'portfolio' ? (
          <>
            <MiniInput
              label="Портфолио"
              value={portfolioText}
              onChange={setPortfolioText}
              placeholder={'Маникюр нюд | https://...\nРабота после коррекции | https://...'}
              textarea
            />
            <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.035] p-3 text-[12px] leading-5 text-white/42">
              Формат: название работы | ссылка на изображение.
            </div>
          </>
        ) : null}

        {tab === 'reviews' ? (
          <>
            <MiniInput
              label="Отзывы"
              value={reviewsText}
              onChange={setReviewsText}
              placeholder={'Анна: Очень аккуратная работа\nМария: Всё понравилось'}
              textarea
            />
            <div className="rounded-[16px] border border-white/[0.08] bg-white/[0.035] p-3 text-[12px] leading-5 text-white/42">
              Формат: имя клиента: текст отзыва.
            </div>
          </>
        ) : null}

        {tab === 'contacts' ? (
          <>
            <MiniInput label="Телефон" value={form.phone} onChange={(value) => update('phone', value)} />
            <MiniInput label="Telegram" value={form.telegram} onChange={(value) => update('telegram', value)} />
            <MiniInput label="WhatsApp / VK" value={form.whatsapp} onChange={(value) => update('whatsapp', value)} />
            <MiniInput label="Ссылка" value={form.slug} onChange={(value) => update('slug', value)} />
            <MiniInput label="Скорость ответа" value={getString(form.responseTime)} onChange={(value) => update('responseTime', value)} placeholder="обычно отвечаю за 15 минут" />
          </>
        ) : null}

        {resultText ? (
          <div className="rounded-[15px] border border-white/[0.08] bg-white/[0.035] p-3 text-[12px] text-white/58">
            {resultText}
          </div>
        ) : null}

        <MiniButton variant="accent" onClick={handleSave} disabled={saving}>
          {saving ? 'Сохраняем...' : 'Сохранить профиль'}
        </MiniButton>
      </MiniCard>
    </div>
  );
}

function ServicesScreen({
  profile,
  workspaceData,
  onSave,
  updateWorkspaceSection,
}: {
  profile: MasterProfile | null;
  workspaceData: Record<string, unknown>;
  onSave: (values: MiniProfileSaveValues) => Promise<{ success: boolean; error?: string }>;
  updateWorkspaceSection: <T>(section: string, value: T) => Promise<boolean>;
}) {
  const [items, setItems] = useState<ServiceItem[]>(() => parseServicesFromProfile(profile, workspaceData));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setItems(parseServicesFromProfile(profile, workspaceData));
  }, [profile, workspaceData]);

  function updateItem(id: string, patch: Partial<ServiceItem>) {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        id: `service-${Date.now()}`,
        name: '',
        price: '',
        duration: '60',
        category: 'Основное',
        status: 'active',
        visible: true,
      },
    ]);
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function handleSave() {
    setSaving(true);
    setMessage('');

    const cleaned = items.filter((item) => item.name.trim());
    const base = profileToForm(profile);

    const ok = await updateWorkspaceSection('serviceCatalog', cleaned);
    const result = await onSave({
      ...base,
      servicesText: serviceItemsToText(cleaned),
    });

    setSaving(false);
    setMessage(ok && result.success ? 'Услуги сохранены.' : result.error || 'Не удалось сохранить.');
  }

  return (
    <div className="space-y-3">
      <section>
        <MiniLabel>витрина</MiniLabel>
        <h1 className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.075em]">
          Услуги
        </h1>
        <p className="mt-2 text-[12px] leading-5 text-white/42">
          Услуги, цены, длительность и видимость для клиента.
        </p>
      </section>

      <MiniButton variant="accent" onClick={addItem}>
        <Plus className="size-4" />
        Добавить услугу
      </MiniButton>

      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item, index) => (
            <MiniCard key={item.id} className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-full border border-white/[0.08] text-[10px] font-semibold text-white/42">
                    {index + 1}
                  </span>
                  <div>
                    <div className="text-[14px] font-semibold tracking-[-0.045em]">
                      {item.name || 'Новая услуга'}
                    </div>
                    <div className="mt-0.5 text-[11px] text-white/35">
                      {item.visible ? 'видна клиентам' : 'скрыта'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="flex size-8 items-center justify-center rounded-[12px] border border-white/[0.08] bg-white/[0.035] text-white/45"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>

              <MiniInput label="Название" value={item.name} onChange={(value) => updateItem(item.id, { name: value })} />
              <div className="grid grid-cols-2 gap-3">
                <MiniInput label="Цена" value={item.price} onChange={(value) => updateItem(item.id, { price: value })} placeholder="2500" />
                <MiniInput label="Минут" value={item.duration} onChange={(value) => updateItem(item.id, { duration: value })} placeholder="60" />
              </div>
              <MiniInput label="Категория" value={item.category} onChange={(value) => updateItem(item.id, { category: value })} placeholder="Основное" />
              <MiniSelect
                label="Статус"
                value={item.status}
                onChange={(value) => updateItem(item.id, { status: value as ServiceItem['status'] })}
                options={[
                  { value: 'active', label: 'Активная' },
                  { value: 'seasonal', label: 'Сезонная' },
                  { value: 'draft', label: 'Черновик' },
                ]}
              />

              <button
                type="button"
                onClick={() => updateItem(item.id, { visible: !item.visible })}
                className={cn(
                  'flex h-10 items-center justify-center gap-2 rounded-[14px] border text-[12px] font-semibold',
                  item.visible
                    ? 'border-[var(--mini-accent)] bg-[var(--mini-accent-soft)] text-white'
                    : 'border-white/[0.08] bg-white/[0.035] text-white/45',
                )}
              >
                <Eye className="size-4" />
                {item.visible ? 'Показывать клиентам' : 'Скрыто'}
              </button>
            </MiniCard>
          ))
        ) : (
          <EmptyState
            title="Услуги не заполнены"
            text="Добавьте услуги, чтобы клиенты могли записываться."
            icon={<Scissors className="size-5" />}
          />
        )}
      </div>

      {message ? (
        <div className="rounded-[15px] border border-white/[0.08] bg-white/[0.035] p-3 text-[12px] text-white/58">
          {message}
        </div>
      ) : null}

      <MiniButton variant="accent" onClick={handleSave} disabled={saving}>
        {saving ? 'Сохраняем...' : 'Сохранить услуги'}
      </MiniButton>
    </div>
  );
}

function AnalyticsScreen({ bookings }: { bookings: Booking[] }) {
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => addDaysKey(index - 6)), []);

  const dayStats = useMemo(
    () =>
      days.map((day) => {
        const dayBookings = bookings.filter((booking) => booking.date === day);
        const revenue = dayBookings.reduce((sum, booking) => sum + getBookingAmount(booking), 0);

        return {
          day,
          count: dayBookings.length,
          revenue,
        };
      }),
    [bookings, days],
  );

  const statusStats = useMemo(() => {
    const result: Array<{ status: BookingStatus; count: number }> = [
      { status: 'new', count: 0 },
      { status: 'confirmed', count: 0 },
      { status: 'completed', count: 0 },
      { status: 'no_show', count: 0 },
      { status: 'cancelled', count: 0 },
    ];

    bookings.forEach((booking) => {
      const row = result.find((item) => item.status === booking.status);
      if (row) row.count += 1;
    });

    return result;
  }, [bookings]);

  const serviceStats = useMemo(() => {
    const map = new Map<string, { name: string; count: number; revenue: number }>();

    bookings.forEach((booking) => {
      const current = map.get(booking.service) ?? {
        name: booking.service,
        count: 0,
        revenue: 0,
      };

      current.count += 1;
      current.revenue += getBookingAmount(booking);
      map.set(booking.service, current);
    });

    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [bookings]);

  const totalBookings = bookings.length;
  const totalRevenue = bookings.reduce((sum, booking) => sum + getBookingAmount(booking), 0);
  const completed = bookings.filter((booking) => booking.status === 'completed').length;
  const noShow = bookings.filter((booking) => booking.status === 'no_show').length;
  const uniqueClients = new Set(bookings.map((booking) => booking.clientPhone || booking.clientName)).size;
  const showRate = totalBookings > 0 ? Math.round((completed / totalBookings) * 100) : 0;
  const maxCount = Math.max(1, ...dayStats.map((item) => item.count), ...statusStats.map((item) => item.count));

  return (
    <div className="space-y-3">
      <section>
        <MiniLabel>короткая аналитика</MiniLabel>
        <h1 className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.075em]">
          Аналитика
        </h1>
        <p className="mt-2 text-[12px] leading-5 text-white/42">
          Записи, деньги, явка, клиенты и популярные услуги.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-2">
        <MiniCard className="p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/32">
            записи
          </div>
          <div className="mt-2 text-[26px] font-semibold tracking-[-0.08em]">
            {totalBookings}
          </div>
          <div className="text-[10px] text-white/35">всего</div>
        </MiniCard>

        <MiniCard className="p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/32">
            доход
          </div>
          <div className="mt-2 text-[26px] font-semibold tracking-[-0.08em]">
            {RUB.format(totalRevenue)}
          </div>
          <div className="text-[10px] text-white/35">по записям</div>
        </MiniCard>

        <MiniCard className="p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/32">
            явка
          </div>
          <div className="mt-2 text-[26px] font-semibold tracking-[-0.08em]">
            {showRate}%
          </div>
          <div className="text-[10px] text-white/35">{completed} пришли</div>
        </MiniCard>

        <MiniCard className="p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/32">
            клиенты
          </div>
          <div className="mt-2 text-[26px] font-semibold tracking-[-0.08em]">
            {uniqueClients}
          </div>
          <div className="text-[10px] text-white/35">{noShow} неявки</div>
        </MiniCard>
      </div>

      <MiniCard className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[15px] font-semibold tracking-[-0.045em]">
              График недели
            </div>
            <div className="mt-1 text-[11px] text-white/38">записи по дням</div>
          </div>
          <BarChart3 className="size-5 text-white/35" />
        </div>

        <div className="mt-5 flex h-[150px] items-end gap-2">
          {dayStats.map((item) => {
            const height = Math.max(8, (item.count / maxCount) * 120);

            return (
              <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-[120px] w-full items-end rounded-full bg-white/[0.035] p-1">
                  <div
                    className="w-full rounded-full bg-[var(--mini-accent)]"
                    style={{ height }}
                  />
                </div>
                <div className="text-[9px] font-semibold uppercase text-white/35">
                  {new Date(`${item.day}T12:00:00`).toLocaleDateString('ru-RU', {
                    weekday: 'short',
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </MiniCard>

      <MiniCard className="p-4">
        <div className="text-[15px] font-semibold tracking-[-0.045em]">
          Воронка статусов
        </div>
        <div className="mt-4 space-y-3">
          {statusStats.map((item) => {
            const width = `${Math.max(4, (item.count / maxCount) * 100)}%`;
            const meta = STATUS_META[item.status];

            return (
              <div key={item.status}>
                <div className="mb-1 flex justify-between text-[11px] font-semibold text-white/45">
                  <span>{meta.label}</span>
                  <span>{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.045]">
                  <div
                    className="h-2 rounded-full bg-[var(--mini-accent)]"
                    style={{ width }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </MiniCard>

      <MiniCard className="p-4">
        <div className="text-[15px] font-semibold tracking-[-0.045em]">
          Популярные услуги
        </div>
        <div className="mt-3 space-y-2">
          {serviceStats.length > 0 ? (
            serviceStats.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center gap-3 rounded-[16px] border border-white/[0.07] bg-white/[0.035] p-3"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-white/[0.08] text-[10px] font-semibold text-white/42">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold tracking-[-0.04em]">
                    {item.name}
                  </div>
                  <div className="mt-1 text-[11px] text-white/38">
                    {item.count} записей · {RUB.format(item.revenue)}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="Нет данных"
              text="Аналитика появится после первых записей."
              icon={<BarChart3 className="size-5" />}
            />
          )}
        </div>
      </MiniCard>
    </div>
  );
}

function AppearanceScreen({
  workspaceData,
  updateWorkspaceSection,
}: {
  workspaceData: Record<string, unknown>;
  updateWorkspaceSection: <T>(section: string, value: T) => Promise<boolean>;
}) {
  const appearance = safeRecord(workspaceData.appearance);
  const currentAccent = getAccentFromWorkspace(workspaceData);

  const [accentId, setAccentId] = useState(currentAccent.id);
  const [density, setDensity] = useState(String(appearance.density || 'normal'));
  const [cardStyle, setCardStyle] = useState(String(appearance.cardStyle || 'soft'));
  const [message, setMessage] = useState('');

  useEffect(() => {
    setAccentId(currentAccent.id);
    setDensity(String(appearance.density || 'normal'));
    setCardStyle(String(appearance.cardStyle || 'soft'));
  }, [currentAccent.id, appearance.density, appearance.cardStyle]);

  async function save(next?: Partial<{ accentId: string; density: string; cardStyle: string }>) {
    const selectedAccent = next?.accentId ?? accentId;
    const selectedDensity = next?.density ?? density;
    const selectedCardStyle = next?.cardStyle ?? cardStyle;

    setMessage('');

    const ok = await updateWorkspaceSection('appearance', {
      ...appearance,
      accent: selectedAccent,
      accentTone: selectedAccent,
      publicAccent: selectedAccent,
      density: selectedDensity,
      cardStyle: selectedCardStyle,
    });

    setMessage(ok ? 'Внешний вид сохранён.' : 'Не удалось сохранить.');
  }

  return (
    <div className="space-y-3">
      <section>
        <MiniLabel>стиль</MiniLabel>
        <h1 className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.075em]">
          Внешний вид
        </h1>
        <p className="mt-2 text-[12px] leading-5 text-white/42">
          Адаптация тех же настроек внешнего вида под Mini App.
        </p>
      </section>

      <MiniCard className="space-y-4 p-4">
        <div>
          <div className="mb-2 text-[11px] font-semibold tracking-[-0.03em] text-white/58">
            Акцент
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ACCENT_OPTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setAccentId(item.id);
                  void save({ accentId: item.id });
                }}
                className={cn(
                  'flex h-12 items-center justify-between rounded-[16px] border px-3 text-[13px] font-semibold tracking-[-0.04em]',
                  accentId === item.id
                    ? 'border-white/20 bg-white text-black'
                    : 'border-white/[0.08] bg-white/[0.045] text-white/55',
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: item.value }}
                  />
                  {item.label}
                </span>
                {accentId === item.id ? <CheckCircle2 className="size-4" /> : null}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-[11px] font-semibold tracking-[-0.03em] text-white/58">
            Плотность
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'compact', label: 'Компактно' },
              { id: 'normal', label: 'Обычно' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setDensity(item.id);
                  void save({ density: item.id });
                }}
                className={cn(
                  'h-11 rounded-[15px] border text-[12px] font-semibold',
                  density === item.id
                    ? 'border-[var(--mini-accent)] bg-[var(--mini-accent-soft)] text-white'
                    : 'border-white/[0.08] bg-white/[0.045] text-white/45',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-[11px] font-semibold tracking-[-0.03em] text-white/58">
            Карточки
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'soft', label: 'Мягкие' },
              { id: 'glass', label: 'Glass' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setCardStyle(item.id);
                  void save({ cardStyle: item.id });
                }}
                className={cn(
                  'h-11 rounded-[15px] border text-[12px] font-semibold',
                  cardStyle === item.id
                    ? 'border-[var(--mini-accent)] bg-[var(--mini-accent-soft)] text-white'
                    : 'border-white/[0.08] bg-white/[0.045] text-white/45',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <MiniCard className="border-white/[0.06] bg-white/[0.035] p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[14px] font-semibold tracking-[-0.045em]">
                Превью
              </div>
              <div className="mt-1 text-[11px] text-white/38">
                Так будет выглядеть активный элемент.
              </div>
            </div>
            <div className="flex size-10 items-center justify-center rounded-[14px] bg-[var(--mini-accent)] text-black">
              <Sparkles className="size-4" />
            </div>
          </div>
        </MiniCard>

        {message ? (
          <div className="rounded-[15px] border border-white/[0.08] bg-white/[0.035] p-3 text-[12px] text-white/58">
            {message}
          </div>
        ) : null}
      </MiniCard>
    </div>
  );
}

function SettingsScreen({
  workspaceData,
  updateWorkspaceSection,
}: {
  workspaceData: Record<string, unknown>;
  updateWorkspaceSection: <T>(section: string, value: T) => Promise<boolean>;
}) {
  const stored = safeRecord(workspaceData.miniSettings);
  const [settings, setSettings] = useState({
    reminders: stored.reminders !== false,
    autoConfirm: Boolean(stored.autoConfirm),
    noShowControl: stored.noShowControl !== false,
    dailyDigest: stored.dailyDigest !== false,
  });

  async function update<K extends keyof typeof settings>(key: K, value: boolean) {
    const next = { ...settings, [key]: value };
    setSettings(next);
    await updateWorkspaceSection('miniSettings', next);
  }

  return (
    <div className="space-y-3">
      <section>
        <MiniLabel>управление</MiniLabel>
        <h1 className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.075em]">
          Настройки
        </h1>
        <p className="mt-2 text-[12px] leading-5 text-white/42">
          Уведомления и рабочий день.
        </p>
      </section>

      <MiniCard className="space-y-2 p-3">
        {[
          ['reminders', 'Напоминания клиентам', 'Отправлять клиенту напоминание перед записью.'],
          ['autoConfirm', 'Автоподтверждение', 'Помечать запись подтверждённой после ответа клиента.'],
          ['noShowControl', 'Контроль неявок', 'Подсвечивать клиентов с риском не прийти.'],
          ['dailyDigest', 'Итоги дня', 'Показывать короткий итог по записям и деньгам.'],
        ].map(([key, label, description]) => {
          const typedKey = key as keyof typeof settings;
          const checked = settings[typedKey];

          return (
            <button
              key={key}
              type="button"
              onClick={() => void update(typedKey, !checked)}
              className="flex w-full items-center justify-between gap-4 rounded-[18px] border border-white/[0.08] bg-white/[0.035] p-3 text-left"
            >
              <span>
                <span className="block text-[13px] font-semibold tracking-[-0.04em] text-white">
                  {label}
                </span>
                <span className="mt-1 block text-[11px] leading-4 text-white/42">
                  {description}
                </span>
              </span>

              <span
                className={cn(
                  'relative h-7 w-12 shrink-0 rounded-full border transition',
                  checked
                    ? 'border-[var(--mini-accent)] bg-[var(--mini-accent)] text-black'
                    : 'border-white/[0.08] bg-white/[0.055]',
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 size-5 rounded-full transition',
                    checked ? 'left-6 bg-black' : 'left-1 bg-white/35',
                  )}
                />
              </span>
            </button>
          );
        })}
      </MiniCard>
    </div>
  );
}

function MoreScreen({ setScreen }: { setScreen: (screen: MiniScreen) => void }) {
  const rows: Array<{
    id: MiniScreen | 'desktop';
    label: string;
    description: string;
    icon: ReactNode;
  }> = [
    { id: 'profile', label: 'Профиль', description: 'страница мастера', icon: <UserRound className="size-4" /> },
    { id: 'services', label: 'Услуги', description: 'витрина и цены', icon: <Scissors className="size-4" /> },
    { id: 'clients', label: 'Клиенты', description: 'база и история', icon: <Users2 className="size-4" /> },
    { id: 'analytics', label: 'Аналитика', description: 'записи и доход', icon: <BarChart3 className="size-4" /> },
    { id: 'appearance', label: 'Внешний вид', description: 'тема и акцент', icon: <Palette className="size-4" /> },
    { id: 'settings', label: 'Настройки', description: 'уведомления', icon: <Settings className="size-4" /> },
    { id: 'desktop', label: 'Веб-кабинет', description: 'полная версия', icon: <LayoutDashboard className="size-4" /> },
  ];

  return (
    <div className="space-y-3">
      <section>
        <MiniLabel>меню</MiniLabel>
        <h1 className="mt-1 text-[30px] font-semibold leading-none tracking-[-0.075em]">
          Ещё
        </h1>
        <p className="mt-2 text-[12px] leading-5 text-white/42">
          Дополнительные разделы.
        </p>
      </section>

      <MiniCard className="p-2">
        <div className="space-y-1">
          {rows.map((row, index) => (
            <button
              key={row.id}
              type="button"
              onClick={() => {
                if (row.id === 'desktop') {
                  window.location.href = '/dashboard';
                  return;
                }

                setScreen(row.id);
              }}
              className="group flex w-full items-center gap-3 rounded-[17px] px-2.5 py-3 text-left text-white/58 transition hover:bg-white/[0.045] hover:text-white active:scale-[0.99]"
            >
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-white/[0.08] text-[10px] font-semibold text-white/36 group-hover:border-white/[0.14] group-hover:text-white/70">
                {index + 1}
              </span>

              <span className="flex size-9 shrink-0 items-center justify-center rounded-[13px] border border-white/[0.07] bg-white/[0.035] text-white/42 group-hover:text-white/78">
                {row.icon}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold tracking-[-0.045em]">
                  {row.label}
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-white/32">
                  {row.description}
                </span>
              </span>

              <ChevronRight className="size-4 shrink-0 text-white/24" />
            </button>
          ))}
        </div>
      </MiniCard>
    </div>
  );
}

function BookingSheet({
  booking,
  onClose,
  onStatus,
}: {
  booking: Booking | null;
  onClose: () => void;
  onStatus: (bookingId: string, status: BookingStatus) => Promise<void>;
}) {
  const [updating, setUpdating] = useState<BookingStatus | null>(null);

  if (!booking) return null;

  async function update(status: BookingStatus) {
    if (!booking) return;

    setUpdating(status);
    await onStatus(booking.id, status);
    setUpdating(null);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-black/55 px-3 pb-[calc(var(--tg-safe-bottom,0px)+10px)] backdrop-blur-[8px]">
      <div className="mx-auto w-full max-w-[430px] overflow-hidden rounded-[26px] border border-white/[0.10] bg-[#141414] shadow-[0_28px_90px_rgba(0,0,0,0.72)]">
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] p-4">
          <div>
            <MiniLabel>запись</MiniLabel>
            <div className="mt-2 text-[26px] font-semibold leading-none tracking-[-0.075em]">
              {booking.clientName}
            </div>
            <div className="mt-2 text-[12px] text-white/42">
              {formatDayLabel(booking.date)}, {formatTime(booking.time)}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-[13px] border border-white/[0.08] bg-white/[0.045] text-white/55"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <div className="rounded-[18px] border border-white/[0.08] bg-white/[0.035] p-3">
            <div className="text-[11px] text-white/35">Услуга</div>
            <div className="mt-1 text-[15px] font-semibold tracking-[-0.045em]">
              {booking.service}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <MiniButton variant="accent" disabled={Boolean(updating)} onClick={() => void update('completed')}>
              <CheckCircle2 className="size-4" />
              Пришла
            </MiniButton>
            <MiniButton variant="secondary" disabled={Boolean(updating)} onClick={() => void update('confirmed')}>
              <ShieldCheck className="size-4" />
              Подтвердить
            </MiniButton>
            <MiniButton variant="secondary" disabled={Boolean(updating)} onClick={() => void update('new')}>
              <Bell className="size-4" />
              Новая
            </MiniButton>
            <MiniButton variant="danger" disabled={Boolean(updating)} onClick={() => void update('no_show')}>
              <XCircle className="size-4" />
              Не пришла
            </MiniButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MiniAppEntry() {
  const {
    hasHydrated,
    ownedProfile,
    bookings,
    workspaceData,
    saveProfile,
    updateBookingStatus,
    updateWorkspaceSection,
    refreshWorkspace,
    getPublicPath,
  } = useApp();

  const [screen, setScreen] = useState<MiniScreen>('today');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bootState, setBootState] = useState<'loading' | 'ready'>('loading');
  const bootedRef = useRef(false);

  const workspaceRecord = safeRecord(workspaceData);
  const accent = getAccentFromWorkspace(workspaceRecord);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    let cancelled = false;

    async function boot() {
      try {
        await authorizeTelegramMiniAppSession({
          force: true,
          waitMs: 2600,
        });
      } catch {
        // Если Telegram initData недоступна, всё равно пробуем загрузить workspace по cookie/header.
      }

      await refreshWorkspace();

      if (!cancelled) {
        setBootState('ready');
      }
    }

    void boot();

    return () => {
      cancelled = true;
    };
  }, [refreshWorkspace]);

  if (!hasHydrated || bootState === 'loading') {
    return <MiniLoading />;
  }

  if (!ownedProfile) {
    return <MiniOnboarding onSave={saveProfile} />;
  }

  return (
    <>
      <MiniShell
        screen={screen}
        setScreen={setScreen}
        profile={ownedProfile}
        onRefresh={() => void refreshWorkspace()}
        accent={accent}
      >
        {screen === 'today' ? (
          <TodayScreen bookings={bookings} onOpenBooking={setSelectedBooking} />
        ) : null}

        {screen === 'availability' ? (
          <AvailabilityScreen
            workspaceData={workspaceRecord}
            updateWorkspaceSection={updateWorkspaceSection}
          />
        ) : null}

        {screen === 'chats' ? <ChatsScreen /> : null}

        {screen === 'clients' ? (
          <ClientsScreen bookings={bookings} onOpenBooking={setSelectedBooking} />
        ) : null}

        {screen === 'profile' ? (
          <ProfileScreen
            profile={ownedProfile}
            onSave={saveProfile}
            getPublicPath={getPublicPath}
          />
        ) : null}

        {screen === 'services' ? (
          <ServicesScreen
            profile={ownedProfile}
            workspaceData={workspaceRecord}
            onSave={saveProfile}
            updateWorkspaceSection={updateWorkspaceSection}
          />
        ) : null}

        {screen === 'analytics' ? <AnalyticsScreen bookings={bookings} /> : null}

        {screen === 'appearance' ? (
          <AppearanceScreen
            workspaceData={workspaceRecord}
            updateWorkspaceSection={updateWorkspaceSection}
          />
        ) : null}

        {screen === 'settings' ? (
          <SettingsScreen
            workspaceData={workspaceRecord}
            updateWorkspaceSection={updateWorkspaceSection}
          />
        ) : null}

        {screen === 'more' ? <MoreScreen setScreen={setScreen} /> : null}
      </MiniShell>

      <BookingSheet
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onStatus={updateBookingStatus}
      />
    </>
  );
}