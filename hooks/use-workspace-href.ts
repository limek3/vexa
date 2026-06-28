'use client';

import { useCallback } from 'react';
import { usePathname } from 'next/navigation';

export function mapDashboardHrefToDesktop(href: string) {
  const [pathWithQuery, hash = ''] = href.split('#');
  const [pathname, query = ''] = pathWithQuery.split('?');
  const desktopPath = pathname === '/dashboard'
    ? '/desktop/dashboard'
    : pathname === '/dashboard/today'
      ? '/desktop/schedule'
      : pathname === '/dashboard/stats'
        ? '/desktop/analytics'
        : pathname.startsWith('/dashboard/')
          ? pathname.replace(/^\/dashboard/, '/desktop')
          : pathname;

  return `${desktopPath}${query ? `?${query}` : ''}${hash ? `#${hash}` : ''}`;
}

export function useWorkspaceHref() {
  const pathname = usePathname() || '';
  const desktopMode = pathname === '/desktop' || pathname.startsWith('/desktop/');

  return useCallback((href: string) => {
    if (!desktopMode || !href.startsWith('/dashboard')) return href;
    return mapDashboardHrefToDesktop(href);
  }, [desktopMode]);
}
