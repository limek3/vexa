# Calendar interactive + exact duration pass

Base: `clickbook-calendar-reference-exact-pass.zip`.

Changed file:

- `app/dashboard/today/page.tsx`

What changed:

1. Calendar toolbar buttons are no longer decorative:
   - `Новая запись` opens a real create-booking modal.
   - `Фильтры` opens a real status filter panel.

2. Free-slot buttons are working:
   - clicking a free slot opens the create-booking modal with date/time prefilled from that slot.

3. Booking creation is wired to the existing app context:
   - uses `createBooking(ownedProfile.slug, draft)`.
   - keeps validation/error state inside the modal.
   - closes after successful creation and moves the selected date to the created booking date.

4. Filters are wired:
   - status filters for new/confirmed/completed/no-show/cancelled.
   - reset button restores the default calendar view.
   - hidden bookings still block occupied slots so users cannot accidentally create a duplicate booking in a filtered-out occupied time.

5. Booking card height now uses the actual allocated duration:
   - explicit end time is respected from booking metadata when present.
   - fallback is `durationMinutes`, then service duration, then default duration.
   - cards use exact timeline math via `getEventBlockTop` / `getEventBlockHeight`.

Build note:

- TSX syntax was checked with `typescript.transpileModule`.
- Full `next build` was not run because the archive does not include `node_modules`.
