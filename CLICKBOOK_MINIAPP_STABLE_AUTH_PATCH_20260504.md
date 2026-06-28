# ClickBook miniapp/web notifications + theme/input fix — 2026-05-06

## Исправлено

- Убрана нестабильная ветка `document.startViewTransition` для Telegram WebView: переключение темы теперь CSS-driven, без client-side exception в WebView.
- Miniapp root получил `cb-mini-app-root` и CSS-переменные темы, чтобы input/search корректно наследовали тёмную и светлую темы.
- Поиск и поле сообщения больше не дают белую системную плашку в тёмной теме: добавлены `cb-mini-input`, `-webkit-text-fill-color`, autofill hardening и прозрачный background.
- Read-state событийных уведомлений miniapp сохраняется в `localStorage` и синхронизируется с badge в header.
- Список/страницы miniapp при переходе открываются сверху: scroll-area сбрасывается при смене tab/sub-route.
- В sheet записи добавлены действия: написать, позвонить, скопировать телефон, перенести.
- Быстрые ответы в чате заменены с bottom sheet на компактный popover-bubble, который раскрывается от кнопки-шаблона и закрывается по клику снаружи.
- Исправлена JSX-ошибка в bot-message bubble.
- На основном сайте read-state событий также сохраняется в `localStorage`.
- Web notification popover закрывается кликом в любое место вне панели.
- Badge количества уведомлений на сайте расширен до `99+` и больше не должен обрезаться.

## Изменённые файлы

- `components/mini/theme.tsx`
- `components/mini/mini-app-shell.tsx`
- `components/mini/primitives/atoms.tsx`
- `components/mini/screens/settings.tsx`
- `components/mini/screens/chats.tsx`
- `components/mini/screens/appointments.tsx`
- `components/mini/sheets/detail-sheets.tsx`
- `components/shared/workspace-shell.tsx`
- `app/globals.css`

## Проверка

Focused TS/TSX syntax check по изменённым файлам: OK.
