import { NextResponse } from 'next/server';

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

function normalizeReason(value: unknown) {
  let raw: string;

  if (value instanceof Error) raw = value.message;
  else if (typeof value === 'string') raw = value;
  else {
    try {
      raw = JSON.stringify(value);
    } catch {
      raw = 'vk_bot_status_failed';
    }
  }

  return raw.length > 900 ? `${raw.slice(0, 900)}...` : raw;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token || !/^[a-f0-9]{32,64}$/i.test(token)) {
      return NextResponse.json({ status: 'invalid' }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();

    const { data, error: requestError } = await admin
      .from('sloty_vk_login_requests')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (requestError) throw requestError;

    const loginRequest = data as VkLoginRequestRow | null;

    if (!loginRequest) {
      return NextResponse.json({ status: 'not_found' }, { status: 404 });
    }

    if (loginRequest.status === 'pending') {
      const expired = new Date(loginRequest.expires_at).getTime() < Date.now();

      if (expired) {
        await admin
          .from('sloty_vk_login_requests')
          .update({
            status: 'expired',
            updated_at: new Date().toISOString(),
          })
          .eq('token', token);

        return NextResponse.json({ status: 'expired' });
      }

      return NextResponse.json({ status: 'pending' });
    }

    if (loginRequest.status === 'expired') return NextResponse.json({ status: 'expired' });
    if (loginRequest.status === 'consumed' || loginRequest.consumed_at) return NextResponse.json({ status: 'consumed' });

    if (!loginRequest.vk_user_id) {
      return NextResponse.json({ status: 'invalid' }, { status: 400 });
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
      rawProfile: { source: 'sloty_vk_login_requests' },
    };

    const profile = await getVkBotUserProfile(vkId).catch(() => fallbackProfile);
    const linkUserId =
      loginRequest.metadata &&
      loginRequest.metadata.mode === 'link' &&
      typeof loginRequest.metadata.link_user_id === 'string'
        ? loginRequest.metadata.link_user_id
        : null;
    const user = createVkBotVirtualUser(profile, linkUserId || account?.user_id || null);

    try {
      await upsertVkBotAccount(admin, {
        userId: user.id,
        vkUserId: vkId,
        peerId: loginRequest.peer_id ?? account?.peer_id ?? null,
        profile,
        messagesAllowed: true,
        metadata: { loginToken: token },
      });

      await upsertVkOauthAccountFromBot(admin, { userId: user.id, profile });
    } catch (error) {
      console.warn('[vk-bot-status] account upsert skipped', error instanceof Error ? error.message : 'unknown_error');
    }

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

    let response = NextResponse.json({
      status: 'confirmed',
      app_session: true,
      appSessionToken,
      user: {
        id: user.id,
        email: user.email,
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata,
      },
    });

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
    const message = normalizeReason(error);
    console.error('[vk-bot-status]', message);
    return NextResponse.json({ status: 'error', error: message }, { status: 500 });
  }
}
