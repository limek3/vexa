# DESKTOP_WIDE_DRAGGABLE_POPUPS_PASS

## Scope

Fixed embedded dashboard popups that were visually too narrow after the previous Records-style pass.

Affected dialogs:

- Dashboard Clients client card popup
- Dashboard Services service editor popup
- Dashboard Availability day/slots popup

## Changes

- Kept the Records-page dark popup visual language.
- Restored a wider, more balanced layout:
  - Clients: up to 700px
  - Services: up to 700px
  - Availability: up to 760px
- Restored two-column internal grids on desktop widths.
- Availability slot grid uses three columns where space allows.
- Removed direct blur classes from the custom backdrops.
- Added explicit drag handles on popup headers.
- Extended the desktop modal drag observer to catch `.cb-record-popup` portals mounted under `document.body`, not only modals inside `.cb-desktop-html`.
- Dragged positions are clamped to the desktop workspace safe area and remain persisted by the existing `clickbook.desktop.modal.position.v1` key.

## Validation

Parsed the changed TSX/JSX files with esbuild:

```bash
npx --yes esbuild app/dashboard/availability/page.tsx app/dashboard/services/page.tsx app/dashboard/clients/page.tsx components/desktop-html-exact/desktop-html-app.jsx --bundle=false --format=esm --log-level=warning --outdir=/tmp/escheck_popup_wide2
```

No parse errors.
