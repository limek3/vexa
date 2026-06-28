# Login simplified / Telegram bot auth

Что изменено:
- `/login` теперь узкий минимальный экран без большой левой промо-колонки.
- Email-форма убрана полностью.
- Оставлены только три способа входа: Telegram активный, Google и MAX как неактивные варианты "скоро".
- Telegram Login Widget больше не используется, поэтому ошибка `Bot domain invalid` не должна появляться.
- Основной поток: сайт открывает бота через `/start auth_<token>`, webhook подтверждает вход, сайт получает Supabase session.

Важно после деплоя:
1. В Vercel Production должны быть:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`
   - `NEXT_PUBLIC_APP_URL=https://www.кликбук.рф`
2. После изменения env сделать `Redeploy without cache`.
3. Webhook должен быть установлен на:
   `https://www.кликбук.рф/api/telegram/webhook`
