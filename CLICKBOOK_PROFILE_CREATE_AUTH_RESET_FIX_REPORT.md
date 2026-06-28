# ClickBook UI QA pass

Что исправлено в этой сборке:

- Убраны чисто-чёрные провалы в dark theme: body, workspace shell, main, page, drawer, mobile/header surfaces теперь держатся в палитре `#080808` / `#101010`, а внутренние панели — через мягкий `rgba(255,255,255,.035)`.
- Перебиты конфликтующие поздние CSS-правки, которые возвращали `#000000` в карточки, строки, инпуты и внутренние панели.
- Приведены карточки, внутренние поверхности, поля ввода и селекты к единой системе: `rounded-[11px]` для карточек, `rounded-[10px]` для вложенных блоков, `rounded-[9px]` для controls.
- Исправлена страница `/dashboard/profile`: удалён дублирующийся `contactCount`, из-за которого страница могла не собираться.
- Исправлена страница `/dashboard/templates`: удалена лишняя закрывающая скобка в английском preset `Appointment reminder`.
- В форме профиля скрыт блок readiness/метрик, когда страница профиля передаёт `showOverviewCards={false}` — профиль стал ближе к строгому референсу без лишних KPI-блоков.
- Подправлен верхний workspace header/dropdown: тёмная тема больше не уходит в чистый чёрный.
- Обновлён `themeColor` для тёмной темы в `app/layout.tsx` на `#080808`.

Ключевые файлы:

- `app/globals.css`
- `app/layout.tsx`
- `components/shared/workspace-shell.tsx`
- `app/dashboard/profile/page.tsx`
- `app/dashboard/templates/page.tsx`
- `components/profile/master-profile-form.tsx`
