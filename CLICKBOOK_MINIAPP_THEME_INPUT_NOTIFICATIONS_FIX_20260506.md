# CLICKBOOK MINIAPP UX / ACTION SHEETS POLISH — 2026-05-06

## Что сделано

### 1. Единая система bottom/action sheets
- Обновлён базовый `BottomSheet`:
  - единый header с title/subtitle/close;
  - blur overlay;
  - safe-area footer;
  - анимация появления;
  - единый scroll-контейнер внутри sheet.
- Добавлен новый `ActionSheet` primitive для подтверждений и быстрых действий.
- Убраны inline-confirm и `window.confirm` из miniapp-сценариев.

### 2. Haptic / feedback
- Добавлены helper-функции в `components/mini/bridge.tsx`:
  - `selectionHaptic()`;
  - `feedback()`;
  - расширенное использование `haptic()`.
- Haptic подключён к:
  - кнопкам;
  - toggles;
  - tabs/pills;
  - rows/list actions;
  - закрытию sheets;
  - отправке сообщений;
  - destructive actions.

### 3. Пустые состояния
- Добавлен общий `EmptyState` primitive.
- Заменены простые текстовые empty states на нормальные карточки с иконкой, заголовком, пояснением и action где нужно:
  - записи;
  - клиенты;
  - услуги;
  - шаблоны;
  - чаты;
  - сообщения;
  - финансы;
  - источники;
  - маркетинг;
  - отзывы.

### 4. Улучшение форм
- Добавлены primitives:
  - `SearchBox`;
  - `FormField`.
- Унифицированы поисковые поля клиентов и чатов.
- Улучшены формы внутри sheets:
  - редактирование услуги;
  - редактирование шаблона;
  - способы оплаты;
  - интеграции;
  - UTM builder;
  - ответ на отзыв;
  - вывод средств.

### 5. Микровзаимодействия и анимации
- Добавлены мягкие анимации:
  - появление bottom sheets;
  - появление toast;
  - появление сообщений в чате;
  - появление info panel.
- Добавлены transition для интерактивных элементов:
  - buttons;
  - pills;
  - list rows;
  - toggles;
  - bottom nav.

## Ключевые изменённые файлы

- `components/mini/bridge.tsx`
- `components/mini/primitives/atoms.tsx`
- `components/mini/sheets/detail-sheets.tsx`
- `components/mini/screens/appointments.tsx`
- `components/mini/screens/clients.tsx`
- `components/mini/screens/services.tsx`
- `components/mini/screens/templates.tsx`
- `components/mini/screens/more.tsx`
- `components/mini/screens/money.tsx`
- `components/mini/screens/chats.tsx`
- `components/mini/screens/schedule.tsx`
- `components/mini/mini-app-shell.tsx`

## Проверка

Focused TS/TSX syntax check по изменённым miniapp-файлам: OK.

Полный `tsc --noEmit` в распакованном архиве всё ещё не является корректным критерием, потому что в окружении архива нет `node_modules` и типы `next/react/node` не резолвятся, плюс в проекте есть старые unrelated TS errors вне изменённой miniapp-области.
