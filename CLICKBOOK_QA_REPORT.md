# ClickBook real-data working pass

## Что исправлено

- Live-режим больше не подставляет мок-записи в рабочие экраны.
- Демо-режим остался отдельным: демо-данные продолжают работать только через `?demo=1` / `/demo/demo`.
- Публичная страница теперь получает из API: профиль, внешний вид, услуги, график/слоты и занятые слоты без персональных данных клиента.
- Форма записи теперь строит доступное время из графика мастера, длительности услуги и уже существующих записей.
- Серверный `/api/bookings` проверяет, что услуга существует, день/время есть в графике и слот не занят другой активной записью.
- При новой записи создаётся реальная запись в `sloty_bookings`, обновляется workspace, создаётся чат/сообщение клиента.
- Статистика, клиенты, день, услуги и аналитика в live считаются от реальных записей, без синтетических клиентов/визитов/выручки.
- Убрана автозапись fallback/mock-секций в live-workspace при простом открытии страницы.
- Исправлен compile-баг в `app/dashboard/chats/page.tsx` с повторным `const nextThreads`.
- Исправлен баг в `BookingForm` с дублированным параметром weekdayIndex и вынесена логика слотов в общий `lib/availability.ts`.

## Новые/изменённые файлы

- `lib/availability.ts`
- `components/booking/booking-form.tsx`
- `components/profile/public-master-page.tsx`
- `app/api/public/[slug]/route.ts`
- `app/api/bookings/route.ts`
- `app/api/profile/route.ts`
- `lib/master-workspace.ts`
- `hooks/use-workspace-section.ts`
- `app/dashboard/today/page.tsx`
- `app/dashboard/chats/page.tsx`
- `supabase/migrations/20260501_0009_clickbook_real_data_no_mocks.sql`
- `supabase/RUN_ALL_CLICKBOOK_SQL.sql`

## SQL

Добавлена миграция `20260501_0009_clickbook_real_data_no_mocks.sql`.

Главное:
- уникальный индекс на активный слот записи, чтобы не было двойной записи на одно время;
- индексы под записи и чаты;
- optional compatibility tables для услуг, графика и шаблонов, если дальше будем выносить JSON-секции из `sloty_workspaces.data` в отдельные таблицы.

## Проверка

- ZIP проверен через `unzip -t`.
- Полный `next build` здесь не запускался: в окружении нет `node_modules`, а установка зависимостей из сети недоступна.


## SQL fix v2

Дополнительно усилена миграция `20260501_0009_clickbook_real_data_no_mocks.sql`: для уже существующей старой таблицы `sloty_availability_days` теперь добавляются `weekday_index`, `status`, `slots` и переносится старый weekday из `day_index` / `day_of_week` / `weekday`, если такая колонка была в прежней схеме.
