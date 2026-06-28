// app/dashboard/clients/page.tsx
'use client';

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  ArrowDown,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  Gift,
  Import,
  MessageCircle,
  MoreVertical,
  NotebookPen,
  Phone,
  Plus,
  Search,
  Send,
  Sparkles,
  Star,
  Tag,
  UserRound,
  Users2,
  Wallet,
  X,
} from 'lucide-react';

import { WorkspaceShell } from '@/components/shared/workspace-shell';
import { useOwnedWorkspaceData } from '@/hooks/use-owned-workspace-data';
import { useWorkspaceSection } from '@/hooks/use-workspace-section';
import { useAppearance } from '@/lib/appearance-context';
import { accentPalette } from '@/lib/appearance-palette';
import { type ClientBookingSummary, type ClientInsight, formatCurrency } from '@/lib/master-workspace';
import { cn } from '@/lib/utils';

type ClientFilter = 'all' | 'regular' | 'new' | 'sleeping' | 'vip';
type ClientSort = 'recent' | 'ltv' | 'name';
type DetailTab = 'history' | 'notes' | 'files';
type ClientNoteMap = Record<string, string>;
type ClientReminderMap = Record<string, { text: string; date: string; done?: boolean }>;
type ClientVipMap = Record<string, boolean>;
type ClientTaskMap = Record<string, boolean>;

type ClientPageItem = ClientInsight & {
  vip?: boolean;
  birthDate?: string;
  channels?: string[];
  loyalty?: number;
  tags?: string[];
};

const EMPTY_NOTES: ClientNoteMap = {};
const EMPTY_REMINDERS: ClientReminderMap = {};
const EMPTY_VIP: ClientVipMap = {};
const EMPTY_TASKS: ClientTaskMap = {};

function createId(prefix = 'client') {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeClient(client: ClientInsight, index: number): ClientPageItem {
  return {
    ...client,
    vip: (client as ClientPageItem).vip ?? client.favorite ?? index === 0,
    birthDate: (client as ClientPageItem).birthDate ?? ['12 мая', '21 мая', '7 июня', '18 июня'][index % 4],
    channels: (client as ClientPageItem).channels ?? [client.source || 'Web'],
    loyalty: (client as ClientPageItem).loyalty ?? Math.min(980, 360 + client.visits * 72 + Math.round(client.totalRevenue / 500)),
    tags: (client as ClientPageItem).tags ?? client.serviceList ?? [client.service].filter(Boolean),
  };
}

function createClient(locale: 'ru' | 'en', index: number): ClientPageItem {
  return {
    id: createId('client'),
    name: locale === 'ru' ? `Новый клиент ${index + 1}` : `New client ${index + 1}`,
    phone: '+7 999 000-00-00',
    lastVisit: new Date().toISOString(),
    nextVisit: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    visits: 0,
    averageCheck: 0,
    totalRevenue: 0,
    segment: 'new',
    favorite: false,
    note: locale === 'ru' ? 'Новый клиент. Добавьте заметку и предпочтения.' : 'New client. Add notes and preferences.',
    source: 'Web',
    service: locale === 'ru' ? 'Консультация' : 'Consultation',
    bookings: [],
    serviceList: [],
    activeBookingCount: 0,
    vip: false,
    birthDate: locale === 'ru' ? '12 мая' : 'May 12',
    channels: ['Web'],
    loyalty: 120,
    tags: [],
  };
}

function pageText(light: boolean) {
  return light ? 'text-[#111318]' : 'text-[#f4f5f7]';
}

function mutedText(light: boolean) {
  return light ? 'text-[#667085]' : 'text-[#9aa2af]';
}

function cardTone(light: boolean) {
  return light
    ? 'border-[#e6e9ef] bg-white shadow-[0_10px_26px_rgba(17,24,39,0.045)]'
    : 'border-white/[0.075] bg-[#17181b] shadow-[0_18px_52px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.025)]';
}

function panelTone(light: boolean) {
  return light ? 'border-[#e6e9ef] bg-[#f8fafc]' : 'border-white/[0.075] bg-[#15161a]';
}

function fieldTone(light: boolean) {
  return light
    ? 'border-[#dde2ea] bg-white text-[#101318] placeholder:text-[#98a2b3] focus:border-[#b9c2d0]'
    : 'border-white/[0.08] bg-[#202226] text-white placeholder:text-white/34 focus:border-white/18';
}

function dividerTone(light: boolean) {
  return light ? 'border-[#e6e9ef]' : 'border-white/[0.08]';
}

function ghostButton(light: boolean) {
  return light
    ? 'border-[#dde2ea] bg-white text-[#344054] hover:border-[#cbd5e1] hover:bg-[#f8fafc]'
    : 'border-white/[0.085] bg-white/[0.035] text-white/70 hover:border-white/[0.16] hover:bg-white/[0.07] hover:text-white';
}

function primaryStyle(color: string): CSSProperties {
  return { background: color, borderColor: color, color: '#fff' };
}

function softAccentStyle(color: string, light: boolean): CSSProperties {
  return {
    background: light ? `color-mix(in srgb, ${color} 6%, #ffffff)` : '#1b1d21',
    borderColor: light ? `color-mix(in srgb, ${color} 46%, #d8dee8)` : `color-mix(in srgb, ${color} 44%, rgba(255,255,255,0.12))`,
    boxShadow: light ? '0 12px 28px rgba(17,24,39,0.065), inset 3px 0 0 var(--accent, #79ad6b)' : '0 18px 42px rgba(0,0,0,0.24), inset 3px 0 0 var(--accent, #79ad6b)',
  } as CSSProperties;
}

function formatDate(locale: 'ru' | 'en', value?: string) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' }).format(parsed);
}

function daysAgo(locale: 'ru' | 'en', value?: string) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const diff = Math.max(0, Math.round((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24)));
  if (locale === 'en') return diff === 0 ? 'today' : `${diff} days ago`;
  return diff === 0 ? 'сегодня' : `${diff} дн. назад`;
}

function MetricCard({ icon, label, value, caption, light }: { icon: ReactNode; label: string; value: ReactNode; caption: string; light: boolean }) {
  return (
    <div className={cn('rounded-[16px] border p-4', cardTone(light))}>
      <div className="flex items-center gap-4">
        <div className={cn('grid size-12 place-items-center rounded-full border', light ? 'border-black/[0.06] bg-black/[0.025] text-black/42' : 'border-white/[0.065] bg-white/[0.04] text-white/42')}>{icon}</div>
        <div className="min-w-0">
          <div className={cn('text-[12px]', mutedText(light))}>{label}</div>
          <div className={cn('mt-1 text-[24px] font-semibold leading-none tracking-tight', pageText(light))}>{value}</div>
          <div className="mt-2 text-[11px] text-green-400">{caption}</div>
        </div>
      </div>
    </div>
  );
}

function Avatar({ name, large = false, accentColor }: { name: string; large?: boolean; accentColor: string }) {
  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className={cn('grid shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 font-semibold text-white shadow-inner', large ? 'size-20 text-[22px]' : 'size-11 text-[13px]')} style={{ background: `linear-gradient(135deg, ${accentColor}, #253044)` }}>
      {initials || 'К'}
    </div>
  );
}

function StatusPill({ children, color = 'green' }: { children: ReactNode; color?: 'green' | 'blue' | 'orange' | 'gray' | 'gold' }) {
  const tone = {
    green: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-500',
    blue: 'border-sky-500/25 bg-sky-500/10 text-sky-500',
    orange: 'border-orange-500/25 bg-orange-500/10 text-orange-500',
    gold: 'border-amber-500/25 bg-amber-500/10 text-amber-500',
    gray: 'border-slate-500/20 bg-slate-500/10 text-slate-500',
  }[color];
  return <span className={cn('inline-flex h-6 items-center rounded-full border px-2 text-[10.5px] font-semibold', tone)}>{children}</span>;
}


type SelectOption<T extends string> = { value: T; label: string };

function CustomSelect<T extends string>({ value, options, onChange, light, className }: { value: T; options: SelectOption<T>[]; onChange: (value: T) => void; light: boolean; className?: string }) {
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.value === value) ?? options[0];
  return (
    <div className={cn('relative', className)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}>
      <button type="button" onClick={() => setOpen((state) => !state)} className={cn('inline-flex h-9 w-full items-center justify-between gap-2 rounded-[11px] border px-3 text-[12px] font-semibold transition-colors', ghostButton(light))} aria-haspopup="listbox" aria-expanded={open}>
        <span className="truncate">{current?.label}</span>
        <ChevronDown className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open ? (
        <div className={cn('absolute left-0 top-[calc(100%+6px)] z-[75] min-w-full overflow-hidden rounded-[12px] border p-1 shadow-[0_18px_48px_rgba(0,0,0,0.22)]', light ? 'border-[#dfe4ec] bg-white text-[#111318]' : 'border-white/[0.12] bg-[#1b1c20] text-white')} role="listbox">
          {options.map((option) => (
            <button key={option.value} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(option.value); setOpen(false); }} className={cn('flex h-9 w-full items-center justify-between rounded-[9px] px-3 text-left text-[12px] font-semibold transition-colors', option.value === value ? (light ? 'bg-[#f1f5ea] text-[#2f6b2f]' : 'bg-[#26351f] text-[#b5e4a4]') : light ? 'text-[#344054] hover:bg-[#f5f7fa]' : 'text-white/72 hover:bg-white/[0.06] hover:text-white')} role="option" aria-selected={option.value === value}>
              <span>{option.label}</span>
              {option.value === value ? <Check className="size-4" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MiniToast({ message, light }: { message: string; light: boolean }) {
  if (!message) return null;
  return (
    <div className={cn('fixed bottom-5 right-6 z-[80] rounded-[12px] border px-4 py-3 text-[12px] font-semibold shadow-[0_16px_44px_rgba(0,0,0,0.24)]', light ? 'border-[#e6e9ef] bg-white text-[#111318]' : 'border-white/[0.1] bg-[#181a1f] text-white')}>
      {message}
    </div>
  );
}

export default function ClientsPage() {
  const { hasHydrated, ownedProfile, dataset, locale } = useOwnedWorkspaceData();
  const { resolvedTheme } = useTheme();
  const { settings } = useAppearance();
  const [mounted, setMounted] = useState(false);
  const initialClients = useMemo(() => (dataset?.clients ?? []).map(normalizeClient), [dataset?.clients]);
  const [clients, setClients] = useWorkspaceSection<ClientPageItem[]>('clients', initialClients);
  const [notes, setNotes] = useWorkspaceSection<ClientNoteMap>('clientNotes', EMPTY_NOTES);
  const [reminders, setReminders] = useWorkspaceSection<ClientReminderMap>('clientReminders', EMPTY_REMINDERS);
  const [vip, setVip] = useWorkspaceSection<ClientVipMap>('clientVip', EMPTY_VIP);
  const [tasks, setTasks] = useWorkspaceSection<ClientTaskMap>('clientTasks', EMPTY_TASKS);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ClientFilter>('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sort, setSort] = useState<ClientSort>('recent');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('history');
  const [showAllBirthdays, setShowAllBirthdays] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);
  const [toast, setToast] = useState('');

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!hasHydrated) return;
    if (clients.length || !initialClients.length) return;
    setClients(initialClients);
  }, [clients.length, hasHydrated, initialClients, setClients]);
  useEffect(() => {
    if (!clients.length) {
      setSelectedClientId(null);
      return;
    }
    if (!selectedClientId || !clients.some((client) => client.id === selectedClientId)) setSelectedClientId(clients[0].id);
  }, [clients, selectedClientId]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => setVisibleCount(8), [filter, query, sort, sourceFilter]);

  const isLight = mounted ? resolvedTheme === 'light' : false;
  const accentColor = accentPalette[settings.accentTone]?.solid ?? '#79ad6b';
  const copy = locale === 'ru'
    ? {
        title: 'Клиенты', subtitle: 'Управляйте клиентской базой, сегментами и историей визитов.', setupTitle: 'Профиль ещё не создан', setupText: 'Создайте профиль мастера, чтобы открыть CRM.', setupButton: 'Создать профиль', total: 'Всего клиентов', active: 'Активные', newMonth: 'Новые за месяц', ltv: 'LTV средний', export: 'Экспорт базы', import: 'Импорт клиентов', add: 'Клиент', all: 'Все клиенты', regular: 'Постоянные', new: 'Новые', risk: 'Риск оттока', vip: 'VIP', search: 'Поиск по имени, телефону или заметкам...', source: 'Источник', tags: 'Метки', segment: 'Сегмент', moreFilters: 'Ещё фильтры', sort: 'Сортировка', newest: 'Новые сверху', byRevenue: 'По выручке', byName: 'По имени', client: 'Клиент', lastVisit: 'Последний визит', nextVisit: 'Следующая запись', average: 'Средний чек', visits: 'Визитов', showMore: 'Показать ещё клиентов', call: 'Позвонить', write: 'Написать', book: 'Записать', note: 'Заметка', history: 'История', notes: 'Заметки', files: 'Файлы', favoriteServices: 'Любимые услуги', loyalty: 'Лояльность', preferences: 'Предпочтения', nextBooking: 'Следующая запись', reminders: 'Напоминания', recommend: 'Рекомендовать услугу', birthdays: 'Ближайшие дни рождения', tasks: 'Задачи', activity: 'Активность', showAll: 'Смотреть все', done: 'Готово', noClients: 'Клиенты не найдены', birthdayText: 'Поздравить с днём рождения', remindVisit: 'Напомнить о записи', sendOffer: 'Отправить предложение по уходу',
      }
    : {
        title: 'Clients', subtitle: 'Manage client base, segments, and visit history.', setupTitle: 'Profile is not created yet', setupText: 'Create a master profile to open CRM.', setupButton: 'Create profile', total: 'Total clients', active: 'Active', newMonth: 'New this month', ltv: 'Avg LTV', export: 'Export base', import: 'Import clients', add: 'Client', all: 'All clients', regular: 'Regular', new: 'New', risk: 'Churn risk', vip: 'VIP', search: 'Search name, phone, or notes...', source: 'Source', tags: 'Tags', segment: 'Segment', moreFilters: 'More filters', sort: 'Sort', newest: 'Newest first', byRevenue: 'By revenue', byName: 'By name', client: 'Client', lastVisit: 'Last visit', nextVisit: 'Next booking', average: 'Average check', visits: 'Visits', showMore: 'Show more clients', call: 'Call', write: 'Write', book: 'Book', note: 'Note', history: 'History', notes: 'Notes', files: 'Files', favoriteServices: 'Favorite services', loyalty: 'Loyalty', preferences: 'Preferences', nextBooking: 'Next booking', reminders: 'Reminders', recommend: 'Recommend service', birthdays: 'Upcoming birthdays', tasks: 'Tasks', activity: 'Activity', showAll: 'View all', done: 'Done', noClients: 'No clients found', birthdayText: 'Send birthday greeting', remindVisit: 'Remind about booking', sendOffer: 'Send care offer',
      };

  const enrichedClients = useMemo(() => {
    return clients.map((client) => ({
      ...client,
      note: notes[client.id] ?? notes[client.phone] ?? client.note,
      vip: vip[client.id] ?? vip[client.phone] ?? client.vip,
    }));
  }, [clients, notes, vip]);

  const sources = useMemo(() => Array.from(new Set(enrichedClients.map((client) => client.source).filter(Boolean))), [enrichedClients]);
  const filteredClients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = enrichedClients.filter((client) => {
      const byQuery = !normalized || [client.name, client.phone, client.note, client.service, client.source, ...(client.tags ?? [])].some((value) => value.toLowerCase().includes(normalized));
      const byFilter = filter === 'all' ? true : filter === 'vip' ? client.vip : filter === 'sleeping' ? client.segment === 'sleeping' : client.segment === filter;
      const bySource = sourceFilter === 'all' || client.source === sourceFilter;
      return byQuery && byFilter && bySource;
    });

    return [...filtered].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name, locale === 'ru' ? 'ru' : 'en');
      if (sort === 'ltv') return b.totalRevenue - a.totalRevenue;
      return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
    });
  }, [enrichedClients, filter, locale, query, sort, sourceFilter]);

  const selectedClient = enrichedClients.find((client) => client.id === selectedClientId) ?? filteredClients[0] ?? enrichedClients[0] ?? null;
  const totalRevenue = enrichedClients.reduce((sum, client) => sum + client.totalRevenue, 0);
  const avgLtv = enrichedClients.length ? Math.round(totalRevenue / enrichedClients.length) : 0;
  const activeClients = enrichedClients.filter((client) => client.segment !== 'sleeping').length;
  const newClients = enrichedClients.filter((client) => client.segment === 'new').length;

  const birthdayClients = useMemo(() => enrichedClients.slice(0, showAllBirthdays ? 6 : 2), [enrichedClients, showAllBirthdays]);

  function addClient() {
    const created = createClient(locale, clients.length);
    setClients((current) => [created, ...current]);
    setSelectedClientId(created.id);
    setToast(locale === 'ru' ? 'Клиент добавлен' : 'Client added');
  }

  function importClients() {
    const imported = [createClient(locale, clients.length), createClient(locale, clients.length + 1)].map((client, index) => ({
      ...client,
      name: locale === 'ru' ? ['Алёна Никитина', 'Марина Белова'][index] : ['Alena Nikitina', 'Marina Belova'][index],
      source: index === 0 ? 'TG' : 'VK',
      segment: index === 0 ? 'regular' : 'new',
    } as ClientPageItem));
    setClients((current) => [...imported, ...current]);
    setSelectedClientId(imported[0].id);
    setToast(locale === 'ru' ? 'Импортировано 2 клиента' : 'Imported 2 clients');
  }

  function updateClient(id: string, patch: Partial<ClientPageItem>) {
    setClients((current) => current.map((client) => (client.id === id ? { ...client, ...patch } : client)));
  }

  function toggleVip(client: ClientPageItem) {
    const next = !client.vip;
    setVip((current) => ({ ...current, [client.id]: next, [client.phone]: next }));
    setToast(next ? 'VIP включён' : 'VIP снят');
  }

  function exportClients() {
    const payload = JSON.stringify(enrichedClients, null, 2);
    const blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'clickbook-clients.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setToast(locale === 'ru' ? 'Экспорт базы готов' : 'Client export ready');
  }

  function callClient(client: ClientPageItem) {
    window.location.href = `tel:${client.phone.replace(/\s/g, '')}`;
    setToast(`${copy.call}: ${client.name}`);
  }

  function writeClient(client: ClientPageItem) {
    setDetailTab('notes');
    setNotes((current) => ({ ...current, [client.id]: current[client.id] ?? client.note ?? '' }));
    setToast(`${copy.write}: ${client.name}`);
  }

  function bookClient(client: ClientPageItem) {
    const date = new Date(Date.now() + 86400000 * 3).toISOString();
    updateClient(client.id, { nextVisit: date, activeBookingCount: (client.activeBookingCount ?? 0) + 1 });
    setToast(locale === 'ru' ? 'Запись создана' : 'Booking created');
  }

  function action(label: string) {
    setToast(label);
  }

  if (!hasHydrated) return <WorkspaceShell><main className="min-h-screen" /></WorkspaceShell>;

  if (!ownedProfile) {
    return (
      <WorkspaceShell>
        <main className={cn('min-h-screen px-6 py-8', isLight ? 'bg-[#f7f8fb]' : 'bg-[#101114]')}>
          <div className={cn('mx-auto max-w-xl rounded-[20px] border p-8 text-center', cardTone(isLight))}>
            <h1 className={cn('text-2xl font-semibold', pageText(isLight))}>{copy.setupTitle}</h1>
            <p className={cn('mt-2 text-sm', mutedText(isLight))}>{copy.setupText}</p>
            <Link href="/dashboard/profile" className="mt-6 inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold" style={primaryStyle(accentColor)}>{copy.setupButton}</Link>
          </div>
        </main>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
      <main className={cn('min-h-screen px-6 pb-8 pt-5', isLight ? 'bg-[#f7f8fb]' : 'bg-[#101114]')}>
        <div className="mx-auto max-w-[1660px] space-y-5">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className={cn('text-[30px] font-semibold tracking-tight', pageText(isLight))}>{copy.title}</h1>
              <p className={cn('mt-1 text-[13px]', mutedText(isLight))}>{copy.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={exportClients} className={cn('inline-flex h-10 items-center gap-2 rounded-[12px] border px-4 text-[12px] font-semibold', ghostButton(isLight))}><Download className="size-4" />{copy.export}</button>
              <button type="button" onClick={importClients} className={cn('inline-flex h-10 items-center gap-2 rounded-[12px] border px-4 text-[12px] font-semibold', ghostButton(isLight))}><Import className="size-4" />{copy.import}</button>
              <button type="button" onClick={addClient} className="inline-flex h-10 items-center gap-2 rounded-[12px] border px-4 text-[12px] font-semibold" style={primaryStyle(accentColor)}><Plus className="size-4" />{copy.add}<ChevronDown className="size-4" /></button>
            </div>
          </header>

          <section className="grid gap-4 xl:grid-cols-4">
            <MetricCard light={isLight} icon={<Users2 className="size-5" />} label={copy.total} value={enrichedClients.length} caption="↑ 28 за месяц" />
            <MetricCard light={isLight} icon={<UserRound className="size-5" />} label={copy.active} value={activeClients} caption="67% от базы" />
            <MetricCard light={isLight} icon={<Sparkles className="size-5" />} label={copy.newMonth} value={newClients} caption="+12% к прошлому" />
            <MetricCard light={isLight} icon={<Wallet className="size-5" />} label={copy.ltv} value={formatCurrency(avgLtv, locale)} caption="+8% к прошлому" />
          </section>

          <section className="grid items-start gap-4 xl:grid-cols-[390px_minmax(560px,1fr)_360px]">
            <aside className={cn('overflow-hidden rounded-[18px] border', cardTone(isLight))}>
              <div className={cn('border-b p-4', dividerTone(isLight))}>
                <h2 className={cn('text-[17px] font-semibold', pageText(isLight))}>{copy.all} <span className={cn('ml-1 rounded-full px-2 py-0.5 text-[12px]', isLight ? 'bg-black/[0.055] text-black/55' : 'bg-white/[0.07] text-white/55')}>{enrichedClients.length}</span></h2>
                <label className={cn('mt-4 flex h-10 items-center gap-2 rounded-[12px] border px-3', fieldTone(isLight))}>
                  <Search className="size-4 opacity-55" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} className="min-w-0 flex-1 bg-transparent text-[12px] outline-none" />
                  {query ? <button type="button" onClick={() => setQuery('')}><X className="size-4 opacity-55" /></button> : null}
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(['all', 'regular', 'new', 'sleeping', 'vip'] as ClientFilter[]).map((item) => (
                    <button key={item} type="button" onClick={() => setFilter(item)} className={cn('h-8 rounded-[10px] border px-3 text-[11px] font-semibold', filter === item ? 'text-white' : ghostButton(isLight))} style={filter === item ? primaryStyle(accentColor) : undefined}>
                      {item === 'all' ? copy.all : item === 'regular' ? copy.regular : item === 'new' ? copy.new : item === 'sleeping' ? copy.risk : copy.vip}
                    </button>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <CustomSelect<string>
                    value={sourceFilter}
                    onChange={setSourceFilter}
                    light={isLight}
                    options={[{ value: 'all', label: copy.source + ': Все' }, ...sources.map((source) => ({ value: source, label: source }))]}
                  />
                  <CustomSelect<ClientSort>
                    value={sort}
                    onChange={setSort}
                    light={isLight}
                    options={[{ value: 'recent', label: copy.newest }, { value: 'ltv', label: copy.byRevenue }, { value: 'name', label: copy.byName }]}
                  />
                </div>
              </div>

              <div className="max-h-[690px] overflow-y-auto">
                {filteredClients.slice(0, visibleCount).map((client) => {
                  const active = selectedClient?.id === client.id;
                  const isVip = Boolean(client.vip);
                  return (
                    <button key={client.id} type="button" onClick={() => { setSelectedClientId(client.id); setDetailTab('history'); }} className={cn('flex w-full items-center gap-3 border-b p-3 text-left transition-colors', isLight ? 'border-[#e9edf3]' : 'border-white/[0.06]', active ? '' : isLight ? 'hover:bg-black/[0.025]' : 'hover:bg-white/[0.035]')} style={active ? softAccentStyle(accentColor, isLight) : undefined}>
                      <Avatar name={client.name} accentColor={accentColor} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <div className={cn('truncate text-[13px] font-semibold', pageText(isLight))}>{client.name}</div>
                          {isVip ? <StatusPill color="gold">VIP</StatusPill> : null}
                        </div>
                        <div className={cn('mt-0.5 text-[11px]', mutedText(isLight))}>{client.phone}</div>
                        <div className={cn('mt-1 truncate text-[11px]', mutedText(isLight))}>{daysAgo(locale, client.lastVisit)} • {client.source}</div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className={cn('text-[12px] font-semibold', pageText(isLight))}>LTV {formatCurrency(client.totalRevenue, locale)}</div>
                        <div className={cn('mt-1 text-[11px]', mutedText(isLight))}>{client.visits} визитов</div>
                      </div>
                      <span className={cn('size-2 rounded-full', client.segment === 'sleeping' ? 'bg-orange-400' : client.segment === 'new' ? 'bg-blue-400' : 'bg-green-400')} />
                    </button>
                  );
                })}
                {!filteredClients.length ? <div className={cn('p-8 text-center text-[13px]', mutedText(isLight))}>{copy.noClients}</div> : null}
              </div>
              <div className="p-4">
                {visibleCount < filteredClients.length ? <button type="button" onClick={() => setVisibleCount((count) => Math.min(count + 6, filteredClients.length))} className={cn('h-11 w-full rounded-[12px] border text-[12px] font-semibold', ghostButton(isLight))}>{copy.showMore} <ArrowDown className="ml-1 inline size-4" /></button> : <div className={cn('py-3 text-center text-[12px]', mutedText(isLight))}>{locale === 'ru' ? 'Показаны все клиенты' : 'All clients shown'}</div>}
              </div>
            </aside>

            <section className={cn('min-w-0 overflow-hidden rounded-[18px] border', cardTone(isLight))}>
              {selectedClient ? (
                <>
                  <div className={cn('flex flex-wrap items-start justify-between gap-4 border-b p-5', dividerTone(isLight))}>
                    <div className="flex min-w-0 items-center gap-4">
                      <Avatar name={selectedClient.name} large accentColor={accentColor} />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className={cn('truncate text-[24px] font-semibold', pageText(isLight))}>{selectedClient.name}</h2>
                          {selectedClient.vip ? <StatusPill color="gold">VIP</StatusPill> : null}
                          <button type="button" onClick={() => toggleVip(selectedClient)} className="text-yellow-300"><Star className={cn('size-5', selectedClient.vip && 'fill-current')} /></button>
                        </div>
                        <div className={cn('mt-2 flex flex-wrap items-center gap-3 text-[12px]', mutedText(isLight))}>
                          <span>☎ {selectedClient.phone}</span><span>•</span><span>Источник: {selectedClient.source}</span><span>•</span><span>День рождения: {selectedClient.birthDate}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" onClick={() => callClient(selectedClient)} className={cn('h-8 rounded-[10px] border px-3 text-[12px] font-semibold', ghostButton(isLight))}><Phone className="mr-1 inline size-4" />{copy.call}</button>
                          <button type="button" onClick={() => writeClient(selectedClient)} className={cn('h-8 rounded-[10px] border px-3 text-[12px] font-semibold', ghostButton(isLight))}><MessageCircle className="mr-1 inline size-4" />{copy.write}</button>
                          <button type="button" onClick={() => bookClient(selectedClient)} className="h-8 rounded-[10px] border px-3 text-[12px] font-semibold" style={primaryStyle(accentColor)}><CalendarDays className="mr-1 inline size-4" />{copy.book}</button>
                        </div>
                      </div>
                    </div>
                    <button type="button" onClick={() => { toggleVip(selectedClient); action(locale === 'ru' ? 'VIP переключён' : 'VIP toggled'); }} className={cn('grid size-9 place-items-center rounded-[11px] border', ghostButton(isLight))}><MoreVertical className="size-4" /></button>
                  </div>

                  <div className={cn('grid gap-0 border-b md:grid-cols-4', dividerTone(isLight))}>
                    <div className="p-5"><div className={cn('text-[12px]', mutedText(isLight))}>{copy.loyalty}</div><div className={cn('mt-2 text-[16px] font-semibold', pageText(isLight))}>Высокая</div><div className={cn('mt-3 h-1.5 rounded-full', isLight ? 'bg-black/10' : 'bg-white/10')}><div className="h-full rounded-full" style={{ width: `${Math.min(100, selectedClient.loyalty ?? 0) / 10}%`, background: accentColor }} /></div><div className={cn('mt-2 text-[11px]', mutedText(isLight))}>{selectedClient.loyalty} баллов</div></div>
                    <div className={cn('border-l p-5', dividerTone(isLight))}><div className={cn('text-[12px]', mutedText(isLight))}>Общий LTV</div><div className={cn('mt-2 text-[18px] font-semibold', pageText(isLight))}>{formatCurrency(selectedClient.totalRevenue, locale)}</div><div className={cn('mt-1 text-[11px]', mutedText(isLight))}>{selectedClient.visits} визитов</div></div>
                    <div className={cn('border-l p-5', dividerTone(isLight))}><div className={cn('text-[12px]', mutedText(isLight))}>{copy.average}</div><div className={cn('mt-2 text-[18px] font-semibold', pageText(isLight))}>{formatCurrency(selectedClient.averageCheck, locale)}</div><div className={cn('mt-1 text-[11px]', isLight ? 'text-emerald-700' : 'text-emerald-400')}>↑ 12% к среднему</div></div>
                    <div className={cn('border-l p-5', dividerTone(isLight))}><div className={cn('text-[12px]', mutedText(isLight))}>Первая запись</div><div className={cn('mt-2 text-[18px] font-semibold', pageText(isLight))}>{formatDate(locale, selectedClient.bookings?.[selectedClient.bookings.length - 1]?.date || selectedClient.lastVisit)}</div><div className={cn('mt-1 text-[11px]', mutedText(isLight))}>1 год 5 месяцев</div></div>
                  </div>

                  <div className="grid gap-4 p-5 md:grid-cols-2">
                    <div className={cn('rounded-[15px] border p-4', panelTone(isLight))}>
                      <h3 className={cn('text-[14px] font-semibold', pageText(isLight))}>{copy.preferences}</h3>
                      <ul className={cn('mt-3 space-y-1 text-[12px]', mutedText(isLight))}>
                        <li>• Любит точность и аккуратность</li>
                        <li>• Предпочитает натуральные оттенки</li>
                        <li>• Не любит яркие укладки</li>
                        <li>• Аллергии: нет</li>
                      </ul>
                    </div>
                    <div className={cn('rounded-[15px] border p-4', panelTone(isLight))}>
                      <h3 className={cn('text-[14px] font-semibold', pageText(isLight))}>{copy.favoriteServices}</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(selectedClient.tags?.length ? selectedClient.tags : [selectedClient.service]).map((tag) => <span key={tag} className={cn('rounded-full border px-3 py-1 text-[11px]', ghostButton(isLight))}>{tag}</span>)}
                      </div>
                    </div>
                    <div className={cn('rounded-[15px] border p-4', panelTone(isLight))}>
                      <h3 className={cn('text-[14px] font-semibold', pageText(isLight))}>Последняя услуга</h3>
                      <div className="mt-3 flex items-center gap-3"><div className={cn('grid size-12 place-items-center rounded-[12px] border', isLight ? 'border-black/10 bg-black/[0.035] text-black/45' : 'border-white/10 bg-white/5')} ><Tag className="size-5" /></div><div><div className={cn('text-[13px] font-semibold', pageText(isLight))}>{selectedClient.service}</div><div className={cn('mt-1 text-[11px]', mutedText(isLight))}>{formatDate(locale, selectedClient.lastVisit)}</div></div><div className={cn('ml-auto text-[13px] font-semibold', pageText(isLight))}>{formatCurrency(selectedClient.averageCheck, locale)}</div></div>
                    </div>
                    <div className={cn('rounded-[15px] border p-4', panelTone(isLight))}>
                      <h3 className={cn('text-[14px] font-semibold', pageText(isLight))}>{copy.nextBooking}</h3>
                      <div className="mt-3 flex items-center gap-3"><div className={cn('rounded-[12px] border px-3 py-2 text-center', isLight ? 'border-emerald-500/20 bg-emerald-50 text-emerald-700' : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300')}><div className="text-[11px]">Пн</div><div className="text-[24px] font-semibold">23</div><div className="text-[10px]">мая</div></div><div><div className={cn('text-[13px] font-semibold', pageText(isLight))}>{selectedClient.nextVisit ? selectedClient.service : '—'}</div><div className={cn('mt-1 text-[11px]', mutedText(isLight))}>{selectedClient.nextVisit ? formatDate(locale, selectedClient.nextVisit) : 'Нет записи'}</div></div><StatusPill color="green">Подтверждена</StatusPill></div>
                    </div>
                  </div>

                  <div className={cn('border-t px-5', dividerTone(isLight))}>
                    <div className="flex gap-4">
                      {(['history', 'notes', 'files'] as DetailTab[]).map((item) => (
                        <button key={item} type="button" onClick={() => setDetailTab(item)} className={cn('relative h-12 text-[13px] font-semibold', detailTab === item ? pageText(isLight) : mutedText(isLight))}>{item === 'history' ? copy.history : item === 'notes' ? `${copy.notes}  ${notes[selectedClient.id] ? '1' : ''}` : copy.files}{detailTab === item ? <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full" style={{ background: accentColor }} /> : null}</button>
                      ))}
                    </div>
                  </div>
                  <div className="px-5 pb-5">
                    {detailTab === 'history' ? (
                      <div className={cn('overflow-hidden rounded-[14px] border', panelTone(isLight))}>
                        {(selectedClient.bookings?.length ? selectedClient.bookings : makeFallbackBookings(selectedClient)).slice(0, 5).map((booking) => <HistoryRow key={booking.id} booking={booking} locale={locale} light={isLight} />)}
                        <button type="button" onClick={() => action('История загружена')} className={cn('h-10 w-full border-t text-[12px] font-semibold', dividerTone(isLight), mutedText(isLight))}>Показать всю историю визитов</button>
                      </div>
                    ) : detailTab === 'notes' ? (
                      <textarea value={notes[selectedClient.id] ?? selectedClient.note} onChange={(event) => setNotes((current) => ({ ...current, [selectedClient.id]: event.target.value, [selectedClient.phone]: event.target.value }))} className={cn('h-40 w-full resize-none rounded-[14px] border p-4 text-[13px] leading-5 outline-none', fieldTone(isLight))} />
                    ) : (
                      <div className={cn('rounded-[14px] border p-6 text-center text-[13px]', panelTone(isLight), mutedText(isLight))}>Файлы и вложения клиента появятся здесь.</div>
                    )}
                  </div>
                </>
              ) : <div className={cn('p-8 text-center text-[13px]', mutedText(isLight))}>{copy.noClients}</div>}
            </section>

            <aside className="space-y-4">
              {selectedClient ? (
                <>
                  <SideCard title="Напомнить о визите" light={isLight}>
                    <div className={cn('text-[13px] font-semibold', pageText(isLight))}>{selectedClient.name} не была 3 дня.</div>
                    <p className={cn('mt-1 text-[12px]', mutedText(isLight))}>Пора напомнить о следующей процедуре.</p>
                    <button type="button" onClick={() => { setReminders((current) => ({ ...current, [selectedClient.id]: { text: copy.remindVisit, date: 'сегодня' } })); setToast('Напоминание создано'); }} className={cn('mt-3 h-9 rounded-[10px] border px-3 text-[12px] font-semibold', ghostButton(isLight))}><Send className="mr-1 inline size-4" />Напомнить</button>
                  </SideCard>
                  <SideCard title={copy.recommend} light={isLight} badge="Персонально">
                    <div className="flex gap-3"><div className={cn('grid size-12 place-items-center rounded-[12px] border', isLight ? 'border-black/10 bg-black/[0.035] text-black/45' : 'border-white/10 bg-white/5')} ><Sparkles className={cn('size-5', isLight ? 'text-emerald-600' : 'text-emerald-300')} /></div><div><div className={cn('text-[13px] font-semibold', pageText(isLight))}>Кератиновое восстановление</div><p className={cn('mt-1 text-[12px]', mutedText(isLight))}>Подойдёт для поддержания здоровья волос.</p></div></div>
                    <button type="button" onClick={() => { setNotes((current) => ({ ...current, [selectedClient.id]: `${current[selectedClient.id] ?? selectedClient.note ?? ''}\nРекомендована услуга: Кератиновое восстановление`.trim() })); setToast('Рекомендация добавлена'); }} className={cn('mt-3 h-9 rounded-[10px] border px-3 text-[12px] font-semibold', ghostButton(isLight))}>Рекомендовать</button>
                  </SideCard>
                  <SideCard title={copy.birthdays} light={isLight} action={<button type="button" onClick={() => setShowAllBirthdays((value) => !value)} className={cn('text-[11px] font-semibold', isLight ? 'text-emerald-700' : 'text-emerald-400')}>{copy.showAll}</button>}>
                    <div className="space-y-3">
                      {birthdayClients.map((client) => <div key={client.id} className="flex items-center gap-3"><Avatar name={client.name} accentColor={accentColor} /><div className="min-w-0 flex-1"><div className={cn('truncate text-[12px] font-semibold', pageText(isLight))}>{client.name}</div><div className={cn('text-[11px]', mutedText(isLight))}>{client.birthDate}</div></div><div className={cn('text-[11px]', mutedText(isLight))}>через 22 дня</div></div>)}
                    </div>
                  </SideCard>
                  <SideCard title={copy.tasks} light={isLight}>
                    <div className="space-y-3">
                      {[
                        ['birthday', copy.birthdayText, 'сегодня'],
                        ['booking', copy.remindVisit, 'завтра'],
                        ['offer', copy.sendOffer, '12 мая'],
                      ].map(([id, label, date]) => (
                        <label key={id} className="flex cursor-pointer items-center gap-3 text-[12px]">
                          <input type="checkbox" checked={Boolean(tasks[id])} onChange={(event) => setTasks((current) => ({ ...current, [id]: event.target.checked }))} className="size-4 rounded" />
                          <span className={cn('flex-1', tasks[id] ? 'line-through opacity-45' : pageText(isLight))}>{label}</span>
                          <span className={mutedText(isLight)}>{date}</span>
                        </label>
                      ))}
                    </div>
                  </SideCard>
                  <SideCard title={copy.activity} light={isLight}>
                    <ActivityRow dot="bg-green-400" time="08.05" text="Посетила услугу" amount={formatCurrency(selectedClient.averageCheck, locale)} light={isLight} />
                    <ActivityRow dot="bg-yellow-400" time="05.05" text="Оставила отзыв" amount="★★★★★" light={isLight} />
                    <ActivityRow dot="bg-blue-400" time="01.05" text="Отправлено напоминание" amount="" light={isLight} />
                    <button type="button" onClick={() => action('Активность открыта')} className={cn('mt-3 h-10 w-full rounded-[11px] border text-[12px] font-semibold', ghostButton(isLight))}>Показать всю активность</button>
                  </SideCard>
                </>
              ) : null}
            </aside>
          </section>
        </div>
        <MiniToast message={toast} light={isLight} />
      </main>
    </WorkspaceShell>
  );
}

function makeFallbackBookings(client: ClientPageItem): ClientBookingSummary[] {
  return [
    { id: `${client.id}-b1`, code: '#CB-DEMO1', service: client.service, services: [client.service], date: client.lastVisit, time: '14:00', status: 'completed', source: client.source },
    { id: `${client.id}-b2`, code: '#CB-DEMO2', service: client.serviceList?.[1] || 'Укладка', services: [client.serviceList?.[1] || 'Укладка'], date: new Date(Date.now() - 86400000 * 24).toISOString(), time: '12:30', status: 'completed', source: client.source },
    { id: `${client.id}-b3`, code: '#CB-DEMO3', service: client.serviceList?.[2] || 'Стрижка', services: [client.serviceList?.[2] || 'Стрижка'], date: new Date(Date.now() - 86400000 * 68).toISOString(), time: '10:00', status: 'completed', source: client.source },
  ];
}

function HistoryRow({ booking, locale, light }: { booking: ClientBookingSummary; locale: 'ru' | 'en'; light: boolean }) {
  return (
    <div className={cn('grid grid-cols-[120px_1fr_120px] gap-3 border-b px-4 py-3 text-[12px] last:border-b-0', light ? 'border-[#e9edf3]' : 'border-white/[0.07]')}>
      <span className={mutedText(light)}>{formatDate(locale, booking.date)}</span>
      <span className={pageText(light)}>{booking.service}</span>
      <span className={cn('text-right', mutedText(light))}>{booking.source || 'Web'}</span>
    </div>
  );
}

function SideCard({ title, light, children, action, badge }: { title: string; light: boolean; children: ReactNode; action?: ReactNode; badge?: string }) {
  return (
    <div className={cn('rounded-[18px] border p-4', cardTone(light))}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className={cn('text-[15px] font-semibold', pageText(light))}>{title}</div>
        {badge ? <StatusPill color="gold">{badge}</StatusPill> : action}
      </div>
      {children}
    </div>
  );
}

function ActivityRow({ dot, time, text, amount, light }: { dot: string; time: string; text: string; amount: string; light: boolean }) {
  return (
    <div className="flex items-center gap-3 py-2 text-[12px]">
      <span className={cn('size-2 rounded-full', dot)} />
      <span className={mutedText(light)}>{time}</span>
      <span className={cn('min-w-0 flex-1 truncate', pageText(light))}>{text}</span>
      <span className={pageText(light)}>{amount}</span>
    </div>
  );
}
