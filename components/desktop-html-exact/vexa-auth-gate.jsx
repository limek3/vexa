'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Btn, Icon } from './desktop-html-ui';

const VEXA_PROFILE_STORAGE_KEY = 'vexa.profile.v1';

const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
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

function AuthBrandPanel() {
  const features = [
    ['search', 'Мониторинг групп и каналов', 'Отслеживайте новые лиды в реальном времени'],
    ['sparkle', 'AI-фильтрация и обучение', 'Отсекайте спам и фокусируйтесь на целевом'],
    ['inbox', 'Быстрые ответы из единого окна', 'Отвечайте быстрее, не переключаясь'],
    ['chart', 'Аналитика и отчёты', 'Смотрите, что работает, и масштабируйте результат'],
  ];

  return (
    <aside className="vexa-auth-brand">
      <div className="vexa-auth-brand-logo">
        <img src="/vexa-logo.png" alt="Vexa" />
        <span>vexa</span>
      </div>

      <div className="vexa-auth-brand-copy">
        <h2>Командный центр<br />мониторинга лидов в Telegram</h2>
        <p>Находите клиентов. Отвечайте вовремя. Увеличивайте конверсию.</p>
      </div>

      <div className="vexa-auth-feature-list">
        {features.map(([icon, title, text]) => (
          <div className="vexa-auth-feature" key={title}>
            <Icon name={icon} size={21} />
            <span>
              <strong>{title}</strong>
              <small>{text}</small>
            </span>
          </div>
        ))}
      </div>

      <div className="vexa-auth-brand-status">
        <span><i />Система работает</span>
        <span>Все сервисы доступны</span>
      </div>

      <div className="vexa-auth-brand-footer">
        <span>© 2024 Vexa. Все права защищены.</span>
        <span>Политика конфиденциальности · Пользовательское соглашение</span>
      </div>
    </aside>
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
  const [authMethod, setAuthMethod] = useState('email');

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
        const emailRedirectTo = `${window.location.origin}/auth/callback?next=/desktop/settings`;
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

      const credentials = {
        email: normalizedEmail,
        password,
      };

      const emailRedirectTo = `${window.location.origin}/auth/callback?next=/desktop/dashboard`;
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
      window.location.href = '/auth/signout';
    }
  };

  if (state === 'ready') {
    const telegramConnected = profile?.providers?.includes('telegram') || Boolean(profile?.username);
    const displayName = profile?.email || profile?.name || 'Пользователь Vexa';

    return (
      <div>
        <div className="vexa-auth-strip">
          <div className="vexa-auth-user">
            <span className="vexa-auth-avatar">{displayName.includes('@') ? displayName.split('@')[0].slice(0, 2).replace(/\W/g, '').toUpperCase() || 'V' : displayName.slice(0, 2).toUpperCase()}</span>
            <span>
              <strong>{displayName}</strong>
              <small>
                {profile?.email || 'Email-сессия активна'}
                {telegramConnected ? ` · Telegram @${profile.username || 'подключен'}` : ' · Telegram не подключен'}
              </small>
            </span>
          </div>
          <Btn kind="secondary" size="sm" icon="logout" onClick={signOut}>
            Выйти
          </Btn>
        </div>
        {children}
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div className="vexa-auth-screen">
        <AuthBrandPanel />
        <section className="vexa-auth-stage">
          <div className="vexa-auth-card vexa-auth-card-loading">
            <div className="vexa-auth-mark"><img src="/vexa-logo.png" alt="Vexa" /></div>
            <h1>Проверяем сессию</h1>
            <p>Если вход уже был выполнен, кабинет откроется автоматически.</p>
          </div>
        </section>
      </div>
    );
  }

  if (state === 'offline') {
    return (
      <div>
        <div className="vexa-auth-strip">
          <div className="vexa-auth-user">
            <span className="vexa-auth-avatar">V</span>
            <span>
              <strong>Локальный режим Vexa</strong>
              <small>Supabase env не настроен. Данные сохраняются только в этом устройстве.</small>
            </span>
          </div>
          <Btn kind="secondary" size="sm" icon="refresh" onClick={checkSession}>Проверить env</Btn>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="vexa-auth-screen">
      <AuthBrandPanel />
      <section className="vexa-auth-stage">
        <form className="vexa-auth-card" onSubmit={submitEmailAuth}>
          <div className="vexa-auth-card-head">
            <h1>{mode === 'signup' ? 'Создать аккаунт' : mode === 'reset' ? 'Восстановить пароль' : 'Добро пожаловать в Vexa'}</h1>
            <p>{mode === 'reset' ? 'Введите email. Мы отправим письмо для восстановления доступа.' : 'Войдите в аккаунт, чтобы продолжить'}</p>
          </div>

          {mode !== 'reset' ? (
            <div className="vexa-auth-tabs" role="tablist" aria-label="Способ входа">
              <button type="button" className={authMethod === 'email' ? 'active' : ''} onClick={() => setAuthMethod('email')}>Email</button>
              <button type="button" className={authMethod === 'telegram' ? 'active' : ''} onClick={() => setAuthMethod('telegram')}>Код из Telegram</button>
            </div>
          ) : null}

          {authMethod === 'telegram' && mode !== 'reset' ? (
            <div className="vexa-auth-success">
              <strong>Telegram подключается после входа</strong>
              <span>Основной вход сейчас через email. Telegram будет использоваться для уведомлений о совпадениях.</span>
            </div>
          ) : null}

          {state === 'setup' ? (
            <div className="vexa-auth-warning">
              <strong>Авторизация не настроена</strong>
              <span>Нужны переменные Supabase. Сервер вернул: {error}</span>
            </div>
          ) : null}

          {error ? (
            <div className="vexa-auth-warning">
              <strong>Не удалось войти</strong>
              <span>{translateAuthError(error)}</span>
            </div>
          ) : null}

          {authNotice ? (
            <div className="vexa-auth-success">
              <strong>Готово</strong>
              <span>{authNotice}</span>
            </div>
          ) : null}

          <label className="field vexa-auth-field">
            <span>Email</span>
            <div className="vexa-auth-input">
              <Icon name="mail" size={19} />
              <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" required />
            </div>
          </label>

          {mode !== 'reset' ? (
            <label className="field vexa-auth-field">
              <span>Пароль</span>
              <div className="vexa-auth-input">
                <Icon name="shield" size={19} />
                <input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Введите пароль" minLength={8} maxLength={64} required />
                <button type="button" className="vexa-auth-eye" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}>
                  <Icon name={showPassword ? 'eye-off' : 'eye'} size={19} />
                </button>
              </div>
            </label>
          ) : null}

          {mode === 'signin' ? (
            <div className="vexa-auth-options">
              <label className="vexa-auth-checkbox">
                <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
                <span>Запомнить меня</span>
              </label>
              <button type="button" className="vexa-auth-link" onClick={() => { setMode('reset'); setError(''); setAuthNotice(''); }}>
                Забыли пароль?
              </button>
            </div>
          ) : null}

          <Btn kind="primary" type="submit" disabled={authBusy}>
            {authBusy ? 'Подождите...' : mode === 'signup' ? 'Создать аккаунт' : mode === 'reset' ? 'Отправить письмо' : 'Войти'}
          </Btn>

          <div className="vexa-auth-divider"><span>или</span></div>

          <div className="vexa-auth-switch">
            {mode === 'signup' ? 'Уже есть аккаунт?' : mode === 'reset' ? 'Вспомнили пароль?' : 'Нет аккаунта?'}
            <button type="button" onClick={() => { setMode(mode === 'signup' || mode === 'reset' ? 'signin' : 'signup'); setError(''); setAuthNotice(''); }}>
              {mode === 'signup' || mode === 'reset' ? 'Войти' : 'Создать аккаунт'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
