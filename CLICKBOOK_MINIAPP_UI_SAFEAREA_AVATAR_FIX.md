# ClickBook Mini App UI Safe Area + Avatar Fix

Изменения внесены в реальный код проекта.

## Что изменено

- `components/mini/mini-app-shell.tsx`
  - верхняя плашка вынесена в премиальную inset-карточку внутри safe-area;
  - нижняя навигация стала inset-плашкой и больше не уезжает под нижний край;
  - увеличен Telegram top offset для WebApp, чтобы шапка не попадала под системную/Telegram-панель;
  - аватар в шапке теперь берётся из `MASTER.avatar`;
  - добавлен fallback на букву `К`, если аватар отсутствует или не загрузился.

- `lib/mini-demo.ts` и `lib/mini-adapter.ts`
  - в `MasterInfo` добавлено поле `avatar`;
  - `adaptMaster()` прокидывает `profile.avatar` из профиля мастера в miniapp.

- `components/mini/primitives/atoms.tsx`
  - компонент `Avatar` теперь поддерживает картинку через `avatar`.

- `components/mini/screens/settings.tsx` и `components/mini/screens/more.tsx`
  - аватар профиля отображается в miniapp-профиле и в разделе «Ещё».

## Важно

Из итогового архива убран вложенный `главная.zip`, который в Windows отображался как `#U0433#U043b...zip`. Это был лишний вложенный архив из исходника, не часть рабочего проекта.
