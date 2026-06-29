'use client';

import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function isStandaloneMode() {
  if (typeof window === 'undefined') return false;

  if (window.clickbookDesktop?.isDesktop) return true;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    // iOS Safari
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function PwaInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (isStandaloneMode()) return;

    const dismissedUntil = Number(window.localStorage.getItem('clickbook-pwa-dismissed-until') ?? 0);
    if (dismissedUntil > Date.now()) return;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
      setHidden(false);
    };

    const onInstalled = () => {
      setPromptEvent(null);
      setHidden(true);
      window.localStorage.removeItem('clickbook-pwa-dismissed-until');
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (hidden || !promptEvent) return null;

  const install = async () => {
    await promptEvent.prompt();
    const result = await promptEvent.userChoice;

    setPromptEvent(null);
    setHidden(true);

    if (result.outcome !== 'accepted') {
      window.localStorage.setItem('clickbook-pwa-dismissed-until', String(Date.now() + 1000 * 60 * 60 * 24 * 7));
    }
  };

  const dismiss = () => {
    window.localStorage.setItem('clickbook-pwa-dismissed-until', String(Date.now() + 1000 * 60 * 60 * 24 * 7));
    setHidden(true);
  };

  return (
    <div aria-live="polite" className="fixed bottom-4 right-4 z-[2147483000] max-w-[calc(100vw-32px)]">
      <div className="w-[360px] max-w-full rounded-[24px] border border-black/10 bg-white/90 p-3 shadow-2xl shadow-black/15 backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/90 dark:shadow-black/40">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-neutral-950 shadow-sm dark:bg-white">
            <img src="/brand/clickbook-mark-dark-64.png" alt="КликБук" className="h-7 w-7 object-contain dark:hidden" />
            <img src="/brand/clickbook-mark-light-64.png" alt="КликБук" className="hidden h-7 w-7 object-contain dark:block" />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-sm font-semibold leading-5 text-neutral-950 dark:text-white">Установить КликБук на ПК</p>
            <p className="mt-1 text-xs leading-5 text-neutral-600 dark:text-neutral-400">
              Откроется отдельным окном как приложение, без вкладки браузера.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={install}
                className="rounded-full bg-neutral-950 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
              >
                Установить
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-full border border-black/10 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-100 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Потом
              </button>
            </div>
          </div>
          <button
            type="button"
            aria-label="Скрыть установку приложения"
            onClick={dismiss}
            className="rounded-full px-2 py-1 text-sm text-neutral-500 transition hover:bg-black/5 hover:text-neutral-900 dark:hover:bg-white/10 dark:hover:text-white"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
