
'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useBrowserSearchParams } from '@/hooks/use-browser-search-params';
import { useApp } from '@/lib/app-context';
import {
  APPEARANCE_STORAGE_KEY,
  applyAppearanceToElement,
  defaultAppearanceSettings,
  normalizeAppearanceSettings,
  type AppearanceSettings,
} from '@/lib/appearance';
import { getDashboardDemoStorageKey, isDashboardDemoEnabled } from '@/lib/dashboard-demo';
import { getDashboardDemoAppearance } from '@/lib/demo-data';

interface AppearanceContextValue {
  settings: AppearanceSettings;
  setSetting: <Key extends keyof AppearanceSettings>(key: Key, value: AppearanceSettings[Key]) => void;
  setSettingsBatch: (value: Partial<AppearanceSettings>) => void;
  resetSettings: () => void;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

function applyAppearance(settings: AppearanceSettings) {
  if (typeof document === 'undefined') return;
  applyAppearanceToElement(document.documentElement, settings);
}

export { defaultAppearanceSettings };
export type { AppearanceSettings };

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const { hasHydrated, workspaceId, workspaceData, updateWorkspaceSection } = useApp();
  const searchParams = useBrowserSearchParams();
  const demoMode = isDashboardDemoEnabled(searchParams);
  const storageKey = demoMode ? getDashboardDemoStorageKey('appearance') : APPEARANCE_STORAGE_KEY;
  const [settings, setSettings] = useState<AppearanceSettings>(() => {
    if (typeof window === 'undefined') return defaultAppearanceSettings;

    const currentParams = new URLSearchParams(window.location.search || '');
    const currentDemoMode = isDashboardDemoEnabled(currentParams);
    const currentStorageKey = currentDemoMode ? getDashboardDemoStorageKey('appearance') : APPEARANCE_STORAGE_KEY;
    const fallback = currentDemoMode ? getDashboardDemoAppearance() : defaultAppearanceSettings;

    try {
      const raw = window.localStorage.getItem(currentStorageKey);
      return normalizeAppearanceSettings(raw ? (JSON.parse(raw) as Partial<AppearanceSettings>) : fallback);
    } catch {
      return fallback;
    }
  });
  const lastSavedRef = useRef<string>('');
  const syncedWorkspaceRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(storageKey);
      const fallback = demoMode ? getDashboardDemoAppearance() : defaultAppearanceSettings;
      const next = normalizeAppearanceSettings(raw ? (JSON.parse(raw) as Partial<AppearanceSettings>) : fallback);
      setSettings(next);
      applyAppearance(next);
    } catch {
      const fallback = demoMode ? getDashboardDemoAppearance() : defaultAppearanceSettings;
      setSettings(fallback);
      applyAppearance(fallback);
    }
  }, [demoMode, storageKey]);

  useEffect(() => {
    if (demoMode || !hasHydrated) return;

    const remoteSettings = normalizeAppearanceSettings((workspaceData.appearance as Partial<AppearanceSettings> | null | undefined) ?? null);
    if (!workspaceId) return;
    if (syncedWorkspaceRef.current === workspaceId && lastSavedRef.current) return;

    syncedWorkspaceRef.current = workspaceId;
    lastSavedRef.current = JSON.stringify(remoteSettings);
    setSettings(remoteSettings);
    applyAppearance(remoteSettings);
  }, [demoMode, hasHydrated, workspaceData.appearance, workspaceId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(storageKey, JSON.stringify(settings));
    applyAppearance(settings);
    window.dispatchEvent(
      new CustomEvent('clickbook:appearance-updated', {
        detail: { storageKey, settings },
      }),
    );
  }, [settings, storageKey]);

  useEffect(() => {
    if (demoMode || !workspaceId || !hasHydrated) return;
    const serialized = JSON.stringify(settings);
    if (serialized === lastSavedRef.current) return;

    lastSavedRef.current = serialized;
    const timeout = window.setTimeout(() => {
      void updateWorkspaceSection('appearance', settings);
      void fetch('/api/appearance', {
        method: 'PATCH',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspaceId,
          settings,
        }),
      }).catch(() => undefined);
    }, 250);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [demoMode, hasHydrated, settings, updateWorkspaceSection, workspaceId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      const fallback = demoMode ? getDashboardDemoAppearance() : defaultAppearanceSettings;
      const next = normalizeAppearanceSettings(event.newValue ? (JSON.parse(event.newValue) as Partial<AppearanceSettings>) : fallback);
      setSettings(next);
      applyAppearance(next);
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [demoMode, storageKey]);

  const value = useMemo<AppearanceContextValue>(
    () => ({
      settings,
      setSetting: (key, value) => {
        setSettings((current) => ({ ...current, [key]: value }));
      },
      setSettingsBatch: (value) => {
        setSettings((current) => ({ ...current, ...value }));
      },
      resetSettings: () => {
        setSettings(demoMode ? getDashboardDemoAppearance() : defaultAppearanceSettings);
      },
    }),
    [demoMode, settings],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const context = useContext(AppearanceContext);

  if (!context) {
    throw new Error('useAppearance must be used within AppearanceProvider');
  }

  return context;
}
