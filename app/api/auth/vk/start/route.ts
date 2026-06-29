import { NextResponse, type NextRequest } from 'next/server';

import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { requireAuthUser } from '@/lib/server/require-auth-user';
import { buildVkLoginToken } from '@/lib/server/vk-bot-auth';
import { getVkBotDeepLink, getVkBotDialogLink, getVkBotPrefillLink } from '@/lib/server/vk-bot';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safeRelativePath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/dashboard';
  return value;
}

function safeMode(value: string | null) {
  return value === 'link' ? 'link' : 'login';
}

export async function POST(request: NextRequest) {
  try {
    const admin = createSupabaseAdminClient();
    const token = buildVkLoginToken();
    const next = safeRelativePath(request.nextUrl.searchParams.get('next'));
    const mode = safeMode(request.nextUrl.searchParams.get('mode'));
    const payload = `auth_${token}`;
    const dialogUrl = getVkBotDialogLink();
    const vkUrl = getVkBotDeepLink(payload) || dialogUrl;
    const prefillUrl = getVkBotPrefillLink(`/start ${payload}`);

    if (!vkUrl) {
      throw new Error('Missing VK_BOT_GROUP_ID or VK_BOT_SCREEN_NAME');
    }

    const { error } = await admin.from('sloty_vk_login_requests').insert({
      token,
      status: 'pending',
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      metadata: { next, mode, flow: 'ref_button_bot' },
    });

    if (error) throw error;

    return NextResponse.json({
      token,
      vkUrl,
      dialogUrl,
      prefillUrl,
      command: mode === 'link' ? payload : '/start',
      expiresIn: 600,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'vk_bot_start_failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const mode = safeMode(request.nextUrl.searchParams.get('mode'));
    const next = safeRelativePath(request.nextUrl.searchParams.get('next'));

    if (mode !== 'link') {
      const url = new URL('/login', request.url);
      url.searchParams.set('message', 'VK-вход теперь работает через бота сообщества. Нажмите кнопку VK на странице входа.');
      return NextResponse.redirect(url);
    }

    const user = await requireAuthUser();
    const admin = createSupabaseAdminClient();
    const token = buildVkLoginToken();
    const payload = `auth_${token}`;
    const dialogUrl = getVkBotDialogLink();
    const vkUrl = getVkBotDeepLink(payload) || dialogUrl;
    const prefillUrl = getVkBotPrefillLink(`/start ${payload}`);

    if (!vkUrl) throw new Error('Missing VK_BOT_GROUP_ID or VK_BOT_SCREEN_NAME');

    const { error } = await admin.from('sloty_vk_login_requests').insert({
      token,
      status: 'pending',
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      metadata: { next, mode, link_user_id: user.id },
    });

    if (error) throw error;

    return NextResponse.redirect(vkUrl || prefillUrl || dialogUrl || '/dashboard/profile');
  } catch (error) {
    const url = new URL('/dashboard/profile', request.url);
    url.searchParams.set('message', error instanceof Error ? error.message : 'vk_link_start_failed');
    return NextResponse.redirect(url);
  }
}
