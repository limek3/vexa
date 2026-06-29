import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ReportCategory = 'bug' | 'idea' | 'question';

interface SupportReportBody {
  category?: ReportCategory;
  message?: string;
  contact?: string;
  path?: string;
  locale?: string;
  userAgent?: string;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function categoryLabel(category: ReportCategory) {
  if (category === 'idea') return 'Идея';
  if (category === 'question') return 'Вопрос';
  return 'Ошибка';
}

export async function POST(request: Request) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_SUPPORT_CHAT_ID;

    if (!botToken || !chatId) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Telegram env is not configured',
        },
        { status: 500 },
      );
    }

    const body = (await request.json()) as SupportReportBody;

    const category: ReportCategory =
      body.category === 'idea' || body.category === 'question' || body.category === 'bug'
        ? body.category
        : 'bug';

    const message = String(body.message || '').trim();
    const contact = String(body.contact || '').trim();
    const path = String(body.path || '').trim();
    const locale = String(body.locale || '').trim();
    const userAgent = String(body.userAgent || '').trim();

    if (message.length < 8) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Message is too short',
        },
        { status: 400 },
      );
    }

    const telegramText = [
      '<b>Новый репорт из КликБук</b>',
      '',
      `<b>Тип:</b> ${escapeHtml(categoryLabel(category))}`,
      `<b>Страница:</b> ${escapeHtml(path || 'Не указана')}`,
      `<b>Язык:</b> ${escapeHtml(locale || 'Не указан')}`,
      '',
      '<b>Сообщение:</b>',
      escapeHtml(message).slice(0, 2600),
      '',
      `<b>Контакт:</b> ${escapeHtml(contact || 'Не указан')}`,
      '',
      `<b>User Agent:</b> ${escapeHtml(userAgent || 'Не указан').slice(0, 600)}`,
    ].join('\n');

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: telegramText,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      },
    );

    if (!telegramResponse.ok) {
      const errorText = await telegramResponse.text();

      return NextResponse.json(
        {
          ok: false,
          error: errorText,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: 'Unexpected error',
      },
      { status: 500 },
    );
  }
}