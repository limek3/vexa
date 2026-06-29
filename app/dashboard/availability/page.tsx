// app/dashboard/availability/page.tsx
'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import {
  ArrowRight,
  CalendarRange,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Lock,
  RotateCcw,
  Sparkles,
  SquarePen,
  Trash2,
  X,
} from 'lucide-react';

import { WorkspaceShell } from '@/components/shared/workspace-shell';
import { useOwnedWorkspaceData } from '@/hooks/use-owned-workspace-data';
import { useWorkspaceSection } from '@/hooks/use-workspace-section';
import { useAppearance } from '@/lib/appearance-context';
import { accentPalette } from '@/lib/appearance-palette';
import { type AvailabilityDayInsight } from '@/lib/master-workspace';
import { cn } from '@/lib/utils';
import {
  menuItemCheckSlotClass,
  menuItemIconClass,
  menuItemInnerClass,
  menuItemLabelClass,
  menuItemLeftClass,
  menuSeparatorClass,
} from '@/lib/menu-styles';

type ThemeMode = 'light' | 'dark';

type MonthAvailabilityDay = AvailabilityDayInsight & {
  date: string;
  monthKey: string;
  dayNumber: number;
  weekdayIndex: number;
  custom?: boolean;
};

type MonthPreset = 'workweek' | 'dense' | 'weekendsOff' | 'clear';
type DayPreset = 'workday' | 'short' | 'off';

type DayContextMenuState = {
  iso: string;
  x: number;
  y: number;
};

type AvailabilityEditorLabels = {
  editorTitle: string;
  editorDescription: string;
  workday: string;
  short: string;
  dayOff: string;
  slots: string;
  delete: string;
  block1: string;
  block2: string;
  block3: string;
  dayStatus: string;
  quickPresets: string;
  totalWork: string;
  selectedSlots: string;
  clearSlots: string;
  noSlots: string;
  manualSlotsHint: string;
};

const SLOT_START_HOUR = 8;
const SLOT_END_HOUR = 22;

const HOUR_SLOTS = Array.from({ length: SLOT_END_HOUR - SLOT_START_HOUR }, (_, index) => {
  const startHour = SLOT_START_HOUR + index;
  const endHour = startHour + 1;
  const start = `${String(startHour).padStart(2, '0')}:00`;
  const end = `${String(endHour).padStart(2, '0')}:00`;

  return {
    start,
    end,
    interval: `${start}–${end}`,
  };
});

function getFullDaySlots() {
  return HOUR_SLOTS.map((slot) => slot.interval);
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function toISODate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function fromISODate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function getMondayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

function startOfWeekMonday(date: Date) {
  return addDays(date, -getMondayIndex(date));
}

function isSameMonth(date: Date, month: Date) {
  return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
}

function isToday(date: Date) {
  return toISODate(new Date()) === toISODate(date);
}

function getMonthTitle(date: Date, locale: 'ru' | 'en') {
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getWeekdayLabels(locale: 'ru' | 'en') {
  return locale === 'ru'
    ? ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС']
    : ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
}

function getWeekdayName(index: number, locale: 'ru' | 'en') {
  const ru = [
    'понедельник',
    'вторник',
    'среда',
    'четверг',
    'пятница',
    'суббота',
    'воскресенье',
  ];
  const en = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return locale === 'ru' ? ru[index] : en[index];
}

function getShortDateLabel(date: Date, locale: 'ru' | 'en') {
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'long',
  }).format(date);
}

function getCalendarDates(month: Date) {
  const firstDay = startOfMonth(month);
  const gridStart = startOfWeekMonday(firstDay);

  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function isStoredMonthDay(value: unknown): value is MonthAvailabilityDay {
  if (!value || typeof value !== 'object') return false;
  return 'date' in value && typeof (value as { date?: unknown }).date === 'string';
}

function splitInterval(value: string) {
  const [startRaw, endRaw] = value.split('–').map((item) => item.trim());

  return {
    start: startRaw || '',
    end: endRaw || '',
  };
}

function timeToMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number);

  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;

  return hour * 60 + minute;
}

function parseIntervalMinutes(value: string) {
  const { start, end } = splitInterval(value);
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  if (startMinutes === null || endMinutes === null) return 0;

  return Math.max(0, endMinutes - startMinutes);
}

function getTotalMinutes(items: readonly string[]) {
  return items.reduce((total, item) => total + parseIntervalMinutes(item), 0);
}

function formatMinutes(value: number, locale: 'ru' | 'en') {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  if (value <= 0) return '—';

  if (locale === 'ru') {
    if (minutes === 0) return `${hours} ч`;
    return `${hours} ч ${minutes} мин`;
  }

  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

function normalizeToHourSlots(items: readonly string[]) {
  const selected = new Set<string>();

  for (const item of items) {
    const { start, end } = splitInterval(item);
    const startMinutes = timeToMinutes(start);
    const endMinutes = timeToMinutes(end);

    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
      continue;
    }

    for (const slot of HOUR_SLOTS) {
      const slotStart = timeToMinutes(slot.start);
      const slotEnd = timeToMinutes(slot.end);

      if (slotStart === null || slotEnd === null) continue;

      if (slotStart >= startMinutes && slotEnd <= endMinutes) {
        selected.add(slot.interval);
      }
    }
  }

  return HOUR_SLOTS.filter((slot) => selected.has(slot.interval)).map((slot) => slot.interval);
}

function sortHourSlots(items: string[]) {
  const order = new Map(HOUR_SLOTS.map((slot, index) => [slot.interval, index]));

  return [...items].sort((left, right) => {
    return (order.get(left) ?? 999) - (order.get(right) ?? 999);
  });
}

function getStatusLabel(
  status: AvailabilityDayInsight['status'],
  labels: Pick<AvailabilityEditorLabels, 'workday' | 'short' | 'dayOff'>,
) {
  if (status === 'workday') return labels.workday;
  if (status === 'short') return labels.short;
  return labels.dayOff;
}

function createDayFromDate(
  date: Date,
  locale: 'ru' | 'en',
  weeklyTemplates: AvailabilityDayInsight[],
): MonthAvailabilityDay {
  const weekdayIndex = getMondayIndex(date);
  const template = weeklyTemplates[weekdayIndex];
  const iso = toISODate(date);

  const fallbackStatus: AvailabilityDayInsight['status'] =
    weekdayIndex === 6 ? 'day-off' : weekdayIndex === 5 ? 'short' : 'workday';

  return {
    id: `availability-${iso}`,
    date: iso,
    monthKey: monthKey(date),
    dayNumber: date.getDate(),
    weekdayIndex,
    label: template?.label ?? getWeekdayName(weekdayIndex, locale),
    status: template?.status ?? fallbackStatus,
    slots: template?.slots ? normalizeToHourSlots(template.slots) : [],
    breaks: [],
    custom: false,
  };
}

function createMonthDays(
  locale: 'ru' | 'en',
  month: Date,
  weeklyTemplates: AvailabilityDayInsight[],
) {
  const first = startOfMonth(month);
  const key = monthKey(first);
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) =>
    createDayFromDate(
      new Date(first.getFullYear(), first.getMonth(), index + 1),
      locale,
      weeklyTemplates,
    ),
  ).map((day) => ({ ...day, monthKey: key }));
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

function disabledButtonClass() {
  return 'disabled:pointer-events-none disabled:opacity-40';
}

function glassMenuContentClass(light: boolean) {
  return cn(
    'relative overflow-hidden rounded-[14px] border p-1 shadow-none outline-none',
    'backdrop-blur-[34px] [-webkit-backdrop-filter:blur(34px)_saturate(1.35)]',
    light ? 'border-black/[0.08] text-black' : 'border-white/[0.09] text-white',
  );
}

function glassMenuSurfaceStyle(light: boolean, accentColor: string): CSSProperties {
  return {
    background: light ? 'rgba(255,255,255,0.58)' : 'rgba(32,32,32,0.52)',
    boxShadow: 'none',
    backdropFilter: 'blur(38px) saturate(1.45)',
    WebkitBackdropFilter: 'blur(38px) saturate(1.45)',
    ['--menu-accent' as string]: accentColor,
  };
}

function glassMenuItemClass(light: boolean, active = false, danger = false) {
  return cn(
    'relative flex w-full cursor-pointer select-none items-center rounded-[10px] border border-transparent px-3 py-3 text-[12px] font-medium outline-none',
    'transition-[background,border-color,color,transform] duration-150 active:scale-[0.992]',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',

    light
      ? [
          'text-black/66',
          'hover:bg-black/[0.07] hover:text-black',
          'focus:bg-black/[0.07] focus:text-black',
          'data-[highlighted]:bg-black/[0.07] data-[highlighted]:text-black',
        ]
      : [
          'text-white/68',
          'hover:bg-white/[0.11] hover:text-white',
          'focus:bg-white/[0.11] focus:text-white',
          'data-[highlighted]:bg-white/[0.11] data-[highlighted]:text-white',
        ],

    active && (light ? 'bg-black/[0.06] text-black' : 'bg-white/[0.13] text-white'),

    danger &&
      (light
        ? 'text-red-500 hover:bg-red-500/[0.08] hover:text-red-600 focus:bg-red-500/[0.08] focus:text-red-600'
        : 'text-red-300 hover:bg-red-300/[0.12] hover:text-red-200 focus:bg-red-300/[0.12] focus:text-red-200'),
  );
}

function contextMenuClass(light: boolean) {
  return cn(
    glassMenuContentClass(light),
    'w-full origin-top-left will-change-[opacity,transform]',
  );
}

function contextMenuItemClass(light: boolean, active?: boolean, danger = false) {
  return cn(glassMenuItemClass(light, Boolean(active), danger), 'w-full');
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

function dayAccentColor(
  status: AvailabilityDayInsight['status'],
  accentColor: string,
  publicAccentColor: string,
  light: boolean,
) {
  if (status === 'workday') return accentColor;
  if (status === 'short') return publicAccentColor;
  return light ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.24)';
}

function dayStatusHint(status: AvailabilityDayInsight['status'], locale: 'ru' | 'en') {
  if (locale === 'ru') {
    if (status === 'workday') return 'открыто';
    if (status === 'short') return 'коротко';
    return 'закрыто';
  }

  if (status === 'workday') return 'open';
  if (status === 'short') return 'short';
  return 'closed';
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
  actions,
}: {
  title: string;
  description?: string;
  light: boolean;
  actions?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex min-h-[58px] flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
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

      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
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
    <div className={cn('cb-record-popup-panel rounded-[10px] border', insetTone(light), className)}>
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

function ActionLink({
  href,
  children,
  light,
  active,
  className,
}: {
  href: string;
  children: ReactNode;
  light: boolean;
  active?: boolean;
  className?: string;
}) {
  return (
    <Link href={href} className={cn(buttonBase(light, active), className)}>
      {children}
    </Link>
  );
}

function ActionButton({
  children,
  light,
  active,
  disabled,
  onClick,
  className,
}: {
  children: ReactNode;
  light: boolean;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(buttonBase(light, active), disabledButtonClass(), className)}
    >
      {children}
    </button>
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
          {value}
        </div>
      </div>
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
        'flex w-full max-w-full items-stretch overflow-hidden rounded-[12px] border p-0',
        light ? 'border-black/[0.08] bg-white' : 'border-white/[0.08] bg-white/[0.045]',
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
        'group relative flex h-10 min-w-0 flex-1 items-center justify-center border-r px-3 text-[10.5px] font-semibold tracking-[-0.02em] transition-colors duration-150 last:border-r-0 active:scale-[0.985]',
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

function EmptyInfoCard({
  icon,
  label,
  title,
  description,
  light,
}: {
  icon: ReactNode;
  label: string;
  title: string;
  description: string;
  light: boolean;
}) {
  return (
    <Card light={light}>
      <div className="p-4">
        <MicroLabel light={light}>
          {icon}
          {label}
        </MicroLabel>

        <div className={cn('mt-4 text-[13px] font-semibold tracking-[-0.018em]', pageText(light))}>
          {title}
        </div>

        <p className={cn('mt-1 text-[11px] leading-4', mutedText(light))}>{description}</p>
      </div>
    </Card>
  );
}

function IntervalChips({
  items,
  emptyLabel,
  light,
  limit,
}: {
  items: string[];
  emptyLabel: string;
  light: boolean;
  limit?: number;
}) {
  if (!items.length) {
    return <span className={cn('text-[12px]', mutedText(light))}>{emptyLabel}</span>;
  }

  const visibleItems = limit ? items.slice(0, limit) : items;
  const hidden = limit ? items.length - visibleItems.length : 0;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleItems.map((item) => (
        <MicroLabel key={item} light={light}>
          {splitInterval(item).start}
        </MicroLabel>
      ))}

      {hidden > 0 ? <MicroLabel light={light}>+{hidden}</MicroLabel> : null}
    </div>
  );
}

function DayStatusBlock({
  status,
  labels,
  locale,
  light,
  accentColor,
  publicAccentColor,
}: {
  status: AvailabilityDayInsight['status'];
  labels: Pick<AvailabilityEditorLabels, 'workday' | 'short' | 'dayOff'>;
  locale: 'ru' | 'en';
  light: boolean;
  accentColor: string;
  publicAccentColor: string;
}) {
  const color = dayAccentColor(status, accentColor, publicAccentColor, light);

  return (
    <div className="flex min-w-[124px] items-center justify-end gap-2">
      <div className="min-w-0 text-right">
        <div
          className={cn(
            'text-[11.5px] font-semibold leading-none tracking-[-0.018em]',
            light ? 'text-black/72' : 'text-white/74',
          )}
        >
          {getStatusLabel(status, labels)}
        </div>

        <div
          className={cn(
            'mt-1 text-[9.5px] font-medium uppercase tracking-[0.12em]',
            light ? 'text-black/32' : 'text-white/28',
          )}
        >
          {dayStatusHint(status, locale)}
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

function MonthScenarioCard({
  title,
  description,
  icon,
  light,
  danger,
  onClick,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  light: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group rounded-[10px] border p-3 text-left transition active:scale-[0.99]',
        danger
          ? light
            ? 'border-red-500/15 bg-red-500/[0.035] text-red-600 hover:bg-red-500/[0.06]'
            : 'border-red-300/15 bg-red-300/[0.055] text-red-300 hover:bg-red-300/[0.085]'
          : light
            ? 'border-black/[0.08] bg-black/[0.025] text-black/65 hover:bg-black/[0.045] hover:text-black'
            : 'border-white/[0.08] bg-white/[0.035] text-white/60 hover:bg-white/[0.065] hover:text-white',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[12px] font-semibold">{title}</div>

          <div
            className={cn(
              'mt-1 line-clamp-2 text-[10.5px] leading-4',
              danger ? 'opacity-70' : mutedText(light),
            )}
          >
            {description}
          </div>
        </div>

        <span
          className={cn(
            'inline-flex size-7 shrink-0 items-center justify-center rounded-[9px] border',
            danger
              ? 'border-current/10 bg-current/[0.05]'
              : light
                ? 'border-black/[0.07] bg-white text-black/38'
                : 'border-white/[0.07] bg-white/[0.035] text-white/38',
          )}
        >
          {icon}
        </span>
      </div>
    </button>
  );
}

function CompactMonthDay({
  day,
  date,
  outside,
  selected,
  today,
  locale,
  labels,
  light,
  accentColor,
  publicAccentColor,
  onSelect,
  onOpen,
  onContextOpen,
}: {
  day: MonthAvailabilityDay;
  date: Date;
  outside: boolean;
  selected: boolean;
  today: boolean;
  locale: 'ru' | 'en';
  labels: Pick<AvailabilityEditorLabels, 'workday' | 'short' | 'dayOff' | 'noSlots'>;
  light: boolean;
  accentColor: string;
  publicAccentColor: string;
  onSelect: () => void;
  onOpen: () => void;
  onContextOpen: (event: ReactMouseEvent<HTMLButtonElement>) => void;
}) {
  const slots = normalizeToHourSlots(day.slots);
  const workMinutes = getTotalMinutes(slots);
  const isOff = day.status === 'day-off';
  const color = dayAccentColor(day.status, accentColor, publicAccentColor, light);
  const firstSlot = slots[0];

  return (
    <button
      type="button"
      onClick={() => {
        onSelect();
        onOpen();
      }}
      onContextMenu={onContextOpen}
      className={cn(
        'availability-day-card group relative min-h-[82px] cursor-pointer rounded-[10px] border p-2.5 text-left transition active:scale-[0.99]',
        selected
          ? light
            ? 'border-black/[0.14] bg-white shadow-[0_10px_24px_rgba(15,15,15,0.045)]'
            : 'border-white/[0.15] bg-white/[0.06] shadow-[0_16px_34px_rgba(0,0,0,0.22)]'
          : light
            ? 'border-black/[0.065] bg-white/60 hover:border-black/[0.12] hover:bg-white'
            : 'border-white/[0.065] bg-white/[0.032] hover:border-white/[0.12] hover:bg-white/[0.055]',
        outside && 'opacity-35',
      )}
    >
      <span
        style={{ background: color }}
        className="absolute left-0 top-2 h-[calc(100%-16px)] w-[3px] rounded-r-full"
      />

      <div className="ml-1 flex min-h-[62px] flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                'inline-flex size-7 shrink-0 items-center justify-center rounded-[8px] text-[12px] font-semibold tabular-nums',
                selected || today
                  ? 'cb-accent-pill-active'
                  : light
                    ? 'bg-black/[0.035] text-black/62'
                    : 'bg-white/[0.06] text-white/62',
              )}
            >
              {date.getDate()}
            </span>

            <div className="min-w-0">
              <div className={cn('text-[9.5px] font-medium uppercase tracking-[0.12em]', faintText(light))}>
                {getWeekdayLabels(locale)[getMondayIndex(date)]}
              </div>

              <div className={cn('mt-0.5 truncate text-[10.5px]', mutedText(light))}>
                {today ? (locale === 'ru' ? 'сегодня' : 'today') : getShortDateLabel(date, locale)}
              </div>
            </div>
          </div>

          <span
            style={{
              background: color,
              boxShadow: `0 0 0 3px color-mix(in srgb, ${color} 12%, transparent)`,
            }}
            className="mt-1 size-2 shrink-0 rounded-full"
          />
        </div>

        <div className="mt-auto min-w-0 pt-2">
          <div className={cn('truncate text-[11.5px] font-semibold tracking-[-0.012em]', pageText(light))}>
            {getStatusLabel(day.status, labels)}
          </div>

          <div className={cn('mt-1 flex min-w-0 items-center gap-1.5 text-[10.5px]', mutedText(light))}>
            {isOff ? (
              <>
                <Lock className="size-3 shrink-0" />
                <span className="truncate">{locale === 'ru' ? 'закрыто' : 'closed'}</span>
              </>
            ) : firstSlot ? (
              <>
                <span className="truncate">{formatMinutes(workMinutes, locale)}</span>
                <span className={faintText(light)}>·</span>
                <span className="truncate">{splitInterval(firstSlot).start}</span>
              </>
            ) : (
              <span className="truncate">{labels.noSlots}</span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function SlotPicker({
  slots,
  labels,
  locale,
  light,
  accentColor,
  onChange,
}: {
  slots: string[];
  labels: Pick<AvailabilityEditorLabels, 'slots' | 'selectedSlots' | 'clearSlots' | 'noSlots'>;
  locale: 'ru' | 'en';
  light: boolean;
  accentColor: string;
  onChange: (slots: string[]) => void;
}) {
  const selectedSlots = normalizeToHourSlots(slots);
  const selectedSet = new Set(selectedSlots);

  const toggleSlot = (interval: string) => {
    const next = selectedSet.has(interval)
      ? selectedSlots.filter((slot) => slot !== interval)
      : [...selectedSlots, interval];

    onChange(sortHourSlots(next));
  };

  return (
    <Panel light={light} className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={cn('text-[12.5px] font-semibold', pageText(light))}>{labels.slots}</div>

          <div className={cn('mt-1 text-[11px] leading-4', mutedText(light))}>
            {locale === 'ru'
              ? 'Выберите часы работы. Один слот = 1 час.'
              : 'Choose working hours. One slot = 1 hour.'}
          </div>
        </div>

        <MicroLabel light={light} active={selectedSlots.length > 0} accentColor={accentColor}>
          {selectedSlots.length}
        </MicroLabel>
      </div>

      <div className="cb-record-popup-slot-grid mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {HOUR_SLOTS.map((slot) => {
          const active = selectedSet.has(slot.interval);

          return (
            <button
              key={slot.interval}
              type="button"
              onClick={() => toggleSlot(slot.interval)}
              style={
                active
                  ? {
                      background: `color-mix(in srgb, ${accentColor} ${light ? 16 : 24}%, ${
                        light ? '#ffffff' : '#161616'
                      })`,
                      borderColor: `color-mix(in srgb, ${accentColor} ${
                        light ? 36 : 48
                      }%, transparent)`,
                    }
                  : undefined
              }
              className={cn(
                'group min-h-[54px] rounded-[10px] border px-3 py-2 text-left transition active:scale-[0.99]',
                active
                  ? light
                    ? 'text-black'
                    : 'text-white'
                  : light
                    ? 'border-black/[0.07] bg-white text-black/56 hover:border-black/[0.13] hover:bg-black/[0.025] hover:text-black'
                    : 'border-white/[0.07] bg-white/[0.035] text-white/56 hover:border-white/[0.13] hover:bg-white/[0.065] hover:text-white',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[14px] font-semibold tabular-nums tracking-[-0.025em]">
                  {slot.start}
                </span>

                <span
                  style={active ? { background: accentColor } : undefined}
                  className={cn('size-2 rounded-full', active ? '' : light ? 'bg-black/18' : 'bg-white/18')}
                />
              </div>

              <div className={cn('mt-1 text-[10.5px]', active ? mutedText(light) : faintText(light))}>
                {locale === 'ru' ? `до ${slot.end}` : `until ${slot.end}`}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <div className={cn('text-[11px] leading-5', mutedText(light))}>
          {selectedSlots.length
            ? `${labels.selectedSlots}: ${selectedSlots.map((slot) => splitInterval(slot).start).join(', ')}`
            : labels.noSlots}
        </div>

        <ActionButton
          light={light}
          disabled={!selectedSlots.length}
          onClick={() => onChange([])}
          className="w-full"
        >
          <X className="size-3.5" />
          {labels.clearSlots}
        </ActionButton>
      </div>
    </Panel>
  );
}

function DayContextMenu({
  menu,
  day,
  locale,
  light,
  accentColor,
  onClose,
  onFullDay,
  onDayOff,
  onClear,
}: {
  menu: DayContextMenuState | null;
  day: MonthAvailabilityDay | null;
  locale: 'ru' | 'en';
  light: boolean;
  accentColor: string;
  onClose: () => void;
  onFullDay: (iso: string) => void;
  onDayOff: (iso: string) => void;
  onClear: (iso: string) => void;
}) {
  useEffect(() => {
    if (!menu) return;

    const close = () => onClose();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('pointerdown', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menu, onClose]);

  if (!menu || typeof document === 'undefined') return null;

  const width = 260;
  const left =
    typeof window !== 'undefined'
      ? Math.min(menu.x, window.innerWidth - width - 12)
      : menu.x;
  const top =
    typeof window !== 'undefined'
      ? Math.min(menu.y, window.innerHeight - 184)
      : menu.y;

  const normalizedSlots = normalizeToHourSlots(day?.slots ?? []);
  const fullDaySlots = getFullDaySlots();

  const isFullDayActive =
    day?.status === 'workday' &&
    normalizedSlots.length === fullDaySlots.length &&
    fullDaySlots.every((slot) => normalizedSlots.includes(slot));

  const isDayOffActive = day?.status === 'day-off';
  const isClearActive = Boolean(day && !isDayOffActive && normalizedSlots.length === 0);

  const copy =
    locale === 'ru'
      ? {
          fullDay: 'Полный день',
          dayOff: 'Выходной',
          clear: 'Очистить',
        }
      : {
          fullDay: 'Full day',
          dayOff: 'Day off',
          clear: 'Clear',
        };

  function MenuItem({
    label,
    icon,
    active,
    danger,
    onClick,
  }: {
    label: string;
    icon: ReactNode;
    active?: boolean;
    danger?: boolean;
    onClick: () => void;
  }) {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClick();
          onClose();
        }}
        className={contextMenuItemClass(light, active, danger)}
      >
        <div className={cn(menuItemInnerClass(), 'w-full')}>
          <span className={cn(menuItemLeftClass(), 'min-w-0')}>
            <span className={menuItemIconClass(light, danger)}>{icon}</span>

            <span className={cn(menuItemLabelClass(), 'min-w-0 truncate')}>{label}</span>
          </span>

          <span className={cn(menuItemCheckSlotClass(), 'ml-auto shrink-0')}>
            {active ? (
              <Check className="size-3.5" style={{ color: danger ? undefined : accentColor }} />
            ) : null}
          </span>
        </div>
      </button>
    );
  }

  return createPortal(
    <div
      className="fixed z-[140]"
      style={{ left, top, width }}
      onPointerDown={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.965, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
        className={contextMenuClass(light)}
        style={glassMenuSurfaceStyle(light, accentColor)}
      >
        <MenuItem
          label={copy.fullDay}
          icon={<CalendarRange className="size-3.5" />}
          active={isFullDayActive}
          onClick={() => onFullDay(menu.iso)}
        />

        <MenuItem
          label={copy.dayOff}
          icon={<Lock className="size-3.5" />}
          active={isDayOffActive}
          onClick={() => onDayOff(menu.iso)}
        />

        <div className={menuSeparatorClass(light)} />

        <MenuItem
          label={copy.clear}
          icon={<Trash2 className="size-3.5" />}
          active={isClearActive}
          danger
          onClick={() => onClear(menu.iso)}
        />
      </motion.div>
    </div>,
    document.body,
  );
}

function AvailabilityEditorDialog({
  open,
  locale,
  labels,
  day,
  light,
  accentColor,
  publicAccentColor,
  onUpdate,
  onApplyPreset,
  onReset,
  onClose,
}: {
  open: boolean;
  locale: 'ru' | 'en';
  labels: AvailabilityEditorLabels;
  day: MonthAvailabilityDay;
  light: boolean;
  accentColor: string;
  publicAccentColor: string;
  onUpdate: (patch: Partial<MonthAvailabilityDay>) => void;
  onApplyPreset: (preset: DayPreset) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, open]);

  if (!open || typeof document === 'undefined') return null;

  const date = fromISODate(day.date);
  const normalizedSlots = normalizeToHourSlots(day.slots);
  const statusLabel = getStatusLabel(day.status, labels);
  const workMinutes = getTotalMinutes(normalizedSlots);

  const copy =
    locale === 'ru'
      ? {
          title: 'Слоты дня',
          description:
            'Выберите статус дня и часы, которые будут доступны клиентам для онлайн-записи.',
          close: 'Закрыть',
          done: 'Готово',
          date: 'Дата',
          weekday: 'День недели',
          status: 'Статус',
          slots: 'Слоты',
          total: 'Итого часов',
          summary: 'Сводка дня',
          reset: 'Сбросить день',
        }
      : {
          title: 'Day slots',
          description:
            'Choose the day status and hours available to clients for online booking.',
          close: 'Close',
          done: 'Done',
          date: 'Date',
          weekday: 'Weekday',
          status: 'Status',
          slots: 'Slots',
          total: 'Total hours',
          summary: 'Day summary',
          reset: 'Reset day',
        };

  const statusOptions: Array<{
    value: AvailabilityDayInsight['status'];
    label: string;
  }> = [
    { value: 'workday', label: labels.workday },
    { value: 'short', label: labels.short },
    { value: 'day-off', label: labels.dayOff },
  ];

  const presetOptions = [
    {
      key: 'workday' as const,
      label: labels.block1,
      hint: locale === 'ru' ? 'Слоты остаются выбранными' : 'Selected slots stay unchanged',
    },
    {
      key: 'short' as const,
      label: labels.block2,
      hint: locale === 'ru' ? 'Для короткой смены' : 'For a short shift',
    },
    {
      key: 'off' as const,
      label: labels.block3,
      hint: locale === 'ru' ? 'Все слоты будут скрыты' : 'All slots will be hidden',
    },
  ];

  function ModalRow({ label, value }: { label: string; value: string }) {
    return (
      <div
        className={cn(
          'flex items-center justify-between gap-4 border-b py-3 last:border-b-0',
          borderTone(light),
        )}
      >
        <div className={cn('text-[12px]', mutedText(light))}>{label}</div>

        <div
          className={cn(
            'max-w-[150px] truncate rounded-[8px] px-2.5 py-1 text-right text-[12px] font-semibold',
            light ? 'bg-black/[0.025] text-[#111111]' : 'bg-white/[0.04] text-white',
          )}
        >
          {value}
        </div>
      </div>
    );
  }

  function ModalActionButton({
    label,
    hint,
    onClick,
    danger,
    icon,
  }: {
    label: string;
    hint?: string;
    onClick: () => void;
    danger?: boolean;
    icon?: ReactNode;
  }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex min-h-11 w-full items-center justify-between gap-3 rounded-[10px] border px-3 py-2 text-left text-[12px] font-medium transition-colors active:scale-[0.992]',
          danger
            ? light
              ? 'border-red-500/15 bg-red-500/[0.035] text-red-600 hover:bg-red-500/[0.055]'
              : 'border-red-300/15 bg-red-300/[0.05] text-red-300 hover:bg-red-300/[0.075]'
            : light
              ? 'border-black/[0.08] bg-white text-black/62 hover:bg-black/[0.025] hover:text-black'
              : 'border-white/[0.08] bg-white/[0.035] text-white/58 hover:bg-white/[0.06] hover:text-white',
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {icon ? <span className={cn('shrink-0', danger ? '' : mutedText(light))}>{icon}</span> : null}

          <span className="min-w-0">
            <span className="block truncate">{label}</span>
            {hint ? (
              <span
                className={cn(
                  'mt-0.5 block truncate text-[10.5px] font-normal',
                  danger ? 'opacity-70' : mutedText(light),
                )}
              >
                {hint}
              </span>
            ) : null}
          </span>
        </span>

        <ArrowRight className={cn('size-3.5 shrink-0', danger ? '' : mutedText(light))} />
      </button>
    );
  }

  return createPortal(
    <div
      className="cb-record-popup-overlay fixed inset-0 z-[120] flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div className="cb-record-popup-backdrop absolute inset-0" />

      <div
        onMouseDown={(event) => event.stopPropagation()}
        className={cn(
          'cb-record-popup cb-record-popup--availability relative w-full max-w-[780px] overflow-hidden rounded-[18px] border',
          'max-h-[calc(100dvh-32px)]',
          light
            ? 'border-black/[0.09] bg-[var(--cb-surface)] text-[#111111] shadow-[0_34px_90px_rgba(0,0,0,0.18)]'
            : 'border-white/[0.10] bg-[#141414] text-white shadow-[0_34px_90px_rgba(0,0,0,0.55)]',
        )}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background: light
              ? 'linear-gradient(90deg, transparent, rgba(0,0,0,0.16), transparent)'
              : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
          }}
        />

        <div
          data-modal-drag-handle="true"
          className={cn('cb-record-popup-head flex items-start justify-between gap-4 border-b p-5', borderTone(light))}>
          <div className="min-w-0">
            <h2 className="truncate text-[18px] font-semibold leading-none tracking-[-0.02em]">
              {getShortDateLabel(date, locale)}
            </h2>

            <p className={cn('mt-2 max-w-[460px] text-[12.5px] leading-5', mutedText(light))}>
              {copy.description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={cn(
              'grid size-9 shrink-0 place-items-center rounded-[10px] border transition-colors',
              light
                ? 'border-black/[0.08] bg-white text-black/42 hover:bg-black/[0.035] hover:text-black'
                : 'border-white/[0.08] bg-white/[0.04] text-white/42 hover:bg-white/[0.07] hover:text-white',
            )}
            aria-label={copy.close}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="cb-record-popup-body max-h-[calc(100dvh-190px)] overflow-y-auto">
          <div className="cb-record-popup-grid grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_220px]">
            <div className="space-y-4">
              <Panel light={light} className="overflow-hidden">
                <div className={cn('border-b px-4 py-3', borderTone(light))}>
                  <div className={cn('text-[11px] font-medium', mutedText(light))}>
                    {labels.dayStatus}
                  </div>

                  <div className="mt-3">
                    <ControlGroup light={light} className="w-full">
                      {statusOptions.map((option) => (
                        <FilterChip
                          key={option.value}
                          label={option.label}
                          active={day.status === option.value}
                          onClick={() => {
                            if (option.value === 'day-off') {
                              onUpdate({
                                status: option.value,
                                slots: [],
                                breaks: [],
                                custom: true,
                              });
                              return;
                            }

                            onUpdate({
                              status: option.value,
                              custom: true,
                            });
                          }}
                          light={light}
                          accentColor={dayAccentColor(
                            option.value,
                            accentColor,
                            publicAccentColor,
                            light,
                          )}
                        />
                      ))}
                    </ControlGroup>
                  </div>
                </div>

                <div className="px-4">
                  <ModalRow label={copy.date} value={getShortDateLabel(date, locale)} />
                  <ModalRow label={copy.weekday} value={getWeekdayName(day.weekdayIndex, locale)} />
                  <ModalRow label={copy.status} value={statusLabel} />
                </div>
              </Panel>

              <SlotPicker
                slots={normalizedSlots}
                labels={labels}
                locale={locale}
                light={light}
                accentColor={accentColor}
                onChange={(nextSlots) =>
                  onUpdate({
                    slots: nextSlots,
                    breaks: [],
                    status: nextSlots.length && day.status === 'day-off' ? 'workday' : day.status,
                    custom: true,
                  })
                }
              />
            </div>

            <div className="space-y-3">
              <Panel light={light} className="overflow-hidden px-4">
                <ModalRow label={copy.slots} value={String(normalizedSlots.length)} />
                <ModalRow label={copy.total} value={formatMinutes(workMinutes, locale)} />
                <ModalRow label={copy.status} value={statusLabel} />
              </Panel>

              <Panel light={light} className="p-4">
                <div className={cn('text-[12.5px] font-semibold', pageText(light))}>
                  {copy.summary}
                </div>

                <div className="mt-3">
                  <IntervalChips
                    items={normalizedSlots}
                    emptyLabel={labels.noSlots}
                    light={light}
                    limit={8}
                  />
                </div>
              </Panel>

              <div className="space-y-2">
                {presetOptions.map((preset) => (
                  <ModalActionButton
                    key={preset.key}
                    label={preset.label}
                    hint={preset.hint}
                    onClick={() => onApplyPreset(preset.key)}
                    icon={
                      preset.key === 'off' ? (
                        <Lock className="size-4" />
                      ) : preset.key === 'short' ? (
                        <Sparkles className="size-4" />
                      ) : (
                        <CalendarRange className="size-4" />
                      )
                    }
                  />
                ))}

                <ModalActionButton
                  label={copy.reset}
                  onClick={onReset}
                  danger
                  icon={<Trash2 className="size-4" />}
                />

                <button
                  type="button"
                  onClick={onClose}
                  className={cn('mt-3 w-full', buttonBase(light, true), 'h-11 rounded-[10px]')}
                >
                  {copy.done}
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function AvailabilityPage() {
  const { hasHydrated, ownedProfile, dataset, locale } = useOwnedWorkspaceData();
  const { resolvedTheme } = useTheme();
  const { settings } = useAppearance();

  const [mounted, setMounted] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedIsoDate, setSelectedIsoDate] = useState(() => toISODate(new Date()));
  const [dayEditorOpen, setDayEditorOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<DayContextMenuState | null>(null);

  const weeklyTemplates = useMemo(() => dataset?.availability ?? [], [dataset?.availability]);

  const initialMonthDays = useMemo(
    () => createMonthDays(locale, startOfMonth(new Date()), weeklyTemplates),
    [locale, weeklyTemplates],
  );

  const [monthDays, setMonthDays] = useWorkspaceSection<MonthAvailabilityDay[]>(
    'availability',
    initialMonthDays,
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme: ThemeMode = mounted ? (resolvedTheme === 'light' ? 'light' : 'dark') : 'dark';
  const isLight = currentTheme === 'light';

  const accentColor = accentPalette[settings.accentTone].solid;
  const publicAccentColor = accentPalette[settings.publicAccent].solid;

  const copy =
    locale === 'ru'
      ? {
          title: 'График',
          description: 'Месячная настройка рабочих дней, выходных и слотов по 1 часу.',
          createProfileTitle: 'Профиль ещё не создан',
          createProfileDescription:
            'Сначала создайте профиль мастера, чтобы открыть месячный календарь и настройку слотов.',
          createProfileButton: 'Создать профиль',

          emptyBadge: 'Профиль не найден',
          emptyCardScheduleLabel: 'График',
          emptyCardScheduleTitle: 'Месячный календарь',
          emptyCardScheduleText:
            'После создания профиля здесь появятся рабочие дни, короткие смены и выходные.',
          emptyCardSlotsLabel: 'Слоты',
          emptyCardSlotsTitle: 'Выбор по часам',
          emptyCardSlotsText:
            'Мастер просто нажимает на часы: 08:00, 09:00, 10:00 и так далее.',
          emptyCardStartLabel: 'Старт',
          emptyCardStartTitle: 'Один шаг до запуска',
          emptyCardStartText:
            'Заполните профиль мастера, затем настройте график и принимайте записи.',

          workDays: 'Рабочие',
          shortDays: 'Короткие',
          offDays: 'Выходные',
          totalHours: 'Часы',

          calendarTitle: 'Календарь месяца',
          calendarDescription:
            'Нажмите на день, чтобы открыть попап. Правый клик открывает быстрое меню.',
          selectedDay: 'Выбранный день',
          quickTitle: 'Быстрые статусы',
          quickDescription: 'Меняет только статус дня. Рабочие часы выбираются в попапе.',
          today: 'Текущий месяц',
          open: 'Выбрать слоты',
          resetDay: 'Сбросить день',
          copyWeek: 'Скопировать неделю',

          monthWorkweek: 'Рабочая неделя',
          monthWorkweekHint: 'Пн–пт рабочие, сб короткий, вс выходной. Слоты не меняются.',
          monthDense: 'Открыть Пн–Сб',
          monthDenseHint: 'Пн–сб рабочие дни, вс выходной. Слоты выбираются вручную.',
          monthWeekendsOff: 'Выходные закрыть',
          monthWeekendsOffHint: 'Все субботы и воскресенья станут выходными.',
          monthClear: 'Очистить месяц',
          monthClearHint: 'Все дни месяца станут выходными.',

          editorTitle: 'Слоты дня',
          editorDescription: 'Выбор рабочих часов',
          workday: 'Рабочий день',
          short: 'Короткий день',
          dayOff: 'Выходной',
          slots: 'Рабочие часы',
          delete: 'Сбросить день',
          block1: 'Сделать рабочим',
          block2: 'Сделать коротким',
          block3: 'Сделать выходным',
          dayStatus: 'Статус дня',
          quickPresets: 'Быстрые действия',
          totalWork: 'Рабочее время',
          selectedSlots: 'Выбрано слотов',
          clearSlots: 'Очистить слоты',
          noSlots: 'Слоты не выбраны',
          manualSlotsHint:
            'Просто нажмите на часы, в которые мастер будет работать. Например: 08:00, 09:00, 10:00. Каждый выбранный час создаёт слот длительностью 1 час.',
        }
      : {
          title: 'Availability',
          description: 'Monthly setup for workdays, days off, and 1-hour slots.',
          createProfileTitle: 'Profile is not created yet',
          createProfileDescription:
            'Create a master profile first to unlock the monthly calendar and slot setup.',
          createProfileButton: 'Create profile',

          emptyBadge: 'Profile missing',
          emptyCardScheduleLabel: 'Schedule',
          emptyCardScheduleTitle: 'Monthly calendar',
          emptyCardScheduleText:
            'After profile setup, working days, short shifts, and days off will appear here.',
          emptyCardSlotsLabel: 'Slots',
          emptyCardSlotsTitle: 'Hourly selection',
          emptyCardSlotsText:
            'The master simply taps hours: 08:00, 09:00, 10:00, and so on.',
          emptyCardStartLabel: 'Start',
          emptyCardStartTitle: 'One step to launch',
          emptyCardStartText:
            'Create the master profile, configure availability, and start accepting bookings.',

          workDays: 'Workdays',
          shortDays: 'Short',
          offDays: 'Off',
          totalHours: 'Hours',

          calendarTitle: 'Month calendar',
          calendarDescription:
            'Click a day to open the popup. Right-click opens the quick menu.',
          selectedDay: 'Selected day',
          quickTitle: 'Quick statuses',
          quickDescription: 'Changes only day status. Working hours are selected in the popup.',
          today: 'Current month',
          open: 'Choose slots',
          resetDay: 'Reset day',
          copyWeek: 'Copy week',

          monthWorkweek: 'Workweek',
          monthWorkweekHint: 'Mon–Fri workdays, Sat short, Sun off. Slots stay unchanged.',
          monthDense: 'Open Mon–Sat',
          monthDenseHint: 'Mon–Sat workdays, Sun off. Slots are selected manually.',
          monthWeekendsOff: 'Close weekends',
          monthWeekendsOffHint: 'All Saturdays and Sundays become days off.',
          monthClear: 'Clear month',
          monthClearHint: 'All days in the month become days off.',

          editorTitle: 'Day slots',
          editorDescription: 'Choose working hours',
          workday: 'Workday',
          short: 'Short day',
          dayOff: 'Day off',
          slots: 'Working hours',
          delete: 'Reset day',
          block1: 'Make workday',
          block2: 'Make short',
          block3: 'Make day off',
          dayStatus: 'Day status',
          quickPresets: 'Quick actions',
          totalWork: 'Working time',
          selectedSlots: 'Selected slots',
          clearSlots: 'Clear slots',
          noSlots: 'No slots selected',
          manualSlotsHint:
            'Just tap the hours when the master will work. For example: 08:00, 09:00, 10:00. Each selected hour creates a 1-hour slot.',
        };

  const labels: AvailabilityEditorLabels = {
    editorTitle: copy.editorTitle,
    editorDescription: copy.editorDescription,
    workday: copy.workday,
    short: copy.short,
    dayOff: copy.dayOff,
    slots: copy.slots,
    delete: copy.delete,
    block1: copy.block1,
    block2: copy.block2,
    block3: copy.block3,
    dayStatus: copy.dayStatus,
    quickPresets: copy.quickPresets,
    totalWork: copy.totalWork,
    selectedSlots: copy.selectedSlots,
    clearSlots: copy.clearSlots,
    noSlots: copy.noSlots,
    manualSlotsHint: copy.manualSlotsHint,
  };

  useEffect(() => {
    if (!dataset) return;

    const requiredDays = createMonthDays(locale, visibleMonth, weeklyTemplates);

    setMonthDays((current) => {
      const normalized = current.filter(isStoredMonthDay);
      let changed = normalized.length !== current.length;
      const next = [...normalized];

      for (const requiredDay of requiredDays) {
        const exists = next.some((day) => day.date === requiredDay.date);

        if (!exists) {
          next.push(requiredDay);
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [dataset, locale, setMonthDays, visibleMonth, weeklyTemplates]);

  const dayByDate = useMemo(() => {
    const map = new Map<string, MonthAvailabilityDay>();

    for (const day of monthDays.filter(isStoredMonthDay)) {
      map.set(day.date, {
        ...day,
        slots: normalizeToHourSlots(day.slots),
        breaks: [],
      });
    }

    return map;
  }, [monthDays]);

  const visibleMonthDays = useMemo(() => {
    const key = monthKey(visibleMonth);

    return monthDays
      .filter((day) => isStoredMonthDay(day) && day.monthKey === key)
      .map((day) => ({ ...day, slots: normalizeToHourSlots(day.slots), breaks: [] }))
      .sort((left, right) => left.date.localeCompare(right.date));
  }, [monthDays, visibleMonth]);

  const monthStats = useMemo(() => {
    const workDays = visibleMonthDays.filter((day) => day.status === 'workday').length;
    const shortDays = visibleMonthDays.filter((day) => day.status === 'short').length;
    const offDays = visibleMonthDays.filter((day) => day.status === 'day-off').length;
    const totalMinutes = visibleMonthDays.reduce(
      (total, day) => total + getTotalMinutes(day.slots),
      0,
    );

    return {
      workDays,
      shortDays,
      offDays,
      totalMinutes,
    };
  }, [visibleMonthDays]);

  const calendarCells = useMemo(() => {
    return getCalendarDates(visibleMonth).map((date) => {
      const iso = toISODate(date);
      const storedDay = dayByDate.get(iso);
      const day = storedDay ?? createDayFromDate(date, locale, weeklyTemplates);

      return {
        date,
        iso,
        day,
        outside: !isSameMonth(date, visibleMonth),
        today: isToday(date),
        selected: iso === selectedIsoDate,
      };
    });
  }, [dayByDate, locale, selectedIsoDate, visibleMonth, weeklyTemplates]);

  const selectedDay = useMemo(() => {
    const date = fromISODate(selectedIsoDate);
    return dayByDate.get(selectedIsoDate) ?? createDayFromDate(date, locale, weeklyTemplates);
  }, [dayByDate, locale, selectedIsoDate, weeklyTemplates]);

  const selectedDate = useMemo(() => fromISODate(selectedIsoDate), [selectedIsoDate]);

  const contextMenuDay = useMemo(() => {
    if (!contextMenu) return null;

    const date = fromISODate(contextMenu.iso);
    return dayByDate.get(contextMenu.iso) ?? createDayFromDate(date, locale, weeklyTemplates);
  }, [contextMenu, dayByDate, locale, weeklyTemplates]);

  const upsertDay = useCallback(
    (iso: string, patch: Partial<MonthAvailabilityDay>) => {
      setMonthDays((current) => {
        const normalized = current.filter(isStoredMonthDay);
        const index = normalized.findIndex((day) => day.date === iso);
        const base =
          index >= 0
            ? normalized[index]
            : createDayFromDate(fromISODate(iso), locale, weeklyTemplates);

        const nextDay: MonthAvailabilityDay = {
          ...base,
          ...patch,
          slots: patch.slots ? normalizeToHourSlots(patch.slots) : normalizeToHourSlots(base.slots),
          breaks: [],
          custom: patch.custom ?? true,
        };

        if (index < 0) {
          return [...normalized, nextDay];
        }

        return normalized.map((day, itemIndex) => (itemIndex === index ? nextDay : day));
      });
    },
    [locale, setMonthDays, weeklyTemplates],
  );

  const applyMonthPreset = useCallback(
    (preset: MonthPreset) => {
      const key = monthKey(visibleMonth);
      const requiredDays = createMonthDays(locale, visibleMonth, weeklyTemplates);

      setMonthDays((current) => {
        const normalized = current.filter(isStoredMonthDay);
        const preserved = normalized.filter((day) => day.monthKey !== key);

        const nextMonthDays = requiredDays.map((fallbackDay) => {
          const currentDay = normalized.find((day) => day.date === fallbackDay.date) ?? fallbackDay;

          const base: MonthAvailabilityDay = {
            ...fallbackDay,
            ...currentDay,
            slots: normalizeToHourSlots(currentDay.slots),
            breaks: [],
          };

          if (preset === 'clear') {
            return {
              ...base,
              status: 'day-off' as const,
              slots: [],
              breaks: [],
              custom: true,
            };
          }

          if (preset === 'weekendsOff' && base.weekdayIndex >= 5) {
            return {
              ...base,
              status: 'day-off' as const,
              slots: [],
              breaks: [],
              custom: true,
            };
          }

          if (preset === 'dense') {
            if (base.weekdayIndex === 6) {
              return {
                ...base,
                status: 'day-off' as const,
                slots: [],
                breaks: [],
                custom: true,
              };
            }

            return {
              ...base,
              status: 'workday' as const,
              custom: true,
            };
          }

          if (preset === 'workweek') {
            if (base.weekdayIndex === 6) {
              return {
                ...base,
                status: 'day-off' as const,
                slots: [],
                breaks: [],
                custom: true,
              };
            }

            if (base.weekdayIndex === 5) {
              return {
                ...base,
                status: 'short' as const,
                custom: true,
              };
            }

            return {
              ...base,
              status: 'workday' as const,
              custom: true,
            };
          }

          return base;
        });

        return [...preserved, ...nextMonthDays];
      });
    },
    [locale, setMonthDays, visibleMonth, weeklyTemplates],
  );

  const applyDayPreset = useCallback(
    (iso: string, preset: DayPreset) => {
      if (preset === 'workday') {
        upsertDay(iso, {
          status: 'workday',
          custom: true,
        });
        return;
      }

      if (preset === 'short') {
        upsertDay(iso, {
          status: 'short',
          custom: true,
        });
        return;
      }

      upsertDay(iso, {
        status: 'day-off',
        slots: [],
        breaks: [],
        custom: true,
      });
    },
    [upsertDay],
  );

  const resetDay = useCallback(
    (iso: string) => {
      const date = fromISODate(iso);
      const reset = createDayFromDate(date, locale, weeklyTemplates);

      upsertDay(iso, {
        ...reset,
        custom: false,
      });
    },
    [locale, upsertDay, weeklyTemplates],
  );

  const setFullDay = useCallback(
    (iso: string) => {
      upsertDay(iso, {
        status: 'workday',
        slots: getFullDaySlots(),
        breaks: [],
        custom: true,
      });
    },
    [upsertDay],
  );

  const setDayOff = useCallback(
    (iso: string) => {
      upsertDay(iso, {
        status: 'day-off',
        slots: [],
        breaks: [],
        custom: true,
      });
    },
    [upsertDay],
  );

  const clearDaySlots = useCallback(
    (iso: string) => {
      upsertDay(iso, {
        slots: [],
        breaks: [],
        custom: true,
      });
    },
    [upsertDay],
  );

  const copySelectedWeekToMonth = useCallback(() => {
    const selectedWeekStart = startOfWeekMonday(selectedDate);
    const weekPattern = Array.from({ length: 7 }, (_, index) => {
      const date = addDays(selectedWeekStart, index);
      const iso = toISODate(date);
      return dayByDate.get(iso) ?? createDayFromDate(date, locale, weeklyTemplates);
    });

    const key = monthKey(visibleMonth);

    setMonthDays((current) => {
      const normalized = current.filter(isStoredMonthDay);
      const preserved = normalized.filter((day) => day.monthKey !== key);
      const monthDaysNext = createMonthDays(locale, visibleMonth, weeklyTemplates).map(
        (monthDay) => {
          const pattern = weekPattern[monthDay.weekdayIndex];

          return {
            ...monthDay,
            label: pattern.label,
            status: pattern.status,
            slots: normalizeToHourSlots(pattern.slots),
            breaks: [],
            custom: true,
          };
        },
      );

      return [...preserved, ...monthDaysNext];
    });
  }, [dayByDate, locale, selectedDate, setMonthDays, visibleMonth, weeklyTemplates]);

  const goToMonth = (nextMonth: Date) => {
    const normalized = startOfMonth(nextMonth);
    setVisibleMonth(normalized);
    setSelectedIsoDate(toISODate(normalized));
  };

  if (!hasHydrated || !mounted) return null;

  if (!ownedProfile || !dataset) {
    return (
      <WorkspaceShell>
        <main className={cn('min-h-screen px-4 pb-12 pt-5 md:px-7 md:pt-6', pageBg(isLight))}>
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

                <p className={cn('mt-2 max-w-[760px] text-[13px] leading-5', mutedText(isLight))}>
                  {copy.description}
                </p>
              </div>
            </div>

            <Card light={isLight} className="overflow-hidden">
              <div className="grid min-h-[320px] place-items-center px-5 py-12 text-center">
                <div className="mx-auto max-w-[460px]">
                  <MicroLabel light={isLight}>
                    <StatusDot light={isLight} />
                    {copy.emptyBadge}
                  </MicroLabel>

                  <h2
                    className={cn(
                      'mt-5 text-[18px] font-semibold tracking-[-0.02em] md:text-[22px]',
                      pageText(isLight),
                    )}
                  >
                    {copy.createProfileTitle}
                  </h2>

                  <p className={cn('mt-3 text-[13px] leading-5', mutedText(isLight))}>
                    {copy.createProfileDescription}
                  </p>

                  <div className="mt-6 flex justify-center">
                    <ActionLink href="/create-profile" light={isLight} active>
                      <SquarePen className="size-3.5" />
                      {copy.createProfileButton}
                    </ActionLink>
                  </div>
                </div>
              </div>
            </Card>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <EmptyInfoCard
                light={isLight}
                icon={<CalendarRange className="size-3.5" />}
                label={copy.emptyCardScheduleLabel}
                title={copy.emptyCardScheduleTitle}
                description={copy.emptyCardScheduleText}
              />

              <EmptyInfoCard
                light={isLight}
                icon={<Lock className="size-3.5" />}
                label={copy.emptyCardSlotsLabel}
                title={copy.emptyCardSlotsTitle}
                description={copy.emptyCardSlotsText}
              />

              <EmptyInfoCard
                light={isLight}
                icon={<Sparkles className="size-3.5" />}
                label={copy.emptyCardStartLabel}
                title={copy.emptyCardStartTitle}
                description={copy.emptyCardStartText}
              />
            </div>
          </div>
        </main>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
      <main className={cn('min-h-screen px-4 pb-12 pt-5 md:px-7 md:pt-6', pageBg(isLight))}>
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

              <p className={cn('mt-2 max-w-[760px] text-[13px] leading-5', mutedText(isLight))}>
                {copy.description}
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <Card light={isLight} className="overflow-hidden">
              <div className="p-5 md:p-6">
                <div
                  className={cn(
                    'text-[22px] font-semibold capitalize tracking-[-0.03em] md:text-[26px]',
                    pageText(isLight),
                  )}
                >
                  {getMonthTitle(visibleMonth, locale)}
                </div>

                <p className={cn('mt-3 max-w-[760px] text-[12.5px] leading-6', mutedText(isLight))}>
                  {locale === 'ru'
                    ? 'Мастер выбирает рабочие часы вручную: 08:00, 09:00, 10:00 и так далее. Один выбранный час = один слот.'
                    : 'The master selects working hours manually: 08:00, 09:00, 10:00, and so on. One selected hour = one slot.'}
                </p>

                <div className="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  <HeroStat label={copy.workDays} value={monthStats.workDays} hint={copy.workday} light={isLight} />
                  <HeroStat label={copy.shortDays} value={monthStats.shortDays} hint={copy.short} light={isLight} />
                  <HeroStat label={copy.offDays} value={monthStats.offDays} hint={copy.dayOff} light={isLight} />
                  <HeroStat
                    label={copy.totalHours}
                    value={formatMinutes(monthStats.totalMinutes, locale)}
                    hint={copy.totalWork}
                    light={isLight}
                  />
                </div>
              </div>
            </Card>

            <Card light={isLight}>
              <CardTitle title={copy.quickTitle} description={copy.calendarDescription} light={isLight} />

              <div className="grid gap-2 p-4 md:grid-cols-4">
                <MonthScenarioCard
                  title={copy.monthWorkweek}
                  description={copy.monthWorkweekHint}
                  icon={<CalendarRange className="size-3.5" />}
                  light={isLight}
                  onClick={() => applyMonthPreset('workweek')}
                />

                <MonthScenarioCard
                  title={copy.monthDense}
                  description={copy.monthDenseHint}
                  icon={<Sparkles className="size-3.5" />}
                  light={isLight}
                  onClick={() => applyMonthPreset('dense')}
                />

                <MonthScenarioCard
                  title={copy.monthWeekendsOff}
                  description={copy.monthWeekendsOffHint}
                  icon={<Lock className="size-3.5" />}
                  light={isLight}
                  onClick={() => applyMonthPreset('weekendsOff')}
                />

                <MonthScenarioCard
                  title={copy.monthClear}
                  description={copy.monthClearHint}
                  icon={<RotateCcw className="size-3.5" />}
                  light={isLight}
                  danger
                  onClick={() => applyMonthPreset('clear')}
                />
              </div>
            </Card>

            <Card light={isLight}>
              <CardTitle
                title={copy.calendarTitle}
                description={copy.calendarDescription}
                light={isLight}
                actions={
                  <>
                    <ActionButton
                      light={isLight}
                      onClick={() => goToMonth(addMonths(visibleMonth, -1))}
                      className="size-8 px-0"
                    >
                      <ChevronLeft className="size-3.5" />
                    </ActionButton>

                    <ActionButton
                      light={isLight}
                      onClick={() => {
                        const today = new Date();
                        setVisibleMonth(startOfMonth(today));
                        setSelectedIsoDate(toISODate(today));
                      }}
                    >
                      <CalendarRange className="size-3.5" />
                      <span className="capitalize">{getMonthTitle(visibleMonth, locale)}</span>
                    </ActionButton>

                    <ActionButton
                      light={isLight}
                      onClick={() => goToMonth(addMonths(visibleMonth, 1))}
                      className="size-8 px-0"
                    >
                      <ChevronRight className="size-3.5" />
                    </ActionButton>
                  </>
                }
              />

              <div className="grid gap-4 p-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                <Panel light={isLight} className="p-3 md:p-4">
                  <div className="hidden grid-cols-7 gap-2 px-1 pb-2 lg:grid">
                    {getWeekdayLabels(locale).map((label) => (
                      <div
                        key={label}
                        className={cn(
                          'text-[10px] font-medium uppercase tracking-[0.12em]',
                          faintText(isLight),
                        )}
                      >
                        {label}
                      </div>
                    ))}
                  </div>

                  <div className="availability-day-grid grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                    {calendarCells.map((cell) => (
                      <CompactMonthDay
                        key={cell.iso}
                        day={cell.day}
                        date={cell.date}
                        outside={cell.outside}
                        today={cell.today}
                        selected={cell.selected}
                        locale={locale}
                        labels={labels}
                        light={isLight}
                        accentColor={accentColor}
                        publicAccentColor={publicAccentColor}
                        onSelect={() => {
                          if (cell.outside) {
                            setVisibleMonth(startOfMonth(cell.date));
                          }

                          setSelectedIsoDate(cell.iso);
                        }}
                        onOpen={() => {
                          if (cell.outside) {
                            setVisibleMonth(startOfMonth(cell.date));
                          }

                          setSelectedIsoDate(cell.iso);
                          setDayEditorOpen(true);
                        }}
                        onContextOpen={(event) => {
                          event.preventDefault();
                          event.stopPropagation();

                          if (cell.outside) {
                            setVisibleMonth(startOfMonth(cell.date));
                          }

                          setSelectedIsoDate(cell.iso);
                          setContextMenu({
                            iso: cell.iso,
                            x: event.clientX,
                            y: event.clientY,
                          });
                        }}
                      />
                    ))}
                  </div>
                </Panel>

                <div className="space-y-4 xl:sticky xl:top-[84px] xl:self-start">
                  <Panel light={isLight} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className={cn('text-[10px] uppercase tracking-[0.14em]', faintText(isLight))}>
                          {copy.selectedDay}
                        </div>

                        <div
                          className={cn(
                            'mt-3 text-[20px] font-semibold tracking-[-0.025em]',
                            pageText(isLight),
                          )}
                        >
                          {selectedDay.dayNumber}
                        </div>

                        <div className={cn('mt-1 text-[13px] font-semibold capitalize', pageText(isLight))}>
                          {getWeekdayName(selectedDay.weekdayIndex, locale)}
                        </div>

                        <div className={cn('mt-1 text-[11px]', mutedText(isLight))}>
                          {getShortDateLabel(selectedDate, locale)}
                        </div>
                      </div>

                      <DayStatusBlock
                        status={selectedDay.status}
                        labels={labels}
                        locale={locale}
                        light={isLight}
                        accentColor={accentColor}
                        publicAccentColor={publicAccentColor}
                      />
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <MicroLabel light={isLight}>
                        {labels.selectedSlots}: {normalizeToHourSlots(selectedDay.slots).length}
                      </MicroLabel>

                      <MicroLabel light={isLight}>
                        {labels.totalWork}: {formatMinutes(getTotalMinutes(selectedDay.slots), locale)}
                      </MicroLabel>
                    </div>

                    <div className="mt-4 grid gap-2">
                      <Panel light={isLight} className="p-3">
                        <div className={cn('text-[10px] uppercase tracking-[0.12em]', faintText(isLight))}>
                          {labels.slots}
                        </div>

                        <div className="mt-2">
                          <IntervalChips
                            items={normalizeToHourSlots(selectedDay.slots)}
                            emptyLabel={labels.noSlots}
                            light={isLight}
                          />
                        </div>
                      </Panel>
                    </div>

                    <div className="mt-4 grid gap-2">
                      <ActionButton light={isLight} active onClick={() => setDayEditorOpen(true)} className="w-full">
                        {copy.open}
                        <ArrowRight className="size-3.5" />
                      </ActionButton>

                      <ActionButton light={isLight} onClick={copySelectedWeekToMonth} className="w-full">
                        <Copy className="size-3.5" />
                        {copy.copyWeek}
                      </ActionButton>

                      <ActionButton
                        light={isLight}
                        onClick={() => resetDay(selectedIsoDate)}
                        className={cn(
                          'w-full',
                          isLight ? 'text-red-600 hover:text-red-700' : 'text-red-300 hover:text-red-200',
                        )}
                      >
                        <Trash2 className="size-3.5" />
                        {copy.resetDay}
                      </ActionButton>
                    </div>
                  </Panel>

                  <Panel light={isLight} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className={cn('text-[13px] font-semibold', pageText(isLight))}>
                          {copy.quickTitle}
                        </div>

                        <div className={cn('mt-1 text-[11px] leading-4', mutedText(isLight))}>
                          {copy.quickDescription}
                        </div>
                      </div>

                      <Sparkles className={cn('size-4', faintText(isLight))} />
                    </div>

                    <div className="mt-4 grid gap-2">
                      {[
                        { key: 'workday', label: labels.block1 },
                        { key: 'short', label: labels.block2 },
                        { key: 'off', label: labels.block3 },
                      ].map((preset) => (
                        <ActionButton
                          key={preset.key}
                          light={isLight}
                          onClick={() => applyDayPreset(selectedIsoDate, preset.key as DayPreset)}
                          className="h-auto min-h-9 justify-start whitespace-normal py-2 text-left leading-5"
                        >
                          {preset.label}
                        </ActionButton>
                      ))}
                    </div>
                  </Panel>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <DayContextMenu
        menu={contextMenu}
        day={contextMenuDay}
        locale={locale}
        light={isLight}
        accentColor={accentColor}
        onClose={() => setContextMenu(null)}
        onFullDay={(iso) => {
          setSelectedIsoDate(iso);
          setFullDay(iso);
        }}
        onDayOff={(iso) => {
          setSelectedIsoDate(iso);
          setDayOff(iso);
        }}
        onClear={(iso) => {
          setSelectedIsoDate(iso);
          clearDaySlots(iso);
        }}
      />

      <AvailabilityEditorDialog
        open={dayEditorOpen}
        locale={locale}
        labels={labels}
        day={selectedDay}
        light={isLight}
        accentColor={accentColor}
        publicAccentColor={publicAccentColor}
        onUpdate={(patch) => upsertDay(selectedIsoDate, patch)}
        onApplyPreset={(preset) => applyDayPreset(selectedIsoDate, preset)}
        onReset={() => {
          resetDay(selectedIsoDate);
          setDayEditorOpen(false);
        }}
        onClose={() => setDayEditorOpen(false)}
      />
    </WorkspaceShell>
  );
}