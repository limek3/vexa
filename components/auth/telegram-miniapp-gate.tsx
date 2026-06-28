'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ExternalLink, Loader2, Send, ShieldCheck } from 'lucide-react';
import { authorizeTelegramMiniAppSession, getTelegramAppSessionHeaders } from '@/lib/telegram-miniapp-auth-client';
import { cn } from '@/lib/utils';

type MiniAppAuthState = 'checking' | 'success' | 'outside' | 'error';

function getBotUsername() {
  return process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.replace(/^@/, '').trim() || '';
}

function normalizeRedirect(value?: string | null) {
  if (!value) return '/dashboard';

  try {
    const decoded = decodeURIComponent(value);
    return decoded.startsWith('/') && !decoded.startsWith('//') ? decoded : '/dashboard';
  } catch {
    return value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';
  }
}

function normalizeTelegramMiniAppError(error?: string) {
  if (!error) return 'Не удалось войти через Telegram Mini App.';

  if (error.includes('telegram_init_data_expired')) {
    return 'Telegram-сессия устарела. Закройте Mini App и откройте кабинет заново из бота.';
  }

  if (error.includes('telegram_init_hash_invalid')) {
    return 'Telegram не подтвердил подпись входа. Проверьте TELEGRAM_BOT_TOKEN в Render.';
  }

  if (error.includes('sloty_telegram_accounts')) {
    return 'Не найдена таблица Telegram-аккаунтов. Выполните свежий SQL из архива в Supabase.';
  }

  if (error.includes('telegram_init_data_empty')) {
    return 'Telegram не передал данные входа. Откройте Mini App кнопкой из бота, а не прямой ссылкой в браузере.';
  }

  return error;
}

async function sleep(ms: number) {
  await new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function fetchWorkspaceWithSession() {
  return fetch('/api/workspace', {
    credentials: 'include',
    cache: 'no-store',
    headers: getTelegramAppSessionHeaders(),
  });
}

async function resolveTargetAfterAuth(redirectTo: string) {
  const safeRedirect = normalizeRedirect(redirectTo);

  // Give the browser a tiny moment to persist HttpOnly cookie after /api/auth/telegram-miniapp.
  await sleep(180);

  let response = await fetchWorkspaceWithSession();

  // Telegram WebView can be slow to attach cookies on the first request.
  if (response.status === 401) {
    await sleep(450);
    response = await fetchWorkspaceWithSession();
  }

  if (response.status === 404) return '/create-profile';
  if (response.ok) return safeRedirect;

  // Do not keep the loading card forever. Let the workspace handle its own state.
  return safeRedirect;
}

export function TelegramMiniAppGate({
  redirectTo = '/dashboard',
  className,
}: {
  redirectTo?: string;
  className?: string;
}) {
  const [state, setState] = useState<MiniAppAuthState>('checking');
  const [message, setMessage] = useState('Проверяем Telegram-сессию...');
  const [fallbackTarget, setFallbackTarget] = useState(normalizeRedirect(redirectTo));

  const botUrl = useMemo(() => {
    const botUsername = getBotUsername();
    return botUsername ? `https://t.me/${botUsername}?startapp=dashboard` : null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    let hardTimeout: number | undefined;

    async function run() {
      try {
        hardTimeout = window.setTimeout(() => {
          if (cancelled) return;
          setState('error');
          setMessage('Вход занял слишком много времени. Нажмите «Открыть кабинет» или перезапустите Mini App из бота.');
        }, 11500);

        const payload = await authorizeTelegramMiniAppSession({ force: true, waitMs: 3200 });

        if (cancelled) return;

        if (!payload.ok) {
          setState(payload.error === 'telegram_init_data_empty' ? 'outside' : 'error');
          setMessage(normalizeTelegramMiniAppError(payload.error));
          return;
        }

        setState('success');
        setMessage('Сессия создана. Открываем кабинет...');

        const target = await resolveTargetAfterAuth(redirectTo);
        if (cancelled) return;

        setFallbackTarget(target);
        window.location.replace(target);
      } catch (error) {
        if (cancelled) return;
        setState('error');
        setMessage(normalizeTelegramMiniAppError(error instanceof Error ? error.message : 'telegram_miniapp_auth_failed'));
      } finally {
        if (hardTimeout) window.clearTimeout(hardTimeout);
      }
    }

    void run();

    return () => {
      cancelled = true;
      if (hardTimeout) window.clearTimeout(hardTimeout);
    };
  }, [redirectTo]);

  const loading = state === 'checking';
  const success = state === 'success';
  const error = state === 'error';

  return (
    <div
      className={cn(
        'rounded-[14px] border border-black/[0.08] bg-white/58 p-4 text-center dark:border-white/[0.08] dark:bg-white/[0.04]',
        className,
      )}
    >
      <div
        className={cn(
          'mx-auto grid size-12 place-items-center rounded-[13px] border',
          success
            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100'
            : error
              ? 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-100'
              : 'border-black/[0.08] bg-black/[0.025] text-black/48 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/48',
        )}
      >
        {loading ? (
          <Loader2 className="size-5 animate-spin" />
        ) : success ? (
          <CheckCircle2 className="size-5" />
        ) : error ? (
          <ShieldCheck className="size-5" />
        ) : (
          <Send className="size-5" />
        )}
      </div>

      <div className="mt-4 text-[18px] font-semibold tracking-[-0.045em] text-black dark:text-white">
        {success
          ? 'Telegram подтверждён'
          : error
            ? 'Не удалось войти'
            : state === 'outside'
              ? 'Откройте через Telegram'
              : 'Входим через Telegram'}
      </div>

      <p className="mx-auto mt-2 max-w-[320px] text-[12px] leading-5 text-black/50 dark:text-white/46">
        {message}
      </p>

      {state === 'outside' || state === 'error' || state === 'success' ? (
        <div className="mt-4 grid gap-2">
          <button
            type="button"
            onClick={() => window.location.replace(fallbackTarget)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-black/[0.08] bg-black px-4 text-[12px] font-semibold text-white transition hover:bg-black/88 active:scale-[0.99] dark:border-white/[0.10] dark:bg-white dark:text-black"
          >
            Открыть кабинет
          </button>

          {botUrl && state !== 'success' ? (
            <a
              href={botUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[#2692d8] bg-[#2ea6ff] px-4 text-[12px] font-semibold text-white transition hover:bg-[#2299f0] active:scale-[0.99]"
            >
              <Send className="size-4" />
              Открыть Mini App в Telegram
            </a>
          ) : null}

          {state !== 'success' ? (
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-black/[0.08] bg-white px-3 text-[11px] font-semibold text-black/54 transition hover:bg-black/[0.035] hover:text-black dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/54 dark:hover:bg-white/[0.07] dark:hover:text-white"
            >
              <ExternalLink className="size-3.5" />
              Войти на сайте
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
