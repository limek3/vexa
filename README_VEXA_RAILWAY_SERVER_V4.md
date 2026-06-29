# Vexa Railway Server v4

Это серверный архив для Railway: Next.js-приложение, Supabase auth, Vexa desktop UI и API.

Не использовать как Windows-приложение. Для Windows есть отдельный архив `vexa-windows-desktop-v4.zip`.

## Быстрый запуск локально

```bash
cp .env.railway.example .env.local
npm install
npm run dev
```

Открыть:

```text
http://localhost:3000/desktop/searches
```

## Railway

Railway читает `railway.json`:

- build: `npm run build`
- start: `npm run start:railway`
- healthcheck: `/api/health`

Переменные описаны в `RAILWAY_DEPLOY_VEXA_V4.md`.
