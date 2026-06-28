# ClickBook services/clients polish pass

Scope:
- `app/dashboard/services/page.tsx`
- `app/dashboard/clients/page.tsx`

Changes:
- Fixed invalid HTML hydration issue by keeping service rows as `div role="button"`, not nested buttons.
- Replaced native `<select>` controls with themed custom dropdowns in both dark and light themes.
- Added drag-and-drop ordering for service rows. Dropping a row switches sorting to manual and persists order through `useWorkspaceSection('services')`.
- Removed number input spinners by using text inputs with numeric parsing for price, duration, and buffer fields.
- Cleaned dark/light palette: neutral ClickBook panels, borders, selected-row accent rail, readable badges, no random colored fills.
- Fixed layout stretching by aligning columns to start and constraining scroll areas.
- Made service row action menu functional: duplicate, archive, delete.
- Made services editor controls functional: tabs, category, color, online booking, buffers, addons, duplicate, archive, delete, save.
- Made client actions functional: export JSON, import clients, add client, call, write/note, book, VIP toggle, reminders, recommendation note, birthday list toggle, tasks, activity button.
- Added incremental client list loading.

Validation:
- Parsed with esbuild:
  - `app/dashboard/services/page.tsx`
  - `app/dashboard/clients/page.tsx`
