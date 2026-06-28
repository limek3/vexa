import 'server-only';

import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';

export const CLICKBOOK_AUTH_COOKIE = 'clickbook_auth_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

type AppSessionProvider = 'telegram' | 'vk';

function shouldUseSecureCookies() {
  return process.env.NODE_ENV === 'production' ||
    process.env.VERCEL === '1' ||
    process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://');
}

export type AppSessionPayload = {
  sub: string;
  provider: AppSessionProvider;
  provider_user_id?: string | number | null;
  telegram_id?: number;
  vk_id?: string;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  iat: number;
  exp: number;
};

function getSessionSecret() {
  const value =
    process.env.KEY_VAULTS_SECRET ||
    process.env.TELEGRAM_WEBHOOK_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!value) {
    throw new Error('Missing KEY_VAULTS_SECRET for app session signing.');
  }

  return value;
}

function base64url(value: Buffer | string) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function fromBase64url(value: string) {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), '=');
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

function sign(payloadPart: string) {
  return base64url(
    crypto.createHmac('sha256', getSessionSecret()).update(payloadPart).digest(),
  );
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);

  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

export function createProviderAppSessionToken(params: {
  userId: string;
  provider: AppSessionProvider;
  providerUserId?: string | number | null;
  email?: string | null;
  phone?: string | null;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  avatarUrl?: string | null;
}) {
  const now = Math.floor(Date.now() / 1000);
  const payload: AppSessionPayload = {
    sub: params.userId,
    provider: params.provider,
    provider_user_id: params.providerUserId ?? null,
    username: params.username ?? null,
    first_name: params.firstName ?? null,
    last_name: params.lastName ?? null,
    full_name: params.fullName ?? null,
    email: params.email ?? null,
    phone: params.phone ?? null,
    avatar_url: params.avatarUrl ?? null,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };

  if (params.provider === 'telegram') {
    const telegramId =
      typeof params.providerUserId === 'number'
        ? params.providerUserId
        : typeof params.providerUserId === 'string'
          ? Number(params.providerUserId)
          : NaN;

    if (Number.isFinite(telegramId) && telegramId > 0) {
      payload.telegram_id = Math.trunc(telegramId);
    }
  }

  if (params.provider === 'vk' && params.providerUserId != null) {
    payload.vk_id = String(params.providerUserId);
  }

  const payloadPart = base64url(JSON.stringify(payload));
  const signaturePart = sign(payloadPart);

  return `${payloadPart}.${signaturePart}`;
}

export function createTelegramAppSessionToken(params: {
  userId: string;
  telegramId: number;
  username?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}) {
  return createProviderAppSessionToken({
    userId: params.userId,
    provider: 'telegram',
    providerUserId: params.telegramId,
    username: params.username,
    firstName: params.firstName,
    lastName: params.lastName,
  });
}

export function verifyAppSessionToken(token?: string | null) {
  if (!token) return null;

  const [payloadPart, signaturePart] = token.split('.');
  if (!payloadPart || !signaturePart) return null;

  const expectedSignature = sign(payloadPart);
  if (!safeEqual(signaturePart, expectedSignature)) return null;

  let payload: AppSessionPayload;

  try {
    payload = JSON.parse(fromBase64url(payloadPart)) as AppSessionPayload;
  } catch {
    return null;
  }

  if (!payload.sub || !payload.provider) return null;
  if (!['telegram', 'vk'].includes(payload.provider)) return null;
  if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) return null;

  return payload;
}

export function verifyTelegramAppSessionToken(token?: string | null) {
  const payload = verifyAppSessionToken(token);
  return payload?.provider === 'telegram' ? payload : null;
}

export function setProviderAppSessionCookie(
  response: NextResponse,
  params: {
    userId: string;
    provider: AppSessionProvider;
    providerUserId?: string | number | null;
    email?: string | null;
    phone?: string | null;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    fullName?: string | null;
    avatarUrl?: string | null;
    token?: string;
  },
) {
  const token = params.token ?? createProviderAppSessionToken(params);

  const secureCookie = shouldUseSecureCookies();

  response.cookies.set(CLICKBOOK_AUTH_COOKIE, token, {
    httpOnly: true,
    secure: secureCookie,
    sameSite: secureCookie ? 'none' : 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });

  return response;
}

export function setTelegramAppSessionCookie(
  response: NextResponse,
  params: {
    userId: string;
    telegramId: number;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    token?: string;
  },
) {
  return setProviderAppSessionCookie(response, {
    userId: params.userId,
    provider: 'telegram',
    providerUserId: params.telegramId,
    username: params.username,
    firstName: params.firstName,
    lastName: params.lastName,
    token: params.token,
  });
}

export function clearTelegramAppSessionCookie(response: NextResponse) {
  const secureCookie = shouldUseSecureCookies();

  response.cookies.set(CLICKBOOK_AUTH_COOKIE, '', {
    httpOnly: true,
    secure: secureCookie,
    sameSite: secureCookie ? 'none' : 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}

function appSessionPayloadToUser(session: AppSessionPayload): User {
  if (session.provider === 'telegram') {
    return {
      id: session.sub,
      aud: 'authenticated',
      role: 'authenticated',
      email: session.telegram_id
        ? `telegram_${session.telegram_id}@auth.clickbook.app`
        : undefined,
      app_metadata: {
        provider: 'telegram',
        providers: ['telegram'],
      },
      user_metadata: {
        provider: 'telegram',
        providers: ['telegram'],
        telegram_id: session.telegram_id,
        telegram_username: session.username,
        telegram_first_name: session.first_name,
        telegram_last_name: session.last_name,
      },
      created_at: new Date(session.iat * 1000).toISOString(),
      updated_at: new Date(session.iat * 1000).toISOString(),
    } as User;
  }

  return {
    id: session.sub,
    aud: 'authenticated',
    role: 'authenticated',
    email: session.email || (session.vk_id ? `vk_${session.vk_id}@auth.clickbook.app` : undefined),
    app_metadata: {
      provider: 'vk',
      providers: ['vk'],
    },
    user_metadata: {
      provider: 'vk',
      providers: ['vk'],
      vk_id: session.vk_id || session.provider_user_id,
      vk_screen_name: session.username,
      vk_first_name: session.first_name,
      vk_last_name: session.last_name,
      vk_full_name: session.full_name,
      vk_photo_url: session.avatar_url,
      email: session.email,
      phone: session.phone,
      name: session.full_name,
      avatar_url: session.avatar_url,
    },
    created_at: new Date(session.iat * 1000).toISOString(),
    updated_at: new Date(session.iat * 1000).toISOString(),
  } as User;
}

export function getAppSessionUserFromToken(token?: string | null): User | null {
  try {
    const session = verifyAppSessionToken(token);
    return session ? appSessionPayloadToUser(session) : null;
  } catch {
    return null;
  }
}

export function getTelegramAppSessionUserFromToken(token?: string | null): User | null {
  try {
    const session = verifyTelegramAppSessionToken(token);
    return session ? appSessionPayloadToUser(session) : null;
  } catch {
    return null;
  }
}

export async function getAppSessionUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    return getAppSessionUserFromToken(
      cookieStore.get(CLICKBOOK_AUTH_COOKIE)?.value,
    );
  } catch {
    return null;
  }
}

export async function getTelegramAppSessionUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    return getTelegramAppSessionUserFromToken(
      cookieStore.get(CLICKBOOK_AUTH_COOKIE)?.value,
    );
  } catch {
    return null;
  }
}
