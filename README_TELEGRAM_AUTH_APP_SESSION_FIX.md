# Telegram bot auth flow

This build uses bot-based login instead of Telegram Login Widget. It does **not** use the browser widget, so `Bot domain invalid` is avoided.

Flow:

1. User clicks “Войти через Telegram”.
2. App creates a temporary login token.
3. Browser opens `https://t.me/<bot>?start=auth_<token>`.
4. User presses Start in the bot.
5. Telegram sends an update to `/api/telegram/webhook`.
6. The site polls `/api/auth/telegram/status` and receives Supabase session tokens.

If Telegram sends only `/start`, the bot now replies with instructions. The UI also has a fallback button: “Скопировать команду для бота”.

## Required Vercel variables

```env
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username_without_at
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBHOOK_SECRET=random_secret
NEXT_PUBLIC_APP_URL=https://www.кликбук.рф
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

`TELEGRAM_BOT_TOKEN` and `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` must belong to the same bot.

## Supabase SQL

Run:

```txt
supabase/migrations/20260430_0006_telegram_bot_auth.sql
```

## Set Telegram webhook

Run after Vercel deploy is Ready.

PowerShell:

```powershell
$TOKEN="TELEGRAM_BOT_TOKEN"
$SECRET="TELEGRAM_WEBHOOK_SECRET"

Invoke-RestMethod `
  -Uri "https://api.telegram.org/bot$TOKEN/setWebhook" `
  -Method Post `
  -Body @{
    url = "https://www.кликбук.рф/api/telegram/webhook"
    secret_token = $SECRET
  }
```

Check:

```powershell
Invoke-RestMethod -Uri "https://api.telegram.org/bot$TOKEN/getWebhookInfo" -Method Get
```

Expected important fields:

```txt
url: https://www.кликбук.рф/api/telegram/webhook
pending_update_count: 0 or more
last_error_message: empty/null
```

If bot is silent after `/start`, webhook is not set or the `secret_token` does not match `TELEGRAM_WEBHOOK_SECRET` in Vercel.

To reset webhook:

```powershell
Invoke-RestMethod -Uri "https://api.telegram.org/bot$TOKEN/deleteWebhook" -Method Post
```

Then run `setWebhook` again.
