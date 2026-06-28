# Desktop popups blur / availability hover / Esc pass

- Added a subtle uniform backdrop blur for client/service/availability popups without radial glow.
- Kept dark and light popup themes separate.
- Added availability month-card hover focus: hovered day stays active, sibling day cards dim like the Schedule page.
- Added global Escape handling for dashboard record popups, Schedule popups, and generic desktop modals with close buttons.
- Bumped dashboard popup position storage to `clickbook.desktop.modal.positions.v3` to ignore stale bad coordinates from previous passes.
