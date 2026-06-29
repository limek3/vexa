// app/dashboard/services/page.tsx
'use client';

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  Archive,
  ArrowDownUp,
  Box,
  BriefcaseBusiness,
  CalendarCheck2,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  FolderPlus,
  GripVertical,
  Import,
  MoreVertical,
  PackagePlus,
  Palette,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';

import { WorkspaceShell } from '@/components/shared/workspace-shell';
import { useOwnedWorkspaceData } from '@/hooks/use-owned-workspace-data';
import { useWorkspaceSection } from '@/hooks/use-workspace-section';
import { useAppearance } from '@/lib/appearance-context';
import { accentPalette } from '@/lib/appearance-palette';
import { type ServiceInsight, formatCurrency } from '@/lib/master-workspace';
import { getServiceCategoryOptions, getSuggestedCategory } from '@/lib/service-presets';
import { cn } from '@/lib/utils';

type ThemeMode = 'light' | 'dark';
type ServiceStatus = ServiceInsight['status'] | 'archived';
type FilterMode = 'all' | 'active' | 'draft' | 'archived' | 'online';
type EditorTab = 'main' | 'addons';
type SortMode = 'manual' | 'popular' | 'price' | 'duration' | 'name';

type ServicePageItem = ServiceInsight & {
  description?: string;
  onlineBooking?: boolean;
  bufferBefore?: number;
  bufferAfter?: number;
  color?: string;
  addons?: { id: string; name: string; duration: number; price: number }[];
  note?: string;
  status: ServiceStatus;
};

const SERVICE_COLORS = ['#7ab36b', '#d85ca5', '#c87549', '#c7a64a', '#4f9a64', '#6095d7', '#765bc9', '#9ca3af'];
const EMPTY_DESCRIPTION = 'Классическое описание услуги: что входит, сколько длится и что важно знать клиенту перед записью.';

function createId(prefix = 'service') {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeService(service: ServiceInsight, index: number): ServicePageItem {
  const extended = service as ServicePageItem;
  return {
    ...service,
    status: extended.status ?? 'active',
    description: extended.description || EMPTY_DESCRIPTION,
    onlineBooking: extended.onlineBooking ?? service.visible,
    bufferBefore: extended.bufferBefore ?? 10,
    bufferAfter: extended.bufferAfter ?? 10,
    color: extended.color || SERVICE_COLORS[index % SERVICE_COLORS.length],
    addons: extended.addons ?? [],
    note: extended.note ?? '',
  };
}

function createService(locale: 'ru' | 'en', index: number, name?: string, category?: string): ServicePageItem {
  const serviceName = name?.trim() || (locale === 'ru' ? `Новая услуга ${index + 1}` : `New service ${index + 1}`);
  return {
    id: createId('service'),
    name: serviceName,
    duration: 60,
    price: 2500,
    status: 'draft',
    visible: true,
    bookings: 0,
    revenue: 0,
    popularity: 0,
    category: category || getSuggestedCategory(serviceName, '', locale),
    description: EMPTY_DESCRIPTION,
    onlineBooking: true,
    bufferBefore: 10,
    bufferAfter: 10,
    color: SERVICE_COLORS[index % SERVICE_COLORS.length],
    addons: [],
    note: '',
  };
}

function pageText(light: boolean) {
  return light ? 'text-[#111318]' : 'text-[#f4f5f7]';
}

function mutedText(light: boolean) {
  return light ? 'text-[#667085]' : 'text-[#9aa2af]';
}

function shellTone(light: boolean) {
  return light
    ? 'border-[#e4e7ec] bg-white shadow-[0_14px_36px_rgba(17,24,39,0.055)]'
    : 'border-white/[0.085] bg-[#17181b] shadow-[0_20px_60px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.025)]';
}

function cardTone(light: boolean) {
  return light
    ? 'border-[#e6e9ef] bg-white shadow-[0_10px_26px_rgba(17,24,39,0.045)]'
    : 'border-white/[0.075] bg-[#1b1c20] shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]';
}

function panelTone(light: boolean) {
  return light
    ? 'border-[#e6e9ef] bg-[#f8fafc]'
    : 'border-white/[0.075] bg-[#15161a]';
}

function fieldTone(light: boolean) {
  return light
    ? 'border-[#dde2ea] bg-white text-[#101318] placeholder:text-[#98a2b3] focus:border-[#b9c2d0]'
    : 'border-white/[0.08] bg-[#202226] text-white placeholder:text-white/34 focus:border-white/18';
}

function ghostButton(light: boolean) {
  return light
    ? 'border-[#dde2ea] bg-white text-[#344054] hover:border-[#cbd5e1] hover:bg-[#f8fafc]'
    : 'border-white/[0.085] bg-white/[0.035] text-white/70 hover:border-white/[0.16] hover:bg-white/[0.07] hover:text-white';
}


function dividerTone(light: boolean) {
  return light ? 'border-[#e6e9ef]' : 'border-white/[0.08]';
}

function dangerButton(light: boolean) {
  return light
    ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
    : 'border-red-400/20 bg-red-400/[0.055] text-red-300 hover:bg-red-400/[0.09]';
}

function primaryStyle(color: string): CSSProperties {
  return { background: color, borderColor: color, color: '#fff' };
}

function softAccentStyle(color: string, light: boolean): CSSProperties {
  return {
    background: light ? '#ffffff' : '#1b1c20',
    borderColor: light ? `color-mix(in srgb, ${color} 42%, #d8dee8)` : `color-mix(in srgb, ${color} 36%, rgba(255,255,255,0.12))`,
    boxShadow: light ? `inset 3px 0 0 ${color}, 0 12px 28px rgba(17,24,39,0.065)` : `inset 3px 0 0 ${color}, 0 18px 42px rgba(0,0,0,0.24)`,
  };
}

function serviceRowTone(active: boolean, light: boolean) {
  if (active) {
    return light
      ? 'border-transparent bg-white shadow-[0_18px_38px_rgba(17,24,39,0.085)]'
      : 'border-transparent bg-[#171a20] shadow-[0_20px_48px_rgba(0,0,0,0.32)]';
  }
  return light
    ? 'border-[#e6e9ef] bg-white hover:border-[#d6dce6] hover:bg-[#fbfcfd]'
    : 'border-white/[0.07] bg-[#121419] hover:border-white/[0.14] hover:bg-[#171a20]';
}

function statusTone(status: ServiceStatus, visible: boolean, light: boolean) {
  if (status === 'archived') return light ? 'bg-slate-100 text-slate-500' : 'bg-white/[0.06] text-white/45';
  if (status === 'draft' || !visible) return light ? 'bg-amber-50 text-amber-700' : 'bg-amber-400/10 text-amber-300';
  return light ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-400/10 text-emerald-300';
}

function formatDuration(minutes: number, locale: 'ru' | 'en') {
  const safe = Math.max(0, Math.round(Number(minutes) || 0));
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  if (locale === 'en') return h ? `${h}h${m ? ` ${m}m` : ''}` : `${m}m`;
  if (h && m) return `${h} ч ${m} мин`;
  if (h) return `${h} ч`;
  return `${m} мин`;
}

function MetricCard({ icon, label, value, caption, light }: { icon: ReactNode; label: string; value: ReactNode; caption: string; light: boolean }) {
  return (
    <div className={cn('rounded-[16px] border p-4', cardTone(light))}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className={cn('text-[11px] font-medium', mutedText(light))}>{label}</div>
          <div className={cn('mt-2 text-[22px] font-semibold tracking-tight', pageText(light))}>{value}</div>
          <div className={cn('mt-1 text-[11px]', mutedText(light))}>{caption}</div>
        </div>
        <div className={cn('grid size-11 place-items-center rounded-[14px] border', light ? 'border-black/[0.06] bg-black/[0.025] text-black/42' : 'border-white/[0.065] bg-white/[0.04] text-white/42')}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, accentColor, light }: { checked: boolean; onChange: (value: boolean) => void; accentColor: string; light: boolean }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn('relative inline-flex h-6 w-11 items-center rounded-full border p-0.5 transition-colors', light ? 'border-[#d7dde7] bg-[#eef2f7]' : 'border-white/10 bg-white/10')}
      style={checked ? { background: accentColor, borderColor: accentColor } : undefined}
      aria-pressed={checked}
    >
      <span className={cn('block size-5 rounded-full bg-white shadow transition-transform', checked && 'translate-x-5')} />
    </button>
  );
}


type SelectOption<T extends string> = { value: T; label: string };

function CustomSelect<T extends string>({ value, options, onChange, light, className, align = 'left' }: { value: T; options: SelectOption<T>[]; onChange: (value: T) => void; light: boolean; className?: string; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.value === value) ?? options[0];
  return (
    <div className={cn('relative', className)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}>
      <button type="button" onClick={() => setOpen((state) => !state)} className={cn('inline-flex h-10 w-full items-center justify-between gap-2 rounded-[12px] border px-3 text-[12px] font-semibold transition-colors', ghostButton(light))} aria-haspopup="listbox" aria-expanded={open}>
        <span className="truncate">{current?.label}</span>
        <ChevronDown className={cn('size-4 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open ? (
        <div className={cn('absolute top-[calc(100%+6px)] z-[75] min-w-full overflow-hidden rounded-[12px] border p-1 shadow-[0_18px_48px_rgba(0,0,0,0.22)]', align === 'right' ? 'right-0' : 'left-0', light ? 'border-[#dfe4ec] bg-white text-[#111318]' : 'border-white/[0.12] bg-[#1b1c20] text-white')} role="listbox">
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

function parsePositiveInt(value: string, fallback: number, min = 0) {
  const parsed = Number(String(value).replace(/[^0-9]/g, ''));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, parsed);
}

function MiniToast({ message, light }: { message: string; light: boolean }) {
  if (!message) return null;
  return (
    <div className={cn('fixed bottom-5 right-6 z-[80] rounded-[12px] border px-4 py-3 text-[12px] font-semibold shadow-[0_16px_44px_rgba(0,0,0,0.24)]', light ? 'border-[#e6e9ef] bg-white text-[#111318]' : 'border-white/[0.1] bg-[#181a1f] text-white')}>
      {message}
    </div>
  );
}

export default function ServicesPage() {
  const { hasHydrated, ownedProfile, dataset, locale } = useOwnedWorkspaceData();
  const { resolvedTheme } = useTheme();
  const { settings } = useAppearance();
  const [mounted, setMounted] = useState(false);
  const initialServices = useMemo(() => (dataset?.services ?? []).map(normalizeService), [dataset?.services]);
  const [services, setServices] = useWorkspaceSection<ServicePageItem[]>('services', initialServices);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortMode, setSortMode] = useState<SortMode>('manual');
  const [tab, setTab] = useState<EditorTab>('main');
  const [draggedServiceId, setDraggedServiceId] = useState<string | null>(null);
  const [rowMenuId, setRowMenuId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!hasHydrated) return;
    if (services.length || !initialServices.length) return;
    setServices(initialServices);
  }, [hasHydrated, initialServices, services.length, setServices]);
  useEffect(() => {
    if (!services.length) {
      setSelectedServiceId(null);
      return;
    }
    if (!editorOpen) return;
    if (!selectedServiceId || !services.some((service) => service.id === selectedServiceId)) {
      setSelectedServiceId(services[0].id);
    }
  }, [editorOpen, selectedServiceId, services]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const isLight = mounted ? resolvedTheme === 'light' : false;
  const accentColor = accentPalette[settings.accentTone]?.solid ?? '#79ad6b';
  const categories = useMemo(() => {
    const values = new Set<string>(getServiceCategoryOptions(locale));
    services.forEach((service) => service.category && values.add(service.category));
    return Array.from(values);
  }, [locale, services]);

  const copy = locale === 'ru'
    ? {
        title: 'Услуги', subtitle: 'Создавайте услуги, пакеты и управляйте онлайн-записью для одного мастера.', setupTitle: 'Профиль ещё не создан', setupText: 'Создайте профиль мастера, чтобы открыть каталог услуг.', setupButton: 'Создать профиль', quick: 'Быстрые действия', add: 'Добавить услугу', package: 'Создать пакет', import: 'Импорт услуг', order: 'Порядок категорий', filters: 'Фильтры', search: 'Поиск услуг...', all: 'Все', active: 'Активные', draft: 'Черновики', archive: 'Архив', categories: 'Категории', summary: 'Сводка', allServices: 'Все услуги', sort: 'Сортировка', manual: 'Вручную', popular: 'По популярности', price: 'По цене', duration: 'По длительности', name: 'По имени', editor: 'Редактирование', addons: 'Дополнения и пакеты', serviceName: 'Название услуги', category: 'Категория', serviceDuration: 'Длительность', servicePrice: 'Цена', calendarColor: 'Цвет в календаре', online: 'Онлайн-запись', onlineText: 'Клиенты смогут записываться на эту услугу онлайн', buffer: 'Буферы между записями', before: 'До услуги', after: 'После услуги', description: 'Описание услуги', note: 'Заметка для себя', duplicate: 'Дублировать', archiveAction: 'Архивировать', delete: 'Удалить', save: 'Сохранить', noResults: 'Услуги не найдены', master: 'Исполнитель', masterText: 'Услугу оказывает основной мастер', rub: '₽', min: 'мин', total: 'Всего услуг', enabled: 'Онлайн-запись', averageDuration: 'Средняя длительность', averageCheck: 'Средний чек', activeStatus: 'Активна', onlineBadge: 'Онлайн', popularBadge: 'Популярная',
      }
    : {
        title: 'Services', subtitle: 'Create services, packages, and manage online booking for one master.', setupTitle: 'Profile is not created yet', setupText: 'Create a master profile to open service catalog.', setupButton: 'Create profile', quick: 'Quick actions', add: 'Add service', package: 'Create package', import: 'Import services', order: 'Category order', filters: 'Filters', search: 'Search services...', all: 'All', active: 'Active', draft: 'Drafts', archive: 'Archive', categories: 'Categories', summary: 'Summary', allServices: 'All services', sort: 'Sort', manual: 'Manual', popular: 'By popularity', price: 'By price', duration: 'By duration', name: 'By name', editor: 'Editing', addons: 'Add-ons and packages', serviceName: 'Service name', category: 'Category', serviceDuration: 'Duration', servicePrice: 'Price', calendarColor: 'Calendar color', online: 'Online booking', onlineText: 'Clients can book this service online', buffer: 'Buffers between bookings', before: 'Before service', after: 'After service', description: 'Description', note: 'Private note', duplicate: 'Duplicate', archiveAction: 'Archive', delete: 'Delete', save: 'Save', noResults: 'No services found', master: 'Provider', masterText: 'The service is provided by the main master', rub: '₽', min: 'min', total: 'Total services', enabled: 'Online booking', averageDuration: 'Average duration', averageCheck: 'Average check', activeStatus: 'Active', onlineBadge: 'Online', popularBadge: 'Popular',
      };

  const totals = useMemo(() => {
    const active = services.filter((service) => service.status === 'active' && service.visible).length;
    const online = services.filter((service) => service.onlineBooking && service.status !== 'archived').length;
    const averageDuration = services.length ? Math.round(services.reduce((sum, service) => sum + service.duration, 0) / services.length) : 0;
    const averagePrice = services.length ? Math.round(services.reduce((sum, service) => sum + service.price, 0) / services.length) : 0;
    return { active, online, averageDuration, averagePrice };
  }, [services]);

  const filteredServices = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = services.filter((service) => {
      const byQuery = !normalized || [service.name, service.category, service.description || ''].some((value) => value.toLowerCase().includes(normalized));
      const byFilter = filter === 'all' ? service.status !== 'archived' : filter === 'online' ? service.onlineBooking && service.status !== 'archived' : filter === 'archived' ? service.status === 'archived' : service.status === filter;
      const byCategory = categoryFilter === 'all' || service.category === categoryFilter;
      return byQuery && byFilter && byCategory;
    });

    return [...filtered].sort((a, b) => {
      if (sortMode === 'manual') return 0;
      if (sortMode === 'price') return b.price - a.price;
      if (sortMode === 'duration') return b.duration - a.duration;
      if (sortMode === 'name') return a.name.localeCompare(b.name, locale === 'ru' ? 'ru' : 'en');
      return b.bookings + b.popularity - (a.bookings + a.popularity);
    });
  }, [categoryFilter, filter, locale, query, services, sortMode]);

  const groupedServices = useMemo(() => {
    return filteredServices.reduce<Record<string, ServicePageItem[]>>((acc, service) => {
      const key = service.category || copy.allServices;
      acc[key] = acc[key] || [];
      acc[key].push(service);
      return acc;
    }, {});
  }, [copy.allServices, filteredServices]);

  const selectedService = editorOpen ? (services.find((service) => service.id === selectedServiceId) ?? filteredServices[0] ?? services[0] ?? null) : null;

  function updateService(id: string, patch: Partial<ServicePageItem>) {
    setServices((current) => current.map((service) => (service.id === id ? { ...service, ...patch } : service)));
  }

  function moveService(sourceId: string, targetId: string) {
    if (!sourceId || !targetId || sourceId === targetId) return;
    setServices((current) => {
      const from = current.findIndex((service) => service.id === sourceId);
      const to = current.findIndex((service) => service.id === targetId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setSortMode('manual');
    setToast(locale === 'ru' ? 'Порядок обновлён' : 'Order updated');
  }

  function addCustomCategory() {
    const name = window.prompt(locale === 'ru' ? 'Название категории' : 'Category name');
    if (!name?.trim()) return;
    setCategoryFilter(name.trim());
    addService(undefined, name.trim());
  }

  function addService(name?: string, category?: string) {
    const created = createService(locale, services.length, name, category);
    setServices((current) => [created, ...current]);
    setSelectedServiceId(created.id);
    setEditorOpen(true);
    setTab('main');
    setToast(locale === 'ru' ? 'Услуга добавлена' : 'Service added');
  }

  function addPackage() {
    const created = createService(locale, services.length, locale === 'ru' ? 'Пакет: стрижка + уход' : 'Package: haircut + care', categories[0]);
    created.duration = 120;
    created.price = 4200;
    created.addons = [{ id: createId('addon'), name: locale === 'ru' ? 'Уход волос' : 'Hair care', duration: 30, price: 800 }];
    setServices((current) => [created, ...current]);
    setSelectedServiceId(created.id);
    setEditorOpen(true);
    setTab('addons');
    setToast(locale === 'ru' ? 'Пакет создан' : 'Package created');
  }

  function importServices() {
    const names = locale === 'ru' ? ['Полировка волос', 'SPA-уход для кожи головы', 'Детская стрижка'] : ['Hair polishing', 'Scalp SPA care', 'Kids haircut'];
    const imported = names.map((name, index) => createService(locale, services.length + index, name));
    setServices((current) => [...imported, ...current]);
    setSelectedServiceId(imported[0]?.id ?? null);
    setEditorOpen(true);
    setToast(locale === 'ru' ? 'Импортировано 3 услуги' : 'Imported 3 services');
  }

  function duplicateService(service: ServicePageItem) {
    const cloned: ServicePageItem = { ...service, id: createId('service-copy'), name: locale === 'ru' ? `${service.name} копия` : `${service.name} copy`, bookings: 0, revenue: 0, popularity: 0 };
    setServices((current) => [cloned, ...current]);
    setSelectedServiceId(cloned.id);
    setEditorOpen(true);
    setToast(locale === 'ru' ? 'Услуга продублирована' : 'Service duplicated');
  }

  function removeService(id: string) {
    setServices((current) => current.filter((service) => service.id !== id));
    setToast(locale === 'ru' ? 'Услуга удалена' : 'Service deleted');
  }

  if (!hasHydrated) return <WorkspaceShell><main className="min-h-screen" /></WorkspaceShell>;

  if (!ownedProfile) {
    return (
      <WorkspaceShell>
        <main className={cn('min-h-screen px-6 py-8', isLight ? 'bg-[#f7f8fb]' : 'bg-[#101114]')}>
          <div className={cn('mx-auto max-w-xl rounded-[20px] border p-8 text-center', shellTone(isLight))}>
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
        <div className="mx-auto max-w-[1580px] space-y-5">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className={cn('text-[28px] font-semibold tracking-tight', pageText(isLight))}>{copy.title}</h1>
              <p className={cn('mt-1 text-[13px]', mutedText(isLight))}>{copy.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={importServices} className={cn('inline-flex h-10 items-center gap-2 rounded-[12px] border px-4 text-[12px] font-semibold', ghostButton(isLight))}><Import className="size-4" />{copy.import}</button>
              <button type="button" onClick={() => addService()} className="inline-flex h-10 items-center gap-2 rounded-[12px] border px-4 text-[12px] font-semibold" style={primaryStyle(accentColor)}><Plus className="size-4" />{copy.add}</button>
            </div>
          </header>

          <section className="grid gap-4 xl:grid-cols-4">
            <MetricCard light={isLight} icon={<Box className="size-5" />} label={copy.total} value={services.length} caption={locale === 'ru' ? 'во всех категориях' : 'in all categories'} />
            <MetricCard light={isLight} icon={<Check className="size-5" />} label={copy.active} value={totals.active} caption={locale === 'ru' ? 'доступны для записи' : 'available to book'} />
            <MetricCard light={isLight} icon={<Clock3 className="size-5" />} label={copy.averageDuration} value={formatDuration(totals.averageDuration, locale)} caption={locale === 'ru' ? 'по всем услугам' : 'across services'} />
            <MetricCard light={isLight} icon={<BriefcaseBusiness className="size-5" />} label={copy.averageCheck} value={formatCurrency(totals.averagePrice, locale)} caption={locale === 'ru' ? 'по всем услугам' : 'across services'} />
          </section>

          <section className="grid items-start gap-4 xl:grid-cols-[320px_minmax(520px,1fr)_440px]">
            <aside className="space-y-4">
              <div className={cn('rounded-[18px] border p-4', shellTone(isLight))}>
                <h2 className={cn('text-[15px] font-semibold', pageText(isLight))}>{copy.quick}</h2>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {[
                    [<Plus key="i" className="size-5" />, copy.add, () => addService()],
                    [<PackagePlus key="i" className="size-5" />, copy.package, addPackage],
                    [<Import key="i" className="size-5" />, copy.import, importServices],
                    [<ArrowDownUp key="i" className="size-5" />, copy.order, () => { setSortMode('name'); setToast(locale === 'ru' ? 'Включена сортировка по имени' : 'Sorted by name'); }],
                  ].map(([icon, label, action]) => (
                    <button key={String(label)} type="button" onClick={action as () => void} className={cn('flex h-[74px] flex-col items-center justify-center gap-2 rounded-[13px] border text-center text-[10.5px] font-semibold transition-colors', ghostButton(isLight))}>
                      {icon as ReactNode}<span>{label as string}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={cn('rounded-[18px] border p-4', shellTone(isLight))}>
                <h2 className={cn('text-[15px] font-semibold', pageText(isLight))}>{copy.filters}</h2>
                <label className={cn('mt-3 flex h-10 items-center gap-2 rounded-[12px] border px-3', fieldTone(isLight))}>
                  <Search className="size-4 opacity-55" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} className="min-w-0 flex-1 bg-transparent text-[12px] outline-none" />
                  {query ? <button type="button" onClick={() => setQuery('')}><X className="size-4 opacity-55" /></button> : null}
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(['all', 'active', 'draft', 'archived', 'online'] as FilterMode[]).map((item) => (
                    <button key={item} type="button" onClick={() => setFilter(item)} className={cn('h-8 rounded-[10px] border px-3 text-[11px] font-semibold', filter === item ? 'text-white' : ghostButton(isLight))} style={filter === item ? primaryStyle(accentColor) : undefined}>
                      {item === 'all' ? copy.all : item === 'active' ? copy.active : item === 'draft' ? copy.draft : item === 'archived' ? copy.archive : copy.online}
                    </button>
                  ))}
                </div>
              </div>

              <div className={cn('rounded-[18px] border p-4', shellTone(isLight))}>
                <div className="flex items-center justify-between">
                  <h2 className={cn('text-[15px] font-semibold', pageText(isLight))}>{copy.categories}</h2>
                  <button type="button" onClick={addCustomCategory} className={cn('grid size-8 place-items-center rounded-[9px] border', ghostButton(isLight))}><Plus className="size-4" /></button>
                </div>
                <div className="mt-3 space-y-1">
                  <button type="button" onClick={() => setCategoryFilter('all')} className={cn('flex h-9 w-full items-center justify-between rounded-[10px] px-3 text-[12px] font-semibold', categoryFilter === 'all' ? (isLight ? 'bg-black/[0.055] text-black' : 'bg-white/[0.08] text-white') : mutedText(isLight))}><span>{copy.allServices}</span><span>{services.length}</span></button>
                  {categories.map((category) => (
                    <button key={category} type="button" onClick={() => setCategoryFilter(category)} className={cn('flex h-9 w-full items-center justify-between rounded-[10px] px-3 text-[12px] font-medium', categoryFilter === category ? (isLight ? 'bg-black/[0.055] text-black' : 'bg-white/[0.08] text-white') : mutedText(isLight))}>
                      <span>{category}</span><span>{services.filter((service) => service.category === category).length}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className={cn('rounded-[18px] border p-4', shellTone(isLight))}>
                <h2 className={cn('text-[15px] font-semibold', pageText(isLight))}>{copy.summary}</h2>
                <div className={cn('mt-3 space-y-3 text-[12px]', mutedText(isLight))}>
                  <div className="flex justify-between"><span>Активные услуги</span><b className={pageText(isLight)}>{totals.active}</b></div>
                  <div className="flex justify-between"><span>Онлайн-запись</span><b className={pageText(isLight)}>{totals.online}</b></div>
                  <div className="flex justify-between"><span>Средняя длительность</span><b className={pageText(isLight)}>{formatDuration(totals.averageDuration, locale)}</b></div>
                  <div className="flex justify-between"><span>Средний чек</span><b className={pageText(isLight)}>{formatCurrency(totals.averagePrice, locale)}</b></div>
                </div>
              </div>
            </aside>

            <section className={cn('min-w-0 rounded-[18px] border', shellTone(isLight))}>
              <div className={cn('flex flex-wrap items-center justify-between gap-3 border-b p-4', dividerTone(isLight))}>
                <h2 className={cn('text-[19px] font-semibold', pageText(isLight))}>{copy.allServices} <span className={cn('ml-1 rounded-full px-2 py-0.5 text-[12px]', isLight ? 'bg-black/[0.055] text-black/60' : 'bg-white/[0.07] text-white/60')}>{filteredServices.length}</span></h2>
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className={cn('size-4', mutedText(isLight))} />
                  <CustomSelect<SortMode>
                    value={sortMode}
                    onChange={setSortMode}
                    light={isLight}
                    align="right"
                    className="w-[184px]"
                    options={[
                      { value: 'manual', label: copy.manual },
                      { value: 'popular', label: copy.popular },
                      { value: 'price', label: copy.price },
                      { value: 'duration', label: copy.duration },
                      { value: 'name', label: copy.name },
                    ]}
                  />
                </div>
              </div>
              <div className="max-h-[calc(100vh-310px)] min-h-[320px] space-y-3 overflow-y-auto p-4">
                {(Object.entries(groupedServices) as Array<[string, ServicePageItem[]]>).map(([category, items]) => (
                  <div key={category} className="space-y-2">
                    <h3 className={cn('flex items-center gap-2 px-2 text-[15px] font-semibold', pageText(isLight))}>{category}<span className={cn('rounded-full px-2 py-0.5 text-[11px]', isLight ? 'bg-black/[0.055] text-black/52' : 'bg-white/[0.07] text-white/52')}>{items.length}</span></h3>
                    {items.map((service) => {
                      const active = selectedService?.id === service.id;
                      return (
                        <div
                          key={service.id}
                          role="button"
                          tabIndex={0}
                          draggable
                          onClick={() => { setSelectedServiceId(service.id); setEditorOpen(true); setTab('main'); setRowMenuId(null); }}
                          onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedServiceId(service.id); setEditorOpen(true); setTab('main'); } }}
                          onDragStart={(event) => { setDraggedServiceId(service.id); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', service.id); }}
                          onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }}
                          onDrop={(event) => { event.preventDefault(); moveService(event.dataTransfer.getData('text/plain') || draggedServiceId || '', service.id); setDraggedServiceId(null); }}
                          onDragEnd={() => setDraggedServiceId(null)}
                          className={cn('group relative flex w-full cursor-pointer items-center gap-3 rounded-[14px] border p-3 text-left transition-all hover:-translate-y-px', draggedServiceId === service.id && 'opacity-55', serviceRowTone(active, isLight))}
                          style={active ? softAccentStyle(accentColor, isLight) : undefined}
                        >
                          <GripVertical className={cn('size-4 shrink-0 opacity-30 transition-opacity group-hover:opacity-60', mutedText(isLight))} />
                          <div className="grid size-[54px] shrink-0 place-items-center overflow-hidden rounded-[12px] border" style={{ borderColor: service.color, background: `color-mix(in srgb, ${service.color || accentColor} 18%, ${isLight ? '#fff' : '#121419'})` }}>
                            <Palette className="size-5" style={{ color: service.color || accentColor }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className={cn('truncate text-[14px] font-semibold', pageText(isLight))}>{service.name}</div>
                            <div className={cn('mt-1 truncate text-[11px]', mutedText(isLight))}>{service.description}</div>
                            <div className={cn('mt-2 flex flex-wrap items-center gap-2 text-[11px]', mutedText(isLight))}>
                              <span>{formatDuration(service.duration, locale)}</span><span>•</span><span>{formatCurrency(service.price, locale)}</span>
                              {service.bookings > 3 ? <span className="rounded-full border border-orange-400/25 bg-orange-400/10 px-2 py-0.5 text-orange-300">{copy.popularBadge}</span> : null}
                              {service.onlineBooking ? <span className="rounded-full border border-green-400/20 bg-green-400/10 px-2 py-0.5 text-green-300">{copy.onlineBadge}</span> : null}
                            </div>
                          </div>
                          <div className="hidden min-w-[150px] text-right sm:block">
                            <div className={cn('text-[15px] font-semibold', pageText(isLight))}>{formatCurrency(service.price, locale)}</div>
                            <div className={cn('mt-1 text-[11px]', mutedText(isLight))}>{service.bookings} записей</div>
                          </div>
                          <button type="button" onClick={(event) => { event.stopPropagation(); updateService(service.id, { status: service.status === 'active' ? 'draft' : 'active', visible: service.status !== 'active' }); setToast(locale === 'ru' ? 'Статус изменён' : 'Status changed'); }} className={cn('rounded-full px-3 py-1 text-[11px] font-semibold', statusTone(service.status, Boolean(service.visible), isLight))}>{service.status === 'active' && service.visible ? copy.activeStatus : service.status === 'archived' ? copy.archive : copy.draft}</button>
                          <button type="button" onClick={(event) => { event.stopPropagation(); setRowMenuId((current) => current === service.id ? null : service.id); }} className={cn('grid size-8 shrink-0 place-items-center rounded-[10px] border', ghostButton(isLight))} aria-label="Действия услуги"><MoreVertical className="size-4" /></button>
                          {rowMenuId === service.id ? (
                            <div className={cn('absolute right-3 top-12 z-30 w-44 rounded-[12px] border p-1 shadow-[0_18px_44px_rgba(0,0,0,0.22)]', isLight ? 'border-[#dfe4ec] bg-white' : 'border-white/[0.12] bg-[#1b1c20]')} onClick={(event) => event.stopPropagation()}>
                              <button type="button" onClick={() => { duplicateService(service); setRowMenuId(null); }} className={cn('flex h-9 w-full items-center gap-2 rounded-[9px] px-3 text-[12px] font-semibold', isLight ? 'text-[#344054] hover:bg-[#f5f7fa]' : 'text-white/74 hover:bg-white/[0.06]')}><Copy className="size-4" />{copy.duplicate}</button>
                              <button type="button" onClick={() => { updateService(service.id, { status: 'archived', visible: false }); setRowMenuId(null); }} className={cn('flex h-9 w-full items-center gap-2 rounded-[9px] px-3 text-[12px] font-semibold', isLight ? 'text-[#344054] hover:bg-[#f5f7fa]' : 'text-white/74 hover:bg-white/[0.06]')}><Archive className="size-4" />{copy.archiveAction}</button>
                              <button type="button" onClick={() => { removeService(service.id); setRowMenuId(null); }} className={cn('flex h-9 w-full items-center gap-2 rounded-[9px] px-3 text-[12px] font-semibold text-red-500 hover:bg-red-500/10')}><Trash2 className="size-4" />{copy.delete}</button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ))}
                {!filteredServices.length ? <div className={cn('rounded-[14px] border p-8 text-center text-[13px]', panelTone(isLight), mutedText(isLight))}>{copy.noResults}</div> : null}
              </div>
            </section>

            <aside className={cn('sticky top-5 self-start overflow-hidden rounded-[18px] border', shellTone(isLight))}>
              {selectedService ? (
                <>
                  <div className={cn('flex items-start justify-between gap-4 border-b p-5', dividerTone(isLight))}>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className={cn('text-[18px] font-semibold', pageText(isLight))}>{copy.editor}</h2>
                        <span className="rounded-full border border-green-400/20 bg-green-400/10 px-2 py-0.5 text-[11px] font-semibold text-green-300">{selectedService.status === 'active' ? copy.activeStatus : copy.draft}</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => setEditorOpen(false)} className={cn('grid size-8 place-items-center rounded-[10px] border', ghostButton(isLight))}><X className="size-4" /></button>
                  </div>

                  <div className={cn('flex border-b px-5', dividerTone(isLight))}>
                    {(['main', 'addons'] as EditorTab[]).map((item) => (
                      <button key={item} type="button" onClick={() => setTab(item)} className={cn('relative h-12 px-3 text-[12px] font-semibold', tab === item ? pageText(isLight) : mutedText(isLight))}>
                        {item === 'main' ? copy.editor : copy.addons}
                        {tab === item ? <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full" style={{ background: accentColor }} /> : null}
                      </button>
                    ))}
                  </div>

                  <div className="max-h-[calc(100vh-335px)] overflow-y-auto p-5">
                    {tab === 'main' ? (
                      <div className="space-y-5">
                        <div>
                          <label className={cn('text-[11px] font-medium', mutedText(isLight))}>{copy.serviceName}</label>
                          <input value={selectedService.name} onChange={(event) => updateService(selectedService.id, { name: event.target.value })} className={cn('mt-2 h-11 w-full rounded-[12px] border px-3 text-[13px] font-semibold outline-none', fieldTone(isLight))} />
                        </div>
                        <div>
                          <label className={cn('text-[11px] font-medium', mutedText(isLight))}>{copy.category}</label>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="size-2.5 shrink-0 rounded-full" style={{ background: selectedService.color || accentColor }} />
                            <CustomSelect<string>
                              value={selectedService.category}
                              onChange={(value) => updateService(selectedService.id, { category: value })}
                              light={isLight}
                              className="min-w-0 flex-1"
                              options={categories.map((category) => ({ value: category, label: category }))}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={cn('text-[11px] font-medium', mutedText(isLight))}>{copy.serviceDuration}</label>
                            <input type="text" inputMode="numeric" value={selectedService.duration} onChange={(event) => updateService(selectedService.id, { duration: parsePositiveInt(event.target.value, selectedService.duration, 5) })} className={cn('mt-2 h-11 w-full rounded-[12px] border px-3 text-[13px] font-semibold outline-none', fieldTone(isLight))} />
                          </div>
                          <div>
                            <label className={cn('text-[11px] font-medium', mutedText(isLight))}>{copy.servicePrice}</label>
                            <input type="text" inputMode="numeric" value={selectedService.price} onChange={(event) => updateService(selectedService.id, { price: parsePositiveInt(event.target.value, selectedService.price, 0) })} className={cn('mt-2 h-11 w-full rounded-[12px] border px-3 text-[13px] font-semibold outline-none', fieldTone(isLight))} />
                          </div>
                        </div>
                        <div>
                          <label className={cn('text-[11px] font-medium', mutedText(isLight))}>{copy.calendarColor}</label>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {SERVICE_COLORS.map((color) => (
                              <button key={color} type="button" onClick={() => updateService(selectedService.id, { color })} className={cn('grid size-8 place-items-center rounded-[10px] border shadow-sm', isLight ? 'border-black/10' : 'border-white/10')} style={{ background: color }}>
                                {selectedService.color === color ? <Check className="size-4 text-white" /> : null}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className={cn('rounded-[14px] border p-4', panelTone(isLight))}>
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className={cn('text-[13px] font-semibold', pageText(isLight))}>{copy.online}</div>
                              <div className={cn('mt-1 text-[11px]', mutedText(isLight))}>{copy.onlineText}</div>
                            </div>
                            <Toggle checked={Boolean(selectedService.onlineBooking)} onChange={(value) => updateService(selectedService.id, { onlineBooking: value, visible: value })} accentColor={accentColor} light={isLight} />
                          </div>
                        </div>
                        <div>
                          <label className={cn('text-[11px] font-medium', mutedText(isLight))}>{copy.description}</label>
                          <textarea value={selectedService.description} onChange={(event) => updateService(selectedService.id, { description: event.target.value })} rows={4} className={cn('mt-2 w-full resize-none rounded-[12px] border p-3 text-[13px] leading-5 outline-none', fieldTone(isLight))} />
                        </div>
                        <div>
                          <label className={cn('text-[11px] font-medium', mutedText(isLight))}>{copy.note}</label>
                          <textarea value={selectedService.note ?? ''} onChange={(event) => updateService(selectedService.id, { note: event.target.value })} rows={3} className={cn('mt-2 w-full resize-none rounded-[12px] border p-3 text-[13px] leading-5 outline-none', fieldTone(isLight))} />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className={cn('rounded-[14px] border p-4', panelTone(isLight))}>
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <div className={cn('text-[13px] font-semibold', pageText(isLight))}>{copy.master}</div>
                              <div className={cn('mt-1 text-[11px]', mutedText(isLight))}>{copy.masterText}</div>
                            </div>
                            <span className={cn('grid size-9 place-items-center rounded-[12px] border text-[12px] font-bold', isLight ? 'border-black/10 bg-black/[0.035] text-black/60' : 'border-white/10 bg-white/5 text-white/75')}>{ownedProfile.name?.slice(0, 1).toUpperCase() || 'M'}</span>
                          </div>
                        </div>
                        <div>
                          <div className={cn('text-[13px] font-semibold', pageText(isLight))}>{copy.buffer}</div>
                          <div className="mt-3 grid grid-cols-2 gap-3">
                            <label className={cn('rounded-[13px] border p-3', fieldTone(isLight))}><span className={cn('block text-[11px]', mutedText(isLight))}>{copy.before}</span><input type="text" inputMode="numeric" value={selectedService.bufferBefore ?? 0} onChange={(event) => updateService(selectedService.id, { bufferBefore: parsePositiveInt(event.target.value, selectedService.bufferBefore ?? 0, 0) })} className="mt-2 w-full bg-transparent text-[16px] font-semibold outline-none" /></label>
                            <label className={cn('rounded-[13px] border p-3', fieldTone(isLight))}><span className={cn('block text-[11px]', mutedText(isLight))}>{copy.after}</span><input type="text" inputMode="numeric" value={selectedService.bufferAfter ?? 0} onChange={(event) => updateService(selectedService.id, { bufferAfter: parsePositiveInt(event.target.value, selectedService.bufferAfter ?? 0, 0) })} className="mt-2 w-full bg-transparent text-[16px] font-semibold outline-none" /></label>
                          </div>
                        </div>
                        <div className={cn('rounded-[14px] border p-4', panelTone(isLight))}>
                          <div className="flex items-center justify-between">
                            <div className={cn('text-[13px] font-semibold', pageText(isLight))}>Дополнительные услуги</div>
                            <button type="button" onClick={() => updateService(selectedService.id, { addons: [...(selectedService.addons ?? []), { id: createId('addon'), name: 'Укладка', duration: 45, price: 1500 }] })} className="text-[12px] font-semibold" style={{ color: accentColor }}>+ Добавить</button>
                          </div>
                          <div className="mt-3 space-y-2">
                            {(selectedService.addons ?? []).map((addon) => (
                              <div key={addon.id} className={cn('flex items-center gap-2 rounded-[11px] border p-2 text-[12px]', isLight ? 'border-black/[0.08]' : 'border-white/[0.08]')}>
                                <input value={addon.name} onChange={(event) => updateService(selectedService.id, { addons: (selectedService.addons ?? []).map((item) => item.id === addon.id ? { ...item, name: event.target.value } : item) })} className="min-w-0 flex-1 bg-transparent font-semibold outline-none" />
                                <span className={mutedText(isLight)}>{addon.duration} мин</span>
                                <span className={pageText(isLight)}>{formatCurrency(addon.price, locale)}</span>
                                <button type="button" onClick={() => updateService(selectedService.id, { addons: (selectedService.addons ?? []).filter((item) => item.id !== addon.id) })}><X className="size-4 opacity-55" /></button>
                              </div>
                            ))}
                            {!selectedService.addons?.length ? <div className={cn('text-[12px]', mutedText(isLight))}>Добавьте дополнительные услуги, которые клиент сможет выбрать вместе с основной.</div> : null}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={cn('flex flex-wrap items-center gap-2 border-t p-4', dividerTone(isLight))}>
                    <button type="button" onClick={() => duplicateService(selectedService)} className={cn('inline-flex h-10 items-center gap-2 rounded-[11px] border px-3 text-[12px] font-semibold', ghostButton(isLight))}><Copy className="size-4" />{copy.duplicate}</button>
                    <button type="button" onClick={() => updateService(selectedService.id, { status: 'archived', visible: false })} className={cn('inline-flex h-10 items-center gap-2 rounded-[11px] border px-3 text-[12px] font-semibold', dangerButton(isLight))}><Archive className="size-4" />{copy.archiveAction}</button>
                    <button type="button" onClick={() => { setToast(locale === 'ru' ? 'Изменения сохранены' : 'Saved'); }} className="ml-auto inline-flex h-10 min-w-[120px] items-center justify-center gap-2 rounded-[11px] border px-4 text-[12px] font-semibold" style={primaryStyle(accentColor)}><CalendarCheck2 className="size-4" />{copy.save}</button>
                    <button type="button" onClick={() => removeService(selectedService.id)} className={cn('grid size-10 place-items-center rounded-[11px] border', dangerButton(isLight))}><Trash2 className="size-4" /></button>
                  </div>
                </>
              ) : (
                <div className={cn('p-8 text-center text-[13px]', mutedText(isLight))}>
                  {copy.noResults}
                  <button type="button" onClick={() => { setEditorOpen(true); setSelectedServiceId(services[0]?.id ?? null); }} className={cn('mt-4 h-10 rounded-[11px] border px-4 text-[12px] font-semibold', ghostButton(isLight))}>{locale === 'ru' ? 'Открыть редактор' : 'Open editor'}</button>
                </div>
              )}
            </aside>
          </section>
        </div>
        <MiniToast message={toast} light={isLight} />
      </main>
    </WorkspaceShell>
  );
}
