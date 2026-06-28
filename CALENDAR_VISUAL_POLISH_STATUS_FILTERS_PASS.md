# Calendar visual polish + status/filter pass

Updated `app/dashboard/today/page.tsx`.

Changes:
- Calendar typography is tightened and explicitly aligned with the workspace font stack.
- Booking cards now use semantic status colors instead of visually ambiguous random service tones:
  - new: current appearance accent;
  - confirmed: green;
  - completed/arrived: blue;
  - no-show: red;
  - cancelled: neutral gray.
- Booking cards now show status chips and price when there is enough vertical space.
- Filter panel was rebuilt visually: color-coded status chips, custom check indicator, cleaner reset button and less noisy surface.
- Primary calendar action now follows the selected accent color from appearance settings.
- Active day highlighting now follows the selected accent color.
- Current time line now spans the whole week grid instead of only the current day column.
- Free slots were neutralized so they do not visually conflict with booking/status colors.
- Fixed `getBookingsForDate` to correctly return only bookings for the requested date.

Validation:
- TSX syntax checked with `typescript.transpileModule`.
- Full `next build` was not run because dependencies are not installed in the sandbox.
