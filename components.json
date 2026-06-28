# Mini App Telegram Mobile Crash Fix — 2026-05-04

Что исправлено:

1. `components/system/telegram-miniapp-viewport.tsx`
   - Telegram WebView методы и события теперь вызываются безопасно через `try/catch`.
   - Старые мобильные клиенты Telegram больше не смогут уронить приложение из-за неизвестных событий `safeAreaChanged` / `contentSafeAreaChanged`.
   - `ready`, `expand`, `disableVerticalSwipes`, `onEvent`, `offEvent` больше не ломают mini app, если конкретная версия Telegram их не поддерживает.

2. `app/app/page.tsx`
   - Добавлен локальный error boundary вокруг mini app.
   - Если ошибка случится внутри мобильной оболочки, пользователь увидит аккуратный экран перезагрузки, а не белый экран Next.js.

3. `app/app/error.tsx`
   - Добавлен route-level fallback для `/app`.

Проверка:

```bash
node _syntax_check_local.js components/mini/mini-app-entry.tsx components/system/telegram-miniapp-viewport.tsx app/app/page.tsx app/app/error.tsx app/layout.tsx
# OK
```
