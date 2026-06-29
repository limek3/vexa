'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Check,
  ChevronDown,
  Languages,
  MonitorSmartphone,
  Moon,
  SunMedium,
} from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import { useLocale } from '@/lib/locale-context';
import { cn } from '@/lib/utils';

interface InterfaceControlProps {
  compact?: boolean;
  iconOnly?: boolean;
  className?: string;
  minimal?: boolean;
  align?: 'left' | 'right';
}

type ThemeOption = 'light' | 'dark' | 'system';
type LocaleOption = 'ru' | 'en';

function getCopy(locale: LocaleOption) {
  const ru = locale === 'ru';

  return {
    ariaLabel: ru ? 'Настройки интерфейса' : 'Interface settings',
    title: ru ? 'Интерфейс' : 'Interface',
    subtitle: ru
      ? 'Тема и язык приложения'
      : 'Theme and app language',

    theme: ru ? 'Тема' : 'Theme',
    language: ru ? 'Язык' : 'Language',

    light: ru ? 'Светлая' : 'Light',
    dark: ru ? 'Тёмная' : 'Dark',
    system: ru ? 'Авто' : 'Auto',

    lightHint: ru ? 'Светлый интерфейс' : 'Light interface',
    darkHint: ru ? 'Тёмный интерфейс' : 'Dark interface',
    systemHint: ru
      ? 'Как в системе устройства'
      : 'Follow device settings',

    russian: ru ? 'Русский' : 'Russian',
    english: ru ? 'Английский' : 'English',

    russianHint: ru ? 'Интерфейс на русском' : 'Russian interface',
    englishHint: ru ? 'English interface' : 'Интерфейс на английском',
  };
}

function ThemeIcon({ value }: { value: ThemeOption }) {
  if (value === 'light') {
    return <SunMedium className="size-[14px] stroke-[1.9]" />;
  }

  if (value === 'dark') {
    return <Moon className="size-[14px] stroke-[1.9]" />;
  }

  return <MonitorSmartphone className="size-[14px] stroke-[1.9]" />;
}

function OptionRow({
  active,
  icon,
  label,
  hint,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group flex w-full items-center justify-between gap-3 rounded-[11px] px-2.5 py-2.5 text-left outline-none',
        'transition-[background-color,color,transform] duration-200 active:scale-[0.99]',
        active
          ? 'bg-black/[0.055] text-black dark:bg-white/[0.075] dark:text-white'
          : 'text-black/66 hover:bg-black/[0.035] hover:text-black dark:text-white/62 dark:hover:bg-white/[0.055] dark:hover:text-white',
      )}
      role="menuitemradio"
      aria-checked={active}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-[10px] border',
            active
              ? 'border-black/[0.08] bg-[var(--cb-surface)] text-black dark:border-white/[0.10] dark:bg-white/[0.09] dark:text-white'
              : 'border-black/[0.06] bg-black/[0.025] text-black/48 group-hover:text-black/70 dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-white/46 dark:group-hover:text-white/72',
          )}
        >
          {icon}
        </span>

        <span className="min-w-0">
          <span className="block truncate text-[12px] font-semibold leading-none tracking-[-0.02em]">
            {label}
          </span>
          <span className="mt-1.5 block truncate text-[10.5px] font-medium leading-none text-black/38 dark:text-white/34">
            {hint}
          </span>
        </span>
      </span>

      <span
        className={cn(
          'flex size-5 shrink-0 items-center justify-center rounded-full',
          active
            ? 'text-black dark:text-white'
            : 'text-transparent',
        )}
      >
        <Check className="size-[14px] stroke-[2.2]" />
      </span>
    </button>
  );
}

export function InterfaceControl({
  compact = false,
  iconOnly = false,
  className,
  minimal = false,
  align = 'right',
}: InterfaceControlProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { locale, setLocale } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const safeLocale = locale === 'en' ? 'en' : 'ru';
  const copy = useMemo(() => getCopy(safeLocale), [safeLocale]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const currentTheme = mounted ? ((theme || 'system') as ThemeOption) : 'system';

  const displayTheme = mounted
    ? resolvedTheme === 'light'
      ? 'light'
      : 'dark'
    : 'dark';

  const themeOptions = useMemo(
    () => [
      {
        value: 'light' as const,
        label: copy.light,
        hint: copy.lightHint,
      },
      {
        value: 'dark' as const,
        label: copy.dark,
        hint: copy.darkHint,
      },
      {
        value: 'system' as const,
        label: copy.system,
        hint: copy.systemHint,
      },
    ],
    [copy],
  );

  const languageOptions = useMemo(
    () => [
      {
        value: 'ru' as const,
        label: copy.russian,
        hint: copy.russianHint,
        badge: 'RU',
      },
      {
        value: 'en' as const,
        label: copy.english,
        hint: copy.englishHint,
        badge: 'EN',
      },
    ],
    [copy],
  );

  const activeTheme =
    themeOptions.find((option) => option.value === currentTheme) ??
    themeOptions[2];

  const activeLanguage =
    languageOptions.find((option) => option.value === safeLocale) ??
    languageOptions[0];

  if (iconOnly) {
    const Icon = displayTheme === 'dark' ? Moon : SunMedium;

    return (
      <div ref={rootRef} className={cn('relative inline-flex shrink-0', className)}>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setOpen((value) => !value)}
          className={cn(
            'relative size-8 shrink-0 rounded-[10px] border p-0 shadow-none outline-none',
            'border-black/[0.08] bg-[#ffffff]/70 text-black/58 backdrop-blur-[18px]',
            'transition-[border-color,background-color,color,transform] duration-200',
            'hover:border-black/[0.14] hover:bg-white/85 hover:text-black active:scale-[0.96]',
            'dark:border-white/[0.09] dark:bg-white/[0.055] dark:text-white/58',
            'dark:hover:border-white/[0.15] dark:hover:bg-white/[0.08] dark:hover:text-white',
            open &&
              'border-black/[0.16] bg-white text-black dark:border-white/[0.18] dark:bg-white/[0.10] dark:text-white',
          )}
          aria-label={copy.ariaLabel}
          aria-haspopup="menu"
          aria-expanded={open}
          title={copy.ariaLabel}
          data-clickbook-interface-trigger="true"
        >
          <Icon className="size-[15px] stroke-[1.9]" />
        </Button>

        {open ? (
          <InterfacePanel
            align={align}
            copy={copy}
            currentTheme={currentTheme}
            safeLocale={safeLocale}
            themeOptions={themeOptions}
            languageOptions={languageOptions}
            setTheme={(value) => setTheme(value)}
            setLocale={(value) => setLocale(value)}
            close={() => setOpen(false)}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div ref={rootRef} className={cn('relative inline-flex shrink-0', className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'group inline-flex shrink-0 items-center justify-between rounded-[11px] border outline-none',
          'border-black/[0.08] bg-[#ffffff]/72 text-black backdrop-blur-[18px]',
          'shadow-[0_10px_34px_rgba(15,15,15,0.035)]',
          'transition-[border-color,background-color,box-shadow,transform] duration-200',
          'hover:border-black/[0.13] hover:bg-white/88',
          'active:scale-[0.985]',
          'dark:border-white/[0.09] dark:bg-white/[0.055] dark:text-white',
          'dark:shadow-[0_12px_38px_rgba(0,0,0,0.24)]',
          'dark:hover:border-white/[0.15] dark:hover:bg-white/[0.075]',
          open &&
            'border-black/[0.16] bg-white shadow-[0_16px_44px_rgba(15,15,15,0.075)] dark:border-white/[0.18] dark:bg-white/[0.09] dark:shadow-[0_18px_54px_rgba(0,0,0,0.40)]',
          minimal ? 'h-8' : 'h-9',
          compact ? 'gap-1.5 px-2.5' : 'min-w-[132px] gap-2.5 px-3',
        )}
        aria-label={copy.ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        title={copy.ariaLabel}
        data-clickbook-interface-trigger="true"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-[7px] bg-black/[0.035] text-black/58 dark:bg-white/[0.055] dark:text-white/62">
            <ThemeIcon value={currentTheme} />
          </span>

          {!compact ? (
            <span className="truncate text-[11px] font-semibold leading-none tracking-[-0.02em]">
              {activeLanguage.badge} · {activeTheme.label}
            </span>
          ) : (
            <span className="text-[10.5px] font-semibold leading-none tracking-[0.08em]">
              {activeLanguage.badge}
            </span>
          )}
        </span>

        <ChevronDown
          className={cn(
            'size-[13px] shrink-0 text-black/34 transition-transform duration-200 dark:text-white/36',
            open && 'rotate-180 text-black/62 dark:text-white/62',
          )}
        />
      </button>

      {open ? (
        <InterfacePanel
          align={align}
          copy={copy}
          currentTheme={currentTheme}
          safeLocale={safeLocale}
          themeOptions={themeOptions}
          languageOptions={languageOptions}
          setTheme={(value) => setTheme(value)}
          setLocale={(value) => setLocale(value)}
          close={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}

function InterfacePanel({
  align,
  copy,
  currentTheme,
  safeLocale,
  themeOptions,
  languageOptions,
  setTheme,
  setLocale,
  close,
}: {
  align: 'left' | 'right';
  copy: ReturnType<typeof getCopy>;
  currentTheme: ThemeOption;
  safeLocale: LocaleOption;
  themeOptions: Array<{
    value: ThemeOption;
    label: string;
    hint: string;
  }>;
  languageOptions: Array<{
    value: LocaleOption;
    label: string;
    hint: string;
    badge: string;
  }>;
  setTheme: (value: ThemeOption) => void;
  setLocale: (value: LocaleOption) => void;
  close: () => void;
}) {
  return (
    <div
      className={cn(
        'absolute top-[calc(100%+8px)] z-[100] w-[286px] overflow-hidden rounded-[16px] border p-2 backdrop-blur-[24px]',
        'border-black/[0.09] bg-[#ffffff]/88 text-black shadow-[0_24px_80px_rgba(15,15,15,0.13)]',
        'dark:border-white/[0.10] dark:bg-[#141414]/88 dark:text-white dark:shadow-[0_28px_90px_rgba(0,0,0,0.58)]',
        align === 'right' ? 'right-0' : 'left-0',
      )}
      role="menu"
      data-clickbook-interface-panel="true"
    >
      <div className="px-2.5 pb-2 pt-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold leading-none tracking-[-0.035em]">
              {copy.title}
            </p>
            <p className="mt-1.5 text-[10.5px] font-medium leading-none text-black/40 dark:text-white/36">
              {copy.subtitle}
            </p>
          </div>

          <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] border border-black/[0.07] bg-black/[0.025] text-black/54 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/56">
            <Languages className="size-[14px] stroke-[1.9]" />
          </div>
        </div>
      </div>

      <div className="my-1 h-px bg-black/[0.07] dark:bg-white/[0.08]" />

      <div className="px-1.5 py-1">
        <p className="px-1 pb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-black/32 dark:text-white/30">
          {copy.theme}
        </p>

        <div className="grid gap-0.5">
          {themeOptions.map((option) => (
            <OptionRow
              key={option.value}
              active={currentTheme === option.value}
              icon={<ThemeIcon value={option.value} />}
              label={option.label}
              hint={option.hint}
              onClick={() => {
                setTheme(option.value);
                close();
              }}
            />
          ))}
        </div>
      </div>

      <div className="my-1 h-px bg-black/[0.07] dark:bg-white/[0.08]" />

      <div className="px-1.5 py-1">
        <p className="px-1 pb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-black/32 dark:text-white/30">
          {copy.language}
        </p>

        <div className="grid gap-0.5">
          {languageOptions.map((option) => (
            <OptionRow
              key={option.value}
              active={safeLocale === option.value}
              icon={
                <span className="text-[10px] font-bold leading-none tracking-[0.08em]">
                  {option.badge}
                </span>
              }
              label={option.label}
              hint={option.hint}
              onClick={() => {
                setLocale(option.value);
                close();
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}