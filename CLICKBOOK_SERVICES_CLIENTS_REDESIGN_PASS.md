# ClickBook Services + Clients redesign pass

## Scope

Reworked two desktop dashboard pages to match the approved generated concepts:

- `app/dashboard/services/page.tsx`
- `app/dashboard/clients/page.tsx`

## Services

Implemented a three-zone service workspace:

- left column: quick actions, filters, categories, summary;
- center column: grouped service list with selection, sorting and status controls;
- right column: persistent service editor with tabs, duration, price, category, color, online booking, buffers, add-ons, duplicate/archive/delete/save.

The page is designed for a single master only. There is no multi-employee assignment UI.

## Clients

Implemented a CRM-style workspace:

- top metric cards;
- client list with search, filters, source filter and sorting;
- selected client profile with LTV, loyalty, favorite services, next booking and visit history;
- right rail with reminders, recommendation, birthdays, tasks and activity.

Buttons now have local/persisted actions where applicable: add/import clients, export feedback, call/message/book feedback, VIP toggle, notes, reminders, task checklist, activity actions.

## Data

- Services continue to persist through `useWorkspaceSection('services')`.
- Clients now persist through `useWorkspaceSection('clients')` with dataset fallback.
- Notes/reminders/VIP/tasks persist through dedicated workspace sections.

## Validation

Parsed with esbuild:

```bash
npx --yes esbuild app/dashboard/services/page.tsx app/dashboard/clients/page.tsx --bundle=false --format=esm --log-level=warning --outdir=/tmp/escheck_both_new
```
