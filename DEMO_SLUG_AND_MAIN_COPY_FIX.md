# Demo slug and main page copy fix

## Что изменено

- Демо slug заменён с `klikbuk-demo` на `demo`.
- Убраны видимые варианты `klikbuk-demo` / `klikbuk_demo` из проекта.
- Публичная ссылка демо-профиля теперь отображается как `/m/demo`.
- Тексты на главной странице кабинета переписаны в нормальном стиле:
  - заголовок и описание страницы;
  - блок клиентской ссылки;
  - метрики;
  - ближайшая запись;
  - услуги;
  - клиенты;
  - недельная динамика.
- Убрана техническая подпись `channel` в карточке источника, теперь показывается нормальная подсказка.

## Проверка

- `app/dashboard/page.tsx` проходит TypeScript transpile.
- `lib/demo-data.ts` проходит TypeScript transpile.
- `hooks/use-owned-workspace-data.ts` проходит TypeScript transpile.
