# Vexa v4 — архитектура и деплой

## Что исправлено

### 1. Авторизация вынесена перед приложением

Раньше Vexa показывала экран входа внутри страницы `/desktop/searches`, поэтому пользователь видел левое меню и верхнюю панель до авторизации. Это было неправильно для desktop-приложения.

Теперь порядок такой:

1. Пользователь открывает `/desktop/searches` или Windows-приложение.
2. `VexaAuthGate` проверяет Supabase-сессию через `/api/auth/accounts`.
3. Если сессии нет, показывается отдельный полноэкранный экран входа Vexa.
4. После входа открывается весь desktop-интерфейс.
5. Внутри страниц Vexa больше нет отдельного auth-блока.

Измененные файлы:

- `app/desktop/_components/desktop-entry.tsx`
- `components/desktop-html-exact/vexa-auth-gate.jsx`
- `components/desktop-html-exact/desktop-html-app.jsx`
- `app/desktop/desktop.css`

### 2. Исправлен runtime error `Badge is not defined`

Причина: в `vexa-auth-gate.jsx` использовался компонент `<Badge />`, но он не был импортирован из `desktop-html-ui.jsx`.

Исправлено:

```js
import { Badge, Btn, Icon } from './desktop-html-ui';
```

### 3. Кнопки защищены от падения всего интерфейса

`Btn` теперь перехватывает ошибки в обработчиках клика и promise-ошибки. Если действие упало, приложение не валится в runtime overlay, а записывает событие в журнал действий и `console.error`.

Измененный файл:

- `components/desktop-html-exact/desktop-html-ui.jsx`

### 4. Добавлен runtime fallback для desktop-интерфейса

Если какой-то экран всё же упадет при render, пользователь увидит нормальную карточку ошибки с кнопкой перезагрузки, а не пустой экран или сломанный кабинет.

Измененный файл:

- `app/desktop/_components/desktop-workspace.tsx`

### 5. Railway и Windows разделены

Теперь есть два разных архива:

- Railway server: Next.js, API, Supabase auth, Vexa UI.
- Windows desktop: Electron-оболочка, которая открывает Railway URL.

Windows-приложение больше не должно содержать backend-логику и не должно пытаться решать Supabase/Telegram само.

## Что нужно загрузить в Railway

Загружать нужно архив `vexa-railway-server-v4.zip`.

Минимальные переменные Railway:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-or-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
APP_URL=https://your-railway-domain.up.railway.app
NEXT_PUBLIC_APP_URL=https://your-railway-domain.up.railway.app
```

Для Telegram-бота дополнительно:

```env
TELEGRAM_BOT_TOKEN=0000000000:telegram-bot-token
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=vexa_monitor_bot
TELEGRAM_WEBHOOK_SECRET=change-me
```

## Что собирать под Windows

Windows-архив `vexa-windows-desktop-v4.zip` собирается отдельно. Перед сборкой нужно указать Railway URL:

```bash
VEXA_DESKTOP_DEFAULT_APP_URL=https://your-railway-domain.up.railway.app/desktop/searches npm run desktop:dist
```

Для dev:

```bash
ELECTRON_APP_URL=http://localhost:3000/desktop/searches npm run desktop:dev
```

## Проверки в этой сборке

Проверено через TypeScript transpile:

- `components/desktop-html-exact/vexa-auth-gate.jsx`
- `components/desktop-html-exact/pages/vexa.jsx`
- `components/desktop-html-exact/desktop-html-app.jsx`
- `components/desktop-html-exact/desktop-html-ui.jsx`
- `app/desktop/_components/desktop-entry.tsx`
- `app/desktop/_components/desktop-workspace.tsx`
- `app/api/health/route.ts`
- `app/page.tsx`
- `app/auth/callback/route.ts`

Полный `next build` в этой среде не запускался из-за отсутствия установленных зависимостей и прежней проблемы registry 403.
