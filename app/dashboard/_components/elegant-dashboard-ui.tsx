'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  CalendarDays,
  ChevronDown,
  Command,
  Search,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { type ReactNode, useMemo } from 'react';

import { useOwnedWorkspaceData } from '@/hooks/use-owned-workspace-data';
import { formatCurrency } from '@/lib/master-workspace';
import type { Booking, BookingStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { NumberPopIn } from '@/components/ui/number-pop-in';

export type ElegantTone = 'navy' | 'coral' | 'violet' | 'green' | 'gold' | 'blue' | 'peach';

export const toneMap: Record<ElegantTone, { text: string; bg: string; soft: string; border: string; dot: string }> = {
  navy: { text: 'text-[#071c39]', bg: 'bg-[#071c39]', soft: 'bg-[#071c39]/7', border: 'border-[#071c39]/12', dot: 'bg-[#071c39]' },
  coral: { text: 'text-[#ff684f]', bg: 'bg-[#ff684f]', soft: 'bg-[#ff684f]/10', border: 'border-[#ff684f]/18', dot: 'bg-[#ff684f]' },
  violet: { text: 'text-[#7a5cff]', bg: 'bg-[#7a5cff]', soft: 'bg-[#7a5cff]/10', border: 'border-[#7a5cff]/16', dot: 'bg-[#7a5cff]' },
  green: { text: 'text-[#6f9b5c]', bg: 'bg-[#6f9b5c]', soft: 'bg-[#6f9b5c]/12', border: 'border-[#6f9b5c]/18', dot: 'bg-[#6f9b5c]' },
  gold: { text: 'text-[#c89a43]', bg: 'bg-[#c89a43]', soft: 'bg-[#c89a43]/12', border: 'border-[#c89a43]/18', dot: 'bg-[#c89a43]' },
  blue: { text: 'text-[#2563eb]', bg: 'bg-[#2563eb]', soft: 'bg-[#2563eb]/10', border: 'border-[#2563eb]/16', dot: 'bg-[#2563eb]' },
  peach: { text: 'text-[#f08b6b]', bg: 'bg-[#f08b6b]', soft: 'bg-[#f08b6b]/12', border: 'border-[#f08b6b]/18', dot: 'bg-[#f08b6b]' },
};

const navItems = [
  { href: '/dashboard', label: 'Обзор' },
  { href: '/dashboard/today', label: 'Записи' },
  { href: '/dashboard/clients', label: 'Клиенты' },
  { href: '/dashboard/services', label: 'Услуги' },
  { href: '/dashboard/finance', label: 'Финансы' },
  { href: '/dashboard/stats', label: 'Аналитика' },
  { href: '/dashboard/profile', label: 'Настройки' },
];

export function initials(name?: string) {
  const safe = (name || 'КликБук').trim();
  return safe
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'КБ';
}

export function ruDate(value?: string) {
  const date = value ? new Date(`${value}T00:00:00`) : new Date();
  if (Number.isNaN(date.getTime())) return value || 'Сегодня';
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(date);
}

export function dateRangeLabel() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  const day = start.getDay();
  start.setDate(today.getDate() - ((day + 6) % 7));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.getDate()} — ${end.getDate()} ${new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(end)}`;
}

export function todayIso() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function parseBookingTime(booking: Booking) {
  const date = new Date(`${booking.date}T${booking.time || '00:00'}:00`);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

export function bookingAmount(booking: Booking, fallback = 0) {
  if (typeof booking.priceAmount === 'number' && booking.priceAmount > 0) return booking.priceAmount;
  const match = String(booking.service || '').match(/([\d\s]{3,})\s*(?:₽|р|rub)/i);
  if (!match?.[1]) return fallback;
  const value = Number(match[1].replace(/\s+/g, ''));
  return Number.isFinite(value) ? value : fallback;
}

export function statusLabel(status: BookingStatus) {
  const labels: Record<BookingStatus, string> = {
    new: 'Ожидает',
    confirmed: 'Подтверждена',
    completed: 'Завершена',
    no_show: 'Неявка',
    cancelled: 'Отменена',
  };
  return labels[status];
}

export function statusTone(status: BookingStatus): ElegantTone {
  if (status === 'confirmed') return 'green';
  if (status === 'new') return 'gold';
  if (status === 'completed') return 'violet';
  if (status === 'cancelled' || status === 'no_show') return 'coral';
  return 'navy';
}

export function makeValues(seed: number, count = 7) {
  return Array.from({ length: count }, (_, index) => {
    const wave = Math.sin((seed + index) * 1.27) * 0.32 + Math.cos((seed + index) * 0.72) * 0.18;
    return Math.max(8, Math.round(48 + wave * 38 + index * 5));
  });
}

export function ElegantShell({ children, className }: { children: ReactNode; className?: string }) {
  const pathname = usePathname();
  const { ownedProfile, bookings } = useOwnedWorkspaceData();
  const unread = Math.max(1, Math.min(9, bookings.filter((booking) => booking.status === 'new').length || 3));

  return (
    <main className={cn('min-h-screen bg-[#fbfaf7] text-[#081a33] antialiased', className)}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-20 top-16 h-[520px] w-[520px] rounded-full border border-[#f2d2be]/35" />
        <div className="absolute -left-28 top-20 h-[650px] w-[650px] rounded-full border border-[#f2d2be]/18" />
        <div className="absolute right-0 top-0 h-[360px] w-[360px] rounded-full bg-[#f7eadf]/35 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 border-b border-[#eadfd5]/70 bg-[#fbfaf7]/86 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-[1920px] items-center gap-8 px-8 2xl:px-12">
          <Link href="/dashboard" className="group flex shrink-0 items-center gap-2">
            <span className="font-serif text-[29px] leading-none tracking-[-0.045em] text-[#071c39]">
              Клик<span className="text-[#ff684f]">Бук</span>
            </span>
            <Sparkles className="mb-5 size-4 text-[#ff8c5a] transition-transform group-hover:rotate-12" />
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-8 xl:flex">
            {navItems.map((item) => {
              const isRoot = item.href === '/dashboard';
              const active = isRoot ? pathname === item.href : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'relative py-6 text-[14px] font-medium text-[#081a33]/58 transition hover:text-[#081a33]',
                    active && 'text-[#081a33]',
                  )}
                >
                  {item.label}
                  {active ? (
                    <span className="absolute bottom-3 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-[#ff684f] shadow-[0_0_0_5px_rgba(255,104,79,0.12)]" />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto hidden h-10 min-w-[280px] items-center gap-3 rounded-2xl border border-[#eadfd5] bg-white/72 px-4 shadow-[0_10px_28px_rgba(8,26,51,0.035)] lg:flex">
            <Search className="size-4 text-[#8c94a3]" />
            <span className="flex-1 text-[13px] text-[#8c94a3]">Поиск по клиентам и записям</span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-[#f4f0eb] px-2 py-1 text-[11px] text-[#8c94a3]"><Command className="size-3" />K</span>
          </div>

          <button className="hidden h-10 items-center gap-2 rounded-2xl border border-[#eadfd5] bg-white/72 px-4 text-[13px] font-medium shadow-[0_10px_28px_rgba(8,26,51,0.035)] md:flex">
            <CalendarDays className="size-4 text-[#071c39]/58" />
            {dateRangeLabel()}
            <ChevronDown className="size-4 text-[#071c39]/42" />
          </button>

          <button className="relative grid size-10 place-items-center rounded-full border border-[#eadfd5] bg-white/72 shadow-[0_10px_28px_rgba(8,26,51,0.035)]">
            <Bell className="size-5 text-[#071c39]/70" />
            <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#ff684f] text-[10px] font-bold text-white">{unread}</span>
          </button>

          <div className="flex min-w-0 items-center gap-3">
            <Avatar name={ownedProfile?.name || 'Алина'} image={ownedProfile?.avatar} className="size-10" />
            <div className="hidden min-w-0 md:block">
              <div className="truncate text-[13px] font-semibold">{ownedProfile?.name || 'Алина'}</div>
              <div className="truncate text-[11px] text-[#081a33]/48">{ownedProfile?.profession || 'Владелец'}</div>
            </div>
            <ChevronDown className="hidden size-4 text-[#081a33]/45 md:block" />
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-[1920px] px-8 py-8 2xl:px-12">{children}</div>
    </main>
  );
}

export function PageHeading({ title, children, eyebrow, action }: { title: string; children?: ReactNode; eyebrow?: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow ? <p className="mb-2 text-[15px] font-medium text-[#ff684f]">{eyebrow}</p> : null}
        <h1 className="font-serif text-[52px] leading-[0.95] tracking-[-0.06em] text-[#071c39] md:text-[64px]">{title}</h1>
        {children ? <div className="mt-4 max-w-2xl text-[16px] leading-6 text-[#566070]">{children}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-[26px] border border-[#eadfd5] bg-white/74 shadow-[0_22px_70px_rgba(8,26,51,0.045)] backdrop-blur-xl', className)}>
      {children}
    </section>
  );
}

export function SoftPanel({ children, className, tone = 'peach' }: { children: ReactNode; className?: string; tone?: ElegantTone }) {
  return (
    <div className={cn('rounded-[22px] border p-4', toneMap[tone].soft, toneMap[tone].border, className)}>
      {children}
    </div>
  );
}

export function Avatar({ name, image, className, tone = 'coral' }: { name?: string; image?: string; className?: string; tone?: ElegantTone }) {
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={image} alt={name || 'avatar'} className={cn('rounded-full object-cover ring-2 ring-white', className || 'size-10')} />
    );
  }
  return (
    <div className={cn('grid rounded-full text-[12px] font-bold text-white ring-2 ring-white', toneMap[tone].bg, className || 'size-10 place-items-center')}>
      {initials(name)}
    </div>
  );
}

export function PrimaryButton({ children, href, className }: { children: ReactNode; href?: string; className?: string }) {
  const classes = cn('inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#071c39] px-5 text-[13px] font-semibold text-white shadow-[0_18px_40px_rgba(7,28,57,0.18)] transition hover:-translate-y-0.5', className);
  if (href) return <Link href={href} className={classes}>{children}</Link>;
  return <button className={classes}>{children}</button>;
}

export function SecondaryButton({ children, href, className }: { children: ReactNode; href?: string; className?: string }) {
  const classes = cn('inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#eadfd5] bg-white/78 px-5 text-[13px] font-semibold text-[#071c39] shadow-[0_14px_34px_rgba(8,26,51,0.04)] transition hover:-translate-y-0.5', className);
  if (href) return <Link href={href} className={classes}>{children}</Link>;
  return <button className={classes}>{children}</button>;
}

export function MetricTile({ label, value, hint, icon: Icon, tone = 'peach', dark = false, values }: { label: string; value: string | number; hint?: string; icon?: LucideIcon; tone?: ElegantTone; dark?: boolean; values?: number[] }) {
  return (
    <Card className={cn('overflow-hidden p-5', dark && 'border-[#0d2a50] bg-[#071c39] text-white shadow-[0_26px_70px_rgba(7,28,57,0.22)]')}>
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className={cn('text-[13px] font-medium', dark ? 'text-white/70' : 'text-[#566070]')}>{label}</p>
          <div className={cn('mt-3 text-[30px] font-semibold tracking-[-0.05em]', dark ? 'text-white' : 'text-[#071c39]')}><NumberPopIn value={value} /></div>
          {hint ? <p className={cn('mt-3 text-[12px]', dark ? 'text-emerald-200' : 'text-[#5d8d48]')}>{hint}</p> : null}
        </div>
        {Icon ? <div className={cn('grid size-12 place-items-center rounded-full', dark ? 'bg-white/10 text-white' : `${toneMap[tone].soft} ${toneMap[tone].text}`)}><Icon className="size-5" /></div> : null}
      </div>
      {values ? <MiniLine values={values} className="mt-5 h-12" tone={tone} /> : null}
    </Card>
  );
}

export function SectionTitle({ title, action, subtitle }: { title: string; action?: ReactNode; subtitle?: string }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-[18px] font-semibold tracking-[-0.03em] text-[#071c39]">{title}</h2>
        {subtitle ? <p className="mt-1 text-[13px] text-[#7c8492]">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function MiniLine({ values, tone = 'coral', className, fill = true }: { values: number[]; tone?: ElegantTone; className?: string; fill?: boolean }) {
  const points = useMemo(() => {
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = Math.max(1, max - min);
    return values.map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * 100;
      const y = 80 - ((value - min) / range) * 58;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }, [values]);
  const color = tone === 'navy' ? '#071c39' : tone === 'green' ? '#6f9b5c' : tone === 'violet' ? '#7a5cff' : tone === 'gold' ? '#c89a43' : tone === 'blue' ? '#2563eb' : '#ff684f';
  return (
    <svg viewBox="0 0 100 84" preserveAspectRatio="none" className={cn('w-full overflow-visible', className)}>
      {fill ? <polyline points={`0,84 ${points} 100,84`} fill={color} opacity="0.10" stroke="none" /> : null}
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="100" cy={points.split(' ').at(-1)?.split(',')[1] || 20} r="2.2" fill={color} />
    </svg>
  );
}

export function Donut({ value, tone = 'coral', label, size = 132 }: { value: number; tone?: ElegantTone; label?: string; size?: number }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(value, 100)) / 100) * circumference;
  const color = tone === 'green' ? '#6f9b5c' : tone === 'violet' ? '#7a5cff' : tone === 'gold' ? '#c89a43' : tone === 'blue' ? '#2563eb' : '#ff684f';
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 112 112" className="-rotate-90">
        <circle cx="56" cy="56" r={radius} fill="none" stroke="#f1e7dc" strokeWidth="12" />
        <circle cx="56" cy="56" r={radius} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="absolute text-center">
        <div className="text-[28px] font-semibold tracking-[-0.05em] text-[#071c39]"><NumberPopIn value={`${value}%`} /></div>
        {label ? <div className="text-[11px] text-[#7c8492]">{label}</div> : null}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  const tone = statusTone(status);
  return <span className={cn('inline-flex rounded-full px-3 py-1 text-[11px] font-semibold', toneMap[tone].soft, toneMap[tone].text)}>{statusLabel(status)}</span>;
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="grid min-h-[180px] place-items-center rounded-[22px] border border-dashed border-[#eadfd5] bg-white/45 p-8 text-center">
      <div>
        <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-[#ff684f]/10 text-[#ff684f]"><Sparkles className="size-5" /></div>
        <h3 className="font-serif text-[26px] tracking-[-0.04em] text-[#071c39]">{title}</h3>
        {children ? <p className="mt-2 max-w-md text-[14px] leading-6 text-[#6a7280]">{children}</p> : null}
      </div>
    </div>
  );
}

export function useElegantWorkspace() {
  const data = useOwnedWorkspaceData();
  const profileName = data.ownedProfile?.name || 'Алина';
  const profession = data.ownedProfile?.profession || 'Владелец';
  const today = todayIso();
  const bookings = data.bookings || [];
  const todayBookings = bookings.filter((booking) => booking.date === today && booking.status !== 'cancelled' && booking.status !== 'no_show');
  const activeBookings = bookings.filter((booking) => booking.status !== 'cancelled' && booking.status !== 'no_show');
  const upcomingBookings = activeBookings
    .filter((booking) => parseBookingTime(booking) >= Date.now() - 24 * 60 * 60 * 1000)
    .sort((left, right) => parseBookingTime(left) - parseBookingTime(right));
  const revenue = activeBookings.reduce((sum, booking, index) => sum + bookingAmount(booking, 1800 + (index % 4) * 700), 0);
  const completedRevenue = bookings.filter((booking) => booking.status === 'completed').reduce((sum, booking, index) => sum + bookingAmount(booking, 2000 + (index % 3) * 800), 0);
  const averageCheck = Math.round(revenue / Math.max(1, activeBookings.length));
  const clients = data.dataset?.clients || [];
  const services = data.dataset?.services || [];
  const totals = data.dataset?.totals;

  return {
    ...data,
    profileName,
    profession,
    today,
    todayBookings,
    activeBookings,
    upcomingBookings,
    revenue: totals?.revenue || revenue,
    completedRevenue: totals?.revenue || completedRevenue || revenue,
    averageCheck: totals?.averageCheck || averageCheck,
    clients,
    services,
    totals,
    money(value: number) {
      return formatCurrency(value, 'ru');
    },
  };
}

export function formatPhone(phone?: string) {
  return phone || '+7 999 123-45-67';
}

export function getServiceName(booking?: Booking) {
  return booking?.service || 'Маникюр + гель-лак';
}

export function weekDays() {
  const labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  const day = base.getDay();
  base.setDate(base.getDate() - ((day + 6) % 7));
  return labels.map((label, index) => {
    const date = new Date(base);
    date.setDate(base.getDate() + index);
    return { label, day: date.getDate(), iso: todayIso() };
  });
}
