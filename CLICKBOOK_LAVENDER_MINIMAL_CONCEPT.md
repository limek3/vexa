# ClickBook Lavender Minimal Concept

Выбранное направление: светлый минималистичный кабинет мастера с мягким lavender / ice-blue акцентом.

## Что изменено

- `components/workspace/master-ui.tsx` — пересобран слой UI-примитивов под мягкий минимализм: карточки, кнопки, бейджи, progress, timeline, empty-state.
- `components/shared/workspace-shell.tsx` — sidebar упрощён: без поиска и переключателей режимов вверху, уже по ширине, с nav-группами, карточкой публичной страницы и аккуратным footer account card.
- `app/dashboard/page.tsx` — главная страница пересобрана под выбранный концепт: greeting header, KPI cards, lavender next appointment card, popular services, recent clients, storefront readiness, advice banner.
- `app/dashboard/today/page.tsx` — расписание пересобрано под выбранный концепт: header, week strip, highlighted next booking, appointment feed, workload ring, reminders, tasks, quick actions.
- `app/globals.css` — добавлены новые токены дизайн-системы: ivory background, white glass cards, deep navy text, lavender accent, dark theme variables.

## Дальше по миграции

Следующими нужно переводить на этот же слой:

1. `/dashboard/clients`
2. `/dashboard/services`
3. `/dashboard/chats`
4. `/dashboard/availability`
5. `/dashboard/profile`
6. `/m/[slug]`
7. Mini App

Не менять стиль точечно. Все новые страницы должны использовать `components/workspace/master-ui.tsx` и токены `--cb-master-*`.
