# ClickBook Miniapp — stabilization and real-data pass (2026-05-06)

## Scope
Доработана текущая miniapp без редизайна с нуля: сохранён существующий визуальный язык, исправлены реальные UX/логические баги, экраны привязаны к данным workspace/bookings/profile/chats там, где раньше были заглушки или несовместимые структуры.

## Key changes

### Real data adapter
- `lib/mini-adapter.ts` теперь корректно собирает данные для miniapp из `workspaceData`, `ownedProfile`, `bookings` и billing.
- Услуги читаются из `workspaceData.services`, а не только из `profile.services`.
- Записи получают реальные дату, статус, сумму, длительность, источник и человекочитаемый статус.
- Клиенты собираются из реальных бронирований.
- График и шаблоны понимают как старый JSON-формат, так и формат, который синхронизируется в нормализованные Supabase-таблицы.

### Screens
- `HomeScreen`: убраны захардкоженные даты/суммы; карточки и метрики считаются из реальных записей, услуг, клиентов и чатов.
- `AppointmentsScreen`: переключение дней работает от текущей даты, список фильтруется по выбранному дню, статусы обновляются с реальным error handling.
- `ServicesScreen`: добавление/редактирование/скрытие услуг сохраняет цену, длительность, статус, видимость и id.
- `ScheduleScreen`: сохранение графика теперь отправляет `weekdayIndex`, `slots`, `status`, `enabled`, `startTime`, `endTime` — это совместимо с серверной синхронизацией.
- `TemplatesScreen`: сохранение шаблонов теперь отправляет `title/content/variables/enabled`, совместимо с серверной синхронизацией.
- `MoreScreen`: счётчики чатов/шаблонов/подписки подтягиваются из реальных данных.
- `AnalyticsScreen`: метрики строятся из реальных записей, клиентов и услуг.
- `FinanceScreen`: баланс и операции строятся из завершённых записей.
- `SourcesScreen`: источники строятся по реальным записям за 30 дней.
- `ReviewsScreen`: отзывы берутся из профиля мастера, вместо статичного демо-списка.
- `ProfileScreen`: сохранение профиля теперь идёт через основной `saveProfile`/`/api/profile`, а не в отдельную workspace-секцию.

### Runtime/auth fixes
- `hooks/use-chats.ts` теперь отправляет Supabase bearer и Telegram app-session headers, а при 401 пытается восстановить Telegram miniapp-сессию.
- `lib/app-context.tsx:updateBookingStatus` больше не показывает ложный успех: при ошибке API откатывается через `refreshWorkspace()` и пробрасывает ошибку в UI.
- Навигация `home → appointments/services` больше не попадает в `Coming soon`, а переключает реальные вкладки.

## Validation
- Выполнена focused TS/TSX transpile syntax check по изменённым файлам — синтаксических ошибок не найдено.
- Полный `tsc --noEmit` в текущем архиве не является показательным без установленных `node_modules`: отсутствуют типы `next`, `react`, `@types/node` и т.д. Также в проекте уже есть сторонние/pre-existing TypeScript warnings в API-роутах, не относящиеся к miniapp-pass.

## Main touched files
- `lib/mini-adapter.ts`
- `lib/mini-demo.ts`
- `lib/app-context.tsx`
- `hooks/use-mini-data.ts`
- `hooks/use-chats.ts`
- `components/mini/mini-app-shell.tsx`
- `components/mini/screens/home.tsx`
- `components/mini/screens/appointments.tsx`
- `components/mini/screens/services.tsx`
- `components/mini/screens/schedule.tsx`
- `components/mini/screens/templates.tsx`
- `components/mini/screens/more.tsx`
- `components/mini/screens/analytics.tsx`
- `components/mini/screens/money.tsx`
- `components/mini/screens/settings.tsx`
- `components/mini/sheets/detail-sheets.tsx`
