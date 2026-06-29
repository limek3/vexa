'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import {
  applyTelegramMiniAppBase,
  applyTelegramMiniAppChrome,
  isTelegramRuntimeCandidate,
} from '@/lib/telegram-webapp-safe';

const MINIAPP_BG = '#0a0a0a';

function markTelegramSdkState(state: 'disabled' | 'loading' | 'ready' | 'failed') {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.telegramSdk = state;
}

export function TelegramMiniAppSdk() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const enabled = isTelegramRuntimeCandidate();
    setShouldLoad(enabled);
    markTelegramSdkState(enabled ? 'loading' : 'disabled');
  }, []);

  if (!shouldLoad) return null;

  return (
    <Script
      id="telegram-miniapp-sdk"
      src="https://telegram.org/js/telegram-web-app.js"
      strategy="afterInteractive"
      onLoad={() => {
        markTelegramSdkState('ready');
        applyTelegramMiniAppBase();
        applyTelegramMiniAppChrome(MINIAPP_BG);
      }}
      onError={() => {
        markTelegramSdkState('failed');
        console.warn('Telegram WebApp SDK failed to load. Mini app continues without Telegram-only APIs.');
      }}
    />
  );
}
