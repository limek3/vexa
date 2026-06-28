# ClickBook Telegram Mini App hang fix — 2026-05-04

Исправлено зависание Mini App на экране «Входим через Telegram».

## Что было

Telegram Mini App успешно отправлял запрос на `/api/auth/telegram-miniapp`, webhook работал, но фронт мог зависать на gate-экране из-за гонки:

- глобальный `TelegramMiniAppAutoAuth` запускался одновременно с отдельным gate на `/app`;
- `AppProvider` параллельно пытался грузить `/api/workspace` прямо на странице входа Mini App;
- после установки cookie первый запрос в Telegram WebView иногда ещё не видел session cookie;
- UI не имел нормального жёсткого fallback, поэтому визуально оставался на спиннере.

## Что сделано

- На маршруте `/app` отключён глобальный `TelegramMiniAppAutoAuth`, потому что входом занимается `TelegramMiniAppGate`.
- `AppProvider` больше не грузит workspace на `/app`, чтобы не создавать лишние гонки авторизации.
- `TelegramMiniAppGate` теперь работает как отдельный state-machine:
  1. ждёт Telegram initData;
  2. создаёт app-session через `/api/auth/telegram-miniapp`;
  3. проверяет `/api/workspace` с `X-ClickBook-App-Session`;
  4. если профиль есть — открывает `/dashboard`;
  5. если профиля нет — открывает `/create-profile`;
  6. если Telegram WebView долго не отдаёт cookie — всё равно даёт кнопку «Открыть кабинет», а не висит бесконечно.
- Добавлен hard-timeout, чтобы экран не мог зависнуть навсегда.

## Файлы

- `components/auth/telegram-miniapp-gate.tsx`
- `components/auth/telegram-miniapp-auto-auth.tsx`
- `lib/app-context.tsx`

SQL запускать не нужно.
