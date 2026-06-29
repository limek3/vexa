# Vexa Railway package

Этот архив нужен только для Railway/Render/VPS. Он запускает веб-платформу Vexa.

## Railway

Build command:

```bash
npm ci && npm run build
```

Start command:

```bash
npm run start:railway
```

Обязательные variables:

```env
NODE_VERSION=22.16.0
NEXT_TELEMETRY_DISABLED=1
APP_URL=https://clickbook-production-a3f9.up.railway.app
NEXT_PUBLIC_APP_URL=https://clickbook-production-a3f9.up.railway.app
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=...
KEY_VAULTS_SECRET=...
```

Electron сюда загружать не нужно.
