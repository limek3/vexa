# ClickBook — final real booking repair

Дата: 2026-05-01

## Что было исправлено

### 1. Неправильные слоты на публичной странице

Причина: публичная страница могла брать старые строки из нормализованных таблиц Supabase или seed-график, хотя актуальный график уже лежал в `sloty_workspaces.data.availability`.

Исправлено:
- `app/api/public/[slug]/route.ts` теперь считает JSON-график рабочего кабинета главным источником.
- `app/api/bookings/route.ts` проверяет слот по той же логике, что и публичная форма.
- `lib/availability.ts` теперь понимает, что выбранные в календаре часовые ячейки — это конкретные старты записи, а не длинное окно для генерации лишних времен.

### 2. Запись создана, но не видна в кабинете

Причина: запись могла создаваться в нормализованной таблице или только в JSON fallback, а `/api/workspace` не всегда объединял оба источника.

Исправлено:
- `/api/bookings` после создания всегда сохраняет запись в `workspace.data.bookings`.
- `/api/workspace` возвращает объединение `sloty_bookings` + `workspace.data.bookings`.
- PATCH статуса записи также обновляет JSON fallback.

### 3. Клиенты не подтягивались

Причина: клиентская база строится из списка записей. Если запись не попадала в `/api/workspace`, клиенты оставались пустыми.

Исправлено через объединение записей в `/api/workspace`.

### 4. Чаты не загружались

Причина: нормализованные чат-таблицы могли быть пустыми/недоступными, а страница показывала ошибку.

Исправлено:
- `/api/chats` теперь строит fallback-диалоги из реальных записей, если чат-таблицы пустые или вернули ошибку.
- В `supabase-chats.ts` исправлена PostgREST-фильтрация сообщений по thread_id.
- Страница чатов отправляет `X-ClickBook-App-Session`, чтобы Telegram-сессия не терялась.

### 5. Кнопка Telegram «Открыть записи» зависала

Причина: `/app` всегда открывал `/dashboard`, а при пустом/зависшем initData не было нормального fallback на сохраненный app-session token.

Исправлено:
- `/app` принимает `redirectTo`, например `/app?redirectTo=/dashboard/today`.
- Telegram bot теперь открывает «Открыть записи» сразу на `/dashboard/today`.
- `TelegramMiniAppGate` умеет открывать кабинет по сохраненному `X-ClickBook-App-Session`, даже если Telegram initData не пришла вовремя.
- Добавлен timeout для `/api/auth/telegram-miniapp`, чтобы экран входа не висел бесконечно.

## Файлы с ключевыми правками

- `lib/availability.ts`
- `app/api/public/[slug]/route.ts`
- `app/api/bookings/route.ts`
- `app/api/workspace/route.ts`
- `app/api/chats/route.ts`
- `lib/server/supabase-chats.ts`
- `components/auth/telegram-miniapp-gate.tsx`
- `lib/telegram-miniapp-auth-client.ts`
- `app/app/page.tsx`
- `lib/server/telegram-bot.ts`
- `hooks/use-workspace-section.ts`
- `app/dashboard/chats/page.tsx`

## SQL

Новый SQL не требуется, если уже выполнены миграции `0009` и `0010` из прошлых архивов. Текущий фикс работает через устойчивый JSON fallback и нормализованные таблицы одновременно.
