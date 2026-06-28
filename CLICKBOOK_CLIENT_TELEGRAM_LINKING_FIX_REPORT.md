# ClickBook — clients, CRM, chat and sources repair

## What changed

### Clients page
- Removed the top status chips from `/dashboard/clients`.
- Removed the favorite/status pill from the client CRM modal header.
- Moved **Note** and **Remind** from inline blocks into compact modal popups in the same ClickBook dialog style.
- Configured the **Call** action as a real `tel:` link with normalized phone digits.
- Reworked visit timeline labels:
  - first/only visit is shown as **Первый визит**;
  - repeat clients get **Последний визит**, **Первый визит**, and intermediate previous visit when available.

### Client calculations
- Fixed client average check and revenue calculations from real bookings.
- Fixed favorite/regular/sleeping segmentation so new one-off clients are not marked as favorites by default.
- Sleeping clients are now calculated from real inactivity: no future booking and last past visit older than the inactivity threshold.

### Chat delivery
- Dashboard chat messages now try to deliver to the client through Telegram when:
  - the thread channel is Telegram;
  - client message notifications are enabled;
  - the client has connected Telegram through the booking confirmation link or the thread metadata contains `clientTelegramChatId`.
- Client replies to the Telegram bot are written back to the dashboard chat even when the original booking link row is missing, as long as the chat thread has Telegram metadata.
- Bot delivery now searches client Telegram linkage by booking id, phone, client name and direct thread chat id.

### Sources/channels
- Removed MAX from visible CRM/chat/source options.
- Normalized visible source set to: **ТГ / Telegram**, **Инстаграм / Instagram**, **ВК / VK**.
- Existing MAX chat threads are migrated to VK by the new SQL migration.

## Files touched
- `app/dashboard/clients/page.tsx`
- `app/dashboard/chats/page.tsx`
- `app/api/chats/route.ts`
- `app/api/bookings/route.ts`
- `app/api/telegram/webhook/route.ts`
- `lib/master-workspace.ts`
- `lib/chat-types.ts`
- `lib/server/client-telegram.ts`
- source labels in dashboard/profile/public/template/integration files
- `supabase/migrations/20260501_0012_clickbook_clients_chat_sources_repair.sql`
- `supabase/RUN_ALL_CLICKBOOK_SQL.sql`

## Required SQL
Run:

```sql
supabase/migrations/20260501_0012_clickbook_clients_chat_sources_repair.sql
```

## Notes
Full Next.js build was not executed in this environment because dependencies (`node_modules`) are not installed here. The archive was checked for zip integrity.
