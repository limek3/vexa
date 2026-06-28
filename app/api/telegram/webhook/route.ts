import { NextResponse } from 'next/server';

import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TelegramFrom = {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
};

type TelegramUpdate = {
  message?: {
    message_id: number;
    text?: string;
    chat: {
      id: number;
      type: string;
    };
    from?: TelegramFrom;
  };
};

function extractAuthToken(text?: string) {
  const value = text?.trim();
  if (!value) return null;

  const patterns = [
    /^\/start\s+auth_([a-f0-9]{32,64})(?:\s|$)/i,
    /^\/start@\w+\s+auth_([a-f0-9]{32,64})(?:\s|$)/i,
    /^auth_([a-f0-9]{32,64})(?:\s|$)/i,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

async function sendTelegramMessage(chatId: number | string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
    cache: 'no-store',
  }).catch((error) => {
    console.error('[vexa-telegram-webhook] send failed', error);
  });
}

export async function POST(request: Request) {
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  const receivedSecret =
    request.headers.get('x-telegram-bot-api-secret-token')?.trim() ?? '';

  if (webhookSecret && receivedSecret !== webhookSecret) {
    return NextResponse.json({ ok: true, ignored: true, reason: 'secret_mismatch' });
  }

  const update = (await request.json().catch(() => null)) as TelegramUpdate | null;
  const message = update?.message;
  const token = extractAuthToken(message?.text);

  if (!message || !token || !message.from || message.from.is_bot) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const admin = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await admin
    .from('sloty_telegram_login_requests')
    .select('token,status,expires_at')
    .eq('token', token)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    await sendTelegramMessage(message.chat.id, 'Vexa: ссылка подключения не найдена. Создайте новую ссылку в приложении.');
    return NextResponse.json({ ok: true, status: 'not_found' });
  }

  if (data.status !== 'pending' || new Date(data.expires_at).getTime() < Date.now()) {
    await admin
      .from('sloty_telegram_login_requests')
      .update({ status: 'expired', updated_at: now })
      .eq('token', token);
    await sendTelegramMessage(message.chat.id, 'Vexa: ссылка подключения устарела. Создайте новую ссылку в приложении.');
    return NextResponse.json({ ok: true, status: 'expired' });
  }

  const { error: updateError } = await admin
    .from('sloty_telegram_login_requests')
    .update({
      status: 'confirmed',
      telegram_id: message.from.id,
      username: message.from.username ?? null,
      first_name: message.from.first_name ?? null,
      last_name: message.from.last_name ?? null,
      chat_id: message.chat.id,
      message_id: message.message_id,
      confirmed_at: now,
      updated_at: now,
    })
    .eq('token', token);

  if (updateError) throw updateError;

  await sendTelegramMessage(
    message.chat.id,
    'Vexa: Telegram подключен. Теперь уведомления о совпадениях смогут приходить сюда, а все настройки остаются в приложении.',
  );

  return NextResponse.json({ ok: true, status: 'confirmed' });
}
