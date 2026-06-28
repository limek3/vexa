# ClickBook Telegram navigation auth fix

Исправлена проблема, когда после успешного входа в Telegram Mini App переход по пунктам меню снова отправлял на `/login`.

Причина: `proxy.ts` проверял защищённые страницы на сервере и редиректил на `/login`, если cookie ещё не пришла в запросе. В Telegram Mini App это нестабильно, потому что `initData` доступна только на клиенте через Telegram WebApp SDK, а не в `proxy.ts`.

Что изменено:

1. `lib/supabase/proxy.ts`
   - убран жёсткий серверный редирект `/dashboard` и `/create-profile` на `/login`;
   - API-роуты всё ещё защищены через `requireAuthUser()`;
   - если сессия уже есть и пользователь открывает `/login`, его переводит в `/dashboard`.

2. `components/auth/telegram-miniapp-auto-auth.tsx`
   - на страницах `/dashboard/*`, `/create-profile/*` и `/login` Telegram Mini App авторизация запускается с `force: true`, чтобы cookie обновлялась перед работой страницы.

3. `lib/telegram-miniapp-auth-client.ts`
   - событие `clickbook:auth-session-ready` теперь отправляется даже при кэшированной успешной авторизации, чтобы `AppProvider` перезагружал workspace.

4. `vercel.json`
   - cron переведён на `0 3 * * *`, чтобы Hobby deploy не падал из-за hourly cron.
