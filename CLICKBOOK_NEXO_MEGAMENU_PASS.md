# ClickBook Nexo-style mega menu pass

Основа: `clickbook-demo-slug-main-copy-fix.zip`.

Изменено:

- `components/shared/workspace-shell.tsx`

Что сделано:

1. Убран desktop left sidebar из workspace shell.
2. Добавлен верхний desktop header в стиле Nexo: логотип слева, горизонтальные разделы по центру, действия справа.
3. Добавлено большое mega-menu вместо левого меню.
4. Разбивка меню адаптирована под КликБук:
   - Для мастера
   - Запись
   - Клиенты
   - Управление
5. В каждом разделе есть:
   - intro-column с описанием и CTA;
   - две колонки навигации;
   - два больших promo-card блока снизу;
   - hover/focus/open states;
   - мягкие transition-анимации, scale/translate/opacity.
6. Сохранены все существующие маршруты и demo-параметр.
7. Mobile navigation оставлена прежней, чтобы не ломать адаптив.
8. Desktop контент больше не получает `xl:pl-[var(--sidebar-width)]`, потому что sidebar убран.

Проверка:

- `typescript.transpileModule` для `components/shared/workspace-shell.tsx` проходит без синтаксических ошибок.

Полный `next build` не запускался: в архиве нет установленных `node_modules`.
