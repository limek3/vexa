# Desktop popups — blur scope, no-flash positioning, records blur

## Scope

Fixed the popup presentation layer after the blur/hover/ESC pass.

## Changes

- Limited dashboard popup blur to the desktop work area instead of the left navigation.
- Added the same contained blur behavior to Schedule/Records popups.
- Added light-theme blur for dashboard and schedule popups without the grey/glow artifact.
- Prevented the one-frame center flash before a persisted popup position is applied.
- Bumped dashboard popup position storage to `clickbook.desktop.modal.positions.v4` to avoid stale v3 coordinates.
- Kept the left sidebar sharp and readable while popups are open.

## Files

- `components/desktop-html-exact/desktop-html-app.jsx`
- `components/desktop-html-exact/pages/calendar.jsx`
- `app/desktop/desktop.css`

## Verification

Parsed with esbuild:

```bash
npx --yes esbuild components/desktop-html-exact/desktop-html-app.jsx components/desktop-html-exact/pages/calendar.jsx app/dashboard/availability/page.tsx app/dashboard/clients/page.tsx app/dashboard/services/page.tsx --bundle=false --format=esm --log-level=warning --outdir=/tmp/escheck_blur_scope
```
