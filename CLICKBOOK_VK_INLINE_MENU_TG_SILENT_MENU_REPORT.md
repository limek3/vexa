# ClickBook VK OAuth invalid scope fix

Исправлено: классический VK OAuth теперь не отправляет `scope` по умолчанию.

Причина: `oauth.vk.com/authorize` возвращал `invalid scope`, если в ENV оставался `vkid.personal_info email` от VK ID или если приложение VK не принимало `email` scope.

Теперь вход использует только обязательный authorization-code flow: `code` -> `access_token` -> `user_id` -> `users.get`. Email необязателен.

Рекомендуемый ENV:

```env
VK_ID_CLIENT_ID=54575151
VK_ID_CLIENT_SECRET=новый_защищённый_ключ
VK_ID_REDIRECT_URI=https://www.кликбук.рф/api/auth/vk/callback
VK_ID_SCOPE=
```
