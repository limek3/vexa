# КликБук: деплой на Render Free

Эта сборка возвращает Telegram-функциональность и подготовлена под Render Free.

## Что изменено

- Telegram снова включён: вкладка Telegram на `/login`, Telegram Login Button, Mini App, webhook routes и bot API оставлены рабочими.
- Telegram WebApp SDK больше не грузится глобально: `telegram.org/js/telegram-web-app.js` подключается только на `/miniapp` и только при признаках Telegram WebApp-среды.
- Все опасные Telegram WebApp-вызовы завернуты в безопасные проверки версии и `try/catch`.
- Добавлен Render-конфиг `render.yaml`.
- Добавлены Render scripts в `package.json`:
  - `npm run build`
  - `npm run start:render`
- Добавлен `.node-version` и `engines.node = 22.x`.
- Удалён неиспользуемый `@vercel/analytics`.
- Удалён битый `pnpm-lock.yaml`, чтобы Render не пытался ставить зависимости через pnpm.
- Добавлен `.npmrc` с `legacy-peer-deps=true`, чтобы сборка не падала из-за peer-deps.

## Как создать Render Free Web Service

1. Залей проект в GitHub.
2. Render → New → Web Service.
3. Подключи репозиторий.
4. Выбери:

```txt
Runtime: Node
Instance Type: Free
Branch: main
Root Directory: пусто, если проект лежит в корне
Build Command: npm install --legacy-peer-deps && npm run build
Start Command: npm run start:render
```

Если Render предложит Blueprint из `render.yaml`, можно использовать его. Все секреты всё равно нужно добавить вручную.

## Обязательные переменные окружения

Перенеси из Vercel в Render → Environment.

Минимально для запуска:

```txt
NODE_VERSION=22.16.0
NEXT_TELEMETRY_DISABLED=1
APP_URL=https://ТВОЙ-СЕРВИС.onrender.com
NEXT_PUBLIC_APP_URL=https://ТВОЙ-СЕРВИС.onrender.com
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=...
KEY_VAULTS_SECRET=...
```

Telegram:

```txt
TELEGRAM_BOT_TOKEN=...
TELEGRAM_WEBHOOK_SECRET=...
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=...
TELEGRAM_SUPPORT_CHAT_ID=...
NEXT_PUBLIC_SUPPORT_TELEGRAM_URL=https://t.me/...
```

VK, если нужен:

```txt
VK_ID_CLIENT_ID=...
VK_ID_CLIENT_SECRET=...
VK_ID_REDIRECT_URI=https://ТВОЙ-СЕРВИС.onrender.com/api/auth/vk/callback
VK_BOT_GROUP_ID=...
VK_BOT_ACCESS_TOKEN=...
VK_BOT_SECRET=...
VK_BOT_CONFIRMATION_CODE=...
NEXT_PUBLIC_VK_BOT_GROUP_ID=...
NEXT_PUBLIC_VK_BOT_SCREEN_NAME=...
```

## После первого деплоя

1. Открой Render URL:

```txt
https://ТВОЙ-СЕРВИС.onrender.com/login
```

2. В Supabase Auth добавь Redirect URL:

```txt
https://ТВОЙ-СЕРВИС.onrender.com/auth/callback
```

3. В Google OAuth добавь redirect/callback, который требует Supabase для Google-провайдера.

4. Для Telegram webhook вызови:

```txt
https://ТВОЙ-СЕРВИС.onrender.com/api/telegram/setup?secret=TELEGRAM_WEBHOOK_SECRET
```

Если всё успешно, route вернёт JSON с `ok: true`.

## Когда подключишь свой домен

Если Render-домен работает стабильно без VPN, потом можно подключить `кликбук.рф`.

После подключения домена обнови в Render:

```txt
APP_URL=https://кликбук.рф
NEXT_PUBLIC_APP_URL=https://кликбук.рф
VK_ID_REDIRECT_URI=https://кликбук.рф/api/auth/vk/callback
```

И обнови Redirect URL в Supabase/Google/VK.

## Важный нюанс Render Free

Free-инстанс может засыпать после простоя. Первый заход после сна может быть медленным. Для проверки стабильности без VPN это нормально.
