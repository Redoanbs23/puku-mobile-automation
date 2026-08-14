# SETTINGS-TC-002: Settings header section

**Priority:** P1
**Linked automated tests:** `SETTINGS-E2E-006` … `SETTINGS-E2E-010` (tests/specs/settings/settings-header.spec.ts)
**Linked risk(s):** R4 (Back has no content-desc)

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable. Do not uninstall/reinstall.
- Logged-in session (see CHAT-TC-001). Emulator: `APP_NO_RESET=true`.
- `DEVICE_UDID` set.

## Steps

1. Open Settings from Home (hamburger → avatar beside **New chat**).
2. Confirm the **Settings** title is visible in the app bar.
3. Confirm the in-app Back control is visible (top-left; it has no `content-desc`).
4. Confirm the **Information** icon is visible (top-right).
5. Tap Information. Confirm the app does not leave Settings (no crash).
6. Tap in-app Back. Confirm the home prompt is visible again.

## Expected Result

Title, Back, and Information are visible. Information is tappable. In-app Back returns to Home.

## Status

Not Run (automated 2026-08-14; confirm on device/emulator).

## Notes

Do not use `~Back` on this screen — live dump shows an unlabeled clickable Button beside `~Settings`. Information uses `~Information` for visibility; the tap target is a nested unlabeled Button (`clickable="true"`).
