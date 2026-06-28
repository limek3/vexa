# ClickBook profile/create/auth reset fix

Что изменено:

1. `/create-profile` очищен от правой колонки и лишних блоков: оставлен только заголовок и рабочий редактор.
2. Исправлен риск падения `/dashboard/profile` из-за дублирующего поля в `EmptyInfoCard`.
3. `requireAuthUser` теперь сначала использует реальный Supabase Bearer token, а старый Telegram app-session только как fallback. Это исправляет ситуацию, когда после удаления аккаунта старый localStorage token перебивает новый вход через Google/VK/Telegram.
4. `/login` и `TelegramLoginButton` очищают старый Telegram app-session token перед новым входом.
5. Подключён Golos Text как fallback для Golos UI через `next/font/google`; глобальный font-family теперь: Golos UI / Golos Text / system.
6. Ослаблены слишком сильные отрицательные tracking-классы внутри dashboard, чтобы буквы были чуть шире и читабельнее.
7. Добавлен SQL-файл `supabase/CLICKBOOK_DEV_RESET_PUBLIC_DATA.sql` для очистки публичных таблиц приложения.

После деплоя желательно открыть `/auth/signout`, затем `/login`, затем войти заново.
