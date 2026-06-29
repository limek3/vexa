'use client';

import { useEffect } from 'react';
import { MiniApp } from '@/components/mini/mini-app-shell';
import { TelegramMiniAppSdk } from '@/components/system/telegram-miniapp-sdk';
import { TelegramMiniAppViewport } from '@/components/system/telegram-miniapp-viewport';
import {
  applyTelegramMiniAppBase,
  applyTelegramMiniAppChrome,
  getTelegramWebApp,
} from '@/lib/telegram-webapp-safe';

const MINIAPP_BG = '#0a0a0a';

export default function MiniAppPage() {
  useEffect(() => {
    const tg = getTelegramWebApp();
    applyTelegramMiniAppBase(tg);
    applyTelegramMiniAppChrome(MINIAPP_BG, tg);

    document.documentElement.dataset.tgMiniapp = 'true';
    document.documentElement.style.backgroundColor = MINIAPP_BG;
    document.documentElement.style.colorScheme = 'dark';
    document.body.style.backgroundColor = MINIAPP_BG;
    document.body.style.colorScheme = 'dark';
  }, []);

  // Start dark by default to avoid Telegram/WebView native white chrome on first paint.
  const initialMode = 'dark';

  return (
    <>
      <TelegramMiniAppSdk />
      <TelegramMiniAppViewport />
      <MiniApp mode={initialMode} />
    </>
  );
}
