# ClickBook Mini App — zero rework 2026-05-04

Сделана новая мобильная mini app-обёртка с нуля внутри существующего проекта.

## Главные изменения

- Полностью переписан `components/mini/mini-app-entry.tsx`.
- Mini app больше не пытается быть копией desktop-кабинета: собраны отдельные мобильные экраны.
- Основная навигация: `Сегодня`, `График`, `Услуги`, `Чаты`, `Ещё`.
- Вторичные разделы убраны в `Ещё`: клиенты, аналитика, профиль, настройки.
- Исправлен `components/system/telegram-miniapp-viewport.tsx`: теперь это реальный viewport-компонент, а не битый файл, из-за которого падал build на `_not-found`.
- В `/app` добавлен режим предпросмотра mini app через `/app?mini=1`.

## Что подтягивается

- Профиль мастера из workspace.
- Записи и статусы записей.
- Услуги из `workspace.data.services`.
- График из `workspace.data.availability`.
- Чаты через `/api/chats`.
- Клиенты и аналитика через `buildWorkspaceDatasetFromStored`.
- Настройки mini app в `workspace.data.miniSettings`.

## Что сохраняется

- Статусы записей через `updateBookingStatus`.
- График через `updateWorkspaceSection('availability', ...)`.
- Услуги через `updateWorkspaceSection('services', ...)` + обновление `profile.services`.
- Профиль через `saveProfile`.
- VIP/заметки клиента через `clientFavorites` и `clientNotes`.
- Настройки через `quietHours`, `fallbackEmail`, `miniSettings`.

## Проверка синтаксиса

```bash
node _syntax_check_local.js components/mini/mini-app-entry.tsx components/system/telegram-miniapp-viewport.tsx app/app/page.tsx app/layout.tsx
# OK
```

Полный `pnpm build` в контейнере не запускался, потому что здесь не установлен `pnpm` и нет `node_modules`.
