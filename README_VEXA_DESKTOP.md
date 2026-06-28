# Vexa Desktop Prototype

Это форк desktop-оболочки из исходного проекта. Внешний стиль, Electron-обертка,
сайдбар, топбар, темы, уведомления и общие UI-примитивы сохранены, а основные
рабочие экраны заменены на Vexa.

## Основные экраны

- `/desktop/dashboard` — дашборд мониторинга
- `/desktop/searches` — поиски и редактор кампании
- `/desktop/matches` — лента совпадений и детали сообщения
- `/desktop/sources` — источники Telegram и статусы доступа
- `/desktop/contacts` — лиды и быстрые действия по Telegram
- `/desktop/analytics` — воронка, эффективность источников и экспорт
- `/desktop/payments` — счета, статусы оплаты и экспорт
- `/desktop/notifications` — правила уведомлений и тестовая отправка
- `/desktop/subscription` — тарифы и лимиты
- `/desktop/settings` — уведомления, тихие часы, аккаунт
- `/desktop/help` — диагностика и данные для поддержки

## Запуск

```bash
npm install
npm run dev
```

Electron-режим:

```bash
npm run desktop:dev
```

## Что важно

Сейчас это рабочий UI-прототип на общем локальном workspace. Данные сохраняются
в `localStorage` по ключу `vexa.desktop.workspace.v3`, поэтому изменения не
теряются при переходе между страницами:

- поиски, совпадения, источники, контакты, счета, правила уведомлений и настройки
  живут в одном состоянии;
- действие `Написать` в совпадениях создает или обновляет контакт;
- выбор тарифа меняет лимиты и может создать счет;
- проверка источников обновляет статусы и отражается на главной;
- главная показывает умные подсказки и журнал последних действий.

Стартовые мок-поиски, мок-источники, мок-контакты и мок-счета убраны. После
первого входа workspace пустой: пользователь создает реальные поиски и источники
сам. Кнопка обновления совпадений больше не генерирует фейковые лиды.

## Авторизация и Telegram

Vexa desktop-страницы закрыты email-first auth gate. Основной вход — email и
пароль через Supabase Auth. Если Supabase env не настроен, приложение откроется
в локальном режиме для разработки, но production должен работать через Supabase.

Telegram больше не является способом входа в Vexa. Бот используется только как
опциональный канал уведомлений о совпадениях. Все настройки, поиски, источники,
тарифы и фильтры остаются в приложении.

Для production-входа нужны:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Для Telegram-уведомлений дополнительно нужны:

- `TELEGRAM_BOT_TOKEN`
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`
- `TELEGRAM_WEBHOOK_SECRET`

Flow подключения Telegram-уведомлений:

- пользователь входит в приложение по email
- в настройках нажимает "Подключить Telegram"
- приложение вызывает `/api/auth/telegram/link/start`
- пользователь открывает нашего бота и нажимает `/start`
- `/api/auth/telegram/status`
- Telegram chat_id привязывается к текущему email-аккаунту
- тестовое уведомление отправляется через `/api/vexa/telegram/test`

Где взять значения:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase Dashboard -> Project Settings -> API -> Project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase Dashboard -> Project Settings -> API Keys -> publishable key. Для старых проектов можно использовать anon key.
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase Dashboard -> Project Settings -> API Keys -> secret/service role key. Только сервер, не добавлять `NEXT_PUBLIC_`.
- `TELEGRAM_BOT_TOKEN` — Telegram, чат с `@BotFather`, команда `/newbot`, затем скопировать token.
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` — username этого же бота из `@BotFather`, например `vexa_bot` без `@`.

Локально значения кладутся в `.env.local`. На Railway/Render — в Variables/Environment.

## Railway deploy

В проект добавлен `railway.json`:

- build: `npm ci && npm run build`
- start: `npm run start:railway`

`next.config.js` включает `output: 'standalone'`, а `start:railway` запускает
`.next/standalone/server.js` на `0.0.0.0:$PORT`, что нужно для Railway.

Минимальные production-переменные:

- `NODE_VERSION=22.16.0`
- `NEXT_TELEMETRY_DISABLED=1`
- `NEXT_PUBLIC_APP_URL=https://your-railway-domain.up.railway.app`
- `APP_URL=https://your-railway-domain.up.railway.app`
- `NEXT_PUBLIC_SUPABASE_URL=...`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `KEY_VAULTS_SECRET=replace_with_long_random_secret`

Для Telegram-уведомлений дополнительно:

- `TELEGRAM_BOT_TOKEN=...`
- `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=...`
- `TELEGRAM_WEBHOOK_SECRET=replace_with_long_random_secret`

Для Telegram-привязки в новой базе применить минимальную миграцию:

- `supabase/migrations/20260628_0001_vexa_telegram_notifications.sql`

После первого deploy нужно указать Railway URL в Supabase Auth Redirect URLs,
если включаются email confirmations или OAuth-провайдеры.

Старые страницы исходного проекта физически еще лежат в проекте как запас, но
новая desktop-навигация ведет в Vexa-разделы.

Следующий этап — заменить локальные мок-данные на реальные API Vexa: поиски,
совпадения, источники, лимиты, контакты, уведомления и платежи.
