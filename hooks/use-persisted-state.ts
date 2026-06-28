'use client';

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

function resolveInitialValue<T>(value: T | (() => T)) {
  return typeof value === 'function' ? (value as () => T)() : value;
}

export function usePersistedState<T>(
  key: string,
  initialValue: T | (() => T),
): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [state, setState] = useState<T>(() => resolveInitialValue(initialValue));
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        setState(JSON.parse(raw) as T);
      } else {
        setState(resolveInitialValue(initialValue));
      }
    } catch {
      setState(resolveInitialValue(initialValue));
    } finally {
      setHasLoaded(true);
    }
  }, [initialValue, key]);

  useEffect(() => {
    if (!hasLoaded || typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [hasLoaded, key, state]);

  return [state, setState, hasLoaded];
}
