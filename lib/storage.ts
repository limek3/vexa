import type { PersistedAppState } from '@/lib/types';

const STORAGE_KEY = 'sloty.booking-tool.state';

const emptyState: PersistedAppState = {
  ownedProfile: null,
  bookings: [],
};

export function loadAppState(): PersistedAppState {
  if (typeof window === 'undefined') {
    return emptyState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyState;
    }

    const parsed = JSON.parse(raw) as Partial<PersistedAppState>;

    return {
      ownedProfile: parsed.ownedProfile ?? null,
      bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
    };
  } catch {
    return emptyState;
  }
}

export function saveAppState(state: PersistedAppState) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
