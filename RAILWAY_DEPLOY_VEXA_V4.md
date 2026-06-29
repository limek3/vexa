# Railway deploy — Vexa v4

## 1. Создать Railway project

В Railway создай новый проект и загрузи содержимое архива `vexa-railway-server-v4.zip`.

Railway должен увидеть:

- `package.json`
- `railway.json`
- `next.config.js`
- `app/`
- `components/`
- `lib/`
- `public/`

## 2. Указать variables

Обязательные:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
APP_URL=https://your-railway-domain.up.railway.app
NEXT_PUBLIC_APP_URL=https://your-railway-domain.up.railway.app
```

Опциональные для Telegram:

```env
TELEGRAM_BOT_TOKEN=0000000000:telegram-bot-token
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=vexa_monitor_bot
TELEGRAM_WEBHOOK_SECRET=change-me
```

Не ставь `NEXT_PUBLIC_VEXA_LOCAL_MODE=1` на production, иначе можно открыть локальный демо-режим без нормальной авторизации.

## 3. Supabase Auth

В Supabase должны быть включены email/password sign-in или email confirmations в зависимости от нужного сценария.

Для email redirect добавь Railway domain в Supabase Auth URL configuration:

```text
https://your-railway-domain.up.railway.app/auth/callback
```

После входа Vexa возвращает пользователя на:

```text
/desktop/searches
```

## 4. Healthcheck

Railway healthcheck:

```text
/api/health
```

Ожидаемый ответ:

```json
{ "ok": true, "service": "vexa", "version": "0.4.0" }
```

## 5. После деплоя

Открой:

```text
https://your-railway-domain.up.railway.app/desktop/searches
```

До авторизации должен быть только экран входа Vexa. Левое меню и верхняя панель не должны отображаться. После входа открывается полноценный кабинет.
