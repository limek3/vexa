import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

import { getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase/env';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function safeRelativePath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard';
  return value;
}

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl.clone();
  const code = requestUrl.searchParams.get('code');
  const next = safeRelativePath(requestUrl.searchParams.get('next'));

  let response = NextResponse.redirect(new URL(next, requestUrl.origin));

  if (!code) {
    return response;
  }

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = new URL('/login', requestUrl.origin);
    loginUrl.searchParams.set('redirectTo', next);
    loginUrl.searchParams.set('error', 'auth_callback_failed');
    response = NextResponse.redirect(loginUrl);
  }

  return response;
}
