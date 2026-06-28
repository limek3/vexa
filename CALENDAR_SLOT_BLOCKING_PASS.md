# Calendar slot blocking pass

Changed from the last calendar archive.

## What was added

- Free calendar cells can now be selected directly inside the weekly/day timetable.
- The plus button inside a free cell still opens creation of a booking for that exact date/time.
- Selecting one or several free cells opens an action bar with:
  - selected slot count;
  - clear selection;
  - block selected slots.
- Blocked slots are saved into the work schedule as exact-day availability overrides, not as fake bookings.
- Blocked intervals are stored in `availability[].blockedSlots` and are also excluded from public booking availability.
- If the current day uses a weekly template, blocking a slot creates a custom override for that date while preserving base work slots and breaks.
- Clicking a blocked slot unblocks it.
- Demo/no-workspace mode falls back to a local availability override so the UI still updates.

## Files changed

- `app/dashboard/today/page.tsx`
- `lib/availability.ts`

## Data model

`BookingAvailabilityDay` now supports:

```ts
blockedSlots?: string[];
```

Example:

```ts
{
  date: '2026-05-15',
  custom: true,
  status: 'workday',
  slots: ['09:00–10:00', '10:00–11:00'],
  breaks: ['13:00–14:00'],
  blockedSlots: ['15:00–16:00']
}
```

`getAvailableTimesForDate` now treats `blockedSlots` exactly like breaks, so clients will not see those times on the public booking page.
