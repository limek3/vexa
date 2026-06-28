# ClickBook full working fix

## Fixed in this package

1. Telegram Mini App auth on refresh/navigation
   - The client now waits for `Telegram.WebApp.initData` instead of reading it too early.
   - App startup authorizes Telegram before loading `/api/workspace`.
   - API retry after `401` forces Telegram session refresh.
   - Telegram initData max age is relaxed to 7 days to reduce false "session expired" inside WebView.
   - Login button and Mini App gate use the same hardened auth path.

2. Existing profile disappearing after login
   - Added recovery for early MVP databases where Telegram auth created a newer Supabase user while the workspace stayed attached to an older synthetic user.
   - If the database has exactly one workspace and the current Telegram user has no workspace, the app reattaches that workspace to the current Telegram user instead of showing "create profile" again.
   - Disable this recovery with `CLICKBOOK_DISABLE_SINGLE_WORKSPACE_REPAIR=1` when the project becomes multi-user in production.

3. Availability slots not appearing publicly
   - `lib/availability.ts` now understands weekly records by `id`/`label` (`mon`, `tue`, `Понедельник`, etc.) and converts them to `weekdayIndex`.
   - Public profile API normalizes availability before sending it to the booking form.
   - Fallback weekly availability now generates available times even before a custom month schedule is saved.

4. Availability saving reliability
   - Workspace section saving now retries once if the first save fails because the Telegram cookie was still being refreshed.
   - This improves schedule/services/templates saving immediately after page refresh or auth restore.

## Important Supabase note

This app stores editable dashboard sections in `sloty_workspaces.data` for MVP compatibility. Tables like `sloty_availability_days`, `sloty_services`, and `sloty_message_templates` are prepared by SQL for the future normalized split, but the live screens currently use `sloty_workspaces.data` plus `sloty_bookings`.

## After installing

1. Replace project files with this archive.
2. Run the latest SQL migration if you have not run it yet:
   `supabase/migrations/20260501_0009_clickbook_real_data_no_mocks.sql`
3. Commit and deploy:

```powershell
git add .
git commit -m "fix live auth schedule and booking slots"
git push --force-with-lease origin main
npx vercel --prod
```
