// app/dashboard/notifications/page.tsx
'use client';

import Link from 'next/link';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  Bell,
  CheckCircle2,
  Mail,
  MessageCircleMore,
  Send,
  Sparkles,
  SquarePen,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { WorkspaceShell } from '@/components/shared/workspace-shell';
import { useOwnedWorkspaceData } from '@/hooks/use-owned-workspace-data';
import { useWorkspaceSection } from '@/hooks/use-workspace-section';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppearance } from '@/lib/appearance-context';
import { accentPalette } from '@/lib/appearance-palette';
import type { NotificationInsight } from '@/lib/master-workspace';
import { cn } from '@/lib/utils';
import { menuContentClass, menuTriggerClass } from '@/lib/menu-styles';

type ThemeMode = 'light' | 'dark';

type ChannelKey = 'telegram' | 'vk' | 'email';
type TimingKey = 'instant' | 'day-before' | 'two-hours' | 'weekly';

type NotificationViewItem = Omit<NotificationInsight, 'channel'> & {
  channel: ChannelKey;
  timing: TimingKey;
  audience: 'master' | 'client';
};

type ChannelMeta = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const CHANNEL_ORDER: ChannelKey[] = ['telegram', 'vk', 'email'];

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

function ControlChip({
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

function MinimalSwitch({
  checked,
  onCheckedChange,
  light,
  onLabel,
  offLabel,
  accentColor,
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  light: boolean;
  onLabel: string;
  offLabel: string;
  accentColor: string;
  className?: string;
}) {
  return (
    <ControlGroup light={light} className={cn('min-w-[116px]', className)}>
      <ControlChip
        label={offLabel}
        active={!checked}
        onClick={() => onCheckedChange(false)}
        light={light}
        accentColor={light ? 'rgba(0,0,0,0.34)' : 'rgba(255,255,255,0.38)'}
      />

      <ControlChip
        label={onLabel}
        active={checked}
        onClick={() => onCheckedChange(true)}
        light={light}
        accentColor={accentColor}
      />
    </ControlGroup>
  );
}

function SelectField({
  value,
  onChange,
  children,
  light,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  light: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn(menuTriggerClass(light), 'h-8 w-full text-[12px]')}>
        <SelectValue />
      </SelectTrigger>

      <SelectContent className={menuContentClass(light)}>
        {children}
      </SelectContent>
    </Select>
  );
}

function ChannelCard({
  meta,
  total,
  active,
  enabled,
  selected,
  testLabel,
  onLabel,
  offLabel,
  accentColor,
  onSelect,
  onToggle,
  onTest,
  light,
}: {
  meta: ChannelMeta;
  total: number;
  active: number;
  enabled: boolean;
  selected: boolean;
  testLabel: string;
  onLabel: string;
  offLabel: string;
  accentColor: string;
  onSelect: () => void;
  onToggle: (checked: boolean) => void;
  onTest: () => void;
  light: boolean;
}) {
  const ChannelIcon = meta.icon;

  return (
    <Panel
      light={light}
      className={cn(
        'p-4 transition',
        selected && (light ? 'ring-1 ring-black/12' : 'ring-1 ring-white/12'),
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          <span
            className={cn(
              'inline-flex size-9 shrink-0 items-center justify-center rounded-[9px] border',
              light
                ? 'border-black/[0.07] bg-white text-black/38'
                : 'border-white/[0.07] bg-white/[0.035] text-white/38',
            )}
          >
            <ChannelIcon className="size-4" />
          </span>

          <span className="min-w-0">
            <span
              className={cn(
                'block text-[13px] font-semibold tracking-[-0.018em]',
                pageText(light),
              )}
            >
              {meta.title}
            </span>

            <span className={cn('mt-1 block text-[11px] leading-4', mutedText(light))}>
              {meta.description}
            </span>
          </span>
        </button>

        <MinimalSwitch
          checked={enabled}
          onCheckedChange={onToggle}
          light={light}
          onLabel={onLabel}
          offLabel={offLabel}
          accentColor={accentColor}
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <MicroLabel light={light} active={active > 0}>
            {active}
          </MicroLabel>

          <MicroLabel light={light}>{total}</MicroLabel>
        </div>

        <ActionButton light={light} onClick={onTest}>
          {testLabel}
        </ActionButton>
      </div>
    </Panel>
  );
}

function FlowCard({
  item,
  selected,
  channelLabel,
  timingLabel,
  audienceLabel,
  channelMeta,
  channelTitle,
  deliveryTitle,
  routeTitle,
  criticalLabel,
  onLabel,
  offLabel,
  accentColor,
  onSelect,
  onToggle,
  onChannelChange,
  onTimingChange,
  light,
}: {
  item: NotificationViewItem;
  selected: boolean;
  channelLabel: (channel: ChannelKey) => string;
  timingLabel: (timing: TimingKey) => string;
  audienceLabel: (audience: NotificationViewItem['audience']) => string;
  channelMeta: Record<ChannelKey, ChannelMeta>;
  channelTitle: string;
  deliveryTitle: string;
  routeTitle: string;
  criticalLabel: string;
  onLabel: string;
  offLabel: string;
  accentColor: string;
  onSelect: () => void;
  onToggle: (checked: boolean) => void;
  onChannelChange: (channel: ChannelKey) => void;
  onTimingChange: (timing: TimingKey) => void;
  light: boolean;
}) {
  const ChannelIcon = channelMeta[item.channel].icon;

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
        'w-full rounded-[10px] border p-4 text-left transition active:scale-[0.995]',
        selected ? cardTone(light) : insetTone(light),
        !item.enabled && 'opacity-70',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={cn(
                'text-[13px] font-semibold tracking-[-0.018em]',
                pageText(light),
              )}
            >
              {item.title}
            </div>

            <MicroLabel light={light}>{channelLabel(item.channel)}</MicroLabel>
            <MicroLabel light={light}>{audienceLabel(item.audience)}</MicroLabel>

            {item.critical ? (
              <MicroLabel light={light} active>
                <StatusDot light={light} active accentColor={accentColor} />
                {criticalLabel}
              </MicroLabel>
            ) : null}
          </div>

          <div className={cn('mt-2 text-[11px] leading-4', mutedText(light))}>
            {item.description}
          </div>
        </div>

        <div
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <MinimalSwitch
            checked={item.enabled}
            onCheckedChange={onToggle}
            light={light}
            onLabel={onLabel}
            offLabel={offLabel}
            accentColor={accentColor}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[180px_180px_minmax(0,1fr)]">
        <div
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <div
            className={cn(
              'mb-1.5 text-[10px] font-medium uppercase tracking-[0.14em]',
              faintText(light),
            )}
          >
            {channelTitle}
          </div>

          <SelectField
            value={item.channel}
            onChange={(value) => onChannelChange(value as ChannelKey)}
            light={light}
          >
            {CHANNEL_ORDER.map((channel) => (
              <SelectItem key={channel} value={channel}>
                {channelLabel(channel)}
              </SelectItem>
            ))}
          </SelectField>
        </div>

        <div
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          <div
            className={cn(
              'mb-1.5 text-[10px] font-medium uppercase tracking-[0.14em]',
              faintText(light),
            )}
          >
            {deliveryTitle}
          </div>

          <SelectField
            value={item.timing}
            onChange={(value) => onTimingChange(value as TimingKey)}
            light={light}
          >
            <SelectItem value="instant">{timingLabel('instant')}</SelectItem>
            <SelectItem value="day-before">{timingLabel('day-before')}</SelectItem>
            <SelectItem value="two-hours">{timingLabel('two-hours')}</SelectItem>
            <SelectItem value="weekly">{timingLabel('weekly')}</SelectItem>
          </SelectField>
        </div>

        <div className={cn('rounded-[9px] border px-3.5 py-3', insetTone(light))}>
          <div className={cn('flex items-center gap-2 text-[11px] font-medium', pageText(light))}>
            <ChannelIcon className={cn('size-3.5', faintText(light))} />
            {routeTitle}
          </div>

          <div className={cn('mt-1.5 text-[11px] leading-4', mutedText(light))}>
            {channelLabel(item.channel)} · {timingLabel(item.timing)} ·{' '}
            {audienceLabel(item.audience)}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
  light,
  onLabel,
  offLabel,
  accentColor,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  light: boolean;
  onLabel: string;
  offLabel: string;
  accentColor: string;
}) {
  return (
    <Panel light={light} className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div
            className={cn(
              'text-[12.5px] font-semibold tracking-[-0.018em]',
              pageText(light),
            )}
          >
            {title}
          </div>

          <div className={cn('mt-1 text-[11px] leading-4', mutedText(light))}>
            {description}
          </div>
        </div>

        <MinimalSwitch
          checked={checked}
          onCheckedChange={onCheckedChange}
          light={light}
          onLabel={onLabel}
          offLabel={offLabel}
          accentColor={accentColor}
        />
      </div>
    </Panel>
  );
}

export default function NotificationsPage() {
  const { hasHydrated, ownedProfile, dataset, locale } = useOwnedWorkspaceData();
  const { resolvedTheme } = useTheme();
  const { settings } = useAppearance();

  const [mounted, setMounted] = useState(false);

  const initialItems = useMemo<NotificationViewItem[]>(
    () =>
      (dataset?.notifications ?? []).map((item) => ({
        ...item,
        channel: (item.channel === 'push' ? 'telegram' : item.channel === 'max' ? 'vk' : item.channel) as ChannelKey,
        timing:
          item.id === 'visit-reminder'
            ? 'day-before'
            : item.id === 'weekly-digest'
              ? 'weekly'
              : item.id === 'schedule-change'
                ? 'two-hours'
                : 'instant',
        audience: item.id === 'visit-reminder' || item.id === 'chat-message' ? 'client' : 'master',
      })),
    [dataset?.notifications],
  );

  const [items, setItems] = useWorkspaceSection<NotificationViewItem[]>(
    'notifications',
    initialItems,
  );

  const [activeChannel, setActiveChannel] = useState<'all' | ChannelKey>('all');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [quietHours, setQuietHours] = useWorkspaceSection<boolean>('quietHours', false);
  const [fallbackEmail, setFallbackEmail] = useWorkspaceSection<boolean>('fallbackEmail', true);
  const [lastTest, setLastTest] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!dataset || !initialItems.length || items.length > 0) return;
    setItems(initialItems);
  }, [dataset, initialItems, items.length, setItems]);

  const currentTheme: ThemeMode = mounted
    ? resolvedTheme === 'light'
      ? 'light'
      : 'dark'
    : 'dark';

  const isLight = currentTheme === 'light';
  const accentColor = accentPalette[settings.accentTone].solid;

  const copy =
    locale === 'ru'
      ? {
          title: 'Уведомления',
          description:
            'Каналы доставки, сценарии, тихие часы и тесты уведомлений в одном рабочем экране.',
          createProfileTitle: 'Сначала настройте профиль мастера',
          createProfileDescription:
            'Создайте профиль, чтобы открыть сценарии уведомлений, каналы доставки и тесты.',
          createProfileButton: 'Создать профиль',
          emptyBadge: 'Профиль не найден',
          emptyCardChannelsLabel: 'Каналы',
          emptyCardChannelsTitle: 'Telegram, ВК и Email',
          emptyCardChannelsText: 'После создания профиля появятся каналы доставки уведомлений.',
          emptyCardFlowsLabel: 'Сценарии',
          emptyCardFlowsTitle: 'Логика сообщений',
          emptyCardFlowsText: 'Можно будет управлять напоминаниями, заявками и сводками.',
          emptyCardTestLabel: 'Тест',
          emptyCardTestTitle: 'Проверка доставки',
          emptyCardTestText: 'Тестовые отправки помогут проверить маршрут уведомления.',

          scenarios: 'Сценарии',
          enabled: 'Активные',
          critical: 'Критические',
          channels: 'Каналы',

          deliveryChannels: 'Каналы доставки',
          deliveryChannelsDescription: 'Общий статус Telegram, ВК и Email.',
          test: 'Проверить',

          flows: 'Сценарии',
          flowsDescription: 'Настройка логики уведомлений, канала и времени отправки.',
          all: 'Все',
          channel: 'Канал',
          delivery: 'Отправка',
          route: 'Маршрут',
          criticalLabel: 'Критично',

          center: 'Центр уведомлений',
          centerDescription: 'Выбранный сценарий, правила доставки и проверка маршрута.',
          selectedScenario: 'Выбранный сценарий',
          noScenario: 'Выберите сценарий слева, чтобы увидеть детали.',
          quietHours: 'Тихие часы',
          quietHoursDescription: 'Сообщения клиентам после 21:00 ставятся в очередь.',
          fallbackEmail: 'Резервный email',
          fallbackEmailDescription: 'Если мессенджер не доставил сообщение, включается email.',
          testCenter: 'Проверка',
          testCenterDescription: 'Отправьте тест и проверьте маршрут.',
          on: 'Вкл',
          off: 'Выкл',
          ready: 'Система активна',
        }
      : {
          title: 'Notifications',
          description:
            'Delivery channels, flows, quiet hours, and notification tests in one focused workspace.',
          createProfileTitle: 'Create the master profile first',
          createProfileDescription:
            'Create the profile to unlock notification flows, delivery channels, and tests.',
          createProfileButton: 'Create profile',
          emptyBadge: 'Profile missing',
          emptyCardChannelsLabel: 'Channels',
          emptyCardChannelsTitle: 'Telegram, VK, and Email',
          emptyCardChannelsText: 'Delivery channels will appear after profile setup.',
          emptyCardFlowsLabel: 'Flows',
          emptyCardFlowsTitle: 'Message logic',
          emptyCardFlowsText: 'You will manage reminders, requests, and digests here.',
          emptyCardTestLabel: 'Test',
          emptyCardTestTitle: 'Delivery check',
          emptyCardTestText: 'Test sends will help verify the notification route.',

          scenarios: 'Scenarios',
          enabled: 'Enabled',
          critical: 'Critical',
          channels: 'Channels',

          deliveryChannels: 'Delivery channels',
          deliveryChannelsDescription: 'Overall status of Telegram, VK, and Email.',
          test: 'Test',

          flows: 'Flows',
          flowsDescription: 'Set the notification logic, channel, and delivery timing.',
          all: 'All',
          channel: 'Channel',
          delivery: 'Delivery',
          route: 'Route',
          criticalLabel: 'Critical',

          center: 'Notification center',
          centerDescription: 'Selected scenario, delivery rules, and route testing.',
          selectedScenario: 'Selected scenario',
          noScenario: 'Choose a flow on the left to see details.',
          quietHours: 'Quiet hours',
          quietHoursDescription: 'Client messages after 9 PM are queued.',
          fallbackEmail: 'Fallback email',
          fallbackEmailDescription: 'Email is used if messenger delivery fails.',
          testCenter: 'Test center',
          testCenterDescription: 'Send a test and verify the route.',
          on: 'On',
          off: 'Off',
          ready: 'System active',
        };

  const channelMeta = useMemo<Record<ChannelKey, ChannelMeta>>(
    () => ({
      telegram: {
        title: locale === 'ru' ? 'Телеграм' : 'Telegram',
        description:
          locale === 'ru'
            ? 'Новые заявки, важные ответы и быстрые статусы.'
            : 'New requests, important replies, and quick statuses.',
        icon: Send,
      },
      vk: {
        title: 'ВК',
        description:
          locale === 'ru'
            ? 'Напоминания, подтверждения и сообщения клиентам.'
            : 'Reminders, confirmations, and client messages.',
        icon: MessageCircleMore,
      },
      email: {
        title: 'Email',
        description:
          locale === 'ru'
            ? 'Сводки, резервная доставка и важные отчёты.'
            : 'Digests, fallback delivery, and important reports.',
        icon: Mail,
      },
    }),
    [locale],
  );

  const channelLabel = (channel: ChannelKey) => channelMeta[channel].title;

  const timingLabel = (timing: TimingKey) => {
    if (locale === 'ru') {
      if (timing === 'instant') return 'Сразу';
      if (timing === 'day-before') return 'За день';
      if (timing === 'two-hours') return 'За 2 часа';

      return 'Раз в неделю';
    }

    if (timing === 'instant') return 'Instant';
    if (timing === 'day-before') return '1 day before';
    if (timing === 'two-hours') return '2 hours before';

    return 'Weekly';
  };

  const audienceLabel = (audience: NotificationViewItem['audience']) =>
    locale === 'ru'
      ? audience === 'client'
        ? 'Клиенту'
        : 'Мастеру'
      : audience === 'client'
        ? 'Client'
        : 'Master';

  const filteredItems = useMemo(
    () => items.filter((item) => activeChannel === 'all' || item.channel === activeChannel),
    [activeChannel, items],
  );

  useEffect(() => {
    if (!filteredItems.length) {
      setSelectedItemId(null);
      return;
    }

    if (!selectedItemId || !filteredItems.some((item) => item.id === selectedItemId)) {
      setSelectedItemId(filteredItems[0].id);
    }
  }, [filteredItems, selectedItemId]);

  const selectedItem =
    filteredItems.find((item) => item.id === selectedItemId) ?? filteredItems[0] ?? null;

  const channelStats = useMemo(
    () =>
      CHANNEL_ORDER.map((channel) => {
        const total = items.filter((item) => item.channel === channel).length;
        const active = items.filter((item) => item.channel === channel && item.enabled).length;

        return { channel, total, active, enabled: active > 0 };
      }),
    [items],
  );

  const criticalCount = items.filter((item) => item.critical).length;
  const activeCount = items.filter((item) => item.enabled).length;
  const activeChannelCount = channelStats.filter((item) => item.active > 0).length;

  const updateItem = (id: string, patch: Partial<NotificationViewItem>) => {
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const toggleChannel = (channel: ChannelKey, checked: boolean) => {
    setItems((current) =>
      current.map((item) => (item.channel === channel ? { ...item, enabled: checked } : item)),
    );
  };

  const sendTest = (channel: ChannelKey) => {
    const destination =
      channel === 'telegram'
        ? '@master.telegram'
        : channel === 'vk'
          ? 'vk.com/master'
          : 'master@klikbuk.app';

    setLastTest(
      locale === 'ru'
        ? `Тест отправлен · ${channelLabel(channel)} · ${destination}`
        : `Test sent · ${channelLabel(channel)} · ${destination}`,
    );
  };

  if (!hasHydrated || !mounted) return null;

  if (!ownedProfile || !dataset) {
    return (
      <WorkspaceShell>
        <main
          className={cn(
            'min-h-screen px-4 pb-12 pt-5 md:px-7 md:pt-6',
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

                <p
                  className={cn(
                    'mt-2 max-w-[760px] text-[13px] leading-5',
                    mutedText(isLight),
                  )}
                >
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
                icon={<MessageCircleMore className="size-3.5" />}
                label={copy.emptyCardChannelsLabel}
                title={copy.emptyCardChannelsTitle}
                description={copy.emptyCardChannelsText}
              />

              <EmptyInfoCard
                light={isLight}
                icon={<Bell className="size-3.5" />}
                label={copy.emptyCardFlowsLabel}
                title={copy.emptyCardFlowsTitle}
                description={copy.emptyCardFlowsText}
              />

              <EmptyInfoCard
                light={isLight}
                icon={<Send className="size-3.5" />}
                label={copy.emptyCardTestLabel}
                title={copy.emptyCardTestTitle}
                description={copy.emptyCardTestText}
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
          'min-h-screen px-4 pb-12 pt-5 md:px-7 md:pt-6',
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

              <p
                className={cn(
                  'mt-2 max-w-[760px] text-[13px] leading-5',
                  mutedText(isLight),
                )}
              >
                {copy.description}
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <Card light={isLight} className="overflow-hidden">
              <div className="p-5 md:p-6">
                <div
                  className={cn(
                    'text-[22px] font-semibold tracking-[-0.03em] md:text-[26px]',
                    pageText(isLight),
                  )}
                >
                  {activeCount}/{items.length}
                </div>

                <p
                  className={cn(
                    'mt-3 max-w-[680px] text-[12.5px] leading-6',
                    mutedText(isLight),
                  )}
                >
                  {locale === 'ru'
                    ? 'Управляйте уведомлениями мастера и клиента: канал, время отправки, тихие часы и резервная доставка.'
                    : 'Manage master and client notifications: channel, timing, quiet hours, and fallback delivery.'}
                </p>

                {lastTest ? (
                  <Panel light={isLight} className="mt-6 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={cn('size-4', faintText(isLight))} />
                      <span className={cn('text-[12px]', mutedText(isLight))}>
                        {lastTest}
                      </span>
                    </div>
                  </Panel>
                ) : null}

                <div className="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  <HeroStat
                    label={copy.scenarios}
                    value={items.length}
                    hint={copy.scenarios}
                    light={isLight}
                  />

                  <HeroStat
                    label={copy.enabled}
                    value={activeCount}
                    hint={copy.enabled}
                    light={isLight}
                  />

                  <HeroStat
                    label={copy.critical}
                    value={criticalCount}
                    hint={copy.critical}
                    light={isLight}
                  />

                  <HeroStat
                    label={copy.channels}
                    value={activeChannelCount}
                    hint={copy.channels}
                    light={isLight}
                  />
                </div>
              </div>
            </Card>

            <Card light={isLight}>
              <CardTitle
                title={copy.deliveryChannels}
                description={copy.deliveryChannelsDescription}
                light={isLight}
              />

              <div className="grid gap-3 p-4 lg:grid-cols-3">
                {channelStats.map(({ channel, total, active, enabled }) => (
                  <ChannelCard
                    key={channel}
                    meta={channelMeta[channel]}
                    total={total}
                    active={active}
                    enabled={enabled}
                    selected={activeChannel === channel}
                    testLabel={copy.test}
                    onLabel={copy.on}
                    offLabel={copy.off}
                    accentColor={accentColor}
                    onSelect={() =>
                      setActiveChannel((current) => (current === channel ? 'all' : channel))
                    }
                    onToggle={(checked) => toggleChannel(channel, checked)}
                    onTest={() => sendTest(channel)}
                    light={isLight}
                  />
                ))}
              </div>
            </Card>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <Card light={isLight}>
                <CardTitle
                  title={copy.flows}
                  description={copy.flowsDescription}
                  light={isLight}
                />

                <div className="space-y-4 p-4">
                  <ControlGroup light={isLight}>
                    <ControlChip
                      label={copy.all}
                      active={activeChannel === 'all'}
                      onClick={() => setActiveChannel('all')}
                      light={isLight}
                      accentColor={accentColor}
                    />

                    {CHANNEL_ORDER.map((channel) => (
                      <ControlChip
                        key={channel}
                        label={channelLabel(channel)}
                        active={activeChannel === channel}
                        onClick={() => setActiveChannel(channel)}
                        light={isLight}
                        accentColor={accentColor}
                      />
                    ))}
                  </ControlGroup>

                  {filteredItems.length ? (
                    <div className="space-y-2">
                      {filteredItems.map((item) => (
                        <FlowCard
                          key={item.id}
                          item={item}
                          selected={selectedItem?.id === item.id}
                          channelLabel={channelLabel}
                          timingLabel={timingLabel}
                          audienceLabel={audienceLabel}
                          channelMeta={channelMeta}
                          channelTitle={copy.channel}
                          deliveryTitle={copy.delivery}
                          routeTitle={copy.route}
                          criticalLabel={copy.criticalLabel}
                          onLabel={copy.on}
                          offLabel={copy.off}
                          accentColor={accentColor}
                          onSelect={() => setSelectedItemId(item.id)}
                          onToggle={(checked) => updateItem(item.id, { enabled: checked })}
                          onChannelChange={(channel) => updateItem(item.id, { channel })}
                          onTimingChange={(timing) => updateItem(item.id, { timing })}
                          light={isLight}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState light={isLight}>{copy.noScenario}</EmptyState>
                  )}
                </div>
              </Card>

              <div className="space-y-4 xl:sticky xl:top-[84px] xl:self-start">
                <Card light={isLight}>
                  <CardTitle
                    title={copy.center}
                    description={copy.centerDescription}
                    light={isLight}
                  />

                  <div className="space-y-4 p-4">
                    {selectedItem ? (
                      <Panel light={isLight} className="p-4">
                        <div className="flex items-start gap-3">
                          <span
                            className={cn(
                              'inline-flex size-8 shrink-0 items-center justify-center rounded-[9px] border',
                              isLight
                                ? 'border-black/[0.07] bg-white text-black/38'
                                : 'border-white/[0.07] bg-white/[0.035] text-white/38',
                            )}
                          >
                            <Sparkles className="size-4" />
                          </span>

                          <div className="min-w-0">
                            <div
                              className={cn(
                                'text-[10px] uppercase tracking-[0.14em]',
                                faintText(isLight),
                              )}
                            >
                              {copy.selectedScenario}
                            </div>

                            <div
                              className={cn(
                                'mt-2 text-[13px] font-semibold tracking-[-0.018em]',
                                pageText(isLight),
                              )}
                            >
                              {selectedItem.title}
                            </div>

                            <div className={cn('mt-1 text-[11px] leading-4', mutedText(isLight))}>
                              {selectedItem.description}
                            </div>

                            <div className="mt-3 flex flex-wrap gap-1.5">
                              <MicroLabel light={isLight}>
                                {channelLabel(selectedItem.channel)}
                              </MicroLabel>

                              <MicroLabel light={isLight}>
                                {timingLabel(selectedItem.timing)}
                              </MicroLabel>

                              <MicroLabel light={isLight}>
                                {audienceLabel(selectedItem.audience)}
                              </MicroLabel>
                            </div>
                          </div>
                        </div>
                      </Panel>
                    ) : (
                      <EmptyState light={isLight}>{copy.noScenario}</EmptyState>
                    )}

                    <div className="space-y-3">
                      <ToggleRow
                        title={copy.quietHours}
                        description={copy.quietHoursDescription}
                        checked={quietHours}
                        onCheckedChange={setQuietHours}
                        light={isLight}
                        onLabel={copy.on}
                        offLabel={copy.off}
                        accentColor={accentColor}
                      />

                      <ToggleRow
                        title={copy.fallbackEmail}
                        description={copy.fallbackEmailDescription}
                        checked={fallbackEmail}
                        onCheckedChange={setFallbackEmail}
                        light={isLight}
                        onLabel={copy.on}
                        offLabel={copy.off}
                        accentColor={accentColor}
                      />
                    </div>

                    <Panel light={isLight} className="p-4">
                      <div
                        className={cn(
                          'text-[13px] font-semibold tracking-[-0.018em]',
                          pageText(isLight),
                        )}
                      >
                        {copy.testCenter}
                      </div>

                      <div className={cn('mt-1 text-[11px] leading-4', mutedText(isLight))}>
                        {lastTest || copy.testCenterDescription}
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <ActionButton light={isLight} onClick={() => sendTest('telegram')}>
                          Telegram
                        </ActionButton>

                        <ActionButton light={isLight} onClick={() => sendTest('vk')}>
                          ВК
                        </ActionButton>

                        <ActionButton light={isLight} onClick={() => sendTest('email')}>
                          Email
                        </ActionButton>
                      </div>
                    </Panel>
                  </div>
                </Card>

                <Card light={isLight}>
                  <CardTitle
                    title={copy.channels}
                    description={copy.deliveryChannelsDescription}
                    light={isLight}
                  />

                  <div className="p-4">
                    <ListBox light={isLight}>
                      {channelStats.map(({ channel, total, active }) => (
                        <ListRow key={channel}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div
                                className={cn(
                                  'text-[12.5px] font-semibold',
                                  pageText(isLight),
                                )}
                              >
                                {channelLabel(channel)}
                              </div>

                              <div className={cn('mt-1 text-[11px]', mutedText(isLight))}>
                                {active}/{total} {copy.enabled.toLowerCase()}
                              </div>
                            </div>

                            <MicroLabel light={isLight} active={active > 0}>
                              <StatusDot
                                light={isLight}
                                active={active > 0}
                                accentColor={active > 0 ? accentColor : undefined}
                              />
                              {active > 0 ? copy.ready : copy.channels}
                            </MicroLabel>
                          </div>
                        </ListRow>
                      ))}
                    </ListBox>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </WorkspaceShell>
  );
}