# Calendar pickers outside click fix

Изменён файл:

- `app/dashboard/today/page.tsx`

Что исправлено:

- Кастомный выбор даты закрывается при клике вне календаря.
- Кастомный выбор времени закрывается при клике вне списка.
- Кастомный выбор услуги закрывается при клике вне dropdown.
- Все три popover также закрываются по `Escape`.
- Клик внутри самого popover не закрывает его случайно.

Реализация:

- Добавлен `useDismissOnOutsideClick` на `pointerdown` в capture-фазе.
- Хук подключён к `CustomDatePicker`, `CustomTimePicker`, `CustomServiceSelect`.
