# Desktop popups: no glow + inline nested actions pass

## Scope

Updated embedded dashboard record-style popups after the wide draggable popup pass.

## Changes

- Removed radial glow/backdrop tint from `cb-record-popup-backdrop`.
- Kept popups separated from the page with a clean border + small elevation shadow only.
- Removed duplicate mouse drag handler; drag now uses the delegated pointer handler only.
- Kept drag constrained to popup headers and ignored interactive elements.
- Normalized quick-action button colors in dark and light themes via `cb-record-popup-action`.
- Reworked client note/reminder actions from a nested blurred modal into an inline editor panel inside the CRM popup.
- Added themed field/icon/action classes for inline editors.

## Files

- `components/desktop-html-exact/desktop-html-app.jsx`
- `app/dashboard/clients/page.tsx`
- `app/desktop/desktop.css`
