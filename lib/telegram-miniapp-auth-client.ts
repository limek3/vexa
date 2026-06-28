'use client';

export const CLICKBOOK_AUTH_SESSION_READY_EVENT = 'clickbook:auth-session-ready';

export type TelegramMiniAppAuthPayload = {
  ok?: boolean;
  app_session?: boolean;
  appSessionToken?: string;
  user?: {
    id?: string;
    telegramId?: number;
    username?: string | null;
    firstName?: string | null;
  };
  startParam?: string | null;
  error?: string;
};

type TelegramWebApp = {
  initData?: string;
  initDataUnsafe?: {
    user?: unknown;
    auth_date?: number;
    start_param?: string;
  };
  ready?: () => void;
  expand?: () => void;
};

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
};

function getTelegramWebApp() {
  if (typeof window === 'undefined') return undefined;
  return (window as TelegramWindow).Telegram?.WebApp;
}

const APP_SESSION_STORAGE_KEY = 'clickbook_app_session_token';

let cachedAuthPromise: Promise<TelegramMiniAppAuthPayload> | null = null;
let hasSuccessfulAuth = false;

export function getStoredTelegramAppSessionToken() {
  if (typeof window === 'undefined') return '';

  try {
    return window.localStorage.getItem(APP_SESSION_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function storeTelegramAppSessionToken(token?: string | null) {
  if (!token || typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(APP_SESSION_STORAGE_KEY, token);
  } catch {}
}

export function clearTelegramAppSessionToken() {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(APP_SESSION_STORAGE_KEY);
  } catch {}
}

export function getTelegramAppSessionHeaders() {
  const token = getStoredTelegramAppSessionToken();
  return token ? { 'X-ClickBook-App-Session': token } : {};
}


function getTelegramMiniAppInitDataFromLocation() {
  if (typeof window === 'undefined') return '';

  try {
    const search = window.location.search.startsWith('?')
      ? window.location.search.slice(1)
      : window.location.search;
    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.slice(1)
      : window.location.hash;
    const params = new URLSearchParams([search, hash].filter(Boolean).join('&'));
    return params.get('tgWebAppData') || '';
  } catch {
    return '';
  }
}

export function getTelegramMiniAppInitData() {
  if (typeof window === 'undefined') return '';

  const fallbackInitData = getTelegramMiniAppInitDataFromLocation();

  try {
    const webApp = getTelegramWebApp();
    try { webApp?.ready?.(); } catch {}
    try { webApp?.expand?.(); } catch {}
    return webApp?.initData || fallbackInitData;
  } catch {
    return getTelegramWebApp()?.initData || fallbackInitData;
  }
}

export function hasTelegramMiniAppInitData() {
  return getTelegramMiniAppInitData().length > 10;
}

export function hasTelegramMiniAppRuntime() {
  if (typeof window === 'undefined') return false;

  const webApp = getTelegramWebApp();

  return Boolean(
    webApp?.initData ||
      webApp?.initDataUnsafe?.user ||
      getTelegramMiniAppInitDataFromLocation(),
  );
}

export async function waitForTelegramMiniAppInitData(timeoutMs = 1800) {
  const immediate = getTelegramMiniAppInitData();
  if (immediate) return immediate;

  if (typeof window === 'undefined') return '';

  const startedAt = Date.now();

  return new Promise<string>((resolve) => {
    const tick = () => {
      const value = getTelegramMiniAppInitData();

      if (value) {
        resolve(value);
        return;
      }

      if (Date.now() - startedAt >= timeoutMs) {
        resolve('');
        return;
      }

      window.setTimeout(tick, 80);
    };

    tick();
  });
}

function dispatchAuthReady(payload: TelegramMiniAppAuthPayload) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent(CLICKBOOK_AUTH_SESSION_READY_EVENT, {
      detail: payload,
    }),
  );
}

async function readJsonSafe(response: Response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text) as TelegramMiniAppAuthPayload;
  } catch {
    return { error: text } satisfies TelegramMiniAppAuthPayload;
  }
}

export async function authorizeTelegramMiniAppSession(options?: { force?: boolean; waitMs?: number }) {
  const initData = await waitForTelegramMiniAppInitData(options?.waitMs ?? 1800);

  if (!initData) {
    return {
      ok: false,
      error: 'telegram_init_data_empty',
    } satisfies TelegramMiniAppAuthPayload;
  }

  if (hasSuccessfulAuth && !options?.force) {
    return {
      ok: true,
      app_session: true,
      appSessionToken: getStoredTelegramAppSessionToken() || undefined,
    } satisfies TelegramMiniAppAuthPayload;
  }

  if (cachedAuthPromise && !options?.force) {
    return cachedAuthPromise;
  }

  cachedAuthPromise = (async () => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);

    const response = await fetch('/api/auth/telegram-miniapp', {
      method: 'POST',
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ initData }),
    }).finally(() => window.clearTimeout(timeout));

    const payload = await readJsonSafe(response);

    if (!response.ok || !payload.ok) {
      const message = payload.error || 'telegram_miniapp_auth_failed';
      throw new Error(message);
    }

    storeTelegramAppSessionToken(payload.appSessionToken);
    hasSuccessfulAuth = true;
    dispatchAuthReady(payload);
    return payload;
  })();

  try {
    return await cachedAuthPromise;
  } catch (error) {
    cachedAuthPromise = null;
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'telegram_miniapp_auth_failed',
    } satisfies TelegramMiniAppAuthPayload;
  }
}