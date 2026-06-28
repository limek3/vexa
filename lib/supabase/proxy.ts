import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase/env';

const APP_SESSION_COOKIE = 'clickbook_auth_session';

function decodeBase64Url(value: string) {
  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '=',
    );
    return JSON.parse(atob(padded)) as { sub?: string; exp?: number };
  } catch {
    return null;
  }
}

function hasLikelyActiveAppSession(request: NextRequest) {
  const raw = request.cookies.get(APP_SESSION_COOKIE)?.value;
  if (!raw) return false;

  const payloadPart = raw.split('.')[0];
  if (!payloadPart) return false;

  const payload = decodeBase64Url(payloadPart);
  if (!payload?.sub || !payload.exp) return false;

  return payload.exp > Math.floor(Date.now() / 1000);
}

export async function updateSession(request: NextRequest) {
  let url: string;
  let publishableKey: string;

  try {
    url = getSupabaseUrl();
    publishableKey = getSupabasePublishableKey();
  } catch {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hasAppSession = hasLikelyActiveAppSession(request);
  const isAuthed = Boolean(user || hasAppSession);
  const { pathname } = request.nextUrl;

  // Important for Telegram Mini App:
  // protected pages must be allowed to render first, because Telegram initData
  // exists only in the browser WebApp SDK and is not visible to proxy.ts.
  // API routes are still protected by requireAuthUser(); this proxy only keeps
  // the login page from showing after a session is already present.
  if (isAuthed && pathname === '/login') {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    redirectUrl.search = '';
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
