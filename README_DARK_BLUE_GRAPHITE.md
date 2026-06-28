# Desktop dark Blue Graphite patch

Распаковать архив в корень проекта с заменой файлов.

Изменено:
- `app/desktop/desktop.css` — финальная dark-only палитра `/desktop`: Electron/app shell, sidebar, page, sections, cards, inner blocks, hover/active, embedded dashboard colors.
- `app/globals.css` — тёмный Electron titlebar/dropdowns/controls под тот же сине-графитовый слой.

Палитра dark:
- shell/electron: `#0b1520`
- sidebar: `#0f1d2b → #122436`
- page: `#142130`
- sections: `#182838`
- cards: `#1d3042`
- inner/soft cards: `#22374a`
- hover: `#263d52`
- border: `rgba(160, 177, 198, 0.13)`
- text: `#edf3f8 / #a8b4c2 / #758394`
- accent: from selected color in “Внешний вид”, fallback `#8b5cf6`.
