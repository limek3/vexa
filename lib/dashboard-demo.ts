import type { ReadonlyURLSearchParams } from 'next/navigation';

type SearchParamsLike = Pick<URLSearchParams, 'get' | 'toString'> | Pick<ReadonlyURLSearchParams, 'get' | 'toString'> | null | undefined;

export const DASHBOARD_DEMO_PARAM = 'demo';

export function isDashboardDemoEnabled(searchParams: SearchParamsLike) {
  return searchParams?.get(DASHBOARD_DEMO_PARAM) === '1' || searchParams?.get('mode') === 'demo';
}

export function withDashboardDemoParam(href: string, enabled: boolean) {
  if (!enabled || !href.startsWith('/dashboard')) {
    return href;
  }

  const [pathWithQuery, hash = ''] = href.split('#');
  const [pathname, query = ''] = pathWithQuery.split('?');
  const params = new URLSearchParams(query);

  params.set(DASHBOARD_DEMO_PARAM, '1');
  params.delete('mode');

  const nextQuery = params.toString();
  return `${pathname}${nextQuery ? `?${nextQuery}` : ''}${hash ? `#${hash}` : ''}`;
}

export function toggleDashboardDemoHref(pathname: string, searchParams: SearchParamsLike, enabled: boolean) {
  const params = new URLSearchParams(searchParams?.toString() ?? '');

  if (enabled) {
    params.delete(DASHBOARD_DEMO_PARAM);
    params.delete('mode');
  } else {
    params.set(DASHBOARD_DEMO_PARAM, '1');
  }

  const nextQuery = params.toString();
  return `${pathname}${nextQuery ? `?${nextQuery}` : ''}`;
}

export function getDashboardDemoStorageKey(scope: string) {
  return `sloty-demo:${scope}`;
}
