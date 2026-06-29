'use client';

import { useEffect, useMemo, useState } from 'react';
import { useBrowserSearchParams } from '@/hooks/use-browser-search-params';
import { useApp } from '@/lib/app-context';
import {
  DEMO_PROFILE_STORAGE_KEY,
  DEMO_PROFILE_UPDATED_EVENT,
  getDashboardDemoSections,
  getDemoBookings,
  getDemoProfile,
  SLOTY_DEMO_SLUG,
} from '@/lib/demo-data';
import { isDashboardDemoEnabled } from '@/lib/dashboard-demo';
import { useLocale } from '@/lib/locale-context';
import { buildWorkspaceDatasetFromStored } from '@/lib/workspace-store';

export function useOwnedWorkspaceData() {
  const { ownedProfile, bookings, workspaceData, hasHydrated, refreshWorkspace } = useApp();
  const { locale } = useLocale();
  const searchParams = useBrowserSearchParams();
  const demoMode = isDashboardDemoEnabled(searchParams);
  const [demoRevision, setDemoRevision] = useState(0);

  useEffect(() => {
    if (!demoMode || typeof window === 'undefined') return;

    const bump = () => setDemoRevision((current) => current + 1);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === DEMO_PROFILE_STORAGE_KEY) bump();
    };

    window.addEventListener(DEMO_PROFILE_UPDATED_EVENT, bump);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(DEMO_PROFILE_UPDATED_EVENT, bump);
      window.removeEventListener('storage', handleStorage);
    };
  }, [demoMode]);

  const resolvedProfile = useMemo(() => {
    if (!demoMode) return ownedProfile;
    return getDemoProfile(SLOTY_DEMO_SLUG, locale);
  }, [demoMode, demoRevision, locale, ownedProfile]);

  const resolvedBookings = useMemo(() => {
    if (!demoMode) return bookings;
    return getDemoBookings(SLOTY_DEMO_SLUG, locale);
  }, [bookings, demoMode, locale]);

  const resolvedWorkspaceData = useMemo(() => {
    if (!demoMode) return workspaceData;
    return getDashboardDemoSections(locale);
  }, [demoMode, locale, workspaceData]);

  const dataset = useMemo(() => {
    if (!resolvedProfile) return null;

    try {
      return buildWorkspaceDatasetFromStored(resolvedProfile, resolvedBookings, locale, resolvedWorkspaceData);
    } catch {
      return null;
    }
  }, [locale, resolvedBookings, resolvedProfile, resolvedWorkspaceData]);

  return {
    hasHydrated,
    ownedProfile: resolvedProfile,
    bookings: resolvedBookings,
    dataset,
    locale,
    workspaceData: resolvedWorkspaceData,
    demoMode,
    refreshWorkspace,
  };
}
