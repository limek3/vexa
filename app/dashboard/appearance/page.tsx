'use client';

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTheme } from 'next-themes';
import {
  Check,
  Eye,
  MonitorSmartphone,
  MoonStar,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

import { WorkspaceShell } from '@/components/shared/workspace-shell';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import { useAppearance, type AppearanceSettings } from '@/lib/appearance-context';
import {
  accentPalette,
  accentToneValues,
  type AccentTone,
} from '@/lib/appearance-palette';
import { useLocale } from '@/lib/locale-context';
import { cn } from '@/lib/utils';
import {
  menuContentClass,
  menuItemCheckSlotClass,
  menuItemClass,
  menuItemInnerClass,
  menuItemLabelClass,
  menuItemLeftClass,
  menuTriggerClass,
} from '@/lib/menu-styles';

type ThemeMode = 'light' | 'dark';

type Option<T extends string> = {
  value: T;
  label: string;
  description: string;
};

function toneLabel(locale: 'ru' | 'en', tone: string) {
  const ru: Record<string, string> = {
    emerald: 'Изумруд',
    violet: 'Фиолет',
    sky: 'Небо',
    rose: 'Роза',
    amber: 'Янтарь',
    cyan: 'Циан',
    indigo: 'Индиго',
    peach: 'Персик',
    teal: 'Бирюза',
    cobalt: 'Кобальт',
    ruby: 'Рубин',
    lime: 'Лайм',
  };

  const en: Record<string, string> = {
    emerald: 'Emerald',
    violet: 'Violet',
    sky: 'Sky',
    rose: 'Rose',
    amber: 'Amber',
    cyan: 'Cyan',
    indigo: 'Indigo',
    peach: 'Peach',
    teal: 'Teal',
    cobalt: 'Cobalt',
    ruby: 'Ruby',
    lime: 'Lime',
  };

  return (locale === 'ru' ? ru : en)[tone] ?? tone;
}

function settingValueLabel(locale: 'ru' | 'en', value: string) {
  const ru: Record<string, string> = {
    light: 'Светлая',
    dark: 'Тёмная',
    system: 'Системная',

    focused: 'Фокус',
    balanced: 'Баланс',
    wide: 'Шире',

    compact: 'Компакт',
    standard: 'Стандарт',
    airy: 'Свободно',

    tight: 'Строго',
    medium: 'Баланс',
    soft: 'Мягко',

    flat: 'Плоско',
    glass: 'Стекло',

    calm: 'Спокойно',
    clear: 'Чище',
    contrast: 'Контраст',

    capsule: 'Капсула',
    line: 'Линия',
    solid: 'Плотно',

    off: 'Без',
    fast: 'Быстро',
    smooth: 'Плавно',

    roomy: 'Воздух',

    gradient: 'Градиент',
    portrait: 'Портрет',
    minimal: 'Минимал',

    split: 'Сплит',
    centered: 'Центр',

    side: 'Слева',
    top: 'Сверху',
    hidden: 'Скрыто',

    cards: 'Карточки',
    strip: 'Полоса',

    sticky: 'Закрепить',
    inline: 'Внутри',
    quiet: 'Тихо',

    pill: 'Капсула',
    rounded: 'Скруглённая',

    editorial: 'Редакция',
    chips: 'Чипы',
    stacked: 'Список',

    panel: 'Панель',
    step: 'Шаги',

    dividers: 'Линии',
    grid: 'Сетка',
  };

  const en: Record<string, string> = {
    light: 'Light',
    dark: 'Dark',
    system: 'System',

    focused: 'Focused',
    balanced: 'Balanced',
    wide: 'Wide',

    compact: 'Compact',
    standard: 'Standard',
    airy: 'Airy',

    tight: 'Tight',
    medium: 'Balanced',
    soft: 'Soft',

    flat: 'Flat',
    glass: 'Glass',

    calm: 'Calm',
    clear: 'Clear',
    contrast: 'Contrast',

    capsule: 'Capsule',
    line: 'Line',
    solid: 'Solid',

    off: 'Off',
    fast: 'Fast',
    smooth: 'Smooth',

    roomy: 'Roomy',

    gradient: 'Gradient',
    portrait: 'Portrait',
    minimal: 'Minimal',

    split: 'Split',
    centered: 'Centered',

    side: 'Side',
    top: 'Top',
    hidden: 'Hidden',

    cards: 'Cards',
    strip: 'Strip',

    sticky: 'Sticky',
    inline: 'Inline',
    quiet: 'Quiet',

    pill: 'Pill',
    rounded: 'Rounded',

    editorial: 'Editorial',
    chips: 'Chips',
    stacked: 'Stacked',

    panel: 'Panel',
    step: 'Steps',

    dividers: 'Dividers',
    grid: 'Grid',
  };

  return (locale === 'ru' ? ru : en)[value] ?? value;
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

function selectTriggerClass(light: boolean) {
  return menuTriggerClass(light);
}

function selectContentClass(light: boolean) {
  return menuContentClass(light);
}

function selectItemClass(light: boolean, active = false) {
  return menuItemClass(light, active);
}

function accentPillStyle(color: string, light: boolean): CSSProperties {
  return {
    background: light
      ? `color-mix(in srgb, ${color} 10%, #ffffff)`
      : `color-mix(in srgb, ${color} 18%, #141414)`,
    borderColor: light
      ? `color-mix(in srgb, ${color} 24%, rgba(0,0,0,0.1))`
      : `color-mix(in srgb, ${color} 30%, rgba(255,255,255,0.1))`,
    color: light
      ? `color-mix(in srgb, ${color} 72%, #101010)`
      : `color-mix(in srgb, ${color} 20%, #ffffff)`,
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
  right,
}: {
  title: string;
  description?: string;
  light: boolean;
  right?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex min-h-[54px] items-center justify-between gap-4 border-b px-4 py-3',
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

      {right ? <div className="shrink-0">{right}</div> : null}
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
      style={active && accentColor ? accentPillStyle(accentColor, light) : undefined}
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-[9px] border px-2.5 text-[10.5px] font-medium',
        !active &&
          (light
            ? 'border-black/[0.08] bg-white text-black/50'
            : 'border-white/[0.08] bg-white/[0.04] text-white/42'),
        className,
      )}
    >
      {children}
    </span>
  );
}

function ActionButton({
  children,
  light,
  active,
  onClick,
  className,
}: {
  children: ReactNode;
  light: boolean;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(buttonBase(light, active), className)}
    >
      {children}
    </button>
  );
}

function SettingRow({
  title,
  description,
  light,
  children,
}: {
  title: string;
  description?: string;
  light: boolean;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-3 py-3 first:pt-0 last:pb-0 md:grid-cols-[190px_minmax(0,1fr)] md:items-center">
      <div className="min-w-0">
        <div className={cn('text-[12px] font-semibold tracking-[-0.018em]', pageText(light))}>
          {title}
        </div>

        {description ? (
          <div className={cn('mt-1 text-[11px] leading-4', mutedText(light))}>
            {description}
          </div>
        ) : null}
      </div>

      <div className="min-w-0">{children}</div>
    </div>
  );
}

function SegmentControl<T extends string>({
  value,
  options,
  onChange,
  light,
  accentColor,
}: {
  value: T;
  options: Array<Option<T>>;
  onChange: (value: T) => void;
  light: boolean;
  accentColor: string;
}) {
  return (
    <div
      className={cn(
        'grid min-h-9 w-full overflow-hidden rounded-[10px] border',
        light ? 'border-black/[0.08] bg-white' : 'border-white/[0.08] bg-white/[0.045]',
      )}
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      {options.map((option, index) => {
        const active = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            title={option.description}
            onClick={() => onChange(option.value)}
            className={cn(
              'group relative flex h-9 min-w-0 items-center justify-center border-r px-2 text-[10.5px] font-semibold tracking-[-0.015em] transition-colors duration-150 last:border-r-0 active:scale-[0.985]',
              light ? 'border-black/[0.07]' : 'border-white/[0.07]',
              active
                ? light
                  ? 'text-black'
                  : 'text-white'
                : light
                  ? 'text-black/40 hover:bg-black/[0.018] hover:text-black/70'
                  : 'text-white/36 hover:bg-white/[0.035] hover:text-white/70',
              index === options.length - 1 && 'border-r-0',
            )}
          >
            <span className="truncate">{option.label}</span>

            <span
              style={active ? { background: accentColor } : undefined}
              className={cn(
                'absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full transition-all duration-150',
                active
                  ? 'opacity-100'
                  : light
                    ? 'bg-black/0 opacity-0 group-hover:bg-black/18 group-hover:opacity-100'
                    : 'bg-white/0 opacity-0 group-hover:bg-white/18 group-hover:opacity-100',
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

function ColorSelect({
  value,
  onChange,
  locale,
  light,
}: {
  value: AccentTone;
  onChange: (value: AccentTone) => void;
  locale: 'ru' | 'en';
  light: boolean;
}) {
  const current = accentPalette[value];

  return (
    <Select value={value} onValueChange={(next) => onChange(next as AccentTone)}>
      <SelectTrigger className={selectTriggerClass(light)}>
        <span className="flex min-w-0 items-center gap-2">
          <span
            className="size-3 shrink-0 rounded-full border border-white/30"
            style={{ background: current.gradient }}
          />

          <span className="truncate">{toneLabel(locale, value)}</span>
        </span>
      </SelectTrigger>

      <SelectContent className={selectContentClass(light)}>
        {accentToneValues.map((tone) => {
          const meta = accentPalette[tone];
          const active = value === tone;

          return (
            <SelectItem
              key={tone}
              value={tone}
              className={cn(
                selectItemClass(light, active),
                'pl-2 pr-3 [&>[data-ref-select-indicator]]:hidden',
              )}
            >
              <div className={menuItemInnerClass()}>
                <span className={menuItemLeftClass()}>
                  <span
                    className="size-3.5 shrink-0 rounded-full border border-white/30"
                    style={{ background: meta.gradient }}
                  />

                  <span className={menuItemLabelClass()}>
                    {toneLabel(locale, tone)}
                  </span>
                </span>

                <span className={menuItemCheckSlotClass()}>
                  {active ? (
                    <Check className="size-3.5" style={{ color: meta.solid }} />
                  ) : null}
                </span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

function PresetCard({
  title,
  description,
  light,
  onClick,
}: {
  title: string;
  description: string;
  light: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'min-h-[62px] rounded-[10px] border p-3 text-left transition active:scale-[0.99]',
        light
          ? 'border-black/[0.08] bg-black/[0.025] hover:border-black/[0.13] hover:bg-white'
          : 'border-white/[0.08] bg-white/[0.035] hover:border-white/[0.13] hover:bg-white/[0.055]',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={cn('truncate text-[12.5px] font-semibold', pageText(light))}>
            {title}
          </div>

          <div className={cn('mt-1 line-clamp-1 text-[10.5px] leading-4', mutedText(light))}>
            {description}
          </div>
        </div>

        <Sparkles className={cn('size-3.5 shrink-0', faintText(light))} />
      </div>
    </button>
  );
}

function PreviewMetric({
  label,
  value,
  light,
}: {
  label: string;
  value: string;
  light: boolean;
}) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-[9px] border px-3 py-2',
        light ? 'border-black/[0.07] bg-white/72' : 'border-white/[0.07] bg-white/[0.045]',
      )}
    >
      <div className={cn('truncate text-[9.5px] font-medium', mutedText(light))}>
        {label}
      </div>

      <div
        className={cn(
          'mt-1 truncate text-[14px] font-semibold leading-none tracking-[-0.045em]',
          pageText(light),
        )}
      >
        {value}
      </div>
    </div>
  );
}

function CompactPreview({
  settings,
  light,
  locale,
}: {
  settings: AppearanceSettings;
  light: boolean;
  locale: 'ru' | 'en';
}) {
  const accent = accentPalette[settings.accentTone].solid;
  const publicAccent = accentPalette[settings.publicAccent].solid;

  const previewCopy =
    locale === 'ru'
      ? {
          dashboard: 'Мой кабинет',
          dashboardHint: 'Рабочий экран мастера',
          bookings: 'Записи',
          clients: 'Клиенты',
          revenue: 'Доход',
          today: 'Сегодня',
          requests: 'Заявки',
          traffic: 'Трафик',
          public: 'Публичная',
          publicHint: 'Как страницу будут видеть клиенты',
          master: 'Алина Морозова',
          service: 'Маникюр и педикюр',
          book: 'Записаться',
          nav: 'Навигация',
          metrics: 'Метрики',
          cta: 'CTA',
        }
      : {
          dashboard: 'Dashboard',
          dashboardHint: 'Specialist workspace',
          bookings: 'Bookings',
          clients: 'Clients',
          revenue: 'Revenue',
          today: 'Today',
          requests: 'Requests',
          traffic: 'Traffic',
          public: 'Public',
          publicHint: 'Client page',
          master: 'Alina Morozova',
          service: 'Manicure and pedicure',
          book: 'Book',
          nav: 'Navigation',
          metrics: 'Metrics',
          cta: 'CTA',
        };

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <Panel light={light} className="overflow-hidden p-0">
        <div
          className={cn(
            'flex items-center justify-between border-b px-3.5 py-3',
            borderTone(light),
          )}
        >
          <div className="min-w-0">
            <div className={cn('text-[12.5px] font-semibold', pageText(light))}>
              {previewCopy.dashboard}
            </div>

            <div className={cn('mt-0.5 truncate text-[10.5px]', mutedText(light))}>
              {previewCopy.dashboardHint} · {settingValueLabel(locale, settings.platformWidth)}
            </div>
          </div>

          <span
            className="size-2 rounded-full"
            style={{
              background: accent,
              boxShadow: `0 0 0 3px color-mix(in srgb, ${accent} 14%, transparent)`,
            }}
          />
        </div>

        <div className="p-3.5">
          <div
            className={cn(
              'mb-3 grid overflow-hidden rounded-[10px] border',
              light ? 'border-black/[0.08] bg-white' : 'border-white/[0.08] bg-white/[0.045]',
            )}
            style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
          >
            {[previewCopy.today, previewCopy.requests, previewCopy.traffic].map((item, index) => (
              <div
                key={item}
                className={cn(
                  'relative flex h-8 items-center justify-center border-r px-2 text-[10.5px] font-semibold last:border-r-0',
                  light ? 'border-black/[0.07]' : 'border-white/[0.07]',
                  index === 0 ? pageText(light) : mutedText(light),
                )}
              >
                <span className="truncate">{item}</span>

                {index === 0 ? (
                  <span
                    className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full"
                    style={{ background: accent }}
                  />
                ) : null}
              </div>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <PreviewMetric label={previewCopy.bookings} value="12" light={light} />
            <PreviewMetric label={previewCopy.clients} value="84" light={light} />
            <PreviewMetric label={previewCopy.revenue} value="128k" light={light} />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <MicroLabel light={light}>{settingValueLabel(locale, settings.density)}</MicroLabel>
            <MicroLabel light={light}>{settingValueLabel(locale, settings.cardStyle)}</MicroLabel>
            <MicroLabel light={light}>{settingValueLabel(locale, settings.dashboardControlStyle)}</MicroLabel>
          </div>
        </div>
      </Panel>

      <Panel light={light} className="overflow-hidden p-0">
        <div
          className={cn(
            'border-b px-3.5 py-3',
            borderTone(light),
          )}
          style={{
            background:
              settings.publicCover === 'minimal'
                ? undefined
                : settings.publicCover === 'portrait'
                  ? `radial-gradient(circle at 16% 18%, color-mix(in srgb, ${publicAccent} 22%, transparent), transparent 58%)`
                  : `linear-gradient(135deg, color-mix(in srgb, ${publicAccent} 20%, transparent), transparent 72%)`,
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className={cn('text-[10px] uppercase tracking-[0.14em]', faintText(light))}>
                {previewCopy.public}
              </div>

              <div
                className={cn(
                  'mt-1 truncate text-[17px] font-semibold tracking-[-0.055em]',
                  pageText(light),
                )}
              >
                {previewCopy.master}
              </div>

              <div className={cn('mt-0.5 truncate text-[10.5px]', mutedText(light))}>
                {previewCopy.service} · {settingValueLabel(locale, settings.publicHeroLayout)}
              </div>
            </div>

            <button
              type="button"
              className={cn(
                'h-8 shrink-0 border px-3 text-[11px] font-semibold',
                settings.publicButtonStyle === 'contrast'
                  ? light
                    ? 'bg-black text-white'
                    : 'bg-white text-black'
                  : light
                    ? 'border-black/[0.08] bg-white/78 text-black'
                    : 'border-white/[0.08] bg-white/[0.055] text-white',
                settings.publicButtonStyle === 'pill' && 'rounded-full',
                settings.publicButtonStyle === 'rounded' && 'rounded-[12px]',
                settings.publicButtonStyle === 'contrast' && 'rounded-[9px]',
              )}
              style={
                settings.publicButtonStyle !== 'contrast'
                  ? {
                      borderColor: `color-mix(in srgb, ${publicAccent} 30%, transparent)`,
                    }
                  : undefined
              }
            >
              {previewCopy.book}
            </button>
          </div>
        </div>

        <div className="grid gap-2 p-3.5 sm:grid-cols-3">
          <PreviewMetric
            label={previewCopy.nav}
            value={settingValueLabel(locale, settings.publicNavigationStyle)}
            light={light}
          />

          <PreviewMetric
            label={previewCopy.metrics}
            value={settingValueLabel(locale, settings.publicStatsStyle)}
            light={light}
          />

          <PreviewMetric
            label={previewCopy.cta}
            value={settingValueLabel(locale, settings.publicCtaMode)}
            light={light}
          />
        </div>
      </Panel>
    </div>
  );
}

export default function DashboardAppearancePage() {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const { settings, setSetting, setSettingsBatch, resetSettings } = useAppearance();
  const { locale } = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const currentTheme: ThemeMode = mounted && resolvedTheme === 'light' ? 'light' : 'dark';
  const isLight = currentTheme === 'light';
  const accentColor = accentPalette[settings.accentTone].solid;
  const publicAccentColor = accentPalette[settings.publicAccent].solid;

  const copy =
    locale === 'ru'
      ? {
          title: 'Внешний вид',
          description:
            'Компактная настройка кабинета и публичной страницы: цвета, плотность, hero, услуги, CTA и форма записи.',
          reset: 'Сбросить',
          presets: 'Готовые стили',
          presetsHint: 'Быстро применить цельный набор настроек.',
          preview: 'Превью',
          previewHint: 'Короткая проверка влияния настроек.',
          theme: 'Тема',
          cabinet: 'Мой кабинет',
          cabinetHint: 'Рабочие страницы мастера: ширина, плотность, карточки и переключатели.',
          public: 'Публичная страница',
          publicHint: 'Как страницу будут видеть клиенты: hero, услуги, CTA, навигация и секции.',
          colorCabinet: 'Цвет кабинета',
          colorPublic: 'Цвет публичной страницы',
          layout: 'Макет',
          cards: 'Карточки',
          controls: 'Переключатели',
          navigation: 'Навигация',
          publicStructure: 'Структура',
          publicVisual: 'Визуал',
          bookingServices: 'Запись и услуги',
          secondarySections: 'Вторичные секции',
          summary: 'Итог',
        }
      : {
          title: 'Appearance',
          description:
            'Compact setup for dashboard and public page: colors, density, hero, services, CTA, and booking form.',
          reset: 'Reset',
          presets: 'Style presets',
          presetsHint: 'Apply a coherent set of settings quickly.',
          preview: 'Preview',
          previewHint: 'Quick check of how settings affect UI.',
          theme: 'Theme',
          cabinet: 'Dashboard',
          cabinetHint: 'Specialist workspace: width, density, cards, and controls.',
          public: 'Public page',
          publicHint: 'Client page: hero, services, CTA, navigation, and sections.',
          colorCabinet: 'Dashboard color',
          colorPublic: 'Public page color',
          layout: 'Layout',
          cards: 'Cards',
          controls: 'Controls',
          navigation: 'Navigation',
          publicStructure: 'Structure',
          publicVisual: 'Visual',
          bookingServices: 'Booking and services',
          secondarySections: 'Secondary sections',
          summary: 'Summary',
        };

  const themeOptions: Array<Option<'light' | 'dark' | 'system'>> =
    locale === 'ru'
      ? [
          { value: 'light', label: 'Светлая', description: 'Чистый рабочий фон.' },
          { value: 'dark', label: 'Тёмная', description: 'Графитовый кабинет.' },
          { value: 'system', label: 'Системная', description: 'Как в браузере.' },
        ]
      : [
          { value: 'light', label: 'Light', description: 'Clean workspace.' },
          { value: 'dark', label: 'Dark', description: 'Graphite workspace.' },
          { value: 'system', label: 'System', description: 'Follows browser.' },
        ];

  const platformOptions: Array<Option<AppearanceSettings['platformWidth']>> =
    locale === 'ru'
      ? [
          { value: 'focused', label: 'Фокус', description: 'Уже и плотнее.' },
          { value: 'balanced', label: 'Баланс', description: 'Стандартная ширина.' },
          { value: 'wide', label: 'Шире', description: 'Больше места для таблиц.' },
        ]
      : [
          { value: 'focused', label: 'Focused', description: 'Narrower and denser.' },
          { value: 'balanced', label: 'Balanced', description: 'Reference width.' },
          { value: 'wide', label: 'Wide', description: 'More table space.' },
        ];

  const densityOptions: Array<Option<AppearanceSettings['density']>> =
    locale === 'ru'
      ? [
          { value: 'compact', label: 'Плотно', description: 'Меньше вертикальных отступов.' },
          { value: 'standard', label: 'Спокойно', description: 'Баланс плотности.' },
          { value: 'airy', label: 'Свободно', description: 'Больше воздуха.' },
        ]
      : [
          { value: 'compact', label: 'Compact', description: 'Less spacing.' },
          { value: 'standard', label: 'Standard', description: 'Balanced density.' },
          { value: 'airy', label: 'Airy', description: 'More breathing room.' },
        ];

  const radiusOptions: Array<Option<AppearanceSettings['radius']>> =
    locale === 'ru'
      ? [
          { value: 'tight', label: 'Строго', description: 'Меньше скругления.' },
          { value: 'medium', label: 'Баланс', description: 'Текущий референс.' },
          { value: 'soft', label: 'Мягко', description: 'Более округлые карточки.' },
        ]
      : [
          { value: 'tight', label: 'Tight', description: 'Smaller radius.' },
          { value: 'medium', label: 'Balanced', description: 'Reference radius.' },
          { value: 'soft', label: 'Soft', description: 'Rounder cards.' },
        ];

  const cardOptions: Array<Option<AppearanceSettings['cardStyle']>> =
    locale === 'ru'
      ? [
          { value: 'flat', label: 'Плоско', description: 'Максимально строго.' },
          { value: 'soft', label: 'Мягко', description: 'Спокойные панели.' },
          { value: 'glass', label: 'Стекло', description: 'Полупрозрачные карточки.' },
        ]
      : [
          { value: 'flat', label: 'Flat', description: 'Strict and minimal.' },
          { value: 'soft', label: 'Soft', description: 'Calm panels.' },
          { value: 'glass', label: 'Glass', description: 'Translucent cards.' },
        ];

  const navDensityOptions: Array<Option<AppearanceSettings['sidebarDensity']>> =
    locale === 'ru'
      ? [
          { value: 'tight', label: 'Плотно', description: 'Компактная навигация.' },
          { value: 'balanced', label: 'Баланс', description: 'Стандартный размер.' },
          { value: 'roomy', label: 'Воздух', description: 'Больше места.' },
        ]
      : [
          { value: 'tight', label: 'Tight', description: 'Compact navigation.' },
          { value: 'balanced', label: 'Balanced', description: 'Standard size.' },
          { value: 'roomy', label: 'Roomy', description: 'More spacing.' },
        ];

  const motionOptions: Array<Option<AppearanceSettings['motion']>> =
    locale === 'ru'
      ? [
          { value: 'off', label: 'Без', description: 'Минимум анимаций.' },
          { value: 'fast', label: 'Быстро', description: 'Короткие переходы.' },
          { value: 'smooth', label: 'Плавно', description: 'Мягкое движение.' },
        ]
      : [
          { value: 'off', label: 'Off', description: 'Minimal animations.' },
          { value: 'fast', label: 'Fast', description: 'Short transitions.' },
          { value: 'smooth', label: 'Smooth', description: 'Soft motion.' },
        ];

  const mobileScaleOptions: Array<Option<AppearanceSettings['mobileFontScale']>> =
    locale === 'ru'
      ? [
          { value: 'compact', label: 'Компакт', description: 'Меньше шрифт на мобильных.' },
          { value: 'standard', label: 'Стандарт', description: 'Крупнее текст на мобильных.' },
        ]
      : [
          { value: 'compact', label: 'Compact', description: 'Smaller mobile text.' },
          { value: 'standard', label: 'Standard', description: 'Larger mobile text.' },
        ];

  const dashboardSurfaceOptions: Array<Option<AppearanceSettings['dashboardSurface']>> =
    locale === 'ru'
      ? [
          { value: 'calm', label: 'Спокойно', description: 'Базовый фон и карточки.' },
          { value: 'clear', label: 'Чище', description: 'Светлее панели.' },
          { value: 'contrast', label: 'Контраст', description: 'Больше разделения блоков.' },
        ]
      : [
          { value: 'calm', label: 'Calm', description: 'Default background.' },
          { value: 'clear', label: 'Clear', description: 'Cleaner panels.' },
          { value: 'contrast', label: 'Contrast', description: 'More separation.' },
        ];

  const dashboardControlOptions: Array<Option<AppearanceSettings['dashboardControlStyle']>> =
    locale === 'ru'
      ? [
          { value: 'capsule', label: 'Капсула', description: 'Переключатели как в референсе.' },
          { value: 'line', label: 'Линия', description: 'Тонкий активный индикатор.' },
          { value: 'solid', label: 'Плотно', description: 'Заметные активные кнопки.' },
        ]
      : [
          { value: 'capsule', label: 'Capsule', description: 'Reference segmented controls.' },
          { value: 'line', label: 'Line', description: 'Thin active indicator.' },
          { value: 'solid', label: 'Solid', description: 'More visible active buttons.' },
        ];

  const publicCoverOptions: Array<Option<AppearanceSettings['publicCover']>> =
    locale === 'ru'
      ? [
          { value: 'gradient', label: 'Градиент', description: 'Акцентная обложка.' },
          { value: 'portrait', label: 'Портрет', description: 'Больше внимания мастеру.' },
          { value: 'minimal', label: 'Минимал', description: 'Почти без декора.' },
        ]
      : [
          { value: 'gradient', label: 'Gradient', description: 'Accent cover.' },
          { value: 'portrait', label: 'Portrait', description: 'Focus on the master.' },
          { value: 'minimal', label: 'Minimal', description: 'Almost no decor.' },
        ];

  const publicHeroOptions: Array<Option<AppearanceSettings['publicHeroLayout']>> =
    locale === 'ru'
      ? [
          { value: 'split', label: 'Сплит', description: 'Карточка + боковая запись.' },
          { value: 'centered', label: 'Центр', description: 'Hero по центру.' },
          { value: 'compact', label: 'Компакт', description: 'Меньше высота первого блока.' },
        ]
      : [
          { value: 'split', label: 'Split', description: 'Card plus booking side.' },
          { value: 'centered', label: 'Centered', description: 'Centered hero.' },
          { value: 'compact', label: 'Compact', description: 'Shorter first block.' },
        ];

  const publicNavigationOptions: Array<Option<AppearanceSettings['publicNavigationStyle']>> =
    locale === 'ru'
      ? [
          { value: 'side', label: 'Слева', description: 'Паспорт и навигация сбоку.' },
          { value: 'top', label: 'Сверху', description: 'Компактная навигация над hero.' },
          { value: 'hidden', label: 'Скрыть', description: 'Оставить только контент.' },
        ]
      : [
          { value: 'side', label: 'Side', description: 'Passport and navigation in rail.' },
          { value: 'top', label: 'Top', description: 'Navigation above hero.' },
          { value: 'hidden', label: 'Hidden', description: 'Content only.' },
        ];

  const publicStatsOptions: Array<Option<AppearanceSettings['publicStatsStyle']>> =
    locale === 'ru'
      ? [
          { value: 'cards', label: 'Карточки', description: 'Факты в отдельных плитках.' },
          { value: 'strip', label: 'Полоса', description: 'Компактная строка под hero.' },
          { value: 'hidden', label: 'Скрыть', description: 'Убрать метрики из hero.' },
        ]
      : [
          { value: 'cards', label: 'Cards', description: 'Facts in tiles.' },
          { value: 'strip', label: 'Strip', description: 'Compact row below hero.' },
          { value: 'hidden', label: 'Hidden', description: 'Remove hero stats.' },
        ];

  const publicCtaOptions: Array<Option<AppearanceSettings['publicCtaMode']>> =
    locale === 'ru'
      ? [
          { value: 'sticky', label: 'Закрепить', description: 'Кнопка снизу на мобильном.' },
          { value: 'inline', label: 'Внутри', description: 'CTA внутри страницы.' },
          { value: 'quiet', label: 'Тихо', description: 'Минимальный CTA.' },
        ]
      : [
          { value: 'sticky', label: 'Sticky', description: 'Fixed mobile button.' },
          { value: 'inline', label: 'Inline', description: 'CTA inside page.' },
          { value: 'quiet', label: 'Quiet', description: 'Minimal CTA.' },
        ];

  const publicButtonOptions: Array<Option<AppearanceSettings['publicButtonStyle']>> =
    locale === 'ru'
      ? [
          { value: 'pill', label: 'Капсула', description: 'Мягкая CTA-кнопка.' },
          { value: 'rounded', label: 'Скруглённая', description: 'Спокойная кнопка.' },
          { value: 'contrast', label: 'Контраст', description: 'Сильная главная кнопка.' },
        ]
      : [
          { value: 'pill', label: 'Pill', description: 'Soft CTA.' },
          { value: 'rounded', label: 'Rounded', description: 'Calm button.' },
          { value: 'contrast', label: 'Contrast', description: 'Strong CTA.' },
        ];

  const publicCardOptions: Array<Option<AppearanceSettings['publicCardStyle']>> =
    locale === 'ru'
      ? [
          { value: 'editorial', label: 'Редакция', description: 'Больше выразительности.' },
          { value: 'soft', label: 'Мягкая', description: 'Базовый аккуратный вид.' },
          { value: 'compact', label: 'Компакт', description: 'Плотнее секции.' },
        ]
      : [
          { value: 'editorial', label: 'Editorial', description: 'More expressive.' },
          { value: 'soft', label: 'Soft', description: 'Default clean style.' },
          { value: 'compact', label: 'Compact', description: 'Denser sections.' },
        ];

  const publicServicesOptions: Array<Option<AppearanceSettings['publicServicesStyle']>> =
    locale === 'ru'
      ? [
          { value: 'grid', label: 'Сетка', description: 'Услуги в две колонки.' },
          { value: 'chips', label: 'Чипы', description: 'Короткие плитки.' },
          { value: 'stacked', label: 'Список', description: 'Одна колонка.' },
        ]
      : [
          { value: 'grid', label: 'Grid', description: 'Two-column services.' },
          { value: 'chips', label: 'Chips', description: 'Short tiles.' },
          { value: 'stacked', label: 'Stacked', description: 'Single column.' },
        ];

  const publicBookingOptions: Array<Option<AppearanceSettings['publicBookingStyle']>> =
    locale === 'ru'
      ? [
          { value: 'panel', label: 'Панель', description: 'Заметная запись справа.' },
          { value: 'step', label: 'Шаги', description: 'Сценарий как процесс.' },
          { value: 'minimal', label: 'Минимал', description: 'Тихий блок записи.' },
        ]
      : [
          { value: 'panel', label: 'Panel', description: 'Visible side booking.' },
          { value: 'step', label: 'Steps', description: 'Process-like flow.' },
          { value: 'minimal', label: 'Minimal', description: 'Quiet booking block.' },
        ];

  const publicSurfaceOptions: Array<Option<AppearanceSettings['publicSurface']>> =
    locale === 'ru'
      ? [
          { value: 'soft', label: 'Мягко', description: 'Спокойная поверхность.' },
          { value: 'contrast', label: 'Контраст', description: 'Больше глубины.' },
          { value: 'glass', label: 'Стекло', description: 'Полупрозрачные блоки.' },
        ]
      : [
          { value: 'soft', label: 'Soft', description: 'Calm surface.' },
          { value: 'contrast', label: 'Contrast', description: 'More depth.' },
          { value: 'glass', label: 'Glass', description: 'Translucent blocks.' },
        ];

  const publicSectionOptions: Array<Option<AppearanceSettings['publicSectionStyle']>> =
    locale === 'ru'
      ? [
          { value: 'cards', label: 'Карточки', description: 'Секции в рамках.' },
          { value: 'minimal', label: 'Минимал', description: 'Меньше рамок.' },
          { value: 'dividers', label: 'Линии', description: 'Разделители вместо карточек.' },
        ]
      : [
          { value: 'cards', label: 'Cards', description: 'Section frames.' },
          { value: 'minimal', label: 'Minimal', description: 'Fewer borders.' },
          { value: 'dividers', label: 'Dividers', description: 'Lines instead of cards.' },
        ];

  const publicGalleryOptions: Array<Option<AppearanceSettings['publicGalleryStyle']>> =
    locale === 'ru'
      ? [
          { value: 'grid', label: 'Сетка', description: 'Ровные карточки работ.' },
          { value: 'editorial', label: 'Редакция', description: 'Разные размеры работ.' },
          { value: 'compact', label: 'Компакт', description: 'Плотная галерея.' },
        ]
      : [
          { value: 'grid', label: 'Grid', description: 'Even work cards.' },
          { value: 'editorial', label: 'Editorial', description: 'Mixed work sizes.' },
          { value: 'compact', label: 'Compact', description: 'Dense gallery.' },
        ];

  const presets = useMemo(
    () => [
      {
        key: 'studio',
        title: locale === 'ru' ? 'Студия' : 'Studio',
        description:
          locale === 'ru'
            ? 'Строгий кабинет + чистая публичная.'
            : 'Strict dashboard plus clean public page.',
        apply: () => {
          setTheme('dark');
          setSettingsBatch({
            accentTone: 'teal',
            publicAccent: 'teal',
            density: 'compact',
            radius: 'medium',
            motion: 'fast',
            cardStyle: 'soft',
            dashboardSurface: 'calm',
            dashboardControlStyle: 'capsule',
            platformWidth: 'balanced',
            sidebarDensity: 'balanced',
            topbarDensity: 'balanced',
            publicCover: 'gradient',
            publicButtonStyle: 'pill',
            publicCardStyle: 'soft',
            publicServicesStyle: 'grid',
            publicBookingStyle: 'panel',
            publicHeroLayout: 'split',
            publicSurface: 'soft',
            publicSectionStyle: 'cards',
            publicGalleryStyle: 'grid',
            publicNavigationStyle: 'side',
            publicStatsStyle: 'cards',
            publicCtaMode: 'sticky',
          });
        },
      },
      {
        key: 'minimal',
        title: locale === 'ru' ? 'Минимал' : 'Minimal',
        description:
          locale === 'ru'
            ? 'Меньше фона, рамок и декора.'
            : 'Less background, borders, and decor.',
        apply: () => {
          setTheme('light');
          setSettingsBatch({
            accentTone: 'teal',
            publicAccent: 'teal',
            density: 'compact',
            radius: 'tight',
            motion: 'fast',
            cardStyle: 'flat',
            dashboardSurface: 'clear',
            dashboardControlStyle: 'line',
            platformWidth: 'focused',
            sidebarDensity: 'tight',
            topbarDensity: 'tight',
            publicCover: 'minimal',
            publicButtonStyle: 'rounded',
            publicCardStyle: 'compact',
            publicServicesStyle: 'stacked',
            publicBookingStyle: 'minimal',
            publicHeroLayout: 'compact',
            publicSurface: 'soft',
            publicSectionStyle: 'dividers',
            publicGalleryStyle: 'compact',
            publicNavigationStyle: 'hidden',
            publicStatsStyle: 'hidden',
            publicCtaMode: 'inline',
          });
        },
      },
      {
        key: 'premium',
        title: locale === 'ru' ? 'Премиум' : 'Premium',
        description:
          locale === 'ru'
            ? 'Мягкие карточки и выразительная страница.'
            : 'Soft cards and expressive public page.',
        apply: () => {
          setTheme('dark');
          setSettingsBatch({
            accentTone: 'violet',
            publicAccent: 'rose',
            density: 'standard',
            radius: 'soft',
            motion: 'smooth',
            cardStyle: 'glass',
            dashboardSurface: 'contrast',
            dashboardControlStyle: 'solid',
            platformWidth: 'balanced',
            sidebarDensity: 'balanced',
            topbarDensity: 'balanced',
            publicCover: 'portrait',
            publicButtonStyle: 'pill',
            publicCardStyle: 'editorial',
            publicServicesStyle: 'grid',
            publicBookingStyle: 'panel',
            publicHeroLayout: 'centered',
            publicSurface: 'glass',
            publicSectionStyle: 'cards',
            publicGalleryStyle: 'editorial',
            publicNavigationStyle: 'top',
            publicStatsStyle: 'strip',
            publicCtaMode: 'sticky',
          });
        },
      },
      {
        key: 'soft',
        title: locale === 'ru' ? 'Пудра' : 'Powder',
        description:
          locale === 'ru' ? 'Светлая мягкая подача.' : 'Soft light presentation.',
        apply: () => {
          setTheme('light');
          setSettingsBatch({
            accentTone: 'teal',
            publicAccent: 'peach',
            density: 'standard',
            radius: 'soft',
            motion: 'smooth',
            cardStyle: 'soft',
            dashboardSurface: 'calm',
            dashboardControlStyle: 'capsule',
            platformWidth: 'balanced',
            sidebarDensity: 'balanced',
            topbarDensity: 'roomy',
            publicCover: 'gradient',
            publicButtonStyle: 'pill',
            publicCardStyle: 'soft',
            publicServicesStyle: 'chips',
            publicBookingStyle: 'step',
            publicHeroLayout: 'centered',
            publicSurface: 'soft',
            publicSectionStyle: 'cards',
            publicGalleryStyle: 'grid',
            publicNavigationStyle: 'top',
            publicStatsStyle: 'strip',
            publicCtaMode: 'sticky',
          });
        },
      },
      {
        key: 'noir',
        title: locale === 'ru' ? 'Нуар' : 'Noir',
        description:
          locale === 'ru' ? 'Контрастная тёмная сборка.' : 'High-contrast dark setup.',
        apply: () => {
          setTheme('dark');
          setSettingsBatch({
            accentTone: 'ruby',
            publicAccent: 'amber',
            density: 'compact',
            radius: 'tight',
            motion: 'fast',
            cardStyle: 'flat',
            dashboardSurface: 'contrast',
            dashboardControlStyle: 'line',
            platformWidth: 'focused',
            sidebarDensity: 'tight',
            topbarDensity: 'tight',
            publicCover: 'minimal',
            publicButtonStyle: 'contrast',
            publicCardStyle: 'compact',
            publicServicesStyle: 'stacked',
            publicBookingStyle: 'minimal',
            publicHeroLayout: 'compact',
            publicSurface: 'contrast',
            publicSectionStyle: 'dividers',
            publicGalleryStyle: 'compact',
            publicNavigationStyle: 'hidden',
            publicStatsStyle: 'hidden',
            publicCtaMode: 'inline',
          });
        },
      },
      {
        key: 'fresh',
        title: locale === 'ru' ? 'Свежий' : 'Fresh',
        description:
          locale === 'ru' ? 'Светлый зелёный акцент.' : 'Light green accent.',
        apply: () => {
          setTheme('light');
          setSettingsBatch({
            accentTone: 'emerald',
            publicAccent: 'teal',
            density: 'standard',
            radius: 'medium',
            motion: 'smooth',
            cardStyle: 'soft',
            dashboardSurface: 'clear',
            dashboardControlStyle: 'capsule',
            platformWidth: 'wide',
            sidebarDensity: 'balanced',
            topbarDensity: 'balanced',
            publicCover: 'gradient',
            publicButtonStyle: 'rounded',
            publicCardStyle: 'soft',
            publicServicesStyle: 'grid',
            publicBookingStyle: 'panel',
            publicHeroLayout: 'split',
            publicSurface: 'soft',
            publicSectionStyle: 'cards',
            publicGalleryStyle: 'editorial',
            publicNavigationStyle: 'side',
            publicStatsStyle: 'cards',
            publicCtaMode: 'sticky',
          });
        },
      },
    ],
    [locale, setSettingsBatch, setTheme],
  );

  if (!mounted) return null;

  return (
    <WorkspaceShell>
      <main
        className={cn(
          'min-h-[calc(100dvh-68px)] px-4 pb-10 pt-5 md:px-7 md:pt-6',
          pageBg(isLight),
        )}
      >
        <div className="mx-auto w-full max-w-[var(--page-max-width)]">
          <div className="mb-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <h1
                  className={cn(
                    'text-[20px] font-semibold tracking-[-0.025em] md:text-[24px]',
                    pageText(isLight),
                  )}
                >
                  {copy.title}
                </h1>

                <p className={cn('mt-2 max-w-[780px] text-[13px] leading-5', mutedText(isLight))}>
                  {copy.description}
                </p>
              </div>

              <ActionButton light={isLight} onClick={resetSettings}>
                <RotateCcw className="size-3.5" />
                {copy.reset}
              </ActionButton>
            </div>
          </div>

          <div className="grid gap-4">
            <Card light={isLight}>
              <CardTitle
                title={copy.presets}
                description={copy.presetsHint}
                light={isLight}
                right={<Sparkles className={cn('size-4', faintText(isLight))} />}
              />

              <div className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-6">
                {presets.map((preset) => (
                  <PresetCard
                    key={preset.key}
                    title={preset.title}
                    description={preset.description}
                    light={isLight}
                    onClick={preset.apply}
                  />
                ))}
              </div>
            </Card>

            <Card light={isLight}>
              <CardTitle
                title={copy.preview}
                description={copy.previewHint}
                light={isLight}
              />

              <div className="p-4">
                <CompactPreview settings={settings} light={isLight} locale={locale} />
              </div>
            </Card>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <Card light={isLight}>
                <CardTitle
                  title={copy.cabinet}
                  description={copy.cabinetHint}
                  light={isLight}
                  right={<MonitorSmartphone className={cn('size-4', faintText(isLight))} />}
                />

                <div className={cn('divide-y p-4', divideTone(isLight))}>
                  <SettingRow
                    title={copy.theme}
                    description={
                      locale === 'ru'
                        ? 'Светлая, тёмная или системная тема.'
                        : 'Light, dark, or system theme.'
                    }
                    light={isLight}
                  >
                    <SegmentControl
                      value={
                        (theme === 'light' || theme === 'dark' || theme === 'system'
                          ? theme
                          : currentTheme) as 'light' | 'dark' | 'system'
                      }
                      options={themeOptions}
                      onChange={(value) => setTheme(value)}
                      light={isLight}
                      accentColor={accentColor}
                    />
                  </SettingRow>

                  <SettingRow
                    title={copy.colorCabinet}
                    description={
                      locale === 'ru'
                        ? 'Акцент кнопок, точек и активных элементов.'
                        : 'Accent for buttons, dots, and active states.'
                    }
                    light={isLight}
                  >
                    <ColorSelect
                      value={settings.accentTone}
                      onChange={(value) => setSetting('accentTone', value)}
                      locale={locale}
                      light={isLight}
                    />
                  </SettingRow>

                  <SettingRow
                    title={copy.layout}
                    description={
                      locale === 'ru'
                        ? 'Ширина рабочей области и плотность страниц.'
                        : 'Workspace width and page density.'
                    }
                    light={isLight}
                  >
                    <div className="grid gap-2 lg:grid-cols-2">
                      <SegmentControl
                        value={settings.platformWidth}
                        options={platformOptions}
                        onChange={(value) => setSetting('platformWidth', value)}
                        light={isLight}
                        accentColor={accentColor}
                      />

                      <SegmentControl
                        value={settings.density}
                        options={densityOptions}
                        onChange={(value) => setSetting('density', value)}
                        light={isLight}
                        accentColor={accentColor}
                      />
                    </div>
                  </SettingRow>

                  <SettingRow
                    title={copy.cards}
                    description={
                      locale === 'ru'
                        ? 'Скругление, поверхность и стиль карточек.'
                        : 'Radius, surface, and card style.'
                    }
                    light={isLight}
                  >
                    <div className="grid gap-2">
                      <SegmentControl
                        value={settings.radius}
                        options={radiusOptions}
                        onChange={(value) => setSetting('radius', value)}
                        light={isLight}
                        accentColor={accentColor}
                      />

                      <div className="grid gap-2 lg:grid-cols-2">
                        <SegmentControl
                          value={settings.cardStyle}
                          options={cardOptions}
                          onChange={(value) => setSetting('cardStyle', value)}
                          light={isLight}
                          accentColor={accentColor}
                        />

                        <SegmentControl
                          value={settings.dashboardSurface}
                          options={dashboardSurfaceOptions}
                          onChange={(value) => setSetting('dashboardSurface', value)}
                          light={isLight}
                          accentColor={accentColor}
                        />
                      </div>
                    </div>
                  </SettingRow>

                  <SettingRow
                    title={copy.controls}
                    description={
                      locale === 'ru'
                        ? 'Переключатели, движение и мобильная плотность.'
                        : 'Controls, motion, and mobile density.'
                    }
                    light={isLight}
                  >
                    <div className="grid gap-2">
                      <SegmentControl
                        value={settings.dashboardControlStyle}
                        options={dashboardControlOptions}
                        onChange={(value) => setSetting('dashboardControlStyle', value)}
                        light={isLight}
                        accentColor={accentColor}
                      />

                      <div className="grid gap-2 lg:grid-cols-2">
                        <SegmentControl
                          value={settings.motion}
                          options={motionOptions}
                          onChange={(value) => setSetting('motion', value)}
                          light={isLight}
                          accentColor={accentColor}
                        />

                        <SegmentControl
                          value={settings.mobileFontScale}
                          options={mobileScaleOptions}
                          onChange={(value) => setSetting('mobileFontScale', value)}
                          light={isLight}
                          accentColor={accentColor}
                        />
                      </div>
                    </div>
                  </SettingRow>

                  <SettingRow
                    title={copy.navigation}
                    description={
                      locale === 'ru'
                        ? 'Плотность бокового меню и верхней панели.'
                        : 'Sidebar and topbar density.'
                    }
                    light={isLight}
                  >
                    <div className="grid gap-2 lg:grid-cols-2">
                      <SegmentControl
                        value={settings.sidebarDensity}
                        options={navDensityOptions}
                        onChange={(value) => setSetting('sidebarDensity', value)}
                        light={isLight}
                        accentColor={accentColor}
                      />

                      <SegmentControl
                        value={settings.topbarDensity}
                        options={navDensityOptions}
                        onChange={(value) => setSetting('topbarDensity', value)}
                        light={isLight}
                        accentColor={accentColor}
                      />
                    </div>
                  </SettingRow>
                </div>
              </Card>

              <Card light={isLight}>
                <CardTitle
                  title={copy.public}
                  description={copy.publicHint}
                  light={isLight}
                  right={<Eye className={cn('size-4', faintText(isLight))} />}
                />

                <div className={cn('divide-y p-4', divideTone(isLight))}>
                  <SettingRow
                    title={copy.colorPublic}
                    description={
                      locale === 'ru'
                        ? 'Акцент CTA, hero и клиентских секций.'
                        : 'Accent for CTA, hero, and client sections.'
                    }
                    light={isLight}
                  >
                    <ColorSelect
                      value={settings.publicAccent}
                      onChange={(value) => setSetting('publicAccent', value)}
                      locale={locale}
                      light={isLight}
                    />
                  </SettingRow>

                  <SettingRow
                    title={copy.publicStructure}
                    description={
                      locale === 'ru'
                        ? 'Первый экран, навигация, метрики и CTA.'
                        : 'Hero, navigation, stats, and CTA.'
                    }
                    light={isLight}
                  >
                    <div className="grid gap-2">
                      <div className="grid gap-2 lg:grid-cols-2">
                        <SegmentControl
                          value={settings.publicHeroLayout}
                          options={publicHeroOptions}
                          onChange={(value) => setSetting('publicHeroLayout', value)}
                          light={isLight}
                          accentColor={publicAccentColor}
                        />

                        <SegmentControl
                          value={settings.publicNavigationStyle}
                          options={publicNavigationOptions}
                          onChange={(value) => setSetting('publicNavigationStyle', value)}
                          light={isLight}
                          accentColor={publicAccentColor}
                        />
                      </div>

                      <div className="grid gap-2 lg:grid-cols-2">
                        <SegmentControl
                          value={settings.publicStatsStyle}
                          options={publicStatsOptions}
                          onChange={(value) => setSetting('publicStatsStyle', value)}
                          light={isLight}
                          accentColor={publicAccentColor}
                        />

                        <SegmentControl
                          value={settings.publicCtaMode}
                          options={publicCtaOptions}
                          onChange={(value) => setSetting('publicCtaMode', value)}
                          light={isLight}
                          accentColor={publicAccentColor}
                        />
                      </div>
                    </div>
                  </SettingRow>

                  <SettingRow
                    title={copy.publicVisual}
                    description={
                      locale === 'ru'
                        ? 'Обложка, поверхность и стиль карточек.'
                        : 'Cover, surface, and card style.'
                    }
                    light={isLight}
                  >
                    <div className="grid gap-2">
                      <SegmentControl
                        value={settings.publicCover}
                        options={publicCoverOptions}
                        onChange={(value) => setSetting('publicCover', value)}
                        light={isLight}
                        accentColor={publicAccentColor}
                      />

                      <div className="grid gap-2 lg:grid-cols-2">
                        <SegmentControl
                          value={settings.publicSurface}
                          options={publicSurfaceOptions}
                          onChange={(value) => setSetting('publicSurface', value)}
                          light={isLight}
                          accentColor={publicAccentColor}
                        />

                        <SegmentControl
                          value={settings.publicCardStyle}
                          options={publicCardOptions}
                          onChange={(value) => setSetting('publicCardStyle', value)}
                          light={isLight}
                          accentColor={publicAccentColor}
                        />
                      </div>
                    </div>
                  </SettingRow>

                  <SettingRow
                    title={copy.bookingServices}
                    description={
                      locale === 'ru'
                        ? 'Вид кнопки, форма записи и список услуг.'
                        : 'Button style, booking block, and service list.'
                    }
                    light={isLight}
                  >
                    <div className="grid gap-2">
                      <SegmentControl
                        value={settings.publicButtonStyle}
                        options={publicButtonOptions}
                        onChange={(value) => setSetting('publicButtonStyle', value)}
                        light={isLight}
                        accentColor={publicAccentColor}
                      />

                      <div className="grid gap-2 lg:grid-cols-2">
                        <SegmentControl
                          value={settings.publicBookingStyle}
                          options={publicBookingOptions}
                          onChange={(value) => setSetting('publicBookingStyle', value)}
                          light={isLight}
                          accentColor={publicAccentColor}
                        />

                        <SegmentControl
                          value={settings.publicServicesStyle}
                          options={publicServicesOptions}
                          onChange={(value) => setSetting('publicServicesStyle', value)}
                          light={isLight}
                          accentColor={publicAccentColor}
                        />
                      </div>
                    </div>
                  </SettingRow>

                  <SettingRow
                    title={copy.secondarySections}
                    description={
                      locale === 'ru'
                        ? 'Отзывы, контакты, FAQ и галерея.'
                        : 'Reviews, contacts, FAQ, and gallery.'
                    }
                    light={isLight}
                  >
                    <div className="grid gap-2 lg:grid-cols-2">
                      <SegmentControl
                        value={settings.publicSectionStyle}
                        options={publicSectionOptions}
                        onChange={(value) => setSetting('publicSectionStyle', value)}
                        light={isLight}
                        accentColor={publicAccentColor}
                      />

                      <SegmentControl
                        value={settings.publicGalleryStyle}
                        options={publicGalleryOptions}
                        onChange={(value) => setSetting('publicGalleryStyle', value)}
                        light={isLight}
                        accentColor={publicAccentColor}
                      />
                    </div>
                  </SettingRow>

                  <SettingRow
                    title={copy.summary}
                    description={
                      locale === 'ru'
                        ? 'Текущая публичная конфигурация.'
                        : 'Current public configuration.'
                    }
                    light={isLight}
                  >
                    <div className="flex flex-wrap gap-2">
                      <MicroLabel light={isLight} active accentColor={publicAccentColor}>
                        <Eye className="size-3.5" />
                        {toneLabel(locale, settings.publicAccent)}
                      </MicroLabel>

                      <MicroLabel light={isLight}>
                        {settingValueLabel(locale, settings.publicHeroLayout)}
                      </MicroLabel>

                      <MicroLabel light={isLight}>
                        {settingValueLabel(locale, settings.publicNavigationStyle)}
                      </MicroLabel>

                      <MicroLabel light={isLight}>
                        {settingValueLabel(locale, settings.publicServicesStyle)}
                      </MicroLabel>

                      <MicroLabel light={isLight}>
                        {settingValueLabel(locale, settings.publicButtonStyle)}
                      </MicroLabel>
                    </div>
                  </SettingRow>
                </div>
              </Card>
            </div>

            <Card light={isLight}>
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className={cn('text-[13px] font-semibold', pageText(isLight))}>
                    {locale === 'ru' ? 'Настройки применяются сразу' : 'Settings apply instantly'}
                  </div>

                  <div className={cn('mt-1 text-[11px] leading-4', mutedText(isLight))}>
                    {locale === 'ru'
                      ? 'Кабинет и публичная страница берут значения из общего контекста внешнего вида.'
                      : 'Dashboard and public page read values from Appearance Context.'}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <MicroLabel light={isLight}>
                    <MoonStar className="size-3.5" />
                    {settingValueLabel(locale, currentTheme)}
                  </MicroLabel>

                  <MicroLabel light={isLight}>
                    <MonitorSmartphone className="size-3.5" />
                    {settingValueLabel(locale, settings.mobileFontScale)}
                  </MicroLabel>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </WorkspaceShell>
  );
}