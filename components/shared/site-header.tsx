'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronLeft, Globe2, LayoutDashboard } from 'lucide-react';

import { useApp } from '@/lib/app-context';
import { useLocale } from '@/lib/locale-context';
import { Button } from '@/components/ui/button';
import { LanguageToggle } from '@/components/shared/language-toggle';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { BrandLogo } from '@/components/brand/brand-logo';

interface SiteHeaderProps {
  compact?: boolean;
  mobileMetaLabel?: string;
  mobileActions?: Array<{ href: string; label: string; icon?: ReactNode }>;
}

export function SiteHeader({ compact = false }: SiteHeaderProps) {
  const pathname = usePathname();
  const { locale } = useLocale();
  const { ownedProfile } = useApp();

  const isDashboardRoute = Boolean(pathname?.startsWith('/dashboard'));
  const isPublicRoute = Boolean(
    pathname && (pathname.startsWith('/m/') || pathname.startsWith('/demo/')),
  );
  const isAboutRoute =
    pathname === '/about' ||
    pathname === '/preview' ||
    pathname === '/aboute' ||
    pathname === '/prewie';

  const publicHref = isPublicRoute
    ? pathname
    : ownedProfile
      ? `/m/${ownedProfile.slug}`
      : '/create-profile';

  const brandHref = isDashboardRoute ? '/dashboard' : '/login';

  const labels =
    locale === 'ru'
      ? {
          subtitle: compact
            ? 'Публичная страница'
            : isAboutRoute
              ? 'О платформе'
              : 'Кабинет мастера',
          back: 'Назад в кабинет',
          dashboard: 'Кабинет',
          publicPage: 'Страница',
        }
      : {
          subtitle: compact
            ? 'Public page'
            : isAboutRoute
              ? 'About platform'
              : 'Specialist workspace',
          back: 'Back to workspace',
          dashboard: 'Workspace',
          publicPage: 'Page',
        };

  const actionButtonHref = isPublicRoute ? '/dashboard' : publicHref;
  const actionButtonLabel = isPublicRoute ? labels.dashboard : labels.publicPage;

  const actionButtonIcon = isPublicRoute ? (
    <LayoutDashboard className="size-4" />
  ) : (
    <Globe2 className="size-4 text-primary" />
  );

  return (
    <header className="site-mobile-header sticky top-0 z-40 border-b border-border/70">
      <div className="centered-workspace flex items-center justify-between gap-3 px-3 py-[var(--topbar-padding-y)] sm:px-4 md:px-6 xl:px-8">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <Link
            href={brandHref}
            className="flex min-w-0 items-center gap-2.5 sm:gap-3"
          >
            <BrandLogo className="w-[82px] sm:w-[104px]" priority />
            <div className="min-w-0">
              <div className="truncate text-[10.5px] text-muted-foreground sm:text-[11.5px]">
                {labels.subtitle}
              </div>
            </div>
          </Link>

          <span className="hidden text-muted-foreground md:inline">/</span>

          <Link
            href="/dashboard"
            className="hidden items-center gap-1.5 text-[11.5px] text-muted-foreground transition hover:text-foreground md:inline-flex"
          >
            <ChevronLeft className="size-3.5" />
            {labels.back}
          </Link>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden h-[var(--topbar-control-height)] border-0 bg-transparent px-2.5 text-muted-foreground hover:text-foreground md:inline-flex"
          >
            <Link href={publicHref}>
              <Globe2 className="size-4 text-primary" />
              {labels.publicPage}
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden h-[var(--topbar-control-height)] rounded-[10px] px-2.5 shadow-none md:inline-flex"
          >
            <Link href="/dashboard">
              <LayoutDashboard className="size-4" />
              {labels.dashboard}
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="icon-sm"
            className="site-mobile-header-action size-8 rounded-full shadow-none md:hidden"
          >
            <Link href={actionButtonHref} aria-label={actionButtonLabel}>
              {actionButtonIcon}
            </Link>
          </Button>

          <LanguageToggle compact minimal />
          <ThemeToggle compact minimal />
        </div>
      </div>
    </header>
  );
}
