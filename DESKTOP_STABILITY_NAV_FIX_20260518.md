# Desktop stability + navigation fix — 2026-05-18

Исправлено:

1. Desktop routes больше не SSR-рендерят огромный рабочий кабинет.
   - Добавлен `app/desktop/_components/desktop-entry.tsx`.
   - Все страницы `/desktop/*` теперь грузят рабочий кабинет через `next/dynamic` с `ssr: false`.
   - Это убирает hydration mismatch между серверной HTML-разметкой и клиентским состоянием Electron/localStorage/theme.

2. Desktop больше не использует общий `useWorkspaceSection` для своих мок/рабочих секций.
   - В `desktop-workspace.tsx` добавлен локальный `useDesktopSection`.
   - Он хранит desktop-секции в `localStorage` и не вызывает `updateWorkspaceSection` на каждом рендере.
   - Это убирает `Maximum update depth exceeded`.

3. Навигация в меню остаётся обычной Next-навигацией, но теперь React не падает до перехода.
   - Пункты меню `/desktop/schedule`, `/desktop/clients`, `/desktop/chats`, `/desktop/services`, `/desktop/settings` должны открываться стабильно.

Проверять после замены архива:

```bash
npm install
npm run desktop:dev
```

Если dev-сервер был уже запущен, лучше остановить его и удалить `.next`, чтобы Turbopack не держал старый клиентский чанк.
