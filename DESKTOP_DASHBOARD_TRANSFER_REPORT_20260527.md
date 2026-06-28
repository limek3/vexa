# Desktop transfer pass — 2026-05-27

Что сделано:

- `/desktop` оставлен отдельной desktop-зоной, без копирования `WorkspaceShell` из `/dashboard`.
- Главное desktop-меню собрано под нужные разделы:
  - Главная
  - Записи
  - Клиенты
  - Доступность
  - Аналитика
  - Финансы
  - Профиль мастера
  - Внешний вид
  - Все настройки
  - настройки-спутники: уведомления, интеграции, платежи, лимиты, подписка, аккаунт, помощь
- Заглушки `ModulePage` заменены на полноценные desktop-страницы для:
  - `availability`
  - `finance`
  - `profile`
  - `settings`
- Добавлены алиасы роутов:
  - `/desktop/today` → `/desktop/schedule`
  - `/desktop/bookings` → `/desktop/schedule`
  - `/desktop/stats` → `/desktop/analytics`
  - `/desktop/master-profile` → `/desktop/profile`
  - `/desktop/design` → `/desktop/appearance`
- `useDesktopPlatform` расширен общими действиями:
  - `saveAvailability(days)` — сохраняет график локально и, если есть live workspace, в `workspaceData.availability` через `/api/workspace/section`.
  - `saveMaster(draft)` — сохраняет профиль локально и, если есть live workspace, через общий `app.saveProfile`.
  - `availabilityDays` — общий источник графика для desktop.

Проверка:

- JSX-синтаксис изменённых desktop-файлов проверен через TypeScript parser:
  `tsc --allowJs --checkJs false --jsx react --module esnext --target es2020 --noEmit --skipLibCheck ...`
- Полный `next build` не запускался, потому что в архиве нет `node_modules`.

Ключевые файлы:

- `components/desktop-html-exact/desktop-html-app.jsx`
- `components/desktop-html-exact/desktop-platform.jsx`
- `components/desktop-html-exact/pages/availability.jsx`
- `components/desktop-html-exact/pages/finance.jsx`
- `components/desktop-html-exact/pages/profile.jsx`
- `components/desktop-html-exact/pages/settings.jsx`
- `app/desktop/today/page.tsx`
- `app/desktop/bookings/page.tsx`
- `app/desktop/stats/page.tsx`
- `app/desktop/master-profile/page.tsx`
- `app/desktop/design/page.tsx`
