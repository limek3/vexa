# ClickBook Nexo-style menu — Variant 2

Что изменено:

- Пересобран desktop top-nav в `components/shared/workspace-shell.tsx`.
- Новый вариант шапки: не прошлый pill-only вариант, а более строгая glass-панель с центральным нав-блоком.
- Mega-menu переделан в формат product switchboard: верхний intro-блок, две смысловые колонки и отдельная правая колонка с фокусом/CTA.
- Элементы меню стали спокойнее: меньше визуального шума, мягкие карточки, аккуратные hover-состояния, без тяжелых внутренних квадратов.
- Сохранены текущие маршруты, demo/live-переключение, витрина, события, RU/EN и theme switch.
- Mobile shell не трогался.

Проверка:

- `components/shared/workspace-shell.tsx` успешно проверен через `typescript.transpileModule`.
- Полный `next build` не запускался: в архиве отсутствует `node_modules`.
