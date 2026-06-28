# ClickBook — profile editor + connected accounts rework

## Что изменено

1. `app/login/page.tsx`
   - Включены реальные OAuth-кнопки Google и VK ID через Supabase `signInWithOAuth`.
   - Telegram вход сохранён: Mini App + веб-вход через бота.
   - Убраны нерабочие disabled-кнопки Google/VK.

2. `app/dashboard/profile/page.tsx`
   - Добавлен блок «Связанные аккаунты»: Google, Telegram, VK ID.
   - Google/VK подключаются через Supabase `linkIdentity`, с fallback на `signInWithOAuth`.
   - Telegram подключается через отдельный link-flow: создаётся токен, открывается бот, страница ждёт подтверждение.
   - Убран старый CSS-хак, который скрывал части формы.
   - Профильная страница получила более спокойный letter-spacing.

3. `components/profile/master-profile-form.tsx`
   - Упрощён редактор профиля: убран лишний верхний дубль текущего шага с бейджем `3/5`.
   - Сохранена навигация по разделам слева, основная рабочая область и все маршруты.
   - Правая колонка показывается только там, где явно передан `showPreviewPanel=true`.
   - Для страницы `/dashboard/profile` правая колонка не появляется.

4. `app/api/auth/accounts/route.ts`
   - Новый endpoint для безопасного чтения текущих подключённых провайдеров.
   - Работает и с обычной Supabase-сессией, и с Telegram app-session через `requireAuthUser`.

5. `app/api/auth/telegram/link/start/route.ts`
   - Новый endpoint для подключения Telegram к текущему аккаунту.

6. `app/api/auth/telegram/status/route.ts`
   - Добавлена обработка link-flow для Telegram.
   - Если login request создан как `purpose=link_account`, Telegram не создаёт новую сессию, а привязывается к текущему пользователю.

7. `app/globals.css`
   - Базовый `letter-spacing` сделан мягче: `-0.005em` вместо `-0.02em`.
   - Для `.cb-profile-page` добавлен отдельный override, чтобы профиль читался легче.

## Важно для Supabase

Для Google и VK нужно включить провайдеры в Supabase:

- Authentication → Providers → Google
- Authentication → Providers → VK

Redirect URLs:

- `https://your-domain/auth/callback`
- `http://localhost:3000/auth/callback`

## Проверка

Из-за отсутствия `node_modules` полный `next build` в окружении не запускался. Изменённые TS/TSX файлы проверены через локальный `typescript.transpileModule` syntax-check.
