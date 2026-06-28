'use client';

import { addDays, format } from 'date-fns';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from 'react';
import { useTheme } from 'next-themes';
import {
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  ChevronLeft,
  Clock3,
  MessageCircleMore,
  MessageSquareText,
  Search,
  Send,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/lib/app-context';
import {
  normalizeAppearanceSettings,
  type AppearanceSettings,
} from '@/lib/appearance';
import { useAppearance } from '@/lib/appearance-context';
import { accentPalette } from '@/lib/appearance-palette';
import { useLocale } from '@/lib/locale-context';
import type { Booking, BookingFormValues, MasterProfile } from '@/lib/types';
import { cn, formatDate } from '@/lib/utils';
import { menuContentClass, menuItemClass, menuTriggerClass } from '@/lib/menu-styles';
import {
  getAvailableTimesForDate,
  normalizeAvailabilityDays,
  normalizeServiceDetails,
  type BookedSlot,
  type BookingAvailabilityDay,
  type BookingServiceDetails,
} from '@/lib/availability';

type ThemeMode = 'light' | 'dark';

function createInitialValues(service = ''): BookingFormValues {
  return {
    clientName: '',
    clientPhone: '',
    service,
    date: '',
    time: '',
    comment: '',
  };
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
  return light ? 'border-black/[0.08]' : 'border-white/[0.08]';
}

function divideTone(light: boolean) {
  return light ? 'divide-black/[0.08]' : 'divide-white/[0.08]';
}

function cardTone(light: boolean) {
  return light
    ? 'border-black/[0.08] bg-[#ffffff]'
    : 'border-white/[0.08] bg-[#141414]';
}

function insetTone(light: boolean) {
  return light
    ? 'border-black/[0.07] bg-black/[0.025]'
    : 'border-white/[0.07] bg-white/[0.035]';
}

function fieldTone(light: boolean) {
  return light
    ? 'border-black/[0.08] bg-white text-black placeholder:text-black/34'
    : 'border-white/[0.08] bg-white/[0.035] text-white placeholder:text-white/30';
}

function buttonBase(light: boolean, active = false) {
  return cn(
    'inline-flex h-8 items-center justify-center gap-2 rounded-[9px] border px-3 text-[12px] font-medium shadow-none transition-[background,border-color,color,opacity,transform] duration-150 active:scale-[0.985] disabled:pointer-events-none disabled:opacity-40',
    active
      ? light
        ? 'cb-neutral-primary cb-neutral-primary-light hover:opacity-[0.98]'
        : 'cb-neutral-primary cb-neutral-primary-dark hover:opacity-[0.98]'
      : light
        ? 'border-black/[0.08] bg-white text-black/58 hover:border-black/[0.14] hover:bg-black/[0.035] hover:text-black'
        : 'border-white/[0.08] bg-white/[0.04] text-white/55 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white',
  );
}

function inputClass(light: boolean) {
  return cn(
    'h-9 rounded-[9px] border px-3 text-[12px] shadow-none outline-none',
    'focus-visible:ring-0 focus-visible:ring-offset-0',
    fieldTone(light),
  );
}

function textareaClass(light: boolean) {
  return cn(
    'rounded-[9px] border px-3 py-3 text-[12.5px] leading-6 shadow-none outline-none',
    'focus-visible:ring-0 focus-visible:ring-offset-0',
    fieldTone(light),
  );
}

function quietButtonClass(light: boolean) {
  return cn(buttonBase(light), 'cb-public-secondary-action');
}

function primaryButtonClass(light: boolean) {
  return cn(buttonBase(light, true), 'cb-public-primary-action');
}

function accentDotStyle(color: string): CSSProperties {
  return {
    background: color,
    boxShadow: `0 0 0 3px color-mix(in srgb, ${color} 14%, transparent)`,
  };
}

function glassDropdownSurfaceStyle(light: boolean): CSSProperties {
  return {
    background: light
      ? 'radial-gradient(420px 180px at 50% 0%, rgba(255,255,255,0.72), transparent 56%), linear-gradient(180deg, rgba(251,251,250,0.94), rgba(244,244,242,0.92))'
      : 'radial-gradient(420px 190px at 50% 0%, rgba(255,255,255,0.105), transparent 58%), linear-gradient(180deg, rgba(47,47,45,0.94), rgba(34,34,33,0.94))',
  };
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
      {active ? (
        <span
          className="size-1.5 shrink-0 rounded-full"
          style={accentColor ? accentDotStyle(accentColor) : undefined}
        />
      ) : null}
      {children}
    </span>
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

function StepRail({
  steps,
  currentStep,
  light,
  accentColor,
}: {
  steps: string[];
  currentStep: number;
  light: boolean;
  accentColor: string;
}) {
  return (
    <div
      className={cn(
        'grid h-10 overflow-hidden rounded-[12px] border',
        light
          ? 'border-black/[0.08] bg-white'
          : 'border-white/[0.08] bg-white/[0.045]',
      )}
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
    >
      {steps.map((step, index) => {
        const active = index === currentStep;
        const complete = index < currentStep;

        return (
          <button
            key={step}
            type="button"
            disabled
            className={cn(
              'relative min-w-0 border-r px-3 text-[11px] font-semibold transition last:border-r-0',
              divideTone(light),
              active
                ? light
                  ? 'text-black'
                  : 'text-white'
                : complete
                  ? light
                    ? 'text-black/62'
                    : 'text-white/62'
                  : light
                    ? 'text-black/34'
                    : 'text-white/30',
            )}
          >
            <span className="inline-flex max-w-full items-center justify-center gap-1.5">
              {complete ? <Check className="size-3.5 shrink-0" /> : null}
              <span className="truncate">{step}</span>
            </span>

            <span
              className={cn(
                'absolute bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full transition-all duration-200',
                active ? 'opacity-100' : 'scale-0 opacity-0',
              )}
              style={active ? { background: accentColor } : undefined}
            />
          </button>
        );
      })}
    </div>
  );
}


function normalizeVisibleServices(value: string) {
  const raw = String(value || '').trim();
  if (!raw) return ['—'];

  const cleaned = raw
    .replace(/[-–—_]{3,}\s*входит\s*:?\s*-?/gi, '')
    .replace(/\s+входит\s*:?\s*-?\s*$/gi, '')
    .replace(/^[-–—_\s]+$/g, '')
    .trim();

  if (!cleaned || /^[-–—_:\s]+$/i.test(cleaned)) return ['—'];

  const parts = cleaned
    .split(/\n|;|\s\+\s|,\s(?=[А-ЯA-ZЁ])|\s·\s/g)
    .map((item) => item.replace(/^[-–—_\s]+/, '').replace(/[-–—_\s]+$/, '').trim())
    .filter(Boolean);

  return parts.length > 0 ? parts : ['—'];
}

function SummaryBar({
  items,
  light,
  label,
  accentColor,
}: {
  items: string[];
  light: boolean;
  label: string;
  accentColor: string;
}) {
  if (items.length === 0) return null;

  return (
    <Panel light={light} className="px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            'mr-1 text-[10px] uppercase tracking-[0.14em]',
            faintText(light),
          )}
        >
          {label}
        </span>

        {items.map((item, index) => (
          <MicroLabel key={`${item}-${index}`} light={light}>
            {index === 0 ? (
              <span
                className="size-1.5 rounded-full"
                style={{ background: accentColor }}
              />
            ) : null}
            <span className="max-w-[220px] truncate">{item}</span>
          </MicroLabel>
        ))}
      </div>
    </Panel>
  );
}

function glassSelectTriggerClass(light: boolean) {
  return cn(menuTriggerClass(light), 'min-h-[58px] h-auto w-full justify-between px-3.5 py-3 text-left text-[12px]');
}

function glassSelectContentClass(light: boolean) {
  return cn(menuContentClass(light), 'absolute left-0 right-0 top-[calc(100%+8px)] z-[140]');
}

function glassSelectItemClass(light: boolean, active?: boolean) {
  return cn(menuItemClass(light, Boolean(active)), 'flex w-full items-center justify-between gap-3 pl-2 pr-3 text-left');
}

function ServiceDropdown({
  value,
  services,
  query,
  setQuery,
  placeholder,
  searchPlaceholder,
  emptyLabel,
  countLabel,
  light,
  accentColor,
  onSelect,
}: {
  value: string;
  services: string[];
  query: string;
  setQuery: (value: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyLabel: string;
  countLabel: string;
  light: boolean;
  accentColor: string;
  onSelect: (service: string) => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const filteredServices = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();

    if (!cleanQuery) return services;

    return services.filter((service) =>
      service.toLowerCase().includes(cleanQuery),
    );
  }, [query, services]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          glassSelectTriggerClass(light),
          open &&
            (light
              ? 'border-black/[0.16] bg-[#ffffff] shadow-[0_14px_44px_rgba(15,15,15,0.08)]'
              : 'border-white/[0.18] bg-[#343432]/94 shadow-[0_18px_56px_rgba(0,0,0,0.56)]'),
        )}
        style={
          open || value
            ? {
                borderColor: `color-mix(in srgb, ${accentColor} 38%, transparent)`,
              }
            : undefined
        }
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              'inline-flex size-9 shrink-0 items-center justify-center rounded-[9px] border backdrop-blur-[18px]',
              light
                ? 'border-black/[0.07] bg-white/76 text-black/42'
                : 'border-white/[0.08] bg-black/18 text-white/42',
            )}
          >
            <Sparkles
              className="size-4"
              style={{ color: value ? accentColor : undefined }}
            />
          </span>

          <span className="min-w-0">
            <span
              className={cn(
                'block truncate text-[13px] font-semibold tracking-[-0.018em]',
                value ? pageText(light) : mutedText(light),
              )}
            >
              {value || placeholder}
            </span>

            <span className={cn('mt-1 block text-[10.5px]', faintText(light))}>
              {services.length} {countLabel}
            </span>
          </span>
        </span>

        <ChevronDown
          className={cn(
            'size-4 shrink-0 transition',
            open && 'rotate-180',
            light ? 'text-black/36' : 'text-white/30',
          )}
        />
      </button>

      <div
        className={cn(
          glassSelectContentClass(light),
          open
            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none -translate-y-1 scale-[0.99] opacity-0',
        )}
        style={glassDropdownSurfaceStyle(light)}
      >
        <div className="relative">
          <Search
            className={cn(
              'pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2',
              light ? 'text-black/30' : 'text-white/26',
            )}
          />

          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className={cn(
              'h-9 rounded-[10px] border pl-8 pr-8 text-[12px] shadow-none outline-none backdrop-blur-[22px]',
              'focus-visible:ring-0 focus-visible:ring-offset-0',
              light
                ? 'border-black/[0.08] bg-white/86 text-black placeholder:text-black/28 focus:border-black/[0.16]'
                : 'border-white/[0.08] bg-black/22 text-white placeholder:text-white/25 focus:border-white/[0.16]',
            )}
          />

          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className={cn(
                'absolute right-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-[8px] transition',
                light
                  ? 'text-black/34 hover:bg-black/[0.055] hover:text-black'
                  : 'text-white/30 hover:bg-white/[0.07] hover:text-white',
              )}
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        <div className="mt-2 max-h-[236px] space-y-1 overflow-y-auto pr-1">
          {filteredServices.map((service) => {
            const active = value === service;

            return (
              <button
                key={service}
                type="button"
                onClick={() => {
                  onSelect(service);
                  setOpen(false);
                  setQuery('');
                }}
                className={glassSelectItemClass(light, active)}
              >
                <span className="truncate">{service}</span>

                <span className="flex w-4 shrink-0 items-center justify-center">
                  {active ? (
                    <Check className="size-3.5" style={{ color: accentColor }} />
                  ) : null}
                </span>
              </button>
            );
          })}

          {filteredServices.length === 0 ? (
            <div
              className={cn(
                'rounded-[9px] border border-dashed px-3 py-4 text-center text-[12px]',
                borderTone(light),
                mutedText(light),
              )}
            >
              {emptyLabel}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DateOption({
  label,
  hint,
  active,
  disabled,
  onClick,
  light,
  accentColor,
}: {
  label: string;
  hint?: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  light: boolean;
  accentColor: string;
}) {
  const [weekday, rest] = label.split(',').map((item) => item.trim());

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'relative min-h-[68px] rounded-[10px] border p-3 text-left transition active:scale-[0.99] disabled:pointer-events-none',
        active
          ? light
            ? 'border-black/[0.13] bg-white text-black'
            : 'border-white/[0.14] bg-white/[0.055] text-white'
          : disabled
            ? light
              ? 'border-black/[0.05] bg-black/[0.018] text-black/26'
              : 'border-white/[0.05] bg-white/[0.02] text-white/24'
            : light
              ? 'border-black/[0.07] bg-black/[0.025] text-black/62 hover:border-black/[0.12] hover:bg-white hover:text-black'
              : 'border-white/[0.07] bg-white/[0.035] text-white/62 hover:border-white/[0.13] hover:bg-white/[0.055] hover:text-white',
      )}
      style={
        active
          ? {
              borderColor: `color-mix(in srgb, ${accentColor} 42%, transparent)`,
            }
          : undefined
      }
    >
      <span className={cn('block text-[10px] uppercase tracking-[0.14em]', faintText(light))}>
        {weekday || label}
      </span>

      <span className="mt-1 block truncate text-[13px] font-semibold">
        {rest || label}
      </span>

      {hint ? (
        <span className={cn('mt-1 block truncate text-[10.5px]', disabled ? faintText(light) : mutedText(light))}>
          {hint}
        </span>
      ) : null}

      {active ? (
        <span
          className="absolute bottom-2 right-2 size-1.5 rounded-full"
          style={accentDotStyle(accentColor)}
        />
      ) : null}
    </button>
  );
}

function TimeOption({
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
        'relative h-10 rounded-[9px] border px-3 text-[12px] font-semibold transition active:scale-[0.99]',
        active
          ? light
            ? 'border-black/[0.13] bg-white text-black'
            : 'border-white/[0.14] bg-white/[0.055] text-white'
          : light
            ? 'border-black/[0.07] bg-black/[0.025] text-black/62 hover:border-black/[0.12] hover:bg-white hover:text-black'
            : 'border-white/[0.07] bg-white/[0.035] text-white/62 hover:border-white/[0.13] hover:bg-white/[0.055] hover:text-white',
      )}
      style={
        active
          ? {
              borderColor: `color-mix(in srgb, ${accentColor} 42%, transparent)`,
            }
          : undefined
      }
    >
      {label}

      {active ? (
        <span
          className="absolute bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full"
          style={{ background: accentColor }}
        />
      ) : null}
    </button>
  );
}

function EmptySlotsBox({
  children,
  light,
}: {
  children: ReactNode;
  light: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-[10px] border border-dashed px-3 py-6 text-center text-[12px] leading-5',
        light
          ? 'border-black/[0.08] bg-black/[0.018] text-black/42'
          : 'border-white/[0.08] bg-white/[0.025] text-white/38',
      )}
    >
      {children}
    </div>
  );
}

function FieldLabel({
  children,
  light,
}: {
  children: ReactNode;
  light: boolean;
}) {
  return (
    <div className={cn('mb-2 text-[10.5px] font-medium', mutedText(light))}>
      {children}
    </div>
  );
}


function extractTelegramStartPayload(url?: string | null) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('start');
  } catch {
    const match = url.match(/[?&]start=([^&]+)/i);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  }
}

function ManualTelegramCodeBox({
  code,
  light,
  labels,
}: {
  code: string;
  light: boolean;
  labels: {
    telegramManualTitle: string;
    telegramManualText: string;
    telegramManualCopy: string;
    telegramManualCopied: string;
  };
}) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard?.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className={cn(
        'mt-3 rounded-[12px] border p-3',
        light
          ? 'border-black/[0.08] bg-white/72'
          : 'border-white/[0.08] bg-[#141414]/72',
      )}
    >
      <div className={cn('text-[12px] font-semibold', pageText(light))}>
        {labels.telegramManualTitle}
      </div>
      <p className={cn('mt-1 text-[11px] leading-4', mutedText(light))}>
        {labels.telegramManualText}
      </p>

      <div
        className={cn(
          'mt-2 flex items-center gap-2 rounded-[10px] border px-2.5 py-2',
          light
            ? 'border-black/[0.08] bg-black/[0.025]'
            : 'border-white/[0.08] bg-white/[0.035]',
        )}
      >
        <code
          className={cn(
            'min-w-0 flex-1 truncate text-[11px] font-semibold leading-5',
            pageText(light),
          )}
        >
          {code}
        </code>
        <button
          type="button"
          onClick={copyCode}
          className={cn(
            'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[9px] border px-2.5 text-[10.5px] font-semibold transition active:scale-[0.98]',
            light
              ? 'border-black/[0.08] bg-white text-black/58 hover:text-black'
              : 'border-white/[0.08] bg-white/[0.04] text-white/52 hover:text-white',
          )}
        >
          <Copy className="size-3.5" />
          {copied ? labels.telegramManualCopied : labels.telegramManualCopy}
        </button>
      </div>
    </div>
  );
}

function SuccessView({
  booking,
  labels,
  light,
  locale,
  embedded,
  onNew,
  telegramUrl,
  vkUrl,
}: {
  booking: Booking;
  labels: {
    successTitle: string;
    successDescription: string;
    connectTitle: string;
    connectText: string;
    newRequest: string;
    telegramConfirm: string;
    telegramConfirmHint: string;
    telegramManualTitle: string;
    telegramManualText: string;
    telegramManualCopy: string;
    telegramManualCopied: string;
    vkConfirm: string;
    vkConfirmHint: string;
  };
  telegramUrl?: string | null;
  vkUrl?: string | null;
  light: boolean;
  locale: string;
  embedded: boolean;
  onNew: () => void;
}) {
  const telegramPayload = extractTelegramStartPayload(telegramUrl);
  const telegramManualCommand = telegramPayload ? `/start ${telegramPayload}` : null;

  return (
    <div
      className={cn(
        embedded ? 'bg-transparent p-0' : 'rounded-[11px] border p-4',
        !embedded && cardTone(light),
      )}
    >
      <Panel light={light} className="p-4">
        <div
          className={cn(
            'flex size-12 items-center justify-center rounded-[10px] border',
            light
              ? 'border-black/[0.08] bg-white text-black/70'
              : 'border-white/[0.08] bg-white/[0.04] text-white/70',
          )}
        >
          <CheckCircle2 className="size-6" />
        </div>

        <div
          className={cn(
            'mt-5 text-[28px] font-semibold leading-[1.02] tracking-[-0.07em]',
            pageText(light),
          )}
        >
          {labels.successTitle}
        </div>

        <p className={cn('mt-2 text-[13px] leading-6', mutedText(light))}>
          {labels.successDescription}
        </p>

        <div className="mt-5 grid gap-2">
          <div
            className={cn(
              'rounded-[9px] border px-3.5 py-3 text-[12px] font-semibold',
              light
                ? 'border-black/[0.08] bg-white text-black/70'
                : 'border-white/[0.08] bg-white/[0.04] text-white/70',
            )}
          >
            {normalizeVisibleServices(booking.service).map((service) => (
              <div key={service}>— {service}</div>
            ))}
          </div>

          {[formatDate(booking.date, undefined, locale), booking.time].map((item) => (
            <div
              key={item}
              className={cn(
                'rounded-[9px] border px-3.5 py-3 text-[12px] font-semibold',
                light
                  ? 'border-black/[0.08] bg-white text-black/70'
                  : 'border-white/[0.08] bg-white/[0.04] text-white/70',
              )}
            >
              {item}
            </div>
          ))}
        </div>

        {telegramUrl || vkUrl ? (
          <div
            className={cn(
              'mt-5 rounded-[12px] border p-3.5',
              light
                ? 'border-black/[0.09] bg-black/[0.025]'
                : 'border-white/[0.09] bg-white/[0.045]',
            )}
          >
            <div className={cn('text-[13px] font-semibold tracking-[-0.02em]', pageText(light))}>
              {labels.connectTitle}
            </div>
            <p className={cn('mt-1 text-[11px] leading-4', mutedText(light))}>
              {labels.connectText}
            </p>
          </div>
        ) : null}

        {telegramUrl || vkUrl ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {telegramUrl ? (
              <a
                href={telegramUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  'inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] px-4 text-[12px] font-semibold transition active:scale-[0.99]',
                  quietButtonClass(light),
                )}
              >
                <Send className="size-4" />
                {labels.telegramConfirm}
              </a>
            ) : null}

            {vkUrl ? (
              <a
                href={vkUrl}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  'inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] px-4 text-[12px] font-semibold transition active:scale-[0.99]',
                  quietButtonClass(light),
                )}
              >
                <MessageCircleMore className="size-4" />
                {labels.vkConfirm}
              </a>
            ) : null}
          </div>
        ) : null}

        {telegramManualCommand ? (
          <ManualTelegramCodeBox
            code={telegramManualCommand}
            light={light}
            labels={labels}
          />
        ) : null}

        {telegramUrl || vkUrl ? (
          <p className={cn('mt-2 text-center text-[10.5px] leading-4', faintText(light))}>
            {telegramUrl && vkUrl
              ? `${labels.telegramConfirmHint} ${labels.vkConfirmHint}`
              : telegramUrl
                ? labels.telegramConfirmHint
                : labels.vkConfirmHint}
          </p>
        ) : null}

        <Button
          type="button"
          className={cn(
            telegramUrl || vkUrl ? 'mt-3 w-full' : 'mt-5 w-full',
            telegramUrl || vkUrl ? quietButtonClass(light) : primaryButtonClass(light),
          )}
          onClick={onNew}
        >
          {labels.newRequest}
          <ArrowRight className="size-4" />
        </Button>
      </Panel>
    </div>
  );
}

export function BookingForm({
  profile,
  embedded = false,
  selectedService,
  appearanceSettings,
  availabilityDays,
  serviceDetails,
  bookedSlots,
}: {
  profile: MasterProfile;
  embedded?: boolean;
  selectedService?: string;
  appearanceSettings?: Partial<AppearanceSettings> | null;
  availabilityDays?: BookingAvailabilityDay[] | null;
  serviceDetails?: BookingServiceDetails[] | null;
  bookedSlots?: BookedSlot[] | null;
}) {
  const { createBooking } = useApp();
  const { settings } = useAppearance();
  const { locale } = useLocale();
  const { resolvedTheme } = useTheme();

  const [mounted, setMounted] = useState(false);

  const effectiveAppearance = appearanceSettings
    ? normalizeAppearanceSettings(appearanceSettings)
    : settings;
  const accent =
    accentPalette[effectiveAppearance.publicAccent] ??
    accentPalette[effectiveAppearance.accentTone] ??
    Object.values(accentPalette)[0];
  const accentColor = accent.solid;

  const profileServices = useMemo(() => profile.services ?? [], [profile.services]);
  const fallbackService = selectedService || profileServices[0] || '';

  const [values, setValues] = useState<BookingFormValues>(() =>
    createInitialValues(fallbackService),
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [serviceQuery, setServiceQuery] = useState('');
  const [submittedBooking, setSubmittedBooking] = useState<Booking | null>(null);
  const [submittedTelegramUrl, setSubmittedTelegramUrl] = useState<string | null>(null);
  const [submittedVkUrl, setSubmittedVkUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!selectedService) return;

    setValues((current) =>
      current.service === selectedService
        ? current
        : { ...current, service: selectedService },
    );
  }, [selectedService]);

  useEffect(() => {
    if (values.service || !profileServices[0]) return;

    setValues((current) => ({ ...current, service: profileServices[0] }));
  }, [profileServices, values.service]);

  const currentTheme: ThemeMode =
    mounted && resolvedTheme === 'light' ? 'light' : 'dark';
  const isLight = currentTheme === 'light';

  const labels =
    locale === 'ru'
      ? {
          title: 'Запись',
          subtitle:
            'Выберите услугу, удобный день, время и оставьте контакт для подтверждения.',
          selectService: 'Выберите услугу',
          serviceSearch: 'Найти услугу',
          serviceCount: 'вариантов',
          chooseDate: 'Выберите дату',
          chooseTime: 'Выберите время',
          yourName: 'Имя',
          yourPhone: 'Телефон',
          comment: 'Комментарий',
          commentPlaceholder:
            'Например: хочу спокойный нюд, есть пожелания по форме',
          next: 'Дальше',
          back: 'Назад',
          submit: 'Отправить',
          successTitle: 'Заявка отправлена',
          successDescription:
            'Заявка сохранена и уже попала мастеру в базу и карточку клиента. Если Telegram/VK нет — ничего делать не нужно: мастер свяжется по телефону, который вы указали.',
          connectTitle: 'Необязательно: подключите канал для уведомлений',
          connectText: 'Без Telegram/VK запись всё равно сохранена. Если Telegram просто открыл бота и ничего не связалось — отправьте код ниже одним сообщением в бот.',
          telegramConfirm: 'Подключить Telegram',
          telegramConfirmHint:
            'Telegram откроет бот и сразу пришлёт подтверждение записи, статус, напоминание и маршрут.',
          telegramManualTitle: 'Если Telegram просто открыл чат',
          telegramManualText: 'Скопируйте эту строку и отправьте её в бот одним сообщением. Обычный /start без кода не связывает запись.',
          telegramManualCopy: 'Скопировать',
          telegramManualCopied: 'Скопировано',
          vkConfirm: 'Подключить VK',
          vkConfirmHint: 'VK-бот продублирует статус, напоминание и маршрут.',
          newRequest: 'Новая заявка',
          nothingFound: 'Ничего не найдено.',
          step: 'Шаг',
          summary: 'Выбор',
          serviceStep: 'Услуга',
          dateStep: 'Время',
          contactStep: 'Контакты',
          contactDetails: 'Контактные данные',
          optional: 'Необязательно',
          availableSlots: 'слотов',
          noSlots: 'Нет слотов',
          chooseDateFirst: 'Сначала выберите дату.',
          noSlotsForDate:
            'На выбранный день мастер не включил рабочие слоты.',
          noAvailableDates:
            'На ближайшие дни пока нет доступных слотов.',
        }
      : {
          title: 'Booking',
          subtitle:
            'Choose a service, day, time, and leave your contact details for confirmation.',
          selectService: 'Choose a service',
          serviceSearch: 'Search service',
          serviceCount: 'options',
          chooseDate: 'Choose date',
          chooseTime: 'Choose time',
          yourName: 'Name',
          yourPhone: 'Phone',
          comment: 'Comment',
          commentPlaceholder: 'For example: preferred style, details or wishes',
          next: 'Next',
          back: 'Back',
          submit: 'Send',
          successTitle: 'Request sent',
          successDescription:
            'The request is saved and already added to the master client base. If you do not use Telegram/VK, you do not need to do anything: the master will contact you by phone.',
          connectTitle: 'Optional: connect a notification channel',
          connectText: 'Without Telegram/VK the booking is still saved. If Telegram only opened the bot and did not link the booking, send the code below as one message to the bot.',
          telegramConfirm: 'Connect Telegram',
          telegramConfirmHint:
            'Telegram will open the bot and send booking confirmation, status, reminder, and route.',
          telegramManualTitle: 'If Telegram only opened the chat',
          telegramManualText: 'Copy this line and send it to the bot as one message. Plain /start without the code does not link the booking.',
          telegramManualCopy: 'Copy',
          telegramManualCopied: 'Copied',
          vkConfirm: 'Connect VK',
          vkConfirmHint: 'VK bot can also send status, reminder, and route.',
          newRequest: 'New request',
          nothingFound: 'Nothing found.',
          step: 'Step',
          summary: 'Summary',
          serviceStep: 'Service',
          dateStep: 'Time',
          contactStep: 'Contacts',
          contactDetails: 'Contact details',
          optional: 'Optional',
          availableSlots: 'slots',
          noSlots: 'No slots',
          chooseDateFirst: 'Choose a date first.',
          noSlotsForDate:
            'The master has not enabled working slots for this day.',
          noAvailableDates:
            'No available slots for the nearest dates yet.',
        };

  const steps = [labels.serviceStep, labels.dateStep, labels.contactStep];

  const profileAvailability = useMemo(
    () => normalizeAvailabilityDays(availabilityDays),
    [availabilityDays],
  );

  const normalizedServiceDetails = useMemo(
    () => normalizeServiceDetails(serviceDetails),
    [serviceDetails],
  );

  const quickDates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = addDays(new Date(), index);
        const value = format(date, 'yyyy-MM-dd');
        const times = getAvailableTimesForDate({
          availability: profileAvailability,
          date: value,
          serviceName: values.service || fallbackService,
          services: normalizedServiceDetails,
          bookedSlots,
        });
        const disabled = times.length === 0;

        return {
          value,
          label: new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          }).format(date),
          times,
          disabled,
        };
      }),
    [bookedSlots, fallbackService, locale, normalizedServiceDetails, profileAvailability, values.service],
  );

  const selectedDateOption = useMemo(
    () => quickDates.find((date) => date.value === values.date) ?? null,
    [quickDates, values.date],
  );

  const availableTimes = selectedDateOption?.times ?? [];
  const hasAnyAvailableDate = quickDates.some((date) => !date.disabled);

  useEffect(() => {
    if (!values.date || !values.time) return;

    if (!availableTimes.includes(values.time)) {
      setValues((current) => ({ ...current, time: '' }));
    }
  }, [availableTimes, values.date, values.time]);

  const progressValue = ((currentStep + 1) / steps.length) * 100;

  const progressStyle = {
    width: `${Math.max(18, progressValue)}%`,
    background: accentColor,
  } satisfies CSSProperties;

  const selectedItems = [
    values.service || null,
    values.date ? formatDate(values.date, undefined, locale) : null,
    values.time || null,
  ].filter(Boolean) as string[];

  const canMoveForward = () => {
    if (currentStep === 0) return Boolean(values.service);
    if (currentStep === 1) return Boolean(values.date && values.time && availableTimes.includes(values.time));

    return Boolean(values.clientName.trim() && values.clientPhone.trim());
  };

  const goNext = () => {
    if (!canMoveForward()) return;
    setCurrentStep((step) => Math.min(steps.length - 1, step + 1));
  };

  const goBack = () => {
    setCurrentStep((step) => Math.max(0, step - 1));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canMoveForward()) return;

    const result = await createBooking(profile.slug, values);

    if (!result.success || !result.booking) {
      setError(result.error || 'Unable to create booking');
      return;
    }

    setError(null);
    setSubmittedBooking(result.booking);
    setSubmittedTelegramUrl(result.telegramConfirmationUrl ?? null);
    setSubmittedVkUrl(result.vkConfirmationUrl ?? null);
    setValues(createInitialValues(selectedService || profileServices[0] || ''));
    setCurrentStep(0);
  };

  if (submittedBooking) {
    return (
      <SuccessView
        booking={submittedBooking}
        labels={labels}
        light={isLight}
        locale={locale}
        embedded={embedded}
        telegramUrl={submittedTelegramUrl}
        vkUrl={submittedVkUrl}
        onNew={() => {
          setSubmittedBooking(null);
          setSubmittedTelegramUrl(null);
          setSubmittedVkUrl(null);
        }}
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        embedded ? 'space-y-4 bg-transparent p-0' : 'rounded-[11px] border p-4',
        !embedded && cardTone(isLight),
      )}
    >
      <div className="space-y-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <MicroLabel light={isLight} active accentColor={accentColor}>
              <CalendarClock className="size-3.5" />
              {labels.title}
            </MicroLabel>

            <MicroLabel light={isLight}>
              {labels.step} {currentStep + 1}/{steps.length}
            </MicroLabel>
          </div>

          <h3
            className={cn(
              'mt-4 text-[28px] font-semibold leading-[1.02] tracking-[-0.075em]',
              pageText(isLight),
            )}
          >
            {steps[currentStep]}
          </h3>

          <p
            className={cn(
              'mt-2 max-w-[520px] text-[13px] leading-6',
              mutedText(isLight),
            )}
          >
            {labels.subtitle}
          </p>
        </div>

        <div
          className={cn(
            'h-1 overflow-hidden rounded-full',
            isLight ? 'bg-black/[0.06]' : 'bg-white/[0.07]',
          )}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={progressStyle}
          />
        </div>

        <StepRail
          steps={steps}
          currentStep={currentStep}
          light={isLight}
          accentColor={accentColor}
        />

        <SummaryBar
          items={selectedItems}
          label={labels.summary}
          light={isLight}
          accentColor={accentColor}
        />
      </div>

      {currentStep === 0 ? (
        <Panel light={isLight} className="relative z-20 space-y-3 overflow-visible p-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Sparkles
                className="size-4 shrink-0"
                style={{ color: accentColor }}
              />
              <div
                className={cn(
                  'truncate text-[13px] font-semibold',
                  pageText(isLight),
                )}
              >
                {labels.selectService}
              </div>
            </div>

            <MicroLabel light={isLight}>
              {profileServices.length} {labels.serviceCount}
            </MicroLabel>
          </div>

          <ServiceDropdown
            value={values.service}
            services={profileServices}
            query={serviceQuery}
            setQuery={setServiceQuery}
            placeholder={labels.selectService}
            searchPlaceholder={labels.serviceSearch}
            emptyLabel={labels.nothingFound}
            countLabel={labels.serviceCount}
            light={isLight}
            accentColor={accentColor}
            onSelect={(service) => {
              setValues((current) => ({ ...current, service }));
            }}
          />
        </Panel>
      ) : null}

      {currentStep === 1 ? (
        <Panel light={isLight} className="space-y-5 p-3.5">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <CalendarClock className="size-4" style={{ color: accentColor }} />
              <div className={cn('text-[13px] font-semibold', pageText(isLight))}>
                {labels.chooseDate}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {quickDates.map((date) => (
                <DateOption
                  key={date.value}
                  label={date.label}
                  hint={
                    date.disabled
                      ? labels.noSlots
                      : `${date.times.length} ${labels.availableSlots}`
                  }
                  disabled={date.disabled}
                  active={values.date === date.value}
                  light={isLight}
                  accentColor={accentColor}
                  onClick={() =>
                    setValues((current) => ({
                      ...current,
                      date: date.value,
                      time: date.times.includes(current.time) ? current.time : '',
                    }))
                  }
                />
              ))}
            </div>

            {!hasAnyAvailableDate ? (
              <div className="mt-3">
                <EmptySlotsBox light={isLight}>{labels.noAvailableDates}</EmptySlotsBox>
              </div>
            ) : null}
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <Clock3 className="size-4" style={{ color: accentColor }} />
              <div className={cn('text-[13px] font-semibold', pageText(isLight))}>
                {labels.chooseTime}
              </div>
            </div>

            {!values.date ? (
              <EmptySlotsBox light={isLight}>{labels.chooseDateFirst}</EmptySlotsBox>
            ) : availableTimes.length ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {availableTimes.map((time) => (
                  <TimeOption
                    key={time}
                    label={time}
                    active={values.time === time}
                    light={isLight}
                    accentColor={accentColor}
                    onClick={() => {
                      setValues((current) => ({ ...current, time }));
                    }}
                  />
                ))}
              </div>
            ) : (
              <EmptySlotsBox light={isLight}>{labels.noSlotsForDate}</EmptySlotsBox>
            )}
          </div>
        </Panel>
      ) : null}

      {currentStep === 2 ? (
        <Panel light={isLight} className="space-y-4 p-3.5">
          <div className="flex items-center gap-2">
            <UserRound className="size-4" style={{ color: accentColor }} />
            <div className={cn('text-[13px] font-semibold', pageText(isLight))}>
              {labels.contactDetails}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel light={isLight}>{labels.yourName}</FieldLabel>

              <Input
                value={values.clientName}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    clientName: event.target.value,
                  }))
                }
                placeholder={labels.yourName}
                className={inputClass(isLight)}
              />
            </div>

            <div>
              <FieldLabel light={isLight}>{labels.yourPhone}</FieldLabel>

              <Input
                value={values.clientPhone}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    clientPhone: event.target.value,
                  }))
                }
                placeholder="+7 999 000-00-00"
                className={inputClass(isLight)}
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MessageSquareText
                  className="size-4"
                  style={{ color: accentColor }}
                />
                <div className={cn('text-[10.5px] font-medium', mutedText(isLight))}>
                  {labels.comment}
                </div>
              </div>

              <span className={cn('text-[10.5px]', faintText(isLight))}>
                {labels.optional}
              </span>
            </div>

            <Textarea
              value={values.comment}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  comment: event.target.value,
                }))
              }
              placeholder={labels.commentPlaceholder}
              className={cn('min-h-[104px] resize-none', textareaClass(isLight))}
            />
          </div>
        </Panel>
      ) : null}

      {error ? (
        <div
          className={cn(
            'rounded-[10px] border px-3.5 py-3 text-[12px]',
            isLight
              ? 'border-red-500/20 bg-red-500/10 text-red-700'
              : 'border-red-400/20 bg-red-400/10 text-red-300',
          )}
        >
          {error}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          className={quietButtonClass(isLight)}
          onClick={goBack}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="size-4" />
          {labels.back}
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button
            type="button"
            className={primaryButtonClass(isLight)}
            onClick={goNext}
            disabled={!canMoveForward()}
          >
            {labels.next}
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button
            type="submit"
            className={primaryButtonClass(isLight)}
            disabled={!canMoveForward()}
          >
            <CheckCircle2 className="size-4" />
            {labels.submit}
          </Button>
        )}
      </div>
    </form>
  );
}