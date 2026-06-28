// app/dashboard/stats/page.tsx
'use client';

import Link from 'next/link';
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTheme } from 'next-themes';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CalendarClock,
  Globe2,
  LayoutDashboard,
  PiggyBank,
  SquarePen,
  TrendingUp,
  Users2,
} from 'lucide-react';

import { WorkspaceShell } from '@/components/shared/workspace-shell';
import { Button } from '@/components/ui/button';
import { NumberPopIn } from '@/components/ui/number-pop-in';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useMobile } from '@/hooks/use-mobile';
import { useOwnedWorkspaceData } from '@/hooks/use-owned-workspace-data';
import { useAppearance } from '@/lib/appearance-context';
import { accentPalette } from '@/lib/appearance-palette';
import { formatCurrency } from '@/lib/master-workspace';
import type { Booking } from '@/lib/types';
import { cn } from '@/lib/utils';

type ThemeMode = 'light' | 'dark';
type MetricView = 'revenue' | 'bookings' | 'visitors' | 'conversion';

function pageBg(light: boolean) {
  return light ? 'bg-[#f7f6f2]' : 'bg-[#080808]';
}

function pageText(light: boolean) {
  return light ? 'text-[#111111]' : 'text-[#f8f7f4]';
}

function mutedText(light: boolean) {
  return light ? 'text-[#6b7280]' : 'text-[#9ca3af]';
}

function faintText(light: boolean) {
  return light ? 'text-black/32' : 'text-white/26';
}

function borderTone(light: boolean) {
  return light ? 'border-[#e6e2da]' : 'border-white/[0.08]';
}

function divideTone(light: boolean) {
  return light ? 'divide-[#e6e2da]' : 'divide-white/[0.08]';
}

function cardTone(light: boolean) {
  return light
    ? 'border-[#e6e2da] bg-white shadow-[0_12px_30px_rgba(17,17,17,0.035),0_1px_2px_rgba(17,17,17,0.035)]'
    : 'border-white/[0.08] bg-[#141414] shadow-none';
}

function insetTone(light: boolean) {
  return light
    ? 'border-black/[0.075] bg-black/[0.018] shadow-[0_8px_22px_rgba(17,17,17,0.025),inset_0_1px_0_rgba(255,255,255,0.74)]'
    : 'border-white/[0.07] bg-white/[0.026] shadow-[inset_0_1px_0_rgba(255,255,255,0.024)]';
}

function buttonBase(light: boolean, active = false) {
  return cn(
    'inline-flex h-8 items-center justify-center gap-2 rounded-[9px] border px-3 text-[12px] font-medium shadow-none transition-[background,border-color,color,opacity,transform] duration-150 active:scale-[0.985]',
    active
      ? light
        ? 'cb-neutral-primary cb-neutral-primary-light hover:opacity-[0.98]'
        : 'cb-neutral-primary cb-neutral-primary-dark hover:opacity-[0.98]'
      : light
        ? 'border-black/[0.08] bg-white text-black/58 hover:border-black/[0.14] hover:bg-black/[0.035] hover:text-black'
        : 'border-white/[0.08] bg-white/[0.04] text-white/55 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white',
  );
}

function accentPillStyle(
  color: string,
  light: boolean,
  strength: 'soft' | 'strong' = 'strong',
): CSSProperties {
  const bgAmount = strength === 'strong' ? (light ? 18 : 34) : light ? 10 : 22;
  const borderAmount = strength === 'strong' ? (light ? 34 : 48) : light ? 22 : 34;

  return {
    background: light
      ? `color-mix(in srgb, ${color} ${bgAmount}%, #ffffff)`
      : `color-mix(in srgb, ${color} ${bgAmount}%, #141414)`,
    borderColor: light
      ? `color-mix(in srgb, ${color} ${borderAmount}%, rgba(0,0,0,0.1))`
      : `color-mix(in srgb, ${color} ${borderAmount}%, rgba(255,255,255,0.1))`,
    color: light
      ? `color-mix(in srgb, ${color} 70%, #101010)`
      : `color-mix(in srgb, ${color} 18%, #ffffff)`,
    boxShadow:
      strength === 'strong'
        ? light
          ? `0 0 0 1px color-mix(in srgb, ${color} 10%, transparent)`
          : `0 0 0 1px color-mix(in srgb, ${color} 14%, transparent)`
        : undefined,
  };
}

function chartGridStroke(light: boolean) {
  return light ? 'rgba(0,0,0,0.065)' : 'rgba(255,255,255,0.065)';
}

function getRecentBookings(bookings: Booking[]) {
  return [...bookings].sort((left, right) => {
    const a = new Date(`${left.date}T${left.time}:00`).getTime();
    const b = new Date(`${right.date}T${right.time}:00`).getTime();

    return b - a;
  });
}

function PageAction({
  href,
  children,
  light,
  active,
}: {
  href: string;
  children: ReactNode;
  light: boolean;
  active?: boolean;
}) {
  return (
    <Button asChild className={buttonBase(light, active)}>
      <Link href={href}>{children}</Link>
    </Button>
  );
}

function Card({
  children,
  light,
  className,
}: {
  children: ReactNode;
  light: boolean;
  className?: string;
}) {
  return (
    <section className={cn('rounded-[11px] border', cardTone(light), className)}>
      {children}
    </section>
  );
}

function CardTitle({
  title,
  description,
  light,
}: {
  title: string;
  description?: string;
  light: boolean;
}) {
  return (
    <div
      className={cn(
        'flex min-h-[58px] items-center justify-between gap-4 border-b px-4 py-3',
        borderTone(light),
      )}
    >
      <div className="min-w-0">
        <h2
          className={cn(
            'truncate text-[13px] font-semibold tracking-[-0.018em]',
            pageText(light),
          )}
        >
          {title}
        </h2>

        {description ? (
          <p className={cn('mt-1 truncate text-[11px]', mutedText(light))}>
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Panel({
  children,
  light,
  className,
}: {
  children: ReactNode;
  light: boolean;
  className?: string;
}) {
  return (
    <div className={cn('rounded-[10px] border', insetTone(light), className)}>
      {children}
    </div>
  );
}

function MicroLabel({
  children,
  light,
  active,
  accentColor,
  className,
}: {
  children: ReactNode;
  light: boolean;
  active?: boolean;
  accentColor?: string;
  className?: string;
}) {
  return (
    <span
      style={active && accentColor ? accentPillStyle(accentColor, light, 'soft') : undefined}
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-[9px] border px-2.5 text-[10.5px] font-medium',
        active && !accentColor
          ? light
            ? 'border-black/[0.1] bg-black/[0.045] text-black/62'
            : 'border-white/[0.11] bg-white/[0.075] text-white/68'
          : !active
            ? light
              ? 'border-black/[0.08] bg-white text-black/50'
              : 'border-white/[0.08] bg-white/[0.04] text-white/42'
            : '',
        className,
      )}
    >
      {children}
    </span>
  );
}

function StatusDot({
  light,
  active,
  accentColor,
}: {
  light: boolean;
  active?: boolean;
  accentColor?: string;
}) {
  return (
    <span
      style={active && accentColor ? { background: accentColor } : undefined}
      className={cn(
        'size-1.5 shrink-0 rounded-full',
        !(active && accentColor) &&
          (active ? 'bg-current' : light ? 'bg-black/24' : 'bg-white/22'),
      )}
    />
  );
}

function StatTile({
  label,
  value,
  hint,
  icon,
  light,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  light: boolean;
}) {
  return (
    <div className="min-w-0 p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={cn('text-[11px] font-medium', mutedText(light))}>
            {label}
          </div>

          <div
            className={cn(
              'mt-1.5 truncate text-[20px] font-semibold tracking-[-0.02em]',
              pageText(light),
            )}
          >
            <NumberPopIn value={value} />
          </div>

          <div className={cn('mt-1 truncate text-[11px]', faintText(light))}>
            {hint}
          </div>
        </div>

        <div
          className={cn(
            'inline-flex size-8 shrink-0 items-center justify-center rounded-[9px] border',
            light
              ? 'border-black/[0.07] bg-black/[0.025] text-black/38'
              : 'border-white/[0.07] bg-white/[0.035] text-white/38',
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function HeroStat({
  label,
  value,
  hint,
  light,
}: {
  label: string;
  value: string | number;
  hint?: string;
  light: boolean;
}) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-[10px] border px-3.5 py-3 transition-colors duration-150',
        light
          ? 'border-black/[0.07] bg-white hover:bg-black/[0.018]'
          : 'border-white/[0.07] bg-white/[0.035] hover:bg-white/[0.055]',
      )}
    >
      <div className="grid min-h-[34px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <div className={cn('truncate text-[10.5px] font-medium', mutedText(light))}>
            {label}
          </div>

          {hint ? (
            <div className={cn('mt-0.5 truncate text-[10px]', faintText(light))}>
              {hint}
            </div>
          ) : null}
        </div>

        <div
          className={cn(
            'min-w-[54px] max-w-[150px] truncate text-right text-[18px] font-semibold leading-none tracking-[-0.055em] tabular-nums',
            pageText(light),
          )}
        >
          <NumberPopIn value={value} />
        </div>
      </div>
    </div>
  );
}

function ListBox({
  children,
  light,
  className,
}: {
  children: ReactNode;
  light: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[10px] border divide-y',
        insetTone(light),
        divideTone(light),
        className,
      )}
    >
      {children}
    </div>
  );
}

function ListRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn('px-4 py-3.5', className)}>{children}</div>;
}

function ControlGroup({
  children,
  light,
  className,
}: {
  children: ReactNode;
  light: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex max-w-full shrink-0 items-center overflow-hidden rounded-[12px] border p-0',
        light
          ? 'border-black/[0.08] bg-white'
          : 'border-white/[0.08] bg-white/[0.045]',
        className,
      )}
    >
      {children}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  light,
  accentColor,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  light: boolean;
  accentColor: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative inline-flex h-10 min-w-[72px] shrink-0 items-center justify-center border-r px-4 text-[11px] font-semibold tracking-[-0.015em] transition-colors duration-150 last:border-r-0 active:scale-[0.985]',
        light ? 'border-black/[0.07]' : 'border-white/[0.07]',
        active
          ? light
            ? 'text-black'
            : 'text-white'
          : light
            ? 'text-black/40 hover:text-black/70'
            : 'text-white/36 hover:text-white/70',
      )}
    >
      <span className="relative z-10">{label}</span>

      <span
        style={active ? { background: accentColor } : undefined}
        className={cn(
          'absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full transition-all duration-200',
          active
            ? 'opacity-100'
            : light
              ? 'bg-black/0 opacity-0 group-hover:bg-black/18 group-hover:opacity-100'
              : 'bg-white/0 opacity-0 group-hover:bg-white/18 group-hover:opacity-100',
        )}
      />
    </button>
  );
}

function bookingStatusLabel(status: string, locale: 'ru' | 'en') {
  if (locale === 'ru') {
    if (status === 'new') return 'Запланирована';
    if (status === 'confirmed') return 'Запланирована';
    if (status === 'completed') return 'Пришёл';
    if (status === 'no_show') return 'Не пришёл';
    if (status === 'cancelled') return 'Отменена';
    return status;
  }

  if (status === 'new') return 'Scheduled';
  if (status === 'confirmed') return 'Scheduled';
  if (status === 'completed') return 'Arrived';
  if (status === 'no_show') return 'No-show';
  if (status === 'cancelled') return 'Cancelled';

  return status;
}

function bookingStatusHint(status: string, locale: 'ru' | 'en') {
  if (locale === 'ru') {
    if (status === 'new') return 'ожидает визита';
    if (status === 'confirmed') return 'ожидает визита';
    if (status === 'completed') return 'пришёл';
    if (status === 'no_show') return 'не пришёл';
    if (status === 'cancelled') return 'снята';
    return 'статус';
  }

  if (status === 'new') return 'waiting visit';
  if (status === 'confirmed') return 'waiting visit';
  if (status === 'completed') return 'arrived';
  if (status === 'no_show') return 'no-show';
  if (status === 'cancelled') return 'cancelled';

  return 'status';
}

function statusColor(
  status: string,
  accentColor: string,
  publicAccentColor: string,
  light: boolean,
) {
  if (status === 'new' || status === 'confirmed') return accentColor;

  if (status === 'completed') {
    return light ? 'rgba(0,0,0,0.34)' : 'rgba(255,255,255,0.38)';
  }

  if (status === 'cancelled' || status === 'no_show') {
    return light ? 'rgba(120,40,40,0.72)' : 'rgba(255,130,130,0.72)';
  }

  return light ? 'rgba(0,0,0,0.34)' : 'rgba(255,255,255,0.38)';
}

function StatusBadge({
  status,
  locale,
  light,
  accentColor,
  publicAccentColor,
}: {
  status: string;
  locale: 'ru' | 'en';
  light: boolean;
  accentColor: string;
  publicAccentColor: string;
}) {
  const color = statusColor(status, accentColor, publicAccentColor, light);

  return (
    <div className="flex min-w-[138px] items-center justify-end gap-2">
      <div className="min-w-0 text-right">
        <div
          className={cn(
            'text-[11.5px] font-semibold leading-none tracking-[-0.018em]',
            light ? 'text-black/72' : 'text-white/74',
          )}
        >
          {bookingStatusLabel(status, locale)}
        </div>

        <div
          className={cn(
            'mt-1 text-[9.5px] font-medium uppercase tracking-[0.12em]',
            light ? 'text-black/32' : 'text-white/28',
          )}
        >
          {bookingStatusHint(status, locale)}
        </div>
      </div>

      <span
        style={{
          background: color,
          boxShadow: `0 0 0 3px color-mix(in srgb, ${color} 14%, transparent)`,
        }}
        className="size-2 shrink-0 rounded-full"
      />
    </div>
  );
}

function BookingDateCell({
  date,
  time,
  locale,
  light,
}: {
  date: string;
  time: string;
  locale: 'ru' | 'en';
  light: boolean;
}) {
  let dateLabel = date;

  try {
    dateLabel = new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
      day: 'numeric',
      month: 'short',
    }).format(new Date(`${date}T${time}:00`));
  } catch {
    dateLabel = date;
  }

  return (
    <div
      className={cn(
        'grid min-w-[170px] grid-cols-[70px_12px_46px] items-center justify-end text-[11.5px] font-medium tabular-nums',
        light ? 'text-black/48' : 'text-white/42',
      )}
    >
      <span className="truncate text-right">{dateLabel}</span>

      <span className={cn('text-center', light ? 'text-black/22' : 'text-white/18')}>
        ·
      </span>

      <span className="text-left">{time}</span>
    </div>
  );
}

function SmallStat({
  label,
  value,
  light,
}: {
  label: string;
  value: string | number;
  light: boolean;
}) {
  return (
    <Panel light={light} className="p-4">
      <div className={cn('text-[11px] font-medium', mutedText(light))}>
        {label}
      </div>

      <div
        className={cn(
          'mt-2 truncate text-[22px] font-semibold tracking-[-0.055em]',
          pageText(light),
        )}
      >
        <NumberPopIn value={value} />
      </div>
    </Panel>
  );
}

function EmptyState({
  children,
  light,
}: {
  children: ReactNode;
  light: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-[10px] border px-4 py-5 text-[12px]',
        insetTone(light),
        mutedText(light),
      )}
    >
      {children}
    </div>
  );
}

export default function DashboardStatsPage() {
  const { hasHydrated, ownedProfile, bookings, dataset, locale, demoMode } =
    useOwnedWorkspaceData();
  const { resolvedTheme } = useTheme();
  const { settings } = useAppearance();
  const isMobile = useMobile();

  const [mounted, setMounted] = useState(false);
  const [metricView, setMetricView] = useState<MetricView>('revenue');
  const [analyticsView, setAnalyticsView] = useState<MetricView>('bookings');
  const [activityDays, setActivityDays] = useState<7 | 14 | 30>(30);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme: ThemeMode = mounted
    ? resolvedTheme === 'light'
      ? 'light'
      : 'dark'
    : 'dark';

  const isLight = currentTheme === 'light';

  const accentColor = accentPalette[settings.accentTone].solid;
  const publicAccentColor = accentPalette[settings.publicAccent].solid;

  const copy =
    locale === 'ru'
      ? {
          title: 'Статистика',
          description:
            'Аналитика по записям, доходу, клиентам и публичной странице в одном спокойном экране.',
          createTitle: 'Сначала создайте профиль мастера',
          createDescription:
            'После этого откроются статистика, журнал бронирований, источники клиентов и подробная аналитика.',
          createProfile: 'Создать профиль',

          snapshotDescription: 'Короткий срез по доходу, записям, просмотрам и конверсии.',
          dataReady: 'Данные активны',
          livePage: 'Публичная online',
          demo: 'Демо',

          coreMetrics: 'Метрики',
          coreMetricsDescription: 'Ключевые цифры по бронированиям, доходу, просмотрам и клиентам.',
          bookingJournal: 'Журнал бронирований',
          bookingJournalDescription: 'Последние заявки, статусы и комментарии в одном плотном списке.',
          activityTitle: 'Активность по дням',
          activityDescription: `Динамика просмотров, записей, подтверждений и дохода за ${activityDays} дн.`,
          analyticsTitle: 'Подробная аналитика',
          analyticsDescription: 'Срезы по услугам, источникам, часам и эффективности.',

          popularitySnapshot: 'Популярность',
          clientSources: 'Источники клиентов',
          peakHours: 'Пиковые часы',
          topServices: 'Топ услуг',
          bestSource: 'Лучший канал',
          sourceHint: 'Наиболее эффективный канал за период',

          bookingsIn30: 'Записи за 30 дней',
          revenueIn30: 'Факт за 30 дней',
          pageVisits: 'Просмотры страницы',
          newClients: 'Новые клиенты',
          confirmed: 'запланировано',
          avgCheck: 'средний чек',
          conversion: 'конверсия',
          returning: 'возвратных',

          revenue: 'Факт',
          bookingsWord: 'Записи',
          visitors: 'Посетители',
          conversionWord: 'Конверсия',

          requestsIn: `Заявки за ${activityDays} дн.`,
          confirmedIn: `Запланировано за ${activityDays} дн.`,
          revenueIn: `Факт за ${activityDays} дн.`,
          newClientsIn: `Новые клиенты за ${activityDays} дн.`,

          averageCheck: 'Средний чек',
          returnRate: 'Возвратные клиенты',
          cancellations: 'Отмены',

          bookingsLabel: 'записей',
          visitsLabel: 'переходов',
          avgWord: 'средний',
          noBookings: 'Пока нет бронирований.',

          setupCards: {
            data: 'Данные',
            dataText: 'После создания профиля здесь появятся заявки, доход и конверсия.',
            journal: 'Журнал',
            journalText: 'Бронирования, статусы и комментарии будут собраны в одном списке.',
            sources: 'Источники',
            sourcesText: 'Появится аналитика по каналам, услугам и пиковым часам.',
          },
        }
      : {
          title: 'Analytics',
          description:
            'Analytics for bookings, revenue, clients, and public page in one calm screen.',
          createTitle: 'Create a master profile first',
          createDescription:
            'After that you will unlock stats, booking journal, client sources, and expanded analytics.',
          createProfile: 'Create profile',

          snapshotDescription: 'A short cut of revenue, bookings, visits, and conversion.',
          dataReady: 'Data active',
          livePage: 'Public online',
          demo: 'Demo',

          coreMetrics: 'Metrics',
          coreMetricsDescription: 'Key numbers for bookings, revenue, visits, and clients.',
          bookingJournal: 'Booking journal',
          bookingJournalDescription: 'Latest requests, statuses, and notes in one dense list.',
          activityTitle: 'Activity by day',
          activityDescription: `Visits, bookings, confirmations, and revenue for the last ${activityDays} days.`,
          analyticsTitle: 'Expanded analytics',
          analyticsDescription: 'Slices for services, sources, peak hours, and efficiency.',

          popularitySnapshot: 'Popularity',
          clientSources: 'Client sources',
          peakHours: 'Peak hours',
          topServices: 'Top services',
          bestSource: 'Best source',
          sourceHint: 'Most efficient source for the period',

          bookingsIn30: 'Bookings in 30 days',
          revenueIn30: 'Actual revenue in 30 days',
          pageVisits: 'Page visits',
          newClients: 'New clients',
          confirmed: 'confirmed',
          avgCheck: 'avg check',
          conversion: 'conversion',
          returning: 'returning',

          revenue: 'Actual',
          bookingsWord: 'Bookings',
          visitors: 'Visitors',
          conversionWord: 'Conversion',

          requestsIn: `Requests in ${activityDays} days`,
          confirmedIn: `Confirmed in ${activityDays} days`,
          revenueIn: `Actual revenue in ${activityDays} days`,
          newClientsIn: `New clients in ${activityDays} days`,

          averageCheck: 'Average check',
          returnRate: 'Returning clients',
          cancellations: 'Cancellations',

          bookingsLabel: 'bookings',
          visitsLabel: 'visits',
          avgWord: 'average',
          noBookings: 'No bookings yet.',

          setupCards: {
            data: 'Data',
            dataText: 'After profile setup, requests, revenue, and conversion will appear here.',
            journal: 'Journal',
            journalText: 'Bookings, statuses, and notes will be collected in one list.',
            sources: 'Sources',
            sourcesText: 'Channel, service, and peak-hour analytics will appear here.',
          },
        };

  const chartData = useMemo(() => {
    if (!dataset) return [];

    return dataset.daily.map((item) => ({
      ...item,
      conversion: Number(
        ((item.confirmed / Math.max(1, item.visitors)) * 100).toFixed(1),
      ),
    }));
  }, [dataset]);

  const activityChartData = useMemo(
    () => chartData.slice(-activityDays),
    [activityDays, chartData],
  );

  const activitySlice = useMemo(
    () => (dataset ? dataset.daily.slice(-activityDays) : []),
    [activityDays, dataset],
  );

  const analyticsBreakdownData = useMemo(() => {
    if (!dataset) return [];

    if (analyticsView === 'bookings') {
      return dataset.services.slice(0, 8).map((service) => ({
        label: service.name,
        requests: service.bookings,
        revenue: service.revenue,
        visitors: service.bookings,
        conversion: service.popularity,
      }));
    }

    return dataset.channels.map((channel) => ({
      label: channel.label,
      requests: channel.bookings,
      revenue: channel.revenue,
      visitors: channel.visitors,
      conversion: channel.conversion,
    }));
  }, [analyticsView, dataset]);

  if (!hasHydrated || !mounted) return null;

  if (!ownedProfile || !dataset) {
    return (
      <WorkspaceShell>
        <main
          className={cn(
            'min-h-[calc(100dvh-68px)] px-4 pb-12 pt-5 md:px-7 md:pt-6',
            pageBg(isLight),
          )}
        >
          <div className="mx-auto w-full max-w-[var(--page-max-width)]">
            <div className="mb-6 md:mb-7">
              <div className="min-w-0">
                <h1
                  className={cn(
                    'text-[20px] font-semibold tracking-[-0.025em] md:text-[24px]',
                    pageText(isLight),
                  )}
                >
                  {copy.title}
                </h1>

                <p
                  className={cn(
                    'mt-2 max-w-[760px] text-[13px] leading-5',
                    mutedText(isLight),
                  )}
                >
                  {copy.description}
                </p>
              </div>
            </div>

            <Card light={isLight} className="overflow-hidden">
              <div className="grid min-h-[320px] place-items-center px-5 py-12 text-center">
                <div className="mx-auto max-w-[520px]">
                  <MicroLabel light={isLight}>
                    <StatusDot light={isLight} />
                    {locale === 'ru' ? 'Профиль не настроен' : 'Profile missing'}
                  </MicroLabel>

                  <h2
                    className={cn(
                      'mt-5 text-[18px] font-semibold tracking-[-0.02em] md:text-[22px]',
                      pageText(isLight),
                    )}
                  >
                    {copy.createTitle}
                  </h2>

                  <p className={cn('mt-3 text-[13px] leading-5', mutedText(isLight))}>
                    {copy.createDescription}
                  </p>

                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <PageAction href="/create-profile" light={isLight} active>
                      <SquarePen className="size-3.5" />
                      {copy.createProfile}
                    </PageAction>
                  </div>
                </div>
              </div>
            </Card>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Card light={isLight}>
                <div className="p-4">
                  <MicroLabel light={isLight}>
                    <TrendingUp className="size-3.5" />
                    {copy.setupCards.data}
                  </MicroLabel>

                  <div
                    className={cn(
                      'mt-4 text-[13px] font-semibold tracking-[-0.018em]',
                      pageText(isLight),
                    )}
                  >
                    {locale === 'ru' ? 'Аналитика' : 'Analytics'}
                  </div>

                  <p className={cn('mt-1 text-[11px] leading-4', mutedText(isLight))}>
                    {copy.setupCards.dataText}
                  </p>
                </div>
              </Card>

              <Card light={isLight}>
                <div className="p-4">
                  <MicroLabel light={isLight}>
                    <CalendarClock className="size-3.5" />
                    {copy.setupCards.journal}
                  </MicroLabel>

                  <div
                    className={cn(
                      'mt-4 text-[13px] font-semibold tracking-[-0.018em]',
                      pageText(isLight),
                    )}
                  >
                    {locale === 'ru' ? 'Бронирования' : 'Bookings'}
                  </div>

                  <p className={cn('mt-1 text-[11px] leading-4', mutedText(isLight))}>
                    {copy.setupCards.journalText}
                  </p>
                </div>
              </Card>

              <Card light={isLight}>
                <div className="p-4">
                  <MicroLabel light={isLight}>
                    <Globe2 className="size-3.5" />
                    {copy.setupCards.sources}
                  </MicroLabel>

                  <div
                    className={cn(
                      'mt-4 text-[13px] font-semibold tracking-[-0.018em]',
                      pageText(isLight),
                    )}
                  >
                    {locale === 'ru' ? 'Каналы' : 'Channels'}
                  </div>

                  <p className={cn('mt-1 text-[11px] leading-4', mutedText(isLight))}>
                    {copy.setupCards.sourcesText}
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </WorkspaceShell>
    );
  }

  const topServices = dataset.services.slice(0, 5);
  const topChannels = dataset.channels.slice(0, 5);
  const recentBookings = getRecentBookings(bookings).slice(0, isMobile ? 4 : 6);
  const totalRevenue = dataset.totals.revenue;

  const kpis = [
    {
      label: copy.bookingsIn30,
      value: String(dataset.totals.bookings),
      hint: `${dataset.totals.confirmed} ${copy.confirmed}`,
      icon: <LayoutDashboard className="size-4" />,
    },
    {
      label: copy.revenueIn30,
      value: formatCurrency(totalRevenue, locale),
      hint: `${copy.avgCheck} ${formatCurrency(dataset.totals.averageCheck, locale)}`,
      icon: <PiggyBank className="size-4" />,
    },
    {
      label: copy.pageVisits,
      value: String(dataset.totals.visitors),
      hint: `${dataset.totals.conversion}% ${copy.conversion}`,
      icon: <Globe2 className="size-4" />,
    },
    {
      label: copy.newClients,
      value: String(dataset.totals.newClients),
      hint: `${dataset.totals.returnRate}% ${copy.returning}`,
      icon: <Users2 className="size-4" />,
    },
  ] as const;

  const metricConfig = {
    revenue: { label: copy.revenue, color: accentColor },
    confirmed: {
      label: locale === 'ru' ? 'Запланировано' : 'Scheduled',
      color: publicAccentColor,
    },
    visitors: { label: copy.visitors, color: publicAccentColor },
    conversion: { label: copy.conversionWord, color: accentColor },
    requests: {
      label: locale === 'ru' ? 'Заявки' : 'Requests',
      color: accentColor,
    },
  };


  const activityStats = [
    {
      label: copy.requestsIn,
      value: activitySlice.reduce((total, item) => total + item.requests, 0),
    },
    {
      label: copy.confirmedIn,
      value: activitySlice.reduce((total, item) => total + item.confirmed, 0),
    },
    {
      label: copy.revenueIn,
      value: formatCurrency(
        activitySlice.reduce((total, item) => total + item.revenue, 0),
        locale,
      ),
    },
    {
      label: copy.newClientsIn,
      value: activitySlice.reduce((total, item) => total + item.newClients, 0),
    },
  ];

  return (
    <WorkspaceShell>
      <main
        className={cn(
          'min-h-[calc(100dvh-68px)] px-4 pb-12 pt-5 md:px-7 md:pt-6',
          pageBg(isLight),
        )}
      >
        <div className="mx-auto w-full max-w-[var(--page-max-width)]">
          <div className="mb-6 md:mb-7">
            <div className="min-w-0">
              <h1
                className={cn(
                  'text-[20px] font-semibold tracking-[-0.025em] md:text-[24px]',
                  pageText(isLight),
                )}
              >
                {copy.title}
              </h1>

              <p
                className={cn(
                  'mt-2 max-w-[760px] text-[13px] leading-5',
                  mutedText(isLight),
                )}
              >
                {copy.description}
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <Card light={isLight} className="overflow-hidden">
              <div className="p-5 md:p-6">
                <div className="min-w-0">
                  <div
                    className={cn(
                      'mt-2 text-[22px] font-semibold tracking-[-0.03em] md:text-[26px]',
                      pageText(isLight),
                    )}
                  >
                    {formatCurrency(totalRevenue, locale)}
                  </div>

                  <p
                    className={cn(
                      'mt-3 max-w-[680px] text-[12.5px] leading-6',
                      mutedText(isLight),
                    )}
                  >
                    {copy.snapshotDescription}
                  </p>
                </div>

                <div className="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  <HeroStat
                    label={copy.bookingsIn30}
                    value={dataset.totals.bookings}
                    hint={copy.bookingsLabel}
                    light={isLight}
                  />

                  <HeroStat
                    label={copy.pageVisits}
                    value={dataset.totals.visitors}
                    hint={copy.visitsLabel}
                    light={isLight}
                  />

                  <HeroStat
                    label={copy.conversionWord}
                    value={`${dataset.totals.conversion}%`}
                    hint={copy.conversion}
                    light={isLight}
                  />

                  <HeroStat
                    label={copy.averageCheck}
                    value={formatCurrency(dataset.totals.averageCheck, locale)}
                    hint={copy.avgWord}
                    light={isLight}
                  />
                </div>
              </div>
            </Card>

            <Card light={isLight}>
              <CardTitle
                title={copy.coreMetrics}
                description={copy.coreMetricsDescription}
                light={isLight}
              />

              <div
                className={cn(
                  'grid divide-y md:grid-cols-4 md:divide-x md:divide-y-0',
                  divideTone(isLight),
                )}
              >
                {kpis.map((metric) => (
                  <StatTile
                    key={metric.label}
                    label={metric.label}
                    value={metric.value}
                    hint={metric.hint}
                    icon={metric.icon}
                    light={isLight}
                  />
                ))}
              </div>
            </Card>

            <Card light={isLight}>
              <CardTitle
                title={copy.activityTitle}
                description={copy.activityDescription}
                light={isLight}
              />

              <div className="space-y-4 p-4 md:p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <ControlGroup light={isLight}>
                    {[
                      { value: 'revenue' as const, label: copy.revenue },
                      { value: 'bookings' as const, label: copy.bookingsWord },
                      { value: 'visitors' as const, label: copy.visitors },
                      { value: 'conversion' as const, label: copy.conversionWord },
                    ].map((item) => (
                      <FilterChip
                        key={item.value}
                        label={item.label}
                        active={metricView === item.value}
                        onClick={() => setMetricView(item.value)}
                        light={isLight}
                        accentColor={accentColor}
                      />
                    ))}
                  </ControlGroup>

                  <ControlGroup light={isLight}>
                    {(isMobile ? [7, 30] : [7, 14, 30]).map((days) => (
                      <FilterChip
                        key={days}
                        label={locale === 'ru' ? `${days} дн.` : `${days} days`}
                        active={activityDays === days}
                        onClick={() => setActivityDays(days as 7 | 14 | 30)}
                        light={isLight}
                        accentColor={accentColor}
                      />
                    ))}
                  </ControlGroup>
                </div>

                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <Panel light={isLight} className="p-3">
                    <ChartContainer
                      config={metricConfig}
                      className="h-[240px] w-full md:h-[340px]"
                    >
                      {metricView === 'revenue' ? (
                        <AreaChart data={activityChartData}>
                          <defs>
                            <linearGradient
                              id="metricAreaStatsRef"
                              x1="0"
                              x2="0"
                              y1="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="var(--color-revenue)"
                                stopOpacity={0.18}
                              />
                              <stop
                                offset="95%"
                                stopColor="var(--color-revenue)"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>

                          <CartesianGrid
                            vertical={false}
                            strokeDasharray="3 3"
                            stroke={chartGridStroke(isLight)}
                          />
                          <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            minTickGap={18}
                          />
                          <YAxis tickLine={false} axisLine={false} width={36} />
                          <ChartTooltip content={<ChartTooltipContent />} />

                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke="var(--color-revenue)"
                            fill="url(#metricAreaStatsRef)"
                            strokeWidth={2.1}
                          />
                        </AreaChart>
                      ) : null}

                      {metricView === 'bookings' ? (
                        <BarChart data={activityChartData}>
                          <CartesianGrid
                            vertical={false}
                            strokeDasharray="3 3"
                            stroke={chartGridStroke(isLight)}
                          />
                          <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            minTickGap={18}
                          />
                          <YAxis tickLine={false} axisLine={false} width={36} />
                          <ChartTooltip content={<ChartTooltipContent />} />

                          <Bar
                            dataKey="confirmed"
                            fill="var(--color-confirmed)"
                            radius={[5, 5, 2, 2]}
                            maxBarSize={28}
                          />
                        </BarChart>
                      ) : null}

                      {metricView === 'visitors' ? (
                        <LineChart data={activityChartData}>
                          <CartesianGrid
                            vertical={false}
                            strokeDasharray="3 3"
                            stroke={chartGridStroke(isLight)}
                          />
                          <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            minTickGap={18}
                          />
                          <YAxis tickLine={false} axisLine={false} width={36} />
                          <ChartTooltip content={<ChartTooltipContent />} />

                          <Line
                            type="monotone"
                            dataKey="visitors"
                            stroke="var(--color-visitors)"
                            strokeWidth={2.1}
                            dot={false}
                          />
                        </LineChart>
                      ) : null}

                      {metricView === 'conversion' ? (
                        <LineChart data={activityChartData}>
                          <CartesianGrid
                            vertical={false}
                            strokeDasharray="3 3"
                            stroke={chartGridStroke(isLight)}
                          />
                          <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            minTickGap={18}
                          />
                          <YAxis tickLine={false} axisLine={false} width={36} />
                          <ChartTooltip content={<ChartTooltipContent />} />

                          <Line
                            type="monotone"
                            dataKey="conversion"
                            stroke="var(--color-conversion)"
                            strokeWidth={2.1}
                            dot={false}
                          />
                        </LineChart>
                      ) : null}
                    </ChartContainer>
                  </Panel>

                  <div className="grid gap-3">
                    {activityStats.map((item) => (
                      <SmallStat
                        key={item.label}
                        label={item.label}
                        value={item.value}
                        light={isLight}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card light={isLight}>
              <CardTitle
                title={copy.bookingJournal}
                description={copy.bookingJournalDescription}
                light={isLight}
              />

              <div className="p-4">
                {recentBookings.length ? (
                  <ListBox light={isLight}>
                    {recentBookings.map((booking) => {
                      const color = statusColor(
                        booking.status,
                        accentColor,
                        publicAccentColor,
                        isLight,
                      );

                      return (
                        <ListRow
                          key={booking.id}
                          className={cn(
                            'relative overflow-hidden px-0 py-0 transition-colors duration-150',
                            isLight ? 'hover:bg-black/[0.018]' : 'hover:bg-white/[0.028]',
                          )}
                        >
                          <div className="grid min-h-[68px] grid-cols-[4px_minmax(0,1fr)]">
                            <span
                              style={{
                                background:
                                  booking.status === 'completed' ||
                                  booking.status === 'cancelled'
                                    ? isLight
                                      ? 'rgba(0,0,0,0.12)'
                                      : 'rgba(255,255,255,0.12)'
                                    : color,
                              }}
                              className="h-full w-full"
                            />

                            <div className="grid gap-3 px-4 py-3.5 md:grid-cols-[minmax(0,1fr)_170px_150px] md:items-center">
                              <div className="min-w-0">
                                <div
                                  className={cn(
                                    'truncate text-[12.5px] font-semibold tracking-[-0.018em]',
                                    pageText(isLight),
                                  )}
                                >
                                  {booking.clientName}
                                </div>

                                <div
                                  className={cn(
                                    'mt-1.5 truncate text-[11px] leading-4',
                                    mutedText(isLight),
                                  )}
                                >
                                  {booking.service}
                                  {booking.comment ? ` · ${booking.comment}` : ''}
                                </div>
                              </div>

                              <BookingDateCell
                                date={booking.date}
                                time={booking.time}
                                locale={locale}
                                light={isLight}
                              />

                              <div className="md:justify-self-end">
                                <StatusBadge
                                  status={booking.status}
                                  locale={locale}
                                  light={isLight}
                                  accentColor={accentColor}
                                  publicAccentColor={publicAccentColor}
                                />
                              </div>
                            </div>
                          </div>
                        </ListRow>
                      );
                    })}
                  </ListBox>
                ) : (
                  <EmptyState light={isLight}>{copy.noBookings}</EmptyState>
                )}
              </div>
            </Card>

            <Card light={isLight}>
              <CardTitle
                title={copy.analyticsTitle}
                description={copy.analyticsDescription}
                light={isLight}
              />

              <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-4">
                  <ControlGroup light={isLight} className="max-w-full overflow-x-auto">
                    {[
                      { value: 'bookings' as const, label: copy.bookingsWord },
                      { value: 'revenue' as const, label: copy.revenue },
                      { value: 'visitors' as const, label: copy.visitors },
                      { value: 'conversion' as const, label: copy.conversionWord },
                    ].map((item) => (
                      <FilterChip
                        key={item.value}
                        label={item.label}
                        active={analyticsView === item.value}
                        onClick={() => setAnalyticsView(item.value)}
                        light={isLight}
                        accentColor={accentColor}
                      />
                    ))}
                  </ControlGroup>

                  <div className="grid gap-3 sm:grid-cols-4">
                    {[
                      {
                        label: copy.averageCheck,
                        value: formatCurrency(dataset.totals.averageCheck, locale),
                      },
                      {
                        label: copy.conversionWord,
                        value: `${dataset.totals.conversion}%`,
                      },
                      {
                        label: copy.returnRate,
                        value: `${dataset.totals.returnRate}%`,
                      },
                      {
                        label: copy.cancellations,
                        value: String(dataset.totals.cancelled),
                      },
                    ].map((item) => (
                      <SmallStat
                        key={item.label}
                        label={item.label}
                        value={item.value}
                        light={isLight}
                      />
                    ))}
                  </div>

                  <Panel light={isLight} className="p-3">
                    <ChartContainer
                      config={metricConfig}
                      className="h-[300px] w-full md:h-[360px]"
                    >
                      {analyticsView === 'bookings' ? (
                        <BarChart data={analyticsBreakdownData}>
                          <CartesianGrid
                            vertical={false}
                            strokeDasharray="3 3"
                            stroke={chartGridStroke(isLight)}
                          />
                          <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            minTickGap={18}
                          />
                          <YAxis tickLine={false} axisLine={false} width={36} />
                          <ChartTooltip content={<ChartTooltipContent />} />

                          <Bar
                            dataKey="requests"
                            fill="var(--color-requests)"
                            radius={[5, 5, 2, 2]}
                            maxBarSize={30}
                          />
                        </BarChart>
                      ) : null}

                      {analyticsView === 'revenue' ? (
                        <LineChart data={analyticsBreakdownData}>
                          <CartesianGrid
                            vertical={false}
                            strokeDasharray="3 3"
                            stroke={chartGridStroke(isLight)}
                          />
                          <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            minTickGap={18}
                          />
                          <YAxis tickLine={false} axisLine={false} width={36} />
                          <ChartTooltip content={<ChartTooltipContent />} />

                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="var(--color-revenue)"
                            strokeWidth={2.1}
                            dot={false}
                          />
                        </LineChart>
                      ) : null}

                      {analyticsView === 'visitors' ? (
                        <AreaChart data={analyticsBreakdownData}>
                          <defs>
                            <linearGradient
                              id="visitorsAreaStatsRef"
                              x1="0"
                              x2="0"
                              y1="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="var(--color-visitors)"
                                stopOpacity={0.18}
                              />
                              <stop
                                offset="95%"
                                stopColor="var(--color-visitors)"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>

                          <CartesianGrid
                            vertical={false}
                            strokeDasharray="3 3"
                            stroke={chartGridStroke(isLight)}
                          />
                          <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            minTickGap={18}
                          />
                          <YAxis tickLine={false} axisLine={false} width={36} />
                          <ChartTooltip content={<ChartTooltipContent />} />

                          <Area
                            type="monotone"
                            dataKey="visitors"
                            stroke="var(--color-visitors)"
                            fill="url(#visitorsAreaStatsRef)"
                            strokeWidth={2.1}
                          />
                        </AreaChart>
                      ) : null}

                      {analyticsView === 'conversion' ? (
                        <LineChart data={analyticsBreakdownData}>
                          <CartesianGrid
                            vertical={false}
                            strokeDasharray="3 3"
                            stroke={chartGridStroke(isLight)}
                          />
                          <XAxis
                            dataKey="label"
                            tickLine={false}
                            axisLine={false}
                            minTickGap={18}
                          />
                          <YAxis tickLine={false} axisLine={false} width={36} />
                          <ChartTooltip content={<ChartTooltipContent />} />

                          <Line
                            type="monotone"
                            dataKey="conversion"
                            stroke="var(--color-conversion)"
                            strokeWidth={2.1}
                            dot={false}
                          />
                        </LineChart>
                      ) : null}
                    </ChartContainer>
                  </Panel>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <Card light={isLight}>
                      <CardTitle title={copy.clientSources} light={isLight} />

                      <div className="p-4">
                        <ListBox light={isLight}>
                          {topChannels.map((channel) => (
                            <ListRow key={channel.id}>
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div
                                    className={cn(
                                      'truncate text-[12.5px] font-semibold',
                                      pageText(isLight),
                                    )}
                                  >
                                    {channel.label}
                                  </div>

                                  <div
                                    className={cn(
                                      'mt-1 text-[11px]',
                                      mutedText(isLight),
                                    )}
                                  >
                                    {channel.visitors} {copy.visitsLabel} ·{' '}
                                    {channel.bookings} {copy.bookingsLabel} ·{' '}
                                    {formatCurrency(channel.revenue, locale)}
                                  </div>
                                </div>

                                <MicroLabel
                                  light={isLight}
                                  active
                                  accentColor={publicAccentColor}
                                >
                                  {channel.conversion}%
                                </MicroLabel>
                              </div>
                            </ListRow>
                          ))}
                        </ListBox>
                      </div>
                    </Card>

                    <Card light={isLight}>
                      <CardTitle title={copy.peakHours} light={isLight} />

                      <div className="p-4">
                        <ListBox light={isLight}>
                          {dataset.peakHours.slice(0, 5).map((item) => (
                            <ListRow key={item.hour}>
                              <div className="flex items-center justify-between gap-3">
                                <span
                                  className={cn(
                                    'text-[12.5px] font-semibold',
                                    pageText(isLight),
                                  )}
                                >
                                  {item.hour}
                                </span>

                                <span className={cn('text-[11px]', mutedText(isLight))}>
                                  {item.bookings} {copy.bookingsLabel}
                                </span>
                              </div>
                            </ListRow>
                          ))}
                        </ListBox>
                      </div>
                    </Card>
                  </div>
                </div>

                <div className="space-y-4">
                  <Card light={isLight}>
                    <CardTitle title={copy.topServices} light={isLight} />

                    <div className="p-4">
                      <ListBox light={isLight}>
                        {topServices.map((service, index) => (
                          <ListRow key={service.id}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div
                                  className={cn(
                                    'truncate text-[12.5px] font-semibold',
                                    pageText(isLight),
                                  )}
                                >
                                  {index + 1}. {service.name}
                                </div>

                                <div className={cn('mt-1 text-[11px]', mutedText(isLight))}>
                                  {service.bookings} {copy.bookingsLabel} ·{' '}
                                  {formatCurrency(service.revenue, locale)}
                                </div>
                              </div>

                              <MicroLabel light={isLight} active accentColor={accentColor}>
                                {service.popularity}%
                              </MicroLabel>
                            </div>
                          </ListRow>
                        ))}
                      </ListBox>
                    </div>
                  </Card>

                  <Card light={isLight}>
                    <CardTitle
                      title={copy.bestSource}
                      description={copy.sourceHint}
                      light={isLight}
                    />

                    <div className="p-4">
                      {topChannels[0] ? (
                        <Panel light={isLight} className="p-4">
                          <div className={cn('text-[11px] font-medium', mutedText(isLight))}>
                            {copy.sourceHint}
                          </div>

                          <div
                            className={cn(
                              'mt-2 text-[24px] font-semibold tracking-[-0.06em]',
                              pageText(isLight),
                            )}
                          >
                            {topChannels[0].label}
                          </div>

                          <div className={cn('mt-2 text-[12px]', mutedText(isLight))}>
                            {topChannels[0].visitors} {copy.visitsLabel} ·{' '}
                            {topChannels[0].bookings} {copy.bookingsLabel}
                          </div>

                          <div className="mt-3">
                            <MicroLabel light={isLight} active accentColor={publicAccentColor}>
                              {copy.conversionWord} · {topChannels[0].conversion}%
                            </MicroLabel>
                          </div>
                        </Panel>
                      ) : null}
                    </div>
                  </Card>

                  <Card light={isLight}>
                    <CardTitle title={copy.popularitySnapshot} light={isLight} />

                    <div className="p-4">
                      <ListBox light={isLight}>
                        {topServices.slice(0, 3).map((service) => (
                          <ListRow key={service.id}>
                            <div className="flex items-center justify-between gap-3">
                              <span
                                className={cn(
                                  'truncate text-[12px] font-medium',
                                  pageText(isLight),
                                )}
                              >
                                {service.name}
                              </span>

                              <MicroLabel light={isLight} active accentColor={accentColor}>
                                {service.popularity}%
                              </MicroLabel>
                            </div>
                          </ListRow>
                        ))}
                      </ListBox>
                    </div>
                  </Card>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </WorkspaceShell>
  );
}