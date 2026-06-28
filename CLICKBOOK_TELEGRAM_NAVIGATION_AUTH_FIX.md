# ClickBook Telegram session fix report

Что исправлено в этом архиве:

1. **Telegram Mini App теперь авторизует пользователя автоматически**
   - Добавлен глобальный `TelegramMiniAppAutoAuth`.
   - Он срабатывает на любой странице, где есть `window.Telegram.WebApp.initData`.
   - На `/login` после успешной авторизации возвращает пользователя на `redirectTo`, например `/create-profile`.

2. **Исправлен сценарий “создать профиль → снова выкинуло на авторизацию”**
   - `AppProvider` теперь при `401` пробует заново подтвердить Telegram Mini App session и повторяет запрос.
   - Это добавлено для `/api/workspace`, `/api/profile`, `/api/workspace/section`, `/api/bookings PATCH`.
   - Если cookie ещё не успела установиться, сохранение профиля больше не падает сразу в “Сессия истекла”.

3. **Cookie сессии усилена для Telegram WebView**
   - `clickbook_auth_session` ставится на 30 дней.
   - В production/Vercel используется `SameSite=None; Secure`, чтобы Telegram WebView не терял cookie.
   - В local/dev автоматически используется `SameSite=Lax` без `Secure`, чтобы cookie работала на localhost.
   - Sign out теперь чистит cookie теми же параметрами.

4. **Кнопка входа через Telegram внутри Mini App больше не выкидывает из приложения**
   - `TelegramLoginButton` сначала проверяет, открыт ли сайт как Mini App.
   - Если да — делает прямую авторизацию через initData, без `window.open(t.me)`.
   - Внешняя кнопка на странице `/login` ведёт на `?startapp=dashboard`, а не просто в чат бота.

5. **Поправлены серверные мелочи**
   - Убран дублирующийся ключ `metadata` в `app/api/auth/telegram/status/route.ts`.
   - `supabase-workspaces.ts` и `supabase-rest.ts` больше не читают env-переменные на import-time, чтобы снизить риск build/import ошибок.

6. **SQL доделан**
   - Добавлен новый migration: `supabase/migrations/20260501_0008_clickbook_telegram_session_hardening.sql`.
   - Добавлен общий файл для ручного запуска в Supabase SQL Editor: `supabase/RUN_ALL_CLICKBOOK_SQL.sql`.

Проверка:
- Прогнал синтаксический parse/transpile-check по TypeScript/TSX файлам проекта локально через TypeScript API. Файлы парсятся.
- Полный `next build` в контейнере не запускался, потому что в архиве нет `node_modules`, а установка зависимостей из сети в этом окружении недоступна.

После загрузки на Vercel:
1. Проверь env:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` или `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_WEBHOOK_SECRET`
   - `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`
   - `NEXT_PUBLIC_APP_URL`
2. Выполни `supabase/RUN_ALL_CLICKBOOK_SQL.sql` или новый migration `20260501_0008...`, если старые SQL уже были применены.
3. После деплоя открой `/api/telegram/setup?secret=TELEGRAM_WEBHOOK_SECRET`, чтобы обновить webhook и menu button бота.
