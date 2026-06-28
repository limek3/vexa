# Desktop accent + bottom tooltips patch

Заменить файлы в корне проекта:

- app/desktop/desktop.css
- lib/appearance.ts

Что исправлено:
- /desktop chrome/topbar/sidebar используют выбранный accent из "Внешний вид".
- Активное меню, кнопка "Новая запись", Демо/Рабочий, бейджи, фокус и индикаторы теперь берут цвет из --accent-solid.
- Выбранные accent-цвета больше не сбрасываются в violet/lime после перезагрузки.
- data-tip подсказки открываются снизу от элемента, а не сверху.
