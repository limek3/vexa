# Sloty real data mode (Supabase)

Что уже подключено:
- `AppProvider` больше не использует `localStorage` как основное хранилище кабинета.
- Рабочие данные идут через API-роуты:
  - `GET /api/workspace`
  - `PATCH /api/workspace/section`
  - `POST /api/profile`
  - `POST /api/bookings`
  - `GET /api/public/[slug]`
  - `PATCH /api/appearance`
- Демо осталось отдельным маршрутом `/demo/[slug]`.

Что нужно сделать в Supabase:
1. Выполнить миграцию:
   - `supabase/migrations/20260407_0002_sloty_workspaces.sql`
2. Заполнить `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

Что хранится в базе:
- профиль мастера
- slug публичной страницы
- bookings
- services
- availability
- templates
- notifications
- chats
- appearance

Примечание:
- для production лучше вынести бизнес-сущности в отдельные таблицы (`clients`, `chat_threads`, `chat_messages`, `services`, `bookings` и т.д.).
- текущая интеграция сделана как быстрый рабочий переход с моков на реальное серверное хранилище без слома текущего UI.
