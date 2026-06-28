# Desktop navigation / hydration fix — 2026-05-18

## Исправлено

1. `hooks/use-workspace-section.ts`
   - Убран источник бесконечного ререндера в demo/localStorage режиме.
   - Первый render теперь детерминированный для SSR/client hydration.
   - `setState` больше не вызывается, если сериализованное значение не изменилось.

2. `app/desktop/_components/desktop-workspace.tsx`
   - Добавлен client-only boot layer для desktop workspace.
   - Основной desktop UI больше не пытается гидрироваться с данными, которые отличаются между сервером и клиентом.
   - Это убирает ошибку `Hydration failed because the server rendered text didn't match the client` на `Avatar`.
   - Для пунктов desktop-меню отключен prefetch, чтобы переходы в Electron были стабильнее.

3. `app/desktop/desktop.css`
   - Добавлен аккуратный загрузочный экран desktop-приложения.

## Почему страницы не открывались

Переходы по меню срабатывали, но React падал до завершения навигации из-за двух ошибок:

- hydration mismatch: сервер рендерил одни инициалы в Avatar, клиент сразу подставлял другие данные из demo/localStorage;
- maximum update depth: `useWorkspaceSection` в demo-режиме вызывал `setState` на каждом render, потому что получал новые `{}` / `[]` fallback-объекты.

После фикса меню должно открывать все desktop-разделы: Главная, Расписание, Клиенты, Чаты, Профиль, Услуги, График, Шаблоны, Уведомления, Интеграции, Аналитика, Отзывы, Тариф, Внешний вид, Настройки.
