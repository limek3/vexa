# Desktop/site feature pass — 2026-05-18

## Scope
- Desktop only.
- Updated the existing desktop model pages: dashboard, schedule, clients, chats.
- Kept existing live state, modals, routing, localStorage persistence and actions.

## Changed files
- `app/desktop/_components/desktop-workspace.tsx`
- `app/desktop/desktop.css`

## What changed
- Applied the supplied light/dark design-system direction to desktop tokens: warm light surface, deep neutral dark surface, violet/blue accent, compact radii, tabular/numeric focus.
- Dashboard now exposes site-level features: public booking link, online booking, auto reminders, connected channels, site conversion/risk/completion insights.
- Schedule now has desktop controls from the web cabinet: day/week/month switch, master filter, status filter, channel/status chips, resource availability strip.
- Clients now has segment summary cards, source-aware rows, per-client visit journey, quick review action, and keeps note editing/booking/chat actions.
- Chats now has channel status chips, payment/review tools in composer, and a right-panel website scenario block: public link, slots, payment, review.

## Verification
- Syntax checked: `node _syntax_check_local.js app/desktop/_components/desktop-workspace.tsx`
- CSS brace integrity checked.
