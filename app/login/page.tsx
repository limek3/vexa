'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  Check,
  Chrome,
  Loader2,
  MessageCircleMore,
  Send,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';

import { TelegramLoginButton } from '@/components/auth/telegram-login-button';
import { VkLoginButton } from '@/components/auth/vk-login-button';
import { BrandLogo } from '@/components/brand/brand-logo';
import { LanguageToggle } from '@/components/shared/language-toggle';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { useBrowserSearchParams } from '@/hooks/use-browser-search-params';
import { useLocale } from '@/lib/locale-context';
import { createClient } from '@/lib/supabase/client';
import { clearTelegramAppSessionToken } from '@/lib/telegram-miniapp-auth-client';
import { cn } from '@/lib/utils';

const authConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
);

type OAuthProvider = 'google';
type AuthChannel = 'telegram' | 'vk' | 'google';
type LoginLocale = 'ru' | 'en';

type LoginCopy = {
  loginLabel: string;
  title: string;
  subtitle: string;
  setupLabel: string;
  setupTitle: string;
  setupText: string;
  about: string;
  telegramTitle: string;
  telegramHelper: string;
  vkTitle: string;
  vkHelper: string;
  googleTitle: string;
  googleHelper: string;
  openTelegram: string;
  openTelegramHint: string;
  telegramExplain: string;
  vkPanelTitle: string;
  vkPanelText: string;
  googleButton: string;
  googleHint: string;
  googlePanelTitle: string;
  googlePanelText: string;
  vkNotConfigured: string;
  vkAuthFailed: string;
  callbackFailed: string;
  oauthFallback: string;
};

const copy: Record<LoginLocale, LoginCopy> = {
  ru: {
    loginLabel: 'Вход',
    title: 'Войти в кабинет',
    subtitle: 'Выберите удобный способ авторизации.',
    setupLabel: 'Setup',
    setupTitle: 'Авторизация не настроена',
    setupText:
      'Добавьте переменные окружения в Render и сделайте redeploy.',
    about: 'О платформе',

    telegramTitle: 'Telegram',
    telegramHelper: 'Mini App и бот',
    vkTitle: 'VK',
    vkHelper: 'Вход через бота',
    googleTitle: 'Google',
    googleHelper: 'Резервный вход',

    openTelegram: 'Открыть Telegram Mini App',
    openTelegramHint: 'вход через рабочий бот',
    telegramExplain:
      'Основной сценарий: вход, рабочие действия и уведомления остаются в Telegram.',

    vkPanelTitle: 'Вход через VK',
    vkPanelText: 'После подтверждения аккаунт будет связан с кабинетом.',

    googleButton: 'Войти через Google',
    googleHint: 'резервный способ доступа',
    googlePanelTitle: 'Резервный вход',
    googlePanelText:
      'Используйте Google, если вход через мессенджеры временно недоступен.',

    vkNotConfigured:
      'VK-вход не настроен. Проверьте VK_BOT_GROUP_ID и VK_BOT_ACCESS_TOKEN в Render.',
    vkAuthFailed: 'Не удалось войти через VK. Попробуйте ещё раз.',
    callbackFailed: 'Не удалось завершить вход. Попробуйте ещё раз.',
    oauthFallback:
      'Не удалось открыть авторизацию. Проверьте OAuth provider в Supabase.',
  },
  en: {
    loginLabel: 'Sign in',
    title: 'Sign in to workspace',
    subtitle: 'Choose a convenient authorization method.',
    setupLabel: 'Setup',
    setupTitle: 'Authorization is not configured',
    setupText:
      'Add environment variables in Render and redeploy.',
    about: 'About platform',

    telegramTitle: 'Telegram',
    telegramHelper: 'Mini App and bot',
    vkTitle: 'VK',
    vkHelper: 'Bot sign in',
    googleTitle: 'Google',
    googleHelper: 'Backup access',

    openTelegram: 'Open Telegram Mini App',
    openTelegramHint: 'sign in through work bot',
    telegramExplain:
      'Primary flow: sign in, work actions, and reminders stay in Telegram.',

    vkPanelTitle: 'VK sign in',
    vkPanelText: 'After confirmation, the account will be linked to workspace.',

    googleButton: 'Sign in with Google',
    googleHint: 'backup access method',
    googlePanelTitle: 'Backup access',
    googlePanelText:
      'Use Google if messenger sign in is temporarily unavailable.',

    vkNotConfigured:
      'VK sign in is not configured. Check VK_BOT_GROUP_ID and VK_BOT_ACCESS_TOKEN in Render.',
    vkAuthFailed: 'Could not sign in with VK. Try again.',
    callbackFailed: 'Could not complete sign in. Try again.',
    oauthFallback:
      'Could not open authorization. Check OAuth provider in Supabase.',
  },
};

function getAuthChannels(t: LoginCopy) {
  return [
    {
      id: 'telegram',
      title: t.telegramTitle,
      helper: t.telegramHelper,
      icon: Send,
    },
    {
      id: 'vk',
      title: t.vkTitle,
      helper: t.vkHelper,
      icon: MessageCircleMore,
    },
    {
      id: 'google',
      title: t.googleTitle,
      helper: t.googleHelper,
      icon: Chrome,
    },
  ] satisfies Array<{
    id: AuthChannel;
    title: string;
    helper: string;
    icon: LucideIcon;
  }>;
}

function MicroLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'text-[10px] font-semibold uppercase tracking-[0.16em] text-black/38 dark:text-white/34',
        className,
      )}
    >
      {children}
    </div>
  );
}

function Surface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'relative rounded-[18px] border border-[var(--cb-border)] bg-[var(--cb-surface)] text-[#111111] shadow-none dark:text-white',
        className,
      )}
    >
      {children}
    </section>
  );
}

function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-[12px] border border-[var(--cb-border)] bg-[var(--cb-soft-surface)]',
        className,
      )}
    >
      {children}
    </div>
  );
}

function AuthCardShell({ children }: { children: ReactNode }) {
  return (
    <Surface className="overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px overflow-hidden">
        <motion.div
          className="h-px w-1/2 bg-gradient-to-r from-transparent via-black/28 to-transparent dark:via-white/34"
          animate={{ x: ['-100%', '260%'] }}
          transition={{
            duration: 3.8,
            repeat: Infinity,
            ease: 'easeInOut',
            repeatDelay: 1.4,
          }}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-[18px] ring-1 ring-inset ring-white/35 dark:ring-white/[0.025]" />

      {children}
    </Surface>
  );
}

function AuthMethodTab({
  channel,
  active,
  onClick,
}: {
  channel: ReturnType<typeof getAuthChannels>[number];
  active: boolean;
  onClick: () => void;
}) {
  const Icon = channel.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex min-w-0 flex-1 items-center justify-center gap-2 rounded-[10px] px-2.5 py-2 text-left transition active:scale-[0.985]',
        active
          ? 'text-black dark:text-white'
          : 'text-black/42 hover:text-black/68 dark:text-white/34 dark:hover:text-white/68',
      )}
    >
      {active ? (
        <motion.span
          layoutId="auth-method-active"
          className="absolute inset-0 rounded-[10px] bg-[var(--cb-surface)] shadow-[0_8px_24px_rgba(15,15,15,0.055)] dark:bg-white/[0.08] dark:shadow-none"
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        />
      ) : null}

      <span className="relative z-10 inline-flex min-w-0 items-center gap-2">
        <Icon className="size-3.5 shrink-0" />
        <span className="block truncate text-[11.5px] font-semibold leading-4">
          {channel.title}
        </span>
      </span>
    </button>
  );
}

function ProviderButton({
  icon,
  label,
  hint,
  onClick,
  loading,
}: {
  icon: ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="group flex min-h-[54px] w-full items-center justify-between gap-3 rounded-[13px] border border-[var(--cb-border)] bg-[var(--cb-surface)] px-3 text-left transition hover:bg-[var(--cb-surface)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-[12px] border border-[var(--cb-border)] bg-[var(--cb-soft-surface)] text-black/48 transition group-hover:text-black dark:text-white/44 dark:group-hover:text-white">
          {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
        </span>

        <span className="min-w-0">
          <span className="block truncate text-[12.5px] font-semibold tracking-[-0.005em] text-black/72 dark:text-white/72">
            {label}
          </span>
          <span className="block truncate text-[11px] text-black/40 dark:text-white/36">
            {hint}
          </span>
        </span>
      </span>

      <ArrowRight className="size-3.5 shrink-0 text-black/28 transition group-hover:translate-x-0.5 group-hover:text-black/56 dark:text-white/28 dark:group-hover:text-white/56" />
    </button>
  );
}

function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[13px] border border-red-500/15 bg-red-500/[0.06] px-3.5 py-3 text-[11.5px] leading-5 text-red-600 dark:text-red-300"
    >
      {children}
    </motion.div>
  );
}

function SetupMissingScreen({ t }: { t: LoginCopy }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--cb-shell-bg)] px-4 py-8 text-[#111111] dark:text-white">
      <Surface className="w-full max-w-[560px] overflow-hidden">
        <div className="border-b border-[var(--cb-border)] p-5">
          <div className="flex items-center gap-3">
            <BrandLogo className="w-[136px] shrink-0" />
            <div className="min-w-0">
              <MicroLabel>{t.setupLabel}</MicroLabel>
              <div className="mt-1 text-[20px] font-semibold tracking-[-0.055em]">
                {t.setupTitle}
              </div>
            </div>
          </div>
        </div>

        <div className="p-5">
          <Panel className="p-4">
            <div className="text-[27px] font-semibold leading-[1.02] tracking-[-0.075em]">
              Supabase / Telegram / VK
            </div>

            <p className="mt-3 text-[12.5px] leading-5 text-black/52 dark:text-white/46">
              {t.setupText}
            </p>

            <div className="mt-4 rounded-[12px] border border-[var(--cb-border)] bg-[var(--cb-surface)] p-3 font-mono text-[10.5px] leading-5 text-black/54 dark:text-white/50">
              <div>NEXT_PUBLIC_SUPABASE_URL=...</div>
              <div>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...</div>
              <div>SUPABASE_SERVICE_ROLE_KEY=...</div>
              <div>TELEGRAM_BOT_TOKEN=...</div>
              <div>NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=...</div>
              <div>VK_BOT_GROUP_ID=...</div>
              <div>VK_BOT_ACCESS_TOKEN=...</div>
            </div>

            <Link
              href="/about"
              className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-[11px] bg-black px-4 text-[12px] font-semibold text-white transition active:scale-[0.99] dark:bg-white dark:text-black"
            >
              {t.about}
              <ArrowRight className="size-4" />
            </Link>
          </Panel>
        </div>
      </Surface>
    </main>
  );
}

function TelegramAuthContent({
  redirectTo,
  botUrl,
  t,
}: {
  redirectTo: string;
  botUrl: string | null;
  t: LoginCopy;
}) {
  return (
    <div className="grid gap-3">
      {botUrl ? (
        <a
          href={botUrl}
          className="group flex min-h-[54px] w-full items-center justify-between gap-3 rounded-[13px] border border-[var(--cb-border)] bg-[var(--cb-surface)] px-3 text-left transition active:scale-[0.99]"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-[12px] border border-[var(--cb-border)] bg-black/[0.035] text-black dark:bg-white/90 dark:text-black">
              <Send className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[12.5px] font-semibold text-black dark:text-white">
                {t.openTelegram}
              </span>
              <span className="block truncate text-[11px] text-black/45 dark:text-white/38">
                {t.openTelegramHint}
              </span>
            </span>
          </span>

          <ArrowRight className="size-3.5 shrink-0 text-black/36 dark:text-white/32" />
        </a>
      ) : null}

      <TelegramLoginButton redirectTo={redirectTo} />

      <Panel className="p-3">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-black/36 dark:text-white/34" />
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-black/68 dark:text-white/66">
              Telegram
            </div>
            <div className="mt-1 text-[11.5px] leading-5 text-black/42 dark:text-white/36">
              {t.telegramExplain}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function VkAuthContent({
  redirectTo,
  t,
}: {
  redirectTo: string;
  t: LoginCopy;
}) {
  return (
    <div className="grid gap-3">
      <VkLoginButton redirectTo={redirectTo} />

      <Panel className="p-3">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-black/36 dark:text-white/34" />
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-black/68 dark:text-white/66">
              {t.vkPanelTitle}
            </div>
            <div className="mt-1 text-[11.5px] leading-5 text-black/42 dark:text-white/36">
              {t.vkPanelText}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function GoogleAuthContent({
  loadingProvider,
  startOAuth,
  t,
}: {
  loadingProvider: OAuthProvider | null;
  startOAuth: (provider: OAuthProvider) => void;
  t: LoginCopy;
}) {
  return (
    <div className="grid gap-3">
      <ProviderButton
        icon={<Chrome className="size-4" />}
        label={t.googleButton}
        hint={t.googleHint}
        loading={loadingProvider === 'google'}
        onClick={() => startOAuth('google')}
      />

      <Panel className="p-3">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-black/36 dark:text-white/34" />
          <div className="min-w-0">
            <div className="text-[12px] font-semibold text-black/68 dark:text-white/66">
              {t.googlePanelTitle}
            </div>
            <div className="mt-1 text-[11.5px] leading-5 text-black/42 dark:text-white/36">
              {t.googlePanelText}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

export default function LoginPage() {
  const searchParams = useBrowserSearchParams();
  const { locale } = useLocale();

  useEffect(() => {
    clearTelegramAppSessionToken();
  }, []);

  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(
    null,
  );
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [activeChannel, setActiveChannel] = useState<AuthChannel>('telegram');

  const currentLocale: LoginLocale = locale === 'en' ? 'en' : 'ru';
  const t = copy[currentLocale];
  const authChannels = useMemo(() => getAuthChannels(t), [t]);

  const redirectTo = useMemo(
    () => searchParams.get('redirectTo') || '/dashboard',
    [searchParams],
  );

  const incomingError = useMemo(() => {
    const message = searchParams.get('message');
    const error = searchParams.get('error');

    if (message) return message;
    if (error === 'vk_not_configured') return t.vkNotConfigured;
    if (error === 'vk_auth_failed') return t.vkAuthFailed;
    if (error === 'auth_callback_failed') return t.callbackFailed;
    return null;
  }, [searchParams, t]);

  const botUrl = useMemo(() => {
    const username = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.replace(
      /^@/,
      '',
    ).trim();

    return username ? `https://t.me/${username}?startapp=dashboard` : null;
  }, []);

  const startOAuth = async (provider: OAuthProvider) => {
    try {
      setOauthError(null);
      setLoadingProvider(provider);

      const callbackUrl = new URL('/auth/callback', window.location.origin);
      callbackUrl.searchParams.set('next', redirectTo);

      const supabase = createClient();

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl.toString(),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
    } catch (error) {
      setLoadingProvider(null);
      setOauthError(error instanceof Error ? error.message : t.oauthFallback);
    }
  };

  if (!authConfigured) {
    return <SetupMissingScreen t={t} />;
  }

  const activeChannelData =
    authChannels.find((channel) => channel.id === activeChannel) ??
    authChannels[0];

  const ActiveIcon = activeChannelData.icon;

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--cb-shell-bg)] px-4 py-8 text-[#111111] dark:text-white">
      <div className="w-full max-w-[430px]">
        <AuthCardShell>
          <div className="border-b border-[var(--cb-border)] p-5">
            <div className="flex items-start justify-between gap-4">
              <Link href="/" className="inline-flex min-w-0 items-center">
                <BrandLogo className="w-[132px] shrink-0" />
              </Link>

              <div className="flex items-center gap-2">
                <LanguageToggle compact minimal />
                <ThemeToggle iconOnly />
              </div>
            </div>

            <div className="mt-6">
              <MicroLabel>{t.loginLabel}</MicroLabel>

              <h1 className="mt-2 text-[31px] font-semibold leading-[0.96] tracking-[-0.075em]">
                {t.title}
              </h1>

              <p className="mt-3 text-[12.5px] leading-5 text-black/46 dark:text-white/40">
                {t.subtitle}
              </p>
            </div>
          </div>

          <div className="p-5">
            <div className="rounded-[13px] border border-[var(--cb-border)] bg-[var(--cb-soft-surface)] p-1">
              <div className="flex gap-1">
                {authChannels.map((channel) => (
                  <AuthMethodTab
                    key={channel.id}
                    channel={channel}
                    active={activeChannel === channel.id}
                    onClick={() => setActiveChannel(channel.id)}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4">
              <Panel className="overflow-hidden">
                <div className="border-b border-[var(--cb-border)] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="grid size-8 shrink-0 place-items-center rounded-[10px] border border-[var(--cb-border)] bg-[var(--cb-surface)] text-black/48 dark:text-white/44">
                        <ActiveIcon className="size-3.5" />
                      </span>

                      <div className="min-w-0">
                        <div className="text-[12.5px] font-semibold tracking-[-0.01em] text-black/72 dark:text-white/72">
                          {activeChannelData.title}
                        </div>
                        <div className="mt-0.5 text-[11px] text-black/38 dark:text-white/34">
                          {activeChannelData.helper}
                        </div>
                      </div>
                    </div>

                    <motion.div
                      key={activeChannel}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.18 }}
                      className="grid size-7 shrink-0 place-items-center rounded-[9px] border border-[var(--cb-border)] bg-[var(--cb-surface)] text-black/38 dark:text-white/34"
                    >
                      <Check className="size-3.5" />
                    </motion.div>
                  </div>
                </div>

                <div className="bg-[var(--cb-soft-surface-2)] p-3">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${activeChannel}-${currentLocale}`}
                      initial={{ opacity: 0, y: 7, filter: 'blur(3px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -5, filter: 'blur(2px)' }}
                      transition={{
                        duration: 0.2,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      {activeChannel === 'telegram' ? (
                        <TelegramAuthContent
                          redirectTo={redirectTo}
                          botUrl={botUrl}
                          t={t}
                        />
                      ) : null}

                      {activeChannel === 'vk' ? (
                        <VkAuthContent redirectTo={redirectTo} t={t} />
                      ) : null}

                      {activeChannel === 'google' ? (
                        <GoogleAuthContent
                          loadingProvider={loadingProvider}
                          startOAuth={startOAuth}
                          t={t}
                        />
                      ) : null}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </Panel>
            </div>

            {oauthError || incomingError ? (
              <div className="mt-4">
                <ErrorBanner>{oauthError || incomingError}</ErrorBanner>
              </div>
            ) : null}

            <div className="mt-4 flex items-center justify-end">
              <Link
                href="/about"
                className="text-[11px] font-medium text-black/42 transition hover:text-black dark:text-white/34 dark:hover:text-white"
              >
                {t.about}
              </Link>
            </div>
          </div>
        </AuthCardShell>
      </div>
    </main>
  );
}
