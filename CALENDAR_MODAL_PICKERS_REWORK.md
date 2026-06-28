# Calendar modal pickers rework

Изменён файл `app/dashboard/today/page.tsx`.

Что сделано:

- заменён нативный `input[type=date]` на кастомный календарь в стиле тёмного popover из чатов;
- заменён нативный `input[type=time]` на кастомный выпадающий список времени;
- заменён нативный `select` услуг на кастомный service dropdown;
- все выбранные элементы используют текущий accent color из настроек;
- модалка создания записи больше не режет popover-элементы (`overflow-visible`);
- кнопка создания записи тоже подтягивает accent color;
- сохранена текущая логика создания записи через `createBooking`.
