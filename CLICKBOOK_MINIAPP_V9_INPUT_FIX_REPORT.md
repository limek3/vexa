# ClickBook Miniapp v9 input fix

Base: `clickbook-miniapp-v8-chat-reschedule-near-quick.zip`.

## What changed

- Added final miniapp control hardening for `input`, `textarea`, `select`, `date`, and `time` fields.
- Removed native white WebKit backgrounds/stripes in dark theme by forcing mini tokens, autofill inset color, `color-scheme`, and date/time pseudo-element colors.
- Restored transparent reset only for fields that explicitly use `cb-mini-transparent` / `cb-mini-input-reset`, so search/icon fields stay visually clean.
- Added a custom miniapp select arrow and dark option background.
- Kept existing v8 features untouched: smooth sheets, chat glow, reschedule near quick action, and read notifications.

## Files touched

- `app/globals.css`
- `components/mini/mini-app-shell.tsx`
- `components/mini/mini-app-entry.tsx`
