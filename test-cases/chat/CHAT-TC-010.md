# CHAT-TC-010: Settings toggles respond without crashing

**Priority:** P1 (test-design-epic-chat-core.md coverage matrix)
**Linked automated test:** `CHAT-E2E-010` — designed, not yet automated
**Linked risk(s):** —

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- Must run on a physical device with a Google account already signed in at the OS level, with a standing OAuth grant already authorized for PUKU — per ADR-006 (docs/adr/ADR-006-oauth-consent-automation.md). On this project: device `RF8T802226Y`, account `editorpuku@gmail.com`.
- Requires a logged-in PUKU session (see CHAT-TC-001).

## Steps

1. Ensure you're logged in to PUKU and on the home screen (see CHAT-TC-001).
2. Tap the hamburger menu icon (top-left), then tap the profile avatar to open Settings.
3. Tap the "Haptic feedback" toggle.
4. Confirm the app does not crash and the toggle's visible state changes.
5. Tap the "Notifications" toggle.
6. Confirm the app does not crash and the toggle's visible state changes.

## Expected Result

Both toggles respond to being tapped, their visible state reflects the change, and the app does not crash.

## Status

Not Run

## Notes

**Designed, not yet automated.** This scenario exists in `_bmad-output/test-artifacts/test-design-epic-chat-core.md`'s coverage matrix but has no corresponding automated test yet — `src/screens/settings.screen.ts` does not currently model either toggle.

This case leaves the account's settings in a modified state. Either toggle both back afterward, or accept the drift — but be aware that "Notifications" in particular may have effects beyond the app (system-level notification permissions), so prefer restoring it.
