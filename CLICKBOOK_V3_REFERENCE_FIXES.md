# ClickBook VK ID Auth — 2026-05-02

Что добавлено:

- Кастомная авторизация VK ID через OAuth 2.1 + PKCE.
- Новый redirect route: `/api/auth/vk/start`.
- Новый callback route: `/api/auth/vk/callback`.
- VK ID больше не идёт через Supabase Auth provider `vk`, потому что старый VK OAuth часто ломается/устарел.
- После успешного VK входа создаётся ClickBook app-session cookie `clickbook_auth_session`.
- Пользователь VK получает стабильный виртуальный UUID по `vk_id`, чтобы создание профиля не зависело от `auth.users`.
- Подключение VK на странице профиля работает через `mode=link` и пишет связь в `sloty_vk_accounts`.
- `/api/auth/accounts` теперь видит VK-связь из таблицы `sloty_vk_accounts`.

ENV для Vercel:

```env
VK_ID_CLIENT_ID=...
VK_ID_CLIENT_SECRET=...
VK_ID_REDIRECT_URI=https://www.кликбук.рф/api/auth/vk/callback
VK_ID_SCOPE=vkid.personal_info email
```

В кабинете VK ID нужно создать Web/Website приложение и добавить trusted/authorized redirect URI:

```txt
https://www.кликбук.рф/api/auth/vk/callback
```

SQL:

```txt
supabase/migrations/20260502_0020_clickbook_vk_id_auth.sql
```

Проверка после деплоя:

1. Выполнить SQL-патч.
2. Добавить ENV в Vercel Production.
3. Redeploy without cache.
4. Открыть `/auth/signout`.
5. Открыть `/login`.
6. Нажать `VK ID`.
7. После возврата должен открыться `/dashboard`.

Проверочный запрос:

```sql
select
  vk_id,
  user_id,
  screen_name,
  first_name,
  last_name,
  email,
  last_login_at,
  created_at
from public.sloty_vk_accounts
order by last_login_at desc nulls last, created_at desc;
```
