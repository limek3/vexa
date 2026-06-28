import type { BookingStatus } from '@/lib/types';

export type BookingAvailabilityStatus = 'workday' | 'short' | 'day-off';

export type BookingAvailabilityDay = {
  id?: string;
  date?: string;
  monthKey?: string;
  dayNumber?: number;
  weekdayIndex?: number;
  label?: string;
  status?: BookingAvailabilityStatus;
  slots?: string[];
  breaks?: string[];
  blockedSlots?: string[];
  custom?: boolean;
};

export type BookingServiceDetails = {
  id?: string;
  name: string;
  duration?: number;
  price?: number;
  status?: 'active' | 'seasonal' | 'draft' | string;
  visible?: boolean;
};

export type BookedSlot = {
  id?: string;
  date: string;
  time: string;
  service?: string;
  status?: BookingStatus | string;
  durationMinutes?: number | null;
};

type Interval = {
  start: number;
  end: number;
};

function splitInterval(value: string) {
  const [startRaw, endRaw] = value
    .replace(/—/g, '–')
    .replace(/-/g, '–')
    .split('–')
    .map((item) => item.trim());

  return {
    start: startRaw || '',
    end: endRaw || '',
  };
}

export function timeToMinutes(value: string) {
  const [hour, minute] = value.split(':').map(Number);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;

  return hour * 60 + minute;
}

export function minutesToTime(value: number) {
  const normalized = Math.max(0, Math.min(24 * 60 - 1, Math.round(value)));
  const hours = Math.floor(normalized / 60).toString().padStart(2, '0');
  const minutes = (normalized % 60).toString().padStart(2, '0');

  return `${hours}:${minutes}`;
}

function parseInterval(value: string): Interval | null {
  const { start, end } = splitInterval(value);
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);

  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return null;
  }

  return {
    start: startMinutes,
    end: endMinutes,
  };
}

function overlaps(left: Interval, right: Interval) {
  return left.start < right.end && right.start < left.end;
}

function isShortExplicitSlot(interval: Interval) {
  // Dashboard selected 1-hour cells are concrete booking starts.
  return interval.end - interval.start <= 60;
}

function getMondayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

function isAvailabilityDay(value: unknown): value is BookingAvailabilityDay {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as BookingAvailabilityDay & { weekday_index?: unknown };

  return (
    typeof candidate.date === 'string' ||
    typeof candidate.weekdayIndex === 'number' ||
    typeof candidate.weekday_index === 'number' ||
    Array.isArray(candidate.slots)
  );
}

const WEEKDAY_ID_TO_INDEX: Record<string, number> = {
  mon: 0,
  monday: 0,
  tue: 1,
  tuesday: 1,
  wed: 2,
  wednesday: 2,
  thu: 3,
  thursday: 3,
  fri: 4,
  friday: 4,
  sat: 5,
  saturday: 5,
  sun: 6,
  sunday: 6,
};

const WEEKDAY_LABEL_TO_INDEX: Record<string, number> = {
  'понедельник': 0,
  'пн': 0,
  'вторник': 1,
  'вт': 1,
  'среда': 2,
  'ср': 2,
  'четверг': 3,
  'чт': 3,
  'пятница': 4,
  'пт': 4,
  'суббота': 5,
  'сб': 5,
  'воскресенье': 6,
  'вс': 6,
};

function inferWeekdayIndex(day: BookingAvailabilityDay & { weekday_index?: unknown }) {
  if (typeof day.weekdayIndex === 'number' && day.weekdayIndex >= 0 && day.weekdayIndex <= 6) {
    return day.weekdayIndex;
  }

  if (typeof day.weekday_index === 'number' && day.weekday_index >= 0 && day.weekday_index <= 6) {
    return day.weekday_index;
  }

  const id = day.id?.toLowerCase().trim();
  if (id && id in WEEKDAY_ID_TO_INDEX) return WEEKDAY_ID_TO_INDEX[id];

  const label = day.label?.toLowerCase().trim();
  if (label && label in WEEKDAY_ID_TO_INDEX) return WEEKDAY_ID_TO_INDEX[label];
  if (label && label in WEEKDAY_LABEL_TO_INDEX) return WEEKDAY_LABEL_TO_INDEX[label];

  return undefined;
}

export function normalizeAvailabilityDays(items?: unknown): BookingAvailabilityDay[] {
  if (!Array.isArray(items)) return [];

  return items.filter(isAvailabilityDay).map((day) => {
    const candidate = day as BookingAvailabilityDay & { weekday_index?: unknown; month_key?: unknown; day_number?: unknown };
    return {
      ...day,
      monthKey: typeof day.monthKey === 'string' ? day.monthKey : typeof candidate.month_key === 'string' ? candidate.month_key : undefined,
      dayNumber: typeof day.dayNumber === 'number' ? day.dayNumber : typeof candidate.day_number === 'number' ? candidate.day_number : undefined,
      weekdayIndex: inferWeekdayIndex(candidate),
      status: day.status ?? 'workday',
      slots: Array.isArray(day.slots) ? day.slots : [],
      breaks: Array.isArray(day.breaks) ? day.breaks : [],
      blockedSlots: Array.isArray((day as BookingAvailabilityDay & { blockedSlots?: unknown; blocked_slots?: unknown }).blockedSlots)
        ? (day as BookingAvailabilityDay & { blockedSlots?: string[] }).blockedSlots
        : Array.isArray((day as BookingAvailabilityDay & { blocked_slots?: string[] }).blocked_slots)
          ? (day as BookingAvailabilityDay & { blocked_slots?: string[] }).blocked_slots
          : [],
    };
  });
}

function isRealDateOverride(day: BookingAvailabilityDay) {
  // A generated month row with custom=false and no slots is only a calendar shell.
  // It must not close the public booking page if a weekly template exists.
  if (day.custom === false && (day.slots?.length ?? 0) === 0 && (day.breaks?.length ?? 0) === 0 && (day.blockedSlots?.length ?? 0) === 0) {
    return day.status === 'day-off';
  }

  return true;
}

export function findAvailabilityDay(
  availability: BookingAvailabilityDay[],
  dateIso: string,
) {
  const date = new Date(`${dateIso}T00:00:00`);
  const weekdayIndex = getMondayIndex(date);
  const exactDay = [...availability].reverse().find((day) => day.date === dateIso && isRealDateOverride(day));

  if (exactDay) return exactDay;

  return (
    [...availability].reverse().find(
      (day) => !day.date && typeof day.weekdayIndex === 'number' && day.weekdayIndex === weekdayIndex,
    ) ?? null
  );
}
export function normalizeServiceDetails(items?: unknown): BookingServiceDetails[] {
  if (!Array.isArray(items)) return [];

  return items
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((item, index) => ({
      id: typeof item.id === 'string' ? item.id : `service-${index}`,
      name: String(item.name ?? '').trim(),
      duration: typeof item.duration === 'number' && Number.isFinite(item.duration) ? item.duration : undefined,
      price: typeof item.price === 'number' && Number.isFinite(item.price) ? item.price : undefined,
      status: typeof item.status === 'string' ? item.status : 'active',
      visible: typeof item.visible === 'boolean' ? item.visible : true,
    }))
    .filter((item) => item.name);
}

export function getServiceDuration(
  serviceName: string,
  services: BookingServiceDetails[] | null | undefined,
  fallbackMinutes = 60,
) {
  const normalizedName = serviceName.trim().toLowerCase();
  const service = services?.find((item) => item.name.trim().toLowerCase() === normalizedName);
  const duration = service?.duration;

  if (typeof duration === 'number' && Number.isFinite(duration) && duration > 0) {
    return Math.max(15, Math.round(duration));
  }

  return fallbackMinutes;
}

export function getAvailableTimesForDate({
  availability,
  date,
  serviceName,
  services,
  bookedSlots,
  fallbackDurationMinutes = 60,
}: {
  availability: BookingAvailabilityDay[];
  date: string;
  serviceName: string;
  services?: BookingServiceDetails[] | null;
  bookedSlots?: BookedSlot[] | null;
  fallbackDurationMinutes?: number;
}) {
  const day = findAvailabilityDay(availability, date);

  if (!day || day.status === 'day-off') return [];

  const duration = getServiceDuration(serviceName, services, fallbackDurationMinutes);
  const workIntervals = (day.slots ?? []).map(parseInterval).filter(Boolean) as Interval[];
  const breakIntervals = [...(day.breaks ?? []), ...(day.blockedSlots ?? [])].map(parseInterval).filter(Boolean) as Interval[];
  const bookedIntervals = (bookedSlots ?? [])
    .filter((slot) => slot.date === date && slot.status !== 'cancelled')
    .map((slot) => {
      const start = timeToMinutes(slot.time);
      if (start === null) return null;
      return {
        start,
        end: start + (slot.durationMinutes || getServiceDuration(slot.service || '', services, fallbackDurationMinutes)),
      } satisfies Interval;
    })
    .filter(Boolean) as Interval[];

  const times = new Set<string>();
  const explicitStartMode = workIntervals.length > 0 && workIntervals.every(isShortExplicitSlot);

  if (explicitStartMode) {
    for (const interval of workIntervals) {
      const candidate = { start: interval.start, end: interval.start + duration };

      if (breakIntervals.some((item) => overlaps(candidate, item))) continue;
      if (bookedIntervals.some((item) => overlaps(candidate, item))) continue;

      times.add(minutesToTime(interval.start));
    }

    return Array.from(times).sort((left, right) => (timeToMinutes(left) ?? 0) - (timeToMinutes(right) ?? 0));
  }

  for (const interval of workIntervals) {
    for (let start = interval.start; start + duration <= interval.end; start += duration) {
      const candidate = { start, end: start + duration };

      if (breakIntervals.some((item) => overlaps(candidate, item))) continue;
      if (bookedIntervals.some((item) => overlaps(candidate, item))) continue;

      times.add(minutesToTime(start));
    }
  }

  return Array.from(times).sort((left, right) => (timeToMinutes(left) ?? 0) - (timeToMinutes(right) ?? 0));
}

export function isSlotAvailable(input: {
  availability: BookingAvailabilityDay[];
  date: string;
  time: string;
  serviceName: string;
  services?: BookingServiceDetails[] | null;
  bookedSlots?: BookedSlot[] | null;
}) {
  return getAvailableTimesForDate(input).includes(input.time);
}
