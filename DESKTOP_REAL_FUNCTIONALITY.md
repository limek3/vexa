# ClickBook Desktop — real functionality adaptation

Что сделано:

- Desktop-ветка `/desktop/*` больше не просто статичная картинка.
- Данные берутся из текущего рабочего места через `useOwnedWorkspaceData`, `useApp`, `useWorkspaceSection`.
- Для теста без авторизации Electron открывает `/desktop/dashboard?demo=1`.
- Для реального кабинета без demo добавлены команды:
  - `npm run desktop:dev:auth`
  - `npm run desktop:live`

Добавленные desktop-страницы:

- `/desktop/dashboard`
- `/desktop/schedule`
- `/desktop/clients`
- `/desktop/chats`
- `/desktop/profile`
- `/desktop/services`
- `/desktop/availability`
- `/desktop/templates`
- `/desktop/notifications`
- `/desktop/integrations`
- `/desktop/analytics`
- `/desktop/reviews`
- `/desktop/subscription`
- `/desktop/appearance`
- `/desktop/settings`

Что работает:

- создание / перенос / отмена / завершение записи;
- сохранение записей в `workspaceData.bookings` / demo localStorage;
- клиенты строятся из реальных записей + вручную добавленные контакты;
- заметки и избранное клиентов сохраняются;
- чатовые моки сохраняются в `workspaceData.chats` / demo localStorage;
- отправка сообщений и создание записи из чата;
- каталог услуг редактируется и сохраняется;
- график работы редактируется и сохраняется;
- шаблоны сообщений редактируются и сохраняются;
- уведомления, тихие часы и резервная почта переключаются;
- профиль мастера сохраняется через существующий `saveProfile`;
- отзывы сохраняются в профиль;
- аналитика, тарифы, платежи берутся из `WorkspaceDataset`, если он есть;
- внешний вид, акцент и плотность остаются в desktop-меню.

Важно:

- Основной сайт `/dashboard/*` не заменялся.
- Desktop получил отдельный shell и внешний вид.
- В demo-режиме данные сохраняются локально, без авторизации.
- В auth/live-режиме данные идут через существующую инфраструктуру приложения.
