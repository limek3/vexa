import { NextResponse } from 'next/server';

import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';
import { requireAuthUser } from '@/lib/server/require-auth-user';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getAppUrl() {
  return (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

async function sendTelegramMessage(params: {
  chatId: number | string;
  text: string;
  replyMarkup?: Record<string, unknown>;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('Missing TELEGRAM_BOT_TOKEN');

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: params.chatId,
      text: params.text,
      disable_web_page_preview: true,
      ...(params.replyMarkup ? { reply_markup: params.replyMarkup } : {}),
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`telegram_send_failed:${body}`);
  }
}

export async function POST() {
  try {
    const user = await requireAuthUser();
    const admin = createSupabaseAdminClient();

    const { data, error } = await admin
      .from('sloty_telegram_accounts')
      .select('telegram_id,chat_id,username')
      .eq('user_id', user.id)
      .not('chat_id', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data?.chat_id) {
      return NextResponse.json(
        { error: 'telegram_not_connected' },
        { status: 409 },
      );
    }

    await sendTelegramMessage({
      chatId: data.chat_id,
      text: [
        'Vexa: тестовое уведомление работает.',
        '',
        'Когда появится новое совпадение, бот пришлет короткий push, а все настройки останутся в приложении.',
      ].join('\n'),
      replyMarkup: {
        inline_keyboard: [
          [
            {
              text: 'Открыть Vexa',
              url: `${getAppUrl()}/desktop/dashboard`,
            },
          ],
        ],
      },
    });

    return NextResponse.json({
      ok: true,
      telegram: {
        username: data.username ?? null,
        telegram_id: data.telegram_id ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'telegram_test_failed';
    const status = message === 'unauthorized' ? 401 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
