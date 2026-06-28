// app/dashboard/page.tsx
'use client';

import Link from 'next/link';
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useId,
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
  Check,
  Copy,
  Globe2,
  LayoutDashboard,
  PiggyBank,
  Sparkles,
  SquarePen,
  Users2,
} from 'lucide-react';

import { WorkspaceShell } from '@/components/shared/workspace-shell';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useOwnedWorkspaceData } from '@/hooks/use-owned-workspace-data';
import { formatCurrency } from '@/lib/master-workspace';
import { useAppearance } from '@/lib/appearance-context';
import { accentPalette, type AccentTone } from '@/lib/appearance-palette';
import { cn } from '@/lib/utils';

type ThemeMode = 'light' | 'dark';
type TrendMetric = 'revenue' | 'requests' | 'visitors';

function toLocalIsoDate(date: Date) {
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function shortDayLabel(date: Date, locale: 'ru' | 'en') {
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

function buildCurrentWeekData<T extends { date: string; label: string; revenue: number; requests: number; visitors: number }>(
  daily: T[],
  locale: 'ru' | 'en',
) {
  const byDate = new Map(daily.map((item) => [item.date, item]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monday = new Date(today);
  const day = monday.getDay();
  monday.setDate(today.getDate() - ((day + 6) % 7));

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const iso = toLocalIsoDate(date);
    const item = byDate.get(iso);

    return {
      date: iso,
      label: shortDayLabel(date, locale),
      revenue: item?.revenue ?? 0,
      requests: item?.requests ?? 0,
      visitors: item?.visitors ?? 0,
      avgCheck: item?.confirmed ? Math.round(item.revenue / item.confirmed) : 0,
    };
  });
}


const dashboardAccentImages: Record<AccentTone, string> = {
  emerald: '/images/8.png',
  violet: '/images/5.png',
  sky: '/images/3.png',
  rose: '/images/6.png',
  amber: '/images/10.png',
  cyan: '/images/2.png',
  indigo: '/images/7.png',
  peach: '/images/9.png',
  teal: '/images/1.png',
  cobalt: '/images/3.png',
  ruby: '/images/6.png',
  lime: '/images/8.png',
};

function DashboardAccentHero({
  accentTone,
  light,
  label,
  title,
  subtitle,
}: {
  accentTone: AccentTone;
  light: boolean;
  label: string;
  title?: string;
  subtitle?: string;
}) {
  const imageSrc = dashboardAccentImages[accentTone] ?? dashboardAccentImages.violet;

  return (
    <section
      className={cn(
        'relative mb-6 overflow-hidden rounded-[30px] border md:mb-7',
        light
          ? 'border-black/[0.07] bg-white shadow-[0_16px_44px_rgba(17,17,17,0.045)]'
          : 'border-white/[0.08] bg-[#111111]',
      )}
    >
      <img
        src={imageSrc}
        alt={label}
        className="h-[170px] w-full object-cover object-center md:h-[220px] xl:h-[260px]"
        loading="eager"
        decoding="async"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/5 dark:from-black/28 dark:via-transparent dark:to-black/10" />

      {title ? (
        <>
          <div
            className="dashboard-accent-hero-readable-layer pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-black/56 via-black/18 to-transparent"
            aria-hidden="true"
          />

          <div className="dashboard-accent-hero-copy pointer-events-none absolute inset-y-0 left-0 hidden max-w-[760px] flex-col justify-center px-6 py-7 md:px-9 xl:px-12">
            <h1 className="max-w-[660px] text-[26px] font-semibold leading-[1.08] tracking-[-0.035em] text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.34)] md:text-[34px] xl:text-[40px]">
              {title}
            </h1>

            {subtitle ? (
              <p className="mt-3 max-w-[620px] text-[13px] leading-6 text-white/78 drop-shadow-[0_1px_10px_rgba(0,0,0,0.28)] md:text-[15px]">
                {subtitle}
              </p>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}


function NumberPopIn({
  value,
  className,
}: {
  value: string | number;
  className?: string;
}) {
  const text = String(value ?? '—');
  const [playKey, setPlayKey] = useState(0);

  useEffect(() => {
    setPlayKey((key) => key + 1);
  }, [text]);

  return (
    <span key={playKey} className={cn('t-digit-group is-animating', className)} aria-label={text}>
      {text.split('').map((char, index) => (
        <span
          key={`${char}-${index}`}
          className="t-digit"
          style={{ ['--digit-index' as string]: Math.min(index, 8) } as CSSProperties}
          aria-hidden="true"
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
}

function SuccessCheckIcon({ children }: { children: ReactNode }) {
  return (
    <span className="t-success-check" data-state="in" aria-hidden="true">
      {children}
    </span>
  );
}

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
    ? 'border-[#e6e2da] bg-white shadow-[0_12px_30px_rgba(17,17,17,0.035)]'
    : 'border-white/[0.08] bg-[#141414]';
}

function insetTone(light: boolean) {
  return light
    ? 'border-[#e6e2da] bg-black/[0.015]'
    : 'border-white/[0.07] bg-white/[0.026]';
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

function MiniSparkline({
  values,
  color,
  height = 42,
  ariaLabel,
}: {
  values: number[];
  color: string;
  height?: number;
  ariaLabel?: string;
}) {
  const safe = (values && values.length ? values : [0, 0]).filter((v) => Number.isFinite(v));
  const data = safe.length ? safe : [0, 0];

  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const seedId = useId();

  const width = 124;
  const padX = 5;
  const padY = 5;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(1, max - min);
  const points = data.map((value, index) => {
    const x = padX + (index / Math.max(1, data.length - 1)) * (width - padX * 2);
    const y = height - padY - ((value - min) / range) * (height - padY * 2);
    return [x, y] as const;
  });
  const lastPoint = points[points.length - 1];
  const highPoint = points.reduce((best, point) => (point[1] < best[1] ? point : best), points[0]);

  const linePath = points
    .map((p, i) => (i === 0 ? `M${p[0]} ${p[1]}` : `L${p[0]} ${p[1]}`))
    .join(' ');

  const areaPath = `${linePath} L${points[points.length - 1][0]} ${height} L${points[0][0]} ${height} Z`;
  const gradientId = useMemo(
    () => `spark-fill-${seedId.replace(/[^a-zA-Z0-9_-]/g, '')}`,
    [seedId],
  );
  const glowId = useMemo(
    () => `spark-glow-${seedId.replace(/[^a-zA-Z0-9_-]/g, '')}`,
    [seedId],
  );

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel}
      onMouseLeave={() => setHoverIdx(null)}
      style={{ cursor: 'crosshair' }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.38" />
          <stop offset="52%" stopColor={color} stopOpacity="0.16" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
        <filter id={glowId} x="-20%" y="-80%" width="140%" height="260%">
          <feGaussianBlur stdDeviation="2.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={`M${padX} ${height - padY} H${width - padX}`}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.08"
        strokeWidth="1"
      />
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={4.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity={0.16}
        filter={`url(#${glowId})`}
      />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={highPoint[0]} cy={highPoint[1]} r={2.4} fill={color} opacity={0.9} />
      {points.map((p, i) => (
        <g key={i}>
          <rect
            x={p[0] - (width / data.length) / 2}
            y={0}
            width={width / data.length}
            height={height}
            fill="transparent"
            onMouseEnter={() => setHoverIdx(i)}
          />
          {hoverIdx === i && (
            <>
              <line x1={p[0]} y1={padY} x2={p[0]} y2={height - padY} stroke={color} strokeOpacity={0.24} strokeWidth={1} />
              <circle cx={p[0]} cy={p[1]} r={4} fill={color} stroke="currentColor" strokeOpacity={0.28} strokeWidth={5} />
              <circle cx={p[0]} cy={p[1]} r={2.6} fill={color} />
            </>
          )}
        </g>
      ))}
      {hoverIdx === null && (
        <>
          <circle cx={lastPoint[0]} cy={lastPoint[1]} r={4.4} fill={color} opacity={0.16} />
          <circle cx={lastPoint[0]} cy={lastPoint[1]} r={2.5} fill={color} />
        </>
      )}
    </svg>
  );
}

function StatTile({
  label,
  value,
  hint,
  icon,
  light,
  spark,
  accentColor,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
  light: boolean;
  spark?: number[];
  accentColor?: string;
}) {
  return (
    <div className="min-w-0 p-4 md:p-5">
      <div className="grid min-h-[88px] grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <div className={cn('truncate text-[11px] font-medium', mutedText(light))}>
            {label}
          </div>

          <div
            className={cn(
              'mt-2 truncate text-[21px] font-semibold',
              pageText(light),
            )}
          >
            <NumberPopIn value={value} />
          </div>

          <div className={cn('mt-3 truncate text-[11px]', faintText(light))}>
            {hint}
          </div>
        </div>

        <div className="flex h-full min-w-[126px] flex-col items-end justify-between gap-3">
          <div
            className={cn(
              'inline-flex size-7 shrink-0 items-center justify-center rounded-[8px] border',
              light
                ? 'border-black/[0.07] bg-black/[0.025] text-black/45'
                : 'border-white/[0.07] bg-white/[0.035] text-white/45',
            )}
          >
            {icon}
          </div>

          {spark && spark.length ? (
            <div className={cn('text-current', light ? 'text-black/35' : 'text-white/35')}>
              <MiniSparkline
                values={spark}
                color={accentColor ?? '#8B5CF6'}
                ariaLabel={label}
              />
            </div>
          ) : null}
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

function InlineCopyButton({
  copied,
  onClick,
  copyLabel,
  copiedLabel,
  light,
}: {
  copied: boolean;
  onClick: () => void;
  copyLabel: string;
  copiedLabel: string;
  light: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={copied ? copiedLabel : copyLabel}
      className={cn(
        'inline-flex h-9 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-[10px] border text-[11px] font-medium shadow-none transition-[width,background,border-color,color,opacity,transform] duration-200 active:scale-[0.985]',
        copied ? 'w-[118px] px-3' : 'w-9 px-0',
        light
          ? 'border-black/[0.08] bg-black/[0.035] text-black/54 hover:border-black/[0.12] hover:bg-black/[0.06] hover:text-black'
          : 'border-white/[0.08] bg-white/[0.055] text-white/58 hover:border-white/[0.13] hover:bg-white/[0.085] hover:text-white',
      )}
    >
      {copied ? (
        <SuccessCheckIcon><Check className="size-3.5 shrink-0" /></SuccessCheckIcon>
      ) : (
        <Copy className="size-3.5 shrink-0" />
      )}

      {copied ? <span className="truncate">{copiedLabel}</span> : null}
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
  if (status === 'new') return accentColor;
  if (status === 'confirmed') return publicAccentColor;

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

function KeyValue({
  label,
  value,
  light,
}: {
  label: string;
  value: string;
  light: boolean;
}) {
  return (
    <div
      className={cn(
        'flex min-h-10 items-center justify-between gap-3 rounded-[9px] border px-3',
        insetTone(light),
      )}
    >
      <span className={cn('text-[11px] font-medium', mutedText(light))}>
        {label}
      </span>

      <span
        className={cn(
          'truncate text-right text-[11.5px] font-medium',
          pageText(light),
        )}
      >
        {value}
      </span>
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

function ProgressLine({
  value,
  color,
  light,
}: {
  value: number;
  color: string;
  light: boolean;
}) {
  const normalizedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn(
        'mt-3 h-[5px] overflow-hidden rounded-full',
        light ? 'bg-black/[0.075]' : 'bg-white/[0.09]',
      )}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${normalizedValue}%`,
          minWidth: normalizedValue > 0 ? '34px' : 0,
          background: color,
          opacity: light ? 0.75 : 0.82,
        }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const { hasHydrated, ownedProfile, bookings, dataset, locale } =
    useOwnedWorkspaceData();
  const { resolvedTheme } = useTheme();
  const { settings } = useAppearance();

  const [mounted, setMounted] = useState(false);
  const [trendMetric, setTrendMetric] = useState<TrendMetric>('revenue');
  const [selectedFavoriteClientId, setSelectedFavoriteClientId] = useState<string | null>(null);
  const [copiedPublicLink, setCopiedPublicLink] = useState(false);

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
          title: 'Кабинет мастера',
          subtitle:
            'Короткий обзор рабочего дня: ближайшие записи, выручка, клиенты, услуги и состояние публичной страницы.',
          heroImageLabel: 'Изображение под выбранный акцент',
          copy: 'Скопировать',
          copied: 'Скопировано',
          live: 'Online',
          ready: 'Готово',
          active: 'Активна',
          publicLink: 'Ссылка для клиентов',
          publicHint:
            'Скопируйте ссылку и отправляйте клиентам — по ней они увидят услуги, свободное время и смогут записаться онлайн.',
          conversion: 'Конверсия',
          newClients: 'Новые клиенты',
          source: 'Основной канал',
          sourceHint: 'откуда чаще приходят клиенты',
          visits: 'Переходы',
          metricsTitle: 'Метрики',
          metricsDescription:
            'Главные показатели по записям, выручке, переходам и клиентам.',
          requestsToday: 'Записи сегодня',
          revenueWeek: 'Выручка за неделю',
          pageViews: 'Переходы на страницу',
          returning: 'Повторные клиенты',
          confirmed: 'в календаре',
          avgCheck: 'средний чек',
          conversionWord: 'из переходов в запись',
          newIn30: 'за последние 30 дней',
          nextTitle: 'Ближайшая запись',
          nextDescription: 'Кто придёт следующим и какие записи стоят после него.',
          focus: 'Ближайший клиент',
          nextBooking: 'Следующая запись',
          queue: 'Следующие записи',
          emptyBookings: 'Ближайших записей пока нет.',
          emptyQueue: 'После ближайшей записи пока ничего не запланировано.',
          slot: 'Слот',
          phone: 'Телефон',
          status: 'Статус',
          weekTitle: 'Неделя',
          weekDescription: 'Динамика записей, переходов и выручки по дням.',
          revenue: 'Выручка',
          requests: 'Записи',
          traffic: 'Переходы',
          confirmedShort: 'Подтв.',
          averageCheck: 'Средний чек',
          requestsWord: 'записей',
          visitorsWord: 'переходов',
          confirmedWord: 'подтв.',
          servicesTitle: 'Услуги',
          servicesDescription: 'Самые востребованные услуги по записям и выручке.',
          bookingsWord: 'записей',
          minWord: 'мин',
          emptyServices: 'Пока нет данных по услугам.',
          clientsTitle: 'Клиенты',
          clientsDescription: 'Постоянные клиенты, заметки и история визитов.',
          visitsWord: 'визитов',
          emptyClients: 'Пока нет сохранённых заметок по клиентам.',
          createTitle: 'Профиль ещё не создан',
          createButton: 'Создать профиль',
        }
      : {
          title: 'Specialist dashboard',
          subtitle:
            'A compact overview of the workday: upcoming bookings, revenue, clients, services, and public page status.',
          heroImageLabel: 'Image matched to accent color',
          copy: 'Copy',
          copied: 'Copied',
          live: 'Online',
          ready: 'Ready',
          active: 'Active',
          publicLink: 'Client booking link',
          publicHint:
            'Copy this link and send it to clients — they will see services, available time, and book online.',
          conversion: 'Conversion',
          newClients: 'New clients',
          source: 'Top channel',
          sourceHint: 'where clients come from',
          visits: 'Visits',
          metricsTitle: 'Metrics',
          metricsDescription: 'Key numbers for bookings, revenue, page visits, and clients.',
          requestsToday: 'Bookings today',
          revenueWeek: 'Weekly revenue',
          pageViews: 'Page visits',
          returning: 'Returning clients',
          confirmed: 'in calendar',
          avgCheck: 'avg check',
          conversionWord: 'from visits to bookings',
          newIn30: 'in the last 30 days',
          nextTitle: 'Next booking',
          nextDescription: 'Who comes next and what is scheduled after them.',
          focus: 'Next client',
          nextBooking: 'Next booking',
          queue: 'Upcoming bookings',
          emptyBookings: 'No upcoming bookings yet.',
          emptyQueue: 'Nothing else is scheduled after the next booking yet.',
          slot: 'Slot',
          phone: 'Phone',
          status: 'Status',
          weekTitle: 'Week',
          weekDescription: 'Bookings, visits, and revenue dynamics by day.',
          revenue: 'Revenue',
          requests: 'Bookings',
          traffic: 'Visits',
          confirmedShort: 'Conf.',
          averageCheck: 'Average check',
          requestsWord: 'bookings',
          visitorsWord: 'visits',
          confirmedWord: 'confirmed',
          servicesTitle: 'Services',
          servicesDescription: 'Most requested services by bookings and revenue.',
          bookingsWord: 'bookings',
          minWord: 'min',
          emptyServices: 'No service data yet.',
          clientsTitle: 'Clients',
          clientsDescription: 'Regular clients, notes, and visit history.',
          visitsWord: 'visits',
          emptyClients: 'No saved client notes yet.',
          createTitle: 'Profile is not created yet',
          createButton: 'Create profile',
        };

  const publicHref = ownedProfile ? `/m/${ownedProfile.slug}` : '/create-profile';
  const publicUrl =
    mounted && typeof window !== 'undefined'
      ? `${window.location.origin}${publicHref}`
      : publicHref;

  const handleCopyPublicLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(publicUrl);
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = publicUrl;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      setCopiedPublicLink(true);
      window.setTimeout(() => setCopiedPublicLink(false), 1400);
    } catch {
      setCopiedPublicLink(false);
    }
  };

  const upcomingBookings = useMemo(() => {
    return [...bookings]
      .sort((left, right) => {
        const a = new Date(`${left.date}T${left.time}:00`).getTime();
        const b = new Date(`${right.date}T${right.time}:00`).getTime();
        return a - b;
      })
      .slice(0, 5);
  }, [bookings]);

  const todayActivity = useMemo(() => dataset?.daily.at(-1), [dataset]);

  const weekRevenue = useMemo(
    () =>
      dataset?.daily
        .slice(-7)
        .reduce((total, item) => total + item.revenue, 0) ?? 0,
    [dataset],
  );

  const weekTrendData = useMemo(
    () => (dataset ? buildCurrentWeekData(dataset.daily, locale) : []),
    [dataset, locale],
  );

  const trendSummary = useMemo(() => {
    if (!dataset) return null;

    const lastSeven = dataset.daily.slice(-7);
    const previousSeven = dataset.daily.slice(-14, -7);

    const currentRevenue = lastSeven.reduce(
      (total, item) => total + item.revenue,
      0,
    );
    const previousRevenue = previousSeven.reduce(
      (total, item) => total + item.revenue,
      0,
    );
    const currentRequests = lastSeven.reduce(
      (total, item) => total + item.requests,
      0,
    );
    const currentVisitors = lastSeven.reduce(
      (total, item) => total + item.visitors,
      0,
    );
    const currentConfirmed = lastSeven.reduce(
      (total, item) => total + item.confirmed,
      0,
    );

    const revenueDelta =
      previousRevenue > 0
        ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
        : currentRevenue > 0
          ? 100
          : 0;

    return {
      revenueDelta,
      requests: currentRequests,
      visitors: currentVisitors,
      confirmed: currentConfirmed,
      conversion:
        Math.round((currentConfirmed / Math.max(1, currentVisitors)) * 1000) /
        10,
    };
  }, [dataset]);

  const favoriteClients = useMemo(
    () => dataset?.clients.filter((item) => item.favorite).slice(0, 4) ?? [],
    [dataset],
  );

  const selectedFavoriteClient = useMemo(
    () => favoriteClients.find((item) => item.id === selectedFavoriteClientId) ?? null,
    [favoriteClients, selectedFavoriteClientId],
  );

  const topServices = useMemo(
    () => dataset?.services.slice(0, 4) ?? [],
    [dataset],
  );

  const chartConfig = useMemo(
    () => ({
      revenue: { label: copy.revenue, color: accentColor },
      requests: { label: copy.requests, color: publicAccentColor },
      visitors: { label: copy.traffic, color: publicAccentColor },
    }),
    [copy.revenue, copy.requests, copy.traffic, accentColor, publicAccentColor],
  );

  const metricSparklines = useMemo(() => {
    const lastWeek = dataset?.daily.slice(-7) ?? [];
    return {
      requests: lastWeek.map((d) => d.requests),
      revenue: lastWeek.map((d) => d.revenue),
      visitors: lastWeek.map((d) => d.visitors),
      returning: lastWeek.map((d) =>
        d.requests > 0 ? Math.round((d.confirmed / Math.max(1, d.requests)) * 100) : 0,
      ),
    };
  }, [dataset]);

  const metrics = useMemo(
    () => [
      {
        label: copy.requestsToday,
        value: String(todayActivity?.requests ?? 0),
        hint: `${todayActivity?.confirmed ?? 0} ${copy.confirmed}`,
        icon: <CalendarClock className="size-3.5" />,
        spark: metricSparklines.requests,
      },
      {
        label: copy.revenueWeek,
        value: formatCurrency(weekRevenue, locale),
        hint: `${copy.avgCheck} ${formatCurrency(dataset?.totals.averageCheck ?? 0, locale)}`,
        icon: <PiggyBank className="size-3.5" />,
        spark: metricSparklines.revenue,
      },
      {
        label: copy.pageViews,
        value: String(dataset?.totals.visitors ?? 0),
        hint: `${dataset?.totals.conversion ?? 0}% ${copy.conversionWord}`,
        icon: <Globe2 className="size-3.5" />,
        spark: metricSparklines.visitors,
      },
      {
        label: copy.returning,
        value: `${dataset?.totals.returnRate ?? 0}%`,
        hint: `${dataset?.totals.newClients ?? 0} ${copy.newIn30}`,
        icon: <Users2 className="size-3.5" />,
        spark: metricSparklines.returning,
      },
    ],
    [copy, dataset, locale, todayActivity, weekRevenue, metricSparklines],
  );

  const trendMetricOptions = useMemo(
    () => [
      { value: 'revenue' as const, label: copy.revenue },
      { value: 'requests' as const, label: copy.requests },
      { value: 'visitors' as const, label: copy.traffic },
    ],
    [copy.revenue, copy.requests, copy.traffic],
  );

  const activeTrendValue = useMemo(() => {
    if (trendMetric === 'revenue') return formatCurrency(weekRevenue, locale);
    if (trendMetric === 'requests') return String(trendSummary?.requests ?? 0);
    return String(trendSummary?.visitors ?? 0);
  }, [trendMetric, weekRevenue, locale, trendSummary]);

  const formatStatusValue = (status: string) => bookingStatusLabel(status, locale);

  const formatBookingSlot = (date: string, time: string) => {
    try {
      return (
        new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
          day: 'numeric',
          month: 'short',
        }).format(new Date(`${date}T${time}:00`)) + ` · ${time}`
      );
    } catch {
      return `${date} · ${time}`;
    }
  };

  if (!hasHydrated || !mounted) return null;

  if (!ownedProfile) {
    return (
      <WorkspaceShell>
        <main
          className={cn(
            'min-h-[calc(100dvh-68px)] px-4 pb-12 pt-5 md:px-7 md:pt-6',
            pageBg(isLight),
          )}
        >
          <div className="mx-auto w-full max-w-[var(--page-max-width)]">
            <DashboardAccentHero
              accentTone={settings.accentTone}
              light={isLight}
              label={copy.heroImageLabel}
              title={copy.title}
              subtitle={copy.subtitle}
            />

            <div className="dashboard-main-heading mb-6 md:mb-7">
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
                  {copy.subtitle}
                </p>
              </div>
            </div>

            <Card light={isLight} className="overflow-hidden">
              <div className="grid min-h-[320px] place-items-center px-5 py-12 text-center">
                <div className="mx-auto max-w-[460px]">
                  <MicroLabel light={isLight}>
                    <StatusDot light={isLight} />
                    {locale === 'ru' ? 'Профиль не найден' : 'Profile missing'}
                  </MicroLabel>

                  <h2
                    className={cn(
                      'mt-5 text-[18px] font-semibold tracking-[-0.02em] md:text-[22px]',
                      pageText(isLight),
                    )}
                  >
                    {copy.createTitle}
                  </h2>

                  <p
                    className={cn(
                      'mt-3 text-[13px] leading-5',
                      mutedText(isLight),
                    )}
                  >
                    {locale === 'ru'
                      ? 'Сначала создайте профиль мастера, чтобы открыть кабинет, публичную страницу, онлайн-запись и статистику.'
                      : 'Create a master profile first to open the workspace, public page, online booking, and stats.'}
                  </p>

                  <div className="mt-6 flex justify-center">
                    <PageAction href="/create-profile" light={isLight} active>
                      <SquarePen className="size-3.5" />
                      {copy.createButton}
                    </PageAction>
                  </div>
                </div>
              </div>
            </Card>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Card light={isLight}>
                <div className="p-4">
                  <MicroLabel light={isLight}>
                    <LayoutDashboard className="size-3.5" />
                    {locale === 'ru' ? 'Кабинет' : 'Workspace'}
                  </MicroLabel>

                  <div
                    className={cn(
                      'mt-4 text-[13px] font-semibold tracking-[-0.018em]',
                      pageText(isLight),
                    )}
                  >
                    {locale === 'ru' ? 'Рабочий экран' : 'Main workspace'}
                  </div>

                  <p
                    className={cn(
                      'mt-1 text-[11px] leading-4',
                      mutedText(isLight),
                    )}
                  >
                    {locale === 'ru'
                      ? 'Записи, клиенты, услуги и статистика появятся после создания профиля.'
                      : 'Bookings, clients, services, and stats will appear after profile setup.'}
                  </p>
                </div>
              </Card>

              <Card light={isLight}>
                <div className="p-4">
                  <MicroLabel light={isLight}>
                    <Globe2 className="size-3.5" />
                    {locale === 'ru' ? 'Публичная' : 'Public'}
                  </MicroLabel>

                  <div
                    className={cn(
                      'mt-4 text-[13px] font-semibold tracking-[-0.018em]',
                      pageText(isLight),
                    )}
                  >
                    {locale === 'ru' ? 'Страница клиента' : 'Client page'}
                  </div>

                  <p
                    className={cn(
                      'mt-1 text-[11px] leading-4',
                      mutedText(isLight),
                    )}
                  >
                    {locale === 'ru'
                      ? 'После сохранения профиля появится ссылка для клиентов.'
                      : 'After saving the profile, a client booking link will be created.'}
                  </p>
                </div>
              </Card>

              <Card light={isLight}>
                <div className="p-4">
                  <MicroLabel light={isLight}>
                    <Sparkles className="size-3.5" />
                    {locale === 'ru' ? 'Старт' : 'Start'}
                  </MicroLabel>

                  <div
                    className={cn(
                      'mt-4 text-[13px] font-semibold tracking-[-0.018em]',
                      pageText(isLight),
                    )}
                  >
                    {locale === 'ru' ? 'Один шаг до запуска' : 'One step to launch'}
                  </div>

                  <p
                    className={cn(
                      'mt-1 text-[11px] leading-4',
                      mutedText(isLight),
                    )}
                  >
                    {locale === 'ru'
                      ? 'Заполните имя, описание, услуги, контакты — и можно принимать записи.'
                      : 'Fill in name, description, services, and contacts to start accepting bookings.'}
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </WorkspaceShell>
    );
  }

  const primaryBooking = upcomingBookings[0] ?? null;
  const secondaryBookings = primaryBooking ? upcomingBookings.slice(1, 5) : [];

  return (
    <WorkspaceShell>
      <main
        className={cn(
          'min-h-[calc(100dvh-68px)] px-4 pb-12 pt-5 md:px-7 md:pt-6',
          pageBg(isLight),
        )}
      >
        <div className="mx-auto w-full max-w-[var(--page-max-width)]">
          <DashboardAccentHero
            accentTone={settings.accentTone}
            light={isLight}
            label={copy.heroImageLabel}
            title={copy.title}
            subtitle={copy.subtitle}
          />

          <div className="dashboard-main-heading mb-6 md:mb-7">
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
                {copy.subtitle}
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <Card light={isLight} className="overflow-hidden">
              <div className="p-5 md:p-6">
                <div className="min-w-0">
                  <div className={cn('text-[11px] font-medium', mutedText(isLight))}>
                    {copy.publicLink}
                  </div>

                  <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2.5">
                    <div
                      className={cn(
                        'min-w-0 break-all text-[22px] font-semibold tracking-[-0.03em] md:text-[26px]',
                        pageText(isLight),
                      )}
                    >
                      /m/{ownedProfile.slug}
                    </div>

                    <InlineCopyButton
                      copied={copiedPublicLink}
                      onClick={handleCopyPublicLink}
                      copyLabel={copy.copy}
                      copiedLabel={copy.copied}
                      light={isLight}
                    />
                  </div>

                  <p
                    className={cn(
                      'mt-3 max-w-[680px] text-[12.5px] leading-6',
                      mutedText(isLight),
                    )}
                  >
                    {copy.publicHint}
                  </p>
                </div>

                <div className="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  <HeroStat
                    label={copy.conversion}
                    value={`${dataset.totals.conversion}%`}
                    hint={copy.conversionWord}
                    light={isLight}
                  />

                  <HeroStat
                    label={copy.newClients}
                    value={dataset.totals.newClients}
                    hint={copy.newIn30}
                    light={isLight}
                  />

                  <HeroStat
                    label={copy.source}
                    value={dataset.channels[0]?.label ?? '—'}
                    hint={copy.sourceHint}
                    light={isLight}
                  />

                  <HeroStat
                    label={copy.visits}
                    value={trendSummary?.visitors ?? 0}
                    hint={copy.visitorsWord}
                    light={isLight}
                  />
                </div>
              </div>
            </Card>

            <Card light={isLight}>
              <CardTitle
                title={copy.metricsTitle}
                description={copy.metricsDescription}
                light={isLight}
              />

              <div
                className={cn(
                  'grid divide-y md:grid-cols-4 md:divide-x md:divide-y-0',
                  divideTone(isLight),
                )}
              >
                {metrics.map((metric) => (
                  <StatTile
                    key={metric.label}
                    label={metric.label}
                    value={metric.value}
                    hint={metric.hint}
                    icon={metric.icon}
                    light={isLight}
                    spark={metric.spark}
                    accentColor={accentColor}
                  />
                ))}
              </div>
            </Card>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
              <Card light={isLight}>
                <CardTitle
                  title={copy.nextTitle}
                  description={copy.nextDescription}
                  light={isLight}
                />

                <div className="p-4">
                  {primaryBooking ? (
                    <div className="space-y-3">
                      <Panel light={isLight} className="p-4 md:p-5">
                        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="size-1.5 rounded-full"
                                style={{ background: publicAccentColor }}
                              />

                              <span
                                className={cn(
                                  'text-[11px] font-medium',
                                  mutedText(isLight),
                                )}
                              >
                                {copy.focus}
                              </span>
                            </div>

                            <div
                              className={cn(
                                'mt-4 truncate text-[20px] font-semibold tracking-[-0.025em] md:text-[24px]',
                                pageText(isLight),
                              )}
                            >
                              {primaryBooking.clientName}
                            </div>

                            <div className={cn('mt-1 text-[13px]', mutedText(isLight))}>
                              {primaryBooking.service}
                            </div>
                          </div>

                          <div className="lg:flex lg:flex-col lg:items-end lg:text-right">
                            <div className={cn('text-[11px] font-medium', mutedText(isLight))}>
                              {copy.nextBooking}
                            </div>

                            <div className="mt-2">
                              <BookingDateCell
                                date={primaryBooking.date}
                                time={primaryBooking.time}
                                locale={locale}
                                light={isLight}
                              />
                            </div>

                            <div className="mt-3">
                              <StatusBadge
                                status={primaryBooking.status}
                                locale={locale}
                                light={isLight}
                                                  publicAccentColor={publicAccentColor}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-2 lg:grid-cols-3">
                          <KeyValue
                            label={copy.slot}
                            value={formatBookingSlot(primaryBooking.date, primaryBooking.time)}
                            light={isLight}
                          />

                          <KeyValue
                            label={copy.phone}
                            value={primaryBooking.clientPhone}
                            light={isLight}
                          />

                          <KeyValue
                            label={copy.status}
                            value={formatStatusValue(primaryBooking.status)}
                            light={isLight}
                          />
                        </div>
                      </Panel>

                      <ListBox light={isLight}>
                        <ListRow>
                          <div className={cn('text-[11px] font-medium', mutedText(isLight))}>
                            {copy.queue}
                          </div>
                        </ListRow>

                        {secondaryBookings.length ? (
                          secondaryBookings.map((booking) => {
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
                                  isLight
                                    ? 'hover:bg-black/[0.018]'
                                    : 'hover:bg-white/[0.028]',
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

                                  <div className="grid gap-3 px-4 py-3.5 lg:grid-cols-[minmax(0,1fr)_170px_150px] lg:items-center">
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
                                      </div>
                                    </div>

                                    <BookingDateCell
                                      date={booking.date}
                                      time={booking.time}
                                      locale={locale}
                                      light={isLight}
                                    />

                                    <div className="lg:justify-self-end">
                                      <StatusBadge
                                        status={booking.status}
                                        locale={locale}
                                        light={isLight}
                                                                  publicAccentColor={publicAccentColor}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </ListRow>
                            );
                          })
                        ) : (
                          <ListRow>
                            <div className={cn('text-[12px]', mutedText(isLight))}>
                              {copy.emptyQueue}
                            </div>
                          </ListRow>
                        )}
                      </ListBox>
                    </div>
                  ) : (
                    <EmptyState light={isLight}>{copy.emptyBookings}</EmptyState>
                  )}
                </div>
              </Card>

              <Card light={isLight}>
                <CardTitle
                  title={copy.servicesTitle}
                  description={copy.servicesDescription}
                  light={isLight}
                />

                <div className="p-4">
                  {topServices.length ? (
                    <ListBox light={isLight}>
                      {topServices.map((service, index) => (
                        <ListRow key={service.id} className="py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn(
                                    'inline-flex h-6 items-center rounded-[8px] border px-2 text-[10px] font-semibold',
                                    isLight
                                      ? 'border-black/[0.08] bg-white text-black/48'
                                      : 'border-white/[0.08] bg-white/[0.04] text-white/44',
                                  )}
                                >
                                  #{index + 1}
                                </span>

                                <div
                                  className={cn(
                                    'truncate text-[13px] font-semibold',
                                    pageText(isLight),
                                  )}
                                >
                                  {service.name}
                                </div>
                              </div>

                              <div className={cn('mt-2 text-[11px]', mutedText(isLight))}>
                                {service.bookings} {copy.bookingsWord} ·{' '}
                                {service.duration} {copy.minWord}
                              </div>
                            </div>

                            <div
                              className={cn(
                                'shrink-0 text-[13px] font-semibold',
                                pageText(isLight),
                              )}
                            >
                              {formatCurrency(service.revenue, locale)}
                            </div>
                          </div>

                          <ProgressLine
                            value={service.popularity}
                            color={accentColor}
                            light={isLight}
                          />
                        </ListRow>
                      ))}
                    </ListBox>
                  ) : (
                    <EmptyState light={isLight}>{copy.emptyServices}</EmptyState>
                  )}
                </div>
              </Card>
            </div>

            <Card light={isLight}>
              <CardTitle
                title={copy.weekTitle}
                description={copy.weekDescription}
                light={isLight}
              />

              <div className="space-y-4 p-4">
                <ControlGroup light={isLight} className="max-w-full overflow-x-auto">
                  {trendMetricOptions.map((item) => (
                    <FilterChip
                      key={item.value}
                      label={item.label}
                      active={trendMetric === item.value}
                      onClick={() => setTrendMetric(item.value)}
                      light={isLight}
                            />
                  ))}
                </ControlGroup>

                <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <Panel light={isLight} className="p-4">
                      <div className={cn('text-[11px] font-medium', mutedText(isLight))}>
                        {trendMetricOptions.find((item) => item.value === trendMetric)?.label}
                      </div>

                      <div
                        className={cn(
                          'mt-1.5 text-[22px] font-semibold tracking-[-0.025em]',
                          pageText(isLight),
                        )}
                      >
                        {activeTrendValue}
                      </div>

                      <div className={cn('mt-1 text-[11px]', mutedText(isLight))}>
                        {trendSummary && trendSummary.revenueDelta >= 0
                          ? `+${trendSummary.revenueDelta}%`
                          : `${trendSummary?.revenueDelta ?? 0}%`}
                      </div>
                    </Panel>

                    <Panel light={isLight} className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className={cn('text-[10.5px] font-medium', mutedText(isLight))}>
                            {copy.confirmedShort}
                          </div>

                          <div
                            className={cn(
                              'mt-1 text-[18px] font-semibold tracking-[-0.04em]',
                              pageText(isLight),
                            )}
                          >
                            {trendSummary?.confirmed ?? 0}
                          </div>
                        </div>

                        <div>
                          <div className={cn('text-[10.5px] font-medium', mutedText(isLight))}>
                            {copy.averageCheck}
                          </div>

                          <div
                            className={cn(
                              'mt-1 text-[18px] font-semibold tracking-[-0.04em]',
                              pageText(isLight),
                            )}
                          >
                            {formatCurrency(dataset.totals.averageCheck, locale)}
                          </div>
                        </div>
                      </div>
                    </Panel>

                    <ListBox light={isLight} className="sm:col-span-2 xl:col-span-1">
                      {[...weekTrendData]
                        .slice(-3)
                        .reverse()
                        .map((item) => (
                          <ListRow key={item.date}>
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className={cn('text-[12px] font-medium', pageText(isLight))}>
                                  {item.label}
                                </div>

                                <div
                                  className={cn(
                                    'mt-1 truncate text-[10.5px]',
                                    mutedText(isLight),
                                  )}
                                >
                                  {item.requests} {copy.requestsWord} ·{' '}
                                  {item.confirmed} {copy.confirmedWord}
                                </div>
                              </div>

                              <div
                                className={cn(
                                  'shrink-0 text-[12px] font-semibold',
                                  pageText(isLight),
                                )}
                              >
                                {formatCurrency(item.revenue, locale)}
                              </div>
                            </div>
                          </ListRow>
                        ))}
                    </ListBox>
                  </div>

                  <Panel light={isLight} className="p-3">
                    <ChartContainer config={chartConfig} className="h-[340px] w-full">
                      {trendMetric === 'revenue' ? (
                        <AreaChart data={weekTrendData}>
                          <defs>
                            <linearGradient
                              id="dashboardMinimalRevenue"
                              x1="0"
                              x2="0"
                              y1="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="var(--color-revenue)"
                                stopOpacity={0.16}
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
                            fill="url(#dashboardMinimalRevenue)"
                            strokeWidth={2.1}
                          />
                        </AreaChart>
                      ) : null}

                      {trendMetric === 'requests' ? (
                        <BarChart data={weekTrendData}>
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

                      {trendMetric === 'visitors' ? (
                        <LineChart data={weekTrendData}>
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
                    </ChartContainer>
                  </Panel>
                </div>
              </div>
            </Card>

            <Card light={isLight}>
              <CardTitle
                title={copy.clientsTitle}
                description={copy.clientsDescription}
                light={isLight}
              />

              <div className="p-4">
                {favoriteClients.length ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {favoriteClients.map((client) => (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => setSelectedFavoriteClientId(client.id)}
                        className={cn(
                          'rounded-[10px] border p-4 text-left transition-colors active:scale-[0.992]',
                          insetTone(isLight),
                          isLight ? 'hover:bg-black/[0.025]' : 'hover:bg-white/[0.055]',
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className={cn('truncate text-[13px] font-semibold', pageText(isLight))}>
                              {client.name}
                            </div>

                            <div className={cn('mt-1 text-[11px]', mutedText(isLight))}>
                              {client.visits} {copy.visitsWord} · {formatCurrency(client.averageCheck, locale)}
                            </div>
                          </div>

                          <MicroLabel light={isLight}>{client.segment}</MicroLabel>
                        </div>

                        <p className={cn('mt-3 line-clamp-2 text-[12px] leading-6', mutedText(isLight))}>
                          {client.note}
                        </p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <EmptyState light={isLight}>{copy.emptyClients}</EmptyState>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>

      {selectedFavoriteClient ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center px-4 py-6"
          onMouseDown={() => setSelectedFavoriteClientId(null)}
        >
          <div className="absolute inset-0 bg-black/35 backdrop-blur-[10px]" />
          <div
            onMouseDown={(event) => event.stopPropagation()}
            className={cn(
              'relative w-full max-w-[520px] overflow-hidden rounded-[18px] border p-5',
              isLight
                ? 'border-black/[0.09] bg-[var(--cb-surface)] text-[#111111] shadow-[0_34px_90px_rgba(0,0,0,0.18)]'
                : 'border-white/[0.10] bg-[#141414] text-white shadow-[0_34px_90px_rgba(0,0,0,0.55)]',
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <MicroLabel light={isLight} active accentColor={accentColor}>VIP</MicroLabel>
                <h2 className="mt-2 truncate text-[19px] font-semibold tracking-[-0.025em]">
                  {selectedFavoriteClient.name}
                </h2>
                <p className={cn('mt-1 text-[12px]', mutedText(isLight))}>
                  {selectedFavoriteClient.phone} · {selectedFavoriteClient.source}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFavoriteClientId(null)}
                className={cn(buttonBase(isLight), 'size-9 px-0')}
              >
                ×
              </button>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <HeroStat label={copy.visitsWord} value={selectedFavoriteClient.visits} light={isLight} />
              <HeroStat label={copy.revenue} value={formatCurrency(selectedFavoriteClient.totalRevenue, locale)} light={isLight} />
            </div>

            <Panel light={isLight} className="mt-4 p-4">
              <div className={cn('text-[12.5px] font-semibold', pageText(isLight))}>Заметка</div>
              <p className={cn('mt-2 text-[12px] leading-6', mutedText(isLight))}>
                {selectedFavoriteClient.note}
              </p>
            </Panel>

            <div className="mt-4 flex justify-end gap-2">
              <Button asChild className={buttonBase(isLight)}>
                <Link href="/dashboard/clients">Открыть CRM</Link>
              </Button>
              <button type="button" onClick={() => setSelectedFavoriteClientId(null)} className={buttonBase(isLight, true)}>
                Готово
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </WorkspaceShell>
  );
}
