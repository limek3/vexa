'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy, ExternalLink, Loader2, Send, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { authorizeTelegramMiniAppSession, clearTelegramAppSessionToken, storeTelegramAppSessionToken } from '@/lib/telegram-miniapp-auth-client';
import { cn } from '@/lib/utils';

type TelegramStartResponse = {
  token?: string;
  botUrl?: string;
  expiresIn?: number;
  error?: string;
};

type TelegramStatusResponse = {
  status: 'pending' | 'confirmed' | 'expired' | 'consumed' | 'invalid' | 'not_found' | 'error';
  app_session?: boolean;
  appSessionToken?: string;
  access_token?: string;
  refresh_token?: string;
  error?: string;
};

async function readJsonSafe<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) return {} as T;

  try {
    return JSON.parse(text) as T;
  } catch {
    return { error: text } as T;
  }
}

function humanTelegramError(value?: string) {
  if (!value) return 'Не удалось завершить Telegram-вход.';

  if (value.includes('supabase_token_failed')) {
    return 'Telegram подтверждён, но Supabase не выдал сессию. Проверьте Email provider в Supabase Auth и переменные хостинга.';
  }

  if (value.includes('sloty_telegram_accounts')) {
    return 'Не найдена таблица Telegram-аккаунтов. Выполните SQL migration 20260430_0006_telegram_bot_auth.sql в Supabase.';
  }

  if (value.includes('Internal Server Error')) {
    return 'Сервер не завершил Telegram-вход. Проверьте Render Logs для /api/auth/telegram/status.';
  }

  return value;
}

export function TelegramLoginButton({
  redirectTo = '/dashboard',
  className,
}: {
  redirectTo?: string;
  className?: string;
}) {
  const router = useRouter();
  const pollTimerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);

  const [token, setToken] = useState<string | null>(null);
  const [botUrl, setBotUrl] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'opening' | 'waiting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [copiedCommand, setCopiedCommand] = useState(false);

  const manualCommand = token ? `/start auth_${token}` : null;

  const clearPoll = () => {
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearPoll();
  }, []);

  const finishLogin = async (payload: TelegramStatusResponse) => {
    // New stable flow: the server sets an HttpOnly ClickBook session cookie.
    // No Supabase browser session is required here. This avoids failing on
    // Supabase password/magic-link token creation.
    if (payload.app_session) {
      storeTelegramAppSessionToken(payload.appSessionToken);
      setState('success');
      setMessage('Готово. Открываем кабинет...');

      window.setTimeout(() => {
        window.location.assign(redirectTo);
      }, 350);
      return;
    }

    // Legacy fallback for old deployments that still return Supabase tokens.
    if (!payload.access_token || !payload.refresh_token) {
      throw new Error('telegram_session_missing');
    }

    const supabase = createClient();
    const { error } = await supabase.auth.setSession({
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
    });

    if (error) throw error;

    setState('success');
    setMessage('Готово. Открываем кабинет...');

    window.setTimeout(() => {
      window.location.assign(redirectTo);
      router.refresh();
    }, 350);
  };

  const pollStatus = async (nextToken: string) => {
    const response = await fetch(
      `/api/auth/telegram/status?token=${encodeURIComponent(nextToken)}`,
      {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      },
    );

    const payload = await readJsonSafe<TelegramStatusResponse>(response);

    if (!response.ok || payload.status === 'error') {
      throw new Error(humanTelegramError(payload.error || 'telegram_status_failed'));
    }

    if (payload.status === 'pending') {
      if (Date.now() - startedAtRef.current > 10 * 60 * 1000) {
        clearPoll();
        setState('error');
        setMessage('Время входа истекло. Нажмите кнопку ещё раз.');
      }
      return;
    }

    if (payload.status === 'confirmed') {
      clearPoll();
      await finishLogin(payload);
      return;
    }

    clearPoll();
    setState('error');
    setMessage(
      payload.status === 'expired'
        ? 'Ссылка устарела. Нажмите кнопку ещё раз.'
        : payload.status === 'consumed'
          ? 'Эта ссылка уже использована. Нажмите кнопку ещё раз.'
          : 'Не удалось подтвердить вход. Нажмите кнопку ещё раз.',
    );
  };

  const startLogin = async () => {
    clearPoll();
    clearTelegramAppSessionToken();
    setState('opening');
    setMessage(null);
    setToken(null);
    setBotUrl(null);
    setCopiedCommand(false);

    const miniAppAuth = await authorizeTelegramMiniAppSession({ force: true, waitMs: 2200 });

    if (miniAppAuth.ok) {
      await finishLogin({ status: 'confirmed', app_session: true });
      return;
    }

    if (miniAppAuth.error && miniAppAuth.error !== 'telegram_init_data_empty') {
      setState('error');
      setMessage(humanTelegramError(miniAppAuth.error || 'telegram_miniapp_auth_failed'));
      return;
    }

    try {
      const response = await fetch('/api/auth/telegram/start', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });

      const payload = await readJsonSafe<TelegramStartResponse>(response);

      if (!response.ok || !payload.token || !payload.botUrl) {
        throw new Error(humanTelegramError(payload.error || 'telegram_start_failed'));
      }

      setToken(payload.token);
      setBotUrl(payload.botUrl);
      setState('waiting');
      setMessage('В Telegram нажмите Start. Если бот открылся без команды — скопируйте команду ниже.');
      startedAtRef.current = Date.now();

      window.open(payload.botUrl, '_blank', 'noopener,noreferrer');

      pollTimerRef.current = window.setInterval(() => {
        void pollStatus(payload.token as string).catch((error) => {
          clearPoll();
          setState('error');
          setMessage(
            error instanceof Error
              ? error.message
              : 'Не удалось проверить подтверждение Telegram.',
          );
        });
      }, 1600);

      window.setTimeout(() => {
        void pollStatus(payload.token as string).catch(() => {});
      }, 800);
    } catch (error) {
      clearPoll();
      setState('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'Не удалось начать вход через Telegram.',
      );
    }
  };

  const copyManualCommand = async () => {
    if (!manualCommand) return;

    try {
      await navigator.clipboard.writeText(manualCommand);
      setCopiedCommand(true);
      window.setTimeout(() => setCopiedCommand(false), 1400);
    } catch {
      setCopiedCommand(false);
    }
  };

  const loading = state === 'opening' || state === 'waiting';
  const success = state === 'success';
  const failed = state === 'error';

  return (
    <div className={cn('grid gap-2', className)}>
      <button
        type="button"
        onClick={startLogin}
        disabled={loading || success}
        className={cn(
          'inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[11px] border px-4 text-[13px] font-semibold shadow-none transition-[background,border-color,color,opacity,transform] duration-150 active:scale-[0.99] disabled:pointer-events-none',
          success
            ? 'border-emerald-500/20 bg-emerald-500/12 text-emerald-700 dark:text-emerald-100'
            : failed
              ? 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-100'
              : 'border-[#2692d8] bg-[#2ea6ff] text-white hover:bg-[#2299f0] dark:border-[#2692d8]',
          loading ? 'opacity-85' : '',
        )}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : success ? (
          <Check className="size-4" />
        ) : failed ? (
          <X className="size-4" />
        ) : (
          <Send className="size-4" />
        )}

        {success
          ? 'Telegram подтверждён'
          : failed
            ? 'Повторить вход через Telegram'
            : loading
              ? 'Ждём подтверждение в Telegram'
              : 'Войти через Telegram'}
      </button>

      {message ? (
        <div
          className={cn(
            'rounded-[10px] border px-3 py-2 text-[11px] leading-4',
            failed
              ? 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-100'
              : success
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100'
                : 'border-black/[0.08] bg-white/58 text-black/48 dark:border-white/[0.08] dark:bg-white/[0.045] dark:text-white/46',
          )}
        >
          {message}
        </div>
      ) : null}

      {botUrl && state === 'waiting' ? (
        <div className="grid gap-2 rounded-[11px] border border-black/[0.08] bg-white/50 p-2 dark:border-white/[0.08] dark:bg-white/[0.04]">
          <a
            href={botUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center justify-center gap-2 rounded-[9px] border border-black/[0.08] bg-white text-[11px] font-semibold text-black/56 transition hover:bg-black/[0.035] hover:text-black dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/56 dark:hover:bg-white/[0.07] dark:hover:text-white"
          >
            <ExternalLink className="size-3.5" />
            Открыть бота ещё раз
          </a>

          {manualCommand ? (
            <button
              type="button"
              onClick={copyManualCommand}
              className="inline-flex min-h-8 items-center justify-center gap-2 rounded-[9px] border border-black/[0.08] bg-white px-2 text-[10.5px] font-semibold text-black/50 transition hover:bg-black/[0.035] hover:text-black dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/50 dark:hover:bg-white/[0.07] dark:hover:text-white"
            >
              {copiedCommand ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
              {copiedCommand ? 'Команда скопирована' : 'Скопировать команду /start'}
            </button>
          ) : null}
        </div>
      ) : null}

      {token && state === 'waiting' ? (
        <div className="text-center text-[10.5px] text-black/34 dark:text-white/30">
          Вход активен 10 минут.
        </div>
      ) : null}
    </div>
  );
}
