# ClickBook VK/TG bot menu fix

- VK client controls are now inline buttons under the active bot card, matching VK UI: buttons are attached to the message instead of a noisy technical reply-keyboard message.
- Removed visible service text like “Меню клиента включено. Кнопки доступны...”.
- VK client booking cards are edited/reused through stored conversation_message_id when possible, so repeated “Мои записи / Выбрать запись” actions do not spam the chat with duplicate cards.
- Telegram reply keyboard is still enabled, but the technical carrier message is deleted immediately so the client does not see service text.
- Client booking confirmation in VK now includes the client menu buttons.
- No SQL migration required.
