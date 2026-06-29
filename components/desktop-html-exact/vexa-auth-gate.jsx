'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Badge, Btn, Icon } from './desktop-html-ui';

const VEXA_PROFILE_STORAGE_KEY = 'vexa.profile.v1';

const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
);

const localDevMode = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_VEXA_LOCAL_MODE === '1';

const ALLOWED_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yandex.ru',
  'yandex.com',
  'ya.ru',
  'mail.ru',
  'inbox.ru',
  'bk.ru',
  'list.ru',
  'internet.ru',
  'icloud.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'rambler.ru',
  'proton.me',
  'protonmail.com',
]);

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function emailDomain(value) {
  return normalizeEmail(value).split('@')[1] || '';
}

function isAllowedEmail(value) {
  const email = normalizeEmail(value);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && ALLOWED_EMAIL_DOMAINS.has(emailDomain(email));
}

function translateAuthError(value) {
  const message = String(value || '').toLowerCase();
  if (!message) return 'Не удалось выполнить действие. Попробуйте еще раз.';
  if (message.includes('invalid login credentials')) return 'Неверный email или пароль.';
  if (message.includes('email address') && message.includes('invalid')) return 'Введите корректный email с проверенного почтового домена.';
  if (message.includes('already registered') || message.includes('already exists')) return 'Аккаунт с таким email уже существует. Войдите или восстановите пароль.';
  if (message.includes('password') && message.includes('weak')) return 'Пароль слишком простой. Используйте минимум 8 символов.';
  if (message.includes('rate limit')) return 'Слишком много попыток. Подождите минуту и попробуйте снова.';
  if (message.includes('signup disabled')) return 'Регистрация временно отключена.';
  if (message.includes('email not confirmed')) return 'Email еще не подтвержден. Откройте письмо от Vexa и подтвердите адрес.';
  if (message.includes('missing_supabase_public_env')) return 'Не настроены публичные переменные Supabase.';
  if (message.includes('auth_setup_failed')) return 'Авторизация не настроена или сервер Supabase недоступен.';
  if (message.includes('auth_check_failed')) return 'Не удалось проверить текущую сессию.';
  if (message.includes('email_auth_failed')) return 'Не удалось выполнить вход по email.';
  return value;
}

function validatePassword(value) {
  if (value.length < 8) return 'Пароль должен быть не короче 8 символов.';
  if (value.length > 64) return 'Пароль должен быть не длиннее 64 символов.';
  return '';
}

function readProfile(payload) {
  const user = payload?.user;
  const meta = user?.user_metadata || {};
  return {
    id: user?.id || '',
    email: user?.email || '',
    name: meta.name || meta.full_name || meta.telegram_first_name || meta.telegram_username || user?.email || 'Пользователь Vexa',
    username: meta.telegram_username || '',
    avatar: meta.telegram_photo_url || meta.avatar_url || '',
    providers: Array.isArray(user?.providers) ? user.providers : [],
  };
}

function publishProfile(profile) {
  if (typeof window === 'undefined' || !profile) return;
  try {
    window.localStorage.setItem(VEXA_PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    void err;
  }
  window.dispatchEvent(new CustomEvent('vexa-profile-updated', { detail: profile }));
}

function AuthStoryPanel() {
  const features = [
    ['search', 'Поиски по ключевым фразам', 'Создавайте отдельные сценарии для заявок, вакансий, кандидатов, бренда, услуг и нишевых обсуждений.'],
    ['filter', 'Источники Telegram', 'Каналы, группы, комментарии и invite-ссылки собираются в библиотеку со статусом доступа.'],
    ['sort', 'Минус-слова и скоринг', 'Фильтруйте шум до попадания сообщения в ленту и бот.'],
    ['send', 'Только новые совпадения', 'После подключения источника Vexa присылает новые релевантные публикации, а не старую историю.'],
  ];

  return (
    <aside className="vexa2-auth-story">
      <div className="vexa2-auth-logo">
        <img src="/vexa-logo.png" alt="Vexa" />
        <span>vexa</span>
      </div>
      <div className="vexa2-auth-copy">
        <Badge kind="info">тестирование</Badge>
        <h2>Мониторинг Telegram-источников по ключевым словам</h2>
        <p>Войдите один раз, после этого откроется рабочий кабинет Vexa: поиски, источники, совпадения, тестирование и настройки доставки в Telegram-бот.</p>
      </div>
      <div className="vexa2-auth-flow">
        <span>поиск</span>
        <Icon name="chevron-right" size={13} />
        <span>ключевые фразы</span>
        <Icon name="chevron-right" size={13} />
        <span>источники</span>
        <Icon name="chevron-right" size={13} />
        <span>новые совпадения в бот</span>
      </div>
      <div className="vexa2-auth-features">
        {features.map(([icon, title, body]) => (
          <div key={title}>
            <Icon name={icon} size={18} />
            <span><strong>{title}</strong><small>{body}</small></span>
          </div>
        ))}
      </div>
      <div className="vexa2-auth-warning">
        <Icon name="shield" size={16} />
        <span><strong>Важно:</strong> Vexa не загружает старую историю Telegram. Мониторинг начинается с новых публикаций после подключения источника.</span>
      </div>
    </aside>
  );
}

function AuthShell({ children }) {
  return (
    <div className="cb-desktop-html vexa2-auth-root" data-theme="light" data-accent="clay" data-density="default" data-radius="default">
      <div className="vexa2-auth-screen">
      <AuthStoryPanel />
      <section className="vexa2-auth-stage">{children}</section>
      </div>
    </div>
  );
}

export function VexaAuthGate({ children }) {
  const [state, setState] = useState('loading');
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authNotice, setAuthNotice] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  const checkSession = async () => {
    if (!supabaseConfigured) {
      if (localDevMode) {
        setState('offline');
        return;
      }
      setError('missing_supabase_public_env');
      setState('setup');
      return;
    }

    setState('loading');
    setError('');

    try {
      const response = await fetch('/api/auth/accounts', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      const payload = await response.json().catch(() => ({}));

      if (response.ok && payload?.user) {
        const nextProfile = readProfile(payload);
        setProfile(nextProfile);
        publishProfile(nextProfile);
        setState('ready');
        return;
      }

      if (response.status === 401) {
        setState('login');
        return;
      }

      setError(translateAuthError(payload?.error || 'auth_setup_failed'));
      setState('setup');
    } catch (err) {
      setError(translateAuthError(err instanceof Error ? err.message : 'auth_check_failed'));
      setState('setup');
    }
  };

  useEffect(() => {
    void checkSession();
  }, []);

  const submitEmailAuth = async (event) => {
    event.preventDefault();
    setAuthBusy(true);
    setError('');
    setAuthNotice('');

    try {
      const supabase = createClient();
      const normalizedEmail = normalizeEmail(email);

      if (!isAllowedEmail(normalizedEmail)) {
        throw new Error('Разрешены только проверенные почтовые домены: Gmail, Яндекс, Mail.ru, iCloud, Outlook, Rambler, Proton.');
      }

      if (mode !== 'reset') {
        const passwordError = validatePassword(password);
        if (passwordError) throw new Error(passwordError);
      }

      if (mode === 'reset') {
        const emailRedirectTo = `${window.location.origin}/auth/callback?next=/desktop/searches`;
        const result = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo: emailRedirectTo });
        if (result.error) throw result.error;
        setAuthNotice('Отправили письмо для восстановления пароля. Откройте его и следуйте инструкции.');
        return;
      }

      if (mode === 'signup') {
        const response = await fetch('/api/auth/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail }),
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload?.error || 'Не удалось проверить email.');
        if (payload?.exists) throw new Error('Аккаунт с таким email уже существует. Войдите или восстановите пароль.');
      }

      const credentials = { email: normalizedEmail, password };
      const emailRedirectTo = `${window.location.origin}/auth/callback?next=/desktop/searches`;
      const result = mode === 'signup'
        ? await supabase.auth.signUp({ ...credentials, options: { emailRedirectTo } })
        : await supabase.auth.signInWithPassword(credentials);

      if (result.error) throw result.error;

      if (mode === 'signup' && !result.data?.session) {
        setAuthNotice('Аккаунт создан. Откройте письмо от Vexa и подтвердите email.');
        return;
      }

      await checkSession();
    } catch (err) {
      setError(translateAuthError(err instanceof Error ? err.message : 'email_auth_failed'));
    } finally {
      setAuthBusy(false);
    }
  };

  const signOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      try {
        window.localStorage.removeItem(VEXA_PROFILE_STORAGE_KEY);
      } catch (err) {
        void err;
      }
      setProfile(null);
      setPassword('');
      setAuthNotice('');
      setError('');
      setState('login');
      window.dispatchEvent(new CustomEvent('vexa-profile-updated', { detail: null }));
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handler = () => { void signOut(); };
    window.addEventListener('vexa-auth-signout', handler);
    return () => window.removeEventListener('vexa-auth-signout', handler);
  });

  if (state === 'ready') {
    return children;
  }

  if (state === 'loading') {
    return (
      <AuthShell>
        <div className="vexa2-auth-card vexa2-auth-loading">
          <div className="vexa2-auth-mark"><img src="/vexa-logo.png" alt="Vexa" /></div>
          <h1>Проверяем доступ</h1>
          <p>Если сессия активна, кабинет мониторинга откроется автоматически.</p>
        </div>
      </AuthShell>
    );
  }

  if (state === 'offline') {
    return (
      <AuthShell>
        <div className="vexa2-auth-card">
          <div className="vexa2-auth-card-head">
            <div className="vexa2-auth-mark"><img src="/vexa-logo.png" alt="Vexa" /></div>
            <h1>Локальный режим Vexa</h1>
            <p>Supabase env не настроен. В демо-режиме данные сохраняются только на этом устройстве.</p>
          </div>
          <div className="vexa2-auth-alert danger"><strong>Нет подключения к авторизации</strong><span>Для Railway нужны NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY и SUPABASE_SERVICE_ROLE_KEY.</span></div>
          <Btn kind="primary" icon="play" onClick={() => setState('ready')}>Продолжить в локальном демо</Btn>
          <Btn kind="secondary" icon="refresh" onClick={checkSession}>Проверить env снова</Btn>
        </div>
      </AuthShell>
    );
  }

  const title = mode === 'signup' ? 'Создать аккаунт Vexa' : mode === 'reset' ? 'Восстановить пароль' : 'Вход в Vexa';
  const subtitle = mode === 'reset'
    ? 'Введите email. Мы отправим письмо для восстановления доступа.'
    : 'После входа откроется весь рабочий кабинет. Авторизация больше не будет отображаться внутри страниц приложения.';

  return (
    <AuthShell>
      <form className="vexa2-auth-card" onSubmit={submitEmailAuth}>
        <div className="vexa2-auth-card-head">
          <div className="vexa2-auth-mark"><img src="/vexa-logo.png" alt="Vexa" /></div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>

        {state === 'setup' ? (
          <div className="vexa2-auth-alert danger"><strong>Авторизация не настроена</strong><span>Нужны публичные переменные Supabase. Сервер вернул: {translateAuthError(error)}</span></div>
        ) : null}

        {error ? <div className="vexa2-auth-alert danger"><strong>Не удалось войти</strong><span>{translateAuthError(error)}</span></div> : null}
        {authNotice ? <div className="vexa2-auth-alert success"><strong>Готово</strong><span>{authNotice}</span></div> : null}

        <label className="field vexa2-auth-field">
          <span>Email</span>
          <div className="vexa2-auth-input"><Icon name="mail" size={18} /><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" required /></div>
        </label>

        {mode !== 'reset' ? (
          <label className="field vexa2-auth-field">
            <span>Пароль</span>
            <div className="vexa2-auth-input">
              <Icon name="shield" size={18} />
              <input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Минимум 8 символов" minLength={8} maxLength={64} required />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}><Icon name={showPassword ? 'eye-off' : 'eye'} size={18} /></button>
            </div>
          </label>
        ) : null}

        {mode === 'signin' ? (
          <div className="vexa2-auth-options">
            <label><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /> <span>Запомнить меня</span></label>
            <button type="button" onClick={() => { setMode('reset'); setError(''); setAuthNotice(''); }}>Забыли пароль?</button>
          </div>
        ) : null}

        <Btn kind="primary" type="submit" disabled={authBusy}>{authBusy ? 'Проверяем...' : mode === 'signup' ? 'Создать аккаунт' : mode === 'reset' ? 'Отправить письмо' : 'Войти'}</Btn>

        <div className="vexa2-auth-switch">
          <span>{mode === 'signup' ? 'Уже есть аккаунт?' : mode === 'reset' ? 'Вспомнили пароль?' : 'Нет аккаунта?'}</span>
          <button type="button" onClick={() => { setMode(mode === 'signup' || mode === 'reset' ? 'signin' : 'signup'); setError(''); setAuthNotice(''); }}>{mode === 'signup' || mode === 'reset' ? 'Войти' : 'Создать аккаунт'}</button>
        </div>
      </form>
    </AuthShell>
  );
}
