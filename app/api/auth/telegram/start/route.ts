import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getBotUsername() {
  const value = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  if (!value) {
    throw new Error('Missing NEXT_PUBLIC_TELEGRAM_BOT_USERNAME');
  }

  return value.replace(/^@/, '').trim();
}

export async function POST() {
  try {
    const admin = createSupabaseAdminClient();
    // Telegram deep-link start payload must stay <= 64 chars.
    // `auth_` + 32 hex chars = 37 chars, so it works both on PC and phone.
    const token = randomBytes(16).toString('hex');

    const { error } = await admin.from('sloty_telegram_login_requests').insert({
      token,
      status: 'pending',
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    if (error) throw error;

    const botUsername = getBotUsername();

    return NextResponse.json({
      token,
      botUrl: `https://t.me/${botUsername}?start=auth_${token}`,
      expiresIn: 600,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'telegram_start_failed';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
