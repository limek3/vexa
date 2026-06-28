# ClickBook Miniapp v9 input fix HARD / white-kill

База: `clickbook-miniapp-v9-input-fix` из `v8 chat reschedule near quick`.

Цель: максимально убрать белые нативные полоски, заливки и chrome-фоны в тёмной miniapp-теме, не меняя бизнес-логику и не откатывая smooth sheets / chat glow / перенос рядом с молнией / read notifications.

## Что усилено

1. `app/globals.css`
   - Добавлен финальный слой `ClickBook miniapp v9 input fix HARD: native-white extermination`.
   - Принудительный dark `color-scheme` для miniapp/root/body в Telegram WebView.
   - Жёсткий анти-white слой для `input`, `textarea`, `select`, `[contenteditable]`, `[role=textbox]`.
   - Отдельные состояния `focus`, `active`, `autofill`, `hover`.
   - Скрыты/обнулены WebKit search/clear/spin/calendar controls.
   - Скрыты miniapp scrollbars и прозрачны track/thumb/corner.
   - Прописаны тёмные `option/optgroup` для select.

2. `components/system/telegram-miniapp-viewport.tsx`
   - На старте выставляется `html[data-tg-miniapp=true]`.
   - Принудительно задаются тёмные `html/body` background и `colorScheme`.
   - Обновляется `<meta name="theme-color">`.
   - В Telegram WebApp вызываются `setHeaderColor`, `setBackgroundColor`, `setBottomBarColor` с `#0a0a0a`, если методы доступны.

3. `components/mini/theme.tsx`
   - При смене miniapp темы синхронизируется системный chrome Telegram/WebView.
   - `html/body`, `theme-color`, `setHeaderColor`, `setBackgroundColor`, `setBottomBarColor` получают актуальный фон темы.

4. `app/miniapp/page.tsx`
   - Добавлен `TelegramMiniAppViewport` и первый paint стартует в dark, чтобы Telegram/WebView не показывал белый chrome до инициализации.

5. `components/mini/mini-app-entry.tsx`
   - Старый miniapp entry явно получает `data-mini-theme="dark"` и `data-mini-mode="dark"`, чтобы hard CSS применялся без угадывания.

## Проверка

- `postcss.parse(app/globals.css)` — OK.
- `node _syntax_check_local.js` по изменённым TSX-файлам — OK.
- Полный build не запускался: зависимости (`node_modules`) в архив не входят.
