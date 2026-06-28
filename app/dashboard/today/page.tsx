'use client';

import Link from 'next/link';
import {
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTheme } from 'next-themes';
import {
  Ban,
  CalendarClock,
  CheckCircle2,
  LockKeyhole,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Globe2,
  MessageCircleMore,
  PhoneCall,
  Plus,
  SlidersHorizontal,
  SquarePen,
  X,
} from 'lucide-react';

import { WorkspaceShell } from '@/components/shared/workspace-shell';
import { Button } from '@/components/ui/button';
import { NumberPopIn } from '@/components/ui/number-pop-in';
import { useOwnedWorkspaceData } from '@/hooks/use-owned-workspace-data';
import { useApp } from '@/lib/app-context';
import { useAppearance } from '@/lib/appearance-context';
import { accentPalette } from '@/lib/appearance-palette';
import {
  findAvailabilityDay,
  normalizeAvailabilityDays,
  timeToMinutes,
  type BookingAvailabilityDay,
} from '@/lib/availability';
import type { Booking, BookingStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

type ThemeMode = 'light' | 'dark';
type CalendarView = 'day' | 'week' | 'month';
type SlotState = 'free' | 'busy' | 'break' | 'blocked' | 'outside';

interface SlotSegment {
  start: number;
  end: number;
  label: string;
  source: string;
  kind: 'work' | 'break' | 'block' | 'external';
}

interface CalendarBooking {
  id: string;
  raw: Booking;
  clientName: string;
  service: string;
  phone: string;
  date: string;
  start: string;
  end: string;
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
  status: BookingStatus;
  note?: string;
  sourceLabel?: string;
  amount: number;
  color: string;
  servicePrice?: number;
}

interface DayPlan {
  iso: string;
  date: Date;
  source: BookingAvailabilityDay | null;
  slots: SlotSegment[];
  breaks: SlotSegment[];
  blocked: SlotSegment[];
  isDayOff: boolean;
}

interface CalendarMetrics {
  slots: number;
  busy: number;
  free: number;
  load: number;
  revenue: number;
  next: CalendarBooking | null;
}

interface CreateBookingDraft {
  clientName: string;
  clientPhone: string;
  service: string;
  date: string;
  time: string;
  comment: string;
}

interface SelectedCalendarSlot {
  date: string;
  start: number;
  end: number;
}

type BookingStatusFilter = Record<BookingStatus, boolean>;

const DEFAULT_BOOKING_FILTERS: BookingStatusFilter = {
  new: true,
  confirmed: true,
  completed: true,
  no_show: false,
  cancelled: false,
};

const CALENDAR_BOOKING_COLOR = '#8B5CF6';
const CALENDAR_BOOKING_COLOR_DARK = '#A78BFA';
const CALENDAR_BREAK_COLOR = '#F97316';
const CALENDAR_CONFLICT_COLOR = '#E5484D';
const CALENDAR_FREE_COLOR = '#2F6B5F';
const CALENDAR_NOW_COLOR = '#FF6A1A';

const AUTO_SERVICE_COLORS = [
  '#8B5CF6',
  '#7C3AED',
  '#6D5DF6',
  '#7AA66C',
  '#0F766E',
  '#2563EB',
  '#0891B2',
  '#CA8A04',
  '#16A34A',
  '#E879F9',
];

const DEFAULT_SLOT_MINUTES = 60;
// Calendar window: 08:00 → 22:00 (14 visible hours)
// At 56px/hr the whole day grid is ~784px tall and fits a 1080p desktop
// without horizontal scroll while keeping each card legible.
const TIMETABLE_HOUR_HEIGHT = 56;
const TIMETABLE_SLOT_INSET_Y = 3;
const TIMETABLE_DAY_START = 8 * 60;
const TIMETABLE_DAY_END = 22 * 60;

const WEEKDAY_SHORT_FALLBACK_RU = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const WEEKDAY_SHORT_FALLBACK_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function pageBg(light: boolean) {
  return light ? 'bg-[#f7f6f2]' : 'bg-[#080808]';
}

function pageText(light: boolean) {
  return light ? 'text-[#101114]' : 'text-[#f8f7f4]';
}

function mutedText(light: boolean) {
  return light ? 'text-[#68707c]' : 'text-[#9ca3af]';
}

function faintText(light: boolean) {
  return light ? 'text-black/36' : 'text-white/30';
}

function cardTone(light: boolean) {
  return light
    ? 'border-[#e3ddd3] bg-white shadow-[0_12px_30px_rgba(17,17,17,0.035),0_1px_2px_rgba(17,17,17,0.035)]'
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

function iconButtonBase(light: boolean) {
  return cn(
    'inline-flex size-8 shrink-0 items-center justify-center rounded-[9px] border text-[12px] transition-[background,border-color,color,transform] duration-150 active:scale-[0.965]',
    light
      ? 'border-black/[0.08] bg-white text-black/54 hover:border-black/[0.14] hover:bg-black/[0.035] hover:text-black'
      : 'border-white/[0.08] bg-white/[0.04] text-white/54 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white',
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

function bookingSurfaceStyle(color: string, light: boolean, active = false): CSSProperties {
  return {
    background: light
      ? `linear-gradient(135deg, color-mix(in srgb, ${color} 8%, #ffffff), color-mix(in srgb, ${color} 4%, #ffffff))`
      : `linear-gradient(135deg, color-mix(in srgb, ${color} 22%, #111111), color-mix(in srgb, ${color} 10%, #111111))`,
    borderColor: light
      ? `color-mix(in srgb, ${color} 36%, #ded8ce)`
      : `color-mix(in srgb, ${color} 46%, rgba(255,255,255,0.1))`,
    boxShadow: active
      ? light
        ? `0 0 0 1px color-mix(in srgb, ${color} 24%, transparent), 0 14px 30px rgba(17,17,17,0.08)`
        : `0 0 0 1px color-mix(in srgb, ${color} 34%, transparent), 0 18px 40px rgba(0,0,0,0.35)`
      : light
        ? '0 10px 24px rgba(17,17,17,0.045)'
        : '0 12px 28px rgba(0,0,0,0.22)',
  };
}

function toLocalIsoDate(date: Date) {
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function addMonths(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + amount);
  return copy;
}

function startOfWeekMonday(date: Date) {
  const copy = new Date(date);
  const weekday = (copy.getDay() + 6) % 7;
  copy.setHours(0, 0, 0, 0);
  copy.setDate(copy.getDate() - weekday);
  return copy;
}

function startOfMonth(date: Date) {
  const copy = new Date(date);
  copy.setDate(1);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatTime(minutes: number) {
  const normalized = Math.max(0, Math.min(24 * 60, Math.round(minutes)));
  const displayMinutes = normalized === 24 * 60 ? 0 : normalized;
  const hours = Math.floor(displayMinutes / 60).toString().padStart(2, '0');
  const mins = (displayMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${mins}`;
}

function parseBookingTime(time: string) {
  return timeToMinutes(time) ?? 0;
}

function splitIntervalText(value: string) {
  const [startRaw, endRaw] = value
    .replace(/—/g, '–')
    .replace(/-/g, '–')
    .split('–')
    .map((item) => item.trim());

  const start = timeToMinutes(startRaw ?? '');
  const end = timeToMinutes(endRaw ?? '');

  if (start === null || end === null || end <= start) return null;

  return { start, end };
}

function intervalLabel(start: number, end: number) {
  return `${formatTime(start)}–${formatTime(end)}`;
}

function slotSelectionKey(date: string, start: number, end: number) {
  return `${date}|${start}|${end}`;
}

function parseSlotSelectionKey(value: string): SelectedCalendarSlot | null {
  const [date, startRaw, endRaw] = value.split('|');
  const start = Number(startRaw);
  const end = Number(endRaw);

  if (!date || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;

  return { date, start, end };
}

function mergeSlotSegments(segments: SlotSegment[], kind: SlotSegment['kind']) {
  const sorted = [...segments]
    .filter((item) => item.end > item.start)
    .sort((left, right) => left.start - right.start || left.end - right.end);

  const merged: SlotSegment[] = [];

  for (const segment of sorted) {
    const previous = merged[merged.length - 1];

    if (previous && segment.start <= previous.end) {
      previous.end = Math.max(previous.end, segment.end);
      previous.label = intervalLabel(previous.start, previous.end);
      previous.source = `${previous.source};${segment.source}`;
      continue;
    }

    merged.push({
      start: segment.start,
      end: segment.end,
      label: intervalLabel(segment.start, segment.end),
      source: segment.source,
      kind,
    });
  }

  return merged;
}

function uniqSortedIntervals(values: string[]) {
  const map = new Map<string, SlotSegment>();

  for (const value of values) {
    const interval = splitIntervalText(value);
    if (!interval) continue;
    const key = `${interval.start}-${interval.end}`;
    map.set(key, {
      start: interval.start,
      end: interval.end,
      label: intervalLabel(interval.start, interval.end),
      source: value,
      kind: 'block',
    });
  }

  return mergeSlotSegments([...map.values()], 'block').map((item) => intervalLabel(item.start, item.end));
}

function getMondayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

function buildSlotSegments(values: string[] | undefined, kind: SlotSegment['kind']) {
  const segments = new Map<string, SlotSegment>();

  for (const value of values ?? []) {
    const interval = splitIntervalText(value);
    if (!interval) continue;

    const duration = interval.end - interval.start;
    const step = duration <= DEFAULT_SLOT_MINUTES ? duration : DEFAULT_SLOT_MINUTES;

    for (let current = interval.start; current < interval.end; current += step) {
      const end = Math.min(interval.end, current + step);
      const key = `${current}-${end}-${kind}`;

      segments.set(key, {
        start: current,
        end,
        label: `${formatTime(current)}–${formatTime(end)}`,
        source: value,
        kind,
      });
    }
  }

  return [...segments.values()].sort((left, right) => left.start - right.start || left.end - right.end);
}

function buildBlockedSlotSegments(values: string[] | undefined) {
  const segments: SlotSegment[] = [];

  for (const value of values ?? []) {
    const interval = splitIntervalText(value);
    if (!interval) continue;

    segments.push({
      start: interval.start,
      end: interval.end,
      label: intervalLabel(interval.start, interval.end),
      source: value,
      kind: 'block',
    });
  }

  return mergeSlotSegments(segments, 'block');
}

function overlaps(
  left: Pick<SlotSegment, 'start' | 'end'>,
  right: Pick<SlotSegment, 'start' | 'end'>,
) {
  return left.start < right.end && right.start < left.end;
}

function getDayPlan(date: Date, availability: BookingAvailabilityDay[]): DayPlan {
  const iso = toLocalIsoDate(date);
  const source = findAvailabilityDay(availability, iso);
  const isDayOff = source?.status === 'day-off';

  return {
    iso,
    date,
    source,
    slots: isDayOff ? [] : buildSlotSegments(source?.slots, 'work'),
    breaks: isDayOff ? [] : buildSlotSegments(source?.breaks, 'break'),
    blocked: isDayOff ? [] : buildBlockedSlotSegments(source?.blockedSlots),
    isDayOff,
  };
}

function getWeekDates(date: Date) {
  const start = startOfWeekMonday(date);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

function getMonthDates(date: Date) {
  const monthStart = startOfMonth(date);
  const gridStart = startOfWeekMonday(monthStart);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function getVisibleDates(view: CalendarView, selectedDate: Date) {
  if (view === 'day') return [selectedDate];
  if (view === 'week') return getWeekDates(selectedDate);
  return getMonthDates(selectedDate);
}

function getShortWeekday(date: Date, locale: 'ru' | 'en') {
  try {
    return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
      weekday: 'short',
    })
      .format(date)
      .replace('.', '')
      .replace(/^[a-zа-яё]/i, (char) => char.toUpperCase());
  } catch {
    const index = (date.getDay() + 6) % 7;
    return locale === 'ru'
      ? WEEKDAY_SHORT_FALLBACK_RU[index] ?? ''
      : WEEKDAY_SHORT_FALLBACK_EN[index] ?? '';
  }
}

function formatCompactDate(date: Date, locale: 'ru' | 'en') {
  try {
    return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
      day: 'numeric',
      month: 'short',
    })
      .format(date)
      .replace('.', '');
  } catch {
    return toLocalIsoDate(date);
  }
}

function formatRangeTitle(view: CalendarView, date: Date, locale: 'ru' | 'en') {
  if (view === 'day') {
    try {
      return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
        day: 'numeric',
        month: 'long',
        weekday: 'long',
      }).format(date);
    } catch {
      return toLocalIsoDate(date);
    }
  }

  if (view === 'week') {
    const start = startOfWeekMonday(date);
    const end = addDays(start, 6);
    return `${formatCompactDate(start, locale)} — ${formatCompactDate(end, locale)}`;
  }

  try {
    return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return toLocalIsoDate(date);
  }
}

function formatCurrencyCompact(value: number, locale: 'ru' | 'en') {
  try {
    return new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: value >= 1000 ? 0 : 2,
    }).format(value);
  } catch {
    return `${Math.round(value)} ₽`;
  }
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function getObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function getString(record: Record<string, unknown> | null, keys: string[]) {
  if (!record) return undefined;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  return undefined;
}

function getNumber(record: Record<string, unknown> | null, keys: string[]) {
  if (!record) return undefined;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }

  return undefined;
}

function normalizeColor(value: unknown) {
  if (typeof value !== 'string') return undefined;

  const color = value.trim();

  if (
    /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color) ||
    /^rgba?\(/i.test(color) ||
    /^hsla?\(/i.test(color)
  ) {
    return color;
  }

  return undefined;
}

function buildServiceMap(datasetServices: unknown, workspaceServices: unknown) {
  const source = Array.isArray(workspaceServices)
    ? workspaceServices
    : Array.isArray(datasetServices)
      ? datasetServices
      : [];

  const map = new Map<string, Record<string, unknown>>();

  for (const item of source) {
    const record = getObject(item);
    const name = getString(record, ['name', 'title', 'label']);
    if (name && record) map.set(name, record);
  }

  return map;
}

function getServiceColor(
  booking: Booking,
  services: Map<string, Record<string, unknown>>,
  accentColor: string,
  publicAccentColor: string,
) {
  const metadata = getObject(booking.metadata);
  const metadataColor = normalizeColor(
    getString(metadata, ['color', 'serviceColor', 'calendarColor', 'accentColor']),
  );
  if (metadataColor) return metadataColor;

  const service = services.get(booking.service);
  const serviceColor = normalizeColor(
    getString(service ?? null, ['color', 'serviceColor', 'calendarColor', 'accentColor']),
  );
  if (serviceColor) return serviceColor;

  if (booking.status === 'no_show') return CALENDAR_CONFLICT_COLOR;
  if (booking.status === 'cancelled') return '#94A3B8';
  if (booking.status === 'completed') return '#0EA5E9';
  if (booking.status === 'confirmed') return '#22A06B';
  if (booking.status === 'new') return publicAccentColor || accentColor || CALENDAR_BOOKING_COLOR;

  const index = hashString(booking.service || booking.id) % AUTO_SERVICE_COLORS.length;
  return AUTO_SERVICE_COLORS[index] ?? CALENDAR_BOOKING_COLOR;
}

function getServiceDuration(booking: Booking, services: Map<string, Record<string, unknown>>) {
  if (
    typeof booking.durationMinutes === 'number' &&
    Number.isFinite(booking.durationMinutes) &&
    booking.durationMinutes > 0
  ) {
    return booking.durationMinutes;
  }

  const service = services.get(booking.service);
  const duration = getNumber(service ?? null, ['duration', 'durationMinutes', 'duration_minutes', 'durationMin']);
  return duration && duration > 0 ? duration : DEFAULT_SLOT_MINUTES;
}

function getServicePrice(booking: Booking, services: Map<string, Record<string, unknown>>) {
  if (typeof booking.priceAmount === 'number' && Number.isFinite(booking.priceAmount)) {
    return booking.priceAmount;
  }

  const service = services.get(booking.service);
  return getNumber(service ?? null, ['price', 'priceAmount', 'price_amount']);
}

function getBookingEndMinutes(booking: Booking, startMinutes: number, fallbackDurationMinutes: number) {
  const metadata = getObject(booking.metadata);
  const bookingRecord = booking as Booking & Record<string, unknown>;
  const explicitEnd =
    getString(metadata, ['endTime', 'timeEnd', 'end', 'endsAt', 'end_at']) ??
    getString(bookingRecord, ['endTime', 'timeEnd', 'end']);

  const explicitEndMinutes = explicitEnd ? timeToMinutes(explicitEnd) : null;

  if (explicitEndMinutes !== null && explicitEndMinutes > startMinutes) {
    return explicitEndMinutes;
  }

  return startMinutes + fallbackDurationMinutes;
}

function mapBooking(
  booking: Booking,
  services: Map<string, Record<string, unknown>>,
  accentColor: string,
  publicAccentColor: string,
): CalendarBooking {
  const startMinutes = parseBookingTime(booking.time);
  const fallbackDurationMinutes = getServiceDuration(booking, services);
  const endMinutes = getBookingEndMinutes(booking, startMinutes, fallbackDurationMinutes);
  const durationMinutes = Math.max(1, endMinutes - startMinutes);
  const amount = getServicePrice(booking, services) ?? 0;

  return {
    id: booking.id,
    raw: booking,
    clientName: booking.clientName,
    service: booking.service,
    phone: booking.clientPhone,
    date: booking.date,
    start: booking.time,
    end: formatTime(endMinutes),
    startMinutes,
    endMinutes,
    durationMinutes,
    status: booking.status,
    note: booking.comment || undefined,
    sourceLabel: booking.source ?? booking.channel,
    amount,
    servicePrice: amount,
    color: getServiceColor(booking, services, accentColor, publicAccentColor),
  };
}

function isActiveBooking(booking: CalendarBooking) {
  return booking.status !== 'cancelled' && booking.status !== 'no_show';
}

function isClosedBooking(booking: CalendarBooking) {
  return booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'no_show';
}

function getBookingsForDate(bookings: CalendarBooking[], iso: string) {
  return bookings
    .filter((booking) => booking.date === iso)
    .sort(
      (left, right) =>
        left.startMinutes - right.startMinutes ||
        left.clientName.localeCompare(right.clientName),
    );
}

function bookingsInSlot(bookings: CalendarBooking[], slot: SlotSegment) {
  return bookings.filter((booking) =>
    overlaps(
      {
        start: booking.startMinutes,
        end: Math.max(booking.endMinutes, booking.startMinutes + 1),
      },
      slot,
    ),
  );
}

function buildRowsForPlan(plan: DayPlan, bookings: CalendarBooking[]) {
  const rows = new Map<string, SlotSegment>();

  for (const slot of plan.slots) {
    rows.set(`${slot.start}-${slot.end}-work`, slot);
  }

  for (const item of plan.breaks) {
    rows.set(`${item.start}-${item.end}-break`, item);
  }

  for (const item of plan.blocked) {
    rows.set(`${item.start}-${item.end}-block`, item);
  }

  for (const booking of bookings) {
    const inWorkSlot = plan.slots.some((slot) =>
      overlaps(
        {
          start: booking.startMinutes,
          end: Math.max(booking.endMinutes, booking.startMinutes + 1),
        },
        slot,
      ),
    );

    if (!inWorkSlot) {
      const start = booking.startMinutes;
      const end = Math.max(booking.endMinutes, start + DEFAULT_SLOT_MINUTES);

      rows.set(`${start}-${end}-external`, {
        start,
        end,
        label: `${formatTime(start)}–${formatTime(end)}`,
        source: booking.id,
        kind: 'external',
      });
    }
  }

  return [...rows.values()].sort((left, right) => left.start - right.start || left.end - right.end);
}


function passesBookingFilters(booking: CalendarBooking, filters: BookingStatusFilter) {
  return filters[booking.status] ?? true;
}

function countActiveFilters(filters: BookingStatusFilter) {
  const statuses = Object.keys(DEFAULT_BOOKING_FILTERS) as BookingStatus[];
  return statuses.filter((status) => filters[status] !== DEFAULT_BOOKING_FILTERS[status]).length;
}


function intervalKey(start: number, end: number) {
  return `${Math.round(start)}-${Math.round(end)}`;
}

function intervalKeyFromText(value: string) {
  const interval = splitIntervalText(value);
  return interval ? intervalKey(interval.start, interval.end) : null;
}

function buildExactAvailabilityDay(
  source: BookingAvailabilityDay | null,
  dateIso: string,
): BookingAvailabilityDay {
  const date = new Date(`${dateIso}T00:00:00`);

  return {
    ...(source ?? {}),
    id: source?.date === dateIso ? source.id : `override-${dateIso}`,
    date: dateIso,
    custom: true,
    weekdayIndex: getMondayIndex(date),
    status: source?.status ?? 'workday',
    slots: [...(source?.slots ?? [])],
    breaks: [...(source?.breaks ?? [])],
    blockedSlots: [...(source?.blockedSlots ?? [])],
  };
}

function updateAvailabilityBlockedSlots(
  availability: BookingAvailabilityDay[],
  selectedSlots: SelectedCalendarSlot[],
  mode: 'add' | 'remove',
) {
  const normalized = normalizeAvailabilityDays(availability);
  const byDate = new Map<string, SelectedCalendarSlot[]>();

  for (const slot of selectedSlots) {
    const current = byDate.get(slot.date) ?? [];
    current.push(slot);
    byDate.set(slot.date, current);
  }

  let next = [...normalized];

  byDate.forEach((slots, dateIso) => {
    const exactIndex = next.findIndex((day) => day.date === dateIso);
    const source = exactIndex >= 0 ? next[exactIndex] ?? null : findAvailabilityDay(next, dateIso);
    const day = buildExactAvailabilityDay(source, dateIso);
    const currentBlocked = uniqSortedIntervals(day.blockedSlots ?? []);
    const selectedLabels = slots.map((slot) => intervalLabel(slot.start, slot.end));
    const selectedKeys = new Set(selectedLabels.map(intervalKeyFromText).filter(Boolean));

    day.blockedSlots = mode === 'add'
      ? uniqSortedIntervals([...currentBlocked, ...selectedLabels])
      : currentBlocked.filter((value) => {
          const key = intervalKeyFromText(value);
          return !key || !selectedKeys.has(key);
        });

    if (exactIndex >= 0) {
      next = next.map((item, index) => (index === exactIndex ? day : item));
    } else {
      next = [...next, day];
    }
  });

  return next;
}

function getSlotState(plan: DayPlan, row: SlotSegment, bookings: CalendarBooking[]): SlotState {
  const rowRange = { start: row.start, end: row.end };
  const hasBooking = bookingsInSlot(bookings, row).some(isActiveBooking);
  if (hasBooking) return 'busy';

  const isBlocked = plan.blocked.some((slot) => overlaps(slot, rowRange));
  if (isBlocked || row.kind === 'block') return 'blocked';

  const isBreak = plan.breaks.some((slot) => overlaps(slot, rowRange));
  if (isBreak || row.kind === 'break') return 'break';

  const isWork = plan.slots.some((slot) => overlaps(slot, rowRange));
  if (isWork) return 'free';

  return 'outside';
}

function buildMetrics(
  visibleBookings: CalendarBooking[],
  plans: DayPlan[],
  nowIso: string,
  nowMinutes: number,
): CalendarMetrics {
  const slots = plans.reduce((sum, plan) => sum + plan.slots.length, 0);
  const active = visibleBookings.filter(isActiveBooking);
  const busy = active.length;
  const free = Math.max(0, slots - busy);
  const revenue = visibleBookings.reduce((sum, booking) => sum + booking.amount, 0);

  const next =
    [...visibleBookings]
      .filter(
        (booking) =>
          isActiveBooking(booking) &&
          `${booking.date}T${booking.start}` >= `${nowIso}T${formatTime(nowMinutes)}`,
      )
      .sort((left, right) =>
        `${left.date}T${left.start}`.localeCompare(`${right.date}T${right.start}`),
      )[0] ?? null;

  return {
    slots,
    busy,
    free,
    load: slots ? Math.min(100, Math.round((busy / slots) * 100)) : 0,
    revenue,
    next,
  };
}

function bookingStatusLabel(status: BookingStatus, locale: 'ru' | 'en') {
  if (locale === 'ru') {
    if (status === 'new') return 'Новая';
    if (status === 'confirmed') return 'Подтверждена';
    if (status === 'completed') return 'Пришёл';
    if (status === 'no_show') return 'Не пришёл';
    if (status === 'cancelled') return 'Отменена';
  }

  if (status === 'new') return 'New';
  if (status === 'confirmed') return 'Confirmed';
  if (status === 'completed') return 'Arrived';
  if (status === 'no_show') return 'No-show';
  if (status === 'cancelled') return 'Cancelled';

  return status;
}

function bookingStatusHint(status: BookingStatus, locale: 'ru' | 'en') {
  if (locale === 'ru') {
    if (status === 'new') return 'ожидает';
    if (status === 'confirmed') return 'в графике';
    if (status === 'completed') return 'закрыта';
    if (status === 'no_show') return 'пропуск';
    if (status === 'cancelled') return 'снята';
  }

  if (status === 'new') return 'waiting';
  if (status === 'confirmed') return 'scheduled';
  if (status === 'completed') return 'closed';
  if (status === 'no_show') return 'missed';
  if (status === 'cancelled') return 'cancelled';

  return 'status';
}

function getBookingStatusTone(status: BookingStatus, accentColor: string, light: boolean) {
  const color =
    status === 'new'
      ? accentColor
      : status === 'confirmed'
        ? '#22A06B'
        : status === 'completed'
          ? '#0EA5E9'
          : status === 'no_show'
            ? '#EF4444'
            : '#94A3B8';

  return {
    color,
    background: light
      ? `color-mix(in srgb, ${color} ${status === 'cancelled' ? 10 : 12}%, #ffffff)`
      : `color-mix(in srgb, ${color} 18%, #121212)`,
    border: light
      ? `color-mix(in srgb, ${color} ${status === 'cancelled' ? 30 : 42}%, #e7e2d8)`
      : `color-mix(in srgb, ${color} 44%, rgba(255,255,255,0.12))`,
    text: light
      ? `color-mix(in srgb, ${color} 72%, #111827)`
      : `color-mix(in srgb, ${color} 22%, #ffffff)`,
  };
}

function statusColor(booking: CalendarBooking, light: boolean, accentColor = CALENDAR_BOOKING_COLOR) {
  return getBookingStatusTone(booking.status, accentColor, light).color;
}

function statusChipStyle(status: BookingStatus, accentColor: string, light: boolean): CSSProperties {
  const tone = getBookingStatusTone(status, accentColor, light);

  return {
    background: tone.background,
    borderColor: tone.border,
    color: tone.text,
  };
}

function accentButtonStyle(accentColor: string, light: boolean): CSSProperties {
  return {
    background: light
      ? `linear-gradient(135deg, color-mix(in srgb, ${accentColor} 96%, #111827), color-mix(in srgb, ${accentColor} 76%, #111827))`
      : `linear-gradient(135deg, color-mix(in srgb, ${accentColor} 92%, #ffffff), color-mix(in srgb, ${accentColor} 62%, #111111))`,
    borderColor: light
      ? `color-mix(in srgb, ${accentColor} 65%, #111827)`
      : `color-mix(in srgb, ${accentColor} 60%, rgba(255,255,255,0.18))`,
    color: '#ffffff',
    boxShadow: light
      ? `0 12px 26px color-mix(in srgb, ${accentColor} 22%, transparent), inset 0 1px 0 rgba(255,255,255,0.24)`
      : `0 16px 34px color-mix(in srgb, ${accentColor} 28%, transparent), inset 0 1px 0 rgba(255,255,255,0.18)`,
  };
}

function getLessonWord(count: number, locale: 'ru' | 'en') {
  if (locale === 'en') return count === 1 ? 'class' : 'classes';

  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) return 'занятие';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'занятия';

  return 'занятий';
}

function getLoadLabel(active: number, total: number, locale: 'ru' | 'en') {
  if (!total) return locale === 'ru' ? 'нет графика' : 'no schedule';

  return locale === 'ru'
    ? `${active} из ${total} ${getLessonWord(total, locale)}`
    : `${active} of ${total} ${getLessonWord(total, locale)}`;
}

function getTimelineBounds(_plans: DayPlan[], _bookings: CalendarBooking[], _nowMinutes?: number) {
  // The work calendar must be visually stable. Do not expand the grid to 01:00
  // just because the current browser time is outside business hours.
  return {
    start: TIMETABLE_DAY_START,
    end: TIMETABLE_DAY_END,
  };
}

function getTimelineHours(start: number, end: number) {
  const hours: number[] = [];

  for (let value = start; value <= end; value += 60) {
    hours.push(value);
  }

  return hours;
}

function getTop(minutes: number, start: number) {
  return ((minutes - start) / 60) * TIMETABLE_HOUR_HEIGHT;
}

function getExactHeight(start: number, end: number) {
  return Math.max(1, ((end - start) / 60) * TIMETABLE_HOUR_HEIGHT);
}

function getSlotBlockTop(minutes: number, start: number) {
  return getTop(minutes, start) + TIMETABLE_SLOT_INSET_Y;
}

function getSlotBlockHeight(start: number, end: number) {
  return Math.max(
    26,
    getExactHeight(start, end) - TIMETABLE_SLOT_INSET_Y * 2,
  );
}

function getEventBlockTop(minutes: number, start: number) {
  return getTop(minutes, start) + 2;
}

function getEventBlockHeight(start: number, end: number) {
  return Math.max(24, getExactHeight(start, end) - 4);
}

function buildBookingLayouts(bookings: CalendarBooking[]) {
  const sorted = [...bookings]
    .filter(isActiveBooking)
    .sort((left, right) => left.startMinutes - right.startMinutes || left.endMinutes - right.endMinutes);

  const laneEnds: number[] = [];

  const layouts = sorted.map((booking) => {
    const lane = laneEnds.findIndex((end) => end <= booking.startMinutes);
    const resolvedLane = lane === -1 ? laneEnds.length : lane;

    laneEnds[resolvedLane] = booking.endMinutes;

    return {
      booking,
      lane: resolvedLane,
      laneCount: 1,
    };
  });

  return layouts.map((layout) => {
    const laneCount = layouts
      .filter((item) =>
        overlaps(
          { start: layout.booking.startMinutes, end: layout.booking.endMinutes },
          { start: item.booking.startMinutes, end: item.booking.endMinutes },
        ),
      )
      .reduce((max, item) => Math.max(max, item.lane + 1), 1);

    return {
      ...layout,
      laneCount,
    };
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
    <section className={cn('rounded-[14px] border', cardTone(light), className)}>
      {children}
    </section>
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
  compact,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  light: boolean;
  accentColor: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative inline-flex shrink-0 items-center justify-center border-r text-[11px] font-semibold tracking-[-0.015em] transition-colors duration-150 last:border-r-0 active:scale-[0.985]',
        compact ? 'h-8 min-w-[50px] px-3' : 'h-10 min-w-[72px] px-4',
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

function MetricTile({
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
        'min-w-0 rounded-[12px] border px-3 py-2.5 transition-[background,border-color,transform] duration-150 hover:-translate-y-px',
        light
          ? 'border-[#e4ded4] bg-white shadow-[0_8px_20px_rgba(17,17,17,0.025)] hover:border-[#d8d0c2] hover:bg-[#fffdf9]'
          : 'border-white/[0.07] bg-white/[0.035] hover:border-white/[0.11] hover:bg-white/[0.055]',
      )}
    >
      <div className={cn('truncate text-[10.5px] font-medium', mutedText(light))}>
        {label}
      </div>

      <div
        className={cn(
          'mt-1.5 truncate text-[18px] font-semibold leading-none tracking-[-0.055em] tabular-nums',
          pageText(light),
        )}
      >
        <NumberPopIn value={value} />
      </div>

      {hint ? (
        <div className={cn('mt-1 truncate text-[10px]', faintText(light))}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

function EmptyState({
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
        'rounded-[14px] border px-4 py-5 text-[12px]',
        insetTone(light),
        mutedText(light),
        className,
      )}
    >
      {children}
    </div>
  );
}

function CalendarLegend({ light, locale, accentColor }: { light: boolean; locale: 'ru' | 'en'; accentColor: string }) {
  const items =
    locale === 'ru'
      ? [
          { label: 'Запись', color: accentColor },
          { label: 'Свободно', color: '#D7DBDF' },
          { label: 'Перерыв', color: '#F59E62' },
          { label: 'Недоступно', color: '#A78BFA' },
          { label: 'Текущее время', color: '#EF4444' },
        ]
      : [
          { label: 'Booking', color: accentColor },
          { label: 'Free', color: '#D7DBDF' },
          { label: 'Break', color: '#F59E62' },
          { label: 'Unavailable', color: '#A78BFA' },
          { label: 'Current time', color: '#EF4444' },
        ];

  return (
    <div className="hidden items-center gap-5 xl:flex">
      {items.map((item) => (
        <span
          key={item.label}
          className={cn(
            'inline-flex items-center gap-1.5 whitespace-nowrap text-[11px] font-medium',
            light ? 'text-[#6f756f]' : 'text-white/56',
          )}
        >
          <span className="size-1.5 rounded-full" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

function CalendarZone({
  title,
  description,
  light,
  locale,
  filterOpen,
  activeFilterCount,
  children,
  onCreateBooking,
  onToggleFilters,
  accentColor,
}: {
  title: string;
  description: string;
  light: boolean;
  locale: 'ru' | 'en';
  filterOpen: boolean;
  activeFilterCount: number;
  accentColor: string;
  children: ReactNode;
  onCreateBooking: () => void;
  onToggleFilters: () => void;
}) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-[18px] border font-sans',
        light
          ? 'border-[#ddd9d1] bg-[#fffdf9] shadow-[0_18px_48px_rgba(36,32,25,0.055)]'
          : 'border-white/[0.09] bg-[#101112] shadow-[0_24px_70px_rgba(0,0,0,0.34)]',
      )}
    >
      <div
        className={cn(
          'flex min-h-[54px] items-center justify-between gap-4 border-b px-3.5 py-2.5 md:px-4',
          light ? 'border-[#e7e1d8] bg-[#fffdf9]' : 'border-white/[0.08] bg-white/[0.02]',
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Button type="button" className={buttonBase(light)} style={accentButtonStyle(accentColor, light)} onClick={onCreateBooking}>
            <Plus className="size-3.5" />
            {locale === 'ru' ? 'Новая запись' : 'New booking'}
          </Button>

          <Button
            type="button"
            className={buttonBase(light, filterOpen || activeFilterCount > 0)}
            style={filterOpen || activeFilterCount > 0 ? statusChipStyle('new', accentColor, light) : undefined}
            onClick={onToggleFilters}
          >
            <SlidersHorizontal className="size-3.5" />
            {locale === 'ru' ? 'Фильтры' : 'Filters'}
            {activeFilterCount > 0 ? (
              <span className="ml-0.5 rounded-full bg-current/10 px-1.5 py-0.5 text-[10px]">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>
        </div>

        <CalendarLegend light={light} locale={locale} accentColor={accentColor} />
      </div>

      <div className="sr-only">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      {children}
    </section>
  );
}

function CalendarFiltersPanel({
  filters,
  light,
  locale,
  accentColor,
  onChange,
  onReset,
}: {
  filters: BookingStatusFilter;
  light: boolean;
  locale: 'ru' | 'en';
  accentColor: string;
  onChange: (status: BookingStatus, value: boolean) => void;
  onReset: () => void;
}) {
  const statuses: BookingStatus[] = ['new', 'confirmed', 'completed', 'no_show', 'cancelled'];

  return (
    <div
      className={cn(
        'border-b px-4 py-3 font-sans',
        light ? 'border-[#e7e1d8] bg-[#fffdf9]' : 'border-white/[0.08] bg-white/[0.025]',
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className={cn('text-[12px] font-bold', pageText(light))}>
            {locale === 'ru' ? 'Показывать записи' : 'Show bookings'}
          </div>
          <div className={cn('mt-0.5 text-[10.5px]', mutedText(light))}>
            {locale === 'ru'
              ? 'Фильтр влияет только на отображение карточек в календаре.'
              : 'Filters only affect visible cards in the calendar.'}
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className={cn(
            'self-start rounded-[9px] border px-3 py-1.5 text-[11px] font-semibold transition-colors md:self-auto',
            light
              ? 'border-[#ded8cf] bg-white text-[#67615b] hover:bg-[#f7f2ea]'
              : 'border-white/[0.08] bg-white/[0.04] text-white/58 hover:bg-white/[0.07]',
          )}
        >
          {locale === 'ru' ? 'Сбросить' : 'Reset'}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {statuses.map((status) => {
          const checked = filters[status];
          const tone = getBookingStatusTone(status, accentColor, light);

          return (
            <label
              key={status}
              style={checked ? statusChipStyle(status, accentColor, light) : undefined}
              className={cn(
                'inline-flex cursor-pointer select-none items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-[background,border-color,color,transform] duration-150 active:scale-[0.985]',
                checked
                  ? 'shadow-[0_8px_18px_rgba(24,32,45,0.045)]'
                  : light
                    ? 'border-[#ded8cf] bg-white text-[#7a746c] hover:bg-[#faf7f2]'
                    : 'border-white/[0.08] bg-white/[0.035] text-white/52 hover:bg-white/[0.06]',
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(status, event.currentTarget.checked)}
                className="sr-only"
              />

              <span
                className={cn(
                  'grid size-4 place-items-center rounded-full border text-[9px] leading-none',
                  checked ? 'text-white' : light ? 'bg-white' : 'bg-white/[0.035]',
                )}
                style={{
                  background: checked ? tone.color : undefined,
                  borderColor: checked ? tone.color : tone.border,
                  color: checked ? '#fff' : tone.color,
                }}
              >
                {checked ? '✓' : ''}
              </span>

              <span>{bookingStatusLabel(status, locale)}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}


function BlockSelectionPanel({
  count,
  loading,
  error,
  light,
  locale,
  accentColor,
  onBlock,
  onClear,
}: {
  count: number;
  loading: boolean;
  error: string | null;
  light: boolean;
  locale: 'ru' | 'en';
  accentColor: string;
  onBlock: () => void;
  onClear: () => void;
}) {
  if (count <= 0 && !error) return null;

  return (
    <div
      className={cn(
        'border-b px-4 py-3 font-sans',
        light ? 'border-[#e7e1d8] bg-[#fffaf2]' : 'border-white/[0.08] bg-white/[0.025]',
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className={cn('text-[12px] font-bold', pageText(light))}>
            {locale === 'ru'
              ? `${count} ${count === 1 ? 'слот выбран' : count < 5 ? 'слота выбрано' : 'слотов выбрано'}`
              : `${count} selected slot${count === 1 ? '' : 's'}`}
          </div>
          <div className={cn('mt-0.5 text-[10.5px]', mutedText(light))}>
            {locale === 'ru'
              ? 'Блокировка сохранится в графике работы на конкретный день и скроет эти окна от клиентов.'
              : 'Blocking is saved to availability for the exact day and hides these windows from clients.'}
          </div>
          {error ? <div className="mt-1 text-[10.5px] font-semibold text-red-500">{error}</div> : null}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          <Button type="button" className={buttonBase(light)} onClick={onClear} disabled={loading}>
            <X className="size-3.5" />
            {locale === 'ru' ? 'Снять выделение' : 'Clear'}
          </Button>
          <Button
            type="button"
            className={buttonBase(light, true)}
            style={accentButtonStyle(accentColor, light)}
            onClick={onBlock}
            disabled={loading || count <= 0}
          >
            <LockKeyhole className="size-3.5" />
            {loading ? '…' : locale === 'ru' ? 'Заблокировать' : 'Block'}
          </Button>
        </div>
      </div>
    </div>
  );
}


function UnblockSlotConfirmDialog({
  slot,
  light,
  locale,
  loading,
  accentColor,
  onCancel,
  onConfirm,
}: {
  slot: SelectedCalendarSlot;
  light: boolean;
  locale: 'ru' | 'en';
  loading: boolean;
  accentColor: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dateTitle = formatDialogDateTitle(slot.date, locale);
  const timeTitle = `${formatTime(slot.start)}–${formatTime(slot.end)}`;

  return (
    <div
      className="fixed inset-0 z-[130] grid place-items-center bg-black/38 px-4 py-6 backdrop-blur-[10px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) onCancel();
      }}
      role="presentation"
    >
      <div
        className={cn(
          'w-full max-w-[420px] overflow-hidden rounded-[18px] border shadow-[0_24px_80px_rgba(0,0,0,0.22)]',
          light ? 'border-[#e3ddd3] bg-white text-[#101114]' : 'border-white/[0.1] bg-[#151515] text-white',
        )}
        role="dialog"
        aria-modal="true"
        aria-label={locale === 'ru' ? 'Подтвердить разблокировку' : 'Confirm unblock'}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={cn('border-b px-5 py-4', light ? 'border-[#ebe5dc]' : 'border-white/[0.08]')}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className={cn('text-[10px] font-bold uppercase tracking-[0.18em]', mutedText(light))}>
                {locale === 'ru' ? 'Разблокировка слота' : 'Unblock slot'}
              </div>
              <h2 className={cn('mt-2 text-[20px] font-semibold tracking-[-0.045em]', pageText(light))}>
                {locale === 'ru' ? 'Разблокировать это время?' : 'Unblock this time?'}
              </h2>
            </div>

            <button
              type="button"
              className={iconButtonBase(light)}
              onClick={onCancel}
              disabled={loading}
              aria-label={locale === 'ru' ? 'Закрыть' : 'Close'}
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4">
          <div
            className={cn(
              'rounded-[14px] border p-4',
              light ? 'border-violet-100 bg-violet-50/55' : 'border-violet-300/20 bg-violet-300/[0.08]',
            )}
            style={{
              backgroundImage: light
                ? 'repeating-linear-gradient(-45deg, rgba(139,92,246,0.045) 0px, rgba(139,92,246,0.045) 8px, transparent 8px, transparent 18px)'
                : 'repeating-linear-gradient(-45deg, rgba(167,139,250,0.08) 0px, rgba(167,139,250,0.08) 8px, transparent 8px, transparent 18px)',
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'grid size-10 shrink-0 place-items-center rounded-full border',
                  light ? 'border-violet-200 bg-white text-violet-600' : 'border-violet-300/25 bg-white/[0.06] text-violet-200',
                )}
              >
                <LockKeyhole className="size-4" />
              </div>
              <div className="min-w-0">
                <div className={cn('text-[13px] font-bold', pageText(light))}>{timeTitle}</div>
                <div className={cn('mt-0.5 text-[11px] font-medium', mutedText(light))}>{dateTitle}</div>
              </div>
            </div>
          </div>

          <p className={cn('mt-4 text-[12px] leading-5', mutedText(light))}>
            {locale === 'ru'
              ? 'После подтверждения этот диапазон снова станет доступным в графике работы, и клиенты смогут выбрать его для записи.'
              : 'After confirmation, this range becomes available in availability again, and clients can book it.'}
          </p>
        </div>

        <div className={cn('flex justify-end gap-2 border-t px-5 py-4', light ? 'border-[#ebe5dc]' : 'border-white/[0.08]')}>
          <Button type="button" className={buttonBase(light)} onClick={onCancel} disabled={loading}>
            {locale === 'ru' ? 'Отмена' : 'Cancel'}
          </Button>
          <Button
            type="button"
            className={buttonBase(light, true)}
            style={accentButtonStyle(accentColor, light)}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? '…' : locale === 'ru' ? 'Да, разблокировать' : 'Yes, unblock'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function parseLocalIsoDate(value: string) {
  const [yearRaw, monthRaw, dayRaw] = value.split('-').map(Number);
  const year = Number.isFinite(yearRaw) ? yearRaw : new Date().getFullYear();
  const month = Number.isFinite(monthRaw) ? monthRaw - 1 : new Date().getMonth();
  const day = Number.isFinite(dayRaw) ? dayRaw : new Date().getDate();
  return new Date(year, month, day);
}

function formatDialogDate(value: string, locale: 'ru' | 'en') {
  const date = parseLocalIsoDate(value);
  if (locale === 'ru') {
    return `${date.getDate().toString().padStart(2, '0')} . ${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')} . ${date.getFullYear()}`;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatDialogDateTitle(value: string, locale: 'ru' | 'en') {
  const date = parseLocalIsoDate(value);
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatMonthTitle(date: Date, locale: 'ru' | 'en') {
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function getCalendarPickerDays(month: Date) {
  const monthStart = startOfMonth(month);
  const gridStart = startOfWeekMonday(monthStart);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function buildTimeSelectOptions(value: string) {
  const values = new Set<string>();
  for (let minutes = 8 * 60; minutes <= 21 * 60; minutes += 30) {
    values.add(formatTime(minutes));
  }
  if (value) values.add(value);
  return [...values].sort((left, right) => parseBookingTime(left) - parseBookingTime(right));
}

function useDismissOnOutsideClick<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const rootRef = useRef<T | null>(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (target && rootRef.current?.contains(target)) return;
      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  return rootRef;
}

function CustomDatePicker({
  value,
  light,
  locale,
  accentColor,
  onChange,
}: {
  value: string;
  light: boolean;
  locale: 'ru' | 'en';
  accentColor: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useDismissOnOutsideClick<HTMLDivElement>(open, () => setOpen(false));
  const [month, setMonth] = useState(() => startOfMonth(parseLocalIsoDate(value)));

  useEffect(() => {
    setMonth(startOfMonth(parseLocalIsoDate(value)));
  }, [value]);

  const selectedIso = value;
  const todayIso = toLocalIsoDate(new Date());
  const days = useMemo(() => getCalendarPickerDays(month), [month]);
  const weekdays = locale === 'ru' ? WEEKDAY_SHORT_FALLBACK_RU : WEEKDAY_SHORT_FALLBACK_EN;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'flex h-11 w-full items-center justify-between rounded-[11px] border px-3 text-left text-[13px] font-medium outline-none transition-[background,border-color,box-shadow]',
          light
            ? 'border-[#e2ddd5] bg-[#fffdf9] text-[#111827] hover:bg-white focus-visible:border-black/15 focus-visible:shadow-[0_0_0_3px_rgba(17,24,39,0.04)]'
            : 'border-white/[0.09] bg-white/[0.055] text-white hover:bg-white/[0.075] focus-visible:border-white/20 focus-visible:shadow-[0_0_0_3px_rgba(255,255,255,0.05)]',
        )}
      >
        <span className="tabular-nums">{formatDialogDate(value, locale)}</span>
        <CalendarClock className={cn('size-4', light ? 'text-[#6b7280]' : 'text-white/55')} />
      </button>

      {open ? (
        <div
          className={cn(
            'absolute left-0 top-[calc(100%+8px)] z-[120] w-[286px] rounded-[14px] border p-3 shadow-[0_22px_70px_rgba(0,0,0,0.36)]',
            light
              ? 'border-[#e6e0d8] bg-white text-[#15171b]'
              : 'border-white/[0.12] bg-[#27262d] text-white',
          )}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setMonth((current) => addMonths(current, -1))}
              className={cn(
                'grid size-8 place-items-center rounded-[8px] transition-colors',
                light ? 'text-[#77716b] hover:bg-black/[0.04]' : 'text-white/55 hover:bg-white/[0.07]',
              )}
            >
              <ChevronLeft className="size-4" />
            </button>

            <button
              type="button"
              className={cn(
                'h-8 rounded-[7px] border px-3 text-[12px] font-semibold',
                light ? 'border-[#ded8d0] bg-[#fbfaf7]' : 'border-white/[0.18] bg-white/[0.055]',
              )}
            >
              {formatMonthTitle(month, locale)}
            </button>

            <button
              type="button"
              onClick={() => setMonth((current) => addMonths(current, 1))}
              className={cn(
                'grid size-8 place-items-center rounded-[8px] transition-colors',
                light ? 'text-[#77716b] hover:bg-black/[0.04]' : 'text-white/55 hover:bg-white/[0.07]',
              )}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {weekdays.map((day) => (
              <div
                key={day}
                className={cn(
                  'py-1 text-[10px] font-medium uppercase tracking-[0.04em]',
                  light ? 'text-[#8b847d]' : 'text-white/42',
                )}
              >
                {day.slice(0, 2)}
              </div>
            ))}

            {days.map((date) => {
              const iso = toLocalIsoDate(date);
              const selected = iso === selectedIso;
              const today = iso === todayIso;
              const outside = date.getMonth() !== month.getMonth();

              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => {
                    onChange(iso);
                    setOpen(false);
                  }}
                  className={cn(
                    'grid size-8 place-items-center rounded-[8px] text-[12px] font-semibold tabular-nums transition-[background,color,box-shadow,transform] active:scale-95',
                    selected
                      ? 'text-white shadow-[0_10px_22px_rgba(0,0,0,0.22)]'
                      : outside
                        ? light
                          ? 'text-[#c0bab3] hover:bg-black/[0.035]'
                          : 'text-white/24 hover:bg-white/[0.055]'
                        : light
                          ? 'text-[#252a31] hover:bg-black/[0.045]'
                          : 'text-white/78 hover:bg-white/[0.07]',
                  )}
                  style={
                    selected
                      ? { background: accentColor }
                      : today
                        ? {
                            boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accentColor} 48%, transparent)`,
                            color: accentColor,
                          }
                        : undefined
                  }
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onChange(todayIso);
                setOpen(false);
              }}
              className={cn(
                'rounded-[8px] border px-3 py-1.5 text-[12px] font-semibold',
                light
                  ? 'border-[#ded8d0] text-[#4f4a45] hover:bg-[#faf7f2]'
                  : 'border-white/[0.18] text-white/86 hover:bg-white/[0.07]',
              )}
            >
              {locale === 'ru' ? 'Сегодня' : 'Today'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CustomTimePicker({
  value,
  light,
  locale,
  accentColor,
  onChange,
}: {
  value: string;
  light: boolean;
  locale: 'ru' | 'en';
  accentColor: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useDismissOnOutsideClick<HTMLDivElement>(open, () => setOpen(false));
  const options = useMemo(() => buildTimeSelectOptions(value), [value]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'flex h-11 w-full items-center justify-between rounded-[11px] border px-3 text-left text-[13px] font-medium tabular-nums outline-none transition-[background,border-color,box-shadow]',
          light
            ? 'border-[#e2ddd5] bg-[#fffdf9] text-[#111827] hover:bg-white focus-visible:border-black/15 focus-visible:shadow-[0_0_0_3px_rgba(17,24,39,0.04)]'
            : 'border-white/[0.09] bg-white/[0.055] text-white hover:bg-white/[0.075] focus-visible:border-white/20 focus-visible:shadow-[0_0_0_3px_rgba(255,255,255,0.05)]',
        )}
      >
        <span>{value || (locale === 'ru' ? 'Выберите время' : 'Select time')}</span>
        <ChevronRight className={cn('size-4 rotate-90', light ? 'text-[#6b7280]' : 'text-white/55')} />
      </button>

      {open ? (
        <div
          className={cn(
            'absolute left-0 top-[calc(100%+8px)] z-[120] w-[184px] rounded-[14px] border p-1.5 shadow-[0_22px_70px_rgba(0,0,0,0.34)]',
            light ? 'border-[#e6e0d8] bg-white' : 'border-white/[0.12] bg-[#242326]',
          )}
        >
          <div className={cn('grid place-items-center py-1', light ? 'text-[#8a837b]' : 'text-white/42')}>
            <ChevronRight className="size-4 -rotate-90" />
          </div>
          <div className="max-h-[236px] overflow-y-auto pr-1 [scrollbar-width:thin]">
            {options.map((option) => {
              const selected = option === value;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex h-10 w-full items-center justify-between rounded-[9px] px-3 text-left text-[13px] font-medium tabular-nums transition-colors',
                    selected
                      ? light
                        ? 'bg-black/[0.055] text-[#111827]'
                        : 'bg-white/[0.09] text-white'
                      : light
                        ? 'text-[#4b5563] hover:bg-black/[0.035]'
                        : 'text-white/70 hover:bg-white/[0.065]',
                  )}
                >
                  <span>{option}</span>
                  {selected ? <span style={{ color: accentColor }}>✓</span> : null}
                </button>
              );
            })}
          </div>
          <div className={cn('grid place-items-center py-1', light ? 'text-[#8a837b]' : 'text-white/42')}>
            <ChevronRight className="size-4 rotate-90" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CustomServiceSelect({
  value,
  services,
  light,
  locale,
  accentColor,
  onChange,
}: {
  value: string;
  services: string[];
  light: boolean;
  locale: 'ru' | 'en';
  accentColor: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useDismissOnOutsideClick<HTMLDivElement>(open, () => setOpen(false));
  const selectedService = value || services[0] || '';

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'flex h-11 w-full items-center justify-between rounded-[11px] border px-3 text-left text-[13px] font-semibold outline-none transition-[background,border-color,box-shadow]',
          light
            ? 'border-[#e2ddd5] bg-[#fffdf9] text-[#111827] hover:bg-white focus-visible:border-black/15 focus-visible:shadow-[0_0_0_3px_rgba(17,24,39,0.04)]'
            : 'border-white/[0.09] bg-white/[0.055] text-white hover:bg-white/[0.075] focus-visible:border-white/20 focus-visible:shadow-[0_0_0_3px_rgba(255,255,255,0.05)]',
        )}
      >
        <span className="truncate">{selectedService || (locale === 'ru' ? 'Выберите услугу' : 'Select service')}</span>
        <ChevronRight className={cn('size-4 rotate-90', light ? 'text-[#6b7280]' : 'text-white/55')} />
      </button>

      {open ? (
        <div
          className={cn(
            'absolute left-0 right-0 top-[calc(100%+8px)] z-[120] rounded-[14px] border p-1.5 shadow-[0_22px_70px_rgba(0,0,0,0.34)]',
            light ? 'border-[#e6e0d8] bg-white' : 'border-white/[0.12] bg-[#242326]',
          )}
        >
          <div className="max-h-[244px] overflow-y-auto pr-1 [scrollbar-width:thin]">
            {services.map((service) => {
              const selected = service === selectedService;

              return (
                <button
                  key={service}
                  type="button"
                  onClick={() => {
                    onChange(service);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-[10px] px-3 py-2.5 text-left transition-colors',
                    selected
                      ? light
                        ? 'bg-black/[0.045] text-[#111827]'
                        : 'bg-white/[0.08] text-white'
                      : light
                        ? 'text-[#4b5563] hover:bg-black/[0.03]'
                        : 'text-white/68 hover:bg-white/[0.055]',
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold">{service}</span>
                    <span className={cn('mt-0.5 block text-[11px]', light ? 'text-[#8c857d]' : 'text-white/34')}>
                      {locale === 'ru' ? 'Услуга из каталога' : 'Catalog service'}
                    </span>
                  </span>

                  {selected ? (
                    <span
                      className="grid size-5 shrink-0 place-items-center rounded-full text-[11px] text-white"
                      style={{ background: accentColor }}
                    >
                      ✓
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CreateBookingDialog({
  draft,
  services,
  light,
  locale,
  loading,
  error,
  accentColor,
  onChange,
  onClose,
  onSubmit,
}: {
  draft: CreateBookingDraft;
  services: string[];
  light: boolean;
  locale: 'ru' | 'en';
  loading: boolean;
  error: string | null;
  accentColor: string;
  onChange: (patch: Partial<CreateBookingDraft>) => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const inputClass = cn(
    'h-11 w-full rounded-[11px] border px-3 text-[13px] font-medium outline-none transition-[background,border-color,box-shadow]',
    light
      ? 'border-[#e2ddd5] bg-[#fffdf9] text-[#111827] placeholder:text-[#a5a09a] focus:border-black/15 focus:bg-white focus:shadow-[0_0_0_3px_rgba(17,24,39,0.04)]'
      : 'border-white/[0.09] bg-white/[0.055] text-white placeholder:text-white/28 focus:border-white/20 focus:bg-white/[0.075] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.05)]',
  );
  const labelClass = cn('mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.11em]', mutedText(light));

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/45 p-3 backdrop-blur-[4px] md:items-center">
      <button
        type="button"
        aria-label={locale === 'ru' ? 'Закрыть' : 'Close'}
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <form
        onSubmit={onSubmit}
        className={cn(
          'relative w-full max-w-[540px] overflow-visible rounded-[20px] border shadow-[0_30px_100px_rgba(0,0,0,0.36)]',
          light ? 'border-[#e1dbd2] bg-white' : 'border-white/[0.11] bg-[#151515]',
        )}
      >
        <div className="flex items-start justify-between gap-3 rounded-t-[20px] border-b border-black/[0.06] p-4 dark:border-white/[0.08]">
          <div className="min-w-0">
            <div className={cn('text-[11px] font-bold uppercase tracking-[0.16em]', mutedText(light))}>
              {locale === 'ru' ? 'Новая запись' : 'New booking'}
            </div>
            <div className={cn('mt-1 text-[23px] font-semibold tracking-[-0.06em]', pageText(light))}>
              {formatDialogDateTitle(draft.date, locale)} · {draft.time}
            </div>
          </div>

          <button type="button" onClick={onClose} className={iconButtonBase(light)}>
            <X className="size-4" />
          </button>
        </div>

        <div className="grid gap-3 p-4 md:grid-cols-2">
          <label className="block">
            <span className={labelClass}>{locale === 'ru' ? 'Клиент' : 'Client'}</span>
            <input
              value={draft.clientName}
              onChange={(event) => onChange({ clientName: event.currentTarget.value })}
              className={inputClass}
              placeholder={locale === 'ru' ? 'Имя клиента' : 'Client name'}
              required
            />
          </label>

          <label className="block">
            <span className={labelClass}>{locale === 'ru' ? 'Телефон' : 'Phone'}</span>
            <input
              value={draft.clientPhone}
              onChange={(event) => onChange({ clientPhone: event.currentTarget.value })}
              className={inputClass}
              placeholder="+7 999 000-00-00"
              required
            />
          </label>

          <label className="block md:col-span-2">
            <span className={labelClass}>{locale === 'ru' ? 'Услуга' : 'Service'}</span>
            {services.length ? (
              <CustomServiceSelect
                value={draft.service}
                services={services}
                light={light}
                locale={locale}
                accentColor={accentColor}
                onChange={(service) => onChange({ service })}
              />
            ) : (
              <input
                value={draft.service}
                onChange={(event) => onChange({ service: event.currentTarget.value })}
                className={inputClass}
                placeholder={locale === 'ru' ? 'Название услуги' : 'Service name'}
                required
              />
            )}
          </label>

          <label className="block">
            <span className={labelClass}>{locale === 'ru' ? 'Дата' : 'Date'}</span>
            <CustomDatePicker
              value={draft.date}
              light={light}
              locale={locale}
              accentColor={accentColor}
              onChange={(date) => onChange({ date })}
            />
          </label>

          <label className="block">
            <span className={labelClass}>{locale === 'ru' ? 'Время' : 'Time'}</span>
            <CustomTimePicker
              value={draft.time}
              light={light}
              locale={locale}
              accentColor={accentColor}
              onChange={(time) => onChange({ time })}
            />
          </label>

          <label className="block md:col-span-2">
            <span className={labelClass}>{locale === 'ru' ? 'Комментарий' : 'Note'}</span>
            <textarea
              value={draft.comment}
              onChange={(event) => onChange({ comment: event.currentTarget.value })}
              className={cn(inputClass, 'h-20 resize-none py-2')}
              placeholder={locale === 'ru' ? 'Необязательно' : 'Optional'}
            />
          </label>
        </div>

        {error ? (
          <div className="px-4 pb-3">
            <div className="rounded-[12px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700">
              {error}
            </div>
          </div>
        ) : null}

        <div className="flex justify-end gap-2 rounded-b-[20px] border-t border-black/[0.06] p-4 dark:border-white/[0.08]">
          <Button type="button" className={buttonBase(light)} onClick={onClose} disabled={loading}>
            {locale === 'ru' ? 'Отмена' : 'Cancel'}
          </Button>
          <Button type="submit" className={buttonBase(light, true)} style={accentButtonStyle(accentColor, light)} disabled={loading}>
            <Plus className="size-3.5" />
            {loading ? '…' : locale === 'ru' ? 'Создать запись' : 'Create booking'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function TimetableNowGutterMarker({
  nowMinutes,
  start,
}: {
  nowMinutes: number;
  start: number;
}) {
  return (
    <div
      className="pointer-events-none absolute left-0 right-0 z-50 -translate-y-1/2"
      style={{ top: getTop(nowMinutes, start) }}
    >
      <div className="flex justify-end pr-3">
        <span className="rounded-full bg-[#ef4444] px-2 py-0.5 text-[10px] font-bold leading-none tabular-nums text-white shadow-[0_6px_18px_rgba(239,68,68,0.25)]">
          {formatTime(nowMinutes)}
        </span>
      </div>
    </div>
  );
}

function TimetableNowLine({
  nowMinutes,
  start,
}: {
  nowMinutes: number;
  start: number;
}) {
  return (
    <div
      className="pointer-events-none absolute left-0 right-0 z-40 -translate-y-1/2"
      style={{ top: getTop(nowMinutes, start) }}
    >
      <div className="flex items-center">
        <span className="h-px flex-1 bg-[#ef4444]" />
        <span className="mr-2 size-1.5 rounded-full bg-[#ef4444]" />
      </div>
    </div>
  );
}

function appointmentCardStyle(
  status: BookingStatus,
  accentColor: string,
  light: boolean,
  selected?: boolean,
): CSSProperties {
  const tone = getBookingStatusTone(status, accentColor, light);

  return {
    background: light
      ? `linear-gradient(135deg, color-mix(in srgb, ${tone.color} 10%, #ffffff), color-mix(in srgb, ${tone.color} 3%, #ffffff))`
      : `linear-gradient(135deg, color-mix(in srgb, ${tone.color} 20%, #171717), color-mix(in srgb, ${tone.color} 7%, #171717))`,
    borderColor: selected
      ? tone.border
      : light
        ? `color-mix(in srgb, ${tone.color} 24%, #e4e1dc)`
        : `color-mix(in srgb, ${tone.color} 34%, rgba(255,255,255,0.12))`,
    boxShadow: selected
      ? light
        ? `0 0 0 1px color-mix(in srgb, ${tone.color} 22%, transparent), 0 12px 28px rgba(18, 24, 38, 0.09)`
        : `0 0 0 1px color-mix(in srgb, ${tone.color} 36%, transparent), 0 18px 34px rgba(0,0,0,0.34)`
      : light
        ? '0 7px 18px rgba(24, 32, 45, 0.048)'
        : '0 12px 24px rgba(0,0,0,0.24)',
  };
}

function UnavailableBlock({
  start,
  end,
  boundsStart,
  light,
  locale,
}: {
  start: number;
  end: number;
  boundsStart: number;
  light: boolean;
  locale: 'ru' | 'en';
}) {
  return (
    <div
      className={cn(
        'absolute left-2 right-2 overflow-hidden rounded-[7px] border px-3 py-2',
        light
          ? 'border-violet-100 bg-violet-50/65 text-violet-500'
          : 'border-violet-300/20 bg-violet-300/[0.08] text-violet-200',
      )}
      style={{
        top: getSlotBlockTop(start, boundsStart),
        height: getSlotBlockHeight(start, end),
        backgroundImage: light
          ? 'repeating-linear-gradient(-45deg, rgba(139,92,246,0.045) 0px, rgba(139,92,246,0.045) 8px, transparent 8px, transparent 18px)'
          : 'repeating-linear-gradient(-45deg, rgba(167,139,250,0.08) 0px, rgba(167,139,250,0.08) 8px, transparent 8px, transparent 18px)',
      }}
    >
      <div className="flex h-full items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[10px] font-bold">
            {locale === 'ru' ? 'Недоступно' : 'Unavailable'}
          </div>
          <div className="mt-0.5 truncate text-[9px] font-medium tabular-nums opacity-75">
            {formatTime(start)}–{formatTime(end)}
          </div>
        </div>
        <LockKeyhole className="mt-0.5 size-3.5 shrink-0 opacity-70" />
      </div>
    </div>
  );
}

function TimetableBookingCard({
  booking,
  light,
  locale,
  selected,
  density,
  onClick,
  accentColor,
}: {
  booking: CalendarBooking;
  light: boolean;
  locale: 'ru' | 'en';
  selected?: boolean;
  density?: 'normal' | 'compact' | 'tiny';
  onClick: () => void;
  accentColor: string;
}) {
  const cardDensity = density ?? 'normal';
  const isTiny = cardDensity === 'tiny';
  const isCompact = cardDensity === 'compact';
  const initials = booking.clientName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <button
      type="button"
      onClick={onClick}
      style={appointmentCardStyle(booking.status, accentColor, light, selected)}
      className={cn(
        'group relative h-full w-full overflow-hidden rounded-[8px] border text-left transition-[box-shadow,transform,border-color] duration-150 hover:-translate-y-px',
        isTiny ? 'px-2 py-1.5' : isCompact ? 'px-2 py-2' : 'px-2.5 py-2.5',
      )}
    >
      <span
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: statusColor(booking, light, accentColor) }}
      />

      <div className={cn('relative h-full min-h-0 pl-1.5 pr-7 font-sans', isTiny ? 'pb-0' : 'pb-[18px]')}>
        <div className="min-w-0">
          <div className={cn('truncate font-medium tabular-nums tracking-[-0.01em]', isTiny ? 'text-[9px]' : 'text-[9.5px]', light ? 'text-[#58615d]' : 'text-white/56')}>
            {booking.start} – {booking.end}
          </div>
          <div className={cn('truncate font-semibold tracking-[-0.025em]', isTiny ? 'mt-0 text-[10.5px]' : 'mt-0.5 text-[11.5px]', pageText(light))}>
            {booking.clientName}
          </div>
          {!isTiny ? (
            <div className={cn('mt-1 truncate text-[9.5px] font-medium leading-tight', light ? 'text-[#5f6a67]' : 'text-white/50')}>
              {booking.service}
            </div>
          ) : null}
        </div>

        {!isTiny ? (
          <span
            className={cn(
              'absolute right-0 top-0 grid place-items-center overflow-hidden rounded-full font-semibold shadow-sm',
              isCompact ? 'size-5 text-[8.5px]' : 'size-6 text-[9px]',
              light ? 'bg-white/80 text-[#626b65] ring-1 ring-black/[0.045]' : 'bg-white/[0.09] text-white/68 ring-1 ring-white/[0.06]',
            )}
            title={booking.clientName}
          >
            {initials || '•'}
          </span>
        ) : null}

        {!isTiny ? (
          <div className="absolute bottom-0 left-1.5 right-0 flex min-w-0 items-center justify-between gap-1.5">
            <span
              style={statusChipStyle(booking.status, accentColor, light)}
              className="min-w-0 max-w-[76px] truncate rounded-full border px-1.5 py-[2px] text-[8.5px] font-semibold leading-none"
            >
              {bookingStatusLabel(booking.status, locale)}
            </span>

            {booking.amount > 0 ? (
              <span className={cn('shrink-0 text-[9px] font-bold leading-none tabular-nums', pageText(light))}>
                {formatCurrencyCompact(booking.amount, locale)}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </button>
  );
}

function TimetableAvailabilityBlock({
  row,
  start,
  state,
  light,
  locale,
  dateIso,
  selected,
  accentColor,
  onCreateBooking,
  onToggleSlot,
  onUnblockSlot,
}: {
  row: SlotSegment;
  start: number;
  state: SlotState;
  light: boolean;
  locale: 'ru' | 'en';
  dateIso: string;
  selected: boolean;
  accentColor: string;
  onCreateBooking: (date: string, time: string) => void;
  onToggleSlot: (date: string, slot: SlotSegment) => void;
  onUnblockSlot: (date: string, slot: SlotSegment) => void;
}) {
  if (state === 'busy' || state === 'outside') return null;

  const top = getSlotBlockTop(row.start, start);
  const height = getSlotBlockHeight(row.start, row.end);
  const time = `${formatTime(row.start)}–${formatTime(row.end)}`;
  const compact = height < 38;

  if (state === 'blocked') {
    return (
      <button
        type="button"
        onClick={() => onUnblockSlot(dateIso, row)}
        className={cn(
          'absolute left-2 right-2 overflow-hidden rounded-[7px] border px-3 py-2 text-left transition-[background,border-color,box-shadow,transform] duration-150 hover:-translate-y-px',
          light
            ? 'border-violet-100 bg-violet-50/72 text-violet-500 shadow-[0_4px_14px_rgba(109,40,217,0.045)] hover:border-violet-200 hover:bg-violet-50/90'
            : 'border-violet-300/20 bg-violet-300/[0.08] text-violet-200 hover:bg-violet-300/[0.12]',
        )}
        style={{
          top,
          height,
          backgroundImage: light
            ? 'repeating-linear-gradient(-45deg, rgba(139,92,246,0.045) 0px, rgba(139,92,246,0.045) 8px, transparent 8px, transparent 18px)'
            : 'repeating-linear-gradient(-45deg, rgba(167,139,250,0.08) 0px, rgba(167,139,250,0.08) 8px, transparent 8px, transparent 18px)',
        }}
        title={locale === 'ru' ? 'Открыть подтверждение разблокировки' : 'Open unblock confirmation'}
      >
        <div className="flex h-full min-h-0 items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-[10px] font-bold tracking-[-0.01em]">
              {locale === 'ru' ? 'Недоступно' : 'Unavailable'}
            </div>
            <div className="mt-0.5 truncate text-[9px] font-medium tabular-nums opacity-75">
              {time}
            </div>
            {height >= 128 ? (
              <div className="mt-2 max-w-[132px] text-[9px] font-medium leading-snug opacity-70">
                {locale === 'ru' ? 'Заблокировано в графике работы' : 'Blocked in availability'}
              </div>
            ) : null}
          </div>
          <LockKeyhole className="mt-0.5 size-3.5 shrink-0 opacity-70" />
        </div>
      </button>
    );
  }

  if (state === 'break') {
    return (
      <div
        className={cn(
          'absolute left-2 right-2 overflow-hidden rounded-[7px] border px-2.5 py-2',
          light
            ? 'border-[#f2c69e] bg-[#fff6ed] text-[#e46b22]'
            : 'border-orange-300/25 bg-orange-300/[0.08] text-orange-200',
        )}
        style={{
          top,
          height,
          backgroundImage: light
            ? 'repeating-linear-gradient(-45deg, rgba(249,115,22,0.075) 0px, rgba(249,115,22,0.075) 7px, transparent 7px, transparent 17px)'
            : 'repeating-linear-gradient(-45deg, rgba(251,146,60,0.12) 0px, rgba(251,146,60,0.12) 7px, transparent 7px, transparent 17px)',
        }}
      >
        <div className="flex h-full min-h-0 items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="truncate text-[11px] font-semibold tracking-[-0.01em]">
              {locale === 'ru' ? 'Перерыв' : 'Break'}
            </div>
            {!compact ? (
              <div className="mt-0.5 truncate text-[9.5px] font-medium tabular-nums opacity-80">
                {time}
              </div>
            ) : null}
          </div>
          <Coffee className="size-3.5 shrink-0" />
        </div>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onToggleSlot(dateIso, row)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onToggleSlot(dateIso, row);
        }
      }}
      className={cn(
        'absolute left-2 right-2 overflow-hidden rounded-[7px] border px-2.5 py-1.5 text-left outline-none transition-[background,border-color,box-shadow,transform] duration-150 hover:-translate-y-px',
        selected
          ? 'shadow-[0_0_0_1px_rgba(0,0,0,0.02),0_10px_22px_rgba(24,32,45,0.08)]'
          : '',
        light
          ? selected
            ? 'border-transparent bg-white text-[#17201d]'
            : 'border-[#e7e3dc] bg-white text-[#6d756e] shadow-[0_1px_0_rgba(20,24,28,0.02)] hover:border-[#b8d9cf] hover:bg-[#f4fffb] hover:shadow-[0_8px_18px_rgba(24,32,45,0.055)]'
          : selected
            ? 'border-transparent bg-white/[0.08] text-white'
            : 'border-white/[0.08] bg-white/[0.035] text-white/52 hover:border-emerald-300/24 hover:bg-emerald-300/[0.07]',
      )}
      style={{
        top,
        height,
        borderColor: selected ? accentColor : undefined,
        background: selected
          ? light
            ? `linear-gradient(135deg, color-mix(in srgb, ${accentColor} 12%, #ffffff), #ffffff)`
            : `linear-gradient(135deg, color-mix(in srgb, ${accentColor} 18%, #161616), #161616)`
          : undefined,
      }}
      title={locale === 'ru' ? 'Нажмите, чтобы выделить слот для блокировки' : 'Click to select slot for blocking'}
    >
      <div className="flex h-full min-h-0 items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[10px] font-semibold">
            {locale === 'ru' ? 'Свободно' : 'Free'}
          </div>
          {!compact ? (
            <div className={cn('mt-0.5 truncate text-[9px] tabular-nums', light ? 'text-[#8a908a]' : 'text-white/34')}>
              {time}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onCreateBooking(dateIso, formatTime(row.start));
          }}
          className={cn(
            'grid size-5 shrink-0 place-items-center rounded-full border transition-colors',
            light ? 'border-[#e0ded8] bg-[#fbfaf7] text-[#7f877f] hover:bg-white' : 'border-white/[0.09] bg-white/[0.05] text-white/46 hover:bg-white/[0.09]',
          )}
          aria-label={locale === 'ru' ? 'Создать запись в этом слоте' : 'Create booking in this slot'}
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function TimetableDayColumn({
  plan,
  bookings,
  blockingBookings,
  selectedBookingId,
  start,
  end,
  nowMinutes,
  todayIso,
  light,
  locale,
  onSelectBooking,
  onCreateBooking,
  selectedSlotKeys,
  onToggleSlot,
  onUnblockSlot,
  accentColor,
}: {
  plan: DayPlan;
  bookings: CalendarBooking[];
  blockingBookings: CalendarBooking[];
  selectedBookingId: string | null;
  start: number;
  end: number;
  nowMinutes: number;
  todayIso: string;
  light: boolean;
  locale: 'ru' | 'en';
  onSelectBooking: (booking: CalendarBooking) => void;
  onCreateBooking: (date: string, time: string) => void;
  selectedSlotKeys: Set<string>;
  onToggleSlot: (date: string, slot: SlotSegment) => void;
  onUnblockSlot: (date: string, slot: SlotSegment) => void;
  accentColor: string;
}) {
  const rows = useMemo(
    () => buildRowsForPlan(plan, blockingBookings),
    [blockingBookings, plan],
  );

  const bookingLayouts = useMemo(() => buildBookingLayouts(bookings), [bookings]);
  const columnHeight = getTop(end, start);
  const isToday = plan.iso === todayIso;
  const unavailableEnd = end;

  return (
    <div
      className={cn(
        'relative border-l',
        light ? 'border-[#e9e3da]' : 'border-white/[0.075]',
      )}
      style={{ height: columnHeight + 16 }}
    >
      {isToday ? (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: light
              ? `color-mix(in srgb, ${accentColor} 4%, transparent)`
              : `color-mix(in srgb, ${accentColor} 7%, transparent)`,
          }}
        />
      ) : null}

      {plan.isDayOff ? (
        <UnavailableBlock
          start={start}
          end={unavailableEnd}
          boundsStart={start}
          light={light}
          locale={locale}
        />
      ) : null}

      {rows.map((row) => {
        const rowBookings = bookingsInSlot(blockingBookings, row);
        const state = getSlotState(plan, row, rowBookings);

        if ((state === 'blocked' && row.kind !== 'block') || (state === 'break' && row.kind !== 'break')) {
          return null;
        }

        return (
          <TimetableAvailabilityBlock
            key={`${plan.iso}-${row.kind}-${row.start}-${row.end}`}
            row={row}
            start={start}
            state={state}
            light={light}
            locale={locale}
            dateIso={plan.iso}
            selected={selectedSlotKeys.has(slotSelectionKey(plan.iso, row.start, row.end))}
            accentColor={accentColor}
            onCreateBooking={onCreateBooking}
            onToggleSlot={onToggleSlot}
            onUnblockSlot={onUnblockSlot}
          />
        );
      })}

      {bookingLayouts.map(({ booking, lane, laneCount }) => {
        const width = 100 / laneCount;
        const left = lane * width;
        const blockHeight = getEventBlockHeight(booking.startMinutes, booking.endMinutes);
        const density =
          blockHeight < 36 || laneCount > 2
            ? 'tiny'
            : blockHeight < 60
              ? 'compact'
              : 'normal';

        return (
          <div
            key={booking.id}
            className="absolute z-30"
            style={{
              top: getEventBlockTop(booking.startMinutes, start),
              height: blockHeight,
              left: `calc(${left}% + 8px)`,
              width: `calc(${width}% - 12px)`,
            }}
          >
            <TimetableBookingCard
              booking={booking}
              light={light}
              locale={locale}
              selected={selectedBookingId === booking.id}
              density={density}
              accentColor={accentColor}
              onClick={() => onSelectBooking(booking)}
            />
          </div>
        );
      })}


    </div>
  );
}

function TimetableShell({
  plans,
  bookings,
  blockingBookings,
  selectedBookingId,
  nowMinutes,
  todayIso,
  light,
  locale,
  onSelectBooking,
  onCreateBooking,
  onSelectDate,
  singleDay,
  selectedSlotKeys,
  onToggleSlot,
  onUnblockSlot,
  accentColor,
}: {
  plans: DayPlan[];
  bookings: CalendarBooking[];
  blockingBookings: CalendarBooking[];
  selectedBookingId: string | null;
  nowMinutes: number;
  todayIso: string;
  light: boolean;
  locale: 'ru' | 'en';
  onSelectBooking: (booking: CalendarBooking) => void;
  onCreateBooking: (date: string, time: string) => void;
  onSelectDate?: (date: Date) => void;
  singleDay?: boolean;
  selectedSlotKeys: Set<string>;
  onToggleSlot: (date: string, slot: SlotSegment) => void;
  onUnblockSlot: (date: string, slot: SlotSegment) => void;
  accentColor: string;
}) {
  const bounds = useMemo(
    () =>
      getTimelineBounds(
        plans,
        bookings,
        plans.some((plan) => plan.iso === todayIso) ? nowMinutes : undefined,
      ),
    [bookings, nowMinutes, plans, todayIso],
  );

  const hours = useMemo(
    () => getTimelineHours(bounds.start, bounds.end),
    [bounds.end, bounds.start],
  );

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, CalendarBooking[]>();

    for (const plan of plans) {
      map.set(plan.iso, getBookingsForDate(bookings, plan.iso));
    }

    return map;
  }, [bookings, plans]);

  const blockingBookingsByDate = useMemo(() => {
    const map = new Map<string, CalendarBooking[]>();

    for (const plan of plans) {
      map.set(plan.iso, getBookingsForDate(blockingBookings, plan.iso));
    }

    return map;
  }, [blockingBookings, plans]);

  const columnHeight = getTop(bounds.end, bounds.start);
  const showNowInGrid =
    plans.some((plan) => plan.iso === todayIso) &&
    nowMinutes >= bounds.start &&
    nowMinutes <= bounds.end;

  const columns = singleDay
    ? '86px minmax(760px, 1fr)'
    : '86px repeat(7, minmax(132px, 1fr))';

  const minWidth = singleDay ? 880 : 1120;

  return (
    <div className="overflow-x-auto pb-4">
      <div className="w-full" style={{ minWidth }}>
        <div
          className={cn(
            'grid border-b',
            light ? 'border-[#e7e1d8] bg-[#fffdf9]' : 'border-white/[0.08] bg-[#121314]',
          )}
          style={{ gridTemplateColumns: columns }}
        >
          <div
            className={cn(
              'sticky left-0 z-50 min-h-[56px] border-r px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em]',
              light
                ? 'border-[#e7e1d8] bg-[#fffdf9] text-[#9a958d]'
                : 'border-white/[0.08] bg-[#121314] text-white/34',
            )}
          >
            {locale === 'ru' ? 'Время' : 'Time'}
          </div>

          {plans.map((plan) => {
            const dayBookings = bookingsByDate.get(plan.iso) ?? [];
            const active = dayBookings.filter(isActiveBooking).length;
            const isToday = plan.iso === todayIso;
            const hasBookings = active > 0;

            return (
              <button
                key={plan.iso}
                type="button"
                onClick={() => onSelectDate?.(plan.date)}
                className={cn(
                  'min-h-[56px] border-l px-3 py-2.5 text-left transition-colors',
                  light ? 'border-[#e7e1d8]' : 'border-white/[0.08]',
                  isToday
                    ? ''
                    : light
                      ? 'bg-[#fffdf9] hover:bg-[#fbfaf6]'
                      : 'bg-[#121314] hover:bg-white/[0.035]',
                )}
                style={
                  isToday
                    ? {
                        background: light
                          ? `linear-gradient(180deg, color-mix(in srgb, ${accentColor} 9%, #fffdf9), #fffdf9)`
                          : `linear-gradient(180deg, color-mix(in srgb, ${accentColor} 14%, #121314), #121314)`,
                      }
                    : undefined
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className={cn('text-[10px] font-semibold', light ? 'text-[#777e7a]' : 'text-white/42')}>
                      {getShortWeekday(plan.date, locale)}
                    </div>
                    <div className={cn('mt-1 text-[11px] font-bold tabular-nums', pageText(light))}>
                      {formatCompactDate(plan.date, locale)}
                    </div>
                  </div>

                  {hasBookings ? (
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums',
                        light ? 'bg-[#f3eee6] text-[#796f62]' : 'bg-white/[0.08] text-white/58',
                      )}
                    >
                      {active}
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <div className="grid" style={{ gridTemplateColumns: columns }}>
          <div
            className={cn(
              'sticky left-0 z-40 border-r',
              light
                ? 'border-[#e7e1d8] bg-[#fffdf9]'
                : 'border-white/[0.08] bg-[#121314]',
            )}
            style={{ height: columnHeight + 16 }}
          >
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0 px-3 text-right"
                style={{ top: getTop(hour, bounds.start) - 7 }}
              >
                <span className={cn('text-[10.5px] font-medium tabular-nums', light ? 'text-[#969a96]' : 'text-white/30')}>
                  {formatTime(hour)}
                </span>
              </div>
            ))}

            {showNowInGrid ? (
              <TimetableNowGutterMarker nowMinutes={nowMinutes} start={bounds.start} />
            ) : null}
          </div>

          {plans.map((plan) => (
            <div key={plan.iso} className="relative">
              {hours.map((hour) => (
                <div
                  key={`${plan.iso}-${hour}`}
                  className={cn(
                    'absolute left-0 right-0 border-t',
                    light ? 'border-[#efeae2]' : 'border-white/[0.052]',
                  )}
                  style={{ top: getTop(hour, bounds.start) }}
                />
              ))}

              <TimetableDayColumn
                plan={plan}
                bookings={bookingsByDate.get(plan.iso) ?? []}
                blockingBookings={blockingBookingsByDate.get(plan.iso) ?? []}
                selectedBookingId={selectedBookingId}
                start={bounds.start}
                end={bounds.end}
                nowMinutes={nowMinutes}
                todayIso={todayIso}
                light={light}
                locale={locale}
                accentColor={accentColor}
                selectedSlotKeys={selectedSlotKeys}
                onToggleSlot={onToggleSlot}
                onUnblockSlot={onUnblockSlot}
                onSelectBooking={onSelectBooking}
                onCreateBooking={onCreateBooking}
              />
            </div>
          ))}
          </div>

          {showNowInGrid ? (
            <div
              className="pointer-events-none absolute right-0 z-[45] -translate-y-1/2"
              style={{ top: getTop(nowMinutes, bounds.start), left: 86 }}
            >
              <div className="flex items-center">
                <span className="h-px flex-1 bg-[#ef4444]" />
                <span className="mr-2 size-1.5 rounded-full bg-[#ef4444]" />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DayPlanner({
  plan,
  bookings,
  blockingBookings,
  selectedBookingId,
  nowMinutes,
  todayIso,
  light,
  locale,
  onSelectBooking,
  onCreateBooking,
  selectedSlotKeys,
  onToggleSlot,
  onUnblockSlot,
  accentColor,
}: {
  plan: DayPlan;
  bookings: CalendarBooking[];
  blockingBookings: CalendarBooking[];
  selectedBookingId: string | null;
  nowMinutes: number;
  todayIso: string;
  light: boolean;
  locale: 'ru' | 'en';
  onSelectBooking: (booking: CalendarBooking) => void;
  onCreateBooking: (date: string, time: string) => void;
  selectedSlotKeys: Set<string>;
  onToggleSlot: (date: string, slot: SlotSegment) => void;
  onUnblockSlot: (date: string, slot: SlotSegment) => void;
  accentColor: string;
}) {
  if (!plan.slots.length && !bookings.length && !plan.isDayOff) {
    return (
      <div className="p-3">
        <EmptyState light={light} className="min-h-[220px]">
          {locale === 'ru'
            ? 'На этот день нет рабочих слотов. Добавьте график или выберите другой день.'
            : 'No working slots for this day. Add availability or choose another day.'}
        </EmptyState>
      </div>
    );
  }

  return (
    <TimetableShell
      plans={[plan]}
      bookings={bookings}
      blockingBookings={blockingBookings}
      selectedBookingId={selectedBookingId}
      nowMinutes={nowMinutes}
      todayIso={todayIso}
      light={light}
      locale={locale}
      onSelectBooking={onSelectBooking}
      onCreateBooking={onCreateBooking}
      selectedSlotKeys={selectedSlotKeys}
      onToggleSlot={onToggleSlot}
      onUnblockSlot={onUnblockSlot}
      accentColor={accentColor}
      singleDay
    />
  );
}

function WeekPlanner({
  plans,
  bookings,
  blockingBookings,
  selectedBookingId,
  nowMinutes,
  todayIso,
  light,
  locale,
  onSelectBooking,
  onCreateBooking,
  onSelectDate,
  selectedSlotKeys,
  onToggleSlot,
  onUnblockSlot,
  accentColor,
}: {
  plans: DayPlan[];
  bookings: CalendarBooking[];
  blockingBookings: CalendarBooking[];
  selectedBookingId: string | null;
  nowMinutes: number;
  todayIso: string;
  light: boolean;
  locale: 'ru' | 'en';
  onSelectBooking: (booking: CalendarBooking) => void;
  onCreateBooking: (date: string, time: string) => void;
  onSelectDate: (date: Date) => void;
  selectedSlotKeys: Set<string>;
  onToggleSlot: (date: string, slot: SlotSegment) => void;
  onUnblockSlot: (date: string, slot: SlotSegment) => void;
  accentColor: string;
}) {
  return (
    <TimetableShell
      plans={plans}
      bookings={bookings}
      blockingBookings={blockingBookings}
      selectedBookingId={selectedBookingId}
      nowMinutes={nowMinutes}
      todayIso={todayIso}
      light={light}
      locale={locale}
      onSelectBooking={onSelectBooking}
      onCreateBooking={onCreateBooking}
      onSelectDate={onSelectDate}
      selectedSlotKeys={selectedSlotKeys}
      onToggleSlot={onToggleSlot}
      onUnblockSlot={onUnblockSlot}
      accentColor={accentColor}
    />
  );
}

function MonthPlanner({
  selectedDate,
  plans,
  bookings,
  todayIso,
  light,
  locale,
  accentColor,
  onSelectBooking,
  onSelectDate,
}: {
  selectedDate: Date;
  plans: DayPlan[];
  bookings: CalendarBooking[];
  todayIso: string;
  light: boolean;
  locale: 'ru' | 'en';
  accentColor: string;
  onSelectBooking: (booking: CalendarBooking) => void;
  onSelectDate: (date: Date) => void;
}) {
  const monthKey = toLocalIsoDate(selectedDate).slice(0, 7);

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, CalendarBooking[]>();

    for (const plan of plans) {
      map.set(plan.iso, getBookingsForDate(bookings, plan.iso));
    }

    return map;
  }, [bookings, plans]);

  return (
    <div className="overflow-hidden">
      <div
        className={cn(
          'grid grid-cols-7 border-b',
          light ? 'border-[#e5ded2] bg-[#fffefa]' : 'border-white/[0.08] bg-[#171717]',
        )}
      >
        {getWeekDates(new Date()).map((date) => (
          <div
            key={getShortWeekday(date, locale)}
            className={cn(
              'border-r px-3 py-3 text-[10.5px] font-semibold last:border-r-0',
              light ? 'border-[#e5ded2]' : 'border-white/[0.08]',
              mutedText(light),
            )}
          >
            {getShortWeekday(date, locale)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {plans.map((plan) => {
          const dayBookings = bookingsByDate.get(plan.iso) ?? [];
          const inMonth = plan.iso.startsWith(monthKey);
          const isToday = plan.iso === todayIso;
          const active = dayBookings.filter(isActiveBooking).length;
          const load = plan.slots.length
            ? Math.min(100, Math.round((active / plan.slots.length) * 100))
            : 0;

          return (
            <button
              key={plan.iso}
              type="button"
              onClick={() => onSelectDate(plan.date)}
              className={cn(
                'min-h-[156px] border-r border-t p-3 text-left transition-colors duration-150 last:border-r-0',
                light ? 'border-[#efe8df]' : 'border-white/[0.07]',
                inMonth
                  ? light
                    ? 'bg-white hover:bg-[#fffaf2]'
                    : 'bg-white/[0.018] hover:bg-white/[0.035]'
                  : light
                    ? 'bg-[#f7f3eb] text-black/32'
                    : 'bg-white/[0.008] text-white/24',
                isToday && (light ? 'bg-[#f9efe2]' : 'bg-orange-400/[0.045]'),
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={cn(
                    'grid size-8 place-items-center rounded-full text-[12px] font-semibold',
                    isToday ? 'bg-orange-500 text-white' : pageText(light),
                  )}
                >
                  {plan.date.getDate()}
                </span>

                <span className={cn('text-[10px] font-medium tabular-nums', faintText(light))}>
                  {active ? `${active} ${getLessonWord(active, locale)}` : '—'}
                </span>
              </div>

              <div
                className={cn(
                  'mt-3 h-1.5 overflow-hidden rounded-full',
                  light ? 'bg-black/[0.045]' : 'bg-white/[0.055]',
                )}
              >
                <span
                  style={{
                    width: `${load}%`,
                    background: isToday ? CALENDAR_NOW_COLOR : accentColor,
                  }}
                  className="block h-full rounded-full"
                />
              </div>

              <div className="mt-3 space-y-1.5">
                {dayBookings.slice(0, 3).map((booking) => (
                  <span
                    key={booking.id}
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectBooking(booking);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        event.stopPropagation();
                        onSelectBooking(booking);
                      }
                    }}
                    style={bookingSurfaceStyle(booking.color, light)}
                    className="block rounded-[11px] border px-2 py-1.5"
                  >
                    <span className={cn('block truncate text-[10px] font-semibold', pageText(light))}>
                      {booking.start} · {booking.clientName}
                    </span>

                    <span className={cn('mt-0.5 block truncate text-[9.5px]', faintText(light))}>
                      {booking.service}
                    </span>
                  </span>
                ))}

                {dayBookings.length > 3 ? (
                  <span className={cn('block text-[10px] font-medium', mutedText(light))}>
                    +{dayBookings.length - 3}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BookingDetails({
  booking,
  locale,
  light,
  actionLoading,
  accentColor,
  onClose,
  onStatusChange,
}: {
  booking: CalendarBooking;
  locale: 'ru' | 'en';
  light: boolean;
  actionLoading: BookingStatus | null;
  accentColor: string;
  onClose: () => void;
  onStatusChange: (status: BookingStatus) => void;
}) {
  const tone = statusColor(booking, light, accentColor);
  const closed = isClosedBooking(booking);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/30 p-3 backdrop-blur-[2px] md:items-center">
      <button
        type="button"
        aria-label={locale === 'ru' ? 'Закрыть' : 'Close'}
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <div
        className={cn(
          'relative w-full max-w-[430px] overflow-hidden rounded-[18px] border shadow-[0_24px_90px_rgba(0,0,0,0.32)]',
          light ? 'border-black/[0.08] bg-[#ffffff]' : 'border-white/[0.09] bg-[#141414]',
        )}
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <MicroLabel light={light} active accentColor={tone}>
                <StatusDot light={light} active accentColor={tone} />
                {bookingStatusLabel(booking.status, locale)}
              </MicroLabel>

              <div
                className={cn(
                  'mt-3 truncate text-[24px] font-semibold tracking-[-0.065em]',
                  pageText(light),
                )}
              >
                {booking.clientName}
              </div>

              <div className={cn('mt-1 truncate text-[12px]', mutedText(light))}>
                {booking.service}
              </div>
            </div>

            <button type="button" onClick={onClose} className={iconButtonBase(light)}>
              <X className="size-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Panel light={light} className="p-3">
              <div className={cn('text-[10.5px] font-medium', faintText(light))}>
                {locale === 'ru' ? 'Время' : 'Time'}
              </div>
              <div className={cn('mt-1 text-[13px] font-semibold', pageText(light))}>
                {booking.start}–{booking.end}
              </div>
            </Panel>

            <Panel light={light} className="p-3">
              <div className={cn('text-[10.5px] font-medium', faintText(light))}>
                {locale === 'ru' ? 'Длительность' : 'Duration'}
              </div>
              <div className={cn('mt-1 text-[13px] font-semibold', pageText(light))}>
                {booking.durationMinutes} {locale === 'ru' ? 'мин' : 'min'}
              </div>
            </Panel>

            <Panel light={light} className="p-3">
              <div className={cn('text-[10.5px] font-medium', faintText(light))}>
                {locale === 'ru' ? 'Сумма' : 'Amount'}
              </div>
              <div className={cn('mt-1 text-[13px] font-semibold', pageText(light))}>
                {booking.amount ? formatCurrencyCompact(booking.amount, locale) : '—'}
              </div>
            </Panel>

            <Panel light={light} className="p-3">
              <div className={cn('text-[10.5px] font-medium', faintText(light))}>
                {locale === 'ru' ? 'Источник' : 'Source'}
              </div>
              <div className={cn('mt-1 truncate text-[13px] font-semibold', pageText(light))}>
                {booking.sourceLabel || 'Web'}
              </div>
            </Panel>
          </div>

          <Panel light={light} className="mt-2 p-3">
            <div className={cn('text-[10.5px] font-medium', faintText(light))}>
              {locale === 'ru' ? 'Комментарий' : 'Note'}
            </div>

            <div className={cn('mt-1 text-[12px] leading-5', pageText(light))}>
              {booking.note || '—'}
            </div>
          </Panel>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button asChild className={cn('justify-start', buttonBase(light))}>
              <a href={`tel:${booking.phone}`}>
                <PhoneCall className="size-3.5" />
                {locale === 'ru' ? 'Позвонить' : 'Call'}
              </a>
            </Button>

            <Button asChild className={cn('justify-start', buttonBase(light, true))}>
              <Link href="/dashboard/chats">
                <MessageCircleMore className="size-3.5" />
                {locale === 'ru' ? 'Чат' : 'Chat'}
              </Link>
            </Button>

            <Button asChild className={cn('justify-start', buttonBase(light))}>
              <Link href="/dashboard/availability">
                <CalendarClock className="size-3.5" />
                {locale === 'ru' ? 'График' : 'Schedule'}
              </Link>
            </Button>

            {!closed ? (
              <Button
                type="button"
                className={cn('justify-start', buttonBase(light, true))}
                onClick={() => onStatusChange('completed')}
                disabled={actionLoading !== null}
              >
                <CheckCircle2 className="size-3.5" />
                {actionLoading === 'completed' ? '…' : locale === 'ru' ? 'Пришёл' : 'Arrived'}
              </Button>
            ) : null}

            {!closed ? (
              <Button
                type="button"
                className={cn('col-span-2 justify-start', buttonBase(light))}
                onClick={() => onStatusChange('no_show')}
                disabled={actionLoading !== null}
              >
                <Ban className="size-3.5" />
                {actionLoading === 'no_show' ? '…' : locale === 'ru' ? 'Не пришёл' : 'No-show'}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardTodayPage() {
  const { createBooking, updateBookingStatus, updateWorkspaceSection } = useApp();
  const {
    hasHydrated,
    ownedProfile,
    bookings,
    dataset,
    locale,
    workspaceData,
  } = useOwnedWorkspaceData();

  const { resolvedTheme } = useTheme();
  const { settings } = useAppearance();

  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<CalendarView>('week');
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<BookingStatus | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [bookingFilters, setBookingFilters] = useState<BookingStatusFilter>(DEFAULT_BOOKING_FILTERS);
  const [createDraft, setCreateDraft] = useState<CreateBookingDraft | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedSlotKeys, setSelectedSlotKeys] = useState<Set<string>>(() => new Set());
  const [blockingLoading, setBlockingLoading] = useState(false);
  const [blockingError, setBlockingError] = useState<string | null>(null);
  const [pendingUnblockSlot, setPendingUnblockSlot] = useState<SelectedCalendarSlot | null>(null);
  const [localAvailabilityOverride, setLocalAvailabilityOverride] = useState<BookingAvailabilityDay[] | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!selectedBookingId) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedBookingId(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBookingId]);

  useEffect(() => {
    if (!pendingUnblockSlot || blockingLoading) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPendingUnblockSlot(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingUnblockSlot, blockingLoading]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();

      if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrevious();
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
      }

      if (event.key.toLowerCase() === 't' || event.key.toLowerCase() === 'е') {
        event.preventDefault();
        goToday();
      }

      if (event.key === '1') setView('day');
      if (event.key === '2') setView('week');
      if (event.key === '3') setView('month');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const currentTheme: ThemeMode = mounted
    ? resolvedTheme === 'light'
      ? 'light'
      : 'dark'
    : 'dark';

  const isLight = currentTheme === 'light';
  const accentColor = accentPalette[settings.accentTone]?.solid ?? '#7AA66C';
  const publicAccentColor = accentPalette[settings.publicAccent]?.solid ?? CALENDAR_BOOKING_COLOR;

  const todayIso = useMemo(() => toLocalIsoDate(now), [now]);
  const nowMinutes = useMemo(() => now.getHours() * 60 + now.getMinutes(), [now]);

  const baseAvailabilitySource = localAvailabilityOverride ?? workspaceData?.availability ?? dataset?.availability;

  const availability = useMemo(
    () => normalizeAvailabilityDays(baseAvailabilitySource),
    [baseAvailabilitySource],
  );

  const serviceMap = useMemo(
    () => buildServiceMap(dataset?.services, workspaceData?.services),
    [dataset?.services, workspaceData?.services],
  );

  const serviceOptions = useMemo(() => [...serviceMap.keys()], [serviceMap]);

  const defaultCreateService = serviceOptions[0] ?? '';

  const calendarBookings = useMemo(
    () =>
      bookings
        .map((booking) => mapBooking(booking, serviceMap, accentColor, publicAccentColor))
        .sort((left, right) =>
          `${left.date}T${left.start}`.localeCompare(`${right.date}T${right.start}`),
        ),
    [accentColor, bookings, publicAccentColor, serviceMap],
  );

  const visibleDates = useMemo(() => getVisibleDates(view, selectedDate), [selectedDate, view]);

  const visiblePlans = useMemo(
    () => visibleDates.map((date) => getDayPlan(date, availability)),
    [availability, visibleDates],
  );

  const visibleDateSet = useMemo(
    () => new Set(visiblePlans.map((plan) => plan.iso)),
    [visiblePlans],
  );

  const allVisibleBookings = useMemo(
    () => calendarBookings.filter((booking) => visibleDateSet.has(booking.date)),
    [calendarBookings, visibleDateSet],
  );

  const visibleBookings = useMemo(
    () => allVisibleBookings.filter((booking) => passesBookingFilters(booking, bookingFilters)),
    [allVisibleBookings, bookingFilters],
  );

  const selectedPlan = useMemo(
    () => getDayPlan(selectedDate, availability),
    [availability, selectedDate],
  );

  const allSelectedDayBookings = useMemo(
    () => getBookingsForDate(calendarBookings, selectedPlan.iso),
    [calendarBookings, selectedPlan.iso],
  );

  const selectedDayBookings = useMemo(
    () => allSelectedDayBookings.filter((booking) => passesBookingFilters(booking, bookingFilters)),
    [allSelectedDayBookings, bookingFilters],
  );

  const selectedBooking = useMemo(
    () => calendarBookings.find((booking) => booking.id === selectedBookingId) ?? null,
    [calendarBookings, selectedBookingId],
  );

  const selectedSlots = useMemo(
    () => [...selectedSlotKeys].map(parseSlotSelectionKey).filter((slot): slot is SelectedCalendarSlot => Boolean(slot)),
    [selectedSlotKeys],
  );

  const activeFilterCount = useMemo(() => countActiveFilters(bookingFilters), [bookingFilters]);

  const rangeTitle = useMemo(
    () => formatRangeTitle(view, selectedDate, locale),
    [locale, selectedDate, view],
  );

  const metrics = useMemo(
    () => buildMetrics(visibleBookings, visiblePlans, todayIso, nowMinutes),
    [nowMinutes, todayIso, visibleBookings, visiblePlans],
  );

  const copy =
    locale === 'ru'
      ? {
          title: 'Сегодня',
          description:
            'Профессиональный календарь по реальным слотам: свободно, занято, перерывы и записи в одном рабочем экране.',
          createTitle: 'Сначала настройте профиль мастера',
          createDescription:
            'Создайте профиль, чтобы открыть календарь, реальные слоты, записи и быстрые действия.',
          createProfile: 'Создать профиль',
          profileMissing: 'Профиль не настроен',
          calendar: 'Рабочий календарь',
          calendarDescription:
            'Аккуратный формат расписания: временная сетка, дни, записи, свободные слоты и текущее время.',
          today: 'Сегодня',
          day: 'День',
          week: 'Неделя',
          month: 'Месяц',
          selectedDay: 'Выбранный день',
          selectedWeek: 'Выбранная неделя',
          selectedMonth: 'Выбранный месяц',
          slots: 'Слоты',
          busy: 'Занято',
          free: 'Свободно',
          load: 'Загрузка',
          next: 'Ближайшая',
          noNext: 'пока пусто',
          slotUnit: 'по графику',
          monthHint: 'Нажмите на день, чтобы открыть его расписание.',
          setupCards: {
            calendar: 'Реальные слоты',
            calendarText: 'Календарь строится из графика мастера, а не из случайной сетки часов.',
            clients: 'Карточка записи',
            clientsText: 'Контакты, комментарии, сумма и быстрые статусы в одном мини-окне.',
            public: 'Онлайн-запись',
            publicText: 'Клиенты видят только доступные слоты и не попадают вне графика.',
          },
        }
      : {
          title: 'Today',
          description:
            'Professional real-slot calendar: free, busy, breaks, and bookings in one work screen.',
          createTitle: 'Create the master profile first',
          createDescription:
            'Create a profile to unlock calendar, real slots, bookings, and quick actions.',
          createProfile: 'Create profile',
          profileMissing: 'Profile missing',
          calendar: 'Work calendar',
          calendarDescription:
            'Clean timetable format: time grid, days, bookings, free slots, and current time.',
          today: 'Today',
          day: 'Day',
          week: 'Week',
          month: 'Month',
          selectedDay: 'Selected day',
          selectedWeek: 'Selected week',
          selectedMonth: 'Selected month',
          slots: 'Slots',
          busy: 'Busy',
          free: 'Free',
          load: 'Load',
          next: 'Next',
          noNext: 'empty',
          slotUnit: 'from schedule',
          monthHint: 'Click a day to open its schedule.',
          setupCards: {
            calendar: 'Real slots',
            calendarText: 'The calendar uses master availability, not a random hour grid.',
            clients: 'Booking card',
            clientsText: 'Contacts, notes, amount, and quick statuses in one small sheet.',
            public: 'Online booking',
            publicText: 'Clients see only available slots and do not land outside schedule.',
          },
        };

  function goPrevious() {
    setSelectedDate((current) => {
      if (view === 'day') return addDays(current, -1);
      if (view === 'week') return addDays(current, -7);
      return addMonths(current, -1);
    });
  }

  function goNext() {
    setSelectedDate((current) => {
      if (view === 'day') return addDays(current, 1);
      if (view === 'week') return addDays(current, 7);
      return addMonths(current, 1);
    });
  }

  function goToday() {
    setSelectedDate(new Date());
  }

  function handleSelectDate(date: Date) {
    setSelectedDate(date);
    if (view === 'month') setView('day');
  }

  async function handleStatusChange(status: BookingStatus) {
    if (!selectedBooking) return;

    setActionLoading(status);

    try {
      await updateBookingStatus(selectedBooking.id, status);
    } finally {
      setActionLoading(null);
    }
  }

  function openCreateBooking(date = toLocalIsoDate(selectedDate), time = formatTime(Math.max(TIMETABLE_DAY_START, Math.min(nowMinutes, TIMETABLE_DAY_END - 60)))) {
    setSelectedSlotKeys(new Set());
    setCreateError(null);
    setCreateDraft({
      clientName: '',
      clientPhone: '',
      service: defaultCreateService,
      date,
      time,
      comment: '',
    });
  }

  function updateCreateDraft(patch: Partial<CreateBookingDraft>) {
    setCreateDraft((current) => (current ? { ...current, ...patch } : current));
    setCreateError(null);
  }

  function updateBookingFilter(status: BookingStatus, value: boolean) {
    setBookingFilters((current) => ({ ...current, [status]: value }));
  }

  function resetBookingFilters() {
    setBookingFilters(DEFAULT_BOOKING_FILTERS);
  }

  function toggleSlotSelection(date: string, slot: SlotSegment) {
    if (slot.kind !== 'work') return;

    setBlockingError(null);
    setSelectedSlotKeys((current) => {
      const next = new Set(current);
      const key = slotSelectionKey(date, slot.start, slot.end);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  }

  function clearSlotSelection() {
    setSelectedSlotKeys(new Set());
    setBlockingError(null);
  }

  async function persistAvailabilityBlockedSlots(slots: SelectedCalendarSlot[], mode: 'add' | 'remove') {
    if (!slots.length) return;

    const nextAvailability = updateAvailabilityBlockedSlots(availability, slots, mode);
    const saved = await updateWorkspaceSection('availability', nextAvailability);

    if (!saved) {
      setLocalAvailabilityOverride(nextAvailability);
    }
  }

  async function blockSelectedSlots() {
    if (!selectedSlots.length) {
      setBlockingError(locale === 'ru' ? 'Выберите свободные слоты в календаре.' : 'Select free slots first.');
      return;
    }

    setBlockingLoading(true);
    setBlockingError(null);

    try {
      await persistAvailabilityBlockedSlots(selectedSlots, 'add');
      setSelectedSlotKeys(new Set());
    } catch {
      setBlockingError(locale === 'ru' ? 'Не удалось заблокировать слоты.' : 'Could not block slots.');
    } finally {
      setBlockingLoading(false);
    }
  }

  function requestUnblockSlot(date: string, slot: SlotSegment) {
    setBlockingError(null);
    setPendingUnblockSlot({ date, start: slot.start, end: slot.end });
  }

  async function unblockSlot(slot: SelectedCalendarSlot) {
    setBlockingLoading(true);
    setBlockingError(null);

    try {
      await persistAvailabilityBlockedSlots([slot], 'remove');
      setSelectedSlotKeys((current) => {
        const next = new Set(current);
        next.delete(slotSelectionKey(slot.date, slot.start, slot.end));
        return next;
      });
      setPendingUnblockSlot(null);
    } catch {
      setBlockingError(locale === 'ru' ? 'Не удалось разблокировать слот.' : 'Could not unblock slot.');
    } finally {
      setBlockingLoading(false);
    }
  }

  async function confirmUnblockSlot() {
    if (!pendingUnblockSlot) return;
    await unblockSlot(pendingUnblockSlot);
  }

  async function handleCreateBookingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!ownedProfile || !createDraft) return;

    setCreateLoading(true);
    setCreateError(null);

    try {
      const result = await createBooking(ownedProfile.slug, createDraft);

      if (!result.success) {
        setCreateError(result.error ?? (locale === 'ru' ? 'Не удалось создать запись.' : 'Could not create booking.'));
        return;
      }

      setCreateDraft(null);
      setSelectedDate(new Date(`${createDraft.date}T00:00:00`));
      if (view === 'month') setView('day');
    } finally {
      setCreateLoading(false);
    }
  }

  if (!hasHydrated || !mounted) return null;

  if (!ownedProfile) {
    return (
      <WorkspaceShell>
        <main
          className={cn(
            'min-h-[calc(100dvh-68px)] px-3 pb-12 pt-4 md:px-5 md:pt-5',
            pageBg(isLight),
          )}
        >
          <div className="mx-auto w-full max-w-[var(--page-max-width)]">
            <div className="mb-5 md:mb-6">
              <h1
                className={cn(
                  'text-[18px] font-semibold tracking-[-0.02em] md:text-[22px]',
                  pageText(isLight),
                )}
              >
                {copy.title}
              </h1>

              <p className={cn('mt-2 max-w-[720px] text-[13px] leading-5', mutedText(isLight))}>
                {copy.description}
              </p>
            </div>

            <Card light={isLight} className="overflow-hidden">
              <div className="grid min-h-[300px] place-items-center px-5 py-10 text-center">
                <div className="mx-auto max-w-[500px]">
                  <MicroLabel light={isLight}>
                    <StatusDot light={isLight} />
                    {copy.profileMissing}
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

                  <div className="mt-6 flex justify-center">
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
                    <CalendarClock className="size-3.5" />
                    {copy.setupCards.calendar}
                  </MicroLabel>

                  <div className={cn('mt-4 text-[13px] font-semibold', pageText(isLight))}>
                    {copy.calendar}
                  </div>

                  <p className={cn('mt-1 text-[11px] leading-4', mutedText(isLight))}>
                    {copy.setupCards.calendarText}
                  </p>
                </div>
              </Card>

              <Card light={isLight}>
                <div className="p-4">
                  <MicroLabel light={isLight}>
                    <MessageCircleMore className="size-3.5" />
                    {copy.setupCards.clients}
                  </MicroLabel>

                  <div className={cn('mt-4 text-[13px] font-semibold', pageText(isLight))}>
                    {locale === 'ru' ? 'Детали' : 'Details'}
                  </div>

                  <p className={cn('mt-1 text-[11px] leading-4', mutedText(isLight))}>
                    {copy.setupCards.clientsText}
                  </p>
                </div>
              </Card>

              <Card light={isLight}>
                <div className="p-4">
                  <MicroLabel light={isLight}>
                    <Globe2 className="size-3.5" />
                    {copy.setupCards.public}
                  </MicroLabel>

                  <div className={cn('mt-4 text-[13px] font-semibold', pageText(isLight))}>
                    {locale === 'ru' ? 'Публичная' : 'Public'}
                  </div>

                  <p className={cn('mt-1 text-[11px] leading-4', mutedText(isLight))}>
                    {copy.setupCards.publicText}
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
      <main
        className={cn(
          'min-h-[calc(100dvh-68px)] px-3 pb-12 pt-4 md:px-5 md:pt-5',
          pageBg(isLight),
        )}
      >
        <div className="mx-auto w-full max-w-[var(--page-max-width)]">
          <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <h1
                className={cn(
                  'text-[19px] font-semibold tracking-[-0.025em] md:text-[22px]',
                  pageText(isLight),
                )}
              >
                {copy.calendar}
              </h1>

              <p className={cn('mt-1.5 max-w-[780px] text-[13px] leading-5', mutedText(isLight))}>
                {rangeTitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ControlGroup light={isLight} className="h-9">
                <FilterChip
                  label={copy.day}
                  active={view === 'day'}
                  onClick={() => setView('day')}
                  light={isLight}
                  accentColor={accentColor}
                  compact
                />

                <FilterChip
                  label={copy.week}
                  active={view === 'week'}
                  onClick={() => setView('week')}
                  light={isLight}
                  accentColor={accentColor}
                  compact
                />

                <FilterChip
                  label={copy.month}
                  active={view === 'month'}
                  onClick={() => setView('month')}
                  light={isLight}
                  accentColor={accentColor}
                  compact
                />
              </ControlGroup>

              <div className="flex items-center gap-1.5">
                <button type="button" onClick={goPrevious} className={iconButtonBase(isLight)}>
                  <ChevronLeft className="size-4" />
                </button>

                <button
                  type="button"
                  onClick={goToday}
                  className={iconButtonBase(isLight)}
                  aria-label={locale === 'ru' ? 'Перейти к текущему периоду' : 'Go to current period'}
                  title={locale === 'ru' ? 'Текущий период' : 'Current period'}
                >
                  <CalendarClock className="size-4" />
                </button>

                <button type="button" onClick={goNext} className={iconButtonBase(isLight)}>
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <CalendarZone
              title={copy.calendar}
              description={view === 'month' ? copy.monthHint : copy.calendarDescription}
              light={isLight}
              locale={locale}
              filterOpen={filtersOpen}
              activeFilterCount={activeFilterCount}
              accentColor={accentColor}
              onCreateBooking={() => openCreateBooking()}
              onToggleFilters={() => setFiltersOpen((current) => !current)}
            >
              {filtersOpen ? (
                <CalendarFiltersPanel
                  filters={bookingFilters}
                  light={isLight}
                  locale={locale}
                  accentColor={accentColor}
                  onChange={updateBookingFilter}
                  onReset={resetBookingFilters}
                />
              ) : null}

              <BlockSelectionPanel
                count={selectedSlots.length}
                loading={blockingLoading}
                error={blockingError}
                light={isLight}
                locale={locale}
                accentColor={accentColor}
                onBlock={() => void blockSelectedSlots()}
                onClear={clearSlotSelection}
              />

              {view === 'day' ? (
                <DayPlanner
                  plan={selectedPlan}
                  bookings={selectedDayBookings}
                  blockingBookings={allSelectedDayBookings}
                  selectedBookingId={selectedBookingId}
                  nowMinutes={nowMinutes}
                  todayIso={todayIso}
                  light={isLight}
                  locale={locale}
                  accentColor={accentColor}
                  selectedSlotKeys={selectedSlotKeys}
                  onToggleSlot={toggleSlotSelection}
                  onUnblockSlot={requestUnblockSlot}
                  onSelectBooking={(booking) => setSelectedBookingId(booking.id)}
                  onCreateBooking={openCreateBooking}
                />
              ) : null}

              {view === 'week' ? (
                <WeekPlanner
                  plans={visiblePlans}
                  bookings={visibleBookings}
                  blockingBookings={allVisibleBookings}
                  selectedBookingId={selectedBookingId}
                  nowMinutes={nowMinutes}
                  todayIso={todayIso}
                  light={isLight}
                  locale={locale}
                  accentColor={accentColor}
                  selectedSlotKeys={selectedSlotKeys}
                  onToggleSlot={toggleSlotSelection}
                  onUnblockSlot={requestUnblockSlot}
                  onSelectBooking={(booking) => setSelectedBookingId(booking.id)}
                  onCreateBooking={openCreateBooking}
                  onSelectDate={handleSelectDate}
                />
              ) : null}

              {view === 'month' ? (
                <MonthPlanner
                  selectedDate={selectedDate}
                  plans={visiblePlans}
                  bookings={visibleBookings}
                  todayIso={todayIso}
                  light={isLight}
                  locale={locale}
                  accentColor={accentColor}
                  onSelectBooking={(booking) => setSelectedBookingId(booking.id)}
                  onSelectDate={handleSelectDate}
                />
              ) : null}
            </CalendarZone>
          </div>
        </div>

        {selectedBooking ? (
          <BookingDetails
            booking={selectedBooking}
            locale={locale}
            light={isLight}
            actionLoading={actionLoading}
            accentColor={accentColor}
            onClose={() => setSelectedBookingId(null)}
            onStatusChange={(status) => void handleStatusChange(status)}
          />
        ) : null}

        {createDraft ? (
          <CreateBookingDialog
            draft={createDraft}
            services={serviceOptions}
            light={isLight}
            locale={locale}
            loading={createLoading}
            error={createError}
            accentColor={accentColor}
            onChange={updateCreateDraft}
            onClose={() => setCreateDraft(null)}
            onSubmit={(event) => void handleCreateBookingSubmit(event)}
          />
        ) : null}

        {pendingUnblockSlot ? (
          <UnblockSlotConfirmDialog
            slot={pendingUnblockSlot}
            light={isLight}
            locale={locale}
            loading={blockingLoading}
            accentColor={accentColor}
            onCancel={() => setPendingUnblockSlot(null)}
            onConfirm={() => void confirmUnblockSlot()}
          />
        ) : null}
      </main>
    </WorkspaceShell>
  );
}
