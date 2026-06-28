# Temporary Telegram removal patch

Цель: проверить обычный сайт без любой зависимости от Telegram/telegram.org.

Что отключено:

- глобальная загрузка `https://telegram.org/js/telegram-web-app.js`;
- глобальный `TelegramMiniAppViewport`;
- глобальный `TelegramMiniAppAutoAuth`;
- Telegram-вкладка на `/login`;
- Telegram Login Button и Mini App Gate заменены безопасными заглушками;
- `/app` и `/miniapp` больше не импортируют Mini App / Telegram-код;
- `lib/telegram-miniapp-auth-client.ts` превращён в no-op, не читает `window.Telegram`, не ходит в `/api/auth/telegram-miniapp`, не добавляет session headers;
- `@twa-dev/sdk` убран из `package.json`.

После деплоя делать: Vercel → Deployments → Redeploy → Use existing Build Cache: OFF.

Если после этого `_next/static/chunks/*.js` всё равно грузятся нестабильно, причина не Telegram, а сеть/маршрут/браузерная защита/домен.
