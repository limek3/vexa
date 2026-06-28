'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Btn, Icon } from './desktop-html-ui';

const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
);

const localDevMode = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_VEXA_LOCAL_MODE === '1';

function readProfile(payload) {
  const user = payload?.user;
  const meta = user?.user_metadata || {};
  return {
    id: user?.id || '',
    email: user?.email || '',
    name: meta.name || meta.full_name || meta.telegram_first_name || meta.telegram_username || user?.email || 'Vexa user',
    username: meta.telegram_username || '',
    avatar: meta.telegram_photo_url || meta.avatar_url || '',
    providers: Array.isArray(user?.providers) ? user.providers : [],
  };
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
        setProfile(readProfile(payload));
        setState('ready');
        return;
      }

      if (response.status === 401) {
        setState('login');
        return;
      }

      setError(payload?.error || 'auth_setup_failed');
      setState('setup');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'auth_check_failed');
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
      const credentials = {
        email: email.trim(),
        password,
      };

      const emailRedirectTo = `${window.location.origin}/auth/callback?next=/desktop/dashboard`;
      const result = mode === 'signup'
        ? await supabase.auth.signUp({ ...credentials, options: { emailRedirectTo } })
        : await supabase.auth.signInWithPassword(credentials);

      if (result.error) throw result.error;

      if (mode === 'signup' && !result.data?.session) {
        setAuthNotice('Аккаунт создан. Если Supabase требует подтверждение, откройте письмо и подтвердите email.');
        return;
      }

      await checkSession();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'email_auth_failed');
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

    return (
      <div>
        <div className="vexa-auth-strip">
          <div className="vexa-auth-user">
            <span className="vexa-auth-avatar">{profile?.name?.slice(0, 1) || 'V'}</span>
            <span>
              <strong>{profile?.name}</strong>
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
        <div className="vexa-auth-card">
          <div className="vexa-auth-mark"><Icon name="logo" size={22} /></div>
          <h1>Проверяем сессию</h1>
          <p>Если вход уже был выполнен, кабинет откроется автоматически.</p>
        </div>
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
      <form className="vexa-auth-card" onSubmit={submitEmailAuth}>
        <div className="vexa-auth-mark"><Icon name="mail" size={22} /></div>
        <h1>{mode === 'signup' ? 'Создать аккаунт' : 'Войти в Vexa'}</h1>
        <p>Email — основной вход в приложение. Telegram подключается позже только для уведомлений о совпадениях.</p>

        {state === 'setup' ? (
          <div className="vexa-auth-warning">
            <strong>Авторизация не настроена</strong>
            <span>Нужны переменные Supabase. Сервер вернул: {error}</span>
          </div>
        ) : null}

        {error ? (
          <div className="vexa-auth-warning">
            <strong>Не удалось войти</strong>
            <span>{error}</span>
          </div>
        ) : null}

        {authNotice ? (
          <div className="vexa-auth-success">
            <strong>Готово</strong>
            <span>{authNotice}</span>
          </div>
        ) : null}

        <label className="field">
          <span>Email</span>
          <input className="input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>

        <label className="field">
          <span>Пароль</span>
          <input className="input" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required />
        </label>

        <Btn kind="primary" icon="mail" type="submit" disabled={authBusy}>
          {authBusy ? 'Подождите...' : mode === 'signup' ? 'Зарегистрироваться' : 'Войти'}
        </Btn>

        <div className="vexa-auth-switch">
          {mode === 'signup' ? 'Уже есть аккаунт?' : 'Еще нет аккаунта?'}
          <button type="button" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); setAuthNotice(''); }}>
            {mode === 'signup' ? 'Войти' : 'Создать'}
          </button>
        </div>

      </form>
    </div>
  );
}
