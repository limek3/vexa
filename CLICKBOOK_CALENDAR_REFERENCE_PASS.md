# Calendar reference pass

Base archive: `12.zip`.

Changed file:

- `app/dashboard/today/page.tsx`

What was changed:

- Rebuilt the internal weekly calendar to match the provided reference direction.
- Added a compact top toolbar inside the calendar: new booking, filters, legend.
- Reworked day headers: weekday, compact date, booking count.
- Reworked the time grid: thinner borders, lower row height, calmer spacing.
- Reworked appointment blocks: pastel cards, left status rail, compact time/client/service/avatar.
- Reworked free slots: white compact cells with plus action.
- Reworked breaks: peach diagonal blocks with coffee icon.
- Added unavailable visual blocks for day-off columns.
- Reworked current-time marker into a thin red line with a small time pill.
- Centered the page content and removed the noisy metric card above the calendar.

Validation:

- `app/dashboard/today/page.tsx` was checked with `typescript.transpileModule` for TSX syntax.
- Full `next build` was not run because the archive does not include `node_modules`.
