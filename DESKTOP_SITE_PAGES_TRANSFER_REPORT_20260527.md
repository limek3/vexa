# Desktop transfer: dashboard pages rendered inside `/desktop`

Дата: 2026-05-27

## Что изменено

Теперь выбранные desktop-роуты не используют старые desktop-заглушки/прототипные страницы из `components/desktop-html-exact`, а рендерят реальные страницы сайта из `app/dashboard`.

## Основной маппинг

| Desktop route | Источник с сайта |
|---|---|
| `/desktop/dashboard` | `app/dashboard/page.tsx` |
| `/desktop/schedule` | `app/dashboard/today/page.tsx` |
| `/desktop/clients` | `app/dashboard/clients/page.tsx` |
| `/desktop/availability` | `app/dashboard/availability/page.tsx` |
| `/desktop/analytics` | `app/dashboard/stats/page.tsx` |
| `/desktop/finance` | `app/dashboard/finance/page.tsx` |
| `/desktop/profile` | `app/dashboard/profile/page.tsx` |
| `/desktop/appearance` | `app/dashboard/appearance/page.tsx` |
| `/desktop/settings` | новый индекс настроек, ведущий на перенесённые dashboard-настройки |

## Дополнительно перенесены настройки

| Desktop route | Источник с сайта |
|---|---|
| `/desktop/notifications` | `app/dashboard/notifications/page.tsx` |
| `/desktop/integrations` | `app/dashboard/integrations/page.tsx` |
| `/desktop/payments` | `app/dashboard/payments/page.tsx` |
| `/desktop/limits` | `app/dashboard/limits/page.tsx` |
| `/desktop/subscription` | `app/dashboard/subscription/page.tsx` |
| `/desktop/marketing` | `app/dashboard/marketing/page.tsx` |
| `/desktop/sources` | `app/dashboard/sources/page.tsx` |
| `/desktop/templates` | `app/dashboard/templates/page.tsx` |
| `/desktop/services` | `app/dashboard/services/page.tsx` |

## Алиасы

- `/desktop/today` → `/desktop/schedule`
- `/desktop/bookings` → `/desktop/schedule`
- `/desktop/calendar` → `/desktop/schedule`
- `/desktop/stats` → `/desktop/analytics`
- `/desktop/master-profile` → `/desktop/profile`
- `/desktop/design` → `/desktop/appearance`
- `/desktop/account` → `/desktop/settings`

## Важные правки

1. `components/shared/workspace-shell.tsx`
   - добавлен desktop-aware routing;
   - если `WorkspaceShell` открыт внутри `/desktop`, dashboard-ссылки маппятся на desktop-ссылки;
   - `/dashboard/today` маппится на `/desktop/schedule`;
   - `/dashboard/stats` маппится на `/desktop/analytics`;
   - demo-параметр сохраняется и для desktop-роутов;
   - в навигацию добавлены финансы и desktop settings.

2. `hooks/use-workspace-href.ts`
   - новый hook для внутренних ссылок страниц;
   - нужен, чтобы кнопки внутри перенесённых страниц не уводили обратно на `/dashboard`.

3. `app/desktop/desktop.css`
   - снят глобальный `overflow: hidden` с `html/body` в desktop-режиме, иначе перенесённые dashboard-страницы не могли нормально скроллиться.

## Проверка

Проверены изменённые TS/TSX/JSX-файлы через `typescript.transpileModule`: синтаксических ошибок в изменённых файлах не найдено.

Полный `next build` не запускался, потому что в архиве нет `node_modules`.
