# ClickBook — client Telegram linking fix

## Fixed

- Public booking success now shows a fallback Telegram command after the “Connect Telegram” button.
- If Telegram opens the bot without passing the deep-link payload, the client can copy the command and send it to the bot manually.
- Bot no longer looks like it is only for masters on plain `/start`: the start message now explains both client and master scenarios.
- If a client writes to the bot before the booking is linked, the bot answers with clear linking instructions instead of silently doing nothing.
- Malformed booking-code attempts now return instructions instead of falling through.
- Telegram linking no longer overwrites the original booking/source as `ТГ`; it preserves the original source and stores Telegram as the communication channel.

## Changed files

- `components/booking/booking-form.tsx`
- `app/api/telegram/webhook/route.ts`
- `lib/server/telegram-bot.ts`

## Client flow after fix

1. Client creates booking on public page.
2. Client taps “Подключить Telegram”.
3. If Telegram links correctly, bot sends booking confirmation and chat becomes connected.
4. If Telegram only opens the bot, client copies the shown `/start booking_...` command and sends it to the bot.
5. Bot links the booking to the Telegram chat, so notifications and chat replies can work.
