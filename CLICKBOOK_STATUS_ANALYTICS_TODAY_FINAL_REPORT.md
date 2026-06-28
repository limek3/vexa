# ClickBook Telegram Auth Final Fix — 2026-05-02

## Что исправлено

1. Убран конфликт с Supabase GoTrue:
   - код больше не пишет `provider/providers` в `app_metadata` Supabase Auth user;
   - Telegram-данные остаются в `user_metadata` и `sloty_telegram_accounts`.

2. Telegram webhook больше не создаёт Supabase Auth user на этапе `/start auth_...`:
   - webhook только подтверждает `sloty_telegram_login_requests`;
   - user создаётся в `/api/auth/telegram/status`, когда браузер завершает вход.

3. Добавлен fallback для Supabase Auth:
   - сначала создаём user с `user_metadata`;
   - если GoTrue отдаёт тупой `Internal Server Error`, создаём user минимальным payload и потом best-effort обновляем metadata.

4. Исправлен `Plus is not defined`:
   - `app/dashboard/profile/page.tsx` теперь импортирует `Plus` из `lucide-react`.

5. Подготовлена полная SQL-база:
   - `supabase/CLICKBOOK_FULL_DATABASE_FIXED_20260502.sql` — полный SQL под проект;
   - `supabase/migrations/20260502_0016_clickbook_telegram_auth_hardening.sql` — отдельный hardening-патч.

## Что делать после деплоя

1. Залить архив в GitHub/Vercel.
2. В Supabase SQL Editor выполнить:
   - если база новая/можно прогнать всё: `supabase/CLICKBOOK_FULL_DATABASE_FIXED_20260502.sql`;
   - если база уже создана: достаточно `supabase/migrations/20260502_0016_clickbook_telegram_auth_hardening.sql`.
3. В Vercel сделать Redeploy.
4. Открыть `/auth/signout`.
5. В приватном окне открыть `/login` и заново пройти Telegram-вход.

## Важно

Удалять `auth.users` SQL-скриптом не стал. Если надо полностью очистить тестовую авторизацию, лучше вручную удалить пользователей в Supabase Dashboard → Authentication → Users, а потом выполнить `CLICKBOOK_DEV_RESET_PUBLIC_DATA.sql`.
