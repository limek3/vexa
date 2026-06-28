'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  Clock3,
  Globe2,
  Image as ImageIcon,
  Languages,
  LayoutDashboard,
  MapPin,
  MessageCircle,
  MonitorSmartphone,
  Moon,
  Phone,
  Sparkles,
  Star,
  SunMedium,
  X,
} from 'lucide-react';

import { BookingForm } from '@/components/booking/booking-form';
import { BrandLogo } from '@/components/brand/brand-logo';
import { MasterAvatar } from '@/components/profile/master-avatar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useApp } from '@/lib/app-context';
import {
  applyAppearanceToElement,
  normalizeAppearanceSettings,
  type AppearanceSettings,
} from '@/lib/appearance';
import { useAppearance } from '@/lib/appearance-context';
import { accentPalette } from '@/lib/appearance-palette';
import { getMaxHref, getPhoneHref, getTelegramHref } from '@/lib/contact-links';
import { getMasterAddress, getMasterLocationMode, getMasterRouteUrl } from '@/lib/location-links';
import { useLocale } from '@/lib/locale-context';
import { getDashboardDemoStorageKey } from '@/lib/dashboard-demo';
import {
  DEMO_PROFILE_STORAGE_KEY,
  DEMO_PROFILE_UPDATED_EVENT,
  getDashboardDemoAppearance,
  getDemoBookings,
} from '@/lib/demo-data';
import { buildWorkspaceDataset } from '@/lib/master-workspace';
import type { MasterProfile, WorkGalleryItem } from '@/lib/types';
import type { BookedSlot, BookingAvailabilityDay, BookingServiceDetails } from '@/lib/availability';
import { cn } from '@/lib/utils';

type ThemeMode = 'light' | 'dark';
type ThemeOption = 'light' | 'dark' | 'system';

type PublicProfilePayload = {
  profile: MasterProfile;
  appearance?: Partial<AppearanceSettings> | null;
  availability?: BookingAvailabilityDay[] | null;
  services?: BookingServiceDetails[] | null;
  bookedSlots?: BookedSlot[] | null;
};

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
    ? 'border-[#e6e2da] bg-white shadow-[0_12px_30px_rgba(17,17,17,0.035)]'
    : 'border-white/[0.08] bg-[#141414]';
}

function insetTone(light: boolean) {
  return light
    ? 'border-[#e6e2da] bg-black/[0.015]'
    : 'border-white/[0.07] bg-white/[0.026]';
}

function softBg(light: boolean) {
  return light ? 'bg-black/[0.025]' : 'bg-white/[0.035]';
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

function quietButtonClass(light: boolean) {
  return cn(buttonBase(light), 'cb-public-secondary-action');
}

function primaryButtonClass(light: boolean) {
  return cn(buttonBase(light, true), 'cb-public-primary-action');
}

function PublicPageGlobalStyles({ light }: { light: boolean }) {
  return (
    <style jsx global>{`
      .cb-public-master-page .cb-public-header-shell {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        z-index: 40 !important;
        border-bottom: 1px solid
          ${light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'} !important;
        background: ${light ? 'rgba(244,244,242,0.94)' : 'rgba(9,9,9,0.94)'} !important;
        backdrop-filter: blur(18px) saturate(160%) !important;
        -webkit-backdrop-filter: blur(18px) saturate(160%) !important;
      }

      .cb-public-master-page .cb-public-header-inner {
        width: 100%;
        max-width: 1520px;
        margin: 0 auto;
        padding-left: 16px;
        padding-right: 16px;
      }

      @media (min-width: 768px) {
        .cb-public-master-page .cb-public-header-inner {
          padding-left: 28px;
          padding-right: 28px;
        }
      }

      .cb-public-master-page .cb-public-header-shell header {
        position: static !important;
        inset: auto !important;
        width: 100% !important;
        max-width: none !important;
        border: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }

      .cb-public-master-page .cb-public-header-shell header > div {
        width: 100% !important;
        max-width: none !important;
        margin-left: 0 !important;
        margin-right: 0 !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
      }

      .cb-public-master-page [data-radix-popper-content-wrapper] {
        z-index: 80 !important;
      }

      .cb-public-master-page[data-public-button='pill'] .cb-public-primary-action,
      .cb-public-master-page[data-public-button='pill'] .cb-public-secondary-action {
        border-radius: 999px !important;
      }

      .cb-public-master-page[data-public-button='rounded'] .cb-public-primary-action,
      .cb-public-master-page[data-public-button='rounded'] .cb-public-secondary-action {
        border-radius: 16px !important;
      }

      .cb-public-master-page[data-public-button='contrast'] .cb-public-primary-action {
        border-color: ${light ? 'rgba(0,0,0,0.24)' : 'rgba(255,255,255,0.26)'} !important;
        background: ${light ? '#111111' : '#f4f0e7'} !important;
        color: ${light ? '#ffffff' : '#080808'} !important;
      }

      .cb-public-master-page[data-public-surface='glass'] [class*='rounded-[11px]'][class*='border'],
      .cb-public-master-page[data-public-surface='glass'] [class*='rounded-[10px]'][class*='border'] {
        background-color: ${light ? 'rgba(251,251,250,0.72)' : 'rgba(16,16,16,0.72)'} !important;
        backdrop-filter: blur(18px) saturate(138%) !important;
        -webkit-backdrop-filter: blur(18px) saturate(138%) !important;
      }

      .cb-public-master-page[data-public-surface='contrast'] [class*='rounded-[11px]'][class*='border'] {
        background-color: ${light ? '#ffffff' : '#0d0d0d'} !important;
      }

      .cb-public-master-page[data-public-card='compact'] [class*='rounded-[11px]'][class*='border'],
      .cb-public-master-page[data-public-card='compact'] [class*='rounded-[10px]'][class*='border'] {
        border-radius: 9px !important;
      }

      .cb-public-master-page[data-public-card='editorial'] [class*='rounded-[11px]'][class*='border'] {
        border-radius: 18px !important;
      }

      .cb-public-master-page[data-public-section='minimal'] .cb-public-section-frame {
        border-color: transparent !important;
        background: transparent !important;
      }

      .cb-public-master-page[data-public-section='dividers'] .cb-public-section-frame {
        border-left: 0 !important;
        border-right: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
      }

      .cb-public-master-page[data-public-booking='minimal'] .cb-public-booking-box {
        background: transparent !important;
      }

      .cb-public-master-page[data-public-booking='step'] .cb-public-booking-box {
        border-color: color-mix(in srgb, var(--cb-public-accent) 28%, ${light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}) !important;
      }

      .cb-public-master-page[data-public-booking='step'] .cb-public-booking-box::before {
        content: '';
        display: block;
        height: 3px;
        border-radius: 999px;
        margin-bottom: 12px;
        background: var(--cb-public-gradient);
      }

      .cb-public-master-page[data-public-motion='off'] *,
      .cb-public-master-page[data-public-motion='off'] *::before,
      .cb-public-master-page[data-public-motion='off'] *::after {
        scroll-behavior: auto !important;
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.001ms !important;
      }

      .cb-public-master-page [data-radix-collection-item],
      .cb-public-master-page button,
      .cb-public-master-page a {
        -webkit-tap-highlight-color: transparent;
      }

      .cb-public-master-page img {
        user-select: none;
      }
    `}</style>
  );
}

function HeaderLayer({
  children,
  light,
}: {
  children: ReactNode;
  light: boolean;
}) {
  return (
    <div className={cn('cb-public-header-shell', pageText(light))}>
      <div className="cb-public-header-inner">{children}</div>
    </div>
  );
}


type PublicGlassHeaderItem = {
  id: string;
  label: string;
  icon?: ReactNode;
};

function PublicGlassHeader({
  light,
  locale,
  navItems,
  selectedTheme,
  onThemeChange,
  onLocaleChange,
  onNavigateSection,
  onBook,
  metaLabel,
  labels,
}: {
  light: boolean;
  locale: 'ru' | 'en';
  navItems: PublicGlassHeaderItem[];
  selectedTheme?: string;
  onThemeChange: (theme: ThemeOption) => void;
  onLocaleChange: (locale: 'ru' | 'en') => void;
  onNavigateSection: (id: string) => void;
  onBook?: () => void;
  metaLabel?: string;
  labels: {
    product: string;
    dashboard: string;
    publicPage: string;
    profile: string;
    book: string;
    language: string;
    theme: string;
    light: string;
    dark: string;
    auto: string;
  };
}) {
  const currentTheme = (selectedTheme || 'system') as ThemeOption;
  const nextTheme: ThemeOption = currentTheme === 'dark' ? 'light' : currentTheme === 'light' ? 'system' : 'dark';
  const nextLocale = locale === 'ru' ? 'en' : 'ru';
  const ThemeIcon = currentTheme === 'dark' ? Moon : currentTheme === 'light' ? SunMedium : MonitorSmartphone;
  const themeLabel = currentTheme === 'dark' ? labels.dark : currentTheme === 'light' ? labels.light : labels.auto;
  const visibleNavItems = [{ id: 'top', label: labels.profile }, ...navItems].slice(0, 5);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <div className="mx-auto w-[min(calc(100vw-32px),1520px)]">
        <div
          className={cn(
            'relative flex h-[72px] items-center justify-between gap-4 overflow-hidden rounded-[30px] border px-5 shadow-[0_22px_80px_-54px_rgba(15,23,42,0.62)] backdrop-blur-2xl transition-colors before:pointer-events-none before:absolute before:inset-x-10 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:to-transparent',
            light
              ? 'border-black/[0.08] bg-[#fbfbfa]/[0.56] text-black before:via-white/90'
              : 'border-white/[0.10] bg-[#07080d]/[0.56] text-white before:via-white/16',
          )}
        >
          <Link
            href="/dashboard"
            prefetch={false}
            scroll={false}
            className="relative z-10 flex min-w-0 shrink-0 items-center gap-3"
            aria-label={labels.product}
          >
            <BrandLogo className="w-[126px]" />
            {metaLabel ? (
              <span
                className={cn(
                  'hidden max-w-[210px] truncate text-[11px] font-medium lg:block',
                  light ? 'text-black/42' : 'text-white/36',
                )}
              >
                {metaLabel}
              </span>
            ) : null}
          </Link>

          <nav
            className={cn(
              'relative z-10 hidden h-11 items-center gap-1 rounded-full border p-1 xl:flex',
              light
                ? 'border-black/[0.06] bg-black/[0.03]'
                : 'border-white/[0.08] bg-white/[0.04]',
            )}
            aria-label={labels.publicPage}
          >
            {visibleNavItems.map((item, index) => {
              const isPrimary = index === 0;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigateSection(item.id)}
                  className={cn(
                    'group/nav relative inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-semibold tracking-[-0.02em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2',
                    light
                      ? 'text-black/52 hover:bg-white/[0.7] hover:text-black focus-visible:ring-black/10'
                      : 'text-white/52 hover:bg-white/[0.075] hover:text-white focus-visible:ring-white/12',
                    isPrimary && (light ? 'text-black' : 'text-white'),
                  )}
                >
                  {item.icon ? <span className="opacity-70">{item.icon}</span> : null}
                  <span>{item.label}</span>
                  {isPrimary ? <ChevronDown className="h-3.5 w-3.5 opacity-60" /> : null}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-x-4 -bottom-[3px] h-[2px] origin-center rounded-full opacity-0 transition-all duration-300',
                      light ? 'bg-black' : 'bg-white',
                      isPrimary ? 'scale-x-100 opacity-100' : 'scale-x-0 group-hover/nav:scale-x-100 group-hover/nav:opacity-60',
                    )}
                  />
                </button>
              );
            })}
          </nav>

          <div className="relative z-10 flex shrink-0 items-center gap-2">
            <Link
              href="/dashboard"
              prefetch={false}
              scroll={false}
              className={cn(
                'hidden h-10 items-center gap-2 rounded-full border px-3 text-[12px] font-semibold transition-all 2xl:inline-flex',
                light
                  ? 'border-black/[0.065] bg-black/[0.025] text-black/58 hover:border-black/[0.12] hover:bg-white/[0.75] hover:text-black'
                  : 'border-white/[0.085] bg-white/[0.04] text-white/58 hover:bg-white/[0.075] hover:text-white',
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              {labels.dashboard}
            </Link>

            <div
              className={cn(
                'hidden items-center gap-1 rounded-full border p-1 2xl:flex',
                light ? 'border-black/[0.065] bg-black/[0.025]' : 'border-white/[0.085] bg-white/[0.04]',
              )}
            >
              <button
                type="button"
                onClick={() => onLocaleChange(nextLocale)}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[11.5px] font-semibold transition',
                  light ? 'text-black/52 hover:bg-white/[0.8] hover:text-black' : 'text-white/52 hover:bg-white/[0.075] hover:text-white',
                )}
                aria-label={labels.language}
              >
                <Languages className="h-3.5 w-3.5" />
                {locale.toUpperCase()}
              </button>

              <button
                type="button"
                onClick={() => onThemeChange(nextTheme)}
                className={cn(
                  'inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[11.5px] font-semibold transition',
                  light ? 'text-black/52 hover:bg-white/[0.8] hover:text-black' : 'text-white/52 hover:bg-white/[0.075] hover:text-white',
                )}
                aria-label={labels.theme}
              >
                <ThemeIcon className="h-3.5 w-3.5" />
                {themeLabel}
              </button>
            </div>

            <button
              type="button"
              onClick={onBook}
              className={cn(
                'inline-flex h-10 items-center gap-2 rounded-full px-4 text-[12.5px] font-semibold shadow-[0_16px_38px_-28px_rgba(0,0,0,0.85)] transition-all hover:-translate-y-0.5 active:scale-[0.98]',
                light ? 'bg-black text-white hover:bg-[#111827]' : 'bg-white text-black hover:bg-white/90',
              )}
            >
              <CalendarClock className="h-4 w-4" />
              {labels.book}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function Dot({
  color,
  className,
}: {
  color: string;
  className?: string;
}) {
  return (
    <span
      className={cn('inline-flex size-1.5 shrink-0 rounded-full', className)}
      style={{ background: color }}
    />
  );
}

function MiniPill({
  children,
  light,
  active,
  className,
}: {
  children: ReactNode;
  light: boolean;
  accentColor?: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-[9px] border px-2.5 text-[10.5px] font-medium leading-none',
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

function SectionHeader({
  label,
  title,
  description,
  action,
  light,
}: {
  label?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  light: boolean;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4 px-0.5">
      <div className="min-w-0">
        {label ? (
          <div
            className={cn(
              'mb-1 text-[10px] font-medium uppercase tracking-[0.16em]',
              faintText(light),
            )}
          >
            {label}
          </div>
        ) : null}

        <h2
          className={cn(
            'text-[20px] font-semibold leading-none tracking-[-0.055em] md:text-[26px]',
            pageText(light),
          )}
        >
          {title}
        </h2>

        {description ? (
          <p
            className={cn(
              'mt-2 max-w-[720px] text-[12px] leading-5 md:text-[13px]',
              mutedText(light),
            )}
          >
            {description}
          </p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function SectionCard({
  id,
  label,
  title,
  description,
  action,
  light,
  children,
}: {
  id?: string;
  label?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  light: boolean;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-[108px]">
      <SectionHeader
        label={label}
        title={title}
        description={description}
        action={action}
        light={light}
      />

      <div
        className={cn(
          'cb-public-section-frame overflow-hidden rounded-[11px] border',
          cardTone(light),
        )}
      >
        {children}
      </div>
    </section>
  );
}

function ProfilePassport({
  name,
  profession,
  city,
  avatar,
  rating,
  reviewCount,
  light,
  accentColor,
  labels,
}: {
  name: string;
  profession: string;
  city: string;
  avatar?: string;
  rating: number;
  reviewCount: number;
  light: boolean;
  accentColor: string;
  labels: {
    verified: string;
    profileLabel: string;
    statRating: string;
  };
}) {
  return (
    <div className={cn('rounded-[11px] border p-4', cardTone(light))}>
      <div className="flex items-center justify-between gap-3">
        <MiniPill light={light} active accentColor={accentColor}>
          <BadgeCheck className="size-3.5" />
          {labels.verified}
        </MiniPill>

        <MiniPill light={light}>
          <MapPin className="size-3.5" />
          {city}
        </MiniPill>
      </div>

      <div className="mt-5 flex items-start gap-4">
        <MasterAvatar
          name={name}
          avatar={avatar}
          className="h-24 w-24 rounded-[10px]"
        />

        <div className="min-w-0 flex-1">
          <div
            className={cn(
              'text-[10px] font-medium uppercase tracking-[0.16em]',
              faintText(light),
            )}
          >
            {labels.profileLabel}
          </div>

          <div
            className={cn(
              'mt-2 truncate text-[20px] font-semibold tracking-[-0.055em]',
              pageText(light),
            )}
          >
            {name}
          </div>

          <div
            className={cn('mt-1 line-clamp-2 text-[12px] leading-5', mutedText(light))}
          >
            {profession}
          </div>
        </div>
      </div>

      <div className={cn('mt-5 rounded-[10px] border p-3.5', insetTone(light))}>
        <div
          className={cn(
            'text-[10px] font-medium uppercase tracking-[0.16em]',
            faintText(light),
          )}
        >
          {labels.statRating}
        </div>

        <div className="mt-2 flex items-end justify-between gap-3">
          <div
            className={cn(
              'text-[34px] font-semibold leading-none tracking-[-0.08em]',
              pageText(light),
            )}
          >
            {rating.toFixed(1)}
          </div>

          <div className={cn('pb-1 text-[12px]', mutedText(light))}>
            {reviewCount}
          </div>
        </div>
      </div>
    </div>
  );
}

function FactItem({
  icon,
  label,
  value,
  light,
  accentColor,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  light: boolean;
  accentColor: string;
}) {
  return (
    <div className={cn('rounded-[10px] border p-3.5', insetTone(light))}>
      <div
        className={cn(
          'flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.14em]',
          faintText(light),
        )}
      >
        <span style={{ color: accentColor }}>{icon}</span>
        <span className="truncate">{label}</span>
      </div>

      <div
        className={cn(
          'mt-2 line-clamp-2 text-[13px] font-semibold leading-5',
          pageText(light),
        )}
      >
        {value}
      </div>
    </div>
  );
}

function NavButton({
  icon,
  label,
  onClick,
  light,
  accentColor,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  light: boolean;
  accentColor: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-8 items-center justify-between rounded-[9px] px-3 text-[12px] font-medium transition active:scale-[0.985]',
        light
          ? 'text-black/52 hover:bg-black/[0.045] hover:text-black'
          : 'text-white/44 hover:bg-white/[0.06] hover:text-white',
      )}
    >
      <span className="flex items-center gap-2">
        <span style={{ color: accentColor }}>{icon}</span>
        {label}
      </span>

      <ChevronRight className="size-3.5 opacity-35" />
    </button>
  );
}

function ServiceLine({
  title,
  index,
  active,
  onClick,
  light,
  accentColor,
  selectedText,
  chooseText,
}: {
  title: string;
  index: number;
  active?: boolean;
  onClick: () => void;
  light: boolean;
  accentColor: string;
  selectedText: string;
  chooseText: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group grid min-h-[74px] w-full grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 rounded-[10px] border p-3 text-left transition active:scale-[0.99]',
        active
          ? light
            ? 'border-black/[0.14] bg-white'
            : 'border-white/[0.16] bg-white/[0.055]'
          : light
            ? 'border-black/[0.07] bg-black/[0.025] hover:border-black/[0.12] hover:bg-white'
            : 'border-white/[0.07] bg-white/[0.035] hover:border-white/[0.13] hover:bg-white/[0.055]',
      )}
      style={active ? { borderColor: accentColor } : undefined}
    >
      <span
        className={cn(
          'inline-flex size-10 items-center justify-center rounded-[9px] border text-[12px] font-semibold',
          active
            ? 'border-transparent text-white'
            : light
              ? 'border-black/[0.07] bg-white text-black/50'
              : 'border-white/[0.07] bg-black/25 text-white/45',
        )}
        style={active ? { background: accentColor } : undefined}
      >
        {String(index + 1).padStart(2, '0')}
      </span>

      <span className="min-w-0">
        <span
          className={cn(
            'block truncate text-[14px] font-semibold tracking-[-0.02em]',
            pageText(light),
          )}
        >
          {title}
        </span>

        <span className={cn('mt-1 block text-[11px]', mutedText(light))}>
          {active ? selectedText : chooseText}
        </span>
      </span>

      <span
        className={cn(
          'inline-flex size-9 items-center justify-center rounded-[9px] border transition',
          light
            ? 'border-black/[0.07] bg-white text-black/34'
            : 'border-white/[0.07] bg-white/[0.035] text-white/35',
        )}
      >
        <ChevronRight className="size-4 transition group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}

function WorkCard({
  item,
  index,
  onClick,
  light,
  galleryStyle = 'grid',
}: {
  item: WorkGalleryItem;
  index: number;
  onClick: () => void;
  light: boolean;
  galleryStyle?: AppearanceSettings['publicGalleryStyle'];
}) {
  const isLarge = galleryStyle === 'editorial' && (index === 0 || index === 5);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group overflow-hidden rounded-[10px] border text-left transition active:scale-[0.99]',
        isLarge ? 'md:col-span-2' : '',
        light
          ? 'border-black/[0.08] bg-white'
          : 'border-white/[0.08] bg-white/[0.035]',
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden',
          isLarge ? 'aspect-[16/10]' : 'aspect-[4/5]',
        )}
      >
        <img
          src={item.image}
          alt={item.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]"
        />

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3">
          <div className="line-clamp-1 text-[13px] font-semibold text-white">
            {item.title}
          </div>
        </div>
      </div>
    </button>
  );
}

function ReviewItem({
  author,
  service,
  text,
  rating,
  light,
  accentColor,
}: {
  author: string;
  service?: string;
  text: string;
  rating: number;
  light: boolean;
  accentColor: string;
}) {
  return (
    <article className={cn('rounded-[10px] border p-4', insetTone(light))}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={cn('truncate text-[13px] font-semibold', pageText(light))}>
            {author}
          </div>

          {service ? (
            <div className={cn('mt-0.5 truncate text-[11px]', mutedText(light))}>
              {service}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }, (_, index) => {
            const active = index < Math.round(rating);

            return (
              <Star
                key={index}
                className={cn(
                  'size-3.5',
                  active ? 'fill-current' : light ? 'text-black/15' : 'text-white/15',
                )}
                style={active ? { color: accentColor } : undefined}
              />
            );
          })}
        </div>
      </div>

      <p className={cn('mt-3 line-clamp-5 text-[13px] leading-6', mutedText(light))}>
        {text}
      </p>
    </article>
  );
}

function ContactItem({
  label,
  value,
  href,
  icon,
  hidden,
  hiddenLabel,
  light,
  accentColor,
}: {
  label: string;
  value: string;
  href?: string;
  icon: ReactNode;
  hidden?: boolean;
  hiddenLabel: string;
  light: boolean;
  accentColor: string;
}) {
  const content = (
    <div
      className={cn(
        'group relative flex min-h-[70px] items-center gap-3 rounded-[10px] border p-3.5 transition',
        light
          ? 'border-black/[0.07] bg-black/[0.025] hover:border-black/[0.12] hover:bg-white'
          : 'border-white/[0.07] bg-white/[0.035] hover:border-white/[0.13] hover:bg-white/[0.055]',
      )}
    >
      <span
        className={cn(
          'inline-flex size-10 shrink-0 items-center justify-center rounded-[9px] border',
          light
            ? 'border-black/[0.07] bg-white'
            : 'border-white/[0.07] bg-black/25',
        )}
        style={{ color: accentColor }}
      >
        {icon}
      </span>

      <div className="min-w-0 flex-1">
        <div
          className={cn(
            'text-[10px] font-medium uppercase tracking-[0.14em]',
            faintText(light),
          )}
        >
          {label}
        </div>

        <div
          className={cn(
            'mt-0.5 truncate text-[13px] font-medium',
            pageText(light),
            hidden && 'select-none blur-[6px]',
          )}
        >
          {value}
        </div>
      </div>

      {hidden ? (
        <span
          className={cn(
            'pointer-events-none absolute inset-y-2 right-2 inline-flex items-center rounded-[9px] border px-2.5 text-[10px] font-medium',
            light
              ? 'border-black/[0.08] bg-white text-black/46'
              : 'border-white/[0.08] bg-black/60 text-white/42',
          )}
        >
          {hiddenLabel}
        </span>
      ) : (
        <ArrowUpRight
          className={cn(
            'size-4 shrink-0 transition',
            light ? 'text-black/30 group-hover:text-black' : 'text-white/30 group-hover:text-white',
          )}
        />
      )}
    </div>
  );

  if (!href || hidden) return content;

  const external = href.startsWith('https://') || href.startsWith('http://');

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
    >
      {content}
    </a>
  );
}

function BookingBox({
  selectedService,
  quickActions,
  labels,
  light,
  accentColor,
  onOpen,
  onReset,
}: {
  selectedService: string | null;
  quickActions: Array<{
    label: string;
    href: string;
    icon: ReactNode;
    external: boolean;
  }>;
  labels: {
    drawerTitle: string;
    bookingTitle: string;
    bookingText: string;
    selectedService: string;
    reset: string;
    openForm: string;
  };
  light: boolean;
  accentColor: string;
  onOpen: () => void;
  onReset: () => void;
}) {
  return (
    <div className={cn('cb-public-booking-box rounded-[11px] border p-4', cardTone(light))}>
      <div
        className={cn(
          'text-[10px] font-medium uppercase tracking-[0.16em]',
          faintText(light),
        )}
      >
        {labels.drawerTitle}
      </div>

      <div
        className={cn(
          'mt-2 text-[26px] font-semibold leading-[1.02] tracking-[-0.07em]',
          pageText(light),
        )}
      >
        {labels.bookingTitle}
      </div>

      <p className={cn('mt-3 text-[13px] leading-6', mutedText(light))}>
        {labels.bookingText}
      </p>

      {selectedService ? (
        <div className={cn('mt-4 rounded-[10px] border p-3.5', insetTone(light))}>
          <div
            className={cn(
              'text-[10px] font-medium uppercase tracking-[0.14em]',
              faintText(light),
            )}
          >
            {labels.selectedService}
          </div>

          <div
            className={cn(
              'mt-1 line-clamp-2 text-[13px] font-semibold leading-5',
              pageText(light),
            )}
          >
            {selectedService}
          </div>

          <button
            type="button"
            onClick={onReset}
            className={cn(
              'mt-3 text-[11px] font-medium transition hover:opacity-80',
              mutedText(light),
            )}
          >
            {labels.reset}
          </button>
        </div>
      ) : null}

      <Button
        className={cn('mt-4 min-h-[44px] w-full', primaryButtonClass(light))}
        onClick={onOpen}
      >
        {labels.openForm}
        <ChevronRight className="size-4" />
      </Button>

      {quickActions.length > 0 ? (
        <div className="mt-2 grid gap-2">
          {quickActions.map((action) => (
            <a
              key={action.label}
              href={action.href}
              target={action.external ? '_blank' : undefined}
              rel={action.external ? 'noreferrer' : undefined}
              className={cn(
                'inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-[9px] border px-3 text-[12px] font-medium transition active:scale-[0.985]',
                light
                  ? 'border-black/[0.08] bg-white text-black/58 hover:border-black/[0.14] hover:bg-black/[0.035] hover:text-black'
                  : 'border-white/[0.08] bg-white/[0.04] text-white/55 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white',
              )}
            >
              <span style={{ color: accentColor }}>{action.icon}</span>
              {action.label}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function LoadingPage({
  light,
  label,
}: {
  light: boolean;
  label: string;
}) {
  return (
    <main className="mx-auto w-full max-w-[1520px] px-4 pb-20 pt-[96px] md:px-7 md:pt-[104px]">
      <div className={cn('rounded-[11px] border p-5 md:p-6', cardTone(light))}>
        <div className="animate-pulse">
          <div className={cn('h-6 w-48 rounded-[9px]', softBg(light))} />

          <div className="mt-5 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
            <div className={cn('h-[320px] rounded-[10px]', softBg(light))} />
            <div className={cn('h-[320px] rounded-[10px]', softBg(light))} />
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className={cn('h-24 rounded-[10px]', softBg(light))} />
            <div className={cn('h-24 rounded-[10px]', softBg(light))} />
            <div className={cn('h-24 rounded-[10px]', softBg(light))} />
          </div>
        </div>

        <div className={cn('mt-5 text-[13px]', mutedText(light))}>
          {label}
        </div>
      </div>
    </main>
  );
}

function EmptyPage({
  light,
  title,
  backLabel,
}: {
  light: boolean;
  title: string;
  backLabel: string;
}) {
  return (
    <main className="mx-auto w-full max-w-[1520px] px-4 pb-20 pt-[96px] md:px-7 md:pt-[104px]">
      <div className={cn('rounded-[11px] border p-8 text-center', cardTone(light))}>
        <div
          className={cn('text-[22px] font-semibold tracking-[-0.055em]', pageText(light))}
        >
          {title}
        </div>

        <div className="mt-5 flex justify-center">
          <Button asChild variant="outline" className={quietButtonClass(light)}>
            <Link href="/">{backLabel}</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

export function PublicMasterPage({
  slug,
  isDemo = false,
}: {
  slug: string;
  isDemo?: boolean;
}) {
  const { hasHydrated, getProfileBySlug, getDemoProfileBySlug, bookings, workspaceData } = useApp();
  const { locale, setLocale } = useLocale();
  const { settings: localSettings } = useAppearance();
  const { resolvedTheme, theme: selectedTheme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [remoteProfile, setRemoteProfile] = useState<MasterProfile | null>(null);
  const [remoteAppearance, setRemoteAppearance] = useState<AppearanceSettings | null>(null);
  const [remoteAvailability, setRemoteAvailability] = useState<BookingAvailabilityDay[]>([]);
  const [remoteServiceDetails, setRemoteServiceDetails] = useState<BookingServiceDetails[]>([]);
  const [remoteBookedSlots, setRemoteBookedSlots] = useState<BookedSlot[]>([]);
  const [demoAppearance, setDemoAppearance] = useState<AppearanceSettings | null>(null);
  const [demoProfileRevision, setDemoProfileRevision] = useState(0);
  const [isProfileLoading, setIsProfileLoading] = useState(!isDemo);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedWork, setSelectedWork] = useState<WorkGalleryItem | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [worksExpanded, setWorksExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSelectedService(null);
    setSelectedWork(null);
    setWorksExpanded(false);
    setBookingOpen(false);
  }, [slug]);

  useEffect(() => {
    if (isDemo) {
      setRemoteProfile(null);
      setRemoteAppearance(null);
      setRemoteAvailability([]);
      setRemoteServiceDetails([]);
      setRemoteBookedSlots([]);
      setIsProfileLoading(false);
      return;
    }

    let active = true;
    const controller = new AbortController();

    setIsProfileLoading(true);
    setRemoteProfile(null);
    setRemoteAppearance(null);
    setRemoteAvailability([]);
    setRemoteServiceDetails([]);
    setRemoteBookedSlots([]);

    fetch(`/api/public/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as PublicProfilePayload;
      })
      .then((payload) => {
        if (!active) return;

        setRemoteProfile(payload?.profile ?? null);
        setRemoteAppearance(
          payload?.appearance ? normalizeAppearanceSettings(payload.appearance) : null,
        );
        setRemoteAvailability(Array.isArray(payload?.availability) ? payload.availability : []);
        setRemoteServiceDetails(Array.isArray(payload?.services) ? payload.services : []);
        setRemoteBookedSlots(Array.isArray(payload?.bookedSlots) ? payload.bookedSlots : []);
      })
      .catch(() => {
        if (!active) return;
        setRemoteProfile(null);
        setRemoteAppearance(null);
        setRemoteAvailability([]);
        setRemoteServiceDetails([]);
        setRemoteBookedSlots([]);
      })
      .finally(() => {
        if (!active) return;
        setIsProfileLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [isDemo, slug]);

  useEffect(() => {
    if (!isDemo) {
      setDemoAppearance(null);
      return;
    }

    const storageKey = getDashboardDemoStorageKey('appearance');

    const readAppearance = () => {
      try {
        const raw =
          typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;

        setDemoAppearance(
          normalizeAppearanceSettings(
            raw
              ? (JSON.parse(raw) as Partial<AppearanceSettings>)
              : getDashboardDemoAppearance(),
          ),
        );
      } catch {
        setDemoAppearance(getDashboardDemoAppearance());
      }
    };

    readAppearance();

    if (typeof window === 'undefined') return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey) readAppearance();
    };

    const handleAppearanceEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ storageKey?: string }>).detail;
      if (!detail?.storageKey || detail.storageKey === storageKey) readAppearance();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('clickbook:appearance-updated', handleAppearanceEvent);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('clickbook:appearance-updated', handleAppearanceEvent);
    };
  }, [isDemo]);

  useEffect(() => {
    if (!isDemo || typeof window === 'undefined') return;

    const bump = () => setDemoProfileRevision((current) => current + 1);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === DEMO_PROFILE_STORAGE_KEY) bump();
    };

    window.addEventListener(DEMO_PROFILE_UPDATED_EVENT, bump);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(DEMO_PROFILE_UPDATED_EVENT, bump);
      window.removeEventListener('storage', handleStorage);
    };
  }, [isDemo]);

  useEffect(() => {
    if (!bookingOpen || typeof document === 'undefined') return;

    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = original;
    };
  }, [bookingOpen]);

  useEffect(() => {
    if (!bookingOpen || typeof window === 'undefined') return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setBookingOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);

    return () => window.removeEventListener('keydown', onKeyDown);
  }, [bookingOpen]);

  const theme: ThemeMode = mounted && resolvedTheme === 'light' ? 'light' : 'dark';
  const isLight = theme === 'light';

  const labels =
    locale === 'ru'
      ? {
          notFound: 'Профиль не найден',
          back: 'Вернуться на главную',
          loading: 'Загружаем страницу…',
          demoBadge: 'Демо',
          verified: 'Проверен',
          profileLabel: 'Профиль мастера',
          bookNow: 'Записаться',
          openForm: 'Открыть запись',
          servicesTitle: 'Выберите услугу',
          servicesLabel: 'Услуги',
          servicesHint:
            'Нажмите на услугу — форма записи откроется уже с выбранным вариантом.',
          servicesCount: 'услуг',
          reviewsTitle: 'Отзывы',
          reviewsLabel: 'Клиенты',
          reviewsHint: 'Коротко о том, почему мастеру доверяют.',
          contactsTitle: 'Контакты',
          contactsLabel: 'Связь',
          contactsHint: 'Контакты могут быть скрыты до подтверждения записи.',
          faqTitle: 'Вопросы',
          faqLabel: 'FAQ',
          worksTitle: 'Работы',
          worksLabel: 'Портфолио',
          worksHint:
            'Подборка работ без лишней витрины. Откройте фото, чтобы посмотреть крупнее.',
          hiddenContact: 'После записи',
          call: 'Позвонить',
          max: 'ВК',
          telegram: 'Телеграм',
          online: 'Онлайн',
          responseFallback: 'Обычно отвечает в течение 10 минут',
          selectedService: 'Выбрано',
          reset: 'Сбросить',
          workDialogHint: 'Откройте запись, если хотите похожий результат.',
          stickyCta: 'Записаться',
          stickyContact: 'Связаться',
          jumpBooking: 'Запись',
          jumpServices: 'Услуги',
          jumpWorks: 'Работы',
          jumpReviews: 'Отзывы',
          jumpContacts: 'Контакты',
          statRating: 'Рейтинг',
          statReply: 'Ответ',
          statFormat: 'Формат',
          statExperience: 'Опыт',
          phoneLabel: 'Телефон',
          addressLabel: 'Адрес',
          route: 'Маршрут',
          routeHint: 'После подтверждения пришлём адрес и маршрут в Яндекс.Картах.',
          drawerTitle: 'Онлайн-запись',
          close: 'Закрыть',
          emptyBio:
            'Аккуратная работа, понятная запись и подтверждение без лишней переписки.',
          chooseService: 'Выбрать и записаться',
          selectedInList: 'Услуга выбрана',
          showMoreWorks: 'Показать ещё',
          hideWorks: 'Скрыть',
          heroTitle: 'Профиль для быстрой записи без хаоса в переписке',
          heroText:
            'Посмотрите услуги, работы и отзывы. Когда будете готовы — выберите услугу и отправьте заявку за пару шагов.',
          bookingTitle: 'Быстрая заявка',
          bookingText: 'Можно выбрать услугу заранее или открыть форму сразу.',
          menuProduct: 'КликБук',
          menuDashboard: 'Кабинет',
          menuPublicPage: 'Публичная страница',
          menuProfile: 'Профиль',
          menuBook: 'Записаться',
          menuLanguage: 'Переключить язык',
          menuTheme: 'Переключить тему',
          menuLight: 'Светлая',
          menuDark: 'Тёмная',
          menuAuto: 'Авто',
        }
      : {
          notFound: 'Profile not found',
          back: 'Back to home',
          loading: 'Loading page…',
          demoBadge: 'Demo',
          verified: 'Verified',
          profileLabel: 'Specialist profile',
          bookNow: 'Book now',
          openForm: 'Open booking',
          servicesTitle: 'Choose a service',
          servicesLabel: 'Services',
          servicesHint: 'Tap a service — the booking form opens with that option selected.',
          servicesCount: 'services',
          reviewsTitle: 'Reviews',
          reviewsLabel: 'Clients',
          reviewsHint: 'A quick look at why clients trust this master.',
          contactsTitle: 'Contacts',
          contactsLabel: 'Contact',
          contactsHint: 'Some contacts may stay hidden until booking is confirmed.',
          faqTitle: 'Questions',
          faqLabel: 'FAQ',
          worksTitle: 'Works',
          worksLabel: 'Portfolio',
          worksHint: 'A clean selection of works. Open a photo to view it larger.',
          hiddenContact: 'After booking',
          call: 'Call',
          max: 'ВК',
          telegram: 'Telegram',
          online: 'Online',
          responseFallback: 'Usually replies within 10 minutes',
          selectedService: 'Selected',
          reset: 'Reset',
          workDialogHint: 'Open booking if you want a similar result.',
          stickyCta: 'Book',
          stickyContact: 'Contact',
          jumpBooking: 'Booking',
          jumpServices: 'Services',
          jumpWorks: 'Works',
          jumpReviews: 'Reviews',
          jumpContacts: 'Contacts',
          statRating: 'Rating',
          statReply: 'Reply',
          statFormat: 'Format',
          statExperience: 'Experience',
          phoneLabel: 'Phone',
          addressLabel: 'Address',
          route: 'Route',
          routeHint: 'After confirmation, we will send the address and a Yandex Maps route.',
          drawerTitle: 'Online booking',
          close: 'Close',
          emptyBio:
            'Careful work, clear booking and confirmation without unnecessary messages.',
          chooseService: 'Choose and book',
          selectedInList: 'Service selected',
          showMoreWorks: 'Show more',
          hideWorks: 'Hide',
          heroTitle: 'A clean profile for booking without message chaos',
          heroText:
            'Explore services, works and reviews. When ready, choose a service and send a request in a few steps.',
          bookingTitle: 'Quick request',
          bookingText: 'Choose a service first or open the form right away.',
          menuProduct: 'ClickBook',
          menuDashboard: 'Workspace',
          menuPublicPage: 'Public page',
          menuProfile: 'Profile',
          menuBook: 'Book now',
          menuLanguage: 'Switch language',
          menuTheme: 'Switch theme',
          menuLight: 'Light',
          menuDark: 'Dark',
          menuAuto: 'Auto',
        };

  const settings = useMemo(() => {
    if (isDemo) return demoAppearance ?? getDashboardDemoAppearance();
    return remoteAppearance ?? localSettings;
  }, [demoAppearance, isDemo, localSettings, remoteAppearance]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    applyAppearanceToElement(document.documentElement, settings);
  }, [settings]);

  const accent =
    accentPalette[settings.publicAccent] ??
    accentPalette[settings.accentTone] ??
    Object.values(accentPalette)[0];

  const accentColor = accent.solid;

  const publicAccentStyle = {
    ['--accent-hue' as string]: accent.hue,
    ['--accent-sat' as string]: accent.sat,
    ['--accent-solid' as string]: accent.solid,
    ['--accent-hover' as string]: accent.solid,
    ['--accent-gradient' as string]: accent.gradient,
    ['--accent-soft' as string]: accent.soft,
    ['--primary' as string]: accent.solid,
    ['--primary-hover' as string]: accent.solid,
    ['--gradient-primary' as string]: accent.gradient,
    ['--ring' as string]: `${accent.solid}2e`,
    ['--cb-public-accent' as string]: accent.solid,
    ['--cb-public-gradient' as string]: accent.gradient,
  } as CSSProperties;

  const publicDataAttrs = {
    'data-public-cover': settings.publicCover,
    'data-public-button': settings.publicButtonStyle,
    'data-public-card': settings.publicCardStyle,
    'data-public-services': settings.publicServicesStyle,
    'data-public-booking': settings.publicBookingStyle,
    'data-public-hero': settings.publicHeroLayout,
    'data-public-surface': settings.publicSurface,
    'data-public-section': settings.publicSectionStyle,
    'data-public-gallery': settings.publicGalleryStyle,
    'data-public-navigation': settings.publicNavigationStyle,
    'data-public-stats': settings.publicStatsStyle,
    'data-public-cta': settings.publicCtaMode,
    'data-public-motion': settings.motion,
  };

  const publicNavigationStyle = settings.publicNavigationStyle ?? 'side';
  const publicStatsStyle = settings.publicStatsStyle ?? 'cards';
  const publicCtaMode = settings.publicCtaMode ?? 'sticky';
  const heroCentered = settings.publicHeroLayout === 'centered';
  const heroCompact = settings.publicHeroLayout === 'compact';
  const navigationSide = publicNavigationStyle === 'side' && !heroCentered;
  const navigationTop = publicNavigationStyle === 'top' && !heroCentered;

  const publicPageMaxClass = 'max-w-[1520px]';

  const publicShellGridClass = heroCentered
    ? 'lg:grid-cols-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)]'
    : navigationSide
      ? heroCompact
        ? 'lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_280px]'
        : 'lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[330px_minmax(0,1fr)_320px]'
      : heroCompact
        ? 'lg:grid-cols-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_280px]'
        : 'lg:grid-cols-[minmax(0,1fr)] xl:grid-cols-[minmax(0,1fr)_320px]';

  const publicAsideClass = navigationSide
    ? 'space-y-5 lg:sticky lg:top-[104px] lg:self-start'
    : 'hidden';

  const publicBookingAsideClass =
    heroCentered || publicCtaMode === 'quiet' ? 'hidden' : 'hidden xl:block';

  const servicesGridClass = cn(
    'grid p-4',
    settings.publicServicesStyle === 'stacked'
      ? 'gap-2'
      : settings.publicServicesStyle === 'chips'
        ? 'gap-2 sm:grid-cols-2 lg:grid-cols-3'
        : 'gap-2.5 md:grid-cols-2',
  );

  const galleryGridClass = cn(
    'grid grid-cols-2',
    settings.publicGalleryStyle === 'compact'
      ? 'gap-2 md:grid-cols-5'
      : settings.publicGalleryStyle === 'editorial'
        ? 'gap-3 md:grid-cols-4'
        : 'gap-3 md:grid-cols-4',
  );

  const fallbackProfile = !isDemo ? getProfileBySlug(slug) : null;

  void demoProfileRevision;

  const fallbackDataset = useMemo(() => {
    if (isDemo || !fallbackProfile) return null;
    const base = buildWorkspaceDataset(fallbackProfile, bookings, locale);

    return {
      availability: Array.isArray(workspaceData.availability) && workspaceData.availability.length > 0
        ? workspaceData.availability as BookingAvailabilityDay[]
        : [],
      services: Array.isArray(workspaceData.services) && workspaceData.services.length > 0
        ? workspaceData.services as BookingServiceDetails[]
        : base.services,
      bookedSlots: bookings.map((booking) => ({
        id: booking.id,
        date: booking.date,
        time: booking.time,
        service: booking.service,
        status: booking.status,
      })),
    };
  }, [bookings, fallbackProfile, isDemo, locale, workspaceData.availability, workspaceData.services]);

  const profile = isDemo ? getDemoProfileBySlug(slug) : fallbackProfile ?? remoteProfile;

  const services = profile?.services ?? [];
  const reviews = profile?.reviews ?? [];
  const works = profile?.workGallery ?? [];

  const name = profile?.name?.trim() || (locale === 'ru' ? 'Мастер' : 'Specialist');
  const profession =
    profile?.profession?.trim() || (locale === 'ru' ? 'Специалист' : 'Specialist');
  const city = profile?.city?.trim() || labels.online;
  const locationMode = getMasterLocationMode(profile);
  const addressLabel = locationMode === 'address' ? getMasterAddress(profile) : labels.online;
  const routeUrl = locationMode === 'address' ? getMasterRouteUrl(profile) : null;
  const bio = profile?.bio?.trim() || labels.emptyBio;
  const priceHint =
    profile?.priceHint?.trim() ||
    (locale === 'ru' ? 'Стоимость по запросу' : 'Price on request');
  const experienceLabel = profile?.experienceLabel?.trim() || labels.online;
  const rating = profile?.rating ?? 4.9;
  const reviewCount = profile?.reviewCount ?? reviews.length;
  const responseLabel = profile?.responseTime || labels.responseFallback;

  const scrollToSection = useCallback((id: string) => {
    if (typeof document === 'undefined') return;

    const section = document.getElementById(id);
    if (!section) return;

    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const openBooking = useCallback((service?: string) => {
    if (service) setSelectedService(service);
    setBookingOpen(true);
  }, []);

  const quickActions = useMemo(() => {
    if (!profile) return [];

    return [
      profile.phone && !profile.hidePhone
        ? {
            label: labels.call,
            href: getPhoneHref(profile.phone),
            icon: <Phone className="size-4" />,
            external: false,
          }
        : null,
      routeUrl
        ? {
            label: labels.route,
            href: routeUrl,
            icon: <MapPin className="size-4" />,
            external: true,
          }
        : null,
      profile.whatsapp && !profile.hideWhatsapp
        ? {
            label: labels.max,
            href: getMaxHref(
              profile.whatsapp,
              locale === 'ru'
                ? `Здравствуйте! Хочу уточнить запись к ${name}.`
                : `Hello! I would like to clarify a booking with ${name}.`,
            ),
            icon: <MessageCircle className="size-4" />,
            external: true,
          }
        : null,
      profile.telegram && !profile.hideTelegram
        ? {
            label: labels.telegram,
            href: getTelegramHref(profile.telegram),
            icon: <Globe2 className="size-4" />,
            external: true,
          }
        : null,
    ].filter(
      (
        item,
      ): item is {
        label: string;
        href: string;
        icon: ReactNode;
        external: boolean;
      } => Boolean(item?.href),
    );
  }, [profile, labels.call, labels.route, labels.max, labels.telegram, locale, name, routeUrl]);

  const contactItems = useMemo(() => {
    if (!profile) return [];

    return [
      routeUrl && addressLabel !== labels.online
        ? {
            key: 'address',
            label: labels.addressLabel,
            value: addressLabel,
            href: routeUrl,
            hidden: false,
            icon: <MapPin className="size-4" />,
          }
        : null,
      profile.phone
        ? {
            key: 'phone',
            label: labels.phoneLabel,
            value: profile.phone,
            href: profile.hidePhone ? undefined : getPhoneHref(profile.phone),
            hidden: Boolean(profile.hidePhone),
            icon: <Phone className="size-4" />,
          }
        : null,
      profile.whatsapp
        ? {
            key: 'max',
            label: labels.max,
            value: profile.whatsapp,
            href: profile.hideWhatsapp
              ? undefined
              : getMaxHref(
                  profile.whatsapp,
                  locale === 'ru'
                    ? `Здравствуйте! Хочу уточнить запись к ${name}.`
                    : `Hello! I would like to clarify a booking with ${name}.`,
                ),
            hidden: Boolean(profile.hideWhatsapp),
            icon: <MessageCircle className="size-4" />,
          }
        : null,
      profile.telegram
        ? {
            key: 'telegram',
            label: labels.telegram,
            value: profile.telegram,
            href: profile.hideTelegram ? undefined : getTelegramHref(profile.telegram),
            hidden: Boolean(profile.hideTelegram),
            icon: <Globe2 className="size-4" />,
          }
        : null,
    ].filter(Boolean) as Array<{
      key: string;
      label: string;
      value: string;
      href?: string;
      hidden: boolean;
      icon: ReactNode;
    }>;
  }, [profile, labels.phoneLabel, labels.addressLabel, labels.max, labels.telegram, locale, name, addressLabel, routeUrl]);

  const jumpLinks = useMemo(
    () =>
      [
        {
          id: 'services-section',
          label: labels.jumpServices,
          icon: <Sparkles className="size-3.5" />,
          visible: services.length > 0,
        },
        {
          id: 'works-section',
          label: labels.jumpWorks,
          icon: <ImageIcon className="size-3.5" />,
          visible: works.length > 0,
        },
        {
          id: 'reviews-section',
          label: labels.jumpReviews,
          icon: <Star className="size-3.5" />,
          visible: reviews.length > 0,
        },
        {
          id: 'contacts-section',
          label: labels.jumpContacts,
          icon: <Phone className="size-3.5" />,
          visible: contactItems.length > 0,
        },
      ].filter((item) => item.visible),
    [
      labels.jumpServices,
      labels.jumpWorks,
      labels.jumpReviews,
      labels.jumpContacts,
      services.length,
      works.length,
      reviews.length,
      contactItems.length,
    ],
  );

  const mobileActions = jumpLinks.map((item) => ({
    href: `#${item.id}`,
    label: item.label,
    icon: item.icon,
  }));


  const publicHeader = (
    <PublicGlassHeader
      light={isLight}
      locale={locale}
      navItems={jumpLinks}
      selectedTheme={selectedTheme}
      onThemeChange={setTheme}
      onLocaleChange={setLocale}
      onNavigateSection={(id) => {
        if (id === 'top') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
        scrollToSection(id);
      }}
      onBook={() => openBooking()}
      metaLabel={`${profession} · ${city}`}
      labels={{
        product: labels.menuProduct,
        dashboard: labels.menuDashboard,
        publicPage: labels.menuPublicPage,
        profile: labels.menuProfile,
        book: labels.menuBook,
        language: labels.menuLanguage,
        theme: labels.menuTheme,
        light: labels.menuLight,
        dark: labels.menuDark,
        auto: labels.menuAuto,
      }}
    />
  );

  const facts = [
    {
      icon: <Star className="size-3.5" />,
      label: labels.statRating,
      value: `${rating.toFixed(1)} · ${reviewCount}`,
    },
    {
      icon: <Clock3 className="size-3.5" />,
      label: labels.statReply,
      value: responseLabel,
    },
    {
      icon: <BadgeCheck className="size-3.5" />,
      label: labels.statFormat,
      value: addressLabel,
    },
    {
      icon: <Sparkles className="size-3.5" />,
      label: labels.statExperience,
      value: experienceLabel,
    },
  ];

  const faqItems = [
    {
      id: 'faq-1',
      q:
        locale === 'ru'
          ? 'Как быстро приходит подтверждение?'
          : 'How quickly does confirmation arrive?',
      a:
        locale === 'ru'
          ? 'Заявка сразу отправляется мастеру. Обычно подтверждение приходит в ближайшее время.'
          : 'The request is sent to the master immediately. Confirmation usually arrives shortly after.',
    },
    {
      id: 'faq-2',
      q: locale === 'ru' ? 'Можно ли указать пожелания?' : 'Can I leave preferences?',
      a:
        locale === 'ru'
          ? 'Да. В форме можно указать удобное время и добавить комментарий.'
          : 'Yes. You can choose a convenient time and add a comment in the form.',
    },
    {
      id: 'faq-3',
      q: locale === 'ru' ? 'Можно ли перенести запись?' : 'Can I reschedule later?',
      a:
        locale === 'ru'
          ? 'Да. После подтверждения можно согласовать другое время напрямую.'
          : 'Yes. After confirmation, you can agree on another time directly.',
    },
  ];

  const visibleWorks = worksExpanded ? works : works.slice(0, 8);
  const hasHiddenWorks = works.length > 8;

  const demoBookings = useMemo(
    () => (isDemo ? getDemoBookings(slug, locale) : []),
    [isDemo, locale, slug],
  );

  const demoDataset = useMemo(
    () => (isDemo && profile ? buildWorkspaceDataset(profile, demoBookings, locale) : null),
    [demoBookings, isDemo, locale, profile],
  );

  const bookingAvailability = isDemo
    ? demoDataset?.availability ?? []
    : (fallbackDataset?.availability?.length ?? 0) > 0
      ? fallbackDataset?.availability ?? []
      : remoteAvailability;
  const bookingServiceDetails = isDemo
    ? demoDataset?.services ?? []
    : (fallbackDataset?.services?.length ?? 0) > 0
      ? fallbackDataset?.services ?? []
      : remoteServiceDetails;
  const bookingBookedSlots = isDemo
    ? demoBookings.map((booking) => ({
        id: booking.id,
        date: booking.date,
        time: booking.time,
        service: booking.service,
        status: booking.status,
      }))
    : (fallbackDataset?.bookedSlots?.length ?? 0) > 0
      ? fallbackDataset?.bookedSlots ?? []
      : remoteBookedSlots;

  const bookingProfile = useMemo<MasterProfile | null>(() => {
    if (!profile) return null;
    if (!selectedService) return profile;

    return {
      ...profile,
      services: [selectedService, ...services.filter((service) => service !== selectedService)],
    };
  }, [profile, selectedService, services]);

  const shouldWaitForClientState = !mounted || (isDemo && !hasHydrated);

  if (shouldWaitForClientState) {
    return (
      <div
        className={cn(
          'cb-public-master-page min-h-screen',
          pageBg(isLight),
          pageText(isLight),
        )}
        style={publicAccentStyle}
        {...publicDataAttrs}
      >
        <PublicPageGlobalStyles light={isLight} />

        {publicHeader}

        <LoadingPage light={isLight} label={labels.loading} />
      </div>
    );
  }

  if (!isDemo && !profile && (!hasHydrated || isProfileLoading)) {
    return (
      <div
        className={cn(
          'cb-public-master-page min-h-screen',
          pageBg(isLight),
          pageText(isLight),
        )}
        style={publicAccentStyle}
        {...publicDataAttrs}
      >
        <PublicPageGlobalStyles light={isLight} />

        {publicHeader}

        <LoadingPage light={isLight} label={labels.loading} />
      </div>
    );
  }

  if (!profile || !bookingProfile) {
    return (
      <div
        className={cn(
          'cb-public-master-page min-h-screen',
          pageBg(isLight),
          pageText(isLight),
        )}
        style={publicAccentStyle}
        {...publicDataAttrs}
      >
        <PublicPageGlobalStyles light={isLight} />

        {publicHeader}

        <EmptyPage light={isLight} title={labels.notFound} backLabel={labels.back} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'cb-public-master-page min-h-screen',
        pageBg(isLight),
        pageText(isLight),
      )}
      style={publicAccentStyle}
      {...publicDataAttrs}
    >
      <PublicPageGlobalStyles light={isLight} />

      {publicHeader}

      <main
        className={cn(
          'mx-auto w-full px-4 pb-24 pt-[96px] md:px-7 md:pt-[104px] lg:pb-12',
          publicPageMaxClass,
        )}
      >
        <div className={cn('grid gap-5', publicShellGridClass)}>
          <aside className={publicAsideClass}>
            <ProfilePassport
              name={name}
              profession={profession}
              city={city}
              avatar={profile.avatar}
              rating={rating}
              reviewCount={reviewCount}
              light={isLight}
              accentColor={accentColor}
              labels={{
                verified: labels.verified,
                profileLabel: labels.profileLabel,
                statRating: labels.statRating,
              }}
            />

            <div className={cn('hidden rounded-[11px] border p-3 lg:block', cardTone(isLight))}>
              <div className="grid gap-1">
                <NavButton
                  icon={<CalendarClock className="size-3.5" />}
                  label={labels.jumpBooking}
                  onClick={() => openBooking()}
                  light={isLight}
                  accentColor={accentColor}
                />

                {jumpLinks.map((link) => (
                  <NavButton
                    key={link.id}
                    icon={link.icon}
                    label={link.label}
                    onClick={() => scrollToSection(link.id)}
                    light={isLight}
                    accentColor={accentColor}
                  />
                ))}
              </div>
            </div>
          </aside>

          <div className="min-w-0 space-y-8">
            {navigationTop ? (
              <div className={cn('rounded-[11px] border p-2', cardTone(isLight))}>
                <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-4">
                  <NavButton
                    icon={<CalendarClock className="size-3.5" />}
                    label={labels.jumpBooking}
                    onClick={() => openBooking()}
                    light={isLight}
                    accentColor={accentColor}
                  />

                  {jumpLinks.slice(0, 3).map((link) => (
                    <NavButton
                      key={link.id}
                      icon={link.icon}
                      label={link.label}
                      onClick={() => scrollToSection(link.id)}
                      light={isLight}
                      accentColor={accentColor}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            <section
              className={cn(
                'overflow-hidden rounded-[11px] border',
                cardTone(isLight),
                heroCentered && 'text-center',
              )}
            >
              <div
                className={cn('relative p-5 md:p-6', heroCompact && 'md:p-5')}
                style={
                  settings.publicCover === 'minimal'
                    ? undefined
                    : {
                        background:
                          settings.publicCover === 'portrait'
                            ? `radial-gradient(520px 260px at 88% 0%, color-mix(in srgb, ${accentColor} 18%, transparent), transparent 72%)`
                            : `radial-gradient(560px 260px at 12% 0%, color-mix(in srgb, ${accentColor} 20%, transparent), transparent 72%)`,
                      }
                }
              >
                <div
                  className={cn(
                    'flex flex-wrap items-center gap-2',
                    heroCentered && 'justify-center',
                  )}
                >
                  <MiniPill light={isLight} active accentColor={accentColor}>
                    <Dot color="currentColor" />
                    {isDemo ? labels.demoBadge : labels.verified}
                  </MiniPill>

                  <MiniPill light={isLight}>{priceHint}</MiniPill>
                  <MiniPill light={isLight}>{experienceLabel}</MiniPill>
                  <MiniPill light={isLight}>
                    <MapPin className="size-3.5" />
                    {addressLabel}
                  </MiniPill>
                </div>

                <div className={cn('mt-7 max-w-[820px]', heroCentered && 'mx-auto')}>
                  <h1
                    className={cn(
                      heroCompact
                        ? 'text-[32px] font-semibold leading-[0.98] tracking-[-0.08em] md:text-[44px] xl:text-[48px]'
                        : 'text-[38px] font-semibold leading-[0.96] tracking-[-0.085em] md:text-[56px] xl:text-[58px]',
                      pageText(isLight),
                    )}
                  >
                    {labels.heroTitle}
                  </h1>

                  <p
                    className={cn(
                      'mt-5 max-w-[720px] text-[14px] leading-7 md:text-[15px]',
                      mutedText(isLight),
                      heroCentered && 'mx-auto',
                    )}
                  >
                    {bio}
                  </p>

                  <p
                    className={cn(
                      'mt-2 max-w-[720px] text-[13px] leading-6',
                      mutedText(isLight),
                      heroCentered && 'mx-auto',
                    )}
                  >
                    {labels.heroText}
                  </p>
                </div>

                <div
                  className={cn(
                    'mt-7 flex flex-col gap-2 sm:flex-row sm:flex-wrap',
                    heroCentered && 'sm:justify-center',
                  )}
                >
                  <Button
                    className={cn('min-h-[44px] sm:min-w-[188px]', primaryButtonClass(isLight))}
                    onClick={() => openBooking()}
                  >
                    {labels.bookNow}
                    <ChevronRight className="size-4" />
                  </Button>

                  {services.length > 0 ? (
                    <Button
                      variant="outline"
                      className={cn('min-h-[44px]', quietButtonClass(isLight))}
                      onClick={() => scrollToSection('services-section')}
                    >
                      {labels.servicesTitle}
                    </Button>
                  ) : null}

                  {quickActions[0] ? (
                    <Button
                      asChild
                      variant="outline"
                      className={cn('min-h-[44px]', quietButtonClass(isLight))}
                    >
                      <a
                        href={quickActions[0].href}
                        target={quickActions[0].external ? '_blank' : undefined}
                        rel={quickActions[0].external ? 'noreferrer' : undefined}
                      >
                        {quickActions[0].icon}
                        {quickActions[0].label}
                      </a>
                    </Button>
                  ) : null}
                </div>
              </div>

              {publicStatsStyle !== 'hidden' ? (
                <div
                  className={cn(
                    'grid border-t md:grid-cols-4',
                    publicStatsStyle === 'strip' ? 'gap-0 p-2' : 'gap-2 p-3',
                    borderTone(isLight),
                    isLight ? 'bg-black/[0.015]' : 'bg-black/10',
                  )}
                >
                  {facts.map((fact) => (
                    <FactItem
                      key={fact.label}
                      icon={fact.icon}
                      label={fact.label}
                      value={fact.value}
                      light={isLight}
                      accentColor={accentColor}
                    />
                  ))}
                </div>
              ) : null}
            </section>

            {services.length > 0 ? (
              <SectionCard
                id="services-section"
                label={labels.servicesLabel}
                title={labels.servicesTitle}
                description={labels.servicesHint}
                light={isLight}
                action={
                  <MiniPill light={isLight}>
                    {services.length} {labels.servicesCount}
                  </MiniPill>
                }
              >
                <div className={servicesGridClass}>
                  {services.map((service, index) => (
                    <ServiceLine
                      key={`${service}-${index}`}
                      title={service}
                      index={index}
                      active={selectedService === service}
                      onClick={() => openBooking(service)}
                      light={isLight}
                      accentColor={accentColor}
                      selectedText={labels.selectedInList}
                      chooseText={labels.chooseService}
                    />
                  ))}
                </div>
              </SectionCard>
            ) : null}

            {works.length > 0 ? (
              <SectionCard
                id="works-section"
                label={labels.worksLabel}
                title={labels.worksTitle}
                description={labels.worksHint}
                light={isLight}
                action={<MiniPill light={isLight}>{works.length}</MiniPill>}
              >
                <div className="p-4">
                  <div className={galleryGridClass}>
                    {visibleWorks.map((work, index) => (
                      <WorkCard
                        key={work.id}
                        item={work}
                        index={index}
                        onClick={() => setSelectedWork(work)}
                        light={isLight}
                        galleryStyle={settings.publicGalleryStyle}
                      />
                    ))}
                  </div>

                  {hasHiddenWorks ? (
                    <div className="mt-4 flex justify-center">
                      <Button
                        variant="outline"
                        className={quietButtonClass(isLight)}
                        onClick={() => setWorksExpanded((current) => !current)}
                      >
                        {worksExpanded ? labels.hideWorks : labels.showMoreWorks}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </SectionCard>
            ) : null}

            {reviews.length > 0 ? (
              <SectionCard
                id="reviews-section"
                label={labels.reviewsLabel}
                title={labels.reviewsTitle}
                description={`${rating.toFixed(1)} · ${reviewCount} · ${labels.reviewsHint}`}
                light={isLight}
                action={<MiniPill light={isLight}>{reviews.length}</MiniPill>}
              >
                <div className="grid gap-3 p-4 md:grid-cols-2">
                  {reviews.map((review) => (
                    <ReviewItem
                      key={review.id}
                      author={review.author}
                      service={review.service}
                      text={review.text}
                      rating={review.rating}
                      light={isLight}
                      accentColor={accentColor}
                    />
                  ))}
                </div>
              </SectionCard>
            ) : null}

            <div className="space-y-8">
              {contactItems.length > 0 ? (
                <SectionCard
                  id="contacts-section"
                  label={labels.contactsLabel}
                  title={labels.contactsTitle}
                  description={labels.contactsHint}
                  light={isLight}
                >
                  <div className="grid gap-2.5 p-4">
                    {contactItems.map((contact) => (
                      <ContactItem
                        key={contact.key}
                        label={contact.label}
                        value={contact.value}
                        href={contact.href}
                        hidden={contact.hidden}
                        hiddenLabel={labels.hiddenContact}
                        icon={contact.icon}
                        light={isLight}
                        accentColor={accentColor}
                      />
                    ))}
                  </div>
                </SectionCard>
              ) : null}

              <SectionCard
                id="faq-section"
                label={labels.faqLabel}
                title={labels.faqTitle}
                light={isLight}
              >
                <div className="p-4">
                  <Accordion type="single" collapsible>
                    {faqItems.map((item) => (
                      <AccordionItem key={item.id} value={item.id}>
                        <AccordionTrigger>{item.q}</AccordionTrigger>
                        <AccordionContent>{item.a}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </SectionCard>
            </div>
          </div>

          <aside className={publicBookingAsideClass}>
            <div className="sticky top-[104px]">
              <BookingBox
                selectedService={selectedService}
                quickActions={quickActions}
                light={isLight}
                accentColor={accentColor}
                onOpen={() => openBooking()}
                onReset={() => setSelectedService(null)}
                labels={{
                  drawerTitle: labels.drawerTitle,
                  bookingTitle: labels.bookingTitle,
                  bookingText: labels.bookingText,
                  selectedService: labels.selectedService,
                  reset: labels.reset,
                  openForm: labels.openForm,
                }}
              />
            </div>
          </aside>
        </div>
      </main>

      {publicCtaMode === 'sticky' ? (
        <div
          className={cn(
            'fixed inset-x-0 bottom-0 z-30 border-t px-3 py-2.5 backdrop-blur-xl xl:hidden',
            borderTone(isLight),
            isLight ? 'bg-[#f7f6f2]/92' : 'bg-[#080808]/92',
          )}
        >
          <div className="mx-auto flex max-w-[390px] items-center gap-2">
            <Button
              className={cn('min-h-[46px] flex-1', primaryButtonClass(isLight))}
              onClick={() => openBooking()}
            >
              {labels.stickyCta}
              <ChevronRight className="size-4" />
            </Button>

            {quickActions[0] ? (
              <a
                href={quickActions[0].href}
                target={quickActions[0].external ? '_blank' : undefined}
                rel={quickActions[0].external ? 'noreferrer' : undefined}
                className={cn(
                  'inline-flex min-h-[46px] min-w-[46px] items-center justify-center rounded-[9px] border transition active:scale-[0.985]',
                  isLight
                    ? 'border-black/[0.08] bg-white text-black/58'
                    : 'border-white/[0.08] bg-white/[0.04] text-white/60',
                )}
                aria-label={labels.stickyContact}
                style={{ color: accentColor }}
              >
                {quickActions[0].icon}
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          'fixed inset-0 z-50 transition',
          bookingOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
      >
        <button
          type="button"
          aria-label={labels.close}
          onClick={() => setBookingOpen(false)}
          className={cn(
            'absolute inset-0 bg-black/58 backdrop-blur-[10px] transition-opacity duration-300',
            bookingOpen ? 'opacity-100' : 'opacity-0',
          )}
        />

        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="booking-drawer-title"
          className={cn(
            'absolute inset-y-0 right-0 flex w-full flex-col border-l shadow-[0_28px_90px_rgba(0,0,0,0.36)]',
            'transition-[opacity,transform] duration-300 ease-out',
            'sm:max-w-[560px]',
            isLight
              ? 'border-black/[0.08] bg-[#f7f6f2]/94 text-black backdrop-blur-2xl'
              : 'border-white/[0.08] bg-[#080808]/94 text-white backdrop-blur-2xl',
            bookingOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
          )}
        >
          <div
            className={cn(
              'shrink-0 border-b px-4 pb-4 pt-[calc(env(safe-area-inset-top,0px)+16px)] md:px-5',
              borderTone(isLight),
              isLight ? 'bg-[#f7f6f2]/88' : 'bg-[#080808]/88',
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div
                  className={cn(
                    'flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em]',
                    faintText(isLight),
                  )}
                >
                  <CalendarClock className="size-3.5" style={{ color: accentColor }} />
                  {labels.drawerTitle}
                </div>

                <h2
                  id="booking-drawer-title"
                  className={cn(
                    'mt-2 line-clamp-2 text-[28px] font-semibold leading-[1.02] tracking-[-0.075em] md:text-[34px]',
                    pageText(isLight),
                  )}
                >
                  {selectedService || labels.bookNow}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setBookingOpen(false)}
                aria-label={labels.close}
                className={cn(
                  'inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] border transition active:scale-[0.985]',
                  isLight
                    ? 'border-black/[0.08] bg-white text-black/50 hover:border-black/[0.14] hover:bg-black/[0.035] hover:text-black'
                    : 'border-white/[0.08] bg-white/[0.045] text-white/45 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white',
                )}
              >
                <X className="size-4" />
              </button>
            </div>

            {selectedService ? (
              <div
                className={cn(
                  'mt-4 flex items-center justify-between gap-3 rounded-[11px] border px-3.5 py-3',
                  insetTone(isLight),
                )}
              >
                <div className="min-w-0">
                  <div
                    className={cn(
                      'text-[10px] font-semibold uppercase tracking-[0.14em]',
                      faintText(isLight),
                    )}
                  >
                    {labels.selectedService}
                  </div>

                  <div
                    className={cn(
                      'mt-1 truncate text-[13px] font-semibold',
                      pageText(isLight),
                    )}
                  >
                    {selectedService}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className={cn(
                    'h-8 shrink-0 rounded-[9px] border px-3 text-[11px] font-medium transition active:scale-[0.985]',
                    isLight
                      ? 'border-black/[0.08] bg-white text-black/48 hover:border-black/[0.14] hover:text-black'
                      : 'border-white/[0.08] bg-black/30 text-white/45 hover:border-white/[0.14] hover:text-white',
                  )}
                >
                  {labels.reset}
                </button>
              </div>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-5">
            <div
              className={cn(
                'rounded-[13px] border p-3 shadow-[0_18px_60px_rgba(0,0,0,0.08)]',
                isLight
                  ? 'border-black/[0.08] bg-[#ffffff]/86 backdrop-blur-xl'
                  : 'border-white/[0.08] bg-[#141414]/82 backdrop-blur-xl',
              )}
            >
              <BookingForm
                key={selectedService ?? 'default'}
                profile={bookingProfile}
                selectedService={selectedService ?? undefined}
                embedded
                appearanceSettings={settings}
                availabilityDays={bookingAvailability}
                serviceDetails={bookingServiceDetails}
                bookedSlots={bookingBookedSlots}
              />
            </div>
          </div>
        </section>
      </div>

      <Dialog open={Boolean(selectedWork)} onOpenChange={(open) => !open && setSelectedWork(null)}>
        <DialogContent
          className={cn(
            'w-[calc(100vw-32px)] !max-w-[760px] overflow-hidden rounded-[14px] border p-0 shadow-[0_24px_90px_rgba(0,0,0,0.22)]',
            '[&>button]:right-5 [&>button]:top-5 [&>button]:z-30',
            isLight
              ? 'border-black/[0.08] bg-[#f7f6f2]'
              : 'border-white/[0.08] bg-[#080808]',
          )}
        >
          {selectedWork ? (
            <>
              <div
                className={cn(
                  'aspect-[4/5] w-full overflow-hidden sm:aspect-[16/10]',
                  isLight ? 'bg-white' : 'bg-[#141414]',
                )}
              >
                <img
                  src={selectedWork.image}
                  alt={selectedWork.title}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="space-y-4 p-4 md:p-5">
                <DialogHeader className="text-left">
                  <DialogTitle
                    className={cn('text-[22px] tracking-[-0.045em]', pageText(isLight))}
                  >
                    {selectedWork.title}
                  </DialogTitle>

                  <DialogDescription
                    className={cn('text-[13px] leading-6', mutedText(isLight))}
                  >
                    {selectedWork.note || labels.workDialogHint}
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    className={cn('sm:flex-1', primaryButtonClass(isLight))}
                    onClick={() => {
                      setSelectedWork(null);
                      openBooking();
                    }}
                  >
                    {labels.bookNow}
                    <ChevronRight className="size-4" />
                  </Button>

                  {services.length > 0 ? (
                    <Button
                      variant="outline"
                      className={cn('sm:flex-1', quietButtonClass(isLight))}
                      onClick={() => {
                        setSelectedWork(null);
                        scrollToSection('services-section');
                      }}
                    >
                      {labels.servicesTitle}
                    </Button>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}