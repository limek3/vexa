# Desktop popups/modals records-style pass

Applied a desktop-wide normalization pass so modals, popovers, dropdowns, command/search panels, notification cards, chat composer popovers and dashboard portal dialogs follow the Records page popup style.

Key points:
- Dark popup card: `#1B1C20`, panel: `#17181B`, surface: `#24262B`.
- Light popup card/panel uses the same Schedule v2 token structure.
- Radius, border and shadow match the Records appointment card.
- Regular `.modal` windows can be dragged by their header/top area.
- Modal position is saved in `localStorage` under `clickbook.desktop.modal.position.v1` and clamped to the desktop safe area.
- Anchored dropdowns/search/filters/menus remain anchored and are not made draggable.
- Popups stay above desktop content without being clipped by topbar/content layers.
- Embedded dashboard/Radix portal dialogs inherit the same popup palette.
