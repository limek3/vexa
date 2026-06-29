'use client';

import { Languages } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useLocale } from '@/lib/locale-context';
import { cn } from '@/lib/utils';

interface LanguageToggleProps {
  compact?: boolean;
  iconOnly?: boolean;
  className?: string;
  minimal?: boolean;
}

export function LanguageToggle({
  compact = false,
  iconOnly = false,
  className,
  minimal = false,
}: LanguageToggleProps) {
  const { locale, setLocale } = useLocale();

  if (iconOnly) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setLocale(locale === 'ru' ? 'en' : 'ru')}
        className={cn(
          'group relative isolate size-8 shrink-0 overflow-hidden rounded-[11px] border p-0 shadow-none',
          'border-black/[0.075] bg-white/50 text-black/56 backdrop-blur-[18px]',
          'transition-[border-color,background-color,color,transform] duration-300',
          'hover:border-black/[0.14] hover:bg-white/82 hover:text-black active:scale-[0.94]',
          'dark:border-white/[0.09] dark:bg-white/[0.055] dark:text-white/58',
          'dark:hover:border-white/[0.16] dark:hover:bg-white/[0.085] dark:hover:text-white',
          className,
        )}
        aria-label={locale === 'ru' ? 'Язык' : 'Language'}
        title={locale === 'ru' ? 'Переключить на английский' : 'Switch to Russian'}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-6 opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(circle, rgba(255,255,255,0.38), transparent 58%)',
          }}
        />

        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-1 top-1 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-80 dark:via-white/24"
        />

        <Languages className="relative z-10 size-[15px] stroke-[1.9] transition-transform duration-300 group-hover:scale-110" />
      </Button>
    );
  }

  const isRu = locale === 'ru';
  const itemWidth = compact ? 38 : 54;

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
      style={{
        width: `${itemWidth * 2 + 8}px`,
      }}
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
        style={{
          width: `${itemWidth}px`,
          transform: isRu ? 'translateX(0px)' : `translateX(${itemWidth}px)`,
        }}
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-1 left-1 top-1 overflow-hidden rounded-[12px] transition-transform duration-500"
        style={{
          width: `${itemWidth}px`,
          transform: isRu ? 'translateX(0px)' : `translateX(${itemWidth}px)`,
        }}
      >
        <span className="absolute inset-y-0 -left-8 w-8 rotate-12 bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-0 transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100 dark:via-white/18" />
      </span>

      <div className="relative z-10 grid flex-1 grid-cols-2">
        <button
          type="button"
          onClick={() => setLocale('ru')}
          className={cn(
            'relative inline-flex h-full items-center justify-center rounded-[12px] outline-none',
            'transition-[color,transform] duration-300 active:scale-[0.94]',
            isRu
              ? 'text-black dark:text-white'
              : 'text-black/38 hover:text-black/74 dark:text-white/38 dark:hover:text-white/76',
          )}
          style={{ width: `${itemWidth}px` }}
          aria-pressed={isRu}
          aria-label="Русский"
          title="Русский"
        >
          <span
            className={cn(
              'relative text-[10.5px] font-semibold leading-none tracking-[0.08em]',
              isRu && 'scale-110',
            )}
          >
            {compact ? 'RU' : 'RU'}

            {isRu ? (
              <span
                aria-hidden="true"
                className="absolute -right-1.5 -top-1 size-1 rounded-full bg-black/45 shadow-[0_0_10px_rgba(0,0,0,0.35)] dark:bg-white/65 dark:shadow-[0_0_10px_rgba(255,255,255,0.32)]"
              />
            ) : null}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setLocale('en')}
          className={cn(
            'relative inline-flex h-full items-center justify-center rounded-[12px] outline-none',
            'transition-[color,transform] duration-300 active:scale-[0.94]',
            !isRu
              ? 'text-black dark:text-white'
              : 'text-black/38 hover:text-black/74 dark:text-white/38 dark:hover:text-white/76',
          )}
          style={{ width: `${itemWidth}px` }}
          aria-pressed={!isRu}
          aria-label="English"
          title="English"
        >
          <span
            className={cn(
              'relative text-[10.5px] font-semibold leading-none tracking-[0.08em]',
              !isRu && 'scale-110',
            )}
          >
            {compact ? 'EN' : 'EN'}

            {!isRu ? (
              <span
                aria-hidden="true"
                className="absolute -right-1.5 -top-1 size-1 rounded-full bg-black/45 shadow-[0_0_10px_rgba(0,0,0,0.35)] dark:bg-white/65 dark:shadow-[0_0_10px_rgba(255,255,255,0.32)]"
              />
            ) : null}
          </span>
        </button>
      </div>
    </div>
  );
}