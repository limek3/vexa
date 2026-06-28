# ClickBook Mini App — Redesign V2

Переделана мобильная mini app-оболочка с нуля в `components/mini/mini-app-entry.tsx`.

## Что изменено

- Новая мобильная структура: `Сегодня`, `График`, `Услуги`, `Чаты`, `Ещё`.
- Экран `Сегодня` теперь рабочий: ближайшая запись, выбор дня, лента записей, быстрые действия.
- `График` сделан как мобильный редактор недели: день, короткий день, выходной, рабочее окно, перерыв.
- `Услуги` сохраняются в `workspaceData.services` и синхронизируются с `profile.services`.
- `Чаты` читают `/api/chats`, отправляют ответы через тот же API и обновляют активный диалог после отправки.
- `Ещё` убирает второстепенное: клиенты, аналитика, профиль, публичная ссылка, переход в полный кабинет.
- Стилистика приведена ближе к кабинету: строгие карточки, тонкие borders, compact controls, light/dark, accent из appearance.

## Проверка

```bash
node _syntax_check_local.js components/mini/mini-app-entry.tsx app/app/page.tsx components/system/telegram-miniapp-viewport.tsx app/layout.tsx
```

Результат: OK.
