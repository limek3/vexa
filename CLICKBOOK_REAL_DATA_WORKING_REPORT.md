# ClickBook real subscriptions fix — 2026-05-02

## Что сделано

1. Подписка больше не захардкожена как `Pro` на фронте.
2. Новый workspace получает реальную подписку `Start` в `sloty_workspace_subscriptions`.
3. Страница `/dashboard/subscription` берёт текущий тариф из БД.
4. Переключение тарифа на странице подписки сохраняется в БД через `/api/subscription`.
5. История оплат/активаций пишется в `sloty_subscription_events`.
6. `/api/workspace` возвращает в `workspace.data` реальные `subscription` и `subscriptionEvents`.
7. `/dashboard/limits` показывает реальный текущий тариф и лимиты выбранного плана.
8. `/dashboard/payments` показывает реальную историю оплат/активаций из событий подписки.
9. Лимит активных услуг начал реально проверяться на сервере:
   - при сохранении профиля;
   - при сохранении секции услуг.
10. SQL-патч чинит старые варианты таблицы, где мог быть `plan_id`, но не было `plan`.

## Тарифы

- Start: 0 ₽, до 5 услуг, 30 клиентов/мес, 30 напоминаний.
- Pro: 990 ₽/мес или 9 990 ₽/год, до 20 услуг, 150 клиентов/мес.
- Studio: 2 490 ₽/мес или 24 990 ₽/год, до 80 услуг, 500 клиентов/мес.
- Premium: 5 990 ₽/мес или 59 990 ₽/год, расширенные лимиты.

## Важно

Это рабочая подписочная логика приложения: тариф хранится в БД, меняется через API, влияет на лимиты и отображение.
Платёжный эквайринг пока в режиме `manual_mvp`: тариф активируется через кабинет без реального списания денег. Для настоящего списания нужно отдельно подключить ЮKassa/CloudPayments/Stripe и заменить manual-активацию в `/api/subscription` на создание checkout/payment link.

## Что выполнить в Supabase

Выполнить:

`supabase/migrations/20260502_0019_clickbook_real_subscriptions.sql`

После этого можно проверять:

```sql
select
  w.id,
  w.slug,
  w.owner_id,
  s.plan,
  s.status,
  s.billing_cycle,
  s.current_period_start,
  s.current_period_end,
  s.provider,
  s.payment_method_label
from public.sloty_workspaces w
left join public.sloty_workspace_subscriptions s
  on s.workspace_id = w.id
order by w.created_at desc;
```
