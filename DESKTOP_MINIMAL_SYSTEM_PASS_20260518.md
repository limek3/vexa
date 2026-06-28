# Desktop minimal system pass — 2026-05-18

## Scope
- Worked only on `app/desktop` desktop model.
- Used the provided КликБук design-system HTML/reference as the visual baseline: quiet surfaces, one accent, dense layout, tabular numbers, consistent radii, light/dark tokens.
- Kept existing live state, booking modal, schedule grid, clients, chats, notifications, theme switching, command palette and route wrappers.

## Files changed
- `app/desktop/_components/desktop-workspace.tsx`
- `app/desktop/_components/desktop-entry.tsx`
- `app/desktop/help/page.tsx`
- `app/desktop/desktop.css`

## Main changes
- Removed visual glow layer from the desktop UI through the shared design-system CSS.
- Disabled radial page glow, glass blur, glow-like shadows and hover lifts.
- Rebalanced light and dark tokens so both themes are full variants, not inverted colors.
- Exposed existing desktop screens in the sidebar by zones: workplace, operations, growth, system.
- Extended command palette navigation to all existing desktop sections.
- Added a real route wrapper for the already existing help/support screen.
- Added clean empty states for client filtering and chat filtering.
- Kept current site-to-desktop functionality: public booking, site source, channels, payments, reminders, reviews, templates, CRM and chat actions.

## Verification performed
- TSX syntax check for:
  - `app/desktop/_components/desktop-workspace.tsx`
  - `app/desktop/_components/desktop-entry.tsx`
  - `app/desktop/help/page.tsx`
- CSS brace integrity check for `app/desktop/desktop.css`.

## Notes
- Full `npm run build` was not run in this sandbox because project dependencies are not installed here.
- Run `npm install` and `npm run build` in the project folder to validate the full Next.js build in your local environment.
