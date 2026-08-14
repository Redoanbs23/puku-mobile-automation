# CHAT-TC-017: Device rotation on the home/chat screen does not crash or lose state

**Priority:** P3 (test-design-epic-chat-core.md coverage matrix)
**Linked automated test:** `CHAT-E2E-017` — designed, not yet automated
**Linked risk(s):** —

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- Must run on a physical device with a Google account already signed in at the OS level, with a standing OAuth grant already authorized for PUKU — per ADR-006 (docs/adr/ADR-006-oauth-consent-automation.md). On this project: physical phone NIC-LX2 (UDID `AS9J2U6120005225`, Android 15, 720x1604), account `editorpuku@gmail.com`.
- Requires a logged-in PUKU session (see CHAT-TC-001).
- Device auto-rotate must be enabled, otherwise rotation will not take effect.

## Steps

1. Ensure you're logged in to PUKU and on the home screen (see CHAT-TC-001).
2. Type some convention-compliant text into the chat input, but do not send it.
3. Rotate the device to landscape.
4. Confirm the app does not crash and the screen renders in the new orientation.
5. Confirm the text typed in step 2 is still present in the input.
6. Rotate back to portrait and confirm the same.

## Expected Result

The app does not crash on rotation in either direction, renders correctly in both orientations, and preserves unsent input text across the rotation.

## Status

Not Run

## Notes

**Designed, not yet automated.** This scenario exists in `_bmad-output/test-artifacts/test-design-epic-chat-core.md`'s coverage matrix but has no corresponding automated test yet. Mirrors `LOGIN-E2E-014`, which covers the same concern for the login screen and is likewise still a stub.

Scoped to unsent input rather than conversation content, so it does not send a message and carries no R8 exposure. Note this is a *different* persistence question from CHAT-TC-019 (backgrounding/restart) — rotation is an Activity configuration change, backgrounding is a lifecycle transition, and an app can handle one correctly while failing the other.

Whether PUKU even supports landscape is unconfirmed; if the app is portrait-locked, that is a valid finding and this case becomes not-applicable rather than failing.
