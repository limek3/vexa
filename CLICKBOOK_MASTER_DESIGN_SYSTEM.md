# КликБук: дизайн-система кабинета мастера

## Позиционирование

КликБук — это не корпоративный SaaS-dashboard. Это рабочий кабинет мастера и публичная запись для клиентов.

Основной сценарий интерфейса: мастер открывает кабинет и за несколько секунд понимает:

- кто сегодня придёт;
- сколько денег ожидается;
- какие заявки надо подтвердить;
- где свободные окна;
- кому нужно ответить;
- как выглядит публичная страница для клиента.

## Визуальный тон

- тёплый premium, не холодный enterprise;
- минимализм без пустоты;
- мягкие карточки и бордеры;
- один живой акцентный цвет;
- статусы спокойные, не кислотные;
- тёмная тема графитовая, не чисто чёрная.

## Новый слой UI

Базовые primitives находятся в:

```txt
components/workspace/master-ui.tsx
```

Глобальные токены находятся в:

```txt
app/globals.css
```

Ключевые CSS-переменные:

```txt
--cb-master-bg
--cb-master-card
--cb-master-muted
--cb-master-text
--cb-master-text-soft
--cb-master-border
--cb-master-brand
--cb-master-brand-strong
--cb-master-shadow
```

## Правило миграции страниц

На страницах больше не нужно создавать локальные функции вида:

```txt
pageBg()
cardTone()
buttonBase()
mutedText()
insetTone()
```

Страница должна собираться из primitives:

```txt
MasterPage
MasterPageHeader
MasterCard
MasterSectionHeader
MasterButton
MasterBadge
MasterStatusBadge
MasterStatCard
MasterInfoRow
MasterTimelineItem
MasterEmptyState
MasterChecklist
```

## Уже переведено

```txt
app/dashboard/page.tsx
app/dashboard/today/page.tsx
```

Эти две страницы теперь являются эталоном направления: рабочий кабинет мастера, записи, выручка, профиль, публичная витрина и быстрые действия.

## Следующие страницы для миграции

1. `app/dashboard/clients/page.tsx` — простая CRM мастера.
2. `app/dashboard/services/page.tsx` — каталог услуг и предпросмотр карточек для клиента.
3. `app/dashboard/chats/page.tsx` — сообщения + контекст записи/клиента.
4. `app/dashboard/availability/page.tsx` — график, окна, перерывы.
5. `app/dashboard/profile/page.tsx` — витрина мастера, доверие, контакты.
6. `app/m/[slug]/page.tsx` — публичная страница записи.
7. `app/miniapp/*` — мобильный помощник мастера.
