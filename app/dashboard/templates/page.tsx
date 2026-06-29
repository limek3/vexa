// app/dashboard/templates/page.tsx
'use client';

import Link from 'next/link';
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTheme } from 'next-themes';
import {
  Check,
  Copy,
  MessageSquareText,
  Plus,
  Search,
  Send,
  Sparkles,
  SquarePen,
  Trash2,
  X,
} from 'lucide-react';

import { WorkspaceShell } from '@/components/shared/workspace-shell';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useOwnedWorkspaceData } from '@/hooks/use-owned-workspace-data';
import { useWorkspaceSection } from '@/hooks/use-workspace-section';
import { useAppearance } from '@/lib/appearance-context';
import { accentPalette } from '@/lib/appearance-palette';
import { type MessageTemplateInsight } from '@/lib/master-workspace';
import { cn } from '@/lib/utils';
import { menuContentClass, menuTriggerClass } from '@/lib/menu-styles';

type ThemeMode = 'light' | 'dark';

const CHANNEL_OPTIONS = ['Telegram', 'VK', 'Push'] as const;

type ChannelOption = (typeof CHANNEL_OPTIONS)[number];
type ChannelFilter = 'all' | ChannelOption;
type TemplatePresetKey = 'confirm' | 'reminder' | 'thanks' | 'return';

const TEMPLATE_PRESET_KEYS: TemplatePresetKey[] = [
  'confirm',
  'reminder',
  'thanks',
  'return',
];

const VARIABLE_HINTS_RU = [
  { key: '{имя}', title: 'имя клиента' },
  { key: '{дата}', title: 'дата записи' },
  { key: '{время}', title: 'время записи' },
  { key: '{услуга}', title: 'выбранная услуга' },
  { key: '{ссылка}', title: 'ссылка на запись' },
] as const;

const VARIABLE_HINTS_EN = [
  { key: '{name}', title: 'client name' },
  { key: '{date}', title: 'booking date' },
  { key: '{time}', title: 'booking time' },
  { key: '{service}', title: 'selected service' },
  { key: '{link}', title: 'booking link' },
] as const;

function buildTemplatePreset(
  locale: 'ru' | 'en',
  preset: TemplatePresetKey,
): MessageTemplateInsight {
  const id = `template-${crypto.randomUUID()}`;

  if (locale === 'ru') {
    if (preset === 'reminder') {
      return {
        id,
        title: 'Напоминание о визите',
        channel: 'Telegram',
        conversion: '0%',
        variables: ['{имя}', '{дата}', '{время}'],
        content:
          'Здравствуйте, {имя}! Напоминаю о вашей записи {дата} в {время}. Если планы изменились, пожалуйста, ответьте на это сообщение.',
      };
    }

    if (preset === 'thanks') {
      return {
        id,
        title: 'Спасибо после визита',
        channel: 'VK',
        conversion: '0%',
        variables: ['{имя}', '{ссылка}'],
        content:
          'Спасибо за визит, {имя}! Буду рада видеть вас снова. Быстрая запись по ссылке: {ссылка}',
      };
    }

    if (preset === 'return') {
      return {
        id,
        title: 'Возвратный визит',
        channel: 'VK',
        conversion: '0%',
        variables: ['{имя}', '{ссылка}'],
        content:
          'Здравствуйте, {имя}! Открыла новые слоты на ближайшие недели. Выбрать удобное время можно здесь: {ссылка}',
      };
    }

    return {
      id,
      title: 'Запись создана',
      channel: 'Telegram',
      conversion: '0%',
      variables: ['{имя}', '{дата}', '{время}', '{услуга}', '{ссылка}'],
      content:
        'Здравствуйте, {имя}! Ваша запись на {услуга} создана: {дата} в {время}. Детали и повторная запись: {ссылка}',
    };
  }

  if (preset === 'reminder') {
    return {
      id,
      title: 'Appointment reminder',
      channel: 'Telegram',
      conversion: '0%',
      variables: ['{name}', '{date}', '{time}'],
      content:
        'Hello, {name}! Just a reminder about your booking on {date} at {time}. Reply here if you need to change the time.',
    };
  }

  if (preset === 'thanks') {
    return {
      id,
      title: 'Post-visit thanks',
      channel: 'VK',
      conversion: '0%',
      variables: ['{name}', '{link}'],
      content:
        'Thank you for your visit, {name}! I would love to see you again. Here is the quick booking link: {link}',
    };
  }

  if (preset === 'return') {
    return {
      id,
      title: 'Return visit',
      channel: 'VK',
      conversion: '0%',
      variables: ['{name}', '{link}'],
      content:
        'Hi, {name}! New slots are open for the next weeks. Book the best time here: {link}',
    };
  }

  return {
    id,
    title: 'Booking created',
    channel: 'Telegram',
    conversion: '0%',
    variables: ['{name}', '{date}', '{time}', '{service}', '{link}'],
    content:
      'Hello, {name}! Your {service} booking is created for {date} at {time}. Details and rebooking: {link}',
  };
}

function getDefaultTemplates(locale: 'ru' | 'en') {
  return TEMPLATE_PRESET_KEYS.map((key) => buildTemplatePreset(locale, key));
}

function createTemplate(locale: 'ru' | 'en') {
  return buildTemplatePreset(locale, 'confirm');
}

function getTemplatePresetKey(template: Pick<MessageTemplateInsight, 'title' | 'content'>) {
  const title = template.title.trim().toLowerCase();
  const content = template.content.trim().toLowerCase();

  const titleMap: Record<string, TemplatePresetKey> = {
    'подтверждение записи': 'confirm',
    'booking confirmation': 'confirm',
    'confirmation message': 'confirm',
    'confirm booking': 'confirm',

    'напоминание о визите': 'reminder',
    'appointment reminder': 'reminder',
    'reminder message': 'reminder',
    'booking reminder': 'reminder',

    'спасибо после визита': 'thanks',
    'post-visit thanks': 'thanks',
    'post-visit thank you': 'thanks',
    'thank you message': 'thanks',

    'возвратный визит': 'return',
    'return visit': 'return',
    'return invitation': 'return',
    'return message': 'return',
  };

  if (titleMap[title]) return titleMap[title];

  if (
    content.includes('{услуга}') ||
    content.includes('{service}') ||
    content.includes('подтверждаю вашу запись') ||
    content.includes('your booking is confirmed')
  ) {
    return 'confirm';
  }

  if (
    content.includes('напоминаю') ||
    content.includes('quick reminder') ||
    content.includes('just a reminder') ||
    content.includes('reminder about your booking')
  ) {
    return 'reminder';
  }

  if (
    content.includes('спасибо за визит') ||
    content.includes('thanks for coming') ||
    content.includes('thank you for your visit')
  ) {
    return 'thanks';
  }

  if (
    content.includes('новые слоты') ||
    content.includes('new slots') ||
    content.includes('new time slots') ||
    content.includes('return visit')
  ) {
    return 'return';
  }

  return null;
}

function normalizeChannel(channel: string): ChannelOption {
  const value = channel.trim().toLowerCase();

  if (value.includes('telegram') || value.includes('телеграм')) return 'Telegram';
  if (value === 'max' || value.includes(' max')) return 'VK';
  if (value.includes('vk') || value.includes('вк') || value.includes('max') || value.includes('макс')) return 'VK';
  if (value.includes('push') || value.includes('пуш')) return 'Push';

  return 'Telegram';
}

function localizeTemplate(
  template: MessageTemplateInsight,
  locale: 'ru' | 'en',
): MessageTemplateInsight {
  const presetKey = getTemplatePresetKey(template);

  if (!presetKey) {
    return {
      ...template,
      channel: normalizeChannel(template.channel),
      conversion: '0%',
    };
  }

  const localized = buildTemplatePreset(locale, presetKey);

  return {
    ...localized,
    id: template.id,
    channel: normalizeChannel(localized.channel),
    conversion: '0%',
  };
}

function channelDisplayLabel(channel: string, locale: 'ru' | 'en') {
  const normalized = normalizeChannel(channel);

  if (locale !== 'ru') return normalized;
  if (normalized === 'Telegram') return 'ТГ';
  if (normalized === 'VK') return 'ВК';
  if (normalized === 'Push') return 'Пуш';

  return normalized;
}

function buildPreview(
  template: Pick<MessageTemplateInsight, 'content'>,
  locale: 'ru' | 'en',
) {
  const sampleMap =
    locale === 'ru'
      ? {
          '{имя}': 'Анна',
          '{дата}': '15 ноября',
          '{время}': '14:30',
          '{ссылка}': 'https://кликбук.рф/m/demo',
          '{услуга}': 'маникюр',
          '{name}': 'Анна',
          '{date}': '15 ноября',
          '{time}': '14:30',
          '{link}': 'https://кликбук.рф/m/demo',
          '{service}': 'маникюр',
        }
      : {
          '{name}': 'Anna',
          '{date}': '15 November',
          '{time}': '2:30 PM',
          '{link}': 'https://кликбук.рф/m/demo',
          '{service}': 'manicure',
          '{имя}': 'Anna',
          '{дата}': '15 November',
          '{время}': '2:30 PM',
          '{ссылка}': 'https://кликбук.рф/m/demo',
          '{услуга}': 'manicure',
        };

  return Object.entries(sampleMap).reduce(
    (result, [key, value]) => result.replaceAll(key, value),
    template.content,
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

function fieldTone(light: boolean) {
  return light
    ? 'border-black/[0.08] bg-white text-black placeholder:text-black/34'
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
        ? 'border-black/[0.08] bg-white text-black/58 hover:border-black/[0.14] hover:bg-black/[0.035] hover:text-black'
        : 'border-white/[0.08] bg-white/[0.04] text-white/55 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white',
  );
}

function disabledButtonClass() {
  return 'disabled:pointer-events-none disabled:opacity-40';
}

function inputClass(light: boolean) {
  return cn(
    'rounded-[9px] border text-[12px] shadow-none outline-none focus-visible:ring-0',
    fieldTone(light),
  );
}

function selectTriggerClass(light: boolean) {
  return menuTriggerClass(light);
}

function selectContentClass(light: boolean) {
  return menuContentClass(light);
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

        <div
          className={cn(
            'mt-4 text-[13px] font-semibold tracking-[-0.018em]',
            pageText(light),
          )}
        >
          {title}
        </div>

        <p className={cn('mt-1 text-[11px] leading-4', mutedText(light))}>
          {description}
        </p>
      </div>
    </Card>
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

function FieldLabelRow({
  children,
  action,
  light,
}: {
  children: ReactNode;
  action?: ReactNode;
  light: boolean;
}) {
  return (
    <div className="mb-2 flex h-8 items-center justify-start gap-1">
      <div
        className={cn(
          'flex h-8 shrink-0 items-center text-[10.5px] font-medium leading-none',
          mutedText(light),
        )}
      >
        {children}
      </div>

      {action ? (
        <div className="flex h-8 shrink-0 items-center">{action}</div>
      ) : null}
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
        'group relative inline-flex h-10 min-w-0 items-center justify-center border-r px-2 text-[11px] font-semibold tracking-[-0.015em] transition-colors duration-150 last:border-r-0 active:scale-[0.985]',
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
      <span className="relative z-10 truncate">{label}</span>

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

function VariableCompactBar({
  variables,
  light,
  emptyLabel,
  onRemove,
}: {
  variables: string[];
  light: boolean;
  emptyLabel: string;
  onRemove?: (variable: string) => void;
}) {
  return (
    <div
      className={cn(
        'flex min-h-9 flex-wrap items-center gap-1.5 rounded-[9px] border px-2 py-1.5',
        light
          ? 'border-black/[0.07] bg-black/[0.018]'
          : 'border-white/[0.07] bg-white/[0.025]',
      )}
    >
      {variables.length ? (
        variables.map((variable) => (
          <span
            key={variable}
            className={cn(
              'inline-flex h-6 items-center gap-1.5 rounded-[8px] border px-2 text-[10.5px] font-medium',
              light
                ? 'border-black/[0.08] bg-white text-black/54'
                : 'border-white/[0.08] bg-white/[0.04] text-white/50',
            )}
          >
            {variable}

            {onRemove ? (
              <button
                type="button"
                onClick={() => onRemove(variable)}
                className={cn(
                  '-mr-1 inline-flex size-4 items-center justify-center rounded-[6px] transition',
                  light
                    ? 'text-black/28 hover:bg-black/[0.055] hover:text-black/70'
                    : 'text-white/28 hover:bg-white/[0.08] hover:text-white/70',
                )}
                aria-label="Remove variable"
              >
                <X className="size-3" />
              </button>
            ) : null}
          </span>
        ))
      ) : (
        <span className={cn('px-1 text-[11px]', mutedText(light))}>{emptyLabel}</span>
      )}
    </div>
  );
}

function ChannelBadge({
  channel,
  locale,
  light,
  accentColor,
}: {
  channel: string;
  locale: 'ru' | 'en';
  light: boolean;
  accentColor: string;
}) {
  return (
    <div className="flex min-w-[94px] items-center justify-end gap-2">
      <div className="min-w-0 text-right">
        <div
          className={cn(
            'text-[11.5px] font-semibold leading-none tracking-[-0.018em]',
            light ? 'text-black/72' : 'text-white/74',
          )}
        >
          {channelDisplayLabel(channel, locale)}
        </div>

        <div
          className={cn(
            'mt-1 text-[9.5px] font-medium uppercase tracking-[0.12em]',
            light ? 'text-black/32' : 'text-white/28',
          )}
        >
          {locale === 'ru' ? 'канал' : 'channel'}
        </div>
      </div>

      <span
        style={{
          background: accentColor,
          boxShadow: `0 0 0 3px color-mix(in srgb, ${accentColor} 14%, transparent)`,
        }}
        className="size-2 shrink-0 rounded-full"
      />
    </div>
  );
}

function PreviewMessage({
  template,
  title,
  description,
  locale,
  light,
  accentColor,
}: {
  template: MessageTemplateInsight;
  title: string;
  description?: string;
  locale: 'ru' | 'en';
  light: boolean;
  accentColor: string;
}) {
  return (
    <Panel light={light}>
      <div className={cn('border-b px-4 py-3', borderTone(light))}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className={cn('text-[13px] font-semibold', pageText(light))}>
              {title}
            </div>

            {description ? (
              <div className={cn('mt-1 text-[11px] leading-4', mutedText(light))}>
                {description}
              </div>
            ) : null}
          </div>

          <span
            className="mt-1 size-2 rounded-full"
            style={{
              background: accentColor,
              boxShadow: `0 0 0 3px color-mix(in srgb, ${accentColor} 14%, transparent)`,
            }}
          />
        </div>
      </div>

      <div className="p-4">
        <div
          className={cn(
            'rounded-[13px] border px-4 py-3 text-[12.5px] leading-6',
            light
              ? 'border-black/[0.08] bg-white text-black/78 shadow-[0_12px_30px_rgba(15,15,15,0.045)]'
              : 'border-white/[0.08] bg-white/[0.045] text-white/78 shadow-[0_14px_34px_rgba(0,0,0,0.22)]',
          )}
        >
          {buildPreview(template, locale)}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <MicroLabel light={light}>
            <Send className="size-3.5" />
            {channelDisplayLabel(template.channel, locale)}
          </MicroLabel>
        </div>
      </div>
    </Panel>
  );
}

function VariableDropdown({
  locale,
  light,
  placeholder,
  onInsert,
}: {
  locale: 'ru' | 'en';
  light: boolean;
  placeholder: string;
  onInsert: (variable: string) => void;
}) {
  const hints = locale === 'ru' ? VARIABLE_HINTS_RU : VARIABLE_HINTS_EN;
  const [selectKey, setSelectKey] = useState(0);

  return (
    <Select
      key={selectKey}
      onValueChange={(value) => {
        onInsert(value);
        setSelectKey((current) => current + 1);
      }}
    >
      <SelectTrigger
        aria-label={placeholder}
        className={cn(
          selectTriggerClass(light),
          'h-8 w-fit min-w-0 justify-start gap-1.5 px-2.5 text-[10.5px] font-semibold leading-none tracking-[-0.025em]',
          '[&>span]:w-auto [&>span]:max-w-none [&>span]:shrink-0 [&>span]:truncate-0',
          '[&>svg]:ml-0 [&>svg]:size-3 [&>svg]:shrink-0',
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>

      <SelectContent
        position="popper"
        sideOffset={8}
        align="start"
        className={selectContentClass(light)}
      >
        {hints.map((hint) => (
          <SelectItem key={hint.key} value={hint.key}>
            {hint.key} · {hint.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ScenarioCard({
  template,
  active,
  copied,
  copyLabel,
  copiedLabel,
  removeLabel,
  locale,
  light,
  accentColor,
  previewAccentColor,
  onSelect,
  onCopy,
  onDelete,
}: {
  template: MessageTemplateInsight;
  active: boolean;
  copied: boolean;
  copyLabel: string;
  copiedLabel: string;
  removeLabel: string;
  locale: 'ru' | 'en';
  light: boolean;
  accentColor: string;
  previewAccentColor: string;
  onSelect: () => void;
  onCopy: () => void;
  onDelete: () => void;
}) {
  const normalizedChannel = normalizeChannel(template.channel);
  const presetKey = getTemplatePresetKey(template);
  const preview = buildPreview(template, locale);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-[10px] border outline-none transition-[background,border-color,transform,box-shadow] duration-150 hover:-translate-y-[1px]',
        active
          ? light
            ? 'border-black/[0.14] bg-white shadow-[0_12px_28px_rgba(15,15,15,0.055)]'
            : 'border-white/[0.14] bg-white/[0.06] shadow-[0_18px_40px_rgba(0,0,0,0.28)]'
          : light
            ? 'border-black/[0.07] bg-white/64 hover:border-black/[0.13] hover:bg-white'
            : 'border-white/[0.07] bg-white/[0.035] hover:border-white/[0.13] hover:bg-white/[0.055]',
      )}
    >
      <span
        className="absolute left-0 top-3 h-[calc(100%-24px)] w-[3px] rounded-r-full"
        style={{ background: active ? accentColor : previewAccentColor }}
      />

      <div className="p-4 pl-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <MicroLabel light={light} active={active} accentColor={accentColor}>
                {channelDisplayLabel(normalizedChannel, locale)}
              </MicroLabel>
            </div>

            <div
              className={cn(
                'mt-3 truncate text-[14px] font-semibold tracking-[-0.025em]',
                pageText(light),
              )}
            >
              {template.title}
            </div>

            <div className={cn('mt-1 line-clamp-2 text-[11.5px] leading-5', mutedText(light))}>
              {preview}
            </div>
          </div>

          <span
            className={cn(
              'mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-[9px] border',
              active
                ? 'cb-accent-pill-active'
                : light
                  ? 'border-black/[0.07] bg-black/[0.025] text-black/38'
                  : 'border-white/[0.07] bg-white/[0.035] text-white/38',
            )}
          >
            {presetKey === 'confirm' ? <Check className="size-4" /> : null}
            {presetKey === 'reminder' ? <MessageSquareText className="size-4" /> : null}
            {presetKey === 'thanks' ? <Sparkles className="size-4" /> : null}
            {presetKey === 'return' ? <Send className="size-4" /> : null}
            {!presetKey ? <SquarePen className="size-4" /> : null}
          </span>
        </div>

        <div className="mt-3">
          <VariableCompactBar
            variables={template.variables.slice(0, 4)}
            light={light}
            emptyLabel={locale === 'ru' ? 'Без переменных' : 'No variables'}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onCopy();
            }}
            className={cn(buttonBase(light), 'h-7 px-2 text-[11px]')}
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? copiedLabel : copyLabel}
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete();
            }}
            className={cn(
              buttonBase(light),
              'h-7 px-2 text-[11px]',
              light ? 'text-red-600 hover:text-red-700' : 'text-red-300 hover:text-red-200',
            )}
          >
            <Trash2 className="size-3.5" />
            {removeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function PresetCard({
  title,
  description,
  active,
  icon,
  light,
  accentColor,
  onClick,
}: {
  title: string;
  description: string;
  active: boolean;
  icon: ReactNode;
  light: boolean;
  accentColor: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={
        active
          ? {
              borderColor: `color-mix(in srgb, ${accentColor} 42%, transparent)`,
              background: light
                ? `color-mix(in srgb, ${accentColor} 8%, #ffffff)`
                : `color-mix(in srgb, ${accentColor} 14%, #151515)`,
            }
          : undefined
      }
      className={cn(
        'rounded-[10px] border p-3 text-left transition active:scale-[0.99]',
        active
          ? light
            ? 'text-black'
            : 'text-white'
          : light
            ? 'border-black/[0.08] bg-white text-black/62 hover:border-black/[0.13] hover:bg-black/[0.018] hover:text-black'
            : 'border-white/[0.08] bg-white/[0.04] text-white/60 hover:border-white/[0.13] hover:bg-white/[0.07] hover:text-white',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[12px] font-semibold">{title}</div>

          <div className={cn('mt-1 line-clamp-2 text-[10.5px] leading-4', mutedText(light))}>
            {description}
          </div>
        </div>

        <span
          className={cn(
            'inline-flex size-7 shrink-0 items-center justify-center rounded-[9px] border',
            active
              ? 'cb-accent-pill-active'
              : light
                ? 'border-black/[0.07] bg-black/[0.025] text-black/38'
                : 'border-white/[0.07] bg-white/[0.035] text-white/38',
          )}
        >
          {icon}
        </span>
      </div>
    </button>
  );
}

export default function TemplatesPage() {
  const { hasHydrated, ownedProfile, dataset, locale } = useOwnedWorkspaceData();
  const { resolvedTheme } = useTheme();
  const { settings } = useAppearance();

  const [mounted, setMounted] = useState(false);
  const initialTemplates = useMemo(() => getDefaultTemplates(locale), [locale]);

  const [templates, setTemplates, storageReady] = useWorkspaceSection<MessageTemplateInsight[]>(
    'templates',
    initialTemplates,
  );

  const [draft, setDraft] = useState<MessageTemplateInsight>(() => createTemplate(locale));
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');

  const didSeedTemplatesRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!storageReady || !dataset || didSeedTemplatesRef.current) return;

    didSeedTemplatesRef.current = true;

    if (templates.length === 0) {
      const seeded = getDefaultTemplates(locale);
      setTemplates(seeded);
      setActiveTemplateId(seeded[0]?.id ?? null);
    }
  }, [dataset, locale, setTemplates, storageReady, templates.length]);

  useEffect(() => {
    if (!storageReady || !mounted) return;

    setDraft((current) => {
      const presetKey = getTemplatePresetKey(current);
      return presetKey ? buildTemplatePreset(locale, presetKey) : createTemplate(locale);
    });

    setTemplates((current) => {
      if (!current.length) return getDefaultTemplates(locale);

      return current.map((template) => localizeTemplate(template, locale));
    });

    setChannelFilter('all');
  }, [locale, mounted, setTemplates, storageReady]);

  useEffect(() => {
    if (!storageReady) return;

    setActiveTemplateId((current) => {
      if (current && templates.some((template) => template.id === current)) return current;
      return templates[0]?.id ?? null;
    });
  }, [storageReady, templates]);

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
          title: 'Шаблоны',
          description:
            'Сценарии сообщений для подтверждений, напоминаний, возврата клиентов и повторных визитов.',

          createProfileTitle: 'Сначала настройте профиль мастера',
          createProfileDescription:
            'Создайте профиль, чтобы открыть библиотеку шаблонов сообщений, быстрые сценарии, каналы и предпросмотр.',
          createProfileButton: 'Создать профиль',
          emptyBadge: 'Профиль не найден',
          emptyCardLibraryLabel: 'Библиотека',
          emptyCardLibraryTitle: 'Шаблоны сообщений',
          emptyCardLibraryText:
            'После создания профиля здесь появятся подтверждения, напоминания и повторные касания.',
          emptyCardPreviewLabel: 'Preview',
          emptyCardPreviewTitle: 'Предпросмотр клиента',
          emptyCardPreviewText:
            'Можно будет видеть сообщение так, как его получит клиент после подстановки переменных.',
          emptyCardStartLabel: 'Старт',
          emptyCardStartTitle: 'Один шаг до запуска',
          emptyCardStartText:
            'Заполните профиль мастера, затем настройте тексты и используйте их в чатах.',

          activeTemplates: 'Шаблоны',
          variables: 'Переменные',
          channels: 'Каналы',
          total: 'всего',
          unique: 'доступно',
          active: 'активных',

          boardTitle: 'Сценарии',
          boardDescription:
            'Слева список сообщений, по центру редактор, справа предпросмотр и создание нового сценария.',
          editorTitle: 'Редактор сценария',
          editorDescription:
            'Редактируйте выбранный шаблон и добавляйте переменные через кнопку рядом с текстом.',
          createTitle: 'Новый сценарий',
          createDescription: 'Выберите готовую основу, поправьте текст и сохраните в библиотеку.',

          add: 'Сохранить шаблон',
          duplicate: 'Дублировать',
          remove: 'Удалить',
          copy: 'Копировать',
          copied: 'Скопировано',
          titleField: 'Название',
          channelField: 'Канал',
          variablesField: 'Переменные',
          addVariable: '{переменные}',
          contentField: 'Текст сообщения',
          previewField: 'Предпросмотр',
          searchPlaceholder: 'Поиск по названию, каналу или тексту',
          allChannels: 'Все',
          empty: 'По текущим фильтрам шаблоны не найдены.',
          livePreview: 'Как увидит клиент',
          livePreviewDescription: 'Сообщение после подстановки переменных.',
          quickHint: 'Совет',
          quickHintText: 'Один короткий CTA и ссылка ближе к концу сообщения.',
          addHint: 'Новый сценарий сразу появится в списке слева.',
          counter: 'Найдено',
          draft: 'Черновик',
          workspaceDescription:
            'Выберите сценарий слева, редактируйте в центре, preview и создание справа.',
          noVariables: 'Переменные не добавлены',
          selectTemplate: 'Выберите шаблон',
          selectTemplateDescription: 'Нажмите на карточку слева, чтобы открыть редактор.',
          confirmPreset: 'Подтверждение',
          confirmPresetDescription: 'Сразу после записи',
          reminderPreset: 'Напоминание',
          reminderPresetDescription: 'Перед визитом',
          thanksPreset: 'Спасибо',
          thanksPresetDescription: 'После услуги',
          returnPreset: 'Возврат',
          returnPresetDescription: 'Повторная запись',
        }
      : {
          title: 'Templates',
          description:
            'Message scenarios for confirmations, reminders, return visits, and repeat bookings.',

          createProfileTitle: 'Create the master profile first',
          createProfileDescription:
            'Create a profile to unlock message templates, quick flows, channels, and previews.',
          createProfileButton: 'Create profile',
          emptyBadge: 'Profile missing',
          emptyCardLibraryLabel: 'Library',
          emptyCardLibraryTitle: 'Message templates',
          emptyCardLibraryText:
            'After profile setup, confirmations, reminders, and follow-up messages will appear here.',
          emptyCardPreviewLabel: 'Preview',
          emptyCardPreviewTitle: 'Client preview',
          emptyCardPreviewText:
            'You will see each message exactly as the client receives it after variables are filled.',
          emptyCardStartLabel: 'Start',
          emptyCardStartTitle: 'One step to launch',
          emptyCardStartText:
            'Create the master profile, configure texts, and use them in client chats.',

          activeTemplates: 'Templates',
          variables: 'Variables',
          channels: 'Channels',
          total: 'total',
          unique: 'available',
          active: 'active',

          boardTitle: 'Scenarios',
          boardDescription:
            'List on the left, editor in the center, preview and creation on the right.',
          editorTitle: 'Scenario editor',
          editorDescription: 'Edit the selected template and add variables with the button near text.',
          createTitle: 'New scenario',
          createDescription: 'Pick a starter, adjust the text, and save it to the library.',

          add: 'Save template',
          duplicate: 'Duplicate',
          remove: 'Delete',
          copy: 'Copy',
          copied: 'Copied',
          titleField: 'Title',
          channelField: 'Channel',
          variablesField: 'Variables',
          addVariable: '{variables}',
          contentField: 'Message',
          previewField: 'Preview',
          searchPlaceholder: 'Search by title, channel, or text',
          allChannels: 'All',
          empty: 'No templates match the current filters.',
          livePreview: 'Client preview',
          livePreviewDescription: 'Message after variables are filled.',
          quickHint: 'Tip',
          quickHintText: 'Keep one short CTA and move the link closer to the end.',
          addHint: 'The new scenario appears in the list on the left.',
          counter: 'Found',
          draft: 'Draft',
          workspaceDescription:
            'Pick a scenario on the left, edit in the center, preview and creation on the right.',
          noVariables: 'No variables added',
          selectTemplate: 'Select a template',
          selectTemplateDescription: 'Click a card on the left to open the editor.',
          confirmPreset: 'Confirmation',
          confirmPresetDescription: 'Right after booking',
          reminderPreset: 'Reminder',
          reminderPresetDescription: 'Before appointment',
          thanksPreset: 'Thanks',
          thanksPresetDescription: 'After service',
          returnPreset: 'Return',
          returnPresetDescription: 'Repeat booking',
        };

  const draftPresets = useMemo(
    () => [
      {
        key: 'confirm' as const,
        title: copy.confirmPreset,
        description: copy.confirmPresetDescription,
        icon: <Check className="size-3.5" />,
      },
      {
        key: 'reminder' as const,
        title: copy.reminderPreset,
        description: copy.reminderPresetDescription,
        icon: <MessageSquareText className="size-3.5" />,
      },
      {
        key: 'thanks' as const,
        title: copy.thanksPreset,
        description: copy.thanksPresetDescription,
        icon: <Sparkles className="size-3.5" />,
      },
      {
        key: 'return' as const,
        title: copy.returnPreset,
        description: copy.returnPresetDescription,
        icon: <Send className="size-3.5" />,
      },
    ],
    [
      copy.confirmPreset,
      copy.confirmPresetDescription,
      copy.reminderPreset,
      copy.reminderPresetDescription,
      copy.thanksPreset,
      copy.thanksPresetDescription,
      copy.returnPreset,
      copy.returnPresetDescription,
    ],
  );

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return templates.filter((template) => {
      const normalizedChannel = normalizeChannel(template.channel);
      const matchesChannel = channelFilter === 'all' || normalizedChannel === channelFilter;

      if (!matchesChannel) return false;

      if (!normalizedQuery) return true;

      return [
        template.title,
        channelDisplayLabel(normalizedChannel, locale),
        normalizedChannel,
        template.content,
        template.variables.join(' '),
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [channelFilter, locale, query, templates]);

  const selectedTemplate = useMemo(() => {
    if (activeTemplateId) {
      const exact = templates.find((template) => template.id === activeTemplateId);
      if (exact) return exact;
    }

    return filteredTemplates[0] ?? templates[0] ?? null;
  }, [activeTemplateId, filteredTemplates, templates]);

  const variablesCount = useMemo(
    () => new Set(templates.flatMap((item) => item.variables)).size,
    [templates],
  );

  const channelsCount = useMemo(
    () => new Set(templates.map((item) => normalizeChannel(item.channel))).size,
    [templates],
  );

  const copyTemplate = async (template: MessageTemplateInsight) => {
    try {
      await navigator.clipboard.writeText(template.content);
      setCopiedId(template.id);

      window.setTimeout(() => {
        setCopiedId(null);
      }, 1400);
    } catch {}
  };

  const updateTemplate = (id: string, patch: Partial<MessageTemplateInsight>) => {
    setTemplates((current) =>
      current.map((template) =>
        template.id === id
          ? {
              ...template,
              ...patch,
              channel: patch.channel ? normalizeChannel(patch.channel) : template.channel,
              conversion: '0%',
            }
          : template,
      ),
    );
  };

  const removeTemplate = (id: string) => {
    setTemplates((current) => current.filter((template) => template.id !== id));
    setActiveTemplateId((current) => (current === id ? null : current));
  };

  const duplicateTemplate = (template: MessageTemplateInsight) => {
    const nextTemplate: MessageTemplateInsight = {
      ...template,
      id: `template-${crypto.randomUUID()}`,
      title: `${template.title} ${locale === 'ru' ? 'копия' : 'copy'}`,
      channel: normalizeChannel(template.channel),
      conversion: '0%',
    };

    setTemplates((current) => [nextTemplate, ...current]);
    setActiveTemplateId(nextTemplate.id);
  };

  const saveDraft = () => {
    const nextTemplate: MessageTemplateInsight = {
      ...draft,
      id: `template-${crypto.randomUUID()}`,
      channel: normalizeChannel(draft.channel),
      conversion: '0%',
    };

    setTemplates((current) => [nextTemplate, ...current]);
    setActiveTemplateId(nextTemplate.id);
    setDraft(createTemplate(locale));
    setQuery('');
    setChannelFilter('all');
  };

  const appendVariableToTemplate = (id: string, variable: string) => {
    setTemplates((current) =>
      current.map((template) => {
        if (template.id !== id) return template;

        const nextVariables = template.variables.includes(variable)
          ? template.variables
          : [...template.variables, variable];

        return {
          ...template,
          content: `${template.content}${template.content.endsWith(' ') ? '' : ' '}${variable}`,
          variables: nextVariables,
        };
      }),
    );
  };

  const appendVariableToDraft = (variable: string) => {
    setDraft((current) => ({
      ...current,
      content: `${current.content}${current.content.endsWith(' ') ? '' : ' '}${variable}`,
      variables: current.variables.includes(variable)
        ? current.variables
        : [...current.variables, variable],
    }));
  };

  const removeVariableFromTemplate = (id: string, variable: string) => {
    setTemplates((current) =>
      current.map((template) =>
        template.id === id
          ? {
              ...template,
              variables: template.variables.filter((item) => item !== variable),
            }
          : template,
      ),
    );
  };

  const removeVariableFromDraft = (variable: string) => {
    setDraft((current) => ({
      ...current,
      variables: current.variables.filter((item) => item !== variable),
    }));
  };

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

                <p className={cn('mt-2 max-w-[760px] text-[13px] leading-5', mutedText(isLight))}>
                  {copy.description}
                </p>
              </div>
            </div>

            <Card light={isLight}>
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
                icon={<MessageSquareText className="size-3.5" />}
                label={copy.emptyCardLibraryLabel}
                title={copy.emptyCardLibraryTitle}
                description={copy.emptyCardLibraryText}
              />

              <EmptyInfoCard
                light={isLight}
                icon={<Send className="size-3.5" />}
                label={copy.emptyCardPreviewLabel}
                title={copy.emptyCardPreviewTitle}
                description={copy.emptyCardPreviewText}
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

              <p className={cn('mt-2 max-w-[760px] text-[13px] leading-5', mutedText(isLight))}>
                {copy.description}
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <Card light={isLight}>
              <div className="p-5 md:p-6">
                <div
                  className={cn(
                    'text-[22px] font-semibold tracking-[-0.03em] md:text-[26px]',
                    pageText(isLight),
                  )}
                >
                  {templates.length} {copy.activeTemplates.toLowerCase()}
                </div>

                <p className={cn('mt-3 max-w-[760px] text-[12.5px] leading-6', mutedText(isLight))}>
                  {copy.workspaceDescription}
                </p>

                <div className="mt-6 grid gap-2 md:grid-cols-3">
                  <HeroStat
                    label={copy.activeTemplates}
                    value={templates.length}
                    hint={copy.total}
                    light={isLight}
                  />

                  <HeroStat
                    label={copy.variables}
                    value={variablesCount}
                    hint={copy.unique}
                    light={isLight}
                  />

                  <HeroStat
                    label={copy.channels}
                    value={channelsCount}
                    hint={copy.active}
                    light={isLight}
                  />
                </div>
              </div>
            </Card>

            <Card light={isLight} className="overflow-visible">
              <CardTitle
                title={copy.boardTitle}
                description={copy.boardDescription}
                light={isLight}
                actions={
                  <MicroLabel light={isLight}>
                    {copy.counter}: {filteredTemplates.length}
                  </MicroLabel>
                }
              />

              <div className="grid gap-4 p-4 xl:grid-cols-[340px_minmax(0,1fr)_330px]">
                <div className="space-y-4">
                  <Panel light={isLight} className="p-3">
                    <div className="relative">
                      <Search
                        className={cn(
                          'pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2',
                          isLight ? 'text-black/32' : 'text-white/28',
                        )}
                      />

                      <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={copy.searchPlaceholder}
                        className={cn('h-9 pl-9', inputClass(isLight))}
                      />
                    </div>

                    <div
                      className={cn(
                        'mt-3 grid w-full grid-cols-4 overflow-hidden rounded-[12px] border',
                        isLight
                          ? 'border-black/[0.08] bg-white'
                          : 'border-white/[0.08] bg-white/[0.045]',
                      )}
                    >
                      <FilterChip
                        label={copy.allChannels}
                        active={channelFilter === 'all'}
                        onClick={() => setChannelFilter('all')}
                        light={isLight}
                        accentColor={accentColor}
                      />

                      {CHANNEL_OPTIONS.map((channel) => (
                        <FilterChip
                          key={channel}
                          label={channelDisplayLabel(channel, locale)}
                          active={channelFilter === channel}
                          onClick={() => setChannelFilter(channel)}
                          light={isLight}
                          accentColor={accentColor}
                        />
                      ))}
                    </div>
                  </Panel>

                  <div className="grid max-h-none gap-2 xl:max-h-[calc(100dvh-210px)] xl:overflow-y-auto xl:pr-1">
                    {filteredTemplates.length ? (
                      filteredTemplates.map((template) => (
                        <ScenarioCard
                          key={template.id}
                          template={template}
                          active={selectedTemplate?.id === template.id}
                          copied={copiedId === template.id}
                          copyLabel={copy.copy}
                          copiedLabel={copy.copied}
                          removeLabel={copy.remove}
                          locale={locale}
                          light={isLight}
                          accentColor={accentColor}
                          previewAccentColor={publicAccentColor}
                          onSelect={() => setActiveTemplateId(template.id)}
                          onCopy={() => copyTemplate(template)}
                          onDelete={() => removeTemplate(template.id)}
                        />
                      ))
                    ) : (
                      <Panel light={isLight} className="px-4 py-10 text-center">
                        <div className={cn('text-[12px]', mutedText(isLight))}>
                          {copy.empty}
                        </div>
                      </Panel>
                    )}
                  </div>
                </div>

                <div className="relative z-10 space-y-4">
                  <Card light={isLight} className="relative z-20 overflow-visible">
                    <CardTitle
                      title={copy.editorTitle}
                      description={copy.editorDescription}
                      light={isLight}
                      actions={
                        selectedTemplate ? (
                          <ChannelBadge
                            channel={selectedTemplate.channel}
                            locale={locale}
                            light={isLight}
                            accentColor={publicAccentColor}
                          />
                        ) : null
                      }
                    />

                    {selectedTemplate ? (
                      <div className="space-y-4 p-4">
                        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_150px]">
                          <div>
                            <FieldLabel light={isLight}>{copy.titleField}</FieldLabel>

                            <Input
                              value={selectedTemplate.title}
                              onChange={(event) =>
                                updateTemplate(selectedTemplate.id, {
                                  title: event.target.value,
                                })
                              }
                              placeholder={copy.titleField}
                              className={cn('h-9 font-semibold', inputClass(isLight))}
                            />
                          </div>

                          <div>
                            <FieldLabel light={isLight}>{copy.channelField}</FieldLabel>

                            <Select
                              value={normalizeChannel(selectedTemplate.channel)}
                              onValueChange={(value) =>
                                updateTemplate(selectedTemplate.id, {
                                  channel: normalizeChannel(value),
                                })
                              }
                            >
                              <SelectTrigger className={selectTriggerClass(isLight)}>
                                <SelectValue />
                              </SelectTrigger>

                              <SelectContent className={selectContentClass(isLight)}>
                                {CHANNEL_OPTIONS.map((channel) => (
                                  <SelectItem key={channel} value={channel}>
                                    {channelDisplayLabel(channel, locale)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <FieldLabelRow
                            light={isLight}
                            action={
                              <VariableDropdown
                                locale={locale}
                                light={isLight}
                                placeholder={copy.addVariable}
                                onInsert={(variable) =>
                                  appendVariableToTemplate(selectedTemplate.id, variable)
                                }
                              />
                            }
                          >
                            {copy.contentField}
                          </FieldLabelRow>

                          <Textarea
                            value={selectedTemplate.content}
                            onChange={(event) =>
                              updateTemplate(selectedTemplate.id, {
                                content: event.target.value,
                              })
                            }
                            placeholder={copy.contentField}
                            className={cn(
                              'min-h-[190px] resize-none text-[12.5px] leading-6',
                              inputClass(isLight),
                            )}
                          />
                        </div>

                        <div>
                          <FieldLabel light={isLight}>{copy.variablesField}</FieldLabel>

                          <VariableCompactBar
                            variables={selectedTemplate.variables}
                            light={isLight}
                            emptyLabel={copy.noVariables}
                            onRemove={(variable) =>
                              removeVariableFromTemplate(selectedTemplate.id, variable)
                            }
                          />
                        </div>

                        <div className="grid gap-2 sm:grid-cols-3">
                          <ActionButton
                            light={isLight}
                            onClick={() => copyTemplate(selectedTemplate)}
                            className="w-full"
                          >
                            {copiedId === selectedTemplate.id ? (
                              <Check className="size-3.5" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                            {copiedId === selectedTemplate.id ? copy.copied : copy.copy}
                          </ActionButton>

                          <ActionButton
                            light={isLight}
                            onClick={() => duplicateTemplate(selectedTemplate)}
                            className="w-full"
                          >
                            <Plus className="size-3.5" />
                            {copy.duplicate}
                          </ActionButton>

                          <ActionButton
                            light={isLight}
                            onClick={() => removeTemplate(selectedTemplate.id)}
                            className={cn(
                              'w-full',
                              isLight
                                ? 'text-red-600 hover:text-red-700'
                                : 'text-red-300 hover:text-red-200',
                            )}
                          >
                            <Trash2 className="size-3.5" />
                            {copy.remove}
                          </ActionButton>
                        </div>
                      </div>
                    ) : (
                      <div className="grid min-h-[320px] place-items-center p-6 text-center">
                        <div className="max-w-[340px]">
                          <MicroLabel light={isLight}>
                            <MessageSquareText className="size-3.5" />
                            {copy.selectTemplate}
                          </MicroLabel>

                          <div
                            className={cn(
                              'mt-4 text-[22px] font-semibold tracking-[-0.055em]',
                              pageText(isLight),
                            )}
                          >
                            {copy.selectTemplate}
                          </div>

                          <p className={cn('mt-2 text-[12px] leading-5', mutedText(isLight))}>
                            {copy.selectTemplateDescription}
                          </p>
                        </div>
                      </div>
                    )}
                  </Card>

                  {selectedTemplate ? (
                    <div className="relative z-0">
                      <PreviewMessage
                        template={selectedTemplate}
                        title={copy.livePreview}
                        description={copy.livePreviewDescription}
                        locale={locale}
                        light={isLight}
                        accentColor={publicAccentColor}
                      />
                    </div>
                  ) : null}
                </div>

                <div className="space-y-4 xl:sticky xl:top-[84px] xl:self-start">
                  <Card light={isLight}>
                    <CardTitle
                      title={copy.createTitle}
                      description={copy.createDescription}
                      light={isLight}
                      actions={
                        <MicroLabel light={isLight} active accentColor={accentColor}>
                          {copy.draft}
                        </MicroLabel>
                      }
                    />

                    <div className="space-y-4 p-4">
                      <div className="grid gap-2">
                        {draftPresets.map((preset) => (
                          <PresetCard
                            key={preset.key}
                            title={preset.title}
                            description={preset.description}
                            icon={preset.icon}
                            active={getTemplatePresetKey(draft) === preset.key}
                            onClick={() => setDraft(buildTemplatePreset(locale, preset.key))}
                            light={isLight}
                            accentColor={accentColor}
                          />
                        ))}
                      </div>

                      <Panel light={isLight} className="p-3">
                        <div
                          className={cn(
                            'mb-3 text-[10px] font-semibold uppercase tracking-[0.14em]',
                            faintText(isLight),
                          )}
                        >
                          {copy.draft}
                        </div>

                        <div className="grid gap-3">
                          <Input
                            value={draft.title}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                title: event.target.value,
                              }))
                            }
                            placeholder={copy.titleField}
                            className={cn('h-9 font-semibold', inputClass(isLight))}
                          />

                          <Select
                            value={normalizeChannel(draft.channel)}
                            onValueChange={(value) =>
                              setDraft((current) => ({
                                ...current,
                                channel: normalizeChannel(value),
                              }))
                            }
                          >
                            <SelectTrigger className={selectTriggerClass(isLight)}>
                              <SelectValue />
                            </SelectTrigger>

                            <SelectContent className={selectContentClass(isLight)}>
                              {CHANNEL_OPTIONS.map((channel) => (
                                <SelectItem key={channel} value={channel}>
                                  {channelDisplayLabel(channel, locale)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <div>
                            <FieldLabelRow
                              light={isLight}
                              action={
                                <VariableDropdown
                                  locale={locale}
                                  light={isLight}
                                  placeholder={copy.addVariable}
                                  onInsert={appendVariableToDraft}
                                />
                              }
                            >
                              {copy.contentField}
                            </FieldLabelRow>

                            <Textarea
                              value={draft.content}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  content: event.target.value,
                                }))
                              }
                              placeholder={copy.contentField}
                              className={cn(
                                'min-h-[120px] resize-none text-[12.5px] leading-6',
                                inputClass(isLight),
                              )}
                            />
                          </div>

                          <div>
                            <FieldLabel light={isLight}>{copy.variablesField}</FieldLabel>

                            <VariableCompactBar
                              variables={draft.variables}
                              light={isLight}
                              emptyLabel={copy.noVariables}
                              onRemove={removeVariableFromDraft}
                            />
                          </div>
                        </div>
                      </Panel>

                      <PreviewMessage
                        template={draft}
                        title={copy.previewField}
                        locale={locale}
                        light={isLight}
                        accentColor={accentColor}
                      />

                      <Panel light={isLight} className="p-4">
                        <div className={cn('text-[12px] leading-6', mutedText(isLight))}>
                          <span className={cn('font-semibold', pageText(isLight))}>
                            {copy.quickHint}:
                          </span>{' '}
                          {copy.quickHintText}
                        </div>
                      </Panel>

                      <ActionButton light={isLight} active onClick={saveDraft} className="w-full">
                        <Plus className="size-3.5" />
                        {copy.add}
                      </ActionButton>

                      <div className={cn('px-1 text-[11px] leading-4', mutedText(isLight))}>
                        {copy.addHint}
                      </div>
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