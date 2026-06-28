# Calendar runtime white screen fix

Fixed the runtime crash on `/dashboard/today?demo=1` caused by missing helper functions used during render:

- `passesBookingFilters`
- `countActiveFilters`

The page referenced those functions inside `useMemo`, so the browser threw a `ReferenceError` before the calendar could render. TypeScript transpile did not catch it because it only checks syntax in this environment.

Validation performed:

- TSX syntax transpile check passed for `app/dashboard/today/page.tsx`.
- Additional TypeScript check confirmed no remaining `Cannot find name` diagnostics in this file, aside from expected missing package/module types because `node_modules` is not included in the archive.
