'use client';

import { Component, useEffect, useState, type ReactNode } from 'react';
import { BrandLogo } from '@/components/brand/brand-logo';
import { MiniAppEntry } from '@/components/mini/mini-app-entry';
import { TelegramMiniAppViewport } from '@/components/system/telegram-miniapp-viewport';
import {
  authorizeTelegramMiniAppSession,
  hasTelegramMiniAppRuntime,
} from '@/lib/telegram-miniapp-auth-client';

type AppMode = 'checking' | 'mobile';

type BoundaryState = {
  error: string;
};

class MiniBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: '' };

  static getDerivedStateFromError(error: unknown) {
    return {
      error: error instanceof Error ? error.message : 'unknown_client_error',
    };
  }

  componentDidCatch(error: unknown) {
    console.error('[ClickBook mini app render]', error);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] px-5 text-white">
        <div className="w-full max-w-[350px] rounded-[18px] border border-white/[0.10] bg-[#141414] p-5 text-center">
          <BrandLogo />
          <div className="mt-5 text-[22px] font-semibold leading-none tracking-[-0.08em]">
            Mini app поймала ошибку
          </div>
          <div className="mt-3 rounded-[10px] border border-white/[0.08] bg-white/[0.035] px-3 py-2 text-left text-[11px] leading-5 text-white/55">
            {this.state.error}
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 h-10 w-full rounded-[10px] border border-white/[0.12] bg-white text-[12px] font-bold text-black active:scale-[0.985]"
          >
            Открыть заново
          </button>
        </div>
      </main>
    );
  }
}

function isPhoneOrTelegram() {
  if (typeof window === 'undefined') return false;

  try {
    const params = new URLSearchParams(window.location.search || '');
    if (params.get('mini') === '1' || params.has('tgWebAppData') || hasTelegramMiniAppRuntime()) return true;

    const viewportWidth = window.innerWidth || 0;
    const screenWidth = window.screen?.width || viewportWidth;
    const width = Math.min(viewportWidth, screenWidth || viewportWidth);
    const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;

    return viewportWidth <= 820 || (coarsePointer && width <= 900);
  } catch {
    return true;
  }
}

function dashboardTarget() {
  if (typeof window === 'undefined') return '/dashboard';
  try {
    const params = new URLSearchParams(window.location.search || '');
    return params.get('demo') === '1' ? '/dashboard?demo=1' : '/dashboard';
  } catch {
    return '/dashboard';
  }
}

export default function AppPage() {
  const [mode, setMode] = useState<AppMode>('checking');

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const mobile = isPhoneOrTelegram();

      if (!mobile) {
        try {
          if (hasTelegramMiniAppRuntime()) {
            await authorizeTelegramMiniAppSession({ waitMs: 2200 });
          }
        } catch {}

        if (!cancelled) window.location.replace(dashboardTarget());
        return;
      }

      if (!cancelled) setMode('mobile');
    }

    void boot();

    return () => {
      cancelled = true;
    };
  }, []);

  if (mode === 'mobile') {
    return (
      <MiniBoundary>
        <TelegramMiniAppViewport />
        <MiniAppEntry />
      </MiniBoundary>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080808] px-6 text-white">
      <div className="flex w-full max-w-[320px] flex-col items-center rounded-[22px] border border-white/[0.08] bg-[#141414]/92 px-5 py-6 text-center backdrop-blur-[22px]">
        <BrandLogo />
        <div className="mt-5 size-9 animate-spin rounded-full border border-white/[0.08] border-t-white/60" />
        <div className="mt-5 text-[15px] font-semibold tracking-[-0.045em]">Открываем кабинет</div>
        <div className="mt-1 max-w-[230px] text-[12px] leading-5 text-white/42">
          Проверяем устройство и открываем нужную версию.
        </div>
      </div>
    </main>
  );
}