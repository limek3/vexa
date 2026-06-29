'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { useBrowserSearchParams } from '@/hooks/use-browser-search-params';
import { useApp } from '@/lib/app-context';
import { getDashboardDemoStorageKey, isDashboardDemoEnabled } from '@/lib/dashboard-demo';

function stableStringify(value: unknown) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function readDemoValue<T>(storageKey: string, fallbackValue: T) {
  if (typeof window === 'undefined') return fallbackValue;

  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as T) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

type PendingSave<T> = {
  serialized: string;
  value: T;
};

export function useWorkspaceSection<T>(
  key: string,
  fallbackValue: T,
): [T, Dispatch<SetStateAction<T>>, boolean] {
  const { hasHydrated, ownedProfile, workspaceData, updateWorkspaceSection } = useApp();
  const searchParams = useBrowserSearchParams();
  const demoMode = isDashboardDemoEnabled(searchParams);
  const demoStorageKey = useMemo(() => getDashboardDemoStorageKey(`section:${key}`), [key]);

  const remoteValue = demoMode ? fallbackValue : ((workspaceData[key] as T | undefined) ?? fallbackValue);
  const remoteValueRef = useRef(remoteValue);
  const fallbackRef = useRef(fallbackValue);
  const remoteSerialized = stableStringify(remoteValue);

  remoteValueRef.current = remoteValue;
  fallbackRef.current = fallbackValue;

  const [state, setRawState] = useState<T>(() => remoteValue);
  const stateRef = useRef(state);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const pendingRef = useRef<PendingSave<T> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const lastRemoteRef = useRef(remoteSerialized);
  const lastSavedRef = useRef(remoteSerialized);

  const setState = useCallback<Dispatch<SetStateAction<T>>>((next) => {
    setRawState((current) => {
      const resolved = typeof next === 'function' ? (next as (current: T) => T)(current) : next;
      return stableStringify(resolved) === stableStringify(current) ? current : resolved;
    });
  }, []);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const runSaveQueue = useCallback(async () => {
    if (savingRef.current || !pendingRef.current) return;

    const pending = pendingRef.current;
    pendingRef.current = null;
    savingRef.current = true;

    const success = await updateWorkspaceSection(key, pending.value);
    savingRef.current = false;

    if (success) {
      lastSavedRef.current = pending.serialized;
      lastRemoteRef.current = pending.serialized;

      if (stableStringify(stateRef.current) === pending.serialized) {
        dirtyRef.current = false;
      }
    } else {
      pendingRef.current = pending;
    }

    if (pendingRef.current && typeof window !== 'undefined') {
      window.setTimeout(() => {
        void runSaveQueue();
      }, success ? 80 : 900);
    }
  }, [key, updateWorkspaceSection]);

  useEffect(() => {
    if (demoMode) {
      const next = readDemoValue(demoStorageKey, fallbackRef.current);
      const serialized = stableStringify(next);
      const currentSerialized = stableStringify(stateRef.current);

      lastRemoteRef.current = serialized;
      lastSavedRef.current = serialized;
      dirtyRef.current = false;

      if (currentSerialized !== serialized) {
        setState(next);
      }
      return;
    }

    const currentSerialized = stableStringify(stateRef.current);

    if (dirtyRef.current) return;
    if (remoteSerialized === lastRemoteRef.current && currentSerialized === remoteSerialized) return;

    lastRemoteRef.current = remoteSerialized;
    lastSavedRef.current = remoteSerialized;

    if (currentSerialized !== remoteSerialized) {
      setState(remoteValueRef.current);
    }
  }, [demoMode, demoStorageKey, remoteSerialized, setState]);

  useEffect(() => {
    if (!hasHydrated) return;

    const serialized = stableStringify(state);

    if (demoMode) {
      if (serialized !== lastSavedRef.current) {
        try {
          window.localStorage.setItem(demoStorageKey, serialized);
        } catch {}
      }

      lastRemoteRef.current = serialized;
      lastSavedRef.current = serialized;
      dirtyRef.current = false;
      return;
    }

    if (!ownedProfile || serialized === lastSavedRef.current) return;

    dirtyRef.current = true;
    pendingRef.current = { serialized, value: state };

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      void runSaveQueue();
    }, 80);
  }, [demoMode, demoStorageKey, hasHydrated, ownedProfile, runSaveQueue, state]);

  return [state, setState, savingRef.current];
}
