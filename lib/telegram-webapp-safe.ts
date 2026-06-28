export type TelegramWebAppSafe = {
  version?: string;
  platform?: string;
  initData?: string;
  initDataUnsafe?: {
    user?: unknown;
    auth_date?: number;
    start_param?: string;
  };
  isVersionAtLeast?: (version: string) => boolean;
  ready?: () => void;
  expand?: () => void;
  requestFullscreen?: () => void;
  disableVerticalSwipes?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
  viewportHeight?: number;
  viewportStableHeight?: number;
  safeAreaInset?: { top?: number; bottom?: number; left?: number; right?: number };
  contentSafeAreaInset?: { top?: number; bottom?: number; left?: number; right?: number };
  onEvent?: (event: string, callback: () => void) => void;
  offEvent?: (event: string, callback: () => void) => void;
  BackButton?: {
    show?: () => void;
    hide?: () => void;
    onClick?: (callback: () => void) => void;
    offClick?: (callback: () => void) => void;
  };
  HapticFeedback?: {
    impactOccurred?: (style: 'light' | 'medium' | 'heavy') => void;
    notificationOccurred?: (type: 'success' | 'warning' | 'error') => void;
    selectionChanged?: () => void;
  };
  close?: () => void;
};

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: TelegramWebAppSafe;
  };
};

export function getTelegramWebApp(): TelegramWebAppSafe | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as TelegramWindow).Telegram?.WebApp;
}

export function isTelegramRuntimeCandidate() {
  if (typeof window === 'undefined') return false;

  const url = `${window.location.search || ''}${window.location.hash || ''}`;

  return Boolean(
    getTelegramWebApp() ||
      url.includes('tgWebAppData=') ||
      url.includes('tgWebAppVersion=') ||
      url.includes('tgWebAppPlatform=') ||
      /Telegram/i.test(window.navigator.userAgent),
  );
}

export function telegramVersionAtLeast(webApp: TelegramWebAppSafe | undefined, version: string) {
  if (!webApp || typeof webApp.isVersionAtLeast !== 'function') return false;

  try {
    return webApp.isVersionAtLeast(version);
  } catch {
    return false;
  }
}

export function safeTelegramCall(action: () => void) {
  try {
    action();
    return true;
  } catch {
    return false;
  }
}

export function applyTelegramMiniAppBase(webApp = getTelegramWebApp()) {
  safeTelegramCall(() => webApp?.ready?.());
  safeTelegramCall(() => webApp?.expand?.());

  // requestFullscreen and disableVerticalSwipes crash older Telegram WebApp clients.
  // Keep them strictly opt-in by version so a blocked/outdated Telegram SDK never breaks the website.
  if (telegramVersionAtLeast(webApp, '8.0')) {
    safeTelegramCall(() => webApp?.requestFullscreen?.());
    safeTelegramCall(() => webApp?.disableVerticalSwipes?.());
  }
}

export function applyTelegramMiniAppChrome(color: string, webApp = getTelegramWebApp()) {
  // These methods are not available in old WebApp clients and can print noisy warnings.
  if (!telegramVersionAtLeast(webApp, '6.1')) return;

  safeTelegramCall(() => webApp?.setHeaderColor?.(color));
  safeTelegramCall(() => webApp?.setBackgroundColor?.(color));

  // Bottom bar color is newer than the base color methods. Call it only when supported.
  if (telegramVersionAtLeast(webApp, '7.10')) {
    safeTelegramCall(() => webApp?.setBottomBarColor?.(color));
  }
}
