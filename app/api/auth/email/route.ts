import { NextResponse, type NextRequest } from 'next/server';

import { createSupabaseAdminClient } from '@/lib/server/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yandex.ru',
  'yandex.com',
  'ya.ru',
  'mail.ru',
  'inbox.ru',
  'bk.ru',
  'list.ru',
  'internet.ru',
  'icloud.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'rambler.ru',
  'proton.me',
  'protonmail.com',
]);

function normalizeEmail(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function emailDomain(email: string) {
  return email.split('@')[1] || '';
}

function isAllowedEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && ALLOWED_EMAIL_DOMAINS.has(emailDomain(email));
}

async function emailExists(email: string) {
  const admin = createSupabaseAdminClient();
  let page = 1;

  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;

    const users = data?.users || [];
    if (users.some((user) => normalizeEmail(user.email) === email)) return true;
    if (users.length < 100) return false;
    page += 1;
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = normalizeEmail(body.email);

    if (!isAllowedEmail(email)) {
      return NextResponse.json({
        ok: false,
        error: 'Разрешены только проверенные почтовые домены: Gmail, Яндекс, Mail.ru, iCloud, Outlook, Rambler, Proton.',
      }, { status: 400 });
    }

    return NextResponse.json({ ok: true, exists: await emailExists(email) });
  } catch {
    return NextResponse.json({
      ok: false,
      error: 'Не удалось проверить email. Попробуйте еще раз.',
    }, { status: 500 });
  }
}
