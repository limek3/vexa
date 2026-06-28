# ClickBook main page menu-style pass

Changed the dashboard home page to visually match the new Nexo-style top mega-menu.

## Updated

- `app/dashboard/page.tsx`

## What changed

- Rebuilt the home page layout around the same wide container as the top menu.
- Added a menu-inspired hero: left intro panel, right navigation/features area, bottom promo cards.
- Reworked metrics, next booking, popular services, weekly chart and clients to the same rounded surface system.
- Removed old mixed dashboard styling from the main page.
- All page accents now use the selected Appearance accent color through `settings.accentTone`.
- Public link, progress lines, icons, promo card, active pills and primary actions follow the chosen accent.
- Preserved real/demo data rendering and the client detail modal.

## Validation

`app/dashboard/page.tsx` was checked with `typescript.transpileModule`.
