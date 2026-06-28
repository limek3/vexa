'use client';

import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { MonitorSmartphone, Moon, SunMedium } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import { useLocale } from '@/lib/locale-context';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  compact?: boolean;
  iconOnly?: boolean;
  className?: string;
  minimal?: boolean;
}

type ThemeOption = 'light' | 'dark' | 'system';

export function ThemeToggle({
  compact = false,
  iconOnly = false,
  className,
  minimal = false,
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { copy, locale } = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? ((theme || 'system') as ThemeOption) : 'system';

  const displayTheme = mounted
    ? resolvedTheme === 'light'
      ? 'light'
      : 'dark'
    : 'dark';

  const options = useMemo<
    Array<{
      value: ThemeOption;
      label: string;
      shortLabel: string;
      compactLabel: string;
      icon: ReactNode;
    }>
  >(
    () => [
      {
        value: 'light',
        label: copy.app.light,
        shortLabel: locale === 'ru' ? 'Свет' : 'Light',
        compactLabel: locale === 'ru' ? 'С' : 'L',
        icon: <SunMedium className="size-[13.5px] stroke-[1.9]" />,
      },
      {
        value: 'dark',
        label: copy.app.dark,
        shortLabel: locale === 'ru' ? 'Тёмная' : 'Dark',
        compactLabel: locale === 'ru' ? 'Т' : 'D',
        icon: <Moon className="size-[13.5px] stroke-[1.9]" />,
      },
      {
        value: 'system',
        label: locale === 'ru' ? 'Системная' : 'System',
        shortLabel: locale === 'ru' ? 'Авто' : 'Auto',
        compactLabel: locale === 'ru' ? 'А' : 'A',
        icon: <MonitorSmartphone className="size-[13.5px] stroke-[1.9]" />,
      },
    ],
    [copy.app.dark, copy.app.light, locale],
  );

  if (iconOnly) {
    const Icon = displayTheme === 'dark' ? SunMedium : Moon;

    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setTheme(displayTheme === 'dark' ? 'light' : 'dark')}
        className={cn(
          'group relative isolate size-8 shrink-0 overflow-hidden rounded-[11px] border p-0 shadow-none',
          'border-black/[0.075] bg-white/50 text-black/56 backdrop-blur-[18px]',
          'transition-[border-color,background-color,color,transform] duration-300',
          'hover:border-black/[0.14] hover:bg-white/82 hover:text-black active:scale-[0.94]',
          'dark:border-white/[0.09] dark:bg-white/[0.055] dark:text-white/58',
          'dark:hover:border-white/[0.16] dark:hover:bg-white/[0.085] dark:hover:text-white',
          className,
        )}
        aria-label={copy.app.theme}
        title={`${copy.app.theme}: ${
          displayTheme === 'dark' ? copy.app.dark : copy.app.light
        }`}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-6 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              displayTheme === 'dark'
                ? 'radial-gradient(circle, rgba(255,255,255,0.30), transparent 58%)'
                : 'radial-gradient(circle, rgba(0,0,0,0.14), transparent 58%)',
          }}
        />

        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-1 top-1 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-80 dark:via-white/24"
        />

        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-1.5 top-1.5 size-1 rounded-full bg-black/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-white/45"
        />

        <Icon className="relative z-10 size-[15px] stroke-[1.9] transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-110" />
      </Button>
    );
  }

  const itemWidth = compact ? 34 : 76;
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === currentTheme),
  );

  const rootStyle = {
    '--theme-item-width': `${itemWidth}px`,
    width: `${itemWidth * options.length + 8}px`,
  } as CSSProperties;

  const activeStyle = {
    width: `${itemWidth}px`,
    transform: `translateX(${activeIndex * itemWidth}px)`,
  } as CSSProperties;

  return (
    <div
      className={cn(
        'group relative isolate inline-flex shrink-0 overflow-hidden rounded-[15px] border p-1 backdrop-blur-[22px]',
        'border-black/[0.075] bg-white/45 text-black',
        'shadow-[0_10px_34px_rgba(15,15,15,0.045)]',
        'dark:border-white/[0.09] dark:bg-white/[0.045] dark:text-white',
        'dark:shadow-[0_16px_46px_rgba(0,0,0,0.28)]',
        minimal ? 'h-8' : 'h-9',
        className,
      )}
      style={rootStyle}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-10 opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-100"
        style={{
          background:
            'conic-gradient(from 120deg, transparent, rgba(255,255,255,0.72), transparent, rgba(0,0,0,0.10), transparent)',
        }}
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-2 top-1 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent opacity-70 dark:via-white/22"
      />

      <span
        aria-hidden="true"
        className={cn(
          'absolute bottom-1 left-1 top-1 rounded-[12px]',
          'border border-black/[0.06] bg-[#ffffff]/95',
          'shadow-[0_10px_26px_rgba(15,15,15,0.10)]',
          'transition-transform duration-500',
          'dark:border-white/[0.10] dark:bg-white/[0.115]',
          'dark:shadow-[0_14px_34px_rgba(0,0,0,0.34)]',
        )}
        style={activeStyle}
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-1 left-1 top-1 overflow-hidden rounded-[12px] transition-transform duration-500"
        style={activeStyle}
      >
        <span className="absolute inset-y-0 -left-8 w-8 rotate-12 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-0 transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100 dark:via-white/18" />
      </span>

      <div className="relative z-10 grid flex-1 grid-cols-3">
        {options.map((option) => {
          const active = currentTheme === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              className={cn(
                'relative inline-flex h-full items-center justify-center overflow-hidden rounded-[12px] outline-none',
                'transition-[color,opacity,transform] duration-300 active:scale-[0.94]',
                active
                  ? 'text-black dark:text-white'
                  : 'text-black/38 hover:text-black/74 dark:text-white/38 dark:hover:text-white/76',
              )}
              style={{ width: `${itemWidth}px` }}
              aria-pressed={active}
              aria-label={option.label}
              title={option.label}
            >
              <span className="relative inline-flex items-center justify-center gap-1.5">
                <span
                  className={cn(
                    'transition-transform duration-300',
                    active ? 'scale-110' : 'scale-100',
                  )}
                >
                  {option.icon}
                </span>

                {!compact ? (
                  <span
                    className={cn(
                      'text-[10.5px] leading-none tracking-[-0.015em]',
                      active ? 'font-semibold' : 'font-medium',
                    )}
                  >
                    {option.shortLabel}
                  </span>
                ) : (
                  <span className="sr-only">{option.compactLabel}</span>
                )}

                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute -right-1 -top-1 size-1 rounded-full bg-black/45 shadow-[0_0_10px_rgba(0,0,0,0.35)] dark:bg-white/65 dark:shadow-[0_0_10px_rgba(255,255,255,0.32)]"
                  />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}