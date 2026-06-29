import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { createTelegramAppSessionToken, setTelegramAppSessionCookie } from '@/lib/server/app-session';
import { verifyTelegramMiniAppInitData } from '@/lib/server/telegram-miniapp';
import { upsertTelegramAccount } from '@/lib/server/telegram-user';
import { createTelegramVirtualUserId } from '@/lib/server/telegram-virtual-user';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TelegramMiniAppAuthBody = {
  initData?: string;
};

function normalizeUserId(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeChatId(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.trunc(parsed);
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TelegramMiniAppAuthBody;
    const verified = verifyTelegramMiniAppInitData(body.initData ?? '');
    const admin = createSupabaseAdminClient();

    const { data: existingAccount, error: accountError } = await admin
      .from('sloty_telegram_accounts')
      .select('user_id,chat_id')
      .eq('telegram_id', verified.user.id)
      .maybeSingle();

    if (accountError) throw accountError;

    const userId = normalizeUserId(existingAccount?.user_id) ?? createTelegramVirtualUserId(verified.user.id);
    const chatId = normalizeChatId(existingAccount?.chat_id);

    await upsertTelegramAccount(admin, {
      userId,
      telegramId: verified.user.id,
      username: verified.user.username ?? null,
      firstName: verified.user.first_name ?? null,
      lastName: verified.user.last_name ?? null,
      photoUrl: verified.user.photo_url ?? null,
      chatId,
      authDate: verified.authDate.toISOString(),
    });

    const appSessionToken = createTelegramAppSessionToken({
      userId,
      telegramId: verified.user.id,
      username: verified.user.username ?? null,
      firstName: verified.user.first_name ?? null,
      lastName: verified.user.last_name ?? null,
    });

    const response = NextResponse.json({
      ok: true,
      app_session: true,
      appSessionToken,
      user: {
        id: userId,
        telegramId: verified.user.id,
        username: verified.user.username ?? null,
        firstName: verified.user.first_name ?? null,
      },
      startParam: verified.startParam ?? null,
    });

    return setTelegramAppSessionCookie(response, {
      userId,
      telegramId: verified.user.id,
      username: verified.user.username ?? null,
      firstName: verified.user.first_name ?? null,
      lastName: verified.user.last_name ?? null,
      token: appSessionToken,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'telegram_miniapp_auth_failed';

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 401 },
    );
  }
}