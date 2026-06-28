# Desktop popups light/dark elevation pass

## Scope

Adjusted dashboard record-style popups used by embedded desktop pages:

- Clients CRM popup
- Services editor popup
- Availability day editor popup

## Changes

- Added theme-aware popup variables for light and dark desktop themes.
- Light theme now renders a light popup surface instead of forcing the dark record-popup palette.
- Dark theme keeps the Records page visual language, but with stronger separation from the page behind it.
- Added elevation through a combination of:
  - outer ambient shadow,
  - thin border ring,
  - subtle top highlight,
  - soft non-blurring backdrop radial tint.
- Kept the popup geometry and draggable behavior from the previous pass.

## Files

- `app/desktop/desktop.css`
