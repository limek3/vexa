# Desktop popups: final neutral blur containment

## Цель

Исправить артефакты blur-слоя в desktop-приложении:

- левое меню не должно блюриться;
- Electron/titlebar и верхняя desktop-панель не должны блюриться;
- blur не должен давать зелёный оттенок от accent/demo controls;
- blur должен работать одинаково в dark/light theme;
- страница «Записи» должна использовать такой же page-only blur, как dashboard-попапы.

## Что изменено

### CSS

Файл: `app/desktop/desktop.css`

Добавлен финальный override-блок:

- отключает `filter: blur()` на `.sidebar`, `.topbar`, `.content` при открытых popup-слоях;
- запрещает full-screen overlay размывать весь viewport;
- переносит blur на отдельный contained backdrop ниже desktop topbar;
- убирает `saturate()` из blur, чтобы не появлялся зелёный/цветной tint;
- задаёт нейтральный dark/light backdrop:
  - dark: `rgba(8, 9, 11, 0.34)`;
  - light: `rgba(255, 255, 255, 0.42)`.

### Records page

Файл: `components/desktop-html-exact/pages/calendar.jsx`

Inline fallback у `Backdrop` переведён на нейтральный blur без saturation.

## Проверка

Проверен парсинг через `esbuild` для файлов:

- `components/desktop-html-exact/pages/calendar.jsx`
- `app/dashboard/availability/page.tsx`
- `app/dashboard/clients/page.tsx`
- `app/dashboard/services/page.tsx`
- `components/desktop-html-exact/desktop-html-app.jsx`
