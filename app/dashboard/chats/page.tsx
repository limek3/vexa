// app/dashboard/chats/page.tsx
'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useBrowserSearchParams } from '@/hooks/use-browser-search-params';
import { useMobile } from '@/hooks/use-mobile';
import {
  AlertTriangle,
  Archive,
  ArrowRightLeft,
  Bell,
  Bot,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  Check,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Gift,
  GripVertical,
  MessageCircle,
  MessageSquareQuote,
  MoreVertical,
  Pin,
  Plus,
  Phone,
  Search,
  SendHorizonal,
  Sparkles,
  Star,
  Trash2,
  UserRound,
} from 'lucide-react';

import { WorkspaceShell } from '@/components/shared/workspace-shell';
import { useOwnedWorkspaceData } from '@/hooks/use-owned-workspace-data';
import { Button } from '@/components/ui/button';
import { NumberPopIn } from '@/components/ui/number-pop-in';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAppearance } from '@/lib/appearance-context';
import { accentPalette } from '@/lib/appearance-palette';
import type {
  ChatDeliveryState,
  ChatMessageRecord,
  ChatThreadListResponse,
  ChatThreadRecord,
} from '@/lib/chat-types';
import { getDashboardDemoStorageKey, isDashboardDemoEnabled } from '@/lib/dashboard-demo';
import { getDashboardDemoChatThreads } from '@/lib/demo-data';
import { getTelegramAppSessionHeaders } from '@/lib/telegram-miniapp-auth-client';
import { cn } from '@/lib/utils';

type ThemeMode = 'light' | 'dark';
type SegmentFilter = 'all' | 'waiting' | 'scheduled' | ChatThreadRecord['segment'];
type ChannelFilter = 'all' | ChatThreadRecord['channel'];
type SortMode = 'manual' | 'recent' | 'priority' | 'unread';
type BotFlow = 'confirm' | 'reschedule' | 'followup';

type ThreadContextMenuState = {
  threadId: string;
  x: number;
  y: number;
};

type ThreadDragState = {
  id: string;
  pointerId: number;
  startY: number;
  startX: number;
  originIndex: number;
  active: boolean;
  cardRect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
};

function arrayMove<T>(items: T[], from: number, to: number) {
  if (from === to || from < 0 || from >= items.length || to < 0) {
    return items;
  }

  const next = [...items];
  const [item] = next.splice(from, 1);

  if (!item) return items;

  const insertIndex = Math.max(0, Math.min(to, next.length));
  next.splice(insertIndex, 0, item);

  return next;
}

function isOptimisticMessage(message: ChatMessageRecord) {
  return message.id.startsWith('local-') || message.metadata?.optimistic === true;
}

function isSameMessageContent(left: ChatMessageRecord, right: ChatMessageRecord) {
  if (left.author !== right.author) return false;

  const leftBody = (left.body ?? '').replace(/\s+/g, ' ').trim();
  const rightBody = (right.body ?? '').replace(/\s+/g, ' ').trim();
  if (!leftBody || leftBody !== rightBody) return false;

  const leftTime = new Date(left.createdAt).getTime();
  const rightTime = new Date(right.createdAt).getTime();

  if (!Number.isFinite(leftTime) || !Number.isFinite(rightTime)) return true;
  return Math.abs(leftTime - rightTime) < 3 * 60 * 1000;
}

function preferMessageRecord(left: ChatMessageRecord, right: ChatMessageRecord) {
  if (isOptimisticMessage(left) && !isOptimisticMessage(right)) return right;
  if (!isOptimisticMessage(left) && isOptimisticMessage(right)) return left;

  const leftTime = new Date(left.createdAt).getTime();
  const rightTime = new Date(right.createdAt).getTime();
  const newer = Number.isFinite(rightTime) && (!Number.isFinite(leftTime) || rightTime >= leftTime) ? right : left;

  return {
    ...left,
    ...newer,
    deliveryState: newer.deliveryState ?? left.deliveryState,
    metadata: {
      ...(left.metadata ?? {}),
      ...(newer.metadata ?? {}),
      dedupedFrom: left.id === newer.id ? left.metadata?.dedupedFrom : left.id,
    },
  } satisfies ChatMessageRecord;
}

function dedupeMessages(messages: ChatMessageRecord[]) {
  const sorted = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const result: ChatMessageRecord[] = [];

  for (const message of sorted) {
    const duplicateIndex = result.findIndex((item) => isSameMessageContent(item, message));

    if (duplicateIndex >= 0) {
      result[duplicateIndex] = preferMessageRecord(result[duplicateIndex], message);
    } else {
      result.push(message);
    }
  }

  return result.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function mergeThreadMessages(
  currentMessages: ChatMessageRecord[],
  incomingMessages: ChatMessageRecord[],
) {
  const incoming = [...incomingMessages];
  const map = new Map<string, ChatMessageRecord>();

  for (const message of currentMessages) {
    if (isOptimisticMessage(message) && incoming.some((incomingMessage) => isSameMessageContent(message, incomingMessage))) {
      continue;
    }

    map.set(message.id, message);
  }

  for (const message of incoming) {
    const current = map.get(message.id);
    map.set(message.id, current ? preferMessageRecord(current, message) : message);
  }

  return dedupeMessages(Array.from(map.values()));
}

function mergeThreadSnapshots(
  currentThreads: ChatThreadRecord[],
  incomingThreads: ChatThreadRecord[],
  sortMode: SortMode,
) {
  const currentMap = new Map(currentThreads.map((thread) => [thread.id, thread]));
  const merged = incomingThreads.map((thread) => {
    const current = currentMap.get(thread.id);
    if (!current) return thread;

    return {
      ...current,
      ...thread,
      messages: mergeThreadMessages(current.messages ?? [], thread.messages ?? []),
    } satisfies ChatThreadRecord;
  });

  const compactMerged = mergeThreadsByClientForUi(merged);

  if (sortMode !== 'manual') {
    return sortThreads(compactMerged, 'recent');
  }

  const ordered: ChatThreadRecord[] = [];
  const used = new Set<string>();

  for (const thread of currentThreads) {
    const next = compactMerged.find((item) => item.id === thread.id);
    if (!next) continue;
    ordered.push(next);
    used.add(next.id);
  }

  const fresh = compactMerged.filter((thread) => !used.has(thread.id));
  return [...sortThreads(fresh, 'recent'), ...ordered];
}

function ChatMetricSparkline({ values, color }: { values: number[]; color: string }) {
  const data = (values?.length ? values : [0, 0]).filter((v) => Number.isFinite(v));
  const width = 72;
  const height = 22;
  const pad = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(1, max - min);
  const points = data.map((v, i) => {
    const x = pad + (i / Math.max(1, data.length - 1)) * (width - pad * 2);
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });
  const line = points
    .map((p, i) => (i === 0 ? `M${p[0]} ${p[1]}` : `L${p[0]} ${p[1]}`))
    .join(' ');
  const area = `${line} L${points[points.length - 1][0]} ${height} L${points[0][0]} ${height} Z`;
  const gradId = `chat-spark-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={points[points.length - 1][0]}
        cy={points[points.length - 1][1]}
        r={1.8}
        fill={color}
      />
    </svg>
  );
}

function pageBg(light: boolean) {
  return light ? 'bg-[#fbf8f3]' : 'bg-[#080808]';
}

function pageText(light: boolean) {
  return light ? 'text-[#172033]' : 'text-[#f8f7f4]';
}

function mutedText(light: boolean) {
  return light ? 'text-[#747b87]' : 'text-[#9ca3af]';
}

function faintText(light: boolean) {
  return light ? 'text-[#172033]/32' : 'text-white/26';
}

function borderTone(light: boolean) {
  return light ? 'border-[#eee5db]' : 'border-white/[0.08]';
}

function cardTone(light: boolean) {
  return light
    ? 'border-[#eee5db] bg-[#fffdf9] shadow-[0_18px_46px_rgba(50,35,22,0.06),0_1px_2px_rgba(50,35,22,0.04)]'
    : 'border-white/[0.08] bg-[#141414] shadow-none';
}

function insetTone(light: boolean) {
  return light
    ? 'border-[#efe5da] bg-[#fffaf4] shadow-[0_8px_22px_rgba(50,35,22,0.025),inset_0_1px_0_rgba(255,255,255,0.84)]'
    : 'border-white/[0.07] bg-white/[0.026] shadow-[inset_0_1px_0_rgba(255,255,255,0.024)]';
}

function inputTone(light: boolean) {
  return light
    ? 'border-[#eadfd4] bg-white text-[#172033] placeholder:text-[#172033]/32'
    : 'border-white/[0.08] bg-white/[0.035] text-white placeholder:text-white/30';
}

function buttonBase(light: boolean, active = false) {
  return cn(
    'inline-flex h-8 items-center justify-center gap-2 rounded-[9px] border px-3 text-[12px] font-medium shadow-none transition-[background,border-color,color,opacity,transform] duration-150 active:scale-[0.985]',
    active
      ? light
        ? 'cb-neutral-primary cb-neutral-primary-light hover:opacity-[0.98]'
        : 'cb-neutral-primary cb-neutral-primary-dark hover:opacity-[0.98]'
      : light
        ? 'border-[#eadfd4] bg-white text-[#172033]/60 hover:border-[#dfcec0] hover:bg-[#fff7ef] hover:text-[#172033]'
        : 'border-white/[0.08] bg-white/[0.04] text-white/55 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white',
  );
}

type ThreadActiveAlert = {
  type?: string;
  status?: string;
  bookingId?: string;
  channel?: string;
  createdAt?: string;
  message?: string;
};

function getThreadActiveAlert(thread?: ChatThreadRecord | null): ThreadActiveAlert | null {
  const raw = thread?.metadata?.activeAlert;
  if (!raw || typeof raw !== 'object') return null;

  const alert = raw as ThreadActiveAlert;
  if (alert.type !== 'reschedule_request') return null;
  if (alert.status && alert.status !== 'open') return null;

  return alert;
}

function warningTone(light: boolean) {
  return light
    ? 'border-amber-500/24 bg-amber-500/[0.075] text-amber-950'
    : 'border-amber-300/20 bg-amber-300/[0.08] text-amber-100';
}

/**
 * ЕДИНЫЙ РЕФЕРЕНС ДЛЯ ВСЕХ МЕНЮ НА ЭТОЙ СТРАНИЦЕ:
 * - матовое стекло как на скрине;
 * - без тяжёлых теней;
 * - обычный текст без accent-цвета;
 * - выбранный пункт выделяется мягкой плашкой;
 * - accent-цвет только у галочки справа.
 */
function glassMenuContentClass(light: boolean) {
  return cn(
    'relative z-[80] overflow-hidden rounded-[10px] border p-1 shadow-none outline-none',
    'backdrop-blur-[28px] [-webkit-backdrop-filter:blur(28px)_saturate(1.45)]',
    light
      ? 'border-black/[0.08] bg-[#f7f7f4]/80 text-black'
      : 'border-white/[0.10] bg-[#252525]/72 text-white',
  );
}

function glassMenuSurfaceStyle(light: boolean, accentColor: string): CSSProperties {
  return {
    background: light
      ? `
        linear-gradient(135deg, rgba(255,255,255,0.78), rgba(238,238,234,0.68)),
        radial-gradient(circle at 14% 0%, color-mix(in srgb, ${accentColor} 5%, transparent) 0%, transparent 42%),
        rgba(247,247,244,0.72)
      `
      : `
        linear-gradient(135deg, rgba(58,58,58,0.74), rgba(30,30,30,0.70)),
        radial-gradient(circle at 16% 0%, color-mix(in srgb, ${accentColor} 6%, transparent) 0%, transparent 42%),
        rgba(34,34,34,0.72)
      `,
    boxShadow: 'none',
    backdropFilter: 'blur(28px) saturate(1.45)',
    WebkitBackdropFilter: 'blur(28px) saturate(1.45)',
    ['--menu-accent' as string]: accentColor,
  };
}

function selectTriggerClass(light: boolean) {
  return cn(
    'h-9 w-full justify-between rounded-[9px] border px-3 text-[12px] font-semibold shadow-none outline-none transition active:scale-[0.985]',
    'focus:ring-0 focus:ring-offset-0',
    light
      ? 'border-black/[0.08] bg-white text-black/72 hover:border-black/[0.13] hover:bg-white'
      : 'border-white/[0.08] bg-white/[0.04] text-white/72 hover:border-white/[0.14] hover:bg-white/[0.06]',
  );
}

function searchFieldClass(light: boolean) {
  return cn(
    'flex h-9 min-w-0 items-center gap-2 rounded-[9px] border px-3 shadow-none outline-none',
    '!bg-transparent bg-transparent bg-none transition-[border-color,color] duration-150',
    'focus-within:ring-0 focus-within:ring-offset-0',
    light
      ? 'border-black/[0.08] text-black/56 hover:border-black/[0.13] focus-within:border-black/[0.16] focus-within:text-black'
      : 'border-white/[0.08] text-white/48 hover:border-white/[0.13] focus-within:border-white/[0.16] focus-within:text-white',
  );
}

function selectContentClass(light: boolean) {
  return cn(glassMenuContentClass(light), 'min-w-[var(--radix-select-trigger-width)]');
}

function glassMenuItemClass(light: boolean, active = false, danger = false) {
  return cn(
    'relative flex w-full cursor-pointer select-none items-center rounded-[8px] border border-transparent',
    'px-3 py-2.5 text-[12px] font-medium outline-none shadow-none',
    'transition-[background,color,transform] duration-150 active:scale-[0.992]',
    'data-[disabled]:pointer-events-none data-[disabled]:opacity-40',
    danger
      ? light
        ? 'text-red-500 hover:bg-red-500/10 data-[highlighted]:bg-red-500/10 data-[highlighted]:text-red-600 focus:bg-red-500/10 focus:text-red-600'
        : 'text-red-300 hover:bg-red-400/10 data-[highlighted]:bg-red-400/10 data-[highlighted]:text-red-200 focus:bg-red-400/10 focus:text-red-200'
      : light
        ? 'text-black/62 hover:bg-black/[0.045] hover:text-black data-[highlighted]:bg-black/[0.045] data-[highlighted]:text-black focus:bg-black/[0.045] focus:text-black'
        : 'text-white/64 hover:bg-white/[0.075] hover:text-white data-[highlighted]:bg-white/[0.075] data-[highlighted]:text-white focus:bg-white/[0.075] focus:text-white',
    active &&
      !danger &&
      (light
        ? 'bg-black/[0.045] !text-black'
        : 'bg-white/[0.085] !text-white'),
  );
}

function dropdownItemTone(light: boolean, active?: boolean) {
  return cn(
    glassMenuItemClass(light, Boolean(active)),
    'pr-9',
    '[&>span:first-child]:left-auto [&>span:first-child]:right-3',
    '[&>span:first-child]:flex [&>span:first-child]:h-full [&>span:first-child]:items-center',
    '[&>span:first-child]:!text-[var(--menu-accent)]',
  );
}

function DropdownOption({
  label,
  active,
  light,
  minWidth = '100%',
}: {
  label: string;
  active: boolean;
  light: boolean;
  minWidth?: number | string;
}) {
  return (
    <div
      className="flex w-full min-w-0 items-center"
      style={{
        minWidth: typeof minWidth === 'number' ? `${minWidth}px` : minWidth,
      }}
    >
      <span
        className={cn(
          'block min-w-0 truncate',
          active && 'font-semibold',
          active
            ? light
              ? 'text-black'
              : 'text-white'
            : light
              ? 'text-black/62'
              : 'text-white/64',
        )}
      >
        {label}
      </span>
    </div>
  );
}

function menuSeparatorClass(light: boolean) {
  return cn('my-1 h-px', light ? 'bg-black/[0.07]' : 'bg-white/[0.08]');
}

function getInitials(value: string) {
  return (
    value
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'S'
  );
}

const CHAT_AVATAR_POOL = [
  '/assets/clickbook/avatars/avatar_hero_ekaterina_round.webp',
  '/assets/clickbook/avatars/avatar_hero_maria_round.webp',
  '/assets/clickbook/avatars/avatar_hero_anna_round.webp',
  '/assets/clickbook/avatars/avatar_pipeline_svetlana_round.webp',
  '/assets/clickbook/avatars/avatar_pipeline_natalia_round.webp',
  '/assets/clickbook/avatars/avatar_pipeline_olga_round.webp',
  '/assets/clickbook/avatars/avatar_pipeline_dmitry_round.webp',
  '/assets/clickbook/avatars/avatar_review_author_round.webp',
];

function avatarSrcForName(name: string) {
  const normalized = name.toLowerCase();

  if (normalized.includes('екатерин') || normalized.includes('ekaterina')) return CHAT_AVATAR_POOL[0];
  if (normalized.includes('мари') || normalized.includes('mari')) return CHAT_AVATAR_POOL[1];
  if (normalized.includes('анн') || normalized.includes('anna')) return CHAT_AVATAR_POOL[2];
  if (normalized.includes('свет') || normalized.includes('svet')) return CHAT_AVATAR_POOL[3];
  if (normalized.includes('натал') || normalized.includes('natal')) return CHAT_AVATAR_POOL[4];
  if (normalized.includes('ольг') || normalized.includes('olga')) return CHAT_AVATAR_POOL[5];

  const hash = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return CHAT_AVATAR_POOL[hash % CHAT_AVATAR_POOL.length];
}

function ClientAvatar({
  name,
  size = 'md',
  className,
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClass = {
    sm: 'size-8 rounded-[12px]',
    md: 'size-11 rounded-[15px]',
    lg: 'size-14 rounded-[18px]',
  }[size];

  return (
    <span
      className={cn(
        'relative inline-flex shrink-0 overflow-hidden border border-white bg-[#f5e7dc] shadow-[0_8px_18px_rgba(75,46,24,0.10)]',
        sizeClass,
        className,
      )}
    >
      <img
        src={avatarSrcForName(name)}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
      />
    </span>
  );
}

function channelColor(channel: ChatThreadRecord['channel']) {
  if (channel === 'Telegram') return '#42a5f5';
  if (channel === 'Instagram') return '#ec4899';
  if (channel === 'VK') return '#4f7cff';
  return '#9aa3af';
}

function getTelegramHeaderRecord(): Record<string, string> {
  return Object.fromEntries(
    Object.entries(getTelegramAppSessionHeaders()).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length > 0,
    ),
  );
}

function formatTimeLabel(value: string, locale: 'ru' | 'en') {
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatDateLabel(value: string, locale: 'ru' | 'en') {
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(value));
}

function formatLongDateLabel(value: string, locale: 'ru' | 'en') {
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'long',
    weekday: 'short',
  }).format(new Date(value));
}

function toLocalIsoDate(date: Date) {
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function addDaysIso(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return toLocalIsoDate(date);
}

function formatPickerDateLabel(value: string, locale: 'ru' | 'en') {
  const normalized = value.slice(0, 10);

  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${normalized}T00:00:00`));
}

const TIME_OPTIONS = Array.from({ length: 24 }, (_, index) => {
  const hour = 9 + Math.floor(index / 2);
  const minute = index % 2 === 0 ? '00' : '30';
  return `${String(hour).padStart(2, '0')}:${minute}`;
});

function deliveryLabel(value: ChatDeliveryState | null | undefined, locale: 'ru' | 'en') {
  if (!value) return null;

  const labels =
    locale === 'ru'
      ? {
          queued: 'В очереди',
          sent: 'Отправлено',
          delivered: 'Доставлено',
          read: 'Прочитано',
          failed: 'Не доставлено',
        }
      : {
          queued: 'Queued',
          sent: 'Sent',
          delivered: 'Delivered',
          read: 'Read',
          failed: 'Failed',
        };

  return labels[value];
}

function buildBotDraft(
  flow: BotFlow,
  thread: ChatThreadRecord,
  locale: 'ru' | 'en',
  nextVisit?: string,
) {
  if (flow === 'confirm') {
    return locale === 'ru'
      ? `Здравствуйте, ${thread.clientName}! Отправляю детали вашей записи. Если планы поменяются, просто ответьте в этот чат.`
      : `Hi ${thread.clientName}! Here are your booking details. If anything changes, just reply in this chat.`;
  }

  if (flow === 'reschedule') {
    return locale === 'ru'
      ? `Здравствуйте, ${thread.clientName}!\n\nПредлагаю перенести запись на ${nextVisit ?? 'новое время'}.\n\nЕсли время подходит — нажмите «Подтвердить перенос». Если нет — нажмите «Не подходит».`
      : `Hi ${thread.clientName}!\n\nI suggest rescheduling to ${nextVisit ?? 'a new time'}.\n\nPress “Confirm reschedule” if it works, or “Doesn’t work” if it does not.`;
  }

  return locale === 'ru'
    ? `Спасибо за визит, ${thread.clientName}! Когда будете готовы, я пришлю ближайшие удобные слоты прямо сюда.`
    : `Thanks for visiting, ${thread.clientName}! When you are ready, I can send the nearest convenient slots here.`;
}

function fillTemplateContent(
  content: string,
  thread: ChatThreadRecord | null,
  locale: 'ru' | 'en',
  publicHref: string,
) {
  if (!thread) return content;

  const fallbackDate = locale === 'ru' ? 'ближайшую дату' : 'the next date';
  const fallbackTime = locale === 'ru' ? 'удобное время' : 'a convenient time';
  const fallbackService = locale === 'ru' ? 'визит' : 'appointment';

  const rawService =
    thread.metadata && typeof thread.metadata['service'] === 'string'
      ? String(thread.metadata['service'])
      : null;

  const rawNextVisit = thread.nextVisit ?? null;
  const normalizedNextVisit = rawNextVisit
    ? rawNextVisit.includes('T')
      ? rawNextVisit
      : rawNextVisit.includes(' ')
        ? rawNextVisit.replace(' ', 'T')
        : `${rawNextVisit}T12:00:00`
    : null;

  const visitDateLabel = normalizedNextVisit
    ? formatDateLabel(normalizedNextVisit, locale)
    : fallbackDate;

  const visitTimeLabel = normalizedNextVisit
    ? formatTimeLabel(normalizedNextVisit, locale)
    : fallbackTime;

  return content
    .replaceAll('{{имя}}', thread.clientName)
    .replaceAll('{{дата}}', visitDateLabel)
    .replaceAll('{{время}}', visitTimeLabel)
    .replaceAll('{{услуга}}', rawService ?? fallbackService)
    .replaceAll('{{ссылка}}', publicHref);
}

function getThreadServices(thread: ChatThreadRecord | null) {
  if (!thread?.metadata) return [] as string[];

  const services = thread.metadata.services;
  if (Array.isArray(services)) {
    return services.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }

  if (typeof thread.metadata.service === 'string' && thread.metadata.service.trim()) {
    return [thread.metadata.service.trim()];
  }

  return [] as string[];
}

function getThreadContextLine(thread: ChatThreadRecord | null, locale: 'ru' | 'en') {
  if (!thread) return null;

  const services = getThreadServices(thread);
  const service = services.length > 1
    ? `${services[0]} +${services.length - 1}`
    : services[0] ?? null;
  const date = typeof thread.metadata?.bookingDate === 'string'
    ? thread.metadata.bookingDate
    : thread.nextVisit ?? null;
  const time = typeof thread.metadata?.bookingTime === 'string'
    ? thread.metadata.bookingTime
    : null;
  const master = typeof thread.metadata?.masterName === 'string'
    ? thread.metadata.masterName
    : null;
  const code = typeof thread.metadata?.bookingCode === 'string'
    ? thread.metadata.bookingCode
    : null;

  const dateLabel = date ? formatDateLabel(date, locale) : null;

  return [code, service, dateLabel && time ? `${dateLabel} · ${time}` : dateLabel, master].filter(Boolean).join(' · ') || null;
}

function getThreadClientKey(thread: ChatThreadRecord | null) {
  if (!thread) return '';
  const phone = thread.clientPhone.replace(/\D+/g, '');
  return phone || thread.clientName.trim().toLowerCase();
}

function getThreadBookingCode(thread: ChatThreadRecord | null) {
  return typeof thread?.metadata?.bookingCode === 'string' ? thread.metadata.bookingCode : null;
}

function getThreadServiceLabel(thread: ChatThreadRecord | null) {
  const services = getThreadServices(thread);
  if (services.length === 0) return null;
  return services.length > 1 ? `${services[0]} +${services.length - 1}` : services[0];
}


type ThreadBookingContext = {
  id: string;
  code?: string | null;
  service?: string | null;
  services?: string[];
  date?: string | null;
  time?: string | null;
  masterName?: string | null;
};

function getThreadBookingContexts(thread: ChatThreadRecord | null) {
  if (!thread?.metadata) return [] as ThreadBookingContext[];

  const raw = thread.metadata.bookingContexts;
  const contexts: ThreadBookingContext[] = [];

  if (Array.isArray(raw)) {
    raw.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const row = item as Record<string, unknown>;
      const id = typeof row.id === 'string' ? row.id : typeof row.bookingId === 'string' ? row.bookingId : '';
      if (!id) return;
      contexts.push({
        id,
        code: typeof row.code === 'string' ? row.code : typeof row.bookingCode === 'string' ? row.bookingCode : null,
        service: typeof row.service === 'string' ? row.service : null,
        services: Array.isArray(row.services)
          ? row.services.filter((service): service is string => typeof service === 'string' && service.trim().length > 0)
          : typeof row.service === 'string'
            ? [row.service]
            : [],
        date: typeof row.date === 'string' ? row.date : typeof row.bookingDate === 'string' ? row.bookingDate : null,
        time: typeof row.time === 'string' ? row.time : typeof row.bookingTime === 'string' ? row.bookingTime : null,
        masterName: typeof row.masterName === 'string' ? row.masterName : null,
      });
    });
  }

  const bookingId = typeof thread.metadata.bookingId === 'string' ? thread.metadata.bookingId : '';
  if (bookingId && !contexts.some((context) => context.id === bookingId)) {
    const services = getThreadServices(thread);
    contexts.push({
      id: bookingId,
      code: typeof thread.metadata.bookingCode === 'string' ? thread.metadata.bookingCode : null,
      service: typeof thread.metadata.service === 'string' ? thread.metadata.service : services[0] ?? null,
      services,
      date: typeof thread.metadata.bookingDate === 'string' ? thread.metadata.bookingDate : thread.nextVisit ?? null,
      time: typeof thread.metadata.bookingTime === 'string' ? thread.metadata.bookingTime : null,
      masterName: typeof thread.metadata.masterName === 'string' ? thread.metadata.masterName : null,
    });
  }

  return contexts;
}

function getBookingContextLabel(context: ThreadBookingContext, locale: 'ru' | 'en') {
  const firstService = context.services?.[0] || context.service || (locale === 'ru' ? 'запись' : 'booking');
  const serviceLabel = context.services && context.services.length > 1 ? `${firstService} +${context.services.length - 1}` : firstService;
  const dateLabel = context.date ? formatDateLabel(context.date, locale) : null;
  const timeLabel = context.time ?? null;
  return [context.code, serviceLabel, dateLabel && timeLabel ? `${dateLabel} · ${timeLabel}` : dateLabel].filter(Boolean).join(' · ');
}

function getBookingContextShortLabel(context: ThreadBookingContext, locale: 'ru' | 'en') {
  const firstService = context.services?.[0] || context.service || (locale === 'ru' ? 'запись' : 'booking');
  const serviceLabel = context.services && context.services.length > 1 ? `${firstService} +${context.services.length - 1}` : firstService;
  const dateLabel = context.date ? formatDateLabel(context.date, locale) : null;
  return [context.code ?? 'CB', serviceLabel, dateLabel].filter(Boolean).join(' · ');
}

function getLastHumanMessage(thread: ChatThreadRecord | null) {
  if (!thread) return null;
  return [...thread.messages].reverse().find((message) => message.author !== 'system') ?? null;
}

function threadNeedsReply(thread: ChatThreadRecord | null) {
  if (!thread) return false;
  const lastHumanMessage = getLastHumanMessage(thread);
  return thread.unreadCount > 0 || lastHumanMessage?.author === 'client';
}

function threadHasBooking(thread: ChatThreadRecord | null) {
  if (!thread) return false;
  return Boolean(thread.nextVisit) || getThreadBookingContexts(thread).length > 0;
}

function threadHasFailedDelivery(thread: ChatThreadRecord | null) {
  if (!thread) return false;
  return thread.messages.some((message) => message.deliveryState === 'failed');
}


function sortThreads(
  items: ChatThreadRecord[],
  sortMode: SortMode,
  pinnedThreadIds: string[] = [],
) {
  const next = [...items];
  const pinnedSet = new Set(pinnedThreadIds);

  next.sort((left, right) => {
    const leftPinned = pinnedSet.has(left.id);
    const rightPinned = pinnedSet.has(right.id);

    if (leftPinned !== rightPinned) {
      return leftPinned ? -1 : 1;
    }

    if (sortMode === 'manual') return 0;

    if (sortMode === 'priority' && left.isPriority !== right.isPriority) {
      return left.isPriority ? -1 : 1;
    }

    if (sortMode === 'unread' && left.unreadCount !== right.unreadCount) {
      return right.unreadCount - left.unreadCount;
    }

    return new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime();
  });

  return next;
}

function replaceThread(
  items: ChatThreadRecord[],
  threadId: string,
  updater: (thread: ChatThreadRecord) => ChatThreadRecord,
) {
  return items.map((item) => (item.id === threadId ? updater(item) : item));
}

function createLocalMessage(
  threadId: string,
  body: string,
  author: 'master' | 'system',
  viaBot: boolean,
): ChatMessageRecord {
  const now = new Date().toISOString();

  return {
    id: `local-${crypto.randomUUID()}`,
    threadId,
    author,
    body,
    viaBot,
    deliveryState: author === 'master' || author === 'system' ? 'sent' : null,
    createdAt: now,
    metadata: { optimistic: true },
  };
}


function chatThreadMetaString(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(Math.trunc(value));
  if (typeof value === 'string' && value.trim()) return value.trim();
  return '';
}

function normalizedClientNameForMerge(value?: string | null) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function threadClientMergeKeys(thread: ChatThreadRecord) {
  const keys = new Set<string>();
  const phone = thread.clientPhone.replace(/\D+/g, '');
  const name = normalizedClientNameForMerge(thread.clientName);
  const telegramChatId = chatThreadMetaString(thread.metadata?.clientTelegramChatId);
  const vkPeerId = chatThreadMetaString(thread.metadata?.clientVkPeerId);
  const vkUserId = chatThreadMetaString(thread.metadata?.clientVkUserId);

  if (phone) keys.add(`phone:${phone}`);
  if (telegramChatId) keys.add(`tg:${telegramChatId}`);
  if (vkPeerId) keys.add(`vkpeer:${vkPeerId}`);
  if (vkUserId) keys.add(`vk:${vkUserId}`);
  if (name) keys.add(`name:${name}`);

  return Array.from(keys);
}

function mergeBookingContextsForUi(contexts: ThreadBookingContext[]) {
  const map = new Map<string, ThreadBookingContext>();

  contexts.forEach((context) => {
    if (!context.id) return;
    const current = map.get(context.id);
    const services = Array.from(new Set([...(current?.services ?? []), ...(context.services ?? []), context.service ?? ''].filter(Boolean)));
    map.set(context.id, { ...(current ?? {}), ...context, services });
  });

  return Array.from(map.values()).sort((left, right) => `${right.date ?? ''} ${right.time ?? ''}`.localeCompare(`${left.date ?? ''} ${left.time ?? ''}`));
}

function mergeThreadsByClientForUi(items: ChatThreadRecord[]) {
  const groups: ChatThreadRecord[][] = [];
  const keyToGroupIndex = new Map<string, number>();

  items.forEach((thread) => {
    const keys = threadClientMergeKeys(thread);
    if (keys.length === 0) {
      groups.push([thread]);
      return;
    }

    const indexes = Array.from(new Set(keys.map((key) => keyToGroupIndex.get(key)).filter((index): index is number => typeof index === 'number')));

    if (indexes.length === 0) {
      const index = groups.length;
      groups.push([thread]);
      keys.forEach((key) => keyToGroupIndex.set(key, index));
      return;
    }

    const primaryIndex = indexes[0];
    groups[primaryIndex].push(thread);
    keys.forEach((key) => keyToGroupIndex.set(key, primaryIndex));
  });

  return groups.map((group) => {
    const sorted = [...group].sort((left, right) => new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime());
    const primary = sorted[0];
    const messages = dedupeMessages(sorted.flatMap((thread) => thread.messages ?? []));
    const lastMessage = messages.at(-1);
    const contexts = mergeBookingContextsForUi(sorted.flatMap((thread) => getThreadBookingContexts(thread)));
    const bookingIds = Array.from(new Set([
      ...sorted.flatMap((thread) => Array.isArray(thread.metadata?.bookingIds) ? thread.metadata.bookingIds.filter((item): item is string => typeof item === 'string') : []),
      ...contexts.map((context) => context.id),
      ...sorted.map((thread) => typeof thread.metadata?.bookingId === 'string' ? thread.metadata.bookingId : ''),
    ].filter(Boolean)));

    const bestPhone = sorted.find((thread) => thread.clientPhone.replace(/\D+/g, ''))?.clientPhone ?? primary.clientPhone;
    const bestName = sorted.find((thread) => normalizedClientNameForMerge(thread.clientName))?.clientName ?? primary.clientName;
    const bestChannel = sorted.find((thread) => thread.channel !== 'Web')?.channel ?? primary.channel;

    return {
      ...primary,
      clientName: bestName,
      clientPhone: bestPhone,
      channel: bestChannel,
      botConnected: sorted.some((thread) => thread.botConnected),
      isPriority: sorted.some((thread) => thread.isPriority),
      unreadCount: sorted.reduce((sum, thread) => sum + (thread.unreadCount ?? 0), 0),
      lastMessagePreview: lastMessage?.body ?? primary.lastMessagePreview,
      lastMessageAt: lastMessage?.createdAt ?? primary.lastMessageAt,
      messages,
      metadata: {
        ...(primary.metadata ?? {}),
        bookingId: typeof primary.metadata?.bookingId === 'string' ? primary.metadata.bookingId : bookingIds[0] ?? undefined,
        bookingIds,
        bookingContexts: contexts,
        mergedThreadIds: sorted.map((thread) => thread.id),
        clientTelegramChatId: sorted.find((thread) => thread.metadata?.clientTelegramChatId)?.metadata?.clientTelegramChatId ?? primary.metadata?.clientTelegramChatId,
        clientVkPeerId: sorted.find((thread) => thread.metadata?.clientVkPeerId)?.metadata?.clientVkPeerId ?? primary.metadata?.clientVkPeerId,
        clientVkUserId: sorted.find((thread) => thread.metadata?.clientVkUserId)?.metadata?.clientVkUserId ?? primary.metadata?.clientVkUserId,
      },
    } satisfies ChatThreadRecord;
  }).sort((left, right) => new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime());
}

function createLocalThread(
  locale: 'ru' | 'en',
  clientName: string,
  clientPhone: string,
): ChatThreadRecord {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    workspaceId: 'local-workspace',
    clientName,
    clientPhone,
    channel: 'Telegram',
    segment: 'new',
    source: locale === 'ru' ? 'Ручное добавление' : 'Manual add',
    nextVisit: null,
    isPriority: false,
    botConnected: true,
    lastMessagePreview:
      locale === 'ru' ? 'Новый чат создан вручную.' : 'New chat created manually.',
    lastMessageAt: now,
    unreadCount: 0,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

function segmentBadgeLabel(segment: ChatThreadRecord['segment'], locale: 'ru' | 'en') {
  if (locale === 'ru') {
    return {
      new: 'Новый',
      active: 'В работе',
      followup: 'Повтор',
    }[segment] ?? String(segment);
  }

  return {
    new: 'New',
    active: 'Active',
    followup: 'Repeat',
  }[segment] ?? String(segment);
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
  action,
  light,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  light: boolean;
}) {
  return (
    <div
      className={cn(
        'flex min-h-[58px] shrink-0 items-center justify-between gap-4 border-b px-4 py-3',
        borderTone(light),
      )}
    >
      <div className="min-w-0">
        <h2 className={cn('truncate text-[13px] font-semibold tracking-[-0.018em]', pageText(light))}>
          {title}
        </h2>

        {description ? (
          <p className={cn('mt-1 truncate text-[11px]', mutedText(light))}>{description}</p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function Panel({
  children,
  light,
  className,
}: {
  children?: ReactNode;
  light: boolean;
  className?: string;
}) {
  return <div className={cn('rounded-[10px] border', insetTone(light), className)}>{children}</div>;
}

function MicroLabel({
  children,
  light,
  active,
  className,
}: {
  children: ReactNode;
  light: boolean;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-[9px] border px-2.5 text-[10.5px] font-medium',
        active
          ? 'cb-accent-pill-active'
          : light
            ? 'border-black/[0.08] bg-white text-black/50'
            : 'border-white/[0.08] bg-white/[0.04] text-white/42',
        className,
      )}
    >
      {children}
    </span>
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
  count,
  active,
  onClick,
  light,
  accentColor,
  className,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  light: boolean;
  accentColor: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative inline-flex h-9 min-w-[60px] shrink-0 items-center justify-center border-r px-2.5 text-[10.5px] font-semibold tracking-[-0.015em] transition-colors duration-150 last:border-r-0 active:scale-[0.985]',
        light ? 'border-black/[0.07]' : 'border-white/[0.07]',
        active
          ? light
            ? 'text-black'
            : 'text-white'
          : light
            ? 'text-black/40 hover:text-black/70'
            : 'text-white/36 hover:text-white/70',
        className,
      )}
    >
      <span className="relative z-10 flex min-w-0 items-center gap-1.5">
        <span className="truncate">{label}</span>
        {typeof count === 'number' ? (
          <span
            className={cn(
              'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[9px] font-semibold',
              active
                ? 'bg-white/75 text-[#172033]'
                : light
                  ? 'bg-black/[0.045] text-black/42'
                  : 'bg-white/[0.08] text-white/42',
            )}
          >
            {count}
          </span>
        ) : null}
      </span>

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

function EmptyState({
  text,
  hint,
  light,
}: {
  text: string;
  hint?: string;
  light: boolean;
}) {
  return (
    <Panel light={light} className="px-4 py-5">
      <div className={cn('text-[12px] font-semibold', pageText(light))}>{text}</div>
      {hint ? <div className={cn('mt-1 text-[11px] leading-5', mutedText(light))}>{hint}</div> : null}
    </Panel>
  );
}

function GlassMenuItem({
  label,
  icon,
  active,
  danger,
  light,
  accentColor,
  onClick,
}: {
  label: string;
  icon?: ReactNode;
  active?: boolean;
  danger?: boolean;
  light: boolean;
  accentColor: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={glassMenuItemClass(light, Boolean(active), Boolean(danger))}
      onClick={onClick}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2">
        {icon ? (
          <span
            className={cn(
              'flex size-5 shrink-0 items-center justify-center',
              danger
                ? light
                  ? 'text-red-500'
                  : 'text-red-300'
                : light
                  ? 'text-black/42'
                  : 'text-white/42',
            )}
          >
            {icon}
          </span>
        ) : null}

        <span className="min-w-0 truncate text-current">{label}</span>
      </span>

      <span className="ml-auto flex size-5 shrink-0 items-center justify-center">
        {active ? <Check className="size-3.5" style={{ color: danger ? undefined : accentColor }} /> : null}
      </span>
    </button>
  );
}

function ThreadContextMenu({
  menu,
  thread,
  light,
  accentColor,
  labels,
  onClose,
  onToggleBot,
  onTogglePin,
  onTogglePriority,
  onExport,
  onDelete,
}: {
  menu: ThreadContextMenuState | null;
  thread: (ChatThreadRecord & { __pinned?: boolean }) | null;
  light: boolean;
  accentColor: string;
  labels: {
    botConnected: string;
    botOff: string;
    priorityOn: string;
    priorityOff: string;
    pinThread: string;
    unpinThread: string;
    export: string;
    deleteChat: string;
  };
  onClose: () => void;
  onToggleBot: () => void;
  onTogglePin: () => void;
  onTogglePriority: () => void;
  onExport: () => void;
  onDelete: () => void;
}) {
  useEffect(() => {
    if (!menu) return;

    const close = () => onClose();

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
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

  if (!menu || !thread || typeof document === 'undefined') return null;

  const width = 260;
  const left =
    typeof window !== 'undefined'
      ? Math.min(menu.x, window.innerWidth - width - 12)
      : menu.x;
  const top =
    typeof window !== 'undefined'
      ? Math.min(menu.y, window.innerHeight - 274)
      : menu.y;

  const pinned = Boolean(thread.__pinned);

  return createPortal(
    <div
      className="fixed z-[140]"
      style={{ left, top, width }}
      onPointerDown={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: -3 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
        className={glassMenuContentClass(light)}
        style={glassMenuSurfaceStyle(light, accentColor)}
      >
        <GlassMenuItem
          light={light}
          accentColor={accentColor}
          label={thread.botConnected ? labels.botConnected : labels.botOff}
          icon={<Bot className="size-3.5" />}
          active={thread.botConnected}
          onClick={() => {
            onToggleBot();
            onClose();
          }}
        />

        <GlassMenuItem
          light={light}
          accentColor={accentColor}
          label={pinned ? labels.unpinThread : labels.pinThread}
          icon={<Pin className={cn('size-3.5', pinned && 'fill-current')} />}
          active={pinned}
          onClick={() => {
            onTogglePin();
            onClose();
          }}
        />

        <GlassMenuItem
          light={light}
          accentColor={accentColor}
          label={thread.isPriority ? labels.priorityOn : labels.priorityOff}
          icon={<Star className={cn('size-3.5', thread.isPriority && 'fill-current')} />}
          active={thread.isPriority}
          onClick={() => {
            onTogglePriority();
            onClose();
          }}
        />

        <GlassMenuItem
          light={light}
          accentColor={accentColor}
          label={labels.export}
          icon={<Download className="size-3.5" />}
          onClick={() => {
            onExport();
            onClose();
          }}
        />

        <div className={menuSeparatorClass(light)} />

        <GlassMenuItem
          light={light}
          accentColor={accentColor}
          label={labels.deleteChat}
          icon={<Trash2 className="size-3.5" />}
          danger
          onClick={() => {
            onDelete();
            onClose();
          }}
        />
      </motion.div>
    </div>,
    document.body,
  );
}

export default function DashboardChatsPage() {
  const { hasHydrated, ownedProfile, locale, dataset, demoMode: demoModeFromHook } =
    useOwnedWorkspaceData();

  const { resolvedTheme } = useTheme();
  const { settings } = useAppearance();
  const searchParams = useBrowserSearchParams();
  const isMobile = useMobile();

  const [mounted, setMounted] = useState(false);
  const demoMode = demoModeFromHook || isDashboardDemoEnabled(searchParams);
  const targetBookingId = searchParams.get('bookingId');
  const targetThreadId = searchParams.get('threadId');
  const demoStorageKey = getDashboardDemoStorageKey('chats');
  const pinnedStorageKey = `${demoStorageKey}:pinned`;

  const publicPageHref = ownedProfile
    ? demoMode
      ? `/demo/${ownedProfile.slug}`
      : `/m/${ownedProfile.slug}`
    : '/demo/demo';

  const [threads, setThreads] = useState<ChatThreadRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [selectedBookingByThreadId, setSelectedBookingByThreadId] = useState<Record<string, string>>({});
  const [segmentFilter, setSegmentFilter] = useState<SegmentFilter>('all');
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('custom');
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [composerFlow, setComposerFlow] = useState<BotFlow | null>(null);
  const [transferDate, setTransferDate] = useState('');
  const [transferTime, setTransferTime] = useState('12:30');
  const [isSending, setIsSending] = useState(false);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);
  const [pinnedThreadIds, setPinnedThreadIds] = useState<string[]>([]);
  const [pinStateHydrated, setPinStateHydrated] = useState(false);
  const [threadContextMenu, setThreadContextMenu] = useState<ThreadContextMenuState | null>(null);
  const [dragState, setDragState] = useState<ThreadDragState | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const suppressCardClickRef = useRef(false);
  const dragOffsetX = useMotionValue(0);
  const dragOffsetY = useMotionValue(0);
  const dragSpringX = useSpring(dragOffsetX, { stiffness: 820, damping: 54, mass: 0.52 });
  const dragSpringY = useSpring(dragOffsetY, { stiffness: 820, damping: 54, mass: 0.52 });
  const dragFrameRef = useRef<number | null>(null);
  const dragOffsetRef = useRef(0);
  const dragOverIndexRef = useRef<number | null>(null);
  const dragThresholdRef = useRef(6);
  const threadsRefreshInFlightRef = useRef(false);
  const desktopMessageScrollRef = useRef<HTMLDivElement | null>(null);
  const mobileMessageScrollRef = useRef<HTMLDivElement | null>(null);
  const messageBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme: ThemeMode = mounted ? (resolvedTheme === 'light' ? 'light' : 'dark') : 'dark';
  const isLight = currentTheme === 'light';
  const accentColor = accentPalette[settings.accentTone].solid;

  const labels =
    locale === 'ru'
      ? {
          title: 'Чаты',
          description:
            'Общайтесь с клиентами, подтверждайте записи и повышайте лояльность.',
          workspaceTitle: 'Диалоги',
          workspaceDescription:
            'Список чатов, переписка, шаблоны и сценарии собраны в одном рабочем блоке.',
          search: 'Поиск по имени, номеру или тексту',
          allThreads: 'Все',
          newThreads: 'Новые',
          activeThreads: 'В работе',
          followupThreads: 'Повтор',
          waitingThreads: 'Ждут ответа',
          scheduledThreads: 'Записи',
          allChannels: 'Канал',
          recentSort: 'Новые',
          prioritySort: 'Приоритет',
          unreadSort: 'Непрочит.',
          demo: 'Демо',
          live: 'Рабочие',
          createThread: 'Новый чат',
          createInline: 'Новый клиент',
          clientName: 'Имя клиента',
          clientPhone: 'Телефон',
          cancel: 'Отмена',
          create: 'Создать',
          botConnected: 'Бот включён',
          botOff: 'Бот выключен',
          priorityOn: 'В приоритете',
          priorityOff: 'Обычный',
          pinThread: 'Закрепить',
          unpinThread: 'Открепить',
          pinned: 'Закреплён',
          dragThread: 'Перетащить чат',
          dropHere: 'Отпустите, чтобы вставить',
          dropEnd: 'Отпустите, чтобы перенести в конец',
          source: 'Источник',
          nextVisit: 'Следующий визит',
          notScheduled: 'Не назначен',
          emptyList: 'Чаты по этому фильтру пока не найдены.',
          emptyListHint: 'Попробуйте другой фильтр или добавьте новый чат.',
          emptyThread: 'Выберите чат',
          emptyThreadHint: 'Откройте диалог, чтобы ответить клиенту.',
          emptyHistory: 'История пока пустая',
          emptyHistoryHint: 'Напишите первое сообщение или используйте быстрый сценарий ниже.',
          template: 'Шаблон',
          messagePlaceholder: 'Сообщение клиенту…',
          clear: 'Очистить',
          send: 'Отправить',
          export: 'Экспорт',
          deleteChat: 'Удалить чат',
          moreActions: 'Ещё',
          confirm: 'Детали записи',
          reschedule: 'Перенос',
          followup: 'Повторный контакт',
          date: 'Дата',
          time: 'Время',
          applyTransfer: 'Подготовить перенос',
          addClientError: 'Нужно заполнить имя и телефон.',
          loadError: 'Не удалось загрузить чаты.',
          sendError: 'Не удалось отправить сообщение.',
          byBot: 'через бот КликБук',
          unread: 'Непрочитано',
          openThread: 'Открыть чат',
          closeCreate: 'Скрыть',
          assistant: 'Ассистент',
          nextStep: 'Следующий шаг',
          quickScenarios: 'Быстрые сценарии',
          quickReschedule: 'Быстрый перенос',
          clientCard: 'Карточка клиента',
          newSlot: 'Новый слот',
          sort: 'Сортировка',
          filters: 'Фильтры',
          details: 'Детали',
          metricsNew: 'Новые сообщения',
          metricsWaiting: 'Ожидают ответа',
          metricsAnswered: 'Отвечено сегодня',
          metricsAverage: 'Среднее время ответа',
          metricTrendUp: 'к вчера',
          metricTrendDown: 'к вчера',
          history: 'История посещений',
          notes: 'Заметки',
          quickActions: 'Быстрые действия',
          openProfile: 'Открыть профиль',
          changeBooking: 'Изменить запись',
          sendReminder: 'Отправить напоминание',
          sendOffer: 'Отправить акцию',
          archiveThread: 'Перевести в архив',
          rescheduleAlert: 'Клиент хочет перенос',
          rescheduleAlertText: 'Слот освобождён. Подберите новое время и ответьте клиенту в этом чате.',
          rescheduleAlertShort: 'Перенос',
        }
      : {
          title: 'Chats',
          description: 'Talk to clients, confirm bookings, and increase loyalty.',
          workspaceTitle: 'Dialogues',
          workspaceDescription:
            'Thread list, replies, templates, and scenarios live in one workspace.',
          search: 'Search by name, phone, or message',
          allThreads: 'All',
          newThreads: 'New',
          activeThreads: 'Active',
          followupThreads: 'Repeat',
          waitingThreads: 'Waiting',
          scheduledThreads: 'Bookings',
          allChannels: 'Channel',
          recentSort: 'Newest',
          prioritySort: 'Priority',
          unreadSort: 'Unread',
          demo: 'Demo',
          live: 'Live',
          createThread: 'New chat',
          createInline: 'New client',
          clientName: 'Client name',
          clientPhone: 'Phone',
          cancel: 'Cancel',
          create: 'Create',
          botConnected: 'Bot on',
          botOff: 'Bot off',
          priorityOn: 'Priority',
          priorityOff: 'Standard',
          pinThread: 'Pin',
          unpinThread: 'Unpin',
          pinned: 'Pinned',
          dragThread: 'Drag chat',
          dropHere: 'Release to place',
          dropEnd: 'Drop to move to the end',
          source: 'Source',
          nextVisit: 'Next visit',
          notScheduled: 'Not scheduled',
          emptyList: 'No chats match this filter yet.',
          emptyListHint: 'Try another filter or add a new chat.',
          emptyThread: 'Choose a chat',
          emptyThreadHint: 'Open a thread to reply.',
          emptyHistory: 'No messages yet',
          emptyHistoryHint: 'Write the first message or use a quick scenario below.',
          template: 'Template',
          messagePlaceholder: 'Message to the client…',
          clear: 'Clear',
          send: 'Send',
          export: 'Export',
          deleteChat: 'Delete chat',
          moreActions: 'More',
          confirm: 'Confirm',
          reschedule: 'Reschedule',
          followup: 'Follow-up',
          date: 'Date',
          time: 'Time',
          applyTransfer: 'Prepare reschedule',
          addClientError: 'Client name and phone are required.',
          loadError: 'Could not load chats.',
          sendError: 'Could not send the message.',
          byBot: 'via ClickBook bot',
          unread: 'Unread',
          openThread: 'Open chat',
          closeCreate: 'Hide',
          assistant: 'Assistant',
          nextStep: 'Next step',
          quickScenarios: 'Quick scenarios',
          quickReschedule: 'Quick reschedule',
          clientCard: 'Client card',
          newSlot: 'New slot',
          sort: 'Sort',
          filters: 'Filters',
          details: 'Details',
          metricsNew: 'New messages',
          metricsWaiting: 'Waiting',
          metricsAnswered: 'Answered today',
          metricsAverage: 'Average response time',
          metricTrendUp: 'vs yesterday',
          metricTrendDown: 'vs yesterday',
          history: 'Visit history',
          notes: 'Notes',
          quickActions: 'Quick actions',
          openProfile: 'Open profile',
          changeBooking: 'Change booking',
          sendReminder: 'Send reminder',
          sendOffer: 'Send offer',
          archiveThread: 'Archive thread',
          rescheduleAlert: 'Client wants to reschedule',
          rescheduleAlertText: 'The slot is released. Pick a new time and reply in this chat.',
          rescheduleAlertShort: 'Reschedule',
        };

  const templateOptions = useMemo(() => dataset?.templates ?? [], [dataset?.templates]);
  const pinnedSet = useMemo(() => new Set(pinnedThreadIds), [pinnedThreadIds]);

  const activeThread = useMemo(() => {
    return threads.find((item) => item.id === activeThreadId) ?? null;
  }, [activeThreadId, threads]);

  useEffect(() => {
    if ((!targetBookingId && !targetThreadId) || threads.length === 0) return;

    const targetThread = threads.find((thread) => {
      if (targetThreadId && thread.id === targetThreadId) return true;

      const bookingId = typeof thread.metadata?.bookingId === 'string' ? thread.metadata.bookingId : null;
      const bookingIds = Array.isArray(thread.metadata?.bookingIds)
        ? thread.metadata.bookingIds.filter((item): item is string => typeof item === 'string')
        : [];

      return (
        bookingId === targetBookingId ||
        (targetBookingId ? bookingIds.includes(targetBookingId) : false) ||
        (targetBookingId ? thread.id === `booking-thread-${targetBookingId}` : false)
      );
    });

    if (targetThread) {
      if (targetThread.id !== activeThreadId) {
        setActiveThreadId(targetThread.id);
      }

      if (targetBookingId) {
        setSelectedBookingByThreadId((current) => ({ ...current, [targetThread.id]: targetBookingId }));
      }
    }
  }, [activeThreadId, targetBookingId, targetThreadId, threads]);

  const activeMessageSignature = useMemo(() => {
    if (!activeThread) return 'empty';

    const lastMessage = activeThread.messages.at(-1);

    return [
      activeThread.id,
      activeThread.messages.length,
      lastMessage?.id ?? '',
      lastMessage?.createdAt ?? '',
      lastMessage?.deliveryState ?? '',
    ].join(':');
  }, [activeThread]);

  const getActiveMessageScrollNode = useCallback(() => {
    if (isMobile && mobileThreadOpen) {
      return mobileMessageScrollRef.current;
    }

    return desktopMessageScrollRef.current;
  }, [isMobile, mobileThreadOpen]);

  const scrollMessagesToBottom = useCallback(
    (behavior: ScrollBehavior = 'auto') => {
      if (typeof window === 'undefined') return;

      const scrollNode = getActiveMessageScrollNode();
      if (!scrollNode) return;

      const run = () => {
        scrollNode.scrollTop = scrollNode.scrollHeight;
        messageBottomRef.current?.scrollIntoView({ block: 'end', behavior });
      };

      run();
      window.requestAnimationFrame(run);
      window.requestAnimationFrame(() => window.setTimeout(run, 0));
    },
    [getActiveMessageScrollNode],
  );

  useEffect(() => {
    scrollMessagesToBottom('auto');
  }, [activeMessageSignature, activeThreadId, isMobile, mobileThreadOpen, scrollMessagesToBottom]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const scrollNode = getActiveMessageScrollNode();
    if (!scrollNode) return;

    scrollMessagesToBottom('auto');

    const resizeObserver = new ResizeObserver(() => {
      scrollMessagesToBottom('auto');
    });

    resizeObserver.observe(scrollNode);

    if (scrollNode.firstElementChild instanceof HTMLElement) {
      resizeObserver.observe(scrollNode.firstElementChild);
    }

    const mutationObserver = new MutationObserver(() => {
      scrollMessagesToBottom('auto');
    });

    mutationObserver.observe(scrollNode, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [activeMessageSignature, getActiveMessageScrollNode, scrollMessagesToBottom]);

  const contextThreadRaw = useMemo(() => {
    if (!threadContextMenu) return null;
    return threads.find((thread) => thread.id === threadContextMenu.threadId) ?? null;
  }, [threadContextMenu, threads]);

  const contextThread = useMemo(() => {
    if (!contextThreadRaw) return null;

    return {
      ...contextThreadRaw,
      __pinned: pinnedSet.has(contextThreadRaw.id),
    } as ChatThreadRecord & { __pinned?: boolean };
  }, [contextThreadRaw, pinnedSet]);

  const isThreadPinned = useCallback(
    (threadId: string) => pinnedSet.has(threadId),
    [pinnedSet],
  );

  const toggleThreadPin = useCallback((threadId: string) => {
    setPinnedThreadIds((current) =>
      current.includes(threadId)
        ? current.filter((item) => item !== threadId)
        : [threadId, ...current],
    );
  }, []);

  useEffect(() => {
    if (!hasHydrated || typeof window === 'undefined') return;

    setPinStateHydrated(false);

    try {
      const raw = window.localStorage.getItem(pinnedStorageKey);
      const parsed = raw ? (JSON.parse(raw) as unknown) : [];

      if (Array.isArray(parsed)) {
        setPinnedThreadIds(parsed.filter((item): item is string => typeof item === 'string'));
      } else {
        setPinnedThreadIds([]);
      }
    } catch {
      setPinnedThreadIds([]);
    } finally {
      setPinStateHydrated(true);
    }
  }, [hasHydrated, pinnedStorageKey]);

  useEffect(() => {
    if (!hasHydrated || !pinStateHydrated || typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(pinnedStorageKey, JSON.stringify(pinnedThreadIds));
    } catch {}
  }, [hasHydrated, pinStateHydrated, pinnedStorageKey, pinnedThreadIds]);

  const refreshThreads = useCallback(
    async ({ background = false }: { background?: boolean } = {}) => {
      if (!hasHydrated || threadsRefreshInFlightRef.current) return;

      if (demoMode) {
        const fallback = getDashboardDemoChatThreads(locale);

        try {
          const raw = typeof window !== 'undefined' ? window.localStorage.getItem(demoStorageKey) : null;
          const next = raw ? (JSON.parse(raw) as ChatThreadRecord[]) : fallback;

          setThreads((current) =>
            background ? mergeThreadSnapshots(current, next, sortMode) : sortThreads(next, 'recent'),
          );
          setActiveThreadId((current) => current ?? next[0]?.id ?? null);
          setError(null);
          setIsLoading(false);
        } catch {
          setThreads((current) =>
            background ? mergeThreadSnapshots(current, fallback, sortMode) : sortThreads(fallback, 'recent'),
          );
          setActiveThreadId((current) => current ?? fallback[0]?.id ?? null);
          setError(null);
          setIsLoading(false);
        }

        return;
      }

      if (!ownedProfile) {
        setThreads([]);
        setActiveThreadId(null);
        setIsLoading(false);
        return;
      }

      threadsRefreshInFlightRef.current = true;

      if (!background) {
        setIsLoading(true);
      }

      try {
        const response = await fetch('/api/chats', {
          credentials: 'include',
          cache: 'no-store',
          headers: getTelegramHeaderRecord(),
        });

        if (!response.ok) {
          throw new Error('chat_fetch_failed');
        }

        const payload = (await response.json()) as ChatThreadListResponse;
        const nextThreads = mergeThreadsByClientForUi(payload.threads ?? []);

        setThreads((current) =>
          background
            ? mergeThreadSnapshots(current, nextThreads, sortMode)
            : sortThreads(nextThreads, 'recent'),
        );
        setActiveThreadId((current) => current ?? nextThreads[0]?.id ?? null);
        setError(null);
      } catch {
        if (!background) {
          setError(labels.loadError);
        }
      } finally {
        threadsRefreshInFlightRef.current = false;
        if (!background) {
          setIsLoading(false);
        }
      }
    },
    [demoMode, demoStorageKey, hasHydrated, labels.loadError, locale, ownedProfile, sortMode],
  );

  useEffect(() => {
    void refreshThreads();
  }, [refreshThreads]);

  useEffect(() => {
    if (!hasHydrated || !ownedProfile || demoMode || typeof window === 'undefined') return;

    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      void refreshThreads({ background: true });
    };

    const intervalId = window.setInterval(tick, 4000);
    window.addEventListener('focus', tick);
    document.addEventListener('visibilitychange', tick);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', tick);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [demoMode, hasHydrated, ownedProfile, refreshThreads]);

  useEffect(() => {
    if (!demoMode || !hasHydrated) return;

    try {
      window.localStorage.setItem(demoStorageKey, JSON.stringify(threads));
    } catch {}
  }, [demoMode, demoStorageKey, hasHydrated, threads]);

  useEffect(() => {
    if (!threads.length) {
      setActiveThreadId(null);
      return;
    }

    if (!activeThreadId || !threads.some((item) => item.id === activeThreadId)) {
      setActiveThreadId(threads[0].id);
    }
  }, [activeThreadId, threads]);

  const applyLocalThreadPatch = async (threadId: string, patch: Partial<ChatThreadRecord>) => {
    setThreads((current) =>
      replaceThread(current, threadId, (thread) => ({
        ...thread,
        ...patch,
        updatedAt: new Date().toISOString(),
      })),
    );

    if (demoMode) return;

    await fetch('/api/chats', {
      method: 'PATCH',
      credentials: 'include',
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...getTelegramHeaderRecord(),
      },
      body: JSON.stringify({
        threadId,
        patch,
      }),
    }).catch(() => undefined);
  };

  const handleDeleteThread = useCallback(
    (threadId: string) => {
      const nextThreads = threads.filter((thread) => thread.id !== threadId);

      setThreads(nextThreads);
      setPinnedThreadIds((current) => current.filter((item) => item !== threadId));

      if (activeThreadId === threadId) {
        setActiveThreadId(nextThreads[0]?.id ?? null);
      }

      if (threadContextMenu?.threadId === threadId) {
        setThreadContextMenu(null);
      }

      if (isMobile && activeThreadId === threadId) {
        setMobileThreadOpen(false);
      }

      if (!demoMode) {
        fetch('/api/chats', {
          method: 'DELETE',
          credentials: 'include',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            ...getTelegramHeaderRecord(),
          },
          body: JSON.stringify({ threadId }),
        }).catch(() => undefined);
      }
    },
    [activeThreadId, demoMode, isMobile, threadContextMenu?.threadId, threads],
  );

  const filteredThreads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const next = threads.filter((thread) => {
      if (segmentFilter === 'waiting' && !threadNeedsReply(thread)) return false;
      if (segmentFilter === 'scheduled' && !threadHasBooking(thread)) return false;
      if (
        segmentFilter !== 'all' &&
        segmentFilter !== 'waiting' &&
        segmentFilter !== 'scheduled' &&
        thread.segment !== segmentFilter
      ) {
        return false;
      }
      if (channelFilter !== 'all' && thread.channel !== channelFilter) return false;
      if (!normalizedQuery) return true;

      return [
        thread.clientName,
        thread.clientPhone,
        thread.lastMessagePreview ?? '',
        ...thread.messages.map((message) => message.body),
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery);
    });

    return sortThreads(next, sortMode, pinnedThreadIds);
  }, [channelFilter, pinnedThreadIds, query, segmentFilter, sortMode, threads]);

  const relatedThreadsByClientKey = useMemo(() => {
    const map = new Map<string, ChatThreadRecord[]>();

    threads.forEach((thread) => {
      const key = getThreadClientKey(thread);
      if (!key) return;
      const list = map.get(key) ?? [];
      list.push(thread);
      map.set(key, list);
    });

    map.forEach((items, key) => {
      map.set(key, sortThreads(items, 'recent'));
    });

    return map;
  }, [threads]);

  const activeRelatedThreads = useMemo(() => {
    if (!activeThread) return [] as ChatThreadRecord[];
    return relatedThreadsByClientKey.get(getThreadClientKey(activeThread)) ?? [];
  }, [activeThread, relatedThreadsByClientKey]);


  const activeBookingContexts = useMemo(() => getThreadBookingContexts(activeThread), [activeThread]);

  const selectedBookingId = useMemo(() => {
    if (!activeThread) return null;
    const selected = selectedBookingByThreadId[activeThread.id];
    if (selected && activeBookingContexts.some((context) => context.id === selected)) return selected;
    return activeBookingContexts[0]?.id ?? (typeof activeThread.metadata?.bookingId === 'string' ? activeThread.metadata.bookingId : null);
  }, [activeBookingContexts, activeThread, selectedBookingByThreadId]);

  const selectedBookingContext = useMemo(() => {
    if (!selectedBookingId) return activeBookingContexts[0] ?? null;
    return activeBookingContexts.find((context) => context.id === selectedBookingId) ?? activeBookingContexts[0] ?? null;
  }, [activeBookingContexts, selectedBookingId]);

  const chatMetrics = useMemo(() => {
    const today = toLocalIsoDate(new Date());
    const unreadMessages = threads.reduce((sum, thread) => sum + thread.unreadCount, 0);
    const waitingThreads = threads.filter((thread) => thread.unreadCount > 0 || thread.segment === 'new').length;
    const answeredToday = threads.reduce(
      (sum, thread) =>
        sum +
        thread.messages.filter(
          (message) =>
            (message.author === 'master' || message.author === 'system') &&
            message.createdAt.slice(0, 10) === today,
        ).length,
      0,
    );

    return {
      unreadMessages,
      waitingThreads,
      answeredToday,
      averageResponse: waitingThreads > 0 ? '4 мин' : '2 мин',
    };
  }, [threads]);

  const segmentCounts = useMemo(
    () => ({
      all: threads.length,
      new: threads.filter((thread) => thread.segment === 'new').length,
      waiting: threads.filter(threadNeedsReply).length,
      scheduled: threads.filter(threadHasBooking).length,
      active: threads.filter((thread) => thread.segment === 'active').length,
      followup: threads.filter((thread) => thread.segment === 'followup').length,
    }),
    [threads],
  );


  const setThreadItemRef = useMemo(
    () => (id: string) => (node: HTMLDivElement | null) => {
      itemRefs.current[id] = node;
    },
    [],
  );

  const draggedId = dragState?.active ? dragState.id : null;
  const draggedThread = draggedId
    ? filteredThreads.find((thread) => thread.id === draggedId) ??
      threads.find((thread) => thread.id === draggedId) ??
      null
    : null;

  const getDropIndexFromPoint = useCallback(
    (clientY: number, draggedThreadId: string) => {
      const visibleItems = filteredThreads
        .map((thread, index) => ({
          thread,
          index,
          node: itemRefs.current[thread.id],
        }))
        .filter((item) => item.node && item.thread.id !== draggedThreadId);

      if (!visibleItems.length) return 0;

      for (const item of visibleItems) {
        const bounds = item.node!.getBoundingClientRect();

        if (clientY < bounds.top + bounds.height / 2) {
          return item.index;
        }
      }

      return filteredThreads.length;
    },
    [filteredThreads],
  );

  const commitThreadDrop = useCallback(
    (state: ThreadDragState | null, targetIndex: number | null) => {
      if (!state || targetIndex === null) return;

      setThreads((current) => {
        const display = filteredThreads.filter((thread) =>
          current.some((currentThread) => currentThread.id === thread.id),
        );

        const from = display.findIndex((thread) => thread.id === state.id);

        if (from < 0) return current;

        let to = targetIndex;

        if (to > from) {
          to -= 1;
        }

        to = Math.max(0, Math.min(to, display.length - 1));

        if (to === from) return current;

        const reorderedDisplay = arrayMove(display, from, to);
        const visibleIds = new Set(display.map((thread) => thread.id));
        const queue = [...reorderedDisplay];

        return current.map((thread) => {
          if (!visibleIds.has(thread.id)) return thread;
          return queue.shift() ?? thread;
        });
      });

      setSortMode('manual');
    },
    [filteredThreads],
  );

  const beginThreadDrag = (
    event: ReactPointerEvent<HTMLButtonElement>,
    threadId: string,
    index: number,
  ) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    const cardNode = itemRefs.current[threadId];
    const cardRect = cardNode?.getBoundingClientRect();

    if (!cardRect) return;

    event.preventDefault();
    event.stopPropagation();
    suppressCardClickRef.current = false;

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {}

    setActiveThreadId(threadId);
    dragOffsetX.set(0);
    dragOffsetY.set(0);
    dragOffsetRef.current = 0;
    dragOverIndexRef.current = null;
    setDropIndex(null);

    setDragState({
      id: threadId,
      pointerId: event.pointerId,
      startY: event.clientY,
      startX: event.clientX,
      originIndex: index,
      active: false,
      cardRect: {
        top: cardRect.top,
        left: cardRect.left,
        width: cardRect.width,
        height: cardRect.height,
      },
    });
  };

  const flushDragFrame = useCallback(() => {
    if (dragFrameRef.current !== null) {
      window.cancelAnimationFrame(dragFrameRef.current);
      dragFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!dragState) {
      dragOffsetX.set(0);
      dragOffsetY.set(0);
      dragOffsetRef.current = 0;
      dragOverIndexRef.current = null;
      setDropIndex(null);
      flushDragFrame();
      return;
    }

    const previousUserSelect = document.body.style.userSelect;
    const previousTouchAction = document.body.style.touchAction;
    const previousCursor = document.body.style.cursor;

    document.body.style.userSelect = 'none';
    document.body.style.touchAction = dragState.active ? 'none' : previousTouchAction;
    document.body.style.cursor = dragState.active ? 'grabbing' : previousCursor;

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerId !== dragState.pointerId) return;

      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;

      if (!dragState.active) {
        if (
          Math.abs(deltaX) < dragThresholdRef.current &&
          Math.abs(deltaY) < dragThresholdRef.current
        ) {
          return;
        }

        suppressCardClickRef.current = true;
        dragOverIndexRef.current = dragState.originIndex;
        setDropIndex(dragState.originIndex);
        setDragState((current) =>
          current && current.pointerId === dragState.pointerId
            ? { ...current, active: true }
            : current,
        );
        return;
      }

      suppressCardClickRef.current = true;
      dragOffsetX.set(Math.max(-10, Math.min(deltaX * 0.08, 10)));
      dragOffsetRef.current = deltaY;

      if (dragFrameRef.current !== null) return;

      dragFrameRef.current = window.requestAnimationFrame(() => {
        dragFrameRef.current = null;
        dragOffsetY.set(dragOffsetRef.current);

        const nextOverIndex = getDropIndexFromPoint(event.clientY, dragState.id);

        if (dragOverIndexRef.current === nextOverIndex) return;

        dragOverIndexRef.current = nextOverIndex;
        setDropIndex(nextOverIndex);
      });
    };

    const finishDrag = (event: PointerEvent) => {
      if (event.pointerId !== dragState.pointerId) return;

      flushDragFrame();

      if (dragState.active) {
        const targetIndex = dragOverIndexRef.current ?? dragState.originIndex;
        commitThreadDrop(dragState, targetIndex);
      }

      setDragState(null);
      setDropIndex(null);

      window.setTimeout(() => {
        suppressCardClickRef.current = false;
      }, 60);
    };

    const cancelDrag = (event: PointerEvent) => {
      if (event.pointerId !== dragState.pointerId) return;

      flushDragFrame();
      setDragState(null);
      setDropIndex(null);

      window.setTimeout(() => {
        suppressCardClickRef.current = false;
      }, 60);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', finishDrag);
    window.addEventListener('pointercancel', cancelDrag);

    return () => {
      document.body.style.userSelect = previousUserSelect;
      document.body.style.touchAction = previousTouchAction;
      document.body.style.cursor = previousCursor;
      flushDragFrame();
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', finishDrag);
      window.removeEventListener('pointercancel', cancelDrag);
    };
  }, [
    commitThreadDrop,
    dragOffsetX,
    dragOffsetY,
    dragState,
    flushDragFrame,
    getDropIndexFromPoint,
  ]);

  const handleCreateThread = async () => {
    const clientName = newClientName.trim();
    const clientPhone = newClientPhone.trim();

    if (!clientName || !clientPhone) {
      setError(labels.addClientError);
      return;
    }

    const localThread = createLocalThread(locale, clientName, clientPhone);
    setError(null);

    if (demoMode) {
      setThreads((current) => [localThread, ...current]);
      setActiveThreadId(localThread.id);
      setNewClientName('');
      setNewClientPhone('');
      setShowCreatePanel(false);
      return;
    }

    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', ...getTelegramHeaderRecord() },
        body: JSON.stringify({ type: 'thread', clientName, clientPhone, channel: 'Telegram' }),
      });

      if (!response.ok) throw new Error('thread_create_failed');

      const payload = (await response.json()) as { thread?: ChatThreadRecord };
      const nextThread = payload.thread ?? localThread;

      setThreads((current) => [nextThread, ...current]);
      setActiveThreadId(nextThread.id);
      setNewClientName('');
      setNewClientPhone('');
      setShowCreatePanel(false);
    } catch {
      setError(labels.addClientError);
    }
  };

  const handleSendMessage = async () => {
    if (!activeThread || !draft.trim()) return;

    const body = draft.trim();
    const activeComposerFlow = composerFlow;
    const activeTransferDate = transferDate;
    const activeTransferTime = transferTime || '12:30';
    const viaBot = activeComposerFlow !== null;
    const localMessage = createLocalMessage(
      activeThread.id,
      body,
      viaBot ? 'system' : 'master',
      viaBot,
    );

    setIsSending(true);
    setError(null);

    setThreads((current) =>
      replaceThread(current, activeThread.id, (thread) => ({
        ...thread,
        segment: viaBot ? (activeComposerFlow === 'followup' ? 'followup' : 'active') : 'active',
        lastMessagePreview: body,
        lastMessageAt: localMessage.createdAt,
        unreadCount: 0,
        messages: [...thread.messages, localMessage],
        updatedAt: localMessage.createdAt,
      })),
    );

    setDraft('');
    setSelectedTemplateId('custom');
    setComposerFlow(null);

    if (demoMode) {
      setIsSending(false);
      return;
    }

    try {
      const response = await fetch('/api/chats', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', ...getTelegramHeaderRecord() },
        body: JSON.stringify({
          type: 'message',
          threadId: activeThread.id,
          body,
          author: viaBot ? 'system' : 'master',
          deliveryState: 'sent',
          viaBot,
          clientMessageKey: localMessage.id,
          ...(selectedBookingId ? { bookingId: selectedBookingId } : {}),
          ...(activeComposerFlow === 'reschedule' && activeTransferDate
            ? { rescheduleProposal: { date: activeTransferDate, time: activeTransferTime } }
            : {}),
        }),
      });

      if (!response.ok) throw new Error('send_failed');
    } catch {
      setError(labels.sendError);
    } finally {
      setIsSending(false);
    }
  };

  const handleComposerKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;

    event.preventDefault();

    if (!activeThread || !draft.trim() || isSending) return;
    void handleSendMessage();
  };

  const handleApplyBotFlow = (flow: BotFlow) => {
    if (!activeThread) return;

    const nextVisit =
      flow === 'reschedule' && transferDate
        ? `${transferDate}${transferTime ? ` ${transferTime}` : ''}`
        : activeThread.nextVisit ?? undefined;

    setComposerFlow(flow);
    setDraft(buildBotDraft(flow, activeThread, locale, nextVisit));
  };

  const handleApplyTransfer = () => {
    if (!activeThread || !transferDate) return;

    const nextVisit = `${transferDate} ${transferTime}`.trim();
    const nextVisitIso = `${transferDate}T${transferTime || '12:30'}:00`;

    void applyLocalThreadPatch(activeThread.id, {
      nextVisit: nextVisitIso,
      segment: 'active',
    });

    setComposerFlow('reschedule');
    setDraft(buildBotDraft('reschedule', activeThread, locale, nextVisit));
  };

  const handleTemplateChange = (value: string) => {
    setSelectedTemplateId(value);

    if (value === 'custom') return;

    const selectedTemplate = templateOptions.find((item) => item.id === value);
    if (!selectedTemplate) return;

    setComposerFlow(null);
    setDraft(fillTemplateContent(selectedTemplate.content, activeThread, locale, publicPageHref));
  };

  const quickTransferPresets = useMemo(
    () => [
      { id: 'today', label: locale === 'ru' ? 'Сегодня' : 'Today', date: addDaysIso(0), time: '12:30' },
      { id: 'tomorrow', label: locale === 'ru' ? 'Завтра' : 'Tomorrow', date: addDaysIso(1), time: '13:00' },
      { id: 'plus-two', label: locale === 'ru' ? 'Через 2 дня' : 'In 2 days', date: addDaysIso(2), time: '15:30' },
    ],
    [locale],
  );

  useEffect(() => {
    if (composerFlow !== 'reschedule' || transferDate) return;

    const fallbackPreset = quickTransferPresets[0];
    if (!fallbackPreset) return;

    setTransferDate(fallbackPreset.date);
    setTransferTime(fallbackPreset.time);
  }, [composerFlow, quickTransferPresets, transferDate]);

  useEffect(() => {
    if (composerFlow !== 'reschedule' || !activeThread || !transferDate) return;

    const nextVisit = `${transferDate}${transferTime ? ` ${transferTime}` : ''}`.trim();
    setDraft(buildBotDraft('reschedule', activeThread, locale, nextVisit));
  }, [activeThread, composerFlow, locale, transferDate, transferTime]);

  const assistantSlots = useMemo(() => {
    const nextDate = activeThread?.nextVisit ? activeThread.nextVisit.slice(0, 10) : addDaysIso(1);
    const altDate = addDaysIso(2);

    return [
      { id: 'slot-1', date: nextDate, time: '12:30' },
      { id: 'slot-2', date: nextDate, time: '15:00' },
      { id: 'slot-3', date: altDate, time: '18:00' },
    ];
  }, [activeThread?.nextVisit]);

  const quickReplyChips = useMemo(
    () => [
      {
        id: 'hello',
        label: locale === 'ru' ? 'Здравствуйте!' : 'Hello',
        body:
          locale === 'ru'
            ? `Здравствуйте, ${activeThread?.clientName ?? ''}!`
            : `Hello ${activeThread?.clientName ?? ''}!`,
      },
      {
        id: 'thanks',
        label: locale === 'ru' ? 'Спасибо за обращение' : 'Thanks',
        body:
          locale === 'ru'
            ? 'Спасибо за обращение! Сейчас подберу для вас удобное окно.'
            : 'Thanks for reaching out. I will find a convenient time for you.',
      },
      {
        id: 'see-you',
        label: locale === 'ru' ? 'До встречи' : 'See you',
        body:
          locale === 'ru'
            ? 'До встречи! Если планы поменяются, просто напишите в этот чат.'
            : 'See you! If anything changes, just reply in this chat.',
      },
      {
        id: 'clarify',
        label: locale === 'ru' ? 'Уточним и напишем' : 'Will clarify',
        body:
          locale === 'ru'
            ? 'Уточню расписание и напишу вам ближайшие варианты.'
            : 'I will check the schedule and send the nearest options.',
      },
    ],
    [activeThread?.clientName, locale],
  );

  const metricCards = [
    {
      id: 'new',
      label: labels.metricsNew,
      value: String(chatMetrics.unreadMessages),
      hint: `+33% ${labels.metricTrendUp}`,
      tone: 'peach',
      icon: MessageCircle,
      spark: [3, 5, 4, 7, 6, 9, 8, chatMetrics.unreadMessages || 8],
    },
    {
      id: 'waiting',
      label: labels.metricsWaiting,
      value: String(chatMetrics.waitingThreads),
      hint: `+25% ${labels.metricTrendUp}`,
      tone: 'violet',
      icon: MessageSquareQuote,
      spark: [2, 3, 4, 4, 5, 5, 6, chatMetrics.waitingThreads || 6],
    },
    {
      id: 'answered',
      label: labels.metricsAnswered,
      value: String(chatMetrics.answeredToday || threads.length),
      hint: `+18% ${labels.metricTrendUp}`,
      tone: 'green',
      icon: CheckCheck,
      spark: [8, 10, 12, 11, 14, 16, 18, chatMetrics.answeredToday || threads.length || 18],
    },
    {
      id: 'average',
      label: labels.metricsAverage,
      value: locale === 'ru' ? chatMetrics.averageResponse : chatMetrics.averageResponse.replace('мин', 'min'),
      hint: `-1 ${locale === 'ru' ? 'мин' : 'min'} ${labels.metricTrendDown}`,
      tone: 'sand',
      icon: Clock3,
      spark: [7, 6, 6, 5, 5, 4, 4, 3],
    },
  ];

  const channelLabel = (value: ChatThreadRecord['channel']) => {
    if (locale !== 'ru') return value;
    if (value === 'Telegram') return 'ТГ';
    if (value === 'Instagram') return 'Инстаграм';
    if (value === 'VK') return 'ВК';
    if (value === 'Web') return 'Web';
    return value;
  };

  const handleExportThreadById = (threadId: string) => {
    const thread = threads.find((item) => item.id === threadId);
    if (!thread || typeof window === 'undefined') return;

    const safeName =
      thread.clientName
        .trim()
        .toLowerCase()
        .replace(/[^a-zа-я0-9]+/gi, '-')
        .replace(/^-+|-+$/g, '') || 'thread';

    const lines =
      locale === 'ru'
        ? [
            `Клиент: ${thread.clientName}`,
            `Телефон: ${thread.clientPhone}`,
            `Канал: ${channelLabel(thread.channel)}`,
            `Источник: ${thread.source || '—'}`,
            `Следующий визит: ${
              thread.nextVisit ? formatDateLabel(thread.nextVisit, locale) : labels.notScheduled
            }`,
            '',
            ...thread.messages.map((message) => {
              const author =
                message.author === 'client'
                  ? thread.clientName
                  : message.author === 'system'
                    ? 'Бот'
                    : 'Мастер';

              return `[${formatLongDateLabel(message.createdAt, locale)} ${formatTimeLabel(
                message.createdAt,
                locale,
              )}] ${author}: ${message.body}`;
            }),
          ]
        : [
            `Client: ${thread.clientName}`,
            `Phone: ${thread.clientPhone}`,
            `Channel: ${channelLabel(thread.channel)}`,
            `Source: ${thread.source || '—'}`,
            `Next visit: ${
              thread.nextVisit ? formatDateLabel(thread.nextVisit, locale) : labels.notScheduled
            }`,
            '',
            ...thread.messages.map((message) => {
              const author =
                message.author === 'client'
                  ? thread.clientName
                  : message.author === 'system'
                    ? 'Bot'
                    : 'Master';

              return `[${formatLongDateLabel(message.createdAt, locale)} ${formatTimeLabel(
                message.createdAt,
                locale,
              )}] ${author}: ${message.body}`;
            }),
          ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `chat-${safeName}-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();

    window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
  };

  const handleExportThread = () => {
    if (!activeThread) return;
    handleExportThreadById(activeThread.id);
  };

  const assistantSummary = useMemo(() => {
    if (!activeThread) {
      return locale === 'ru'
        ? { title: 'Выберите чат', detail: 'Ассистент покажет следующий шаг, быстрые ответы и перенос.' }
        : { title: 'Choose a chat', detail: 'The assistant will suggest the next step, quick replies, and reschedule slots.' };
    }

    if (activeThread.unreadCount > 0) {
      return locale === 'ru'
        ? { title: 'Нужно ответить клиенту', detail: 'Сначала ответьте на вопрос клиента, затем предложите подтверждение или другое время.' }
        : { title: 'Reply to the client', detail: 'Answer the incoming question first, then offer a confirmation or reschedule.' };
    }

    if (activeThread.segment === 'new') {
      return locale === 'ru'
        ? { title: 'Помогите завершить запись', detail: 'Короткий ответ и один понятный следующий шаг помогают быстрее получить подтверждение.' }
        : { title: 'Guide the chat to confirmation', detail: 'A short confirmation with one clear next step works best here.' };
    }

    if (activeThread.segment === 'followup') {
      return locale === 'ru'
        ? { title: 'Верните клиента в запись', detail: 'Покажите два ближайших окна и отправьте напоминание.' }
        : { title: 'Bring the client back', detail: 'Show two nearest slots and keep the post-visit message short.' };
    }

    return locale === 'ru'
      ? { title: 'Диалог под контролем', detail: 'Можно отправить детали записи, уточнить время или быстро предложить новое окно.' }
      : { title: 'The chat is under control', detail: 'You can send booking details, clarify the time, or prepare a reschedule.' };
  }, [activeThread, locale]);

  const applyQuickTransfer = (date: string, time: string) => {
    setTransferDate(date);
    setTransferTime(time);
    setComposerFlow('reschedule');

    if (!activeThread) return;

    const nextVisit = `${date} ${time}`.trim();
    setDraft(buildBotDraft('reschedule', activeThread, locale, nextVisit));
  };

  const handleAssistantScenario = (kind: 'confirm' | 'clarify' | 'slots') => {
    if (!activeThread) return;

    if (kind === 'confirm') {
      handleApplyBotFlow('confirm');
      return;
    }

    if (kind === 'clarify') {
      setComposerFlow(null);
      setDraft(
        locale === 'ru'
          ? `Здравствуйте, ${activeThread.clientName}! Подскажите, пожалуйста, какое время вам сейчас удобнее: первая половина дня или ближе к вечеру?`
          : `Hi ${activeThread.clientName}! Please let me know which time works better for you right now: earlier in the day or closer to the evening?`,
      );
      return;
    }

    setComposerFlow('followup');
    setDraft(
      locale === 'ru'
        ? `Здравствуйте, ${activeThread.clientName}! Могу предложить ближайшие окна: ${assistantSlots
            .slice(0, 2)
            .map((slot) => `${formatPickerDateLabel(slot.date, locale)}, ${slot.time}`)
            .join(' или ')}. Какой вариант вам удобнее?`
        : `Hi ${activeThread.clientName}! I can offer the nearest slots: ${assistantSlots
            .slice(0, 2)
            .map((slot) => `${formatPickerDateLabel(slot.date, locale)}, ${slot.time}`)
            .join(' or ')}. Which option works better for you?`,
    );
  };

  const handleSelectThread = (thread: ChatThreadRecord) => {
    if (suppressCardClickRef.current) {
      suppressCardClickRef.current = false;
      return;
    }

    setActiveThreadId(thread.id);

    const contexts = getThreadBookingContexts(thread);
    if (contexts.length && !selectedBookingByThreadId[thread.id]) {
      setSelectedBookingByThreadId((current) => ({ ...current, [thread.id]: contexts[0].id }));
    }

    if (typeof window !== 'undefined' && window.location.search) {
      const currentUrl = new URL(window.location.href);
      if (currentUrl.searchParams.has('bookingId') || currentUrl.searchParams.has('threadId')) {
        currentUrl.searchParams.delete('bookingId');
        currentUrl.searchParams.delete('threadId');
        window.history.replaceState({}, '', `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
      }
    }

    if (thread.unreadCount > 0) {
      void applyLocalThreadPatch(thread.id, { unreadCount: 0 });
    }

    if (isMobile) {
      setMobileThreadOpen(true);
    }
  };

  useEffect(() => {
    if (!isMobile) {
      setMobileThreadOpen(false);
      return;
    }

    if (!mobileThreadOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previous;
    };
  }, [isMobile, mobileThreadOpen]);

  const segmentOptions = [
    { value: 'all', label: labels.allThreads, shortLabel: labels.allThreads, count: segmentCounts.all },
    { value: 'new', label: labels.newThreads, shortLabel: labels.newThreads, count: segmentCounts.new },
    { value: 'waiting', label: labels.waitingThreads, shortLabel: locale === 'ru' ? 'Ждут' : 'Waiting', count: segmentCounts.waiting },
    { value: 'scheduled', label: labels.scheduledThreads, shortLabel: labels.scheduledThreads, count: segmentCounts.scheduled },
    { value: 'followup', label: labels.followupThreads, shortLabel: locale === 'ru' ? 'Повт.' : 'Repeat', count: segmentCounts.followup },
  ] as const;

  const channelOptions = [
    { value: 'all', label: labels.allChannels },
    { value: 'Web', label: 'Web' },
    { value: 'Telegram', label: locale === 'ru' ? 'ТГ' : 'Telegram' },
    { value: 'Instagram', label: locale === 'ru' ? 'Инстаграм' : 'Instagram' },
    { value: 'VK', label: locale === 'ru' ? 'ВК' : 'VK' },
  ] as const;

  const sortOptions = [
    { value: 'recent', label: labels.recentSort, shortLabel: labels.recentSort },
    { value: 'unread', label: labels.unreadSort, shortLabel: locale === 'ru' ? 'Непр.' : 'Unread' },
    { value: 'priority', label: labels.prioritySort, shortLabel: locale === 'ru' ? 'Приор.' : 'Priority' },
  ] as const;

  const handleThreadKeyboardSelect = (
    event: ReactKeyboardEvent<HTMLDivElement>,
    thread: ChatThreadRecord,
  ) => {
    if (event.target !== event.currentTarget) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelectThread(thread);
    }
  };

  if (!hasHydrated || !mounted) {
    return null;
  }

  const renderThreadCard = (
    thread: ChatThreadRecord,
    index: number,
    options?: {
      mobile?: boolean;
      dragging?: boolean;
      preview?: boolean;
    },
  ) => {
    const mobile = Boolean(options?.mobile);
    const preview = Boolean(options?.preview);
    const active = thread.id === activeThreadId;
    const pinned = isThreadPinned(thread.id);
    const activeAlert = getThreadActiveAlert(thread);
    const bookingContextCount = getThreadBookingContexts(thread).length;
    const canDrag = !mobile && filteredThreads.length > 1 && !preview;
    const contextLine = getThreadContextLine(thread, locale);
    const serviceLabel = getThreadServiceLabel(thread);
    const bookingCode = getThreadBookingCode(thread);
    const detailLine = `${bookingCode ? `${bookingCode} · ` : ''}${serviceLabel ?? contextLine ?? (locale === 'ru' ? 'Запись' : 'Booking')}`;
    const timeLine = [formatDateLabel(thread.lastMessageAt, locale), formatTimeLabel(thread.lastMessageAt, locale)]
      .filter(Boolean)
      .join(' · ');
    const needsReply = threadNeedsReply(thread);
    const hasBooking = threadHasBooking(thread);
    const hasFailedDelivery = threadHasFailedDelivery(thread);
    const statusLabel = hasFailedDelivery
      ? locale === 'ru'
        ? 'Ошибка'
        : 'Failed'
      : needsReply
        ? labels.waitingThreads
        : hasBooking
          ? labels.scheduledThreads
          : segmentBadgeLabel(thread.segment, locale);

    return (
      <div
        ref={preview ? undefined : setThreadItemRef(thread.id)}
        role={preview ? undefined : 'button'}
        tabIndex={preview ? undefined : 0}
        onClick={preview ? undefined : () => handleSelectThread(thread)}
        onKeyDown={preview ? undefined : (event) => handleThreadKeyboardSelect(event, thread)}
        onContextMenu={
          preview
            ? undefined
            : (event) => {
                event.preventDefault();
                event.stopPropagation();

                setActiveThreadId(thread.id);
                setThreadContextMenu({
                  threadId: thread.id,
                  x: event.clientX,
                  y: event.clientY,
                });
              }
        }
        className={cn(
          'group relative w-full overflow-hidden rounded-[15px] border text-left outline-none transition-[background,border-color,box-shadow,opacity,transform,filter] duration-150',
          mobile ? 'px-3 py-2.5' : 'px-2.5 py-2.5',
          active
            ? isLight
              ? 'border-[#ffd5c2] bg-[#fff1e8] shadow-[0_12px_28px_rgba(213,118,73,0.12)]'
              : 'border-white/[0.12] bg-white/[0.055]'
            : isLight
              ? 'border-[#f0e5db] bg-white hover:border-[#ead6c9] hover:bg-[#fffaf6]'
              : 'border-white/[0.07] bg-black/20 hover:border-white/[0.11] hover:bg-white/[0.04]',
          pinned && (isLight ? 'bg-white' : 'bg-white/[0.052]'),
          activeAlert && !active && warningTone(isLight),
        )}
        aria-label={labels.openThread}
      >
        {active ? (
          <span
            className="absolute bottom-3 left-0 top-3 w-[3px] rounded-r-full"
            style={{ background: '#ff8a5c' }}
          />
        ) : null}

        <div className="flex items-start gap-2.5">
          {canDrag ? (
            <button
              type="button"
              title={labels.dragThread}
              aria-label={labels.dragThread}
              className={cn(
                buttonBase(isLight),
                'mt-1 size-7 cursor-grab px-0 opacity-0 transition-opacity group-hover:opacity-80 active:cursor-grabbing',
              )}
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => beginThreadDrag(event, thread.id, index)}
            >
              <GripVertical className="size-3" />
            </button>
          ) : null}

          <span className="relative shrink-0">
            <ClientAvatar name={thread.clientName} size={mobile ? 'sm' : 'md'} />
            <span
              className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full border-2 border-white"
              style={{ background: channelColor(thread.channel) }}
            />

            {thread.unreadCount > 0 ? (
              <span
                className="absolute -right-1.5 -top-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold text-white"
                style={{ background: '#8b5cf6' }}
              >
                {thread.unreadCount}
              </span>
            ) : null}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-1.5">
                  <div className={cn('truncate text-[13px] font-semibold leading-5', pageText(isLight))}>
                    {thread.clientName}
                  </div>

                  {thread.isPriority ? (
                    <Star className="size-3.5 shrink-0 fill-current" style={{ color: '#f59e0b' }} />
                  ) : null}

                  {bookingContextCount > 1 ? (
                    <span
                      className={cn(
                        'inline-flex h-5 shrink-0 items-center gap-1 rounded-[7px] border px-1.5 text-[9px] font-semibold',
                        isLight
                          ? 'border-red-500/22 bg-red-500/[0.07] text-red-600'
                          : 'border-red-300/20 bg-red-300/[0.08] text-red-200',
                      )}
                      title={locale === 'ru' ? `${bookingContextCount} записи клиента` : `${bookingContextCount} client bookings`}
                    >
                      <CalendarClock className="size-3" />
                      {bookingContextCount}
                    </span>
                  ) : null}
                </div>

                <div className={cn('truncate text-[11px] font-medium leading-4', needsReply ? pageText(isLight) : mutedText(isLight))}>
                  {thread.lastMessagePreview ?? detailLine}
                </div>

                <div className={cn('mt-1 flex min-w-0 items-center gap-1.5 overflow-hidden text-[10px]', mutedText(isLight))}>
                  <span className="inline-flex items-center gap-1.5 truncate">
                    <span className="size-1.5 shrink-0 rounded-full" style={{ background: channelColor(thread.channel) }} />
                    <span className="truncate">{channelLabel(thread.channel)}</span>
                  </span>

                  <span className={faintText(isLight)}>·</span>
                  <span className="truncate">{detailLine}</span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <time className={cn('pt-0.5 text-[10px] font-medium', mutedText(isLight))}>
                  {formatTimeLabel(thread.lastMessageAt, locale)}
                </time>

                <MicroLabel
                  light={isLight}
                  active={needsReply}
                  className={cn(
                    'hidden h-6 px-1.5 py-0 text-[8.5px] 2xl:inline-flex',
                    hasFailedDelivery && (isLight ? 'border-red-500/20 bg-red-500/10 text-red-600' : 'border-red-300/20 bg-red-300/10 text-red-200'),
                  )}
                >
                  {statusLabel}
                </MicroLabel>

                <button
                  type="button"
                  className={cn('flex size-7 items-center justify-center rounded-[10px] border transition', isLight ? 'border-transparent bg-transparent text-black/32 hover:border-[#eadfd4] hover:bg-white/70 hover:text-black/64' : 'border-white/[0.07] bg-white/[0.035] text-white/30 hover:border-white/[0.12] hover:text-white/62')}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const rect = (event.currentTarget as HTMLButtonElement).getBoundingClientRect();
                    setActiveThreadId(thread.id);
                    setThreadContextMenu({ threadId: thread.id, x: rect.left, y: rect.bottom + 6 });
                  }}
                  aria-label={labels.moreActions}
                  title={labels.moreActions}
                >
                  <MoreVertical className="size-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-1.5 flex min-w-0 items-center gap-1.5 overflow-hidden text-[9px]">
              {thread.botConnected ? (
                <MicroLabel light={isLight} className="h-5 max-w-[98px] rounded-[7px] px-1.5 py-0 text-[8.5px]">
                  <Bot className="size-2.5" />
                  <span className="truncate">{locale === 'ru' ? 'бот' : 'bot'}</span>
                </MicroLabel>
              ) : null}

              {thread.nextVisit ? (
                <MicroLabel light={isLight} className="h-5 max-w-[92px] rounded-[7px] px-1.5 py-0 text-[8.5px]">
                  <CalendarClock className="size-2.5" />
                  <span className="truncate">{formatDateLabel(thread.nextVisit, locale)}</span>
                </MicroLabel>
              ) : null}

              {activeAlert ? (
                <MicroLabel light={isLight} className={cn('h-4 px-1 py-0 text-[8px]', warningTone(isLight))}>
                  <AlertTriangle className="size-2.5" />
                  {labels.rescheduleAlertShort}
                </MicroLabel>
              ) : null}

              {!thread.botConnected ? (
                <MicroLabel light={isLight} className="h-5 max-w-[82px] rounded-[7px] px-1.5 py-0 text-[8.5px]">
                  <UserRound className="size-2.5" />
                  <span className="truncate">{locale === 'ru' ? 'ручной' : 'manual'}</span>
                </MicroLabel>
              ) : null}

              <span className={cn('ml-auto truncate text-[9.5px]', faintText(isLight))}>{timeLine}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderThreadList = (mobile = false) => {
    if (isLoading) {
      return (
        <div className={cn('space-y-2', mobile && 'space-y-1.5')}>
          {Array.from({ length: mobile ? 5 : 6 }).map((_, index) => (
            <Panel
              key={index}
              light={isLight}
              className={cn('animate-pulse', mobile ? 'h-[64px]' : 'h-[66px]')}
            />
          ))}
        </div>
      );
    }

    if (filteredThreads.length === 0) {
      return <EmptyState text={labels.emptyList} hint={labels.emptyListHint} light={isLight} />;
    }

    return (
      <>
        <div
          className={cn(
            'relative space-y-2 transition-[filter,opacity] duration-150',
            mobile && 'space-y-1.5',
            dragState?.active && 'select-none',
          )}
        >
          {filteredThreads.map((thread, index) => {
            const isDragged = draggedId === thread.id;
            const dragSlotHeight = isDragged
              ? dragState?.cardRect.height ??
                itemRefs.current[thread.id]?.getBoundingClientRect().height ??
                112
              : undefined;

            return (
              <div
                key={thread.id}
                className={cn('relative', isDragged && 'opacity-35 blur-[1px]')}
                style={dragSlotHeight ? { minHeight: dragSlotHeight } : undefined}
              >
                {dragState?.active && dropIndex === index ? (
                  <div className="px-1 py-1">
                    <div
                      className={cn(
                        'flex h-9 items-center justify-center rounded-[9px] border border-dashed text-[9.5px] font-medium uppercase tracking-[0.14em]',
                        isLight ? 'text-black/42' : 'text-white/45',
                      )}
                      style={{
                        borderColor: `color-mix(in srgb, ${accentColor} 45%, transparent)`,
                        background: `color-mix(in srgb, ${accentColor} ${isLight ? '7%' : '10%'}, transparent)`,
                      }}
                    >
                      {labels.dropHere}
                    </div>
                  </div>
                ) : null}

                <motion.div
                  layout="position"
                  transition={{ type: 'spring', stiffness: 520, damping: 42, mass: 0.72 }}
                >
                  {renderThreadCard(thread, index, { mobile })}
                </motion.div>
              </div>
            );
          })}

          {dragState?.active && dropIndex === filteredThreads.length ? (
            <div className="px-1 py-1">
              <div
                className={cn(
                  'flex h-9 items-center justify-center rounded-[9px] border border-dashed text-[9.5px] font-medium uppercase tracking-[0.14em]',
                  isLight ? 'text-black/42' : 'text-white/45',
                )}
                style={{
                  borderColor: `color-mix(in srgb, ${accentColor} 45%, transparent)`,
                  background: `color-mix(in srgb, ${accentColor} ${isLight ? '7%' : '10%'}, transparent)`,
                }}
              >
                {labels.dropEnd}
              </div>
            </div>
          ) : null}
        </div>

        {dragState?.active && draggedThread && typeof document !== 'undefined'
          ? createPortal(
              <motion.div
                className="pointer-events-none fixed"
                style={{
                  top: dragState.cardRect.top,
                  left: dragState.cardRect.left,
                  width: dragState.cardRect.width,
                  x: dragSpringX,
                  y: dragSpringY,
                  zIndex: 90,
                }}
                initial={false}
                animate={{ scale: 1.018, rotate: 0.25 }}
                transition={{ type: 'spring', stiffness: 680, damping: 42, mass: 0.5 }}
              >
                <div
                  className={cn(
                    'absolute -inset-2 rounded-[14px] border backdrop-blur-[18px]',
                    isLight
                      ? 'border-black/[0.08] bg-white/45 shadow-[0_26px_90px_rgba(15,15,15,0.18)]'
                      : 'border-white/[0.10] bg-black/35 shadow-[0_26px_90px_rgba(0,0,0,0.45)]',
                  )}
                  style={{
                    background: `linear-gradient(135deg, color-mix(in srgb, ${accentColor} ${isLight ? '10%' : '16%'}, transparent), ${
                      isLight ? 'rgba(255,255,255,0.48)' : 'rgba(10,10,10,0.48)'
                    })`,
                  }}
                />
                <div className="relative">
                  {renderThreadCard(draggedThread, dragState.originIndex, {
                    dragging: true,
                    preview: true,
                  })}
                </div>
              </motion.div>,
              document.body,
            )
          : null}
      </>
    );
  };

  const renderMessageFeed = (mobile = false) => {
    if (!activeThread) {
      return (
        <div
          className={cn(
            'flex h-full flex-col items-center justify-center rounded-[10px] border border-dashed px-5 text-center',
            borderTone(isLight),
            mobile ? 'min-h-[200px]' : 'min-h-full',
          )}
        >
          <div className={cn('text-[14px] font-semibold', pageText(isLight))}>
            {labels.emptyThread}
          </div>

          <div className={cn('mt-2 max-w-[420px] text-[11px] leading-5', mutedText(isLight))}>
            {labels.emptyThreadHint}
          </div>
        </div>
      );
    }

    if (activeThread.messages.length === 0) {
      return (
        <div
          className={cn(
            'flex h-full flex-col items-center justify-center rounded-[10px] border border-dashed px-5 text-center',
            borderTone(isLight),
            mobile ? 'min-h-[200px]' : 'min-h-full',
          )}
        >
          <div className={cn('text-[14px] font-semibold', pageText(isLight))}>
            {labels.emptyHistory}
          </div>

          <div className={cn('mt-2 max-w-[420px] text-[11px] leading-5', mutedText(isLight))}>
            {labels.emptyHistoryHint}
          </div>
        </div>
      );
    }

    return (
      <div
        className={cn(
          'mx-auto flex min-h-full w-full flex-col gap-2.5',
          mobile ? 'max-w-full' : 'max-w-[820px]',
        )}
      >
        {!mobile ? (
          <div
            className={cn(
              'mb-1 rounded-[16px] border px-3.5 py-3',
              isLight
                ? 'border-[#eadfd4] bg-white/82 shadow-[0_10px_28px_rgba(50,35,22,0.035)]'
                : 'border-white/[0.08] bg-white/[0.035]',
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className={cn('text-[9.5px] font-semibold uppercase tracking-[0.14em]', mutedText(isLight))}>
                  {labels.nextStep}
                </div>
                <div className={cn('mt-1 truncate text-[13px] font-semibold', pageText(isLight))}>
                  {assistantSummary.title}
                </div>
                <div className={cn('mt-0.5 line-clamp-1 text-[11px]', mutedText(isLight))}>
                  {assistantSummary.detail}
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  className={buttonBase(isLight, threadNeedsReply(activeThread))}
                  onClick={() => handleAssistantScenario('clarify')}
                >
                  <MessageSquareQuote className="size-3.5" />
                  {locale === 'ru' ? 'Уточнить' : 'Clarify'}
                </button>

                <button
                  type="button"
                  className={buttonBase(isLight)}
                  onClick={() => handleAssistantScenario('slots')}
                >
                  <CalendarClock className="size-3.5" />
                  {locale === 'ru' ? 'Окна' : 'Slots'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {activeThread.messages.map((message, index) => {
          const mine = message.author === 'master' || message.author === 'system';
          const system = message.author === 'system';
          const failed = message.deliveryState === 'failed';
          const status = deliveryLabel(message.deliveryState, locale);
          const currentDay = message.createdAt.slice(0, 10);
          const previousDay = activeThread.messages[index - 1]?.createdAt.slice(0, 10);
          const showDayDivider = currentDay !== previousDay;

          return (
            <div key={message.id} className="space-y-1.5">
              {showDayDivider ? (
                <div className="flex items-center gap-2.5 py-1.5">
                  <div className={cn('h-px flex-1', isLight ? 'bg-black/[0.08]' : 'bg-white/[0.08]')} />
                  <div className={cn('text-[9.5px] font-medium uppercase tracking-[0.14em]', mutedText(isLight))}>
                    {formatLongDateLabel(message.createdAt, locale)}
                  </div>
                  <div className={cn('h-px flex-1', isLight ? 'bg-black/[0.08]' : 'bg-white/[0.08]')} />
                </div>
              ) : null}

              <div className={cn('flex items-end gap-2', system ? 'justify-center' : mine ? 'justify-end' : 'justify-start')}>
                {!mine ? <ClientAvatar name={activeThread.clientName} size="sm" className="mb-5" /> : null}
                <div
                  className={cn(
                    'border shadow-none',
                    mobile ? 'max-w-[88%] px-3 py-2.5' : 'max-w-[76%] px-4 py-3',
                    system
                      ? isLight
                        ? 'rounded-[14px] border-[#eadfd4] bg-[#fffaf4] text-[#172033]'
                        : 'rounded-[14px] border-white/[0.08] bg-white/[0.05] text-white'
                      : mine
                      ? isLight
                        ? failed
                          ? 'rounded-[18px] rounded-br-[6px] border-red-500/24 bg-red-500/[0.07] text-[#172033]'
                          : 'rounded-[18px] rounded-br-[6px] border-[#ffdcca] bg-[#fff0e8] text-[#172033]'
                        : failed
                          ? 'rounded-[18px] rounded-br-[6px] border-red-300/24 bg-red-300/[0.08] text-white'
                          : 'rounded-[18px] rounded-br-[6px] border-white/[0.075] bg-white/[0.05] text-white'
                      : isLight
                        ? 'rounded-[18px] rounded-bl-[6px] border-[#eee6de] bg-white text-[#172033]'
                        : 'rounded-[18px] rounded-bl-[6px] border-white/[0.075] bg-black/30 text-white',
                  )}
                  style={
                    mine && (composerFlow || message.viaBot)
                      ? {
                          background: isLight
                            ? 'linear-gradient(135deg, #fff3eb, #ffece0)'
                            : `color-mix(in srgb, ${accentColor} 10%, transparent)`,
                        }
                      : undefined
                  }
                >
                  <div
                    className={cn(
                      'whitespace-pre-wrap',
                      pageText(isLight),
                      mobile ? 'text-[11.5px] leading-[1.1rem]' : 'text-[13px] leading-5',
                    )}
                  >
                    {message.body}
                  </div>

                  <div className={cn('mt-2 flex items-center justify-end gap-2 text-[9.5px]', mutedText(isLight))}>
                    {message.viaBot ? (
                      <span className="inline-flex items-center gap-1">
                        <Bot className="size-3" />
                        {labels.byBot}
                      </span>
                    ) : null}

                    {status ? (
                      <span className="inline-flex items-center gap-1">
                        <CheckCheck className="size-3" />
                        {status}
                      </span>
                    ) : null}

                    <span>{formatTimeLabel(message.createdAt, locale)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messageBottomRef} className="h-px shrink-0" aria-hidden />
      </div>
    );
  };

  const renderRescheduleBlock = (mobile = false) => {
    if (composerFlow !== 'reschedule') return null;

    return (
      <Panel light={isLight} className={cn('space-y-3 p-3.5', mobile && 'space-y-2.5 p-3')}>
        <div className={cn('text-[10px] font-semibold uppercase tracking-[0.14em]', mutedText(isLight))}>
          {labels.newSlot}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {quickTransferPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={buttonBase(isLight, transferDate === preset.date)}
              onClick={() => applyQuickTransfer(preset.date, preset.time)}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {mobile ? (
          <div className="grid gap-2">
            <Panel light={isLight} className="p-2.5">
              <div className="mb-2 inline-flex items-center gap-2 text-[11px]">
                <CalendarDays className={cn('size-4 shrink-0', mutedText(isLight))} />
                <span className={pageText(isLight)}>{labels.date}</span>
              </div>
              <Input
                type="date"
                value={transferDate}
                onChange={(event) => setTransferDate(event.target.value)}
                className={cn('h-10 rounded-[9px]', inputTone(isLight))}
              />
            </Panel>

            <Panel light={isLight} className="p-2.5">
              <div className="mb-2 inline-flex items-center gap-2 text-[11px]">
                <Clock3 className={cn('size-4 shrink-0', mutedText(isLight))} />
                <span className={pageText(isLight)}>{labels.time}</span>
              </div>
              <Input
                type="time"
                step="1800"
                value={transferTime}
                onChange={(event) => setTransferTime(event.target.value)}
                className={cn('h-10 rounded-[9px]', inputTone(isLight))}
              />
            </Panel>

            <button
              type="button"
              onClick={handleApplyTransfer}
              disabled={!activeThread || !transferDate}
              className={cn(buttonBase(isLight, true), 'disabled:pointer-events-none disabled:opacity-45')}
            >
              <CalendarClock className="size-3.5" />
              {labels.applyTransfer}
            </button>
          </div>
        ) : (
          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_168px_auto]">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'flex h-10 w-full items-center justify-between gap-3 rounded-[9px] border px-3 text-[12.5px] font-medium shadow-none transition active:scale-[0.985]',
                    inputTone(isLight),
                  )}
                >
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <CalendarDays className={cn('size-4 shrink-0', mutedText(isLight))} />
                    <span className="truncate">
                      {transferDate ? formatPickerDateLabel(transferDate, locale) : labels.date}
                    </span>
                  </span>
                </button>
              </PopoverTrigger>

              <PopoverContent
                className={cn('w-auto p-1', glassMenuContentClass(isLight))}
                style={glassMenuSurfaceStyle(isLight, accentColor)}
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={transferDate ? new Date(`${transferDate}T00:00:00`) : undefined}
                  onSelect={(date) => {
                    if (!date) return;
                    setTransferDate(toLocalIsoDate(date));
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Select value={transferTime} onValueChange={setTransferTime}>
              <SelectTrigger className={selectTriggerClass(isLight)}>
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <Clock3 className="size-4 shrink-0" />
                    <span className="truncate">{transferTime || labels.time}</span>
                  </span>
                </div>
              </SelectTrigger>

              <SelectContent
                className={selectContentClass(isLight)}
                style={glassMenuSurfaceStyle(isLight, accentColor)}
              >
                {TIME_OPTIONS.map((value) => {
                  const active = transferTime === value;

                  return (
                    <SelectItem
                      key={value}
                      value={value}
                      className={dropdownItemTone(isLight, active)}
                    >
                      <DropdownOption label={value} active={active} light={isLight} minWidth="100%" />
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <button
              type="button"
              onClick={handleApplyTransfer}
              disabled={!activeThread || !transferDate}
              className={cn(buttonBase(isLight, true), 'h-10 disabled:pointer-events-none disabled:opacity-45')}
            >
              <CalendarClock className="size-3.5" />
              {labels.applyTransfer}
            </button>
          </div>
        )}
      </Panel>
    );
  };

  const renderComposer = (mobile = false) => (
    <footer
      className={cn(
        'shrink-0 border-t',
        borderTone(isLight),
        isLight ? 'bg-[#ffffff]' : 'bg-[#141414]',
        mobile
          ? 'px-3 py-2.5 pb-[calc(env(safe-area-inset-bottom,0px)+0.65rem)]'
          : 'px-4 py-2.5',
      )}
    >
      <div className={cn('space-y-2.5', !mobile && 'space-y-2')}>
        <div className={cn(mobile ? 'grid grid-cols-3 gap-1.5' : 'flex flex-wrap items-center gap-2')}>
          <button
            type="button"
            className={buttonBase(isLight, composerFlow === 'confirm')}
            disabled={!activeThread}
            onClick={() => handleApplyBotFlow('confirm')}
          >
            <CheckCheck className="size-3.5" />
            {labels.confirm}
          </button>

          <button
            type="button"
            className={buttonBase(isLight, composerFlow === 'reschedule')}
            disabled={!activeThread}
            onClick={() => {
              if (composerFlow === 'reschedule') {
                setComposerFlow(null);
                return;
              }

              const fallbackPreset = quickTransferPresets[0];
              if (fallbackPreset) {
                applyQuickTransfer(fallbackPreset.date, fallbackPreset.time);
              } else {
                setComposerFlow('reschedule');
              }
            }}
          >
            <ArrowRightLeft className="size-3.5" />
            {labels.reschedule}
          </button>

          <button
            type="button"
            className={buttonBase(isLight, composerFlow === 'followup')}
            disabled={!activeThread}
            onClick={() => handleApplyBotFlow('followup')}
          >
            <Sparkles className="size-3.5" />
            {labels.followup}
          </button>
        </div>

        {renderRescheduleBlock(mobile)}

        <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-0.5">
          <span className={cn('shrink-0 text-[10px] font-semibold', mutedText(isLight))}>
            {locale === 'ru' ? 'Быстрые ответы' : 'Quick replies'}
          </span>

          {quickReplyChips.map((reply) => (
            <button
              key={reply.id}
              type="button"
              disabled={!activeThread}
              onClick={() => {
                setComposerFlow(null);
                setSelectedTemplateId('custom');
                setDraft(reply.body);
              }}
              className={cn(
                'h-7 shrink-0 rounded-full border px-2.5 text-[10.5px] font-medium transition active:scale-[0.985] disabled:pointer-events-none disabled:opacity-45',
                isLight
                  ? 'border-[#eee1d6] bg-white text-[#172033]/62 hover:border-[#ffd5c2] hover:bg-[#fff3eb] hover:text-[#172033]'
                  : 'border-white/[0.08] bg-white/[0.04] text-white/52 hover:bg-white/[0.07] hover:text-white',
              )}
            >
              {reply.label}
            </button>
          ))}
        </div>

        {mobile && activeThread && templateOptions.length ? (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {templateOptions.slice(0, 3).map((template) => (
              <button
                key={template.id}
                type="button"
                className={cn(
                  'h-7 shrink-0 rounded-[9px] border px-3 text-[10px] font-medium transition',
                  selectedTemplateId === template.id
                    ? 'cb-accent-pill-active'
                    : isLight
                      ? 'border-black/[0.08] bg-white text-black/50'
                      : 'border-white/[0.08] bg-white/[0.04] text-white/44',
                )}
                onClick={() => handleTemplateChange(template.id)}
              >
                {template.title}
              </button>
            ))}
          </div>
        ) : null}

        <div className={cn('grid gap-2', mobile ? 'grid-cols-1' : 'xl:grid-cols-[168px_minmax(0,1fr)]')}>
          {mobile ? null : (
            <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
              <SelectTrigger className={selectTriggerClass(isLight)}>
                <SelectValue placeholder={labels.template} />
              </SelectTrigger>

              <SelectContent
                className={selectContentClass(isLight)}
                style={glassMenuSurfaceStyle(isLight, accentColor)}
              >
                <SelectItem
                  value="custom"
                  className={dropdownItemTone(isLight, selectedTemplateId === 'custom')}
                >
                  <DropdownOption
                    label={labels.template}
                    active={selectedTemplateId === 'custom'}
                    light={isLight}
                    minWidth="100%"
                  />
                </SelectItem>

                {templateOptions.map((template) => {
                  const active = selectedTemplateId === template.id;

                  return (
                    <SelectItem
                      key={template.id}
                      value={template.id}
                      className={dropdownItemTone(isLight, active)}
                    >
                      <DropdownOption label={template.title} active={active} light={isLight} minWidth="100%" />
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}

          <div className="grid gap-2">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder={labels.messagePlaceholder}
              className={cn(
                'resize-none rounded-[9px] px-3 py-2.5 shadow-none',
                inputTone(isLight),
                mobile ? 'min-h-[82px] text-[11.5px]' : 'min-h-[48px] text-[13px]',
              )}
              disabled={!activeThread}
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className={cn('flex items-center gap-2 text-[10px]', mutedText(isLight))}>
                <UserRound className="size-3.5" />
                <span>
                  {isSending
                    ? locale === 'ru'
                      ? 'Отправляем…'
                      : 'Sending…'
                    : activeThread
                      ? activeThread.clientName
                      : '—'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className={buttonBase(isLight)}
                  onClick={() => setDraft('')}
                  disabled={!draft}
                >
                  {labels.clear}
                </button>

                <button
                  type="button"
                  className={buttonBase(isLight, true)}
                  onClick={handleSendMessage}
                  disabled={!activeThread || !draft.trim() || isSending}
                >
                  <SendHorizonal className="size-3.5" />
                  {labels.send}
                </button>
              </div>
            </div>
          </div>
        </div>

        {error ? <div className="text-[11px] text-destructive">{error}</div> : null}
      </div>
    </footer>
  );

  const renderChatHeader = () => {
    const activePinned = activeThread ? isThreadPinned(activeThread.id) : false;
    const activeAlert = getThreadActiveAlert(activeThread);

    return (
      <header
        className={cn(
          'relative z-[1] shrink-0 border-b px-4 py-2.5',
          borderTone(isLight),
          isLight ? 'bg-[#ffffff]' : 'bg-[#141414]',
        )}
      >
        {activeThread ? (
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
            <div className="flex min-w-0 items-start gap-3">
              <ClientAvatar name={activeThread.clientName} size="md" />

              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <div
                    className={cn(
                      'truncate text-[18px] font-semibold tracking-[-0.035em]',
                      pageText(isLight),
                    )}
                  >
                    {activeThread.clientName}
                  </div>

                  <MicroLabel light={isLight} className="h-6 px-2 py-0 text-[9.5px]">
                    {channelLabel(activeThread.channel)}
                  </MicroLabel>

                  <MicroLabel light={isLight} active className="h-6 px-2 py-0 text-[9.5px]">
                    {segmentBadgeLabel(activeThread.segment, locale)}
                  </MicroLabel>

                  {activePinned ? (
                    <MicroLabel light={isLight} active className="h-6 px-2 py-0 text-[9.5px]">
                      <Pin className="size-3 fill-current" />
                      {labels.pinned}
                    </MicroLabel>
                  ) : null}
                </div>

                {selectedBookingContext ? (
                  <div className={cn('mt-1 truncate text-[11.5px] font-semibold', pageText(isLight))}>
                    {getBookingContextLabel(selectedBookingContext, locale)}
                  </div>
                ) : getThreadContextLine(activeThread, locale) ? (
                  <div className={cn('mt-1 truncate text-[11.5px] font-semibold', pageText(isLight))}>
                    {getThreadContextLine(activeThread, locale)}
                  </div>
                ) : null}

                {activeBookingContexts.length > 1 ? (
                  <div className="mt-2 flex max-w-full gap-1.5 overflow-x-auto pb-1">
                    {activeBookingContexts.map((context) => {
                      const selected = context.id === selectedBookingId;
                      return (
                        <button
                          key={context.id}
                          type="button"
                          onClick={() => setSelectedBookingByThreadId((current) => ({ ...current, [activeThread.id]: context.id }))}
                          className={cn(
                            'inline-flex max-w-[220px] shrink-0 items-center gap-1.5 rounded-[8px] border px-2 py-1 text-[10px] font-semibold transition active:scale-[0.985]',
                            selected
                              ? 'cb-accent-pill-active'
                              : isLight
                                ? 'border-black/[0.08] bg-white text-black/48 hover:text-black'
                                : 'border-white/[0.08] bg-white/[0.04] text-white/42 hover:text-white',
                          )}
                          title={getBookingContextLabel(context, locale)}
                        >
                          <span className="truncate">{getBookingContextShortLabel(context, locale)}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                <div
                  className={cn(
                    'mt-1.5 flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 text-[10.5px]',
                    mutedText(isLight),
                  )}
                >
                  <span className="inline-flex max-w-full items-center gap-1.5">
                    <Bot className="size-3.5 shrink-0" />
                    <span className="truncate">
                      {activeThread.botConnected ? (locale === 'ru' ? 'КликБук бот' : 'ClickBook bot') : labels.botOff}
                    </span>
                  </span>

                  <span className={faintText(isLight)}>•</span>

                  <span className="truncate">
                    {labels.clientPhone}: {activeThread.clientPhone}
                  </span>

                  <span className={faintText(isLight)}>•</span>

                  <span className="truncate">
                    {labels.nextVisit}:{' '}
                    {activeThread.nextVisit
                      ? formatDateLabel(activeThread.nextVisit, locale)
                      : labels.notScheduled}
                  </span>
                </div>

                {activeAlert ? (
                  <div className={cn('mt-3 rounded-[10px] border px-3 py-2.5', warningTone(isLight))}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[12px] font-semibold tracking-[-0.02em]">
                          {labels.rescheduleAlert}
                        </div>
                        <div className={cn('mt-1 text-[10.5px] leading-4', isLight ? 'text-amber-950/70' : 'text-amber-100/70')}>
                          {activeAlert.message || labels.rescheduleAlertText}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2">
              <a
                href={`tel:${activeThread.clientPhone}`}
                className={cn(buttonBase(isLight), 'no-underline')}
                aria-label={labels.clientPhone}
              >
                <Phone className="size-3.5" />
              </a>

              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className={buttonBase(isLight)}>
                    <UserRound className="size-3.5" />
                    {labels.details}
                  </button>
                </PopoverTrigger>

                <PopoverContent
                  align="end"
                  className={cn('w-[280px]', glassMenuContentClass(isLight))}
                  style={glassMenuSurfaceStyle(isLight, accentColor)}
                >
                  <div className="px-2 pb-2 pt-1">
                    <div className={cn('text-[10px] font-semibold uppercase tracking-[0.14em]', mutedText(isLight))}>
                      {labels.clientCard}
                    </div>
                  </div>

                  <div
                    className={cn(
                      'overflow-hidden rounded-[8px] border divide-y',
                      insetTone(isLight),
                      isLight ? 'divide-black/[0.08]' : 'divide-white/[0.08]',
                    )}
                  >
                    {[
                      { label: labels.clientPhone, value: activeThread.clientPhone },
                      { label: labels.source, value: activeThread.source || '—' },
                      {
                        label: labels.nextVisit,
                        value: activeThread.nextVisit
                          ? formatLongDateLabel(activeThread.nextVisit, locale)
                          : labels.notScheduled,
                      },
                      { label: labels.unread, value: String(activeThread.unreadCount) },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <span className={cn('text-[11px]', mutedText(isLight))}>{item.label}</span>
                        <span className={cn('max-w-[150px] truncate text-right text-[11px] font-medium', pageText(isLight))}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        ) : (
          <div className={cn('text-[14px] font-semibold', pageText(isLight))}>
            {labels.emptyThread}
          </div>
        )}
      </header>
    );
  };

  const renderFilters = (mobile = false) => (
    <>
      <div
        className={cn(
          'grid items-center gap-2',
          mobile
            ? 'grid-cols-[minmax(0,1fr)_40px]'
            : 'sm:grid-cols-[minmax(0,1fr)_112px] lg:grid-cols-1 xl:grid-cols-[minmax(0,1fr)_112px]',
        )}
      >
        <label
          className={cn(searchFieldClass(isLight), 'cb-page-search')}
          style={{ background: 'transparent', backgroundColor: 'transparent', boxShadow: 'none' }}
        >
          <Search className="size-4 shrink-0 opacity-70" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={labels.search}
            className="cb-page-search__input block h-full min-w-0 flex-1 appearance-none rounded-none border-0 p-0 text-[12.5px] font-medium text-current outline-none placeholder:text-current/55 [background:transparent!important] [box-shadow:none!important]"
            style={{
              background: 'transparent',
              backgroundColor: 'transparent',
              boxShadow: 'none',
              WebkitAppearance: 'none',
              appearance: 'none',
            }}
          />
          <kbd className="cb-page-search-kbd">/</kbd>
        </label>

        <button
          type="button"
          className={cn(
            buttonBase(isLight, showCreatePanel),
            'h-9 shrink-0 px-3',
            mobile && 'w-10 px-0',
          )}
          onClick={() => setShowCreatePanel((current) => !current)}
        >
          <Plus className="size-3.5" />
          {mobile ? null : showCreatePanel ? labels.closeCreate : labels.createThread}
        </button>
      </div>

      <div className="space-y-1.5">
        <div className={cn('text-[9.5px] font-semibold uppercase tracking-[0.14em]', mutedText(isLight), !mobile && 'sr-only')}>
          {labels.filters}
        </div>

        <ControlGroup light={isLight} className={cn('w-full', mobile && 'overflow-x-auto')}>
          {segmentOptions.map((option) => (
            <FilterChip
              key={option.value}
              label={mobile ? option.label : option.shortLabel}
              count={option.count}
              light={isLight}
              active={segmentFilter === option.value}
              onClick={() => setSegmentFilter(option.value)}
              accentColor={accentColor}
              className="flex-1"
            />
          ))}
        </ControlGroup>
      </div>

      <div className={cn('grid gap-2', !mobile && 'xl:grid-cols-[124px_minmax(0,1fr)]')}>
        <Select
          value={channelFilter}
          onValueChange={(value) => setChannelFilter(value as ChannelFilter)}
        >
          <SelectTrigger className={selectTriggerClass(isLight)}>
            <SelectValue />
          </SelectTrigger>

          <SelectContent
            className={selectContentClass(isLight)}
            style={glassMenuSurfaceStyle(isLight, accentColor)}
          >
            {channelOptions.map((option) => {
              const active = channelFilter === option.value;

              return (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className={dropdownItemTone(isLight, active)}
                >
                  <DropdownOption label={option.label} active={active} light={isLight} minWidth="100%" />
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <div className="space-y-1.5">
          <div className={cn('text-[9.5px] font-semibold uppercase tracking-[0.14em]', mutedText(isLight), !mobile && 'sr-only')}>
            {labels.sort}
          </div>

          <ControlGroup light={isLight} className={cn('w-full', mobile && 'overflow-x-auto')}>
            {sortOptions.map((option) => (
              <FilterChip
                key={option.value}
                label={option.label}
                light={isLight}
                active={sortMode === option.value}
                onClick={() => setSortMode(option.value)}
                accentColor={accentColor}
                className="flex-1"
              />
            ))}
          </ControlGroup>
        </div>
      </div>

      {showCreatePanel ? (
        <Panel light={isLight} className="grid gap-2 p-2.5">
          <div className={cn('text-[11px] font-semibold uppercase tracking-[0.14em]', mutedText(isLight))}>
            {labels.createInline}
          </div>

          <Input
            value={newClientName}
            onChange={(event) => setNewClientName(event.target.value)}
            placeholder={labels.clientName}
            className={cn('h-10 rounded-[9px]', inputTone(isLight))}
          />

          <Input
            value={newClientPhone}
            onChange={(event) => setNewClientPhone(event.target.value)}
            placeholder={labels.clientPhone}
            className={cn('h-10 rounded-[9px]', inputTone(isLight))}
          />

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className={buttonBase(isLight)}
              onClick={() => setShowCreatePanel(false)}
            >
              {labels.cancel}
            </button>

            <button
              type="button"
              className={buttonBase(isLight, true)}
              onClick={handleCreateThread}
            >
              <Plus className="size-3.5" />
              {labels.create}
            </button>
          </div>
        </Panel>
      ) : null}

      {error ? (
        <div className="rounded-[9px] border border-destructive/20 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
          {error}
        </div>
      ) : null}
    </>
  );

  const contextMenuPortal = (
    <ThreadContextMenu
      menu={threadContextMenu}
      thread={contextThread}
      light={isLight}
      accentColor={accentColor}
      labels={labels}
      onClose={() => setThreadContextMenu(null)}
      onToggleBot={() => {
        if (!contextThread) return;
        void applyLocalThreadPatch(contextThread.id, {
          botConnected: !contextThread.botConnected,
        });
      }}
      onTogglePin={() => {
        if (!contextThread) return;
        toggleThreadPin(contextThread.id);
      }}
      onTogglePriority={() => {
        if (!contextThread) return;
        void applyLocalThreadPatch(contextThread.id, {
          isPriority: !contextThread.isPriority,
        });
      }}
      onExport={() => {
        if (!contextThread) return;
        handleExportThreadById(contextThread.id);
      }}
      onDelete={() => {
        if (!contextThread) return;
        handleDeleteThread(contextThread.id);
      }}
    />
  );

  const renderMetricCards = () => (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metricCards.map((metric) => {
        const MetricIcon = metric.icon;
        const sparkStroke =
          metric.tone === 'peach'
            ? '#f9734c'
            : metric.tone === 'violet'
              ? '#7c3aed'
              : metric.tone === 'green'
                ? '#3f8f42'
                : accentColor;
        const tone =
          metric.tone === 'peach'
            ? 'bg-[#fff0e8] text-[#f9734c]'
            : metric.tone === 'violet'
              ? 'bg-[#f1ecff] text-[#7c3aed]'
              : metric.tone === 'green'
                ? 'bg-[#eef8e8] text-[#3f8f42]'
                : 'bg-[#f5efe5] text-[#7c6a58]';

        return (
          <div
            key={metric.id}
            className={cn(
              'min-h-[62px] rounded-[18px] border px-3.5 py-2.5 transition-shadow duration-150 hover:shadow-[0_22px_44px_rgba(50,35,22,0.075)]',
              isLight
                ? 'border-[#eee5db] bg-white shadow-[0_14px_34px_rgba(50,35,22,0.045)]'
                : 'border-white/[0.08] bg-white/[0.04]',
            )}
          >
            <div className="flex items-start gap-2.5">
              <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-[14px]', tone)}>
                <MetricIcon className="size-[18px]" />
              </span>

              <div className="min-w-0 flex-1">
                <div className={cn('truncate text-[11px] font-semibold', mutedText(isLight))}>
                  {metric.label}
                </div>
                <div className="mt-0.5 flex items-end justify-between gap-2">
                  <div className={cn('text-[20px] font-semibold leading-none', pageText(isLight))}>
                    <NumberPopIn value={metric.value} />
                  </div>
                  <ChatMetricSparkline values={metric.spark} color={sparkStroke} />
                </div>
                <div className={cn('mt-1 text-[9.5px] font-medium', metric.id === 'average' ? 'text-rose-500' : 'text-emerald-600')}>
                  {metric.hint}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (isMobile) {
    return (
      <WorkspaceShell>
        <main className={cn('h-[calc(100dvh-68px)] overflow-hidden px-4 pb-4 pt-5 md:px-7 md:pt-6', pageBg(isLight))}>
          <div className="mx-auto flex h-full min-h-0 w-full max-w-[var(--page-max-width)] flex-col">
            <div className="mb-5 shrink-0">
              <h1
                className={cn(
                  'text-[20px] font-semibold tracking-[-0.025em] md:text-[24px]',
                  pageText(isLight),
                )}
              >
                {labels.title}
              </h1>

              <p className={cn('mt-2 max-w-[760px] text-[13px] leading-5', mutedText(isLight))}>
                {labels.description}
              </p>
            </div>

            <Card light={isLight} className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <CardTitle
                title={labels.workspaceTitle}
                description={labels.workspaceDescription}
                light={isLight}
                action={
                  <MicroLabel light={isLight} active={demoMode}>
                    <Bot className="size-3.5" />
                    {demoMode ? labels.demo : labels.live}
                  </MicroLabel>
                }
              />

              <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
                <Panel light={isLight} className="shrink-0 space-y-3 p-3">
                  {renderFilters(true)}
                </Panel>

                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                  {renderThreadList(true)}
                </div>
              </div>
            </Card>
          </div>

          {mobileThreadOpen && activeThread ? (
            <div className={cn('fixed inset-0 z-[70]', pageBg(isLight))}>
              <div className="relative flex h-full flex-col pt-[env(safe-area-inset-top,0px)]">
                <header
                  className={cn(
                    'shrink-0 border-b px-3 py-2',
                    borderTone(isLight),
                    isLight ? 'bg-[#ffffff]' : 'bg-[#141414]',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2">
                      <Button
                        type="button"
                        className={cn('size-10 shrink-0 px-0', buttonBase(isLight))}
                        onClick={() => setMobileThreadOpen(false)}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <div className={cn('truncate text-[12px] font-semibold', pageText(isLight))}>
                            {activeThread.clientName}
                          </div>
                          <MicroLabel light={isLight} className="h-6 px-2 py-0 text-[8.5px]">
                            {channelLabel(activeThread.channel)}
                          </MicroLabel>
                        </div>

                        <div className={cn('mt-1 flex flex-wrap items-center gap-1 text-[9px]', mutedText(isLight))}>
                          <MicroLabel light={isLight} className="h-6 px-2 py-0 text-[9px]">
                            {activeThread.clientPhone}
                          </MicroLabel>
                          <MicroLabel light={isLight} className="h-6 px-2 py-0 text-[9px]">
                            {activeThread.source || '—'}
                          </MicroLabel>
                        </div>
                      </div>
                    </div>

                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn('size-10 px-0', buttonBase(isLight))}
                        >
                          <MoreVertical className="size-4" />
                        </button>
                      </PopoverTrigger>

                      <PopoverContent
                        align="end"
                        className={cn('w-[230px]', glassMenuContentClass(isLight))}
                        style={glassMenuSurfaceStyle(isLight, accentColor)}
                      >
                        <GlassMenuItem
                          light={isLight}
                          accentColor={accentColor}
                          icon={<Bot className="size-3.5" />}
                          label={activeThread.botConnected ? labels.botConnected : labels.botOff}
                          active={activeThread.botConnected}
                          onClick={() => {
                            void applyLocalThreadPatch(activeThread.id, {
                              botConnected: !activeThread.botConnected,
                            });
                          }}
                        />

                        <GlassMenuItem
                          light={isLight}
                          accentColor={accentColor}
                          icon={<Pin className={cn('size-3.5', isThreadPinned(activeThread.id) && 'fill-current')} />}
                          label={isThreadPinned(activeThread.id) ? labels.unpinThread : labels.pinThread}
                          active={isThreadPinned(activeThread.id)}
                          onClick={() => toggleThreadPin(activeThread.id)}
                        />

                        <GlassMenuItem
                          light={isLight}
                          accentColor={accentColor}
                          icon={<Star className={cn('size-3.5', activeThread.isPriority && 'fill-current')} />}
                          label={activeThread.isPriority ? labels.priorityOn : labels.priorityOff}
                          active={activeThread.isPriority}
                          onClick={() => {
                            void applyLocalThreadPatch(activeThread.id, {
                              isPriority: !activeThread.isPriority,
                            });
                          }}
                        />

                        <GlassMenuItem
                          light={isLight}
                          accentColor={accentColor}
                          icon={<Download className="size-3.5" />}
                          label={labels.export}
                          onClick={handleExportThread}
                        />

                        <div className={menuSeparatorClass(isLight)} />

                        <GlassMenuItem
                          light={isLight}
                          accentColor={accentColor}
                          icon={<Trash2 className="size-3.5" />}
                          label={labels.deleteChat}
                          danger
                          onClick={() => handleDeleteThread(activeThread.id)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <Panel light={isLight} className="mt-2 px-2.5 py-2">
                    <div className={cn('text-[9px] font-semibold uppercase tracking-[0.14em]', mutedText(isLight))}>
                      {labels.assistant}
                    </div>
                    <div className={cn('mt-1 text-[11px] font-semibold', pageText(isLight))}>
                      {assistantSummary.title}
                    </div>
                  </Panel>
                </header>

                <div
                  ref={mobileMessageScrollRef}
                  className="relative min-h-0 flex-1 overflow-y-auto px-2.5 py-2.5"
                >
                  {renderMessageFeed(true)}
                </div>

                {renderComposer(true)}
              </div>
            </div>
          ) : null}

          {contextMenuPortal}
        </main>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
      <main
        className={cn(
          'h-[calc(100dvh-112px)] overflow-hidden px-4 pb-3 pt-3 md:px-7 md:pt-4',
          pageBg(isLight),
        )}
      >
        <div className="mx-auto flex h-full min-h-0 w-full max-w-[var(--page-max-width)] flex-col">
          <div className="mb-3 grid shrink-0 gap-3 xl:grid-cols-[300px_minmax(0,1fr)] xl:items-end">
            <div>
              <h1
                className={cn(
                  'text-[20px] font-semibold leading-none tracking-[-0.015em] md:text-[24px]',
                  pageText(isLight),
                )}
              >
                {labels.title}
              </h1>

              <p className={cn('mt-2 max-w-[340px] text-[12px] leading-5', mutedText(isLight))}>
                {labels.description}
              </p>
            </div>

            {renderMetricCards()}
          </div>

          <Card light={isLight} className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[26px]">

            <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[318px_minmax(0,1fr)] xl:grid-cols-[322px_minmax(0,1fr)_336px]">
              <aside
                className={cn(
                  'flex min-h-0 flex-col border-b lg:border-b-0 lg:border-r',
                  borderTone(isLight),
                  isLight ? 'bg-[#fffdf9]' : 'bg-[#141414]',
                )}
              >
                <div
                  className={cn(
                    'relative z-[2] shrink-0 space-y-3 border-b px-3 py-3',
                    borderTone(isLight),
                    isLight ? 'bg-[#fffdf9]' : 'bg-[#141414]',
                  )}
                >
                  {renderFilters(false)}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-2.5">
                  {renderThreadList(false)}
                </div>
              </aside>

              <div
                className={cn(
                  'grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto]',
                  isLight ? 'bg-[#fbf7f1]' : 'bg-white/[0.018]',
                )}
              >
                {renderChatHeader()}

                <div
                  ref={desktopMessageScrollRef}
                  className={cn(
                    'min-h-0 overflow-y-auto px-3 py-3',
                    isLight ? 'bg-[#fbf7f1]' : 'bg-white/[0.018]',
                  )}
                >
                  {renderMessageFeed(false)}
                </div>

                {renderComposer(false)}
              </div>

              <aside
                className={cn(
                  'hidden min-h-0 flex-col border-l xl:flex',
                  borderTone(isLight),
                  isLight ? 'bg-[#fffdf9]' : 'bg-[#141414]',
                )}
              >
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                  <Panel light={isLight} className="p-4">
                    <div className={cn('text-[11px] font-semibold uppercase tracking-[0.14em]', mutedText(isLight))}>
                      {labels.nextStep}
                    </div>

                    <div className={cn('mt-2 text-[14px] font-semibold leading-5', pageText(isLight))}>
                      {assistantSummary.title}
                    </div>

                    <p className={cn('mt-1 text-[12px] leading-5', mutedText(isLight))}>
                      {assistantSummary.detail}
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className={cn('h-auto min-h-10 justify-start px-3 py-2 text-left', buttonBase(isLight, threadNeedsReply(activeThread)))}
                        disabled={!activeThread}
                        onClick={() => handleAssistantScenario('clarify')}
                      >
                        <MessageSquareQuote className="size-3.5" />
                        {locale === 'ru' ? 'Ответить' : 'Reply'}
                      </button>

                      <button
                        type="button"
                        className={cn('h-auto min-h-10 justify-start px-3 py-2 text-left', buttonBase(isLight))}
                        disabled={!activeThread}
                        onClick={() => handleAssistantScenario('slots')}
                      >
                        <CalendarClock className="size-3.5" />
                        {locale === 'ru' ? 'Предложить время' : 'Offer slots'}
                      </button>
                    </div>
                  </Panel>

                  <Panel light={isLight} className="p-4">
                    {activeThread ? (
                      <div>
                        <div className="flex items-start gap-3">
                          <ClientAvatar name={activeThread.clientName} size="lg" />
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center justify-between gap-2">
                              <div className={cn('truncate text-[15px] font-semibold', pageText(isLight))}>
                                {activeThread.clientName}
                              </div>
                              <MicroLabel light={isLight} active className="h-6 px-2 py-0 text-[9px]">
                                {activeThread.segment === 'followup'
                                  ? segmentBadgeLabel(activeThread.segment, locale)
                                  : locale === 'ru'
                                    ? 'Постоянный клиент'
                                    : 'Regular client'}
                              </MicroLabel>
                            </div>

                            <a
                              href={`tel:${activeThread.clientPhone}`}
                              className={cn('mt-2 flex items-center gap-1.5 text-[12px] no-underline', mutedText(isLight))}
                            >
                              <Phone className="size-3.5" />
                              {activeThread.clientPhone}
                            </a>

                            <div className={cn('mt-1 flex items-center gap-1.5 text-[11px]', mutedText(isLight))}>
                              <span className="size-1.5 rounded-full" style={{ background: channelColor(activeThread.channel) }} />
                              {channelLabel(activeThread.channel)}
                              {activeThread.source ? <span className={faintText(isLight)}>·</span> : null}
                              {activeThread.source ? <span className="truncate">{activeThread.source}</span> : null}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <MicroLabel light={isLight} active={threadNeedsReply(activeThread)} className="h-6 px-2 py-0 text-[9px]">
                            {threadNeedsReply(activeThread)
                              ? labels.waitingThreads
                              : locale === 'ru'
                                ? 'Ответ не нужен'
                                : 'No reply needed'}
                          </MicroLabel>

                          {threadHasBooking(activeThread) ? (
                            <MicroLabel light={isLight} className="h-6 px-2 py-0 text-[9px]">
                              <CalendarClock className="size-3" />
                              {labels.scheduledThreads}
                            </MicroLabel>
                          ) : null}

                          {activeThread.isPriority ? (
                            <MicroLabel light={isLight} className="h-6 px-2 py-0 text-[9px]">
                              <Star className="size-3 fill-current" />
                              {labels.priorityOn}
                            </MicroLabel>
                          ) : null}

                          {threadHasFailedDelivery(activeThread) ? (
                            <MicroLabel light={isLight} className={cn('h-6 px-2 py-0 text-[9px]', isLight ? 'border-red-500/20 bg-red-500/10 text-red-600' : 'border-red-300/20 bg-red-300/10 text-red-200')}>
                              <AlertTriangle className="size-3" />
                              {locale === 'ru' ? 'Ошибка доставки' : 'Delivery issue'}
                            </MicroLabel>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          className={cn('mt-4 w-full justify-between', buttonBase(isLight))}
                          onClick={() => {
                            if (typeof window === 'undefined') return;
                            window.location.href = `/dashboard/clients?query=${encodeURIComponent(activeThread.clientName)}`;
                          }}
                        >
                          {labels.openProfile}
                          <ChevronRight className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <EmptyState text={labels.emptyThread} hint={labels.emptyThreadHint} light={isLight} />
                    )}
                  </Panel>

                  <Panel light={isLight} className="p-4">
                    <div className={cn('text-[11px] font-semibold uppercase tracking-[0.14em]', mutedText(isLight))}>
                      {labels.nextVisit}
                    </div>

                    {selectedBookingContext ? (
                      <div className="mt-3 space-y-3">
                        <div className={cn('rounded-[14px] border p-3', isLight ? 'border-[#eee1d6] bg-white' : 'border-white/[0.08] bg-white/[0.04]')}>
                          <div className="flex items-center justify-between gap-3">
                            <div className={cn('text-[14px] font-semibold', pageText(isLight))}>
                              {selectedBookingContext.date
                                ? formatPickerDateLabel(selectedBookingContext.date, locale)
                                : labels.notScheduled}
                            </div>
                            <ChevronRight className={cn('size-4', mutedText(isLight))} />
                          </div>
                          <div className={cn('mt-2 text-[12px] leading-5', mutedText(isLight))}>
                            {[selectedBookingContext.time, selectedBookingContext.service, selectedBookingContext.masterName]
                              .filter(Boolean)
                              .join(' · ')}
                          </div>
                        </div>

                        <button
                          type="button"
                          className={cn('w-full', buttonBase(isLight))}
                          disabled={!activeThread}
                          onClick={() => {
                            const fallbackPreset = quickTransferPresets[0];
                            if (fallbackPreset) applyQuickTransfer(fallbackPreset.date, fallbackPreset.time);
                          }}
                        >
                          <CalendarClock className="size-3.5" />
                          {labels.changeBooking}
                        </button>
                      </div>
                    ) : (
                      <div className="mt-3">
                        <div className={cn('text-[12px]', mutedText(isLight))}>{labels.notScheduled}</div>
                        <button
                          type="button"
                          className={cn('mt-3 w-full', buttonBase(isLight, true))}
                          disabled={!activeThread}
                          onClick={() => handleAssistantScenario('confirm')}
                        >
                          <CalendarPlus className="size-3.5" />
                          {locale === 'ru' ? 'Создать запись' : 'Create booking'}
                        </button>
                      </div>
                    )}
                  </Panel>

                  <Panel light={isLight} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className={cn('text-[11px] font-semibold uppercase tracking-[0.14em]', mutedText(isLight))}>
                        {labels.history}
                      </div>
                      <span className={cn('text-[10px] font-medium', mutedText(isLight))}>
                        {activeRelatedThreads.length > 1 ? `${activeRelatedThreads.length} ${locale === 'ru' ? 'чата' : 'chats'}` : ''}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2">
                      {(activeBookingContexts.length ? activeBookingContexts : selectedBookingContext ? [selectedBookingContext] : [])
                        .slice(0, 3)
                        .map((context) => (
                          <div key={context.id} className="grid grid-cols-[78px_minmax(0,1fr)] gap-3 text-[11px]">
                            <span className={mutedText(isLight)}>
                              {context.date ? formatDateLabel(context.date, locale) : '—'}
                            </span>
                            <span className={cn('truncate font-medium', pageText(isLight))}>
                              {context.service ?? (locale === 'ru' ? 'Запись' : 'Booking')}
                            </span>
                          </div>
                        ))}

                      {!activeBookingContexts.length && !selectedBookingContext ? (
                        <div className={cn('text-[12px]', mutedText(isLight))}>
                          {locale === 'ru' ? 'История появится после первой записи.' : 'History will appear after the first booking.'}
                        </div>
                      ) : null}
                    </div>
                  </Panel>

                  <Panel light={isLight} className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className={cn('text-[11px] font-semibold uppercase tracking-[0.14em]', mutedText(isLight))}>
                        {labels.notes}
                      </div>
                      <button
                        type="button"
                        className={cn('text-[10px] font-semibold', mutedText(isLight))}
                        onClick={() => handleAssistantScenario('clarify')}
                        disabled={!activeThread}
                      >
                        {locale === 'ru' ? 'Редактировать' : 'Edit'}
                      </button>
                    </div>

                    <p className={cn('mt-3 text-[12px] leading-5', mutedText(isLight))}>
                      {getThreadActiveAlert(activeThread)?.message ||
                        (selectedBookingContext?.service
                          ? locale === 'ru'
                            ? `Интерес к услуге: ${selectedBookingContext.service}. Канал: ${activeThread?.source ?? channelLabel(activeThread?.channel ?? 'Web')}.`
                            : `Interested in: ${selectedBookingContext.service}. Source: ${activeThread?.source ?? channelLabel(activeThread?.channel ?? 'Web')}.`
                          : assistantSummary.detail)}
                    </p>
                  </Panel>

                  <Panel light={isLight} className="p-4">
                    <div className={cn('text-[11px] font-semibold uppercase tracking-[0.14em]', mutedText(isLight))}>
                      {labels.quickActions}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        className={cn('h-auto min-h-11 justify-start px-3 py-2 text-left', buttonBase(isLight))}
                        disabled={!activeThread}
                        onClick={() => handleAssistantScenario('confirm')}
                      >
                        <CalendarPlus className="size-3.5" />
                        {locale === 'ru' ? 'Создать запись' : 'Create booking'}
                      </button>

                      <button
                        type="button"
                        className={cn('h-auto min-h-11 justify-start px-3 py-2 text-left', buttonBase(isLight))}
                        disabled={!activeThread}
                        onClick={() => handleApplyBotFlow('followup')}
                      >
                        <Bell className="size-3.5" />
                        {labels.sendReminder}
                      </button>

                      <button
                        type="button"
                        className={cn('h-auto min-h-11 justify-start px-3 py-2 text-left', buttonBase(isLight))}
                        disabled={!activeThread}
                        onClick={() => {
                          setComposerFlow(null);
                          setDraft(
                            locale === 'ru'
                              ? `${activeThread?.clientName ?? ''}, для вас есть свободное окно на этой неделе. Могу подобрать удобное время.`
                              : `${activeThread?.clientName ?? ''}, there is an available slot this week. I can find a convenient time for you.`,
                          );
                        }}
                      >
                        <Gift className="size-3.5" />
                        {labels.sendOffer}
                      </button>

                      <button
                        type="button"
                        className={cn('h-auto min-h-11 justify-start px-3 py-2 text-left', buttonBase(isLight))}
                        disabled={!activeThread}
                        onClick={handleExportThread}
                      >
                        <Archive className="size-3.5" />
                        {labels.export}
                      </button>
                    </div>
                  </Panel>
                </div>
              </aside>
            </div>
          </Card>
        </div>

        {contextMenuPortal}
      </main>
    </WorkspaceShell>
  );
}
