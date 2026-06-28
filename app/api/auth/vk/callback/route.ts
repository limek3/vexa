import { NextResponse, type NextRequest } from 'next/server';

import { clearTelegramAppSessionCookie, setProviderAppSessionCookie } from '@/lib/server/app-session';
import { requireAuthUser } from '@/lib/server/require-auth-user';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { exchangeVkCode, getVkProfile } from '@/lib/server/vk-id';
import { createVkVirtualUser, findVkAccountByVkId, upsertVkAccount } from '@/lib/server/vk-user';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATE_COOKIE = 'clickbook_vk_oauth_state';
const NEXT_COOKIE = 'clickbook_vk_oauth_next';
const MODE_COOKIE = 'clickbook_vk_oauth_mode';

function safeRelativePath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard';
  return value;
}

function redirectWithError(request: NextRequest, message: string, next = '/login') {
  const url = new URL(next === '/login' ? '/login' : next, request.url);
  url.searchParams.set('error', 'vk_auth_failed');
  url.searchParams.set('message', message);
  return NextResponse.redirect(url);
}

function clearVkCookies(response: NextResponse) {
  const options = { path: '/', maxAge: 0 };
  response.cookies.set(STATE_COOKIE, '', options);
  response.cookies.set(NEXT_COOKIE, '', options);
  response.cookies.set(MODE_COOKIE, '', options);
  return response;
}

async function getCurrentUserSafe() {
  try {
    return await requireAuthUser();
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl;
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state');
  const error = requestUrl.searchParams.get('error');

  const expectedState = request.cookies.get(STATE_COOKIE)?.value || '';
  const next = safeRelativePath(request.cookies.get(NEXT_COOKIE)?.value || requestUrl.searchParams.get('next'));
  const mode = request.cookies.get(MODE_COOKIE)?.value === 'link' ? 'link' : 'login';

  if (error) {
    return clearVkCookies(redirectWithError(request, error));
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return clearVkCookies(redirectWithError(request, 'vk_invalid_state'));
  }

  try {
    const tokenResponse = await exchangeVkCode({ code });
    const profile = await getVkProfile(tokenResponse);
    const admin = createSupabaseAdminClient();

    const existingVkAccount = await findVkAccountByVkId(admin, profile.vkId).catch(() => null);
    const currentUser = mode === 'link' ? await getCurrentUserSafe() : null;
    const userId = currentUser?.id || existingVkAccount?.user_id || createVkVirtualUser(profile).id;

    await upsertVkAccount(admin, { userId, profile });

    let response = NextResponse.redirect(new URL(next, request.url));
    response = clearVkCookies(response);

    if (mode === 'link' && currentUser) {
      return response;
    }

    const user = createVkVirtualUser(profile, userId);

    // Supabase OAuth cookies and app-session cookies can fight each other.
    // For custom VK OAuth we intentionally use ClickBook app-session only.
    response = clearTelegramAppSessionCookie(response);
    return setProviderAppSessionCookie(response, {
      userId: user.id,
      provider: 'vk',
      providerUserId: profile.vkId,
      email: profile.email,
      phone: profile.phone,
      username: profile.screenName || profile.domain,
      firstName: profile.firstName,
      lastName: profile.lastName,
      fullName: profile.fullName,
      avatarUrl: profile.photoUrl,
    });
  } catch (callbackError) {
    console.error(
      '[vk-auth] callback failed',
      callbackError instanceof Error ? callbackError.message : callbackError,
    );

    return clearVkCookies(
      redirectWithError(
        request,
        callbackError instanceof Error ? callbackError.message : 'vk_callback_failed',
      ),
    );
  }
}
