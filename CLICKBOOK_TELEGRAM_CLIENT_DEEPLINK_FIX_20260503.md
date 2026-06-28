# ClickBook Telegram/VK domain setup fix

Исправлен серверный `getAppUrl()` для Telegram/VK:

- технический домен по умолчанию: `https://xn--90anfbbc3d.xn--p1ai`;
- `APP_URL` имеет приоритет над `NEXT_PUBLIC_APP_URL`;
- кириллический домен автоматически нормализуется в punycode;
- `www.xn--90anfbbc3d.xn--p1ai` автоматически приводится к `xn--90anfbbc3d.xn--p1ai`;
- `/api/telegram/setup` теперь возвращает `appUrl` и `webhookUrl`, чтобы сразу видеть, какой URL отправляется в Telegram.

После деплоя:

1. В Vercel env поставить:
   - `APP_URL=https://xn--90anfbbc3d.xn--p1ai`
   - `NEXT_PUBLIC_APP_URL=https://xn--90anfbbc3d.xn--p1ai`
   - `VK_ID_REDIRECT_URI=https://xn--90anfbbc3d.xn--p1ai/api/auth/vk/callback`
2. Redeploy without cache.
3. Открыть `/api/telegram/setup?secret=...`.
4. Проверить, что в JSON вернулись:
   - `appUrl: https://xn--90anfbbc3d.xn--p1ai`
   - `webhookUrl: https://xn--90anfbbc3d.xn--p1ai/api/telegram/webhook`
