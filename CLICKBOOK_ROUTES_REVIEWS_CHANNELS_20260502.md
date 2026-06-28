# ClickBook slots real-data fix

Fixed the live booking slot chain end-to-end:

1. Dashboard availability no longer loses unsaved slot changes when the user immediately leaves the page. The delayed save is no longer cancelled on navigation.
2. Public profile now falls back to the current in-app workspace state when the master opens their own public page before the public API finishes loading.
3. Public booking API now reads real saved availability only: workspace JSON data first, normalized `sloty_availability_days` as backup. Demo/default weekly mock availability is not used for live public booking.
4. Booking validation now checks the same real availability source as the public page.
5. Availability lookup now lets the latest source win, so date-specific settings override old weekly/default rows.
6. Workspace section saving now syncs services, availability and templates into normalized Supabase tables for stable public booking and future analytics.
7. Added SQL migration `20260501_0010_clickbook_availability_sync_hardening.sql` to harden `sloty_services` and `sloty_availability_days`.

After deploy, open `/dashboard/availability`, change one slot/day once, wait 1-2 seconds, then open the public page. The selected day should show available times.
