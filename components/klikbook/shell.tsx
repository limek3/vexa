'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Bell, Calendar as CalendarIcon, ChevronDown, Search } from 'lucide-react';
import { KbAvatar } from './primitives';
import { cn } from '@/lib/utils';

export type KbNavItem = {
  label: string;
  href: string;
  match?: (path: string) => boolean;
};

const DEFAULT_NAV: KbNavItem[] = [
  { label: 'Обзор', href: '/dashboard', match: (p) => p === '/dashboard' },
  { label: 'Записи', href: '/dashboard/today', match: (p) => p.startsWith('/dashboard/today') || p.startsWith('/dashboard/bookings') },
  { label: 'Клиенты', href: '/dashboard/clients', match: (p) => p.startsWith('/dashboard/clients') },
  { label: 'Услуги', href: '/dashboard/services', match: (p) => p.startsWith('/dashboard/services') },
  { label: 'Финансы', href: '/dashboard/finance', match: (p) => p.startsWith('/dashboard/finance') || p.startsWith('/dashboard/payments') },
  { label: 'Аналитика', href: '/dashboard/stats', match: (p) => p.startsWith('/dashboard/stats') || p.startsWith('/dashboard/analytics') },
  { label: 'Настройки', href: '/dashboard/profile', match: (p) => p.startsWith('/dashboard/profile') || p.startsWith('/dashboard/settings') },
];

export function KbBrand({ className }: { className?: string }) {
  return (
    <Link href="/dashboard" className={cn('inline-flex items-center gap-1', className)}>
      <span className="kb-display text-[22px] font-medium tracking-[-0.02em] text-[var(--kb-text)]">КликБук</span>
      <span className="kb-orn-dot relative top-[-8px]" />
    </Link>
  );
}

export function KbTopNav({
  nav = DEFAULT_NAV,
  user,
  dateRange,
  onSearch,
  notificationsCount = 0,
}: {
  nav?: KbNavItem[];
  user?: { name: string; subtitle?: string; avatar?: string | null };
  dateRange?: string;
  onSearch?: (q: string) => void;
  notificationsCount?: number;
}) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const [query, setQuery] = useState('');

  return (
    <header className="kb-topnav">
      <div className="mx-auto flex h-[72px] max-w-[1440px] items-center gap-4 px-6">
        <KbBrand className="mr-4 shrink-0" />

        <nav className="hidden flex-1 items-center gap-1 lg:flex">
          {nav.map((item) => {
            const active = item.match ? item.match(pathname) : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="kb-nav-link"
                data-active={active ? 'true' : 'false'}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onSearch?.(query);
            }}
            className="hidden h-10 w-[300px] items-center gap-2 rounded-[14px] border border-[var(--kb-border)] bg-white/70 px-3 md:flex"
          >
            <Search size={15} className="text-[var(--kb-text-muted)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Поиск по клиентам и записям"
              className="h-full w-full bg-transparent text-[13px] text-[var(--kb-text)] outline-none placeholder:text-[var(--kb-text-muted)]"
            />
            <kbd className="rounded-md border border-[var(--kb-border)] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[var(--kb-text-muted)]">
              ⌘K
            </kbd>
          </form>

          {dateRange && (
            <button
              type="button"
              className="hidden h-10 items-center gap-2 rounded-[14px] border border-[var(--kb-border)] bg-white px-3 text-[13px] text-[var(--kb-text-secondary)] transition hover:bg-[var(--kb-warm-surface)] sm:inline-flex"
            >
              <CalendarIcon size={15} />
              {dateRange}
              <ChevronDown size={14} className="text-[var(--kb-text-muted)]" />
            </button>
          )}

          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-[14px] border border-[var(--kb-border)] bg-white text-[var(--kb-text-secondary)] transition hover:bg-[var(--kb-warm-surface)]"
            aria-label="Уведомления"
            onClick={() => router.push('/dashboard/notifications')}
          >
            <Bell size={16} />
            {notificationsCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--kb-coral)] px-1 text-[10px] font-semibold text-white">
                {notificationsCount > 9 ? '9+' : notificationsCount}
              </span>
            )}
          </button>

          <Link
            href="/dashboard/profile"
            className="inline-flex items-center gap-2 rounded-[16px] border border-[var(--kb-border)] bg-white px-2 py-1.5 transition hover:bg-[var(--kb-warm-surface)]"
          >
            <KbAvatar src={user?.avatar} alt={user?.name || 'Профиль'} size={32} fallback={user?.name} />
            <span className="hidden pr-1 text-left sm:block">
              <span className="block text-[13px] font-medium leading-tight text-[var(--kb-text)]">
                {user?.name || 'Гость'}
              </span>
              {user?.subtitle && (
                <span className="block text-[11px] leading-tight text-[var(--kb-text-muted)]">{user.subtitle}</span>
              )}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function KbShell({
  children,
  user,
  nav,
  dateRange,
  notificationsCount,
  className,
}: {
  children: ReactNode;
  user?: { name: string; subtitle?: string; avatar?: string | null };
  nav?: KbNavItem[];
  dateRange?: string;
  notificationsCount?: number;
  className?: string;
}) {
  return (
    <div className={cn('klikbook-scope kb-shell flex min-h-screen flex-col', className)}>
      <KbTopNav user={user} nav={nav} dateRange={dateRange} notificationsCount={notificationsCount} />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 pb-16 pt-8">{children}</main>
    </div>
  );
}
