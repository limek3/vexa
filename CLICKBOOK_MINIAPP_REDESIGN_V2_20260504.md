# ClickBook Mini App stable auth patch — 2026-05-04

Что исправлено:

1. `/api/auth/telegram-miniapp` больше не вызывает `admin.auth.admin.createUser()` для Mini App входа.
   - Если Telegram-аккаунт уже связан, используется существующий `sloty_telegram_accounts.user_id`.
   - Если связи ещё нет, создаётся стабильный детерминированный UUID по `telegram_id`.
   - Сессия остаётся через `clickbook_auth_session` + `X-ClickBook-App-Session`.

2. `requireAuthUser()` больше не пытается на каждом `/api/workspace` и `/api/chats` пересоздавать Supabase Auth user по Telegram app-session.
   - Это убирает повторяющиеся логи вида `Supabase Auth user create failed, using virtual Telegram user`.
   - Это убирает лишние подвисания кабинета после входа в Mini App.

3. Реальная Supabase-сессия через Bearer/cookie всё равно остаётся главнее app-session, чтобы VK/обычный вход не перебивались старым Telegram-токеном.

После деплоя:

1. В Vercel сделать redeploy.
2. Открыть `/auth/signout` в браузере.
3. В Telegram закрыть Mini App полностью и открыть заново из бота.
4. Если профиль не создаётся/не сохраняется, выполнить SQL `supabase/migrations/20260502_0018_clickbook_telegram_virtual_user_auth_repair.sql`, потому что public-таблицы не должны требовать FK на `auth.users` для virtual app-session.
