'use client';

import { useEffect } from 'react';
import {
  applyTelegramMiniAppBase,
  applyTelegramMiniAppChrome,
  getTelegramWebApp,
  safeTelegramCall,
  type TelegramWebAppSafe,
} from '@/lib/telegram-webapp-safe';

const MINIAPP_BG = '#0a0a0a';

function setPx(name: string, value: unknown) {
  if (typeof document === 'undefined') return;
  const number = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  document.documentElement.style.setProperty(name, `${Math.max(0, Math.round(number))}px`);
}

function upsertThemeColor(color: string) {
  if (typeof document === 'undefined') return;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = color;
}

function applyDarkMiniChrome(webApp?: TelegramWebAppSafe) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.tgMiniapp = 'true';
  root.style.backgroundColor = MINIAPP_BG;
  root.style.colorScheme = 'dark';
  document.body.style.backgroundColor = MINIAPP_BG;
  document.body.style.colorScheme = 'dark';
  upsertThemeColor(MINIAPP_BG);
  applyTelegramMiniAppChrome(MINIAPP_BG, webApp);
}

export function TelegramMiniAppViewport() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const apply = () => {
      const webApp = getTelegramWebApp();

      applyTelegramMiniAppBase(webApp);
      applyDarkMiniChrome(webApp);

      const safeArea = webApp?.safeAreaInset ?? {};
      const contentSafeArea = webApp?.contentSafeAreaInset ?? {};

      // Для контента внутри Telegram WebView важен contentSafeAreaInset.
      // safeAreaInset часто включает системный статус-бар/нативную шапку Telegram,
      // из-за этого наша верхняя плашка получала двойной отступ и уезжала вниз.
      const contentTop = contentSafeArea.top ?? 0;
      const contentBottom = contentSafeArea.bottom ?? safeArea.bottom ?? 0;

      setPx('--tg-safe-top', contentTop);
      setPx('--tg-safe-bottom', contentBottom);
      setPx('--tg-content-safe-top', contentTop);
      setPx('--tg-content-safe-bottom', contentBottom);
      setPx('--tg-device-safe-top', safeArea.top ?? 0);
      setPx('--tg-device-safe-bottom', safeArea.bottom ?? 0);
      setPx('--tg-viewport-height', webApp?.viewportStableHeight ?? webApp?.viewportHeight ?? window.innerHeight);
    };

    safeTelegramCall(apply);

    const handler = () => safeTelegramCall(apply);
    safeTelegramCall(() => getTelegramWebApp()?.onEvent?.('viewportChanged', handler));
    window.addEventListener('resize', handler);
    window.addEventListener('orientationchange', handler);

    return () => {
      safeTelegramCall(() => getTelegramWebApp()?.offEvent?.('viewportChanged', handler));
      window.removeEventListener('resize', handler);
      window.removeEventListener('orientationchange', handler);
    };
  }, []);

  return null;
}
