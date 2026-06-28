# ClickBook Workspace Menu Polish Pass

Основа: `clickbook-landing-menu-workspace-wide-pass.zip`.

Что изменено:

- доработано верхнее меню рабочего кабинета в стиле лендинга / Nexo;
- меню больше не закрывается мгновенно при движении мыши между пунктом и mega-panel;
- добавлен hover-delay и невидимый bridge между верхней панелью и выпадающим меню;
- улучшены размеры, радиусы, тени, hover/focus-состояния и визуальная плотность dropdown-panel;
- добавлены красивые переключатели языка и темы в правую часть верхнего меню;
- контент страниц опущен ниже, чтобы fixed header не наезжал на заголовки;
- ширина меню и контента синхронизирована через `--cb-shell-width: 1520px`.

Изменённые файлы:

- `components/shared/workspace-shell.tsx`
- `app/globals.css`

Проверка:

- `components/shared/workspace-shell.tsx` проверен через TypeScript `transpileModule`.
