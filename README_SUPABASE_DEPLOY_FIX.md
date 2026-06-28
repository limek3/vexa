# Telegram auth app-session fix

This build removes the fragile final step where Telegram auth tried to create a Supabase browser session through password/magic-link flows.

New flow:

1. `/api/auth/telegram/start` creates a short-lived login token and opens the bot.
2. `/api/telegram/webhook` confirms the token when the user sends `/start auth_<token>`.
3. `/api/auth/telegram/status` creates or finds the Supabase Auth user by Telegram id.
4. Instead of calling Supabase password/magic-link session APIs, the server sets a signed HttpOnly cookie: `clickbook_auth_session`.
5. `requireAuthUser()` accepts this signed cookie and returns the same stable user id.
6. `lib/supabase/proxy.ts` allows dashboard pages when this app session cookie exists.

Why:

- This avoids `Internal Server Error` on `/api/auth/telegram/status` caused by Supabase token generation.
- The user no longer needs email/password.
- The client flow stays simple: click Telegram → confirm in bot → return/open dashboard.

Required env:

```env
TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_SECRET=letters_numbers_only
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=bot_username_without_@
NEXT_PUBLIC_APP_URL=https://www.кликбук.рф
KEY_VAULTS_SECRET=long_random_secret
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

After deploy, set webhook:

```powershell
$TOKEN="TELEGRAM_BOT_TOKEN"
$SECRET="TELEGRAM_WEBHOOK_SECRET"

Invoke-RestMethod `
  -Uri "https://api.telegram.org/bot$TOKEN/setWebhook" `
  -Method Post `
  -Body @{
    url = "https://www.кликбук.рф/api/telegram/webhook"
    secret_token = $SECRET
    drop_pending_updates = "true"
  }
```

Check:

```powershell
Invoke-RestMethod `
  -Uri "https://api.telegram.org/bot$TOKEN/getWebhookInfo" `
  -Method Get
```
