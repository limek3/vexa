# Telegram bot auth — status 500 fix

Этот патч исправляет ситуацию, когда бот уже пишет «Вход подтверждён», но сайт остаётся на `/login` и показывает `Internal Server Error`.

Что изменено:

- `app/api/auth/telegram/status/route.ts`
  - сделал Telegram-аккаунт идемпотентным;
  - если Supabase user уже был создан раньше, но строки в `sloty_telegram_accounts` нет, API найдёт пользователя по техническому email и привяжет его заново;
  - добавлен `Authorization: Bearer <publishable key>` для Supabase token endpoint;
  - ошибки теперь логируются как `[telegram-status] ...`.

- `components/auth/telegram-login-button.tsx`
  - безопасно читает ответ API даже если Vercel вернул plain text;
  - показывает более понятную ошибку вместо голого `Internal Server Error`.

После загрузки:

1. `git add .`
2. `git commit -m "fix telegram auth status session"`
3. `git push origin main`
4. дождаться Vercel Ready / или Redeploy without cache
5. проверить `/login` заново в инкогнито

Если будет ошибка `supabase_token_failed`, проверь в Supabase:

- Authentication → Providers → Email включён;
- в Vercel есть `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`;
- миграция `20260430_0006_telegram_bot_auth.sql` выполнена.
