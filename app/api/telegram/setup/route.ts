import { NextResponse } from 'next/server';
import { getAppUrl, setTelegramMenuButton, setTelegramWebhook } from '@/lib/server/telegram-bot';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function checkSecret(request: Request) {
  const url = new URL(request.url);
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  const received = request.headers.get('x-telegram-setup-secret') || url.searchParams.get('secret');

  return Boolean(expected && received && expected === received);
}

export async function GET(request: Request) {
  if (!checkSecret(request)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const appUrl = getAppUrl();
  const webhookUrl = `${appUrl}/api/telegram/webhook`;

  try {
    const webhook = await setTelegramWebhook();
    const menu = await setTelegramMenuButton();

    return NextResponse.json({ ok: true, appUrl, webhookUrl, webhook, menu });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'telegram_setup_failed',
        appUrl,
        webhookUrl,
      },
      { status: 500 },
    );
  }
}
