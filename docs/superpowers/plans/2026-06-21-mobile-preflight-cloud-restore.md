# Mobile Preflight Cloud Restore

## Goal

Make the phone preflight screen launch-first, readable, and capable of restoring a Cloud Code from any device without exposing the player to a wall of text.

## Plan

- [x] 1. Keep the phone preflight surface focused on cover art, essential icon choices, and Launch.
- [x] 2. Move Cloud status into an always-visible compact action row.
- [x] 3. Open Cloud Code restore from a small Restore action, including when a session already exists.
- [x] 4. Hide verbose mission detail cards from the phone launch sheet.
- [x] 5. Prevent rich route history from expanding the phone launch sheet into a dense desktop briefing.

## Verification

- Unit/style tests cover Cloud restore wiring and mobile preflight density.
- Typecheck, test, and production build pass.
- Manual browser check on a phone viewport confirms the compact menu and Restore flow.
