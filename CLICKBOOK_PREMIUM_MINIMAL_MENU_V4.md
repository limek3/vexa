# ClickBook premium minimal menu v4

Изменено:
- desktop header сделан премиальнее и спокойнее: без цветных glow, без лишних декоративных пятен;
- mega-menu теперь один постоянный panel: при наведении на соседний пункт он не закрывается и не открывается заново, а меняет наполнение внутри текущего контейнера;
- высота mega-menu меняется через layout-анимацию и разные min-height для разделов;
- затемняющий backdrop убран: клик вне меню закрывает его, но страница больше не темнеет;
- страницы на desktop опущены ниже через .cb-workspace-main padding-top, чтобы фиксированное меню не резало верхний контент;
- с hero-картинки на главной убрана видимая подпись/бейдж.

Проверено:
- components/shared/workspace-shell.tsx через TypeScript transpile;
- app/dashboard/page.tsx через TypeScript transpile.

Полный next build не запускался: в архиве нет node_modules.
