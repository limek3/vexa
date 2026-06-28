# Desktop dashboard popups — Records style pass

## Scope

Brought the embedded dashboard dialogs that were still rendered as large blurred modals closer to the compact popup system used on the Records page.

## Changed dialogs

- Availability day editor (`app/dashboard/availability/page.tsx`)
- Service editor (`app/dashboard/services/page.tsx`)
- Client CRM card (`app/dashboard/clients/page.tsx`)

## What changed

- Added explicit popup classes to the body-level `createPortal()` dialogs:
  - `cb-record-popup-overlay`
  - `cb-record-popup-backdrop`
  - `cb-record-popup`
  - `cb-record-popup-head`
  - `cb-record-popup-body`
  - `cb-record-popup-grid`
  - `cb-record-popup-panel`
- Removed the visual effect of full-page blur/backdrop for these dialogs in desktop mode.
- Forced compact Records-like popup geometry:
  - 392px default width
  - 420px for the availability slot editor
  - 14px radius
  - Records card/panel colors
  - compact header and close button
  - single-column content instead of the wide two-column modal slab
- Kept all original actions and form controls intact.
- Kept the popup layer above desktop content and below Electron chrome constraints.

## Validation

Parsed the touched TSX files with esbuild:

```bash
npx --yes esbuild app/dashboard/availability/page.tsx app/dashboard/services/page.tsx app/dashboard/clients/page.tsx --bundle=false --format=esm --log-level=warning --outdir=/tmp/escheck_popup
```

No parse errors.
