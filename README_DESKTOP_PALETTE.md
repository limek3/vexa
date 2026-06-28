# Desktop palette patch

Распаковать архив в корень проекта с заменой файлов.

Изменено:
- `app/desktop/desktop.css` — основная палитра `/desktop`, light/dark tokens, sidebar/page/card/input/nav/accent.
- `app/globals.css` — Electron titlebar/dropdown/input overrides под ту же палитру.
- `components/desktop-html-exact/desktop-html-app.jsx` — inline-палитра для body/root и input, которые ставятся через JS с `!important`.
- `components/desktop-html-exact/pages/appearance.jsx` — превью темы во вкладке «Внешний вид».

Палитра:
- Light: shell/menu `#E6EDF5`, page `#F7FAFD`, blocks `#EEF3F8`, accent `#7B61FF`, text `#17212B`.
- Dark: electron `#101820`, shell soft `#121D27`, sidebar `#111B24`, active menu `#1B2B3A`, page `#18191B`, page soft `#1B1C1F`, card `#222326`, hover `#26282C`, inner `#2A2C31`, border `#313640`, text `#EEF2F6`, muted `#A7B0BC`, soft `#727D8A`, accent `#8B6CFF`, accent hover `#9A80FF`.
