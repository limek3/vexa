'use client';

import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CreditCard,
  Home,
  Menu,
  Moon,
  Search,
  Settings,
  Sparkles,
  Star,
  Sun,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useId, useMemo, type ReactNode } from 'react';

import { useOwnedWorkspaceData } from '@/hooks/use-owned-workspace-data';
import type { Booking, MasterProfile } from '@/lib/types';
import type { WorkspaceDataset } from '@/lib/master-workspace';
import { cn, getInitials } from '@/lib/utils';

import styles from './premium-overview.module.css';

type AppointmentTone = 'coral' | 'sage' | 'lavender' | 'peach' | 'navy';

type AppointmentItem = {
  id: string;
  time: string;
  name: string;
  service: string;
  price: number;
  avatar?: string;
  tone: AppointmentTone;
};

type PipelineStage = {
  title: string;
  count: number;
  tone: 'peach' | 'cream' | 'sage' | 'lavender' | 'sky';
  items: Array<{
    name: string;
    role: string;
    date?: string;
    time: string;
    avatar?: string;
  }>;
  extra: string;
};

type DashboardModel = {
  ownerName: string;
  ownerRole: string;
  ownerAvatar?: string;
  currentDay: number;
  currentWeekday: string;
  currentMonth: string;
  todayAppointmentsCount: number;
  todayRevenue: number;
  salonClientsNow: number;
  waitingCount: number;
  averageCheck: number;
  weeklyRevenue: number;
  newClients: number;
  schedule: AppointmentItem[];
  pipeline: PipelineStage[];
  revenueSeries: number[];
  growthSeries: number[];
  darkSeries: number[];
  heatmap: number[][];
  team: Array<{
    name: string;
    role: string;
    progress: number;
    revenue: number;
    avatar?: string;
  }>;
  messages: Array<{
    name: string;
    text: string;
    time: string;
    avatar?: string;
  }>;
  review: {
    name: string;
    text: string;
    meta: string;
    rating: number;
    avatar?: string;
  };
};

const russianFormatter = new Intl.NumberFormat('ru-RU');

const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const ASSETS = {
  aiSparkle: '/assets/clickbook/decor/ai-sparkle.webp',
  highfive: '/assets/clickbook/decor/highfive.webp',
  plant: '/assets/clickbook/decor/plant.webp',
  avatars: {
    topUser: '/assets/clickbook/avatars/avatar_top_user_round.webp',
    maria: '/assets/clickbook/avatars/avatar_hero_maria_round.webp',
    ekaterina: '/assets/clickbook/avatars/avatar_hero_ekaterina_round.webp',
    anna: '/assets/clickbook/avatars/avatar_hero_anna_round.webp',
    dmitry: '/assets/clickbook/avatars/avatar_hero_dmitry_round.webp',
    olga: '/assets/clickbook/avatars/avatar_hero_olga_round.webp',
    igor: '/assets/clickbook/avatars/avatar_pipeline_igor_round.webp',
    natalia: '/assets/clickbook/avatars/avatar_pipeline_natalia_round.webp',
    svetlana: '/assets/clickbook/avatars/avatar_pipeline_svetlana_round.webp',
    anton: '/assets/clickbook/avatars/avatar_pipeline_anton_round.webp',
    pavel: '/assets/clickbook/avatars/avatar_pipeline_pavel_round.webp',
  },
};

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Обзор', active: true },
  { href: '/dashboard/today', label: 'Записи' },
  { href: '/dashboard/clients', label: 'Клиенты' },
  { href: '/dashboard/services', label: 'Услуги' },
  { href: '/dashboard/finance', label: 'Финансы' },
  { href: '/dashboard/stats', label: 'Аналитика' },
  { href: '/dashboard/profile', label: 'Настройки' },
];

const FALLBACK_APPOINTMENTS: AppointmentItem[] = [
  {
    id: 'fallback-1',
    time: '09:30',
    name: 'Мария Иванова',
    service: 'Маникюр + гель-лак',
    price: 3600,
    avatar: ASSETS.avatars.maria,
    tone: 'coral',
  },
  {
    id: 'fallback-2',
    time: '11:00',
    name: 'Екатерина Смирнова',
    service: 'Окрашивание волос',
    price: 6200,
    avatar: ASSETS.avatars.ekaterina,
    tone: 'sage',
  },
  {
    id: 'fallback-3',
    time: '12:30',
    name: 'Анна Кузнецова',
    service: 'Стрижка + укладка',
    price: 2800,
    avatar: ASSETS.avatars.anna,
    tone: 'lavender',
  },
  {
    id: 'fallback-4',
    time: '14:00',
    name: 'Дмитрий Соколов',
    service: 'Массаж спины',
    price: 4200,
    avatar: ASSETS.avatars.dmitry,
    tone: 'navy',
  },
  {
    id: 'fallback-5',
    time: '15:30',
    name: 'Ольга Лебедева',
    service: 'Педикюр',
    price: 3100,
    avatar: ASSETS.avatars.olga,
    tone: 'peach',
  },
];

function compactRub(value: number) {
  return `${russianFormatter.format(Math.round(Number.isFinite(value) ? value : 0))} ₽`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getFirstName(name: string | null | undefined) {
  const firstName = String(name ?? '').trim().split(/\s+/)[0];
  return firstName || 'Алина';
}

function localIsoDate(date: Date) {
  const value = new Date(date);
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
  return value.toISOString().slice(0, 10);
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(date).replace('.', '');
}

function formatWeekday(date: Date) {
  return new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(date).replace('.', '');
}

function sortBookingsByDateTime(items: Booking[]) {
  return [...items].sort((left, right) => {
    const leftValue = `${left.date}T${left.time || '00:00'}`;
    const rightValue = `${right.date}T${right.time || '00:00'}`;
    return leftValue.localeCompare(rightValue);
  });
}

function toneByIndex(index: number): AppointmentTone {
  return ['coral', 'sage', 'lavender', 'navy', 'peach'][index % 5] as AppointmentTone;
}

function activeBooking(booking: Booking) {
  return booking.status !== 'cancelled' && booking.status !== 'no_show';
}

function completedBooking(booking: Booking) {
  return booking.status === 'completed';
}

function appointmentFromBooking(booking: Booking, index: number): AppointmentItem {
  return {
    id: booking.id,
    time: booking.time || '—',
    name: booking.clientName || 'Клиент',
    service: booking.service || 'Услуга',
    price: booking.priceAmount ?? 0,
    tone: toneByIndex(index),
  };
}

function makeRevenueSeries(dataset: WorkspaceDataset | null, bookings: Booking[]) {
  const fromDataset = dataset?.daily?.slice(-7).map((item) => item.revenue).filter((item) => item > 0) ?? [];
  if (fromDataset.length >= 3) return fromDataset;

  const bookingRevenue = bookings
    .filter(activeBooking)
    .slice(-7)
    .map((booking) => booking.priceAmount ?? 0)
    .filter((value) => value > 0);

  if (bookingRevenue.length >= 3) return bookingRevenue;
  return [28000, 35600, 34200, 48100, 70600, 52900, 57200, 46200, 43800, 58500, 54100];
}

function buildHeatmap(seed: number) {
  return Array.from({ length: 6 }, (_, rowIndex) =>
    Array.from({ length: 8 }, (_, columnIndex) => {
      const centerBoost = 82 - Math.abs(columnIndex - 4) * 13 - Math.abs(rowIndex - 2) * 9;
      const wave = ((rowIndex + 2) * (columnIndex + 5) + seed) % 24;
      return clamp(centerBoost + wave, 10, 100);
    }),
  );
}

function buildPipeline(schedule: AppointmentItem[], bookings: Booking[]): PipelineStage[] {
  const source = schedule.length >= 5 ? schedule : FALLBACK_APPOINTMENTS;
  const statusCount = (status: Booking['status'], fallback: number) => {
    const count = bookings.filter((booking) => booking.status === status).length;
    return count || fallback;
  };

  return [
    {
      title: 'Новые',
      count: statusCount('new', 8),
      tone: 'peach',
      items: [
        { name: 'Наталья Орлова', role: 'Стрижка', date: '20.05', time: '10:00', avatar: ASSETS.avatars.natalia },
        { name: 'Игорь Петров', role: 'Массаж', date: '20.05', time: '11:30', avatar: ASSETS.avatars.igor },
      ],
      extra: '+ Ещё 6 записей',
    },
    {
      title: 'Подтверждены',
      count: statusCount('confirmed', 12),
      tone: 'cream',
      items: [
        { name: 'Светлана Миронова', role: 'Маникюр', date: '19.05', time: '16:00', avatar: ASSETS.avatars.svetlana },
        { name: 'Антон Лазарев', role: 'Стрижка', date: '19.05', time: '17:30', avatar: ASSETS.avatars.anton },
      ],
      extra: '+ Ещё 10 записей',
    },
    {
      title: 'Сегодня',
      count: schedule.length || 8,
      tone: 'sage',
      items: source.slice(3, 5).map((item) => ({
        name: item.name,
        role: item.service,
        time: item.time,
        avatar: item.avatar,
      })),
      extra: '+ Ещё 6 записей',
    },
    {
      title: 'В работе',
      count: 3,
      tone: 'lavender',
      items: source.slice(0, 2).map((item) => ({
        name: item.name,
        role: item.service,
        time: item.time,
        avatar: item.avatar,
      })),
      extra: '+ Ещё 1 запись',
    },
    {
      title: 'Завершены',
      count: statusCount('completed', 5),
      tone: 'sky',
      items: [
        { name: 'Анна Кузнецова', role: 'Стрижка', time: '12:30', avatar: ASSETS.avatars.anna },
        { name: 'Павел Котов', role: 'Бритьё', time: '13:15', avatar: ASSETS.avatars.pavel },
      ],
      extra: '+ Ещё 3 записи',
    },
  ];
}

function buildDashboardModel(
  profile: MasterProfile | null,
  bookings: Booking[],
  dataset: WorkspaceDataset | null,
): DashboardModel {
  const now = new Date();
  const todayIso = localIsoDate(now);
  const sortedBookings = sortBookingsByDateTime(bookings.filter(activeBooking));
  const todayBookings = sortedBookings.filter((booking) => booking.date === todayIso);
  const sourceBookings = todayBookings.length > 0 ? todayBookings : sortedBookings.slice(0, 5);
  const schedule = sourceBookings.map(appointmentFromBooking).slice(0, 5);
  const padded =
    schedule.length >= 5
      ? schedule
      : [...schedule, ...FALLBACK_APPOINTMENTS.filter((item) => !schedule.some((existing) => existing.time === item.time))].slice(0, 5);
  const displaySchedule = padded.length > 0 ? padded : FALLBACK_APPOINTMENTS;
  const todayRevenue = todayBookings.reduce((sum, booking) => sum + (booking.priceAmount ?? 0), 0);
  const completedRevenue = bookings.filter(completedBooking).reduce((sum, booking) => sum + (booking.priceAmount ?? 0), 0);
  const totalRevenue = dataset?.totals.revenue || completedRevenue || 286400;
  const revenueSeries = makeRevenueSeries(dataset, bookings);
  const averageCheck = dataset?.totals.averageCheck || Math.round(totalRevenue / Math.max(1, dataset?.totals.completed || 87)) || 3280;

  return {
    ownerName: getFirstName(profile?.name),
    ownerRole: profile?.profession || 'Владелец',
    ownerAvatar: profile?.avatar || ASSETS.avatars.topUser,
    currentDay: now.getDate(),
    currentWeekday: formatWeekday(now),
    currentMonth: formatMonth(now),
    todayAppointmentsCount: todayBookings.length || displaySchedule.length + 3,
    todayRevenue: todayRevenue || 42800,
    salonClientsNow: Math.max(3, Math.min(9, todayBookings.length || 3)),
    waitingCount: Math.max(1, bookings.filter((booking) => booking.status === 'new').length || 1),
    averageCheck,
    weeklyRevenue: totalRevenue,
    newClients: dataset?.totals.newClients || 14,
    schedule: displaySchedule,
    pipeline: buildPipeline(displaySchedule, bookings),
    revenueSeries,
    growthSeries: [18, 16, 24, 15, 19, 28, 23, 30, 39, 28, 22, 27],
    darkSeries: [18, 28, 22, 14, 16, 13, 22, 25, 19, 18, 20, 27, 25, 31, 42],
    heatmap: buildHeatmap(bookings.length || 8),
    team: [
      {
        name: 'Мария',
        role: 'Стилист',
        progress: 128,
        revenue: 72300,
        avatar: displaySchedule[0]?.avatar || ASSETS.avatars.maria,
      },
      {
        name: 'Ольга',
        role: 'Мастер маникюра',
        progress: 96,
        revenue: 54800,
        avatar: displaySchedule[4]?.avatar || ASSETS.avatars.olga,
      },
      {
        name: 'Игорь',
        role: 'Массажист',
        progress: 87,
        revenue: 41600,
        avatar: ASSETS.avatars.igor,
      },
    ],
    messages: [
      {
        name: 'Екатерина Смирнова',
        text: 'Здравствуйте! Можно перенести запись на завтра на 12:00?',
        time: '16:42',
        avatar: displaySchedule[1]?.avatar || ASSETS.avatars.ekaterina,
      },
      {
        name: 'Наталья Орлова',
        text: 'Спасибо за стрижку! Всё супер! 🌸',
        time: '15:10',
        avatar: ASSETS.avatars.natalia,
      },
    ],
    review: {
      name: 'Анна Кузнецова',
      text: 'Всегда выхожу отсюда довольной! Атмосфера, мастера, результат — всё на высоте.',
      meta: '18 мая 2025 · Стрижка + укладка',
      rating: 4.9,
      avatar: displaySchedule[2]?.avatar || ASSETS.avatars.anna,
    },
  };
}

function Avatar({ name, src, size = 'md', className }: { name: string; src?: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClass = size === 'lg' ? 'size-14' : size === 'sm' ? 'size-8' : 'size-11';

  return (
    <div
      className={cn(
        'relative shrink-0 overflow-hidden rounded-full border border-[#eadfd5] bg-[#fff6ef] text-[#071b3a]',
        sizeClass,
        className,
      )}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold">
          {getInitials(name) || 'КБ'}
        </div>
      )}
    </div>
  );
}

function PremiumCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        'rounded-[26px] border border-[#eadfd5]/80 bg-white/[0.92] shadow-[0_18px_55px_rgba(24,17,12,0.055)] backdrop-blur',
        className,
      )}
    >
      {children}
    </section>
  );
}

function BrandLogo() {
  return (
    <Link href="/dashboard" className="group flex items-center gap-1 pl-1 text-[36px] leading-none tracking-[-0.055em]">
      <span className="font-serif font-semibold text-[#071b3a]">Клик</span>
      <span className="font-serif font-semibold text-[#ff644e]">Бук</span>
      <Sparkles className="mb-5 ml-1 size-4 text-[#ff8b73] transition-transform group-hover:rotate-12" />
    </Link>
  );
}

function TopNavigation({ model }: { model: DashboardModel }) {
  return (
    <header className="relative z-40 border-b border-[#eee6de] bg-white/[0.94] backdrop-blur-xl">
      <div className={cn(styles.navShell, 'flex items-center gap-5')}>
        <div className="w-[260px] shrink-0 max-xl:w-auto">
          <BrandLogo />
        </div>

        <nav className="hidden flex-1 items-center justify-center gap-8 xl:flex 2xl:gap-10">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative text-[13px] font-medium text-[#6f7480] transition-colors hover:text-[#071b3a]',
                item.active && 'text-[#071b3a]',
              )}
            >
              {item.label}
              {item.active ? (
                <span className="absolute -bottom-4 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-[#ff644e]" />
              ) : null}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <div className="flex h-[42px] w-[430px] items-center gap-3 rounded-[16px] border border-[#eadfd5] bg-white px-4 shadow-[0_12px_30px_rgba(24,17,12,0.035)] max-2xl:w-[340px]">
            <Search className="size-5 text-[#8c8c95]" />
            <span className="flex-1 truncate text-[14px] text-[#8c8c95]">Поиск по клиентам и записям</span>
            <span className="rounded-[9px] bg-[#f7f2ed] px-2 py-1 text-[11px] font-semibold text-[#8c8c95]">⌘K</span>
          </div>

          <button className="flex h-10 items-center gap-3 rounded-[16px] border border-[#eadfd5] bg-white px-4 text-[13px] font-medium text-[#556070] shadow-[0_12px_30px_rgba(24,17,12,0.035)]">
            <CalendarDays className="size-4 text-[#8c8c95]" />
            <span>19 — 25 мая</span>
            <ChevronDown className="size-4 text-[#8c8c95]" />
          </button>

          <button className="relative flex size-10 items-center justify-center rounded-full border border-[#eadfd5] bg-white text-[#556070] shadow-[0_12px_30px_rgba(24,17,12,0.035)]">
            <Bell className="size-5" />
            <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-[#ff644e] text-[10px] font-bold text-white">3</span>
          </button>

          <button className="flex items-center gap-3 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-[#fff6ef]">
            <Avatar name={model.ownerName} src={model.ownerAvatar} size="md" />
            <span className="hidden text-left 2xl:block">
              <span className="block text-[13px] font-semibold text-[#071b3a]">{model.ownerName}</span>
              <span className="block text-[11px] text-[#8c8c95]">{model.ownerRole}</span>
            </span>
            <ChevronDown className="hidden size-4 text-[#8c8c95] 2xl:block" />
          </button>
        </div>

        <button className="ml-auto flex size-11 items-center justify-center rounded-full border border-[#eadfd5] bg-white text-[#071b3a] lg:hidden">
          <Menu className="size-5" />
        </button>
      </div>
    </header>
  );
}

function Sparkline({ values, height = 58, stroke = '#4fa3dc', className }: { values: number[]; height?: number; stroke?: string; className?: string }) {
  const gradientId = `spark-${useId().replace(/:/g, '')}`;
  const width = 320;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = values.map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * width;
    const y = height - ((value - min) / Math.max(1, max - min)) * (height - 10) - 5;
    return [x, y] as const;
  });
  const d = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const area = `${d} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className={cn('h-full w-full overflow-visible', className)} aria-hidden="true">
      <path d={area} fill={`url(#${gradientId})`} opacity="0.24" />
      <path d={d} fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.7" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function RevenueCurve({ values }: { values: number[] }) {
  const gradientId = `revenue-${useId().replace(/:/g, '')}`;
  const width = 620;
  const height = 160;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = values.map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * width;
    const y = height - ((value - min) / Math.max(1, max - min)) * 108 - 26;
    return [x, y] as const;
  });
  const d = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const plan = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${(y + 24 + Math.sin(index) * 8).toFixed(1)}`).join(' ');
  const marker = points[Math.max(0, points.length - 4)] ?? [width * 0.65, 70];

  return (
    <div className="relative h-[190px] min-w-0 flex-1">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        <path d={`${d} L ${width} ${height} L 0 ${height} Z`} fill={`url(#${gradientId})`} />
        <path d={plan} fill="none" stroke="#a984f6" strokeDasharray="7 6" strokeLinecap="round" strokeWidth="2" opacity="0.58" />
        <path d={d} fill="none" stroke="#071b3a" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
        <circle cx={marker[0]} cy={marker[1]} r="5" fill="white" stroke="#071b3a" strokeWidth="2" />
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#a984f6" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#a984f6" stopOpacity="0.04" />
          </linearGradient>
        </defs>
      </svg>
      <div
        className="absolute rounded-[14px] border border-[#eadfd5] bg-white px-3 py-2 text-center shadow-[0_14px_35px_rgba(24,17,12,0.12)]"
        style={{ left: `${clamp((marker[0] / width) * 100 - 5, 55, 76)}%`, top: `${clamp((marker[1] / height) * 100 - 24, 6, 58)}%` }}
      >
        <div className="text-[11px] text-[#8c8c95]">23.05</div>
        <div className="text-[13px] font-bold text-[#071b3a]">57 200 ₽</div>
      </div>
    </div>
  );
}

function MetricLine({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="min-w-0 flex-1 border-l border-white/10 pl-7 first:border-l-0 first:pl-0">
      <div className="flex items-center gap-2 text-[12px] text-[#b9c6d8]">
        <span className="flex size-5 items-center justify-center rounded-[6px] border border-white/16 text-[#75d7a3]">
          <Icon className="size-3.5" />
        </span>
        {label}
      </div>
      <div className="mt-2 text-[25px] font-semibold tracking-[-0.04em] text-white 2xl:text-[30px]">{value}</div>
    </div>
  );
}

function DarkSalonCard({ model }: { model: DashboardModel }) {
  return (
    <section className="relative min-h-[218px] overflow-hidden rounded-[24px] bg-[#071b3a] p-7 text-white shadow-[0_24px_60px_rgba(7,27,58,0.28)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_14%,rgba(97,171,217,0.26),transparent_32%),linear-gradient(135deg,rgba(7,27,58,0.98),rgba(2,17,38,1))]" />
      <div className="relative">
        <div className="text-[16px] font-semibold">Сейчас в салоне</div>
        <div className="mt-1 flex items-center gap-2 text-[13px] text-[#a6d2a3]">
          <span className="size-2 rounded-full bg-[#76d174]" />
          {model.salonClientsNow} клиента
        </div>

        <div className="mt-5 flex gap-6 max-md:flex-col max-md:gap-5 2xl:mt-6 2xl:gap-9">
          <MetricLine label="Выручка сейчас" value={compactRub(18450)} icon={CreditCard} />
          <MetricLine label="Средний чек" value={compactRub(model.averageCheck)} icon={Check} />
          <MetricLine label="Ожидают" value={String(model.waitingCount)} icon={Users} />
        </div>

        <div className="mt-5 h-[58px]">
          <Sparkline values={model.darkSeries} stroke="#4aa6e8" />
        </div>
      </div>
    </section>
  );
}

function TodayRevenueCard({ model }: { model: DashboardModel }) {
  return (
    <div className={cn(styles.todayRevenue, 'absolute left-0 rounded-r-[66px] bg-[#071b3a] p-6 text-white shadow-[0_20px_50px_rgba(7,27,58,0.25)] max-lg:relative max-lg:bottom-auto max-lg:left-auto max-lg:mt-6 max-lg:w-full max-lg:rounded-[24px]')}>
      <div className="text-[13px] text-[#cbd5e1]">Выручка сегодня</div>
      <div className="mt-2 text-[28px] font-semibold tracking-[-0.05em] 2xl:text-[34px]">{compactRub(model.todayRevenue)}</div>
      <div className="mt-1 flex items-center gap-2 text-[13px]">
        <span className="text-[#cbd5e1]">к вчерашнему дню</span>
        <span className="inline-flex items-center gap-1 font-semibold text-[#a8e49d]">
          <ArrowUpRight className="size-4" /> 18%
        </span>
      </div>
      <Link
        href="/dashboard/finance"
        className="mt-5 inline-flex h-10 items-center gap-5 rounded-[13px] border border-white/18 bg-white/10 px-5 text-[13px] font-semibold text-white transition-colors hover:bg-white/16"
      >
        Перейти к кассе
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

function CircleRhythm({ model }: { model: DashboardModel }) {
  const arcs = [
    { offset: 60, length: 88, color: '#ff7d6b', width: 10, radius: 88 },
    { offset: 165, length: 78, color: '#78906a', width: 9, radius: 88 },
    { offset: 292, length: 72, color: '#b69de9', width: 10, radius: 112 },
    { offset: 78, length: 28, color: '#ffd9c7', width: 6, radius: 116 },
    { offset: 150, length: 22, color: '#071b3a', width: 7, radius: 116 },
  ];

  return (
    <div className={cn(styles.circleRhythm, 'relative mx-auto flex items-center justify-center max-md:size-[280px]')}>
      <div className="absolute inset-0 rounded-full border border-dashed border-[#f0cdb8] opacity-75" />
      <div className="absolute inset-[28px] rounded-full border border-dotted border-[#ecd7c7]" />
      <Sun className="absolute left-6 top-11 size-8 text-[#e8c7a8]" />
      <Moon className="absolute bottom-9 left-1/2 size-8 -translate-x-1/2 text-[#e6d4c0]" />
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#071b3a]">18:00</span>
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[12px] font-bold text-[#071b3a]">12:00</span>
      <span className="absolute left-1/2 top-16 -translate-x-1/2 text-[12px] font-bold text-[#071b3a]">09:00</span>
      <span className="absolute bottom-16 left-1/2 -translate-x-1/2 text-[12px] font-bold text-[#071b3a]">15:00</span>

      <svg className="absolute inset-[58px] size-[266px] max-md:inset-[42px] max-md:size-[196px]" viewBox="0 0 260 260" aria-hidden="true">
        <circle cx="130" cy="130" r="88" fill="none" stroke="#f3ece4" strokeWidth="18" />
        <circle cx="130" cy="130" r="112" fill="none" stroke="#f3ece4" strokeWidth="14" opacity="0.68" />
        {arcs.map((arc) => (
          <circle
            key={`${arc.color}-${arc.offset}`}
            cx="130"
            cy="130"
            r={arc.radius}
            fill="none"
            stroke={arc.color}
            strokeLinecap="butt"
            strokeWidth={arc.width}
            strokeDasharray={`${arc.length} 999`}
            transform={`rotate(${arc.offset} 130 130)`}
          />
        ))}
        <circle cx="130" cy="130" r="60" fill="#f4eadf" />
      </svg>

      <div className="relative z-10 text-center text-[#071b3a]">
        <div className="text-[15px] font-medium">{model.currentWeekday}</div>
        <div className="font-serif text-[66px] leading-none tracking-[-0.07em]">{model.currentDay}</div>
        <div className="text-[15px] font-medium">{model.currentMonth}</div>
      </div>
    </div>
  );
}

function AppointmentList({ appointments }: { appointments: AppointmentItem[] }) {
  const toneClass: Record<AppointmentTone, string> = {
    coral: 'bg-[#ff644e]',
    sage: 'bg-[#7aa269]',
    lavender: 'bg-[#be68eb]',
    peach: 'bg-[#e4a76f]',
    navy: 'bg-[#071b3a]',
  };

  return (
    <div className={cn(styles.appointmentsColumn, 'w-full shrink-0 space-y-4 pt-2 max-xl:w-full')}>
      {appointments.map((appointment, index) => {
        const active = index === 3;
        return (
          <div
            key={appointment.id}
            className={cn(
              'flex items-center gap-4 rounded-[22px] border border-transparent p-2.5 pr-4 transition-colors',
              active && 'border-[#8c8c95]/70 bg-white shadow-[0_16px_35px_rgba(24,17,12,0.08)]',
            )}
          >
            <Avatar name={appointment.name} src={appointment.avatar} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold text-[#071b3a] 2xl:text-[15px]">{appointment.time}</div>
              <div className="truncate text-[12px] font-semibold text-[#071b3a] 2xl:text-[14px]">{appointment.name}</div>
              <div className="truncate text-[11px] text-[#556070] 2xl:text-[13px]">{appointment.service}</div>
            </div>
            <span className={cn('size-2.5 rounded-full', toneClass[appointment.tone])} />
          </div>
        );
      })}

      <button className="mx-auto flex items-center gap-2 text-[13px] font-medium text-[#556070]">
        и ещё 3 записи
        <ChevronDown className="size-4" />
      </button>
    </div>
  );
}

function HeroOverview({ model }: { model: DashboardModel }) {
  return (
    <PremiumCard className={cn(styles.heroCard, 'relative overflow-hidden max-lg:p-6')}>
      <div className="pointer-events-none absolute -left-16 -top-24 h-[420px] w-[190px] rounded-full border border-[#efd1bd] opacity-60" />
      <div className="pointer-events-none absolute right-10 top-8 h-[470px] w-[470px] rounded-full bg-[radial-gradient(circle,rgba(255,246,239,0.95),transparent_70%)]" />

      <div className={cn(styles.heroInner, 'relative grid items-start max-xl:grid-cols-1')}>
        <div className="pt-2 max-xl:max-w-[480px]">
          <div className="mb-5 inline-flex items-center gap-4 text-[#ff644e]">
            <span className="flex size-14 items-center justify-center rounded-full bg-[#fff0e9]">
              <Sun className="size-8" />
            </span>
            <span className="text-[23px] font-medium">Сегодня</span>
          </div>

          <h1 className="max-w-[330px] font-serif text-[62px] leading-[0.94] tracking-[-0.065em] text-[#071b3a] max-md:text-[42px]">
            Добрый вечер, {model.ownerName}.
          </h1>
          <p className="mt-6 max-w-[300px] text-[17px] leading-7 text-[#556070]">
            Сегодня у вас {model.todayAppointmentsCount} записей и хороший темп по выручке.
          </p>
        </div>

        <div className="flex items-center justify-center pt-5">
          <CircleRhythm model={model} />
        </div>

        <AppointmentList appointments={model.schedule} />
      </div>

      <TodayRevenueCard model={model} />
    </PremiumCard>
  );
}

function AiInsightCard() {
  return (
    <section className="relative min-h-[186px] overflow-hidden rounded-[24px] border border-[#e6ecd5] bg-[#f5faec] p-7 shadow-[0_16px_45px_rgba(60,84,43,0.07)]">
      <div className="absolute -right-24 -top-20 size-64 rounded-full border border-[#b8c899] opacity-70" />

      <img
        src={ASSETS.aiSparkle}
        alt=""
        className="pointer-events-none absolute right-10 top-8 w-[112px] select-none 2xl:right-12"
      />

      <div className="relative max-w-[540px]">
        <div className="flex items-center gap-3 text-[13px] text-[#556070]">
          <span>КликБук AI</span>
          <span className="rounded-full bg-[#eee4ff] px-2.5 py-1 text-[11px] font-bold text-[#8b5cf6]">New</span>
        </div>
        <h2 className="mt-4 max-w-[460px] font-serif text-[27px] leading-[1.05] tracking-[-0.04em] text-[#071b3a] 2xl:mt-5 2xl:text-[30px]">
          Похоже, спрос на окрашивание растёт по пятницам ↗
        </h2>
        <p className="mt-4 max-w-[500px] text-[13px] leading-5 text-[#556070] 2xl:mt-5 2xl:text-[15px] 2xl:leading-6">
          Рекомендуем добавить 1 мастера в пятницу — это может увеличить выручку на ~12%.
        </p>
      </div>
    </section>
  );
}

function GrowthCard({ model }: { model: DashboardModel }) {
  return (
    <PremiumCard className="min-h-[148px] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[15px] font-bold text-[#071b3a]">Рост клиентов</div>
          <div className="mt-1 text-[12px] text-[#8c8c95]">Новые клиенты за неделю</div>
          <div className="mt-3 flex items-end gap-4 2xl:mt-4">
            <span className="text-[34px] font-semibold tracking-[-0.06em] text-[#071b3a] 2xl:text-[38px]">{model.newClients}</span>
            <span className="mb-2 flex items-center gap-1 text-[13px] font-semibold text-[#3a9a45]">
              <ArrowUpRight className="size-4" /> 27% <span className="font-normal text-[#556070]">к прошлой неделе</span>
            </span>
          </div>
        </div>
        <div className="h-[76px] w-[230px] min-w-0 2xl:h-[88px] 2xl:w-[260px]">
          <Sparkline values={model.growthSeries} stroke="#a984f6" />
        </div>
      </div>
      <div className="mt-2 flex justify-end gap-9 text-[11px] text-[#8c8c95]">
        {DAYS_SHORT.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </PremiumCard>
  );
}

function PipelineCard({ stage, index }: { stage: PipelineStage; index: number }) {
  const styleByTone: Record<PipelineStage['tone'], string> = {
    peach: 'border-[#f2d0c3] bg-[#fff5ef] from-[#ffd5c7]',
    cream: 'border-[#ecdcae] bg-[#fffaf0] from-[#ffedbb]',
    sage: 'border-[#a8cf99] bg-[#f8fff3] from-[#d8efc5]',
    lavender: 'border-[#d9c8f6] bg-[#fcfaff] from-[#e9dcff]',
    sky: 'border-[#c8dbef] bg-[#f8fbff] from-[#d9ecff]',
  };

  return (
    <div className="relative min-w-[220px] flex-1 xl:min-w-0 2xl:min-w-[260px]">
      {index > 0 ? (
        <div className="absolute -left-10 top-12 hidden w-8 items-center justify-center text-[#8c8c95] 2xl:flex">⟶</div>
      ) : null}
      <div className={cn('overflow-hidden rounded-[20px] border shadow-[0_14px_35px_rgba(24,17,12,0.035)]', styleByTone[stage.tone])}>
        <div className={cn('flex items-center justify-between bg-gradient-to-r to-transparent px-4 py-3 text-[13px] font-bold text-[#071b3a]', styleByTone[stage.tone])}>
          <span>{stage.title}</span>
          <span>{stage.count}</span>
        </div>
        <div className="space-y-3 px-4 py-3">
          {stage.items.map((item) => (
            <div key={`${stage.title}-${item.name}`} className="flex items-center gap-3">
              <Avatar name={item.name} src={item.avatar} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-bold text-[#071b3a]">{item.name}</div>
                <div className="truncate text-[11px] text-[#556070]">{item.role}</div>
              </div>
              <div className="text-right text-[12px] text-[#556070]">
                {item.date ? <div>{item.date}</div> : null}
                <div>{item.time}</div>
              </div>
            </div>
          ))}
          <div className="pt-1 text-[12px] font-medium text-[#8c8c95]">{stage.extra}</div>
        </div>
      </div>
    </div>
  );
}

function BookingPipeline({ model }: { model: DashboardModel }) {
  return (
    <PremiumCard className="p-5 2xl:p-6">
      <h2 className="mb-4 text-[15px] font-bold text-[#071b3a] 2xl:mb-5">Конвейер записей</h2>
      <div className="grid grid-cols-5 gap-4 overflow-x-auto pb-1 max-xl:flex 2xl:gap-6">
        {model.pipeline.map((stage, index) => (
          <PipelineCard key={stage.title} stage={stage} index={index} />
        ))}
      </div>
    </PremiumCard>
  );
}

function WeeklyRevenue({ model }: { model: DashboardModel }) {
  return (
    <PremiumCard className="flex min-h-[222px] gap-6 p-6 max-lg:flex-col 2xl:min-h-[242px] 2xl:gap-7 2xl:p-7">
      <div className="w-[210px] shrink-0">
        <div className="text-[15px] font-bold text-[#071b3a]">Выручка за неделю</div>
        <div className="mt-3 text-[34px] font-semibold tracking-[-0.055em] text-[#071b3a]">{compactRub(model.weeklyRevenue)}</div>
        <div className="mt-2 flex items-center gap-2 text-[13px] text-[#556070]">
          <span className="font-semibold text-[#3a9a45]">↗ 23%</span> к прошлой неделе
        </div>
        <div className="mt-6 space-y-2 text-[12px] text-[#556070]">
          <div className="flex items-center gap-2"><span className="h-0.5 w-5 rounded bg-[#071b3a]" />Факт</div>
          <div className="flex items-center gap-2"><span className="h-0.5 w-5 rounded border-t border-dashed border-[#a984f6]" />План</div>
          <div className="flex items-center gap-2"><span className="size-3 rounded bg-[#eee4ff]" />Прошлая неделя</div>
        </div>
      </div>
      <RevenueCurve values={model.revenueSeries} />
    </PremiumCard>
  );
}

function HeatmapCard({ model }: { model: DashboardModel }) {
  return (
    <PremiumCard className="min-h-[222px] p-6 2xl:min-h-[242px] 2xl:p-7">
      <div className="text-[15px] font-bold text-[#071b3a]">Загрузка по дням</div>
      <div className="mt-5 grid grid-cols-[24px_1fr] gap-2 text-[11px] text-[#556070]">
        <div className="space-y-2.5">
          {DAYS_SHORT.slice(0, 6).map((day) => (
            <div key={day} className="h-5">{day}</div>
          ))}
        </div>
        <div className="space-y-1.5">
          {model.heatmap.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-8 gap-1.5">
              {row.map((value, columnIndex) => (
                <span
                  key={`${rowIndex}-${columnIndex}`}
                  className="h-5 rounded-[4px]"
                  style={{ backgroundColor: `color-mix(in srgb, #8b5cf6 ${value}%, #f0e8ff)` }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-8 gap-1.5 pl-8 text-center text-[10px] text-[#8c8c95]">
        {['9', '11', '13', '15', '17', '19', '21', ''].map((hour) => <span key={hour}>{hour}</span>)}
      </div>
      <div className="mt-5 flex items-center justify-end gap-3 text-[11px] text-[#556070]">
        <span>Низкая</span>
        <div className="flex gap-1">
          {[18, 34, 50, 66, 82, 98].map((value) => (
            <span key={value} className="h-3 w-8 rounded" style={{ backgroundColor: `color-mix(in srgb, #8b5cf6 ${value}%, #f0e8ff)` }} />
          ))}
        </div>
        <span>Высокая</span>
      </div>
    </PremiumCard>
  );
}

function GoalCard() {
  return (
    <section className="relative min-h-[222px] overflow-hidden rounded-[26px] border border-[#f2d8c7] bg-[#fff1e8] p-6 shadow-[0_18px_55px_rgba(24,17,12,0.055)] 2xl:min-h-[242px] 2xl:p-7">
      <img
        src={ASSETS.plant}
        alt=""
        className="pointer-events-none absolute bottom-0 right-8 hidden w-[190px] select-none xl:block"
      />

      <div className="relative flex items-center gap-8 max-sm:flex-col max-sm:items-start">
        <div className="relative flex size-32 shrink-0 items-center justify-center">
          <svg viewBox="0 0 140 140" className="absolute inset-0 rotate-[140deg]" aria-hidden="true">
            <circle cx="70" cy="70" r="54" fill="none" stroke="#f6d7c4" strokeWidth="11" strokeLinecap="round" strokeDasharray="240 999" />
            <circle cx="70" cy="70" r="54" fill="none" stroke="#ff644e" strokeWidth="11" strokeLinecap="round" strokeDasharray="164 999" />
          </svg>
          <div className="text-center">
            <div className="text-[36px] font-semibold tracking-[-0.06em] text-[#071b3a]">68%</div>
            <div className="text-[11px] text-[#8c8c95]">204 800 ₽ / 300 000 ₽</div>
            <div className="mt-1 text-[11px] text-[#556070]">Осталось 11 дней</div>
          </div>
        </div>
        <div className="max-w-[220px]">
          <div className="text-[15px] font-bold text-[#071b3a]">Цель месяца</div>
          <div className="mt-5 text-[13px] text-[#556070]">Сделайте ещё</div>
          <div className="text-[23px] font-semibold tracking-[-0.045em] text-[#071b3a]">95 200 ₽</div>
          <div className="text-[12px] text-[#556070]">чтобы достичь цели</div>
          <Link href="/dashboard/stats" className="mt-5 inline-flex h-10 items-center gap-4 rounded-[14px] bg-white/70 px-5 text-[13px] font-bold text-[#071b3a]">
            Смотреть план <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function MessagesCard({ model }: { model: DashboardModel }) {
  return (
    <PremiumCard className="p-6">
      <div className="flex items-center gap-3">
        <h2 className="text-[15px] font-bold text-[#071b3a]">Сообщения</h2>
        <span className="flex size-5 items-center justify-center rounded-full bg-[#ff644e] text-[11px] font-bold text-white">2</span>
      </div>
      <div className="mt-5 space-y-4">
        {model.messages.map((message) => (
          <div key={message.name} className="flex items-center gap-3">
            <Avatar name={message.name} src={message.avatar} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-[12px] font-bold text-[#071b3a]">{message.name}</span>
                <span className="text-[10px] text-[#8c8c95]">{message.time}</span>
              </div>
              <p className="line-clamp-2 text-[12px] leading-4 text-[#556070]">{message.text}</p>
            </div>
            <span className="size-2 rounded-full bg-[#8b5cf6]" />
          </div>
        ))}
      </div>
      <Link href="/dashboard/chats" className="mt-5 flex items-center justify-between border-t border-[#eee6de] pt-4 text-[13px] font-semibold text-[#556070]">
        Перейти в переписку <ArrowRight className="size-4" />
      </Link>
    </PremiumCard>
  );
}

function ReviewCard({ model }: { model: DashboardModel }) {
  return (
    <PremiumCard className="relative overflow-hidden p-8">
      <div className="absolute left-10 top-2 font-serif text-[96px] leading-none text-[#f1d7c8]">“</div>
      <div className="relative z-10 grid grid-cols-[1fr_auto] items-end gap-6 max-sm:grid-cols-1">
        <div className="pl-20 max-sm:pl-0">
          <p className="max-w-[470px] font-serif text-[25px] italic leading-9 tracking-[-0.035em] text-[#071b3a]">{model.review.text}</p>
          <div className="mt-7 flex items-center gap-3">
            <Avatar name={model.review.name} src={model.review.avatar} size="md" />
            <div>
              <div className="text-[13px] font-bold text-[#071b3a]">{model.review.name}</div>
              <div className="text-[11px] text-[#8c8c95]">{model.review.meta}</div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[34px] font-semibold tracking-[-0.06em] text-[#071b3a]">{model.review.rating.toFixed(1)}</div>
          <div className="mt-2 flex gap-1 text-[#ff644e]">
            {Array.from({ length: 5 }, (_, index) => <Star key={index} className="size-5 fill-current" />)}
          </div>
        </div>
      </div>
      <div className="mx-auto mt-7 flex w-fit gap-3">
        <span className="size-2 rounded-full bg-[#ff644e]" />
        <span className="size-2 rounded-full bg-[#d9cec4]" />
        <span className="size-2 rounded-full bg-[#d9cec4]" />
      </div>
    </PremiumCard>
  );
}

function TeamCard({ model }: { model: DashboardModel }) {
  return (
    <PremiumCard className="grid grid-cols-[1fr_170px] gap-6 p-7 max-sm:grid-cols-1">
      <div>
        <div className="text-[15px] font-bold text-[#071b3a]">Команда в тонусе</div>
        <div className="mt-5 space-y-4">
          {model.team.map((member) => (
            <div key={member.name} className="grid grid-cols-[150px_1fr_82px] items-center gap-4 max-md:grid-cols-[1fr]">
              <div className="flex items-center gap-3">
                <Avatar name={member.name} src={member.avatar} size="md" />
                <div>
                  <div className="text-[13px] font-bold text-[#071b3a]">{member.name}</div>
                  <div className="text-[11px] text-[#556070]">{member.role}</div>
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#eee6de]">
                <div className="h-full rounded-full bg-[#ff644e]" style={{ width: `${clamp(member.progress, 0, 130) / 1.3}%` }} />
              </div>
              <div className="text-right text-[12px] font-semibold text-[#556070] max-md:text-left">{member.progress}%</div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center rounded-full bg-[#ffe6d9] p-4 text-center">
        <img src={ASSETS.highfive} alt="" className="w-[118px] select-none" />
        <div className="mt-3 text-[13px] font-bold text-[#071b3a]">Так держать!</div>
        <div className="mt-1 text-[12px] text-[#556070]">Команда на 103% к плану недели</div>
      </div>
    </PremiumCard>
  );
}

function BottomMobileNav() {
  return (
    <nav className="fixed inset-x-4 bottom-4 z-40 grid grid-cols-5 rounded-[24px] border border-[#eadfd5] bg-white/[0.92] p-2 shadow-[0_18px_55px_rgba(24,17,12,0.16)] backdrop-blur lg:hidden">
      {[
        { label: 'Обзор', icon: Home, active: true },
        { label: 'Записи', icon: CalendarDays },
        { label: 'Клиенты', icon: Users },
        { label: 'Аналитика', icon: BarChart3 },
        { label: 'Ещё', icon: Settings },
      ].map((item) => (
        <button key={item.label} className={cn('flex flex-col items-center gap-1 rounded-[18px] py-2 text-[10px] font-semibold', item.active ? 'bg-[#fff0e9] text-[#ff644e]' : 'text-[#8c8c95]')}>
          <item.icon className="size-4" />
          {item.label}
        </button>
      ))}
    </nav>
  );
}

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 z-20 flex items-start justify-center bg-[#fbf8f4]/70 pt-24 backdrop-blur-sm">
      <div className="rounded-full border border-[#eadfd5] bg-white px-4 py-2 text-[13px] font-semibold text-[#556070] shadow-[0_16px_40px_rgba(24,17,12,0.08)]">
        Загружаем данные салона…
      </div>
    </div>
  );
}

export function PremiumDashboardOverview() {
  const { dataset, bookings, ownedProfile, hasHydrated } = useOwnedWorkspaceData();
  const model = useMemo(() => buildDashboardModel(ownedProfile, bookings, dataset), [ownedProfile, bookings, dataset]);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#fbf8f4] text-[#071b3a]">
      <TopNavigation model={model} />
      <main className={cn(styles.mainShell, 'relative w-full pb-24')}>
        {!hasHydrated ? <LoadingOverlay /> : null}
        <div className={cn(styles.topGrid, 'grid max-xl:grid-cols-1')}>
          <HeroOverview model={model} />
          <div className={cn(styles.rightColumn, 'space-y-4')}>
            <DarkSalonCard model={model} />
            <AiInsightCard />
            <GrowthCard model={model} />
          </div>
        </div>

        <div className="mt-4 space-y-4 2xl:space-y-5">
          <BookingPipeline model={model} />

          <div className="grid grid-cols-[1.18fr_0.55fr_1fr] gap-4 max-xl:grid-cols-1 2xl:gap-5">
            <WeeklyRevenue model={model} />
            <HeatmapCard model={model} />
            <GoalCard />
          </div>

          <div className="grid grid-cols-[0.68fr_1.02fr_1.02fr] gap-4 max-xl:grid-cols-1 2xl:gap-5">
            <MessagesCard model={model} />
            <ReviewCard model={model} />
            <TeamCard model={model} />
          </div>
        </div>
      </main>
      <BottomMobileNav />
    </div>
  );
}
