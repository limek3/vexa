# ClickBook Reference Design System v1

Референс зафиксирован как основная визуальная система приложения.

## Визуальная база
- Фон: светлый premium SaaS, холодный молочный `#f6f9fc` с мягкими голубыми и mint glow.
- Поверхности: белые glass cards, тонкий border, blur, мягкая тень.
- Акцент: mint `#31b39b`, secondary blue `#6aa6f8`, violet `#a685ff`, orange для перерывов/current time.
- Радиусы: 14 / 18 / 24 / 30px.
- Типографика: плотная, с аккуратным negative tracking, без декоративности.

## Source of truth в коде
- `app/globals.css` — CSS tokens `--cb-ref-*` и глобальные классы.
- `components/shared/workspace-shell.tsx` — sidebar/layout переведены на `clickbook-reference-v1`.
- `components/shared/reference-design-system.tsx` — переиспользуемые production-компоненты для следующих страниц.

## Компоненты
- `RefPage`
- `RefPageHeader`
- `RefCard`
- `RefSection`
- `RefMetricCard`
- `RefSegmentedControl`
- `RefIconButton`
- `RefBadge`
- `RefEmptyState`

## Правило дальнейшей адаптации страниц
Каждая страница должна собираться из reference-компонентов и токенов, а не из случайных локальных цветов.
Не использовать локальные `pageBg/cardTone/buttonBase`, если страницу переводим в новый стиль.

## Pass 2 — Today calendar integration
- `app/dashboard/today/page.tsx` переведён на базовые reference-компоненты: `RefPage`, `RefPageHeader`, `RefCard`, `RefMetricCard`, `RefSegmentedControl`, `RefIconButton`, `RefEmptyState`.
- Верх страницы и метрики теперь собраны как в зафиксированном референсе: airy SaaS layout, glass cards, mint/blue/violet accents.
- Календарные записи оставлены на реальной временной сетке: `top` и `height` считаются строго по минутам, без искусственных вертикальных inset для booking cards.
- Free/break blocks сохраняют внутренний inset, чтобы выглядеть как доступные интервалы, но сами записи показывают фактический start/end.
- Light/dark остаются поддержанными через `--cb-ref-*` tokens.
