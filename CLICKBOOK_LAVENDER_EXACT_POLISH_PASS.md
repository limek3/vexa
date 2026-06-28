# ClickBook Lavender Exact Polish Pass

Что сделано:

- Sidebar приведён к структуре выбранного референса: Главная, Сегодня, Расписание, Клиенты, Записи, Услуги, Финансы, Витрина, Статистика, затем Инструменты.
- Уменьшена ширина sidebar до компактной референсной сетки.
- Убран лишний бот-блок в нижнем профиле sidebar — оставлен аккуратный user chip как в концепте.
- Пересобраны активные/hover состояния меню под lavender minimal: без старых тёплых/корпоративных стилей.
- Главная и Сегодня получили более плотную сетку: контент больше не центрируется с огромным левым пустым отступом.
- Обновлены токены: фон, карточки, бордеры, тени, lavender accent, muted panels.
- Усилены карточки, кнопки, icon boxes, progress, readiness ring, нижний совет-блок.
- Добавлены финальные CSS-overrides, чтобы старые dashboard-токены не перебивали новый visual layer.

Проверка:

- `components/shared/workspace-shell.tsx` — TSX transpile OK
- `components/workspace/master-ui.tsx` — TSX transpile OK
- `app/dashboard/page.tsx` — TSX transpile OK
- `app/dashboard/today/page.tsx` — TSX transpile OK

Полный `next build` не запускался: в архиве нет `node_modules`.
