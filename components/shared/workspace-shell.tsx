// components/shared/workspace-shell.tsx
'use client';

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAppearance } from '@/lib/appearance-context';
import { accentPalette } from '@/lib/appearance-palette';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  Bot,
  Bug,
  CalendarClock,
  CalendarRange,
  ChevronDown,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Globe2,
  HelpCircle,
  Home,
  Languages,
  LayoutPanelTop,
  LifeBuoy,
  Loader2,
  LogOut,
  Menu,
  MessageCircleMore,
  MessageSquareText,
  MonitorSmartphone,
  Moon,
  Package2,
  Search,
  Send,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  SquarePen,
  SunMedium,
  Users2,
  WalletCards,
  X,
  type LucideIcon,
} from 'lucide-react';

import { useApp } from '@/lib/app-context';
import { SLOTY_DEMO_SLUG } from '@/lib/demo-data';
import { useBrowserSearchParams } from '@/hooks/use-browser-search-params';
import {
  isDashboardDemoEnabled,
  withDashboardDemoParam,
} from '@/lib/dashboard-demo';
import { useLocale } from '@/lib/locale-context';
import { cn } from '@/lib/utils';
import { buildBookingEventNotifications, type NotificationEvent } from '@/lib/notification-events';

const WORKSPACE_EVENT_READ_KEY = 'clickbook-workspace-event-read-ids';

function readWorkspaceEventIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(WORKSPACE_EVENT_READ_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function writeWorkspaceEventIds(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(WORKSPACE_EVENT_READ_KEY, JSON.stringify(Array.from(new Set(ids)).slice(-300)));
  } catch {}
}


import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/brand/brand-logo';
import { WorkspaceAssistant } from '@/components/shared/workspace-assistant';

const WorkspaceShellEmbedContext = createContext<boolean>(false);

/**
 * Wrap dashboard pages with this when they are embedded inside another shell
 * (e.g. the Electron desktop app, which provides its own sidebar + chrome).
 * Children rendered inside this provider see `useIsWorkspaceShellEmbedded()`
 * return `true` and WorkspaceShell suppresses its marketing top nav, mobile
 * topbar and its own sidebar.
 */
export function WorkspaceShellEmbedProvider({ children }: { children: ReactNode }) {
  return (
    <WorkspaceShellEmbedContext.Provider value={true}>
      {children}
    </WorkspaceShellEmbedContext.Provider>
  );
}

export function useIsWorkspaceShellEmbedded() {
  return useContext(WorkspaceShellEmbedContext);
}

interface WorkspaceShellProps {
  children: ReactNode;
  className?: string;
}

interface NavigationItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  exact?: boolean;
  forceActive?: boolean;
  skipActiveMatch?: boolean;
}

interface NavigationGroup {
  id: string;
  title: string;
  items: NavigationItem[];
}

type ReportCategory = 'bug' | 'idea' | 'question';
type ThemeOption = 'light' | 'dark' | 'system';
type SidebarScope = 'main' | 'profile';
type AccountPanelView = 'menu' | 'report' | 'faq';

const SIDEBAR_WIDTH = 344;

const SHIMMER_CSS = [
  '@keyframes cb-robo-soft-pulse {',
  '  0%, 100% { opacity: 0.42; transform: scale(1); }',
  '  50% { opacity: 0.78; transform: scale(1.14); }',
  '}',
  '',
  '.cb-robo-soft-glow {',
  '  animation: cb-robo-soft-pulse 3.8s ease-in-out infinite;',
  '}',
].join('\n');

function getPathOnly(href: string) {
  return href.split('?')[0]?.split('#')[0] || href;
}

function isActive(pathname: string, href: string, exact = false) {
  const cleanHref = getPathOnly(href);

  if (cleanHref === '/') return pathname === '/';
  if (exact) return pathname === cleanHref;

  return pathname === cleanHref || pathname.startsWith(cleanHref + '/');
}

function ActiveDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'absolute bottom-[1px] left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-black dark:bg-white',
        className,
      )}
    />
  );
}

function SidebarDivider({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('h-3', className)} />;
}

function FooterHairline() {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'mb-2 h-px w-full overflow-hidden rounded-full',
        'bg-gradient-to-r from-transparent via-black/[0.12] to-transparent',
        'dark:via-white/[0.14]',
      )}
    />
  );
}

function DropdownDivider({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'mx-1 my-1 h-px bg-black/[0.08] dark:bg-white/[0.09]',
        className,
      )}
    />
  );
}

function BotBadge({
  locale,
  active,
}: {
  locale: string;
  active: boolean;
}) {
  return (
    <span
      className={cn(
        'ml-auto shrink-0 text-[9px] font-semibold leading-none tracking-[-0.015em]',
        active
          ? 'text-white/62 dark:text-black/52'
          : 'text-slate-400 dark:text-white/28',
      )}
    >
      [{locale === 'ru' ? 'бот' : 'bot'}]
    </span>
  );
}

function SearchField({
  value,
  onChange,
  placeholder,
  accentColor,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  accentColor?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className={cn(
        'group relative rounded-[10px] border bg-transparent transition-all duration-150',
        'border-black/[0.07] hover:border-black/[0.14]',
        'dark:border-white/[0.075] dark:hover:border-white/[0.16]',
      )}
      style={
        focused && accentColor
          ? { borderColor: accentColor, boxShadow: `0 0 0 3px ${accentColor}1f` }
          : undefined
      }
    >
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-black/30 transition-colors dark:text-white/26"
        style={focused && accentColor ? { color: accentColor } : undefined}
      />

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className={cn(
          'h-9 w-full rounded-[10px] bg-black/[0.025] pl-8 pr-12 text-[12px] outline-none transition',
          'text-slate-950 placeholder:text-black/30',
          'focus:bg-white',
          'dark:bg-white/[0.035] dark:text-white dark:placeholder:text-white/24',
        )}
      />

      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-[7px] text-black/35 transition hover:bg-black/[0.055] hover:text-black dark:text-white/30 dark:hover:bg-white/[0.07] dark:hover:text-white"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      ) : (
        <kbd className="pointer-events-none absolute right-2 top-1/2 hidden h-[18px] -translate-y-1/2 items-center rounded-[5px] border border-black/[0.07] bg-black/[0.025] px-1.5 text-[9.5px] font-medium tracking-wide text-black/35 sm:inline-flex dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-white/30">
          /
        </kbd>
      )}
    </div>
  );
}

function ModePanel({
  locale,
  selectedMode,
  liveHref,
  demoHref,
  onNavigate,
}: {
  locale: 'ru' | 'en';
  selectedMode: 'live' | 'demo';
  liveHref: string;
  demoHref: string;
  onNavigate?: () => void;
}) {
  const options = [
    {
      value: 'live' as const,
      href: liveHref,
      label: locale === 'ru' ? 'Рабочий' : 'Live',
      caption: locale === 'ru' ? 'боевой кабинет' : 'real workspace',
      title: locale === 'ru' ? 'Рабочий режим' : 'Live mode',
      icon: Globe2,
    },
    {
      value: 'demo' as const,
      href: demoHref,
      label: locale === 'ru' ? 'Демо' : 'Demo',
      caption: locale === 'ru' ? 'пример профиля' : 'sample profile',
      title: locale === 'ru' ? 'Демо режим' : 'Demo mode',
      icon: Sparkles,
    },
  ];

  return (
    <div className="mt-4">
      <div className="mb-1.5 px-1 text-[8.5px] font-semibold uppercase tracking-[0.18em] text-black/32 dark:text-white/22">
        {locale === 'ru' ? 'Режимы' : 'Modes'}
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-[13px] border border-black/[0.07] bg-[#ffffff] p-1 shadow-[0_8px_24px_rgba(15,23,42,0.035)] dark:border-white/[0.075] dark:bg-[#141414] dark:shadow-none">
        {options.map((option) => {
          const active = selectedMode === option.value;
          const Icon = option.icon;

          return (
            <Link
              key={option.value}
              href={option.href}
              onClick={onNavigate}
              prefetch={false}
              scroll={false}
              aria-current={active ? 'page' : undefined}
              title={option.title}
              className={cn(
                'group relative flex min-h-[54px] flex-col justify-center rounded-[10px] px-2.5 py-2 transition active:scale-[0.99]',
                active
                  ? 'bg-black/[0.045] text-slate-950 dark:bg-white/[0.06] dark:text-white'
                  : 'text-slate-500 hover:bg-black/[0.025] hover:text-slate-950 dark:text-white/36 dark:hover:bg-white/[0.045] dark:hover:text-white',
              )}
            >
              <span className="flex items-center gap-1.5">
                <Icon
                  className={cn(
                    'size-3.5 stroke-[1.8] transition',
                    active
                      ? 'text-slate-950 dark:text-white'
                      : 'text-slate-400 group-hover:text-slate-700 dark:text-white/28 dark:group-hover:text-white/70',
                  )}
                />

                <span className="text-[12px] font-semibold tracking-[-0.04em]">
                  {option.label}
                </span>
              </span>

              <span
                className={cn(
                  'mt-1 truncate text-[9.5px] leading-none',
                  active
                    ? 'text-slate-500 dark:text-white/38'
                    : 'text-slate-400 dark:text-white/24',
                )}
              >
                {option.caption}
              </span>

              {active ? <ActiveDot className="bottom-[5px]" /> : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function NavRow({
  item,
  active,
  locale,
  onNavigate,
}: {
  item: NavigationItem;
  active: boolean;
  locale: 'ru' | 'en';
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const isBotBadge = item.badge?.toLowerCase() === 'bot';

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={item.label}
      aria-current={active ? 'page' : undefined}
      prefetch={false}
      scroll={false}
      className={cn(
        'group relative flex h-8 items-center gap-2 rounded-[9px] px-2 text-[12px] font-medium tracking-[-0.025em] transition active:scale-[0.99]',
        active
          ? 'cb-neutral-primary'
          : 'text-slate-600 hover:bg-black/[0.045] hover:text-slate-950 dark:text-white/42 dark:hover:bg-white/[0.055] dark:hover:text-white',
      )}
    >
      <Icon
        className={cn(
          'size-3.5 shrink-0 transition',
          active
            ? 'text-current'
            : 'text-slate-400 group-hover:text-slate-950 dark:text-white/28 dark:group-hover:text-white',
        )}
      />

      <span className="min-w-0 flex flex-1 items-center">
        <span className="truncate">{item.label}</span>
        {isBotBadge ? <BotBadge locale={locale} active={active} /> : null}
      </span>

      {item.badge && !isBotBadge ? (
        <span
          className={cn(
            'inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[9px] font-semibold leading-none',
            active
              ? 'bg-white/18 text-current dark:bg-black/15'
              : 'bg-black/[0.055] text-slate-500 dark:bg-white/[0.075] dark:text-white/45',
          )}
        >
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

function NavGroup({
  title,
  items,
  pathname,
  locale,
  onNavigate,
}: {
  title: string;
  items: NavigationItem[];
  pathname: string;
  locale: 'ru' | 'en';
  onNavigate?: () => void;
}) {
  return (
    <section>
      <div className="mb-1.5 px-2 text-[8.5px] font-semibold uppercase tracking-[0.18em] text-black/32 dark:text-white/22">
        {title}
      </div>

      <div className="space-y-0.5">
        {items.map((item) => (
          <NavRow
            key={item.href}
            item={item}
            active={Boolean(
              item.forceActive || isActive(pathname, item.href, item.exact),
            )}
            locale={locale}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </section>
  );
}

function PublicLink({
  item,
  active,
  description,
  onNavigate,
}: {
  item: NavigationItem;
  active: boolean;
  description: string;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      prefetch={false}
      scroll={false}
      className={cn(
        'group flex items-center justify-between gap-2 rounded-[11px] border p-2.5 transition active:scale-[0.99]',
        active
          ? 'cb-neutral-primary'
          : 'border-black/[0.07] bg-black/[0.018] hover:border-black/[0.11] hover:bg-black/[0.035] dark:border-white/[0.075] dark:bg-white/[0.03] dark:hover:border-white/[0.11] dark:hover:bg-white/[0.05]',
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-[9px]',
            active
              ? 'bg-white/18 text-current dark:bg-black/15'
              : 'bg-black/[0.045] text-slate-500 dark:bg-white/[0.055] dark:text-white/36',
          )}
        >
          <Globe2 className="size-3.5" />
        </span>

        <span className="min-w-0">
          <span className="block truncate text-[12px] font-semibold tracking-[-0.035em]">
            {item.label}
          </span>

          <span
            className={cn(
              'mt-0.5 block truncate text-[10px]',
              active ? 'text-current/68' : 'text-slate-500 dark:text-white/30',
            )}
          >
            {description}
          </span>
        </span>
      </span>

      <ExternalLink className="size-3 shrink-0 opacity-40 transition group-hover:opacity-100" />
    </Link>
  );
}

function ProfileScopeContent({
  groups,
  pathname,
  locale,
  backLabel,
  backHref,
  noResultsLabel,
  publicDescription,
  publicPageItem,
  publicPageActive,
  onNavigate,
}: {
  groups: NavigationGroup[];
  pathname: string;
  locale: 'ru' | 'en';
  backLabel: string;
  backHref: string;
  noResultsLabel: string;
  publicDescription: string;
  publicPageItem: NavigationItem;
  publicPageActive: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div>
      <PublicLink
        item={publicPageItem}
        active={publicPageActive}
        description={publicDescription}
        onNavigate={onNavigate}
      />

      <SidebarDivider />

      <Link
        href={backHref}
        onClick={onNavigate}
        prefetch={false}
        scroll={false}
        className="group flex h-9 items-center gap-2 rounded-[10px] px-2 text-[12px] font-medium text-slate-500 transition hover:bg-black/[0.045] hover:text-slate-950 active:scale-[0.99] dark:text-white/36 dark:hover:bg-white/[0.055] dark:hover:text-white"
      >
        <ArrowLeft className="size-3.5 shrink-0 transition group-hover:-translate-x-0.5" />
        <span className="truncate">{backLabel}</span>
      </Link>

      <SidebarDivider />

      {groups.length ? (
        <div>
          {groups.map((group, index) => (
            <div key={group.id}>
              {index > 0 ? <SidebarDivider /> : null}

              <NavGroup
                title={group.title}
                items={group.items}
                pathname={pathname}
                locale={locale}
                onNavigate={onNavigate}
              />
            </div>
          ))}
        </div>
      ) : (
        <EmptySearch>{noResultsLabel}</EmptySearch>
      )}
    </div>
  );
}

function getWorkspaceIdentity(profile: unknown, locale: 'ru' | 'en') {
  const data = (profile ?? {}) as Record<string, unknown>;

  const name =
    (typeof data.name === 'string' && data.name.trim()) ||
    (typeof data.masterName === 'string' && data.masterName.trim()) ||
    (typeof data.title === 'string' && data.title.trim()) ||
    (typeof data.displayName === 'string' && data.displayName.trim()) ||
    (locale === 'ru' ? 'Кабинет' : 'Workspace');

  const slug =
    typeof data.slug === 'string' && data.slug.trim()
      ? data.slug.trim()
      : locale === 'ru'
        ? 'рабочий профиль'
        : 'working profile';

  const avatar =
    typeof data.avatar === 'string' && data.avatar.trim()
      ? data.avatar.trim()
      : undefined;

  return {
    name,
    subtitle: slug.startsWith('@') ? slug : `@${slug}`,
    initial: name.trim().slice(0, 1).toUpperCase() || 'К',
    avatar,
  };
}

function WorkspaceIdentityAvatar({
  identity,
  size = 'sm',
}: {
  identity: {
    name: string;
    initial: string;
    avatar?: string;
  };
  size?: 'sm' | 'md';
}) {
  return (
    <span
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden border font-bold',
        size === 'md'
          ? 'size-9 rounded-[11px] text-[12px]'
          : 'size-8 rounded-[10px] text-[11px]',
        'border-black/[0.08] bg-[var(--cb-surface)] text-black/72',
        'dark:border-white/[0.09] dark:bg-[#141414] dark:text-white/78',
      )}
    >
      {identity.avatar ? (
        <img src={identity.avatar} alt={identity.name} className="h-full w-full object-cover" />
      ) : (
        identity.initial
      )}
    </span>
  );
}

function AccountThemeIcon({ value }: { value: ThemeOption }) {
  if (value === 'light') {
    return <SunMedium className="size-[13px] stroke-[1.9]" />;
  }

  if (value === 'dark') {
    return <Moon className="size-[13px] stroke-[1.9]" />;
  }

  return <MonitorSmartphone className="size-[13px] stroke-[1.9]" />;
}

function AccountInlineSegment<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{
    value: T;
    label: string;
    icon?: ReactNode;
  }>;
  onChange: (value: T) => void;
}) {
  return (
    <div
      className={cn(
        'inline-grid rounded-[10px] border p-0.5',
        'border-black/[0.07] bg-black/[0.025]',
        'dark:border-white/[0.08] dark:bg-white/[0.04]',
      )}
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      {options.map((option) => {
        const active = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            title={option.label}
            className={cn(
              'relative flex h-7 min-w-8 items-center justify-center gap-1 rounded-[8px] px-2 text-[10px] font-semibold transition active:scale-[0.96]',
              active
                ? 'bg-[var(--cb-surface)] text-black shadow-[0_8px_20px_rgba(15,15,15,0.07)] dark:bg-white/[0.115] dark:text-white dark:shadow-none'
                : 'text-black/38 hover:bg-black/[0.035] hover:text-black dark:text-white/34 dark:hover:bg-white/[0.06] dark:hover:text-white',
            )}
          >
            {option.icon ? (
              <span className="flex shrink-0 items-center justify-center">
                {option.icon}
              </span>
            ) : null}

            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function AccountMenuRow({
  icon: Icon,
  label,
  hint,
  href,
  external = false,
  danger = false,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  hint?: string;
  href?: string;
  external?: boolean;
  danger?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-[10px] border transition',
          'border-black/[0.06] bg-black/[0.025] text-black/42',
          'group-hover:border-black/[0.08] group-hover:bg-black/[0.045] group-hover:text-black',
          'dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-white/40',
          'dark:group-hover:border-white/[0.11] dark:group-hover:bg-white/[0.065] dark:group-hover:text-white',
          danger &&
            'text-red-500/70 group-hover:text-red-600 dark:text-red-300/70 dark:group-hover:text-red-200',
        )}
      >
        <Icon className="size-[14px] stroke-[1.85]" />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block truncate text-[12px] font-semibold leading-none tracking-[-0.03em]',
            danger
              ? 'text-red-600 dark:text-red-200'
              : 'text-black/78 group-hover:text-black dark:text-white/76 dark:group-hover:text-white',
          )}
        >
          {label}
        </span>

        {hint ? (
          <span className="mt-1 block truncate text-[9.5px] font-medium leading-none text-black/38 dark:text-white/30">
            {hint}
          </span>
        ) : null}
      </span>

      {external ? (
        <ExternalLink className="size-3 shrink-0 text-black/28 transition group-hover:text-black/50 dark:text-white/24 dark:group-hover:text-white/50" />
      ) : (
        <ChevronRight className="size-3 shrink-0 text-black/24 transition group-hover:translate-x-0.5 group-hover:text-black/50 dark:text-white/22 dark:group-hover:text-white/48" />
      )}
    </>
  );

  const className = cn(
    'group flex w-full items-center gap-2 rounded-[11px] px-2 py-2 text-left outline-none',
    'transition-[background-color,color,transform] duration-150 active:scale-[0.99]',
    'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]',
  );

  if (href) {
    return (
      <Link
        href={href}
        prefetch={false}
        scroll={false}
        target={external ? '_blank' : undefined}
        rel={external ? 'noreferrer' : undefined}
        onClick={() => onClick?.()}
        className={className}
      >
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

function AccountFooterMenu({ locale }: { locale: 'ru' | 'en' }) {
  const rawPathname = usePathname();
  const pathname = rawPathname || '/dashboard';
  const searchParams = useBrowserSearchParams();
  const { ownedProfile } = useApp();
  const { theme, setTheme } = useTheme();
  const { locale: currentLocale, setLocale } = useLocale();

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<AccountPanelView>('menu');
  const [openFaqKey, setOpenFaqKey] = useState('start');
  const [reportCategory, setReportCategory] = useState<ReportCategory>('bug');
  const [reportText, setReportText] = useState('');
  const [contactText, setContactText] = useState('');
  const [reportStatus, setReportStatus] = useState<
    'idle' | 'sending' | 'success' | 'error'
  >('idle');
  const [reportError, setReportError] = useState('');

  const rootRef = useRef<HTMLDivElement | null>(null);

  const demoMode = isDashboardDemoEnabled(searchParams);
  const identity = getWorkspaceIdentity(ownedProfile, locale);

  const publicHref = demoMode
    ? '/demo/' + SLOTY_DEMO_SLUG
    : ownedProfile
      ? '/m/' + ownedProfile.slug
      : '/create-profile';

  const currentTheme = mounted ? ((theme || 'system') as ThemeOption) : 'system';
  const safeLocale: 'ru' | 'en' = currentLocale === 'en' ? 'en' : 'ru';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setView('menu');
      }
    };

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        setView('menu');
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const labels =
    locale === 'ru'
      ? {
          account: 'Аккаунт',
          workspace: 'кабинет',
          menu: 'Меню аккаунта',
          feedback: 'Связь',
          feedbackHint: 'ошибка, идея или вопрос',
          theme: 'Тема',
          language: 'Язык',
          light: 'Свет',
          dark: 'Тёмн',
          system: 'Авто',
          home: 'Главная',
          homeHint: 'вернуться в кабинет',
          publicPage: 'Публичная страница',
          publicHint: 'как страницу будут видеть клиенты',
          changelog: 'Обновления',
          changelogHint: 'что появилось в КликБук',
          help: 'Помощь',
          helpHint: 'быстрые ответы',
          docs: 'Инструкции',
          docsHint: 'как настроить кабинет',
          logout: 'Выйти',
          logoutHint: 'завершить сессию',
          upgrade: 'Upgrade to Pro',
          status: 'Статус платформы',
          statusText: 'Все системы работают.',
          robo: 'Робо',
          roboHint: 'помощник по кабинету',
          back: 'Назад',
          reportTitle: 'Отправить сообщение',
          reportHint: 'Сообщение уйдёт в поддержку вместе с текущим экраном.',
          reportPlaceholder:
            'Например: не открывается запись, не сохраняется услуга, странно работает тема...',
          contactPlaceholder: 'Контакт для ответа: Telegram / email / телефон',
          send: 'Отправить',
          sending: 'Отправляю',
          sent: 'Готово, сообщение отправлено',
          sentHint: 'Поддержка получила обращение.',
          validation: 'Опиши ситуацию чуть подробнее.',
          error: 'Не удалось отправить. Проверь /api/support/report и env.',
          categories: {
            bug: 'Ошибка',
            idea: 'Идея',
            question: 'Вопрос',
          },
          faqTitle: 'Помощь и инструкции',
          faqHint: 'Коротко по основным действиям.',
        }
      : {
          account: 'Account',
          workspace: 'workspace',
          menu: 'Account menu',
          feedback: 'Связь',
          feedbackHint: 'bug, idea or question',
          theme: 'Theme',
          language: 'Language',
          light: 'Light',
          dark: 'Dark',
          system: 'Auto',
          home: 'Home Page',
          homeHint: 'return to workspace',
          publicPage: 'Public page',
          publicHint: 'client page',
          changelog: 'Changelog',
          changelogHint: 'latest ClickBook updates',
          help: 'Help',
          helpHint: 'quick answers',
          docs: 'Docs',
          docsHint: 'workspace guides',
          logout: 'Log Out',
          logoutHint: 'end current session',
          upgrade: 'Upgrade to Pro',
          status: 'Platform Status',
          statusText: 'All systems normal.',
          robo: 'Robo',
          roboHint: 'workspace assistant',
          back: 'Back',
          reportTitle: 'Send feedback',
          reportHint: 'The message will include your current screen.',
          reportPlaceholder:
            'For example: booking does not open, service is not saved, theme behaves incorrectly...',
          contactPlaceholder: 'Contact for reply: Telegram / email / phone',
          send: 'Send',
          sending: 'Sending',
          sent: 'Done, message sent',
          sentHint: 'Support received your message.',
          validation: 'Describe the situation in more detail.',
          error: 'Could not send. Check /api/support/report and env.',
          categories: {
            bug: 'Bug',
            idea: 'Idea',
            question: 'Question',
          },
          faqTitle: 'Help and docs',
          faqHint: 'Short guides for core actions.',
        };

  const themeOptions = useMemo<
    Array<{
      value: ThemeOption;
      label: string;
      icon: ReactNode;
    }>
  >(
    () => [
      {
        value: 'light',
        label: labels.light,
        icon: <AccountThemeIcon value="light" />,
      },
      {
        value: 'dark',
        label: labels.dark,
        icon: <AccountThemeIcon value="dark" />,
      },
      {
        value: 'system',
        label: labels.system,
        icon: <AccountThemeIcon value="system" />,
      },
    ],
    [labels.dark, labels.light, labels.system],
  );

  const localeOptions = useMemo(
    () => [
      {
        value: 'ru' as const,
        label: 'RU',
      },
      {
        value: 'en' as const,
        label: 'EN',
      },
    ],
    [],
  );

  const faqItems =
    locale === 'ru'
      ? [
          {
            key: 'start',
            title: 'С чего начать настройку?',
            text:
              'Открой «Профиль», заполни имя, описание, контакты и адрес. Потом перейди в «Услуги» и добавь позиции, по которым клиенты смогут записываться.',
          },
          {
            key: 'public',
            title: 'Как посмотреть страницу клиента?',
            text:
              'Нажми «Публичная». Это страница, которую получает клиент: услуги, свободное время и форма записи.',
          },
          {
            key: 'theme',
            title: 'Где менять внешний вид?',
            text:
              'В разделе «Внешний вид» можно настроить тему, акцент, плотность интерфейса и оформление публичной страницы.',
          },
          {
            key: 'robo',
            title: 'Что делает Робо?',
            text:
              'Робо помогает по кабинету: подсказывает, куда перейти, что заполнить, как исправить ошибку и как настроить запись.',
          },
        ]
      : [
          {
            key: 'start',
            title: 'Where should I start?',
            text:
              'Open “Profile”, fill in your name, description, contacts and address. Then add bookable items in “Services”.',
          },
          {
            key: 'public',
            title: 'How do I preview the client page?',
            text:
              'Click “Public”. This is the page clients see: services, available slots and the booking form.',
          },
          {
            key: 'theme',
            title: 'Where do I change appearance?',
            text:
              'Open “Appearance” to configure theme, accent, density and public page styling.',
          },
          {
            key: 'robo',
            title: 'What does Robo do?',
            text:
              'Robo helps with the workspace: where to click, what to fill in, how to fix issues and configure bookings.',
          },
        ];

  const openRobo = () => {
    window.dispatchEvent(new CustomEvent('clickbook:open-robo'));

    const trigger = document.querySelector<HTMLElement>(
      '[data-workspace-assistant-trigger], [data-robo-trigger], #workspace-assistant-trigger',
    );

    trigger?.click();
    setOpen(false);
    setView('menu');
  };

  const handleSendReport = async () => {
    const cleanText = reportText.trim();

    if (cleanText.length < 8) {
      setReportStatus('error');
      setReportError(labels.validation);
      return;
    }

    try {
      setReportStatus('sending');
      setReportError('');

      const response = await fetch('/api/support/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: reportCategory,
          message: cleanText,
          contact: contactText.trim(),
          path: pathname,
          locale,
          userAgent: window.navigator.userAgent,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send report');
      }

      setReportStatus('success');
      setReportText('');
      setContactText('');
    } catch {
      setReportStatus('error');
      setReportError(labels.error);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <div
        className={cn(
          'absolute bottom-[calc(100%+10px)] left-0 z-50 w-[292px] origin-bottom-left overflow-hidden rounded-[15px] border p-1 backdrop-blur-[24px] transition duration-150',
          'border-black/[0.09] bg-[#ffffff]/88 text-black shadow-[0_24px_80px_rgba(15,15,15,0.12)]',
          'dark:border-white/[0.10] dark:bg-[#141414]/88 dark:text-white dark:shadow-[0_28px_90px_rgba(0,0,0,0.58)]',
          open
            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-1.5 scale-[0.985] opacity-0',
        )}
      >
        {view === 'menu' ? (
          <>
            <div className="px-2.5 pb-2 pt-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2.5">
                  <WorkspaceIdentityAvatar identity={identity} size="md" />

                  <span className="min-w-0 pt-0.5">
                    <span className="block truncate text-[13px] font-semibold leading-none tracking-[-0.04em]">
                      {identity.name}
                    </span>

                    <span className="mt-1.5 block text-[10px] font-medium leading-[1.2] text-black/42 dark:text-white/32">
                      {identity.subtitle}
                    </span>
                  </span>
                </div>

                <Link
                  href={withDashboardDemoParam('/dashboard/profile', demoMode)}
                  prefetch={false}
                  onClick={() => setOpen(false)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-[10px] text-black/40 transition hover:bg-black/[0.045] hover:text-black active:scale-[0.96] dark:text-white/36 dark:hover:bg-white/[0.07] dark:hover:text-white"
                  title={labels.account}
                >
                  <Settings2 className="size-[15px] stroke-[1.85]" />
                </Link>
              </div>
            </div>

            <DropdownDivider />

            <div className="px-1 py-1">
              <AccountMenuRow
                icon={MessageCircleMore}
                label={labels.feedback}
                hint={labels.feedbackHint}
                onClick={() => {
                  setReportCategory('bug');
                  setReportStatus('idle');
                  setReportError('');
                  setView('report');
                }}
              />

              <div className="my-1 rounded-[12px] px-2 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] border border-black/[0.06] bg-black/[0.025] text-black/42 dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-white/40">
                      <SunMedium className="size-[14px] stroke-[1.85]" />
                    </span>

                    <span className="text-[12px] font-semibold tracking-[-0.03em] text-black/78 dark:text-white/76">
                      {labels.theme}
                    </span>
                  </div>

                  <AccountInlineSegment
                    value={currentTheme}
                    options={themeOptions}
                    onChange={(value) => setTheme(value)}
                  />
                </div>
              </div>

              <div className="my-1 rounded-[12px] px-2 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] border border-black/[0.06] bg-black/[0.025] text-black/42 dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-white/40">
                      <Languages className="size-[14px] stroke-[1.85]" />
                    </span>

                    <span className="text-[12px] font-semibold tracking-[-0.03em] text-black/78 dark:text-white/76">
                      {labels.language}
                    </span>
                  </div>

                  <AccountInlineSegment
                    value={safeLocale}
                    options={localeOptions}
                    onChange={(value) => setLocale(value)}
                  />
                </div>
              </div>

              <DropdownDivider />

              <AccountMenuRow
                icon={Home}
                label={labels.home}
                hint={labels.homeHint}
                href={withDashboardDemoParam('/dashboard', demoMode)}
                onClick={() => setOpen(false)}
              />

              <AccountMenuRow
                icon={Globe2}
                label={labels.publicPage}
                hint={labels.publicHint}
                href={publicHref}
                onClick={() => setOpen(false)}
              />

              <AccountMenuRow
                icon={Sparkles}
                label={labels.changelog}
                hint={labels.changelogHint}
                onClick={() => {
                  setOpenFaqKey('start');
                  setView('faq');
                }}
              />

              <AccountMenuRow
                icon={LifeBuoy}
                label={labels.help}
                hint={labels.helpHint}
                onClick={() => {
                  setOpenFaqKey('start');
                  setView('faq');
                }}
              />

              <AccountMenuRow
                icon={HelpCircle}
                label={labels.docs}
                hint={labels.docsHint}
                onClick={() => {
                  setOpenFaqKey('public');
                  setView('faq');
                }}
              />

              <DropdownDivider />

              <AccountMenuRow
                icon={LogOut}
                label={labels.logout}
                hint={labels.logoutHint}
                href="/auth/signout"
                danger
              />
            </div>

            <div className="px-1.5 pb-1.5 pt-1">
              <Link
                href={withDashboardDemoParam('/dashboard/subscription', demoMode)}
                prefetch={false}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex h-9 w-full items-center justify-center rounded-[10px] text-[12px] font-semibold tracking-[-0.03em] transition active:scale-[0.99]',
                  'bg-black text-white hover:bg-black/88',
                  'dark:bg-white dark:text-black dark:hover:bg-white/88',
                )}
              >
                {labels.upgrade}
              </Link>
            </div>

            <DropdownDivider />

            <div className="px-3 py-2.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11.5px] font-medium text-black/52 dark:text-white/46">
                    {labels.status}
                  </div>

                  <div className="mt-1 text-[12px] font-semibold tracking-[-0.035em] text-black dark:text-white">
                    {labels.statusText}
                  </div>
                </div>

                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </>
        ) : null}

        {view === 'report' ? (
          <div>
            <div className="flex items-center gap-2 px-1.5 pb-2 pt-1.5">
              <button
                type="button"
                onClick={() => setView('menu')}
                className="flex size-8 shrink-0 items-center justify-center rounded-[10px] text-black/42 transition hover:bg-black/[0.045] hover:text-black dark:text-white/36 dark:hover:bg-white/[0.075] dark:hover:text-white"
                aria-label={labels.back}
              >
                <ArrowLeft className="size-3.5" />
              </button>

              <span className="min-w-0">
                <span className="block text-[13px] font-semibold leading-none tracking-[-0.04em] text-black dark:text-white">
                  {labels.reportTitle}
                </span>

                <span className="mt-1 block truncate text-[10px] text-black/42 dark:text-white/32">
                  {labels.reportHint}
                </span>
              </span>
            </div>

            <DropdownDivider />

            <div className="space-y-2 px-1.5 py-1.5">
              <div className="grid grid-cols-3 gap-1">
                {(['bug', 'idea', 'question'] as ReportCategory[]).map(
                  (category) => {
                    const active = reportCategory === category;

                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setReportCategory(category)}
                        className={cn(
                          'relative h-8 rounded-[9px] text-[10px] font-medium transition active:scale-[0.98]',
                          active
                            ? 'text-black dark:text-white'
                            : 'text-black/40 hover:bg-black/[0.035] hover:text-black dark:text-white/34 dark:hover:bg-white/[0.055] dark:hover:text-white',
                        )}
                      >
                        {labels.categories[category]}
                        {active ? <ActiveDot /> : null}
                      </button>
                    );
                  },
                )}
              </div>

              <textarea
                value={reportText}
                onChange={(event) => {
                  setReportText(event.target.value);
                  if (reportStatus === 'error') {
                    setReportStatus('idle');
                    setReportError('');
                  }
                }}
                placeholder={labels.reportPlaceholder}
                rows={5}
                className={cn(
                  'min-h-[112px] w-full resize-none rounded-[11px] border px-3 py-2 text-[11px] leading-4 shadow-none outline-none transition',
                  'border-black/[0.08] bg-black/[0.025] text-black placeholder:text-black/30',
                  'focus:border-black/[0.14] focus:bg-white/70',
                  'dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-white dark:placeholder:text-white/24 dark:focus:border-white/[0.14] dark:focus:bg-white/[0.055]',
                )}
              />

              <input
                value={contactText}
                onChange={(event) => setContactText(event.target.value)}
                placeholder={labels.contactPlaceholder}
                className={cn(
                  'h-9 w-full rounded-[10px] border px-3 text-[11px] shadow-none outline-none transition',
                  'border-black/[0.08] bg-black/[0.025] text-black placeholder:text-black/30',
                  'focus:border-black/[0.14] focus:bg-white/70',
                  'dark:border-white/[0.08] dark:bg-white/[0.035] dark:text-white dark:placeholder:text-white/24 dark:focus:border-white/[0.14] dark:focus:bg-white/[0.055]',
                )}
              />

              {reportStatus === 'success' ? (
                <div className="rounded-[10px] border border-black/[0.08] bg-black/[0.025] px-3 py-2 dark:border-white/[0.08] dark:bg-white/[0.04]">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-black dark:text-white">
                    <CheckCircle2 className="size-3.5" />
                    {labels.sent}
                  </div>

                  <div className="mt-0.5 text-[9.5px] text-black/42 dark:text-white/34">
                    {labels.sentHint}
                  </div>
                </div>
              ) : null}

              {reportStatus === 'error' && reportError ? (
                <div className="rounded-[10px] border border-red-500/15 bg-red-500/[0.06] px-3 py-2 text-[10px] text-red-600 dark:text-red-300">
                  {reportError}
                </div>
              ) : null}

              <button
                type="button"
                onClick={handleSendReport}
                disabled={reportStatus === 'sending'}
                className={cn(
                  'flex h-9 w-full items-center justify-center gap-2 rounded-[10px] text-[11px] font-semibold tracking-[-0.02em] transition active:scale-[0.99]',
                  'bg-black text-white hover:bg-black/88 dark:bg-white dark:text-black dark:hover:bg-white/88',
                  reportStatus === 'sending' && 'pointer-events-none opacity-70',
                )}
              >
                {reportStatus === 'sending' ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}

                {reportStatus === 'sending' ? labels.sending : labels.send}
              </button>
            </div>
          </div>
        ) : null}

        {view === 'faq' ? (
          <div>
            <div className="flex items-center gap-2 px-1.5 pb-2 pt-1.5">
              <button
                type="button"
                onClick={() => setView('menu')}
                className="flex size-8 shrink-0 items-center justify-center rounded-[10px] text-black/42 transition hover:bg-black/[0.045] hover:text-black dark:text-white/36 dark:hover:bg-white/[0.075] dark:hover:text-white"
                aria-label={labels.back}
              >
                <ArrowLeft className="size-3.5" />
              </button>

              <span className="min-w-0">
                <span className="block text-[13px] font-semibold leading-none tracking-[-0.04em] text-black dark:text-white">
                  {labels.faqTitle}
                </span>

                <span className="mt-1 block truncate text-[10px] text-black/42 dark:text-white/32">
                  {labels.faqHint}
                </span>
              </span>
            </div>

            <DropdownDivider />

            <div className="space-y-0.5 px-1.5 py-1.5">
              {faqItems.map((item) => {
                const active = openFaqKey === item.key;

                return (
                  <div key={item.key} className="overflow-hidden rounded-[10px]">
                    <button
                      type="button"
                      onClick={() => setOpenFaqKey(active ? '' : item.key)}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 rounded-[10px] px-2.5 py-2 text-left transition',
                        active
                          ? 'bg-black/[0.045] text-black dark:bg-white/[0.075] dark:text-white'
                          : 'text-black/68 hover:bg-black/[0.035] hover:text-black dark:text-white/68 dark:hover:bg-white/[0.055] dark:hover:text-white',
                      )}
                    >
                      <span className="text-[11.5px] font-semibold tracking-[-0.025em]">
                        {item.title}
                      </span>

                      <ChevronRight
                        className={cn(
                          'size-3 shrink-0 opacity-45 transition',
                          active && 'rotate-90 opacity-80',
                        )}
                      />
                    </button>

                    {active ? (
                      <div className="px-2.5 pb-2.5 pt-1 text-[10px] leading-4 text-black/44 dark:text-white/34">
                        {item.text}
                      </div>
                    ) : null}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setReportCategory('question');
                  setReportStatus('idle');
                  setReportError('');
                  setView('report');
                }}
                className="mt-1 flex h-8 w-full items-center justify-center gap-1.5 rounded-[9px] text-[10px] font-medium text-black/50 transition hover:bg-black/[0.045] hover:text-black dark:text-white/45 dark:hover:bg-white/[0.075] dark:hover:text-white"
              >
                <Bug className="size-3" />
                {labels.feedback}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          'flex h-[52px] items-center gap-1.5 rounded-[14px] border p-1',
          'border-black/[0.075] bg-black/[0.022] text-black backdrop-blur-[18px]',
          'dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white',
        )}
      >
        <button
          type="button"
          onClick={() => {
            setOpen((value) => {
              const next = !value;
              if (next) setView('menu');
              return next;
            });
          }}
          aria-expanded={open}
          aria-haspopup="menu"
          className={cn(
            'group flex min-w-0 flex-1 items-center gap-2 rounded-[11px] px-2 py-1.5 text-left transition active:scale-[0.99]',
            'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]',
            open && 'bg-black/[0.045] dark:bg-white/[0.07]',
          )}
        >
          <WorkspaceIdentityAvatar identity={identity} />

          <span className="min-w-0 flex-1">
            <span className="block truncate text-[11.5px] font-semibold leading-none tracking-[-0.03em] text-black dark:text-white" title={identity.name}>
              {identity.name}
            </span>

            <span className="mt-1 block truncate text-[9.5px] leading-[1.2] text-black/40 dark:text-white/32" title={identity.subtitle}>
              {identity.subtitle}
            </span>
          </span>

          <span className="flex size-7 shrink-0 items-center justify-center rounded-[9px] text-black/34 transition group-hover:bg-black/[0.045] group-hover:text-black dark:text-white/32 dark:group-hover:bg-white/[0.07] dark:group-hover:text-white">
            <span className="translate-y-[-1px] text-[16px] leading-none">···</span>
          </span>
        </button>

        <button
          type="button"
          onClick={openRobo}
          title={labels.robo}
          aria-label={labels.robo}
          className={cn(
            'group relative flex size-10 shrink-0 items-center justify-center rounded-[12px] border transition active:scale-[0.96]',
            'border-black/[0.07] bg-black/[0.035] text-black/58 hover:border-black/[0.12] hover:bg-black/[0.055] hover:text-black',
            'dark:border-white/[0.08] dark:bg-white/[0.055] dark:text-white/56 dark:hover:border-white/[0.14] dark:hover:bg-white/[0.08] dark:hover:text-white',
          )}
        >
          <Bot className="size-[15px] stroke-[1.9]" />

          <span
            aria-hidden="true"
            className="absolute right-2 top-2 size-1.5 rounded-full bg-black/55 dark:bg-white/70"
          />

          <span className="pointer-events-none absolute bottom-[calc(100%+9px)] right-0 hidden w-[158px] rounded-[12px] border border-black/[0.08] bg-[#ffffff]/90 px-3 py-2 text-left text-[10px] text-black/44 backdrop-blur-[22px] shadow-[0_18px_54px_rgba(15,15,15,0.12)] group-hover:block dark:border-white/[0.10] dark:bg-[#141414]/90 dark:text-white/36 dark:shadow-[0_24px_70px_rgba(0,0,0,0.50)]">
            <span className="block text-[11.5px] font-semibold text-black dark:text-white">
              {labels.robo}
            </span>
            <span className="mt-0.5 block">{labels.roboHint}</span>
          </span>
        </button>
      </div>
    </div>
  );
}

function FooterActions({ locale }: { locale: 'ru' | 'en' }) {
  return <AccountFooterMenu locale={locale} />;
}

function EmptySearch({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[11px] border border-dashed border-black/[0.08] bg-black/[0.018] px-4 py-8 text-center text-[12px] text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-white/35">
      {children}
    </div>
  );
}

function MobileBottomItem({
  item,
  active,
}: {
  item: NavigationItem & { shortLabel?: string };
  active: boolean;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      prefetch={false}
      scroll={false}
      className={cn(
        'relative flex h-[44px] flex-col items-center justify-center gap-0.5 rounded-[14px] text-[10px] font-medium transition active:scale-[0.98]',
        active
          ? 'cb-neutral-primary'
          : 'text-muted-foreground hover:bg-foreground/[0.045] hover:text-foreground',
      )}
    >
      <span className="relative">
        <Icon className="size-[16px]" />

        {item.badge && item.badge.toLowerCase() !== 'bot' ? (
          <span className="absolute -right-2.5 -top-2.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-current/10 bg-primary/15 px-1 text-[9px] leading-none text-primary">
            {item.badge}
          </span>
        ) : null}
      </span>

      <span className="max-w-full truncate px-1">
        {item.shortLabel ?? item.label}
      </span>
    </Link>
  );
}

function SidebarContent({
  locale,
  product,
  productHint,
  searchLabel,
  noResultsLabel,
  publicDescription,
  publicPageItem,
  publicPageActive,
  scope,
  profileBackLabel,
  profileBackHref,
  profileGroups,
  selectedMode,
  liveHref,
  demoHref,
  navQuery,
  setNavQuery,
  groups,
  pathname,
  onNavigate,
}: {
  locale: 'ru' | 'en';
  product: string;
  productHint: string;
  searchLabel: string;
  noResultsLabel: string;
  publicDescription: string;
  publicPageItem: NavigationItem;
  publicPageActive: boolean;
  scope: SidebarScope;
  profileBackLabel: string;
  profileBackHref: string;
  profileGroups: NavigationGroup[];
  selectedMode: 'live' | 'demo';
  liveHref: string;
  demoHref: string;
  navQuery: string;
  setNavQuery: (value: string) => void;
  groups: NavigationGroup[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const { settings } = useAppearance();
  const accentColor = accentPalette[settings.accentTone]?.solid;
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-4 pb-3 pt-4">
        <Link
          href={withDashboardDemoParam('/dashboard', selectedMode === 'demo')}
          onClick={onNavigate}
          prefetch={false}
          scroll={false}
          aria-label={product}
          title={product}
          className="flex flex-col items-center justify-center rounded-[12px] py-1.5 transition hover:opacity-85 active:scale-[0.99]"
        >
          <BrandLogo className="w-[164px]" />

          <span className="mt-1 text-[9.5px] text-slate-500 dark:text-white/32">
            {productHint}
          </span>
        </Link>

        <div className="mt-4">
          <SearchField
            value={navQuery}
            onChange={setNavQuery}
            placeholder={searchLabel}
            accentColor={accentColor}
          />
        </div>

        <ModePanel
          locale={locale}
          selectedMode={selectedMode}
          liveHref={liveHref}
          demoHref={demoHref}
          onNavigate={onNavigate}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 pt-1 [scrollbar-width:thin]">
        {scope === 'profile' ? (
          <ProfileScopeContent
            groups={profileGroups}
            pathname={pathname}
            locale={locale}
            backLabel={profileBackLabel}
            backHref={profileBackHref}
            noResultsLabel={noResultsLabel}
            publicDescription={publicDescription}
            publicPageItem={publicPageItem}
            publicPageActive={publicPageActive}
            onNavigate={onNavigate}
          />
        ) : (
          <div>
            <PublicLink
              item={publicPageItem}
              active={publicPageActive}
              description={publicDescription}
              onNavigate={onNavigate}
            />

            <SidebarDivider />

            {groups.length ? (
              <div>
                {groups.map((group, index) => (
                  <div key={group.id}>
                    {index > 0 ? <SidebarDivider /> : null}

                    <NavGroup
                      title={group.title}
                      items={group.items}
                      pathname={pathname}
                      locale={locale}
                      onNavigate={onNavigate}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <EmptySearch>{noResultsLabel}</EmptySearch>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 px-4 py-3">
        <FooterHairline />
        <FooterActions locale={locale} />
      </div>
    </div>
  );
}

function MobileSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 xl:hidden',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      )}
    >
      <div
        className={cn(
          'absolute inset-0 bg-black/28 transition-opacity',
          open ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          'absolute inset-y-0 left-0 w-[min(92vw,356px)] border-r border-black/[0.08] bg-[#f7f6f2] shadow-[0_24px_70px_rgba(15,23,42,0.22)] transition-transform duration-200 dark:border-white/[0.08] dark:bg-[#080808] dark:shadow-[0_28px_80px_rgba(0,0,0,0.55)]',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-black/[0.07] px-3 py-3 dark:border-white/[0.07]">
            <div className="text-[13px] font-semibold tracking-[-0.045em]">
              Меню
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-8 rounded-[9px]"
              onClick={onClose}
              aria-label="Close menu"
            >
              <X className="size-4" />
            </Button>
          </div>

          <div className="min-h-0 flex-1">{children}</div>
        </div>
      </aside>
    </div>
  );
}

type WorkspaceMegaMenuId = 'workspace' | 'booking' | 'clients' | 'manage' | 'support';

type WorkspaceMegaMenuItem = {
  title: string;
  desc: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

type WorkspaceMegaMenuColumn = {
  title: string;
  items: WorkspaceMegaMenuItem[];
};

type WorkspaceMegaMenuPromo = {
  title: string;
  desc: string;
  href: string;
  icon: LucideIcon;
  tone: 'dark' | 'accent' | 'light';
};

type WorkspaceMegaMenu = {
  id: WorkspaceMegaMenuId;
  label: string;
  intro: {
    title: string;
    desc: string;
    cta: string;
    href: string;
    meta: string;
  };
  columns: WorkspaceMegaMenuColumn[];
  promos: WorkspaceMegaMenuPromo[];
};

const workspaceMegaPanelVariants = {
  hidden: {
    opacity: 0,
    y: -12,
    clipPath: 'inset(0% 0% 100% 0%)',
  },
  visible: {
    opacity: 1,
    y: 0,
    clipPath: 'inset(0% 0% 0% 0%)',
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -10,
    clipPath: 'inset(0% 0% 100% 0%)',
    transition: { duration: 0.32, ease: [0.22, 0, 0.36, 1] },
  },
} as const;

const workspaceMegaItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.06 + index * 0.018, duration: 0.44, ease: [0.22, 1, 0.36, 1] },
  }),
} as const;

function buildWorkspaceMegaMenus({
  locale,
  demoMode,
  publicHref,
  unreadEvents,
}: {
  locale: 'ru' | 'en';
  demoMode: boolean;
  publicHref: string;
  unreadEvents: number;
}): WorkspaceMegaMenu[] {
  const href = (path: string) => withDashboardDemoParam(path, demoMode);

  if (locale === 'en') {
    return [
      {
        id: 'workspace',
        label: 'For specialists',
        intro: {
          title: 'A calm operating system for a service business',
          desc: 'Daily schedule, bookings, money, storefront state and urgent client events are grouped like one premium workspace.',
          cta: 'Open overview',
          href: href('/dashboard'),
          meta: demoMode ? 'You are viewing the workspace with demo data.' : 'Live workspace with real bookings and clients.',
        },
        columns: [
          {
            title: 'Start the day',
            items: [
              { title: 'Overview', desc: 'The main control room: today, revenue, next client and storefront readiness.', href: href('/dashboard'), icon: Home },
              { title: 'Calendar', desc: 'A clear week grid with bookings, breaks, blocked slots and free windows.', href: href('/dashboard/today'), icon: CalendarClock },
              { title: 'Analytics', desc: 'Revenue, workload, sources, conversion and repeat booking dynamics.', href: href('/dashboard/stats'), icon: BarChart3 },
            ],
          },
          {
            title: 'Work faster',
            items: [
              { title: 'Chats', desc: 'Telegram, VK and website dialogs connected to booking context.', href: href('/dashboard/chats'), icon: MessageCircleMore, badge: 'bot' },
              { title: 'Events', desc: 'New bookings, reschedules, cancellations and reminders that need attention.', href: href('/dashboard/notifications'), icon: Bell, badge: unreadEvents > 0 ? String(unreadEvents) : undefined },
            ],
          },
        ],
        promos: [
          { title: 'Demo workspace', desc: 'Show the product on filled schedules, clients, chats and charts.', href: withDashboardDemoParam('/dashboard', true), icon: Sparkles, tone: 'dark' },
          { title: 'Client storefront', desc: 'Open the page customers use to choose a service and book a slot.', href: publicHref, icon: Globe2, tone: 'accent' },
        ],
      },
      {
        id: 'booking',
        label: 'Booking online',
        intro: {
          title: 'Let clients book without endless messages',
          desc: 'Services, prices, availability, reminders and templates stay connected to the public booking page.',
          cta: 'Open calendar',
          href: href('/dashboard/today'),
          meta: 'Schedule, breaks and blocked slots control what a client can book.',
        },
        columns: [
          {
            title: 'Storefront',
            items: [
              { title: 'Public page', desc: 'The client-facing page with services, contacts, prices and free slots.', href: publicHref, icon: Globe2 },
              { title: 'Services', desc: 'Catalog, durations, prices and booking availability for each service.', href: href('/dashboard/services'), icon: Package2 },
              { title: 'Availability', desc: 'Working hours, breaks, exceptions and blocked time windows.', href: href('/dashboard/availability'), icon: CalendarRange },
            ],
          },
          {
            title: 'Automation',
            items: [
              { title: 'Templates', desc: 'Saved replies, confirmations and reminders for common client situations.', href: href('/dashboard/templates'), icon: MessageSquareText },
              { title: 'Notifications', desc: 'Control reminders and operational messages for bookings.', href: href('/dashboard/notifications'), icon: Bell },
              { title: 'Channels', desc: 'Telegram, VK, website and source settings for client flow.', href: href('/dashboard/sources'), icon: Send },
            ],
          },
        ],
        promos: [
          { title: 'Create booking', desc: 'Add a client manually and keep the schedule accurate immediately.', href: href('/dashboard/today'), icon: SquarePen, tone: 'dark' },
          { title: 'Ready storefront', desc: 'Check how services, time slots and contacts look for customers.', href: publicHref, icon: ExternalLink, tone: 'light' },
        ],
      },
      {
        id: 'clients',
        label: 'Clients & growth',
        intro: {
          title: 'Keep every client relationship close',
          desc: 'Profiles, visit history, messages, reviews and repeat bookings without heavy CRM complexity.',
          cta: 'Open clients',
          href: href('/dashboard/clients'),
          meta: 'Built for repeat visits, not overloaded enterprise sales pipelines.',
        },
        columns: [
          {
            title: 'Client base',
            items: [
              { title: 'Clients', desc: 'Contacts, visit history, notes, totals and quick client actions.', href: href('/dashboard/clients'), icon: Users2 },
              { title: 'Chats', desc: 'All conversations with the appointment details right next to the dialog.', href: href('/dashboard/chats'), icon: MessageCircleMore },
              { title: 'Reviews', desc: 'Feedback flow and social proof after completed visits.', href: href('/dashboard/reviews'), icon: CheckCircle2 },
            ],
          },
          {
            title: 'Growth',
            items: [
              { title: 'Marketing', desc: 'Public link, channels and repeat-booking touchpoints.', href: href('/dashboard/marketing'), icon: Sparkles },
              { title: 'Statistics', desc: 'Repeat rate, conversion, source performance and revenue dynamics.', href: href('/dashboard/stats'), icon: BarChart3 },
            ],
          },
        ],
        promos: [
          { title: 'Smart chats', desc: 'Answer faster because the client card and booking context stay nearby.', href: href('/dashboard/chats'), icon: Bot, tone: 'accent' },
          { title: 'Repeat visits', desc: 'Find clients who should be invited back at the right moment.', href: href('/dashboard/stats'), icon: Users2, tone: 'light' },
        ],
      },
      {
        id: 'manage',
        label: 'Platform',
        intro: {
          title: 'Settings without a heavy sidebar',
          desc: 'Profile, visual system, subscription, integrations and support are collected in one quiet place.',
          cta: 'Open profile',
          href: href('/dashboard/profile'),
          meta: 'The top menu replaces desktop sidebar, while mobile navigation stays safe.',
        },
        columns: [
          {
            title: 'Workspace',
            items: [
              { title: 'Profile', desc: 'Name, specialization, contacts and public page data.', href: href('/dashboard/profile'), icon: SquarePen },
              { title: 'Appearance', desc: 'Theme, accent color, density, radius and page width.', href: href('/dashboard/appearance'), icon: LayoutPanelTop },
              { title: 'Subscription', desc: 'Plan, access, payments and limits.', href: href('/dashboard/subscription'), icon: WalletCards },
            ],
          },
          {
            title: 'System',
            items: [
              { title: 'Integrations', desc: 'External services and connection status.', href: href('/dashboard/integrations'), icon: Settings2 },
              { title: 'Limits', desc: 'Usage, quotas and technical boundaries for the workspace.', href: href('/dashboard/limits'), icon: SlidersHorizontal },
              { title: 'Help', desc: 'FAQ, support and product guidance.', href: href('/dashboard/profile'), icon: LifeBuoy },
            ],
          },
        ],
        promos: [
          { title: 'Live mode', desc: 'Switch back to real workspace data without changing navigation.', href: withDashboardDemoParam('/dashboard', false), icon: CheckCircle2, tone: 'dark' },
          { title: 'Design system', desc: 'Keep the product consistent from one settings screen.', href: href('/dashboard/appearance'), icon: LayoutPanelTop, tone: 'light' },
        ],
      },

      {
        id: 'support',
        label: 'Help',
        intro: {
          title: 'Help, reports and contact in one place',
          desc: 'Quick instructions, bug reports, product ideas and direct contact actions are grouped without returning to the old sidebar.',
          cta: 'Open help',
          href: href('/dashboard/profile'),
          meta: 'Use this when something is broken, unclear, or you want to send a product idea.',
        },
        columns: [
          {
            title: 'Help',
            items: [
              { title: 'Quick instructions', desc: 'Core setup steps: profile, services, availability and storefront.', href: href('/dashboard/profile'), icon: LifeBuoy },
              { title: 'Robo assistant', desc: 'Open the workspace assistant and ask what to do next.', href: href('/dashboard'), icon: Bot, badge: 'bot' },
              { title: 'Platform status', desc: 'Check workspace mode, limits, integrations and current state.', href: href('/dashboard/limits'), icon: CheckCircle2 },
            ],
          },
          {
            title: 'Feedback',
            items: [
              { title: 'Report a bug', desc: 'Something is broken, not saved or looks wrong on this screen.', href: href('/dashboard/profile'), icon: Bug },
              { title: 'Send an idea', desc: 'Suggest a feature, workflow or visual improvement.', href: href('/dashboard/profile'), icon: Sparkles },
              { title: 'Ask a question', desc: 'Send a question with the current screen context.', href: href('/dashboard/profile'), icon: HelpCircle },
            ],
          },
        ],
        promos: [
          { title: 'Contact me', desc: 'Leave Telegram, email or phone so support can reply normally.', href: href('/dashboard/profile'), icon: MessageCircleMore, tone: 'dark' },
          { title: 'Support report', desc: 'The old sidebar feedback logic is now adapted for the top menu flow.', href: href('/dashboard/profile'), icon: Send, tone: 'light' },
        ],
      },
    ];
  }

  return [
    {
      id: 'workspace',
      label: 'Для мастеров',
      intro: {
        title: 'Спокойная операционная система для бизнеса услуг',
        desc: 'Расписание, записи, деньги, витрина и срочные события клиента собраны в одном премиальном рабочем пространстве.',
        cta: 'Открыть обзор',
        href: href('/dashboard'),
        meta: demoMode ? 'Сейчас включены демо-данные для показа продукта.' : 'Рабочий кабинет с реальными записями и клиентами.',
      },
      columns: [
        {
          title: 'Начало дня',
          items: [
            { title: 'Обзор', desc: 'Главный пульт: сегодня, выручка, ближайший клиент и готовность витрины.', href: href('/dashboard'), icon: Home },
            { title: 'Календарь', desc: 'Неделя, записи, перерывы, блокировки и свободные окна без хаоса.', href: href('/dashboard/today'), icon: CalendarClock },
            { title: 'Аналитика', desc: 'Выручка, загрузка, источники, конверсия и повторные записи.', href: href('/dashboard/stats'), icon: BarChart3 },
          ],
        },
        {
          title: 'Быстрая работа',
          items: [
            { title: 'Чаты', desc: 'Диалоги из Telegram, VK и сайта с контекстом записи.', href: href('/dashboard/chats'), icon: MessageCircleMore, badge: 'bot' },
            { title: 'События', desc: 'Новые записи, переносы, отмены и напоминания, на которые нужно ответить.', href: href('/dashboard/notifications'), icon: Bell, badge: unreadEvents > 0 ? String(unreadEvents) : undefined },
          ],
        },
      ],
      promos: [
        { title: 'Демо-кабинет', desc: 'Покажите продукт на заполненных расписаниях, клиентах, чатах и графиках.', href: withDashboardDemoParam('/dashboard', true), icon: Sparkles, tone: 'dark' },
        { title: 'Клиентская витрина', desc: 'Откройте страницу, где клиент выбирает услугу и записывается сам.', href: publicHref, icon: Globe2, tone: 'accent' },
      ],
    },
    {
      id: 'booking',
      label: 'Онлайн-запись',
      intro: {
        title: 'Клиент записывается без бесконечной переписки',
        desc: 'Услуги, цены, доступность, напоминания и шаблоны связаны с публичной страницей записи.',
        cta: 'Открыть календарь',
        href: href('/dashboard/today'),
        meta: 'График, перерывы и блокировки определяют, что клиент может забронировать.',
      },
      columns: [
        {
          title: 'Витрина',
          items: [
            { title: 'Публичная страница', desc: 'Страница клиента с услугами, контактами, ценами и свободным временем.', href: publicHref, icon: Globe2 },
            { title: 'Услуги', desc: 'Каталог, длительность, стоимость и доступность каждой услуги.', href: href('/dashboard/services'), icon: Package2 },
            { title: 'Доступность', desc: 'Рабочие часы, перерывы, исключения и заблокированные окна.', href: href('/dashboard/availability'), icon: CalendarRange },
          ],
        },
        {
          title: 'Автоматизация',
          items: [
            { title: 'Шаблоны', desc: 'Готовые ответы, подтверждения и сообщения для частых ситуаций.', href: href('/dashboard/templates'), icon: MessageSquareText },
            { title: 'Уведомления', desc: 'Напоминания и рабочие события по записям.', href: href('/dashboard/notifications'), icon: Bell },
            { title: 'Каналы', desc: 'Telegram, VK, сайт и источники клиентского потока.', href: href('/dashboard/sources'), icon: Send },
          ],
        },
      ],
      promos: [
        { title: 'Новая запись', desc: 'Добавьте клиента вручную и сразу занесите его в расписание.', href: href('/dashboard/today'), icon: SquarePen, tone: 'dark' },
        { title: 'Готовая витрина', desc: 'Проверьте, как услуги, слоты и контакты выглядят для клиента.', href: publicHref, icon: ExternalLink, tone: 'light' },
      ],
    },
    {
      id: 'clients',
      label: 'Клиенты и рост',
      intro: {
        title: 'Каждый клиент остаётся рядом',
        desc: 'Профили, история визитов, сообщения, отзывы и повторные записи без тяжёлой CRM.',
        cta: 'Открыть клиентов',
        href: href('/dashboard/clients'),
        meta: 'Сделано под повторные визиты, а не под перегруженные enterprise-воронки.',
      },
      columns: [
        {
          title: 'Клиентская база',
          items: [
            { title: 'Клиенты', desc: 'Контакты, история визитов, заметки, суммы и быстрые действия.', href: href('/dashboard/clients'), icon: Users2 },
            { title: 'Чаты', desc: 'Все диалоги, где карточка клиента и запись всегда рядом.', href: href('/dashboard/chats'), icon: MessageCircleMore },
            { title: 'Отзывы', desc: 'Обратная связь и социальное доказательство после визита.', href: href('/dashboard/reviews'), icon: CheckCircle2 },
          ],
        },
        {
          title: 'Рост',
          items: [
            { title: 'Продвижение', desc: 'Публичная ссылка, каналы и точки возврата клиента.', href: href('/dashboard/marketing'), icon: Sparkles },
            { title: 'Статистика', desc: 'Повторы, конверсия, источники и динамика выручки.', href: href('/dashboard/stats'), icon: BarChart3 },
          ],
        },
      ],
      promos: [
        { title: 'Умные чаты', desc: 'Отвечайте быстрее: рядом всегда запись и карточка клиента.', href: href('/dashboard/chats'), icon: Bot, tone: 'accent' },
        { title: 'Повторные визиты', desc: 'Находите клиентов, которым пора предложить новую запись.', href: href('/dashboard/stats'), icon: Users2, tone: 'light' },
      ],
    },
    {
      id: 'manage',
      label: 'Платформа',
      intro: {
        title: 'Настройки без тяжёлого сайдбара',
        desc: 'Профиль, визуальная система, подписка, интеграции и поддержка собраны в одном спокойном месте.',
        cta: 'Открыть профиль',
        href: href('/dashboard/profile'),
        meta: 'Верхнее меню заменяет desktop sidebar, а мобильная навигация остаётся безопасной.',
      },
      columns: [
        {
          title: 'Кабинет',
          items: [
            { title: 'Профиль', desc: 'Имя, специализация, контакты и данные публичной страницы.', href: href('/dashboard/profile'), icon: SquarePen },
            { title: 'Внешний вид', desc: 'Тема, акцент, плотность, радиусы и ширина страниц.', href: href('/dashboard/appearance'), icon: LayoutPanelTop },
            { title: 'Подписка', desc: 'Тариф, доступ, платежи и лимиты.', href: href('/dashboard/subscription'), icon: WalletCards },
          ],
        },
        {
          title: 'Система',
          items: [
            { title: 'Интеграции', desc: 'Внешние сервисы и статус подключений.', href: href('/dashboard/integrations'), icon: Settings2 },
            { title: 'Лимиты', desc: 'Использование, квоты и технические ограничения кабинета.', href: href('/dashboard/limits'), icon: SlidersHorizontal },
            { title: 'Помощь', desc: 'FAQ, поддержка и быстрые инструкции по продукту.', href: href('/dashboard/profile'), icon: LifeBuoy },
          ],
        },
      ],
      promos: [
        { title: 'Рабочий режим', desc: 'Вернуться к реальным данным без смены навигации.', href: withDashboardDemoParam('/dashboard', false), icon: CheckCircle2, tone: 'dark' },
        { title: 'Дизайн-система', desc: 'Держите весь продукт в едином стиле из одного экрана настроек.', href: href('/dashboard/appearance'), icon: LayoutPanelTop, tone: 'light' },
      ],
    },

    {
      id: 'support',
      label: 'Помощь',
      intro: {
        title: 'Помощь, репорт и связь в одном месте',
        desc: 'Инструкции, сообщения об ошибках, идеи и связь со мной собраны в отдельном верхнем меню без старого сайдбара.',
        cta: 'Открыть помощь',
        href: href('/dashboard/profile'),
        meta: 'Используйте, если что-то сломалось, непонятно или хочется предложить улучшение.',
      },
      columns: [
        {
          title: 'Помощь',
          items: [
            { title: 'Быстрые инструкции', desc: 'Основные шаги: профиль, услуги, график и публичная витрина.', href: href('/dashboard/profile'), icon: LifeBuoy },
            { title: 'Робо-помощник', desc: 'Откройте ассистента кабинета и спросите, что делать дальше.', href: href('/dashboard'), icon: Bot, badge: 'bot' },
            { title: 'Статус платформы', desc: 'Режим кабинета, лимиты, интеграции и текущее состояние.', href: href('/dashboard/limits'), icon: CheckCircle2 },
          ],
        },
        {
          title: 'Обратная связь',
          items: [
            { title: 'Сообщить об ошибке', desc: 'Что-то сломалось, не сохраняется или странно выглядит на экране.', href: href('/dashboard/profile'), icon: Bug },
            { title: 'Предложить идею', desc: 'Фича, сценарий, визуальное улучшение или пожелание по продукту.', href: href('/dashboard/profile'), icon: Sparkles },
            { title: 'Задать вопрос', desc: 'Вопрос по текущему экрану, настройке или логике кабинета.', href: href('/dashboard/profile'), icon: HelpCircle },
          ],
        },
      ],
      promos: [
        { title: 'Связь со мной', desc: 'Оставьте Telegram, email или телефон, чтобы можно было нормально ответить.', href: href('/dashboard/profile'), icon: MessageCircleMore, tone: 'dark' },
        { title: 'Репорт в поддержку', desc: 'Логика старого меню связи адаптирована под верхнее меню.', href: href('/dashboard/profile'), icon: Send, tone: 'light' },
      ],
    },
  ];
}

function getWorkspaceMegaPanelMinHeight(_menu: WorkspaceMegaMenu) {
  return 452;
}

function WorkspaceMegaItemLink({ item, index, onNavigate }: { item: WorkspaceMegaMenuItem; index: number; onNavigate: () => void }) {
  const Icon = item.icon;

  return (
    <motion.div custom={index} variants={workspaceMegaItemVariants} initial="hidden" animate="visible">
      <Link
        href={item.href}
        onClick={onNavigate}
        prefetch={false}
        scroll={false}
        className={cn(
          'group/item relative flex min-h-[64px] gap-3 rounded-[18px] border border-transparent px-3 py-3 outline-none transition-all duration-200',
          'hover:border-black/[0.06] hover:bg-white/[0.44] focus-visible:border-black/[0.12] focus-visible:bg-white/[0.52]',
          'dark:hover:border-white/[0.11] dark:hover:bg-white/[0.05] dark:focus-visible:border-white/[0.16] dark:focus-visible:bg-white/[0.07]',
        )}
      >
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] border border-black/[0.06] bg-black/[0.03] text-black/56 transition-all duration-200 group-hover/item:border-black/[0.10] group-hover/item:bg-black/[0.94] group-hover/item:text-white dark:border-white/[0.09] dark:bg-white/[0.04] dark:text-white/60 dark:group-hover/item:border-white/[0.16] dark:group-hover/item:bg-white dark:group-hover/item:text-black">
          <Icon className="h-4 w-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-[13px] font-semibold leading-5 tracking-[-0.024em] text-black/86 dark:text-white/88">
            {item.title}
            {item.badge ? (
              <span className="rounded-full border border-black/[0.07] bg-black/[0.03] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-black/40 dark:border-white/[0.10] dark:bg-white/[0.05] dark:text-white/42">
                {item.badge}
              </span>
            ) : null}
          </span>

          <span className="mt-1 block max-w-[360px] text-[11.5px] leading-[1.5] text-black/44 transition-colors group-hover/item:text-black/64 dark:text-white/38 dark:group-hover/item:text-white/62">
            {item.desc}
          </span>
        </span>

        <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-black/0 transition-all duration-300 group-hover/item:bg-black/[0.045] group-hover/item:text-black/38 dark:group-hover/item:bg-white/[0.06] dark:group-hover/item:text-white/45">
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5" />
        </span>
      </Link>
    </motion.div>
  );
}

function WorkspaceMegaPromoCard({ promo, index, onNavigate }: { promo: WorkspaceMegaMenuPromo; index: number; onNavigate: () => void }) {
  const Icon = promo.icon;
  const moreLabel = /^[A-Za-z]/.test(promo.title) ? 'Open' : 'Открыть';

  return (
    <motion.div custom={index} variants={workspaceMegaItemVariants} initial="hidden" animate="visible">
      <Link
        href={promo.href}
        onClick={onNavigate}
        prefetch={false}
        scroll={false}
        className="group/promo relative block overflow-hidden rounded-[20px] border border-black/[0.06] bg-white/[0.36] p-4 text-black transition-all duration-200 hover:border-black/[0.11] hover:bg-white/[0.54] dark:border-white/[0.09] dark:bg-white/[0.035] dark:text-white dark:hover:border-white/[0.14] dark:hover:bg-white/[0.06]"
      >
        <span className="relative z-10 flex items-start justify-between gap-4">
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold tracking-[-0.02em]">{promo.title}</span>
            <span className="mt-2 block text-[11.5px] leading-[1.55] text-black/48 dark:text-white/48">
              {promo.desc}
            </span>
          </span>

          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] border border-black/[0.07] bg-black/[0.04] text-black/58 transition group-hover/promo:bg-black group-hover/promo:text-white dark:border-white/[0.10] dark:bg-white/[0.055] dark:text-white/58 dark:group-hover/promo:bg-white dark:group-hover/promo:text-black">
            <Icon className="h-4.5 w-4.5" />
          </span>
        </span>

        <span className="relative z-10 mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-black/45 dark:text-white/45">
          {moreLabel}
          <ArrowRight className="h-3 w-3 transition-transform group-hover/promo:translate-x-0.5" />
        </span>
      </Link>
    </motion.div>
  );
}


function WorkspaceSupportMegaPanel({
  menu,
  pathname,
  locale,
  onNavigate,
}: {
  menu: WorkspaceMegaMenu;
  pathname: string;
  locale: 'ru' | 'en';
  onNavigate: () => void;
}) {
  const [category, setCategory] = useState<ReportCategory>('bug');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [priority, setPriority] = useState<'later' | 'normal' | 'urgent'>('normal');
  const [includePage, setIncludePage] = useState(true);
  const [replyNeeded, setReplyNeeded] = useState(true);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorText, setErrorText] = useState('');
  const isEnglish = locale === 'en';

  const copy = isEnglish
    ? {
        eyebrow: 'Feedback',
        title: 'Send feedback without leaving the page',
        desc: 'Choose the type, describe what happened and leave a contact if you want a reply. The current screen can be attached automatically.',
        pathLabel: 'Current screen',
        messageLabel: 'Message',
        messagePlaceholder: 'Describe the issue, idea or question...',
        contactLabel: 'Reply contact',
        contactPlaceholder: '@telegram, email or phone',
        send: 'Send feedback',
        sending: 'Sending...',
        sent: 'Sent. I will check it.',
        validation: 'Write at least 8 characters.',
        error: 'Could not send. Check /api/support/report and env.',
        details: 'What will be sent',
        detailsText: 'Type, message, contact, current page and browser info.',
        replyTitle: 'Direct contact',
        replyText: 'Leave Telegram, email or phone in the field and I will have a normal way to answer.',
        quickTitle: 'Quick start',
        contextTitle: 'Report options',
        includePage: 'Attach current screen',
        replyNeeded: 'I need a reply',
        priorityLabel: 'Priority',
        priorities: {
          later: 'Later',
          normal: 'Normal',
          urgent: 'Urgent',
        },
        categories: {
          bug: ['Bug report', 'Something is broken or looks wrong.'],
          idea: ['Product idea', 'Feature, scenario or visual improvement.'],
          question: ['Question', 'Something is unclear in this screen.'],
        },
        quicks: {
          bug: ['Does not save', 'Visual issue', 'Booking problem'],
          idea: ['Improve this screen', 'New scenario', 'Automation idea'],
          question: ['How to set it up?', 'Where can I find it?', 'What should I choose?'],
        },
      }
    : {
        eyebrow: 'Обратная связь',
        title: 'Напишите мне прямо из меню',
        desc: 'Выберите тип обращения, опишите ситуацию и оставьте контакт для ответа. Текущий экран можно прикрепить автоматически.',
        pathLabel: 'Текущий экран',
        messageLabel: 'Сообщение',
        messagePlaceholder: 'Опишите ошибку, идею или вопрос...',
        contactLabel: 'Куда ответить',
        contactPlaceholder: '@telegram, email или телефон',
        send: 'Отправить',
        sending: 'Отправляю...',
        sent: 'Отправлено. Я посмотрю.',
        validation: 'Напишите минимум 8 символов.',
        error: 'Не удалось отправить. Проверь /api/support/report и env.',
        details: 'Что уйдёт в репорт',
        detailsText: 'Тип обращения, сообщение, контакт, текущая страница и данные браузера.',
        replyTitle: 'Связь со мной',
        replyText: 'Оставьте Telegram, email или телефон в поле, чтобы я мог нормально ответить.',
        quickTitle: 'Быстрый старт',
        contextTitle: 'Параметры репорта',
        includePage: 'Прикрепить текущий экран',
        replyNeeded: 'Нужен ответ',
        priorityLabel: 'Срочность',
        priorities: {
          later: 'Потом',
          normal: 'Обычно',
          urgent: 'Срочно',
        },
        categories: {
          bug: ['Сообщить об ошибке', 'Что-то сломалось или выглядит странно.'],
          idea: ['Предложить идею', 'Фича, сценарий или визуальное улучшение.'],
          question: ['Задать вопрос', 'Непонятно по экрану или настройке.'],
        },
        quicks: {
          bug: ['Не сохраняется', 'Визуальный баг', 'Проблема с записью'],
          idea: ['Улучшить экран', 'Новый сценарий', 'Автоматизация'],
          question: ['Как настроить?', 'Где найти?', 'Что лучше выбрать?'],
        },
      };

  const categories: Array<{ id: ReportCategory; icon: LucideIcon }> = [
    { id: 'bug', icon: Bug },
    { id: 'idea', icon: Sparkles },
    { id: 'question', icon: HelpCircle },
  ];

  const priorities: Array<'later' | 'normal' | 'urgent'> = ['later', 'normal', 'urgent'];
  const messageLength = message.trim().length;

  const appendQuickText = (value: string) => {
    setMessage((current) => {
      const prefix = current.trim();
      if (!prefix) return value + ': ';
      if (prefix.includes(value)) return current;
      return `${current.trim()}
${value}: `;
    });

    if (status === 'error') {
      setStatus('idle');
      setErrorText('');
    }
  };

  const handleSend = async () => {
    const cleanMessage = message.trim();

    if (cleanMessage.length < 8) {
      setStatus('error');
      setErrorText(copy.validation);
      return;
    }

    try {
      setStatus('sending');
      setErrorText('');

      const response = await fetch('/api/support/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          priority,
          includePage,
          replyNeeded,
          message: cleanMessage,
          contact: contact.trim(),
          path: includePage ? pathname : undefined,
          locale,
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
        }),
      });

      if (!response.ok) throw new Error('Failed to send report');

      setStatus('success');
      setMessage('');
      setContact('');
      setPriority('normal');
    } catch {
      setStatus('error');
      setErrorText(copy.error);
    }
  };

  return (
    <motion.div
      variants={workspaceMegaPanelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute left-0 right-0 top-[72px] z-10 overflow-hidden bg-transparent text-black dark:text-white"
      style={{ minHeight: getWorkspaceMegaPanelMinHeight(menu) }}
    >
      <motion.div
        key="support-feedback-panel"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        className="relative grid grid-cols-[280px_minmax(0,1fr)_280px] gap-0 px-5 pb-5 pt-4"
      >
        <section className="pr-5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/32 dark:text-white/34">{copy.eyebrow}</div>
          <h3 className="mt-3 max-w-[230px] text-[24px] font-semibold leading-[1.04] tracking-[-0.06em] text-black dark:text-white">
            {copy.title}
          </h3>
          <p className="mt-3 max-w-[238px] text-[12px] leading-5 text-black/50 dark:text-white/48">
            {copy.desc}
          </p>
          <div className="mt-5 rounded-[18px] border border-black/[0.06] bg-black/[0.025] p-3 dark:border-white/[0.08] dark:bg-white/[0.035]">
            <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-black/30 dark:text-white/32">{copy.pathLabel}</div>
            <div className="mt-1 truncate text-[12px] font-semibold tracking-[-0.02em] text-black/72 dark:text-white/72">{pathname}</div>
          </div>
        </section>

        <section className="border-x border-black/[0.06] px-5 dark:border-white/[0.08]">
          <div className="grid grid-cols-3 gap-2">
            {categories.map(({ id, icon: Icon }) => {
              const active = category === id;
              const [title, desc] = copy.categories[id];

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setCategory(id);
                    if (status === 'error') {
                      setStatus('idle');
                      setErrorText('');
                    }
                  }}
                  className={cn(
                    'group/category min-h-[86px] rounded-[19px] border p-3.5 text-left transition-all duration-200',
                    active
                      ? 'border-black/[0.16] bg-black text-white dark:border-white/[0.22] dark:bg-white dark:text-black'
                      : 'border-black/[0.07] bg-white/[0.32] text-black hover:border-black/[0.12] hover:bg-white/[0.48] dark:border-white/[0.09] dark:bg-white/[0.035] dark:text-white dark:hover:border-white/[0.14] dark:hover:bg-white/[0.06]',
                  )}
                >
                  <span className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-[13px] border transition',
                    active
                      ? 'border-white/20 bg-white/12 text-white dark:border-black/15 dark:bg-black/10 dark:text-black'
                      : 'border-black/[0.08] bg-black/[0.035] text-black/58 dark:border-white/[0.10] dark:bg-white/[0.055] dark:text-white/58',
                  )}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="mt-2.5 block text-[12.5px] font-semibold tracking-[-0.02em]">{title}</span>
                  <span className={cn('mt-1 block text-[10.5px] leading-4', active ? 'text-white/62 dark:text-black/58' : 'text-black/42 dark:text-white/40')}>
                    {desc}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_230px] gap-3">
            <div className="min-w-0">
              <div className="mb-1.5 flex items-center justify-between px-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/32 dark:text-white/34">{copy.quickTitle}</span>
                <span className="text-[10px] font-semibold text-black/28 dark:text-white/28">{messageLength}/500</span>
              </div>

              <div className="mb-2 flex flex-wrap gap-1.5">
                {copy.quicks[category].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => appendQuickText(quick)}
                    className="inline-flex h-7 items-center rounded-full border border-black/[0.07] bg-white/[0.30] px-2.5 text-[10.5px] font-semibold text-black/52 transition hover:border-black/[0.12] hover:bg-white/[0.48] hover:text-black dark:border-white/[0.09] dark:bg-white/[0.035] dark:text-white/48 dark:hover:border-white/[0.14] dark:hover:bg-white/[0.06] dark:hover:text-white"
                  >
                    {quick}
                  </button>
                ))}
              </div>

              <label className="block">
                <span className="sr-only">{copy.messageLabel}</span>
                <textarea
                  value={message}
                  onChange={(event) => {
                    setMessage(event.target.value.slice(0, 500));
                    if (status === 'error') {
                      setStatus('idle');
                      setErrorText('');
                    }
                  }}
                  placeholder={copy.messagePlaceholder}
                  rows={5}
                  className="h-[124px] w-full resize-none rounded-[20px] border border-black/[0.07] bg-white/[0.34] px-4 py-3 text-[12.5px] leading-5 text-black outline-none transition placeholder:text-black/30 focus:border-black/[0.14] focus:bg-white/[0.52] dark:border-white/[0.09] dark:bg-white/[0.035] dark:text-white dark:placeholder:text-white/26 dark:focus:border-white/[0.16] dark:focus:bg-white/[0.06]"
                />
              </label>
            </div>

            <div className="flex flex-col gap-2.5">
              <div>
                <div className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/32 dark:text-white/34">{copy.priorityLabel}</div>
                <div className="grid grid-cols-3 gap-1 rounded-[16px] border border-black/[0.07] bg-white/[0.25] p-1 dark:border-white/[0.09] dark:bg-white/[0.025]">
                  {priorities.map((item) => {
                    const active = priority === item;
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPriority(item)}
                        className={cn(
                          'h-8 rounded-[12px] text-[10.5px] font-semibold transition',
                          active
                            ? 'bg-black text-white dark:bg-white dark:text-black'
                            : 'text-black/42 hover:bg-white/[0.42] hover:text-black dark:text-white/40 dark:hover:bg-white/[0.06] dark:hover:text-white',
                        )}
                      >
                        {copy.priorities[item]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[16px] border border-black/[0.07] bg-white/[0.25] p-1.5 dark:border-white/[0.09] dark:bg-white/[0.025]">
                {[
                  { checked: includePage, setChecked: setIncludePage, label: copy.includePage },
                  { checked: replyNeeded, setChecked: setReplyNeeded, label: copy.replyNeeded },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => item.setChecked(!item.checked)}
                    className="flex h-8 w-full items-center gap-2 rounded-[12px] px-2 text-left text-[11px] font-semibold text-black/56 transition hover:bg-white/[0.40] hover:text-black dark:text-white/48 dark:hover:bg-white/[0.06] dark:hover:text-white"
                  >
                    <span className={cn(
                      'flex h-4 w-4 items-center justify-center rounded-[6px] border transition',
                      item.checked
                        ? 'border-black bg-black text-white dark:border-white dark:bg-white dark:text-black'
                        : 'border-black/[0.14] text-transparent dark:border-white/[0.16]',
                    )}>
                      <Check className="h-3 w-3" />
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>

              <label className="block">
                <span className="mb-1.5 block px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/32 dark:text-white/34">{copy.contactLabel}</span>
                <input
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  placeholder={copy.contactPlaceholder}
                  className="h-10 w-full rounded-[15px] border border-black/[0.07] bg-white/[0.34] px-3 text-[12px] text-black outline-none transition placeholder:text-black/30 focus:border-black/[0.14] focus:bg-white/[0.52] dark:border-white/[0.09] dark:bg-white/[0.035] dark:text-white dark:placeholder:text-white/26 dark:focus:border-white/[0.16] dark:focus:bg-white/[0.06]"
                />
              </label>

              <button
                type="button"
                onClick={handleSend}
                disabled={status === 'sending'}
                className={cn(
                  'inline-flex h-10 items-center justify-center gap-2 rounded-[15px] bg-black px-4 text-[12.5px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#111827] active:scale-[0.985] dark:bg-white dark:text-black dark:hover:bg-white/90',
                  status === 'sending' && 'pointer-events-none opacity-70',
                )}
              >
                {status === 'sending' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {status === 'sending' ? copy.sending : copy.send}
              </button>

              {status === 'success' ? (
                <div className="rounded-[14px] border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                  {copy.sent}
                </div>
              ) : null}

              {status === 'error' && errorText ? (
                <div className="rounded-[14px] border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] font-semibold text-red-700 dark:text-red-300">
                  {errorText}
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <aside className="pl-5">
          <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-black/32 dark:text-white/34">{isEnglish ? 'Actions' : 'Действия'}</div>

          <div className="space-y-3">
            <div className="rounded-[20px] border border-black/[0.06] bg-white/[0.32] p-4 dark:border-white/[0.09] dark:bg-white/[0.035]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[13px] font-semibold tracking-[-0.02em] text-black dark:text-white">{copy.details}</div>
                  <p className="mt-2 text-[11.5px] leading-5 text-black/48 dark:text-white/48">{copy.detailsText}</p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] border border-black/[0.07] bg-black/[0.04] text-black/58 dark:border-white/[0.10] dark:bg-white/[0.055] dark:text-white/58">
                  <MessageSquareText className="h-4 w-4" />
                </span>
              </div>
            </div>

            <div className="rounded-[20px] border border-black/[0.06] bg-white/[0.32] p-4 dark:border-white/[0.09] dark:bg-white/[0.035]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[13px] font-semibold tracking-[-0.02em] text-black dark:text-white">{copy.replyTitle}</div>
                  <p className="mt-2 text-[11.5px] leading-5 text-black/48 dark:text-white/48">{copy.replyText}</p>
                </div>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] border border-black/[0.07] bg-black/[0.04] text-black/58 dark:border-white/[0.10] dark:bg-white/[0.055] dark:text-white/58">
                  <MessageCircleMore className="h-4 w-4" />
                </span>
              </div>
            </div>
          </div>
        </aside>
      </motion.div>
    </motion.div>
  );
}

function WorkspaceMegaPanel({
  menu,
  pathname,
  locale,
  onNavigate,
}: {
  menu: WorkspaceMegaMenu;
  pathname: string;
  locale: 'ru' | 'en';
  onNavigate: () => void;
}) {
  if (menu.id === 'support') {
    return <WorkspaceSupportMegaPanel menu={menu} pathname={pathname} locale={locale} onNavigate={onNavigate} />;
  }

  let itemIndex = 0;
  const isEnglish = /^[A-Za-z]/.test(menu.label);
  const quickLabel = isEnglish ? 'Quick actions' : 'Быстрые действия';

  return (
    <motion.div
      variants={workspaceMegaPanelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="absolute left-0 right-0 top-[72px] z-10 overflow-hidden bg-transparent text-black dark:text-white"
      style={{ minHeight: getWorkspaceMegaPanelMinHeight(menu) }}
    >
      <motion.div
        key={menu.id}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        className="relative grid grid-cols-[260px_minmax(0,1fr)_250px] gap-0 px-5 pb-5 pt-4"
      >
        <section className="pr-5">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/32 dark:text-white/34">{menu.label}</div>
          <h3 className="mt-3 max-w-[220px] text-[24px] font-semibold leading-[1.04] tracking-[-0.06em] text-black dark:text-white">
            {menu.intro.title}
          </h3>
          <p className="mt-3 max-w-[228px] text-[12px] leading-5 text-black/50 dark:text-white/48">
            {menu.intro.desc}
          </p>

          <Link
            href={menu.intro.href}
            onClick={onNavigate}
            prefetch={false}
            scroll={false}
            className="group/cta mt-5 inline-flex h-10 w-fit items-center gap-2.5 rounded-full border border-black/[0.07] bg-white/[0.42] px-4 text-[12px] font-semibold text-black transition-all hover:-translate-y-0.5 hover:border-black/[0.12] hover:bg-white/[0.65] dark:border-white/[0.09] dark:bg-white/[0.05] dark:text-white dark:hover:border-white/[0.14] dark:hover:bg-white/[0.08]"
          >
            {menu.intro.cta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5" />
          </Link>

          <p className="mt-5 max-w-[230px] text-[11px] leading-5 text-black/42 dark:text-white/42">{menu.intro.meta}</p>
        </section>

        <div className={cn('grid gap-x-6 gap-y-3 border-x border-black/[0.06] px-5 dark:border-white/[0.08]', menu.columns.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
          {menu.columns.map((column) => (
            <section key={column.title} className="min-w-0">
              <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-black/32 dark:text-white/34">{column.title}</div>
              <div className="space-y-1">
                {column.items.map((item) => {
                  const currentIndex = itemIndex++;
                  return <WorkspaceMegaItemLink key={item.title} item={item} index={currentIndex} onNavigate={onNavigate} />;
                })}
              </div>
            </section>
          ))}
        </div>

        <aside className="pl-5">
          <div className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-black/32 dark:text-white/34">{quickLabel}</div>
          <div className="space-y-3">
            {menu.promos.map((promo) => {
              const currentIndex = itemIndex++;
              return <WorkspaceMegaPromoCard key={promo.title} promo={promo} index={currentIndex} onNavigate={onNavigate} />;
            })}
          </div>
        </aside>
      </motion.div>
    </motion.div>
  );
}

function WorkspaceTopMegaNav({
  menus,
  pathname,
  demoMode,
  liveHref,
  demoHref,
  publicPageItem,
  publicPageActive,
  workspaceUnreadEvents,
  eventPanelOpen,
  onToggleEvents,
  labels,
}: {
  menus: WorkspaceMegaMenu[];
  pathname: string;
  demoMode: boolean;
  liveHref: string;
  demoHref: string;
  publicPageItem: NavigationItem;
  publicPageActive: boolean;
  workspaceUnreadEvents: number;
  eventPanelOpen: boolean;
  onToggleEvents: () => void;
  labels: {
    product: string;
    items: Record<string, string>;
  };
}) {
  const [activeMenuId, setActiveMenuId] = useState<WorkspaceMegaMenuId | null>(null);
  const [mounted, setMounted] = useState(false);
  const activeMenu = menus.find((menu) => menu.id === activeMenuId) ?? null;
  const supportMenu = menus.find((menu) => menu.id === 'support') ?? null;
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { theme, setTheme } = useTheme();
  const { locale: currentLocale, setLocale } = useLocale();

  const clearMenuTimers = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  }, []);

  const closeMenu = useCallback(() => {
    clearMenuTimers();
    setActiveMenuId(null);
  }, [clearMenuTimers]);

  const scheduleCloseMenu = useCallback(() => {
    clearMenuTimers();
    closeTimerRef.current = setTimeout(() => setActiveMenuId(null), 260);
  }, [clearMenuTimers]);

  const scheduleOpenMenu = useCallback((menuId: WorkspaceMegaMenuId) => {
    if (activeMenuId === menuId) {
      clearMenuTimers();
      return;
    }

    clearMenuTimers();
    setActiveMenuId(menuId);
  }, [activeMenuId, clearMenuTimers]);

  const openMenu = useCallback((menuId: WorkspaceMegaMenuId) => {
    clearMenuTimers();
    setActiveMenuId(menuId);
  }, [clearMenuTimers]);

  useEffect(() => {
    setMounted(true);
    return () => clearMenuTimers();
  }, [clearMenuTimers]);

  useEffect(() => {
    if (!activeMenuId) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeMenuId, closeMenu]);

  const currentTheme = mounted ? ((theme || 'system') as ThemeOption) : 'system';
  const nextTheme: ThemeOption = currentTheme === 'dark' ? 'light' : currentTheme === 'light' ? 'system' : 'dark';
  const ThemeIcon = currentTheme === 'dark' ? Moon : currentTheme === 'light' ? SunMedium : MonitorSmartphone;
  const themeLabel = currentLocale === 'en'
    ? currentTheme === 'dark' ? 'Dark' : currentTheme === 'light' ? 'Light' : 'Auto'
    : currentTheme === 'dark' ? 'Тёмная' : currentTheme === 'light' ? 'Светлая' : 'Авто';
  const nextLocale = currentLocale === 'en' ? 'ru' : 'en';
  const isEnglish = currentLocale === 'en';
  const modeLabel = demoMode ? (isEnglish ? 'Live mode' : 'Рабочий режим') : (isEnglish ? 'Demo' : 'Демо');
  const publicLabel = isEnglish ? 'Storefront' : 'Витрина';
  const newBookingLabel = isEnglish ? 'New booking' : 'Новая запись';
  const eventsLabel = isEnglish ? 'Events' : 'События';
  const helpMenuLabel = isEnglish ? 'Help and feedback' : 'Помощь и связь';

  return (
    <>
      <AnimatePresence>
        {activeMenu ? (
          <motion.button
            type="button"
            aria-label="Close menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[38] hidden cursor-default bg-[#f7f6f2]/[0.16] backdrop-blur-[10px] xl:block dark:bg-black/[0.22]"
            onClick={closeMenu}
          />
        ) : null}
      </AnimatePresence>

      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        onMouseEnter={clearMenuTimers}
        onMouseLeave={scheduleCloseMenu}
        className="workspace-top-mega-nav fixed inset-x-0 z-[60] hidden px-4 pt-4 xl:block"
      >
        <div className="relative mx-auto w-[min(calc(100vw-32px),1520px)]">
          <motion.div className="relative z-10 overflow-visible text-black dark:text-white">
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 z-0 rounded-[30px] border border-black/[0.08] bg-[#fbfbfa]/[0.54] shadow-[0_22px_80px_-54px_rgba(15,23,42,0.62)] backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-x-10 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/90 before:to-transparent dark:border-white/[0.10] dark:bg-[#07080d]/[0.56] dark:before:via-white/16"
              initial={false}
              animate={{ height: activeMenu ? 72 + getWorkspaceMegaPanelMinHeight(activeMenu) : 72 }}
              transition={{ duration: 0.44, ease: [0.22, 1, 0.36, 1] }}
            />
            <div className={cn(
              'relative z-20 flex h-[72px] items-center justify-between gap-4 border-b border-transparent px-5',
              activeMenu && 'border-black/[0.07] dark:border-white/[0.09]',
            )}>
              <Link
                href={withDashboardDemoParam('/dashboard', demoMode)}
                onClick={closeMenu}
                prefetch={false}
                scroll={false}
                className="relative z-10 flex shrink-0 items-center"
                aria-label={labels.product}
              >
                <BrandLogo className="w-[126px]" />
              </Link>

              <nav className="relative z-10 hidden h-11 items-center gap-1 rounded-full border border-black/[0.06] bg-black/[0.03] p-1 dark:border-white/[0.08] dark:bg-white/[0.04] xl:flex" aria-label={labels.product}>
                {menus.filter((menu) => menu.id !== 'support').map((menu) => {
                  const menuOpen = activeMenuId === menu.id;
                  const hasActiveRoute = menu.columns.some((column) => column.items.some((item) => isActive(pathname, item.href, getPathOnly(item.href) === '/dashboard')));

                  return (
                    <button
                      key={menu.id}
                      type="button"
                      onMouseEnter={() => (activeMenuId ? openMenu(menu.id) : scheduleOpenMenu(menu.id))}
                      onFocus={() => openMenu(menu.id)}
                      onClick={() => openMenu(menu.id)}
                      aria-expanded={menuOpen}
                      className={cn(
                        'group/nav relative inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-semibold tracking-[-0.02em] text-black/52 transition-all duration-200 hover:bg-white/[0.7] hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10 dark:text-white/52 dark:hover:bg-white/[0.075] dark:hover:text-white dark:focus-visible:ring-white/12',
                        (menuOpen || hasActiveRoute) && 'text-black dark:text-white',
                      )}
                    >
                      <span>{menu.label}</span>
                      <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', menuOpen && 'rotate-180')} />
                      <span
                        aria-hidden="true"
                        className={cn(
                          'absolute inset-x-4 -bottom-[3px] h-[2px] origin-center rounded-full bg-black opacity-0 transition-all duration-300 dark:bg-white',
                          (menuOpen || hasActiveRoute)
                            ? 'scale-x-100 opacity-100'
                            : 'scale-x-0 group-hover/nav:scale-x-100 group-hover/nav:opacity-60',
                        )}
                      />
                    </button>
                  );
                })}
              </nav>

              <div className="relative z-10 flex shrink-0 items-center gap-2">
                <Link
                  href={demoMode ? liveHref : demoHref}
                  prefetch={false}
                  scroll={false}
                  className="hidden h-10 items-center rounded-full px-3 text-[12px] font-semibold text-black/46 transition-all hover:bg-black/[0.04] hover:text-black dark:text-white/46 dark:hover:bg-white/[0.07] dark:hover:text-white 2xl:inline-flex"
                >
                  {modeLabel}
                </Link>

                <Link
                  href={publicPageItem.href}
                  prefetch={false}
                  scroll={false}
                  className={cn(
                    'hidden h-10 items-center gap-2 rounded-full border border-black/[0.065] bg-black/[0.025] px-3 text-[12px] font-semibold transition-all hover:border-black/[0.12] hover:bg-white/[0.75] hover:text-black dark:border-white/[0.085] dark:bg-white/[0.04] dark:hover:bg-white/[0.075] dark:hover:text-white 2xl:inline-flex',
                    publicPageActive ? 'bg-white/[0.62] text-black dark:bg-white/[0.08] dark:text-white' : 'text-black/58 dark:text-white/58',
                  )}
                >
                  <Globe2 className="h-4 w-4" />
                  {publicLabel}
                </Link>

                <div className="hidden items-center gap-1 rounded-full border border-black/[0.065] bg-black/[0.025] p-1 dark:border-white/[0.085] dark:bg-white/[0.04] 2xl:flex">
                  <button
                    type="button"
                    onClick={() => setLocale(nextLocale)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[11.5px] font-semibold text-black/52 transition hover:bg-white/[0.8] hover:text-black dark:text-white/52 dark:hover:bg-white/[0.075] dark:hover:text-white"
                    aria-label={currentLocale === 'en' ? 'Switch language to Russian' : 'Переключить язык на английский'}
                  >
                    <Languages className="h-3.5 w-3.5" />
                    {currentLocale === 'en' ? 'EN' : 'RU'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme(nextTheme)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[11.5px] font-semibold text-black/52 transition hover:bg-white/[0.8] hover:text-black dark:text-white/52 dark:hover:bg-white/[0.075] dark:hover:text-white"
                    aria-label={currentLocale === 'en' ? 'Switch theme' : 'Переключить тему'}
                    title={themeLabel}
                  >
                    <ThemeIcon className="h-3.5 w-3.5" />
                    {themeLabel}
                  </button>
                </div>

                <Link
                  href={withDashboardDemoParam('/dashboard/today', demoMode)}
                  prefetch={false}
                  scroll={false}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-black px-4 text-[12.5px] font-semibold text-white shadow-[0_16px_38px_-28px_rgba(0,0,0,0.85)] transition-all hover:-translate-y-0.5 hover:bg-[#111827] active:scale-[0.98] dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                  <SquarePen className="h-4 w-4" />
                  {newBookingLabel}
                </Link>

                <button
                  type="button"
                  onClick={onToggleEvents}
                  className={cn(
                    'relative flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.065] bg-black/[0.025] text-black/52 transition-all hover:border-black/[0.12] hover:bg-white/[0.75] hover:text-black dark:border-white/[0.085] dark:bg-white/[0.04] dark:text-white/52 dark:hover:bg-white/[0.075] dark:hover:text-white',
                    eventPanelOpen && 'bg-white/[0.62] text-black dark:bg-white/[0.08] dark:text-white',
                  )}
                  aria-label={eventsLabel}
                >
                  <Bell className="h-4 w-4" />
                  {workspaceUnreadEvents > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--primary)] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white dark:ring-[#07080d]">
                      {workspaceUnreadEvents > 99 ? '99+' : workspaceUnreadEvents}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onMouseEnter={() => supportMenu && (activeMenuId ? openMenu('support') : scheduleOpenMenu('support'))}
                  onFocus={() => supportMenu && openMenu('support')}
                  onClick={() => supportMenu && openMenu('support')}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-black/[0.065] bg-black/[0.025] text-black/52 transition-all hover:border-black/[0.12] hover:bg-white/[0.75] hover:text-black dark:border-white/[0.085] dark:bg-white/[0.04] dark:text-white/52 dark:hover:bg-white/[0.075] dark:hover:text-white"
                  aria-label={helpMenuLabel}
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {activeMenu ? (
                <WorkspaceMegaPanel
                  menu={activeMenu}
                  pathname={pathname}
                  locale={currentLocale === 'en' ? 'en' : 'ru'}
                  onNavigate={closeMenu}
                />
              ) : null}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.header>
    </>
  );
}

export function WorkspaceShell({ children, className }: WorkspaceShellProps) {
  const isEmbedded = useIsWorkspaceShellEmbedded();
  const rawPathname = usePathname();
  const pathname = rawPathname || '/dashboard';
  const searchParams = useBrowserSearchParams();

  const { ownedProfile, getBookingsBySlug } = useApp();
  const { locale } = useLocale();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navQuery, setNavQuery] = useState('');
  const [eventPanelOpen, setEventPanelOpen] = useState(false);
  const [readEventIds, setReadEventIds] = useState<string[]>(() => readWorkspaceEventIds());

  useEffect(() => {
    writeWorkspaceEventIds(readEventIds);
  }, [readEventIds]);

  const demoMode = isDashboardDemoEnabled(searchParams);
  const selectedWorkspaceMode: 'live' | 'demo' = demoMode ? 'demo' : 'live';

  useEffect(() => {
    document.documentElement.dataset.slotySidebar =
      'linear-sidebar-account-footer-v28';
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const publicHref = demoMode
    ? '/demo/' + SLOTY_DEMO_SLUG
    : ownedProfile
      ? '/m/' + ownedProfile.slug
      : '/create-profile';

  const profileBookings = ownedProfile
    ? getBookingsBySlug(ownedProfile.slug)
    : [];

  const workspaceEvents = useMemo(() => (
    buildBookingEventNotifications(profileBookings).map((event) => ({
      ...event,
      unread: event.unread && !readEventIds.includes(event.id),
    }))
  ), [profileBookings, readEventIds]);
  const workspaceUnreadEvents = workspaceEvents.filter((event) => event.unread).length;
  const markWorkspaceEventsRead = () => {
    setReadEventIds((prev) => Array.from(new Set([...prev, ...workspaceEvents.map((event) => event.id)])));
  };

  const todayIso = (() => {
    const now = new Date();
    const timezoneOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 10);
  })();

  const newBookings = profileBookings.filter(
    (item) =>
      item.date === todayIso &&
      item.status !== 'cancelled' &&
      item.status !== 'no_show',
  ).length;

  const labels =
    locale === 'ru'
      ? {
          product: 'КликБук',
          productHint: 'Кабинет мастера',
          search: 'Поиск',
          noResults: 'Ничего не найдено.',
          publicDescription: 'Страница клиента и онлайн-запись',
          primaryNav: {
            home: 'Главная',
            today: 'Сегодня',
            chats: 'Чаты',
            clients: 'Клиенты',
            more: 'Ещё',
          },
          navigation: {
            publicPage: 'Публичная страница',
            profile: 'Профиль',
            overview: 'Основное',
            work: 'Работа',
            settings: 'Управление',
            storefront: 'Витрина и запись',
            channels: 'Каналы',
            billing: 'Оплата и доступ',
          },
          actions: {
            openMenu: 'Открыть меню',
            closeMenu: 'Закрыть меню',
          },
          items: {
            home: 'Главная',
            today: 'Календарь',
            stats: 'Статистика',
            chats: 'Чаты',
            clients: 'Клиенты',
            services: 'Услуги',
            availability: 'График',
            templates: 'Шаблоны',
            profile: 'Профиль',
            appearance: 'Внешний вид',
            marketing: 'Продвижение',
            notifications: 'Уведомления',
            payments: 'Оплата',
            subscription: 'Подписка',
            limits: 'Лимиты',
            publicPage: 'Публичная страница',
          },
        }
      : {
          product: 'ClickBook',
          productHint: 'Specialist workspace',
          search: 'Search',
          noResults: 'Nothing found.',
          publicDescription: 'Client page and online booking',
          primaryNav: {
            home: 'Home',
            today: 'Today',
            chats: 'Chats',
            clients: 'Clients',
            more: 'More',
          },
          navigation: {
            publicPage: 'Public page',
            profile: 'Profile',
            overview: 'Overview',
            work: 'Work',
            settings: 'Manage',
            storefront: 'Storefront and booking',
            channels: 'Channels',
            billing: 'Billing and access',
          },
          actions: {
            openMenu: 'Open menu',
            closeMenu: 'Close menu',
          },
          items: {
            home: 'Home',
            today: 'Calendar',
            stats: 'Statistics',
            chats: 'Chats',
            clients: 'Clients',
            services: 'Services',
            availability: 'Availability',
            templates: 'Templates',
            profile: 'Profile',
            appearance: 'Appearance',
            marketing: 'Promotion',
            notifications: 'Notifications',
            payments: 'Payments',
            subscription: 'Subscription',
            limits: 'Limits',
            publicPage: 'Public page',
          },
        };

  const dashboardModeBasePath = pathname.startsWith('/dashboard')
    ? getPathOnly(pathname)
    : '/dashboard';

  const liveWorkspaceHref = useMemo(() => {
    return withDashboardDemoParam(dashboardModeBasePath, false);
  }, [dashboardModeBasePath]);

  const demoWorkspaceHref = useMemo(() => {
    return withDashboardDemoParam(dashboardModeBasePath, true);
  }, [dashboardModeBasePath]);

  const publicPageItem = useMemo<NavigationItem>(() => {
    const demoPublicPath = '/demo/' + SLOTY_DEMO_SLUG;

    const isPublicPathActive =
      pathname === '/create-profile' ||
      pathname.startsWith('/create-profile/') ||
      pathname === publicHref ||
      pathname.startsWith('/m/') ||
      pathname.startsWith(demoPublicPath);

    return {
      href: publicHref,
      label: labels.items.publicPage,
      icon: Globe2,
      forceActive: isPublicPathActive,
      exact: pathname === '/create-profile',
    };
  }, [labels.items.publicPage, pathname, publicHref]);

  const navigationGroups = useMemo<NavigationGroup[]>(() => {
    const overview: NavigationItem[] = [
      {
        href: withDashboardDemoParam('/dashboard', demoMode),
        label: labels.items.home,
        icon: Home,
        exact: true,
      },
      {
        href: withDashboardDemoParam('/dashboard/today', demoMode),
        label: labels.items.today,
        icon: CalendarClock,
        badge: newBookings > 0 ? String(newBookings) : undefined,
      },
      {
        href: withDashboardDemoParam('/dashboard/stats', demoMode),
        label: labels.items.stats,
        icon: BarChart3,
      },
    ];

    const work: NavigationItem[] = [
      {
        href: withDashboardDemoParam('/dashboard/chats', demoMode),
        label: labels.items.chats,
        icon: MessageCircleMore,
        badge: 'bot',
      },
      {
        href: withDashboardDemoParam('/dashboard/clients', demoMode),
        label: labels.items.clients,
        icon: Users2,
      },
    ];

    const storefront: NavigationItem[] = [
      {
        href: withDashboardDemoParam('/dashboard/services', demoMode),
        label: labels.items.services,
        icon: Package2,
      },
      {
        href: withDashboardDemoParam('/dashboard/availability', demoMode),
        label: labels.items.availability,
        icon: CalendarRange,
      },
      {
        href: withDashboardDemoParam('/dashboard/templates', demoMode),
        label: labels.items.templates,
        icon: MessageSquareText,
      },
    ];

    const manage: NavigationItem[] = [
      {
        href: withDashboardDemoParam('/dashboard/profile', demoMode),
        label: labels.items.profile,
        icon: SquarePen,
        exact: true,
      },
      {
        href: withDashboardDemoParam('/dashboard/appearance', demoMode),
        label: labels.items.appearance,
        icon: LayoutPanelTop,
      },
      {
        href: withDashboardDemoParam('/dashboard/notifications', demoMode),
        label: labels.items.notifications,
        icon: Bell,
        badge: workspaceUnreadEvents > 0 ? workspaceUnreadEvents > 99 ? '99+' : String(workspaceUnreadEvents) : undefined,
      },
      {
        href: withDashboardDemoParam('/dashboard/marketing', demoMode),
        label: labels.items.marketing,
        icon: Sparkles,
      },
    ];

    const billing: NavigationItem[] = [
      {
        href: withDashboardDemoParam('/dashboard/subscription', demoMode),
        label: labels.items.subscription,
        icon: Package2,
      },
    ];

    return [
      {
        id: 'overview',
        title: labels.navigation.overview,
        items: overview,
      },
      {
        id: 'work',
        title: labels.navigation.work,
        items: work,
      },
      {
        id: 'storefront',
        title: labels.navigation.storefront,
        items: storefront,
      },
      {
        id: 'manage',
        title: labels.navigation.settings,
        items: manage,
      },
      {
        id: 'billing',
        title: labels.navigation.billing,
        items: billing,
      },
    ];
  }, [
    demoMode,
    labels.items.appearance,
    labels.items.availability,
    labels.items.chats,
    labels.items.clients,
    labels.items.home,
    labels.items.marketing,
    labels.items.notifications,
    labels.items.profile,
    labels.items.services,
    labels.items.stats,
    labels.items.subscription,
    labels.items.templates,
    labels.items.today,
    labels.navigation.billing,
    labels.navigation.overview,
    labels.navigation.settings,
    labels.navigation.storefront,
    labels.navigation.work,
    workspaceUnreadEvents,
    newBookings,
  ]);

  const profileSectionPaths = useMemo(
    () => [
      '/dashboard/profile',
      '/dashboard/appearance',
      '/dashboard/services',
      '/dashboard/availability',
      '/dashboard/templates',
      '/dashboard/notifications',
      '/dashboard/marketing',
      '/dashboard/subscription',
    ],
    [],
  );

  const profileMenuActive = profileSectionPaths.some((path) =>
    isActive(pathname, path, path === '/dashboard/profile'),
  );

  const sidebarScope: SidebarScope = 'main';

  const profileMenuGroups = useMemo<NavigationGroup[]>(() => {
    const profileCore: NavigationItem[] = [
      {
        href: withDashboardDemoParam('/dashboard/profile', demoMode),
        label: labels.items.profile,
        icon: SquarePen,
        exact: true,
      },
      {
        href: withDashboardDemoParam('/dashboard/appearance', demoMode),
        label: labels.items.appearance,
        icon: LayoutPanelTop,
      },
    ];

    const profileStorefront: NavigationItem[] = [
      {
        href: withDashboardDemoParam('/dashboard/services', demoMode),
        label: labels.items.services,
        icon: Package2,
      },
      {
        href: withDashboardDemoParam('/dashboard/availability', demoMode),
        label: labels.items.availability,
        icon: CalendarRange,
      },
      {
        href: withDashboardDemoParam('/dashboard/templates', demoMode),
        label: labels.items.templates,
        icon: MessageSquareText,
      },
    ];

    const profileChannels: NavigationItem[] = [
      {
        href: withDashboardDemoParam('/dashboard/notifications', demoMode),
        label: labels.items.notifications,
        icon: Bell,
        badge: workspaceUnreadEvents > 0 ? workspaceUnreadEvents > 99 ? '99+' : String(workspaceUnreadEvents) : undefined,
      },
      {
        href: withDashboardDemoParam('/dashboard/marketing', demoMode),
        label: labels.items.marketing,
        icon: Sparkles,
      },
    ];

    const profileBilling: NavigationItem[] = [
      {
        href: withDashboardDemoParam('/dashboard/subscription', demoMode),
        label: labels.items.subscription,
        icon: Package2,
      },
    ];

    return [
      {
        id: 'profile-core',
        title: locale === 'ru' ? 'Профиль' : 'Profile',
        items: profileCore,
      },
      {
        id: 'profile-storefront',
        title: locale === 'ru' ? 'Витрина и запись' : 'Storefront and booking',
        items: profileStorefront,
      },
      {
        id: 'profile-channels',
        title: locale === 'ru' ? 'Каналы' : 'Channels',
        items: profileChannels,
      },
      {
        id: 'profile-billing',
        title: locale === 'ru' ? 'Подписка' : 'Subscription',
        items: profileBilling,
      },
    ];
  }, [
    demoMode,
    labels.items.appearance,
    labels.items.availability,
    labels.items.marketing,
    labels.items.notifications,
    labels.items.profile,
    labels.items.services,
    labels.items.subscription,
    labels.items.templates,
    workspaceUnreadEvents,
    locale,
  ]);

  const filteredNavigationGroups = useMemo(() => {
    const query = navQuery.trim().toLowerCase();

    if (!query) return navigationGroups;

    return navigationGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          item.label.toLowerCase().includes(query),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [navigationGroups, navQuery]);

  const filteredProfileNavigationGroups = useMemo(() => {
    const query = navQuery.trim().toLowerCase();

    if (!query) return profileMenuGroups;

    return profileMenuGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          item.label.toLowerCase().includes(query),
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [navQuery, profileMenuGroups]);

  const allItems = useMemo(
    () => [
      publicPageItem,
      ...navigationGroups.flatMap((group) => group.items),
    ],
    [navigationGroups, publicPageItem],
  );

  const activeItem = allItems.find(
    (item) =>
      !item.skipActiveMatch &&
      (item.forceActive || isActive(pathname, item.href, item.exact)),
  );

  const activeGroup = publicPageItem.forceActive
    ? { title: labels.navigation.publicPage }
    : navigationGroups.find((group) =>
        group.items.some(
          (item) =>
            !item.skipActiveMatch &&
            isActive(pathname, item.href, item.exact),
        ),
      );

  const findItem = (path: string) => {
    if (getPathOnly(publicPageItem.href) === path) return publicPageItem;

    return navigationGroups
      .flatMap((group) => group.items)
      .find((item) => getPathOnly(item.href) === path);
  };

  const homeItem = findItem('/dashboard') ?? navigationGroups[0]?.items[0];
  const todayItem = findItem('/dashboard/today');
  const chatsItem = findItem('/dashboard/chats');
  const clientsItem = findItem('/dashboard/clients');

  const mobilePrimaryItems = [
    homeItem ? { ...homeItem, shortLabel: labels.primaryNav.home } : null,
    todayItem ? { ...todayItem, shortLabel: labels.primaryNav.today } : null,
    chatsItem ? { ...chatsItem, shortLabel: labels.primaryNav.chats } : null,
    clientsItem ? { ...clientsItem, shortLabel: labels.primaryNav.clients } : null,
  ].filter(Boolean) as Array<NavigationItem & { shortLabel: string }>;

  const sidebarProps = {
    locale,
    product: labels.product,
    productHint: labels.productHint,
    searchLabel: labels.search,
    noResultsLabel: labels.noResults,
    publicDescription: labels.publicDescription,
    publicPageItem,
    publicPageActive: Boolean(publicPageItem.forceActive),
    scope: sidebarScope,
    profileBackLabel:
      locale === 'ru' ? 'Назад в основное меню' : 'Back to main menu',
    profileBackHref: withDashboardDemoParam('/dashboard', demoMode),
    profileGroups: filteredProfileNavigationGroups,
    selectedMode: selectedWorkspaceMode,
    liveHref: liveWorkspaceHref,
    demoHref: demoWorkspaceHref,
    navQuery,
    setNavQuery,
    groups: filteredNavigationGroups,
    pathname,
  };

  const workspaceMegaMenus = useMemo(
    () => buildWorkspaceMegaMenus({
      locale,
      demoMode,
      publicHref,
      unreadEvents: workspaceUnreadEvents,
    }),
    [locale, demoMode, publicHref, workspaceUnreadEvents],
  );

  return (
    <div
      className="min-h-screen bg-[#f7f6f2] text-slate-950 dark:bg-[#080808] dark:text-white"
      style={{ '--sidebar-width': `${SIDEBAR_WIDTH}px` } as CSSProperties}
    >
      <style dangerouslySetInnerHTML={{ __html: SHIMMER_CSS }} />

      {isEmbedded ? null : (
        <MobileSheet
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        >
          <SidebarContent
            {...sidebarProps}
            onNavigate={() => setMobileMenuOpen(false)}
          />
        </MobileSheet>
      )}

      {isEmbedded ? null : (
        <WorkspaceTopMegaNav
          menus={workspaceMegaMenus}
          pathname={pathname}
          demoMode={demoMode}
          liveHref={liveWorkspaceHref}
          demoHref={demoWorkspaceHref}
          publicPageItem={publicPageItem}
          publicPageActive={Boolean(publicPageItem.forceActive)}
          workspaceUnreadEvents={workspaceUnreadEvents}
          eventPanelOpen={eventPanelOpen}
          onToggleEvents={() => setEventPanelOpen((value) => !value)}
          labels={labels}
        />
      )}

      <main
        className={cn(
          'cb-workspace-main min-h-screen',
          isEmbedded ? 'pb-0' : 'pb-[88px] xl:pb-0',
          className,
        )}
        data-workspace-route={getPathOnly(pathname)}
        data-workspace-embedded={isEmbedded ? 'true' : undefined}
      >
        <div className={cn("cb-workspace-mobile-topbar sticky top-0 z-30 border-b border-black/[0.07] bg-[#f7f6f2]/92 backdrop-blur-xl dark:border-white/[0.07] dark:bg-[#080808]/92 xl:hidden", isEmbedded && "hidden")}>
          <div className="flex h-[54px] items-center justify-between gap-2 px-2.5 pt-[env(safe-area-inset-top,0px)]">
            <div className="flex min-w-0 items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="size-9 shrink-0 rounded-[12px]"
                onClick={() => setMobileMenuOpen(true)}
                aria-label={labels.actions.openMenu}
              >
                <Menu className="size-4" />
              </Button>

              <Link
                href={withDashboardDemoParam('/dashboard', demoMode)}
                prefetch={false}
                scroll={false}
                className="flex min-w-0 items-center gap-2"
              >
                <span className="flex h-8 w-[82px] shrink-0 items-center justify-center rounded-[10px] border border-black/[0.08] bg-[#ffffff] px-2 dark:border-white/[0.08] dark:bg-[#141414]">
                  <BrandLogo className="w-[82px]" />
                </span>

                <span className="min-w-0">
                  <span className="block truncate text-[11.5px] font-semibold tracking-[-0.035em]">
                    {activeItem?.label ?? labels.items.home}
                  </span>

                  <span className="block truncate text-[9.5px] text-muted-foreground">
                    {activeGroup?.title ?? labels.productHint}
                  </span>
                </span>
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setEventPanelOpen((value) => !value)}
              className={cn(
                'relative flex size-8 shrink-0 items-center justify-center overflow-visible rounded-[10px] border border-black/[0.08] bg-[var(--cb-surface)] text-slate-500 transition hover:text-slate-950 dark:border-white/[0.08] dark:bg-[#141414] dark:text-white/40 dark:hover:text-white',
                eventPanelOpen && 'cb-neutral-primary',
              )}
              aria-label={locale === 'ru' ? 'События' : 'Events'}
            >
              <Bell className="size-3.5" />
              {workspaceUnreadEvents > 0 && (
                <span className="absolute -right-2.5 -top-2.5 z-20 flex h-5 min-w-[22px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-none text-white ring-2 ring-[#f7f6f2] dark:ring-[#080808]">
                  {workspaceUnreadEvents > 99 ? '99+' : workspaceUnreadEvents}
                </span>
              )}
            </button>

            <Link
              href={publicPageItem.href}
              aria-label={labels.items.publicPage}
              prefetch={false}
              scroll={false}
              className={cn(
                'flex size-8 shrink-0 items-center justify-center rounded-[10px] transition',
                publicPageItem.forceActive
                  ? 'cb-neutral-primary'
                  : 'border border-black/[0.08] bg-[var(--cb-surface)] text-slate-500 hover:text-slate-950 dark:border-white/[0.08] dark:bg-[#141414] dark:text-white/40 dark:hover:text-white',
              )}
            >
              <Globe2 className="size-3.5" />
            </Link>
          </div>
        </div>

        <WorkspaceEventsPanel
          open={eventPanelOpen}
          events={workspaceEvents}
          locale={locale}
          onClose={() => setEventPanelOpen(false)}
          onMarkAll={markWorkspaceEventsRead}
          onRead={(id) => setReadEventIds((prev) => Array.from(new Set([...prev, id])))}
        />

        <div className="workspace-main-shell">{children}</div>
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-black/[0.07] bg-[#f7f6f2]/94 px-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] pt-2 backdrop-blur-xl dark:border-white/[0.07] dark:bg-[#080808]/94 xl:hidden"
        aria-label={labels.product}
      >
        <div className="mx-auto grid max-w-[430px] grid-cols-5 gap-1 rounded-[20px] border border-black/[0.07] bg-[#ffffff]/82 p-1 dark:border-white/[0.08] dark:bg-[#141414]/86">
          {mobilePrimaryItems.map((item) => (
            <MobileBottomItem
              key={item.href}
              item={item}
              active={Boolean(
                item.forceActive || isActive(pathname, item.href, item.exact),
              )}
            />
          ))}

          <button
            type="button"
            className={cn(
              'flex h-[44px] flex-col items-center justify-center gap-0.5 rounded-[14px] text-[10px] font-medium transition active:scale-[0.98]',
              mobileMenuOpen
                ? 'cb-neutral-primary'
                : 'text-muted-foreground hover:bg-foreground/[0.045] hover:text-foreground',
            )}
            onClick={() => setMobileMenuOpen(true)}
            aria-label={labels.primaryNav.more}
          >
            <Menu className="size-[16px]" />
            <span>{labels.primaryNav.more}</span>
          </button>
        </div>
      </nav>

      <WorkspaceAssistant />
    </div>
  );
}
function WorkspaceEventsPanel({
  open,
  events,
  locale,
  onClose,
  onMarkAll,
  onRead,
}: {
  open: boolean;
  events: NotificationEvent[];
  locale: 'ru' | 'en';
  onClose: () => void;
  onMarkAll: () => void;
  onRead: (id: string) => void;
}) {
  if (!open) return null;
  const title = locale === 'ru' ? 'События' : 'Events';
  const subtitle = locale === 'ru' ? 'Переносы, отмены и новые записи' : 'Reschedules, cancellations, and bookings';
  const emptyTitle = locale === 'ru' ? 'Сейчас всё спокойно' : 'All quiet now';
  const emptyText = locale === 'ru' ? 'Новые события клиентов появятся здесь.' : 'Client events will appear here.';
  return (
    <>
      <button
        type="button"
        aria-label={locale === 'ru' ? 'Закрыть события' : 'Close events'}
        className="fixed inset-0 z-[55] cursor-default bg-transparent"
        onClick={onClose}
      />
      <div className="fixed inset-x-3 top-[72px] z-[60] mx-auto max-w-[420px] xl:inset-x-auto xl:top-[108px] xl:w-[380px]" style={{ right: 'max(16px, calc((100vw - 1520px) / 2 + 20px))' }}>
        <div className="overflow-hidden rounded-[24px] border border-black/[0.08] bg-[#ffffff]/94 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.38)] backdrop-blur-2xl dark:border-white/[0.09] dark:bg-[#101010]/94 dark:shadow-black/40">
        <div className="flex items-start justify-between gap-3 border-b border-black/[0.06] px-4 py-3 dark:border-white/[0.07]">
          <div className="min-w-0">
            <div className="text-[15px] font-semibold tracking-[-0.03em]">{title}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {events.length > 0 && (
              <button type="button" onClick={onMarkAll} className="rounded-full px-2.5 py-1 text-[11px] text-primary transition hover:bg-primary/10">
                {locale === 'ru' ? 'Прочитать' : 'Read'}
              </button>
            )}
            <button type="button" onClick={onClose} className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-foreground/[0.06] hover:text-foreground" aria-label={locale === 'ru' ? 'Закрыть' : 'Close'}>
              <X className="size-3.5" />
            </button>
          </div>
        </div>
        <div className="max-h-[min(520px,calc(100vh-110px))] overflow-y-auto p-2">
          {events.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-[16px] border border-black/[0.07] bg-black/[0.025] text-muted-foreground dark:border-white/[0.08] dark:bg-white/[0.04]">
                <Bell className="size-5" />
              </div>
              <div className="text-[13px] font-medium">{emptyTitle}</div>
              <div className="mt-1 text-[11px] leading-5 text-muted-foreground">{emptyText}</div>
            </div>
          ) : (
            <div className="space-y-1">
              {events.slice(0, 12).map((event) => (
                <WorkspaceEventRow key={event.id} event={event} onRead={() => onRead(event.id)} />
              ))}
            </div>
          )}
          </div>
        </div>
      </div>
    </>
  );
}

function WorkspaceEventRow({ event, onRead }: { event: NotificationEvent; onRead: () => void }) {
  const toneClass = event.tone === 'danger'
    ? 'text-red-500 bg-red-500/10 border-red-500/15'
    : event.tone === 'warning'
      ? 'text-amber-500 bg-amber-500/10 border-amber-500/15'
      : event.tone === 'success'
        ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/15'
        : 'text-primary bg-primary/10 border-primary/15';
  const IconComponent = event.kind === 'message'
    ? MessageCircleMore
    : event.kind === 'reschedule'
      ? CalendarRange
      : event.tone === 'success'
        ? CheckCircle2
        : CalendarClock;
  return (
    <button
      type="button"
      onClick={onRead}
      className={cn(
        'flex w-full items-start gap-3 rounded-[18px] px-3 py-3 text-left transition hover:bg-foreground/[0.045]',
        event.unread && 'bg-primary/[0.055]',
      )}
    >
      <span className={cn('mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[14px] border', toneClass)}>
        <IconComponent className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className={cn('truncate text-[12.5px] font-medium tracking-[-0.02em]', event.unread && 'font-semibold')}>{event.title}</span>
          {event.unread && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
        </span>
        <span className="mt-1 block text-[11px] leading-4 text-muted-foreground">{event.text}</span>
        <span className="mt-1.5 block text-[10px] text-muted-foreground/70">{event.time}{event.source ? ` · ${event.source}` : ''}</span>
      </span>
    </button>
  );
}
