# Desktop inner pages transfer — 2026-05-27

Исправление после уточнения: desktop-меню и desktop-shell оставлены как в проекте. Перенесена именно внутрянка выбранных страниц из `/dashboard` внутрь `/desktop`.

## Что сделано

- `components/desktop-html-exact/desktop-html-app.jsx` оставлен главным desktop-shell.
- Sidebar/topbar/командный центр/модалка новой записи desktop-приложения не заменялись на сайт.
- Для выбранных разделов `/desktop` теперь рендерятся реальные страницы из `/dashboard`, но без сайтавого `WorkspaceShell`.
- В `components/shared/workspace-shell.tsx` добавлен `WorkspaceShellEmbedProvider`, который отключает оболочку сайта при встраивании dashboard-страниц в desktop.
- Внутренние ссылки dashboard-страниц вида `/dashboard/...` перехватываются внутри desktop-shell и переводятся в соответствующие `/desktop/...`, чтобы не выкидывало из desktop-интерфейса.

## Карта переноса

- `/desktop/dashboard` → внутрянка `app/dashboard/page.tsx`
- `/desktop/schedule` → внутрянка `app/dashboard/today/page.tsx`
- `/desktop/clients` → внутрянка `app/dashboard/clients/page.tsx`
- `/desktop/availability` → внутрянка `app/dashboard/availability/page.tsx`
- `/desktop/analytics` → внутрянка `app/dashboard/stats/page.tsx`
- `/desktop/finance` → внутрянка `app/dashboard/finance/page.tsx`
- `/desktop/profile` → внутрянка `app/dashboard/profile/page.tsx`
- `/desktop/appearance` → внутрянка `app/dashboard/appearance/page.tsx`
- `/desktop/services` → внутрянка `app/dashboard/services/page.tsx`
- `/desktop/templates` → внутрянка `app/dashboard/templates/page.tsx`
- `/desktop/notifications` → внутрянка `app/dashboard/notifications/page.tsx`
- `/desktop/integrations` → внутрянка `app/dashboard/integrations/page.tsx`
- `/desktop/payments` → внутрянка `app/dashboard/payments/page.tsx`
- `/desktop/limits` → внутрянка `app/dashboard/limits/page.tsx`
- `/desktop/subscription` → внутрянка `app/dashboard/subscription/page.tsx`
- `/desktop/marketing` → внутрянка `app/dashboard/marketing/page.tsx`
- `/desktop/sources` → внутрянка `app/dashboard/sources/page.tsx`
- `/desktop/reviews` → внутрянка `app/dashboard/reviews/page.tsx`

## Что НЕ трогалось

- Desktop layout: `app/desktop/layout.tsx`
- Desktop entry: `app/desktop/_components/desktop-entry.tsx`
- Desktop shell: `components/desktop-html-exact/desktop-html-app.jsx` оставлен как оболочка, поменян только `renderPage` для нужных разделов.
- Desktop menu/sidebar/topbar не заменялись на меню сайта.
- `/dashboard` роуты сайта остаются рабочими отдельно.

## Алиасы

Добавлены/оставлены алиасы:

- `/desktop/today` → `/desktop/schedule`
- `/desktop/bookings` → `/desktop/schedule`
- `/desktop/stats` → `/desktop/analytics`
- `/desktop/master-profile` → `/desktop/profile`
- `/desktop/design` → `/desktop/appearance`

## Проверить после распаковки

```bash
npm install
npm run dev
```

Открыть:

```txt
/desktop/dashboard
/desktop/schedule
/desktop/clients
/desktop/availability
/desktop/analytics
/desktop/finance
/desktop/profile
/desktop/appearance
/desktop/settings
```

Важно: `/desktop/settings` в исходном проекте не имеет прямого аналога `app/dashboard/settings/page.tsx`, поэтому корневой экран настроек оставлен desktop-модулем. Все реальные настройки, которые есть на сайте отдельными страницами, перенесены отдельными `/desktop/...` роутами.
