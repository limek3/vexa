import { NextResponse, type NextRequest } from 'next/server';

import { clearTelegramAppSessionCookie, createProviderAppSessionToken, setProviderAppSessionCookie } from '@/lib/server/app-session';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { getVkBotUserProfile } from '@/lib/server/vk-bot';
import {
  createVkBotVirtualUser,
  findVkBotAccountByVkId,
  upsertVkBotAccount,
  upsertVkOauthAccountFromBot,
} from '@/lib/server/vk-bot-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type VkLoginRequestRow = {
  token: string;
  status: 'pending' | 'confirmed' | 'consumed' | 'expired';
  vk_user_id: string | null;
  peer_id: number | null;
  first_name: string | null;
  last_name: string | null;
  screen_name: string | null;
  photo_url: string | null;
  metadata: Record<string, unknown> | null;
  confirmed_at: string | null;
  consumed_at: string | null;
  expires_at: string;
};

function safeRelativePath(value: unknown) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : '/dashboard';
}

function redirectWithMessage(request: NextRequest, message: string, path = '/login') {
  const url = new URL(path, request.url);
  url.searchParams.set('message', message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token || !/^[a-f0-9]{32,64}$/i.test(token)) {
      return redirectWithMessage(request, 'VK-ссылка входа некорректна. Нажмите «Войти через VK» ещё раз.');
    }

    const admin = createSupabaseAdminClient();
    const { data, error } = await admin
      .from('sloty_vk_login_requests')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (error) throw error;

    const loginRequest = data as VkLoginRequestRow | null;

    if (!loginRequest) {
      return redirectWithMessage(request, 'VK-ссылка входа не найдена. Нажмите «Войти через VK» ещё раз.');
    }

    if (loginRequest.status === 'consumed' || loginRequest.consumed_at) {
      return redirectWithMessage(request, 'Эта VK-ссылка уже использована. Нажмите «Войти через VK» ещё раз.');
    }

    if (loginRequest.status !== 'confirmed' || !loginRequest.vk_user_id) {
      return redirectWithMessage(request, 'VK-вход ещё не подтверждён. Вернитесь в диалог с КликБук и нажмите кнопку входа.');
    }

    if (new Date(loginRequest.expires_at).getTime() < Date.now()) {
      await admin
        .from('sloty_vk_login_requests')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('token', token);

      return redirectWithMessage(request, 'VK-ссылка входа устарела. Нажмите «Войти через VK» ещё раз.');
    }

    const vkId = String(loginRequest.vk_user_id);
    const account = await findVkBotAccountByVkId(admin, vkId).catch(() => null);
    const fallbackProfile = {
      vkId,
      firstName: loginRequest.first_name,
      lastName: loginRequest.last_name,
      fullName: [loginRequest.first_name, loginRequest.last_name].filter(Boolean).join(' ').trim() || null,
      screenName: loginRequest.screen_name,
      domain: loginRequest.screen_name,
      photoUrl: loginRequest.photo_url,
      rawProfile: { source: 'sloty_vk_login_requests_complete' },
    };

    const profile = await getVkBotUserProfile(vkId).catch(() => fallbackProfile);
    const linkUserId =
      loginRequest.metadata &&
      loginRequest.metadata.mode === 'link' &&
      typeof loginRequest.metadata.link_user_id === 'string'
        ? loginRequest.metadata.link_user_id
        : null;
    const user = createVkBotVirtualUser(profile, linkUserId || account?.user_id || null);

    await upsertVkBotAccount(admin, {
      userId: user.id,
      vkUserId: vkId,
      peerId: loginRequest.peer_id ?? account?.peer_id ?? null,
      profile,
      messagesAllowed: true,
      metadata: { loginToken: token, source: 'vk_complete_route' },
    });

    await upsertVkOauthAccountFromBot(admin, { userId: user.id, profile }).catch(() => {});

    await admin
      .from('sloty_vk_login_requests')
      .update({
        status: 'consumed',
        consumed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('token', token);

    const appSessionToken = createProviderAppSessionToken({
      userId: user.id,
      provider: 'vk',
      providerUserId: vkId,
      username: profile.screenName || profile.domain,
      firstName: profile.firstName,
      lastName: profile.lastName,
      fullName: profile.fullName,
      avatarUrl: profile.photoUrl,
    });

    const next = safeRelativePath(loginRequest.metadata?.next);
    const redirectUrl = new URL(next, request.url);
    redirectUrl.searchParams.set('vk', 'connected');

    let response = NextResponse.redirect(redirectUrl);
    response = clearTelegramAppSessionCookie(response);

    return setProviderAppSessionCookie(response, {
      userId: user.id,
      provider: 'vk',
      providerUserId: vkId,
      username: profile.screenName || profile.domain,
      firstName: profile.firstName,
      lastName: profile.lastName,
      fullName: profile.fullName,
      avatarUrl: profile.photoUrl,
      token: appSessionToken,
    });
  } catch (error) {
    console.error('[vk-complete]', error instanceof Error ? error.message : error);
    return redirectWithMessage(request, 'Не удалось завершить VK-вход. Проверьте Render Logs.', '/login');
  }
}
