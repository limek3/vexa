# ClickBook Supabase deploy fix

Что исправлено в архиве:

1. Supabase Auth переведён на cookie-based SSR через `@supabase/ssr`.
2. `proxy.ts` больше не использует `getClaims()` — теперь проверка идёт через `getUser()`.
3. API routes принудительно динамические (`force-dynamic`), чтобы Vercel не кэшировал auth-запросы.
4. Клиентские запросы к защищённым API отправляются с `credentials: 'include'`.
5. `/api/profile` теперь не доверяет произвольному `workspaceId` из клиента и проверяет владельца.
6. Добавлена совместимая Supabase migration:
   `supabase/migrations/20260430_0005_clickbook_supabase_compat.sql`
7. `.env.example` очищен от дублей и реальных значений.

## Что сделать после загрузки в GitHub

1. В Supabase SQL Editor выполни свой полный SQL schema из чата или хотя бы migration:
   `supabase/migrations/20260430_0005_clickbook_supabase_compat.sql`

2. В Vercel проверь Production env:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
DATABASE_URL=postgresql://...
NEXT_PUBLIC_APP_URL=https://your-domain-or-vercel-url
KEY_VAULTS_SECRET=long_random_secret
TELEGRAM_BOT_TOKEN=...
TELEGRAM_SUPPORT_CHAT_ID=...
NEXT_PUBLIC_SUPPORT_TELEGRAM_URL=https://t.me/...
```

3. В Supabase Authentication → URL Configuration добавь:

```txt
https://www.кликбук.рф/**
https://www.кликбук.рф/**
http://localhost:3000/**
```

4. Сделай Redeploy without cache.

5. После деплоя зайди в инкогнито, авторизуйся заново и создай профиль.
