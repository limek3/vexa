'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ExternalLink, Loader2, MessageCircleMore, X } from 'lucide-react';
import { storeTelegramAppSessionToken } from '@/lib/telegram-miniapp-auth-client';
import { cn } from '@/lib/utils';

type VkStartResponse = {
  token?: string;
  vkUrl?: string;
  dialogUrl?: string;
  prefillUrl?: string;
  command?: string;
  expiresIn?: number;
  error?: string;
};

type VkStatusResponse = {
  status: 'pending' | 'confirmed' | 'expired' | 'consumed' | 'invalid' | 'not_found' | 'error';
  app_session?: boolean;
  appSessionToken?: string;
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

function humanVkError(value?: string) {
  if (!value) return 'Не удалось завершить вход через VK.';

  if (value.includes('sloty_vk_login_requests')) {
    return 'Не найдена таблица VK-входа. Выполните SQL migration 20260502_0022_clickbook_vk_bot_auth.sql.';
  }

  if (value.includes('Missing VK_BOT_ACCESS_TOKEN')) {
    return 'Не задан VK_BOT_ACCESS_TOKEN в Render.';
  }

  if (value.includes('Missing VK_BOT_GROUP_ID') || value.includes('VK_BOT_SCREEN_NAME')) {
    return 'Не задан VK_BOT_GROUP_ID или VK_BOT_SCREEN_NAME в Render.';
  }

  return value;
}

export function VkLoginButton({
  redirectTo = '/dashboard',
  mode = 'login',
  className,
}: {
  redirectTo?: string;
  mode?: 'login' | 'link';
  className?: string;
}) {
  const pollTimerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);

  const [token, setToken] = useState<string | null>(null);
  const [vkUrl, setVkUrl] = useState<string | null>(null);
  const [prefillUrl, setPrefillUrl] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'opening' | 'waiting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const clearPoll = () => {
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  useEffect(() => () => clearPoll(), []);

  const finishLogin = async (payload: VkStatusResponse) => {
    if (!payload.app_session) throw new Error('vk_session_missing');

    storeTelegramAppSessionToken(payload.appSessionToken);
    setState('success');
    setMessage(mode === 'link' ? 'VK подключён.' : 'VK подтверждён. Открываем кабинет...');

    if (mode === 'login') {
      window.setTimeout(() => {
        window.location.assign(redirectTo);
      }, 350);
    } else {
      window.setTimeout(() => {
        window.location.assign(redirectTo || '/dashboard/profile');
      }, 650);
    }
  };

  const pollStatus = async (nextToken: string) => {
    const response = await fetch(`/api/auth/vk/status?token=${encodeURIComponent(nextToken)}`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });

    const payload = await readJsonSafe<VkStatusResponse>(response);

    if (!response.ok || payload.status === 'error') {
      throw new Error(humanVkError(payload.error || 'vk_status_failed'));
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
    setState('opening');
    setMessage(null);
    setToken(null);
    setVkUrl(null);
    setPrefillUrl(null);

    try {
      const url = new URL('/api/auth/vk/start', window.location.origin);
      url.searchParams.set('next', redirectTo);
      url.searchParams.set('mode', mode);

      const response = await fetch(url.toString(), {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });

      const payload = await readJsonSafe<VkStartResponse>(response);

      if (!response.ok || !payload.token || !payload.vkUrl) {
        throw new Error(humanVkError(payload.error || 'vk_start_failed'));
      }

      setToken(payload.token);
      setVkUrl(payload.vkUrl);
      setPrefillUrl(payload.prefillUrl ?? null);
      setState('waiting');
      setMessage(mode === 'link' ? 'Открываем VK в этой же вкладке. Нажмите «Открыть кабинет» в боте.' : 'Открываем VK в этой же вкладке. Нажмите «Открыть кабинет» в боте — без ручных кодов.');
      startedAtRef.current = Date.now();

      window.location.assign(payload.vkUrl);

      pollTimerRef.current = window.setInterval(() => {
        void pollStatus(payload.token as string).catch((error) => {
          clearPoll();
          setState('error');
          setMessage(error instanceof Error ? error.message : 'Не удалось проверить VK-вход.');
        });
      }, 1600);

      window.setTimeout(() => {
        void pollStatus(payload.token as string).catch(() => {});
      }, 800);
    } catch (error) {
      clearPoll();
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Не удалось начать вход через VK.');
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
              : 'border-[#2787f5]/35 bg-[#2787f5] text-white hover:bg-[#1f78dc]',
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
          <MessageCircleMore className="size-4" />
        )}

        {success
          ? 'VK подтверждён'
          : failed
            ? 'Повторить вход через VK'
            : loading
              ? 'Ждём подтверждение в VK'
              : mode === 'link'
                ? 'Подключить VK'
                : 'Войти через VK'}
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

      {vkUrl && state === 'waiting' ? (
        <div className="grid gap-2 rounded-[11px] border border-black/[0.08] bg-white/50 p-2 dark:border-white/[0.08] dark:bg-white/[0.04]">
          <a
            href={vkUrl}
            className="inline-flex h-8 items-center justify-center gap-2 rounded-[9px] border border-black/[0.08] bg-white text-[11px] font-semibold text-black/56 transition hover:bg-black/[0.035] hover:text-black dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/56 dark:hover:bg-white/[0.07] dark:hover:text-white"
          >
            <ExternalLink className="size-3.5" />
            Открыть VK-бота в этой вкладке
          </a>

          <div className="text-center text-[10.5px] leading-4 text-black/38 dark:text-white/34">
            VK откроется в этой же вкладке. В боте нажмите «Открыть кабинет».
          </div>
        </div>
      ) : null}

      {token && state === 'waiting' ? (
        <div className="text-center text-[10.5px] text-black/34 dark:text-white/30">
          Вход активен 10 минут. Подтверждения и уведомления будут приходить от сообщества КликБук.
        </div>
      ) : null}
    </div>
  );
}
