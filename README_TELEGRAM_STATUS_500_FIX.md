# Telegram status deep fix

This patch hardens `/api/auth/telegram/status`.

It now tries three ways to create a Supabase session after Telegram confirms login:

1. Supabase Auth REST password grant.
2. `supabase-js` `signInWithPassword`.
3. Admin-generated magic link + server-side `verifyOtp`.

It also uses a normal synthetic email domain:

```txt
telegram_<telegram_id>@auth.clickbook.app
```

If Vercel still returns an error, the response now includes the real chained reason instead of a generic `Internal Server Error`.
