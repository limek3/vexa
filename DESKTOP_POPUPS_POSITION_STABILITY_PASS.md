# Desktop popups position stability pass

## Scope

Fixed dashboard record-style popups on embedded desktop pages:

- Clients CRM card
- Services editor
- Availability day editor

## Changes

- Replaced the old single global modal position key with per-popup positions:
  - `client`
  - `service`
  - `availability`
  - fallback modal kinds
- Old bad position from `clickbook.desktop.modal.position.v1` is intentionally ignored.
- Every record popup is converted to a fixed floating window on mount.
- Initial position is centered inside the desktop work area, then clamped.
- Drag uses pointer offset from the window corner instead of cumulative delta, which removes side jumps.
- Drag uses `setPointerCapture` when available.
- Popups are clamped to the main desktop area and cannot be saved outside the visible work area.
- Final CSS layer removes radial glow/backdrop artefacts and enforces theme-aware light/dark popup colors.

## Files

- `components/desktop-html-exact/desktop-html-app.jsx`
- `app/desktop/desktop.css`
