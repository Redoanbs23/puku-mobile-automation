# CHAT-TC-005: Switching model does not crash the app; selection persists for the session

**Priority:** P1 (test-design-epic-chat-core.md coverage matrix)
**Linked automated test:** `CHAT-E2E-005` — designed, not yet automated
**Linked risk(s):** R12, NFR-Reliability

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- Must run on a physical device with a Google account already signed in at the OS level, with a standing OAuth grant already authorized for PUKU — per ADR-006 (docs/adr/ADR-006-oauth-consent-automation.md). On this project: device `RF8T802226Y`, account `editorpuku@gmail.com`.
- Requires a logged-in PUKU session (see CHAT-TC-001).
- At least two models must be available to the test account (see CHAT-TC-004 and R12 — if only one is available, this case cannot be executed and that is an account-state condition, not a failure).

## Steps

1. Ensure you're logged in to PUKU and on the home screen (see CHAT-TC-001).
2. Note which model is currently selected.
3. Tap the model selector and choose a different model.
4. Confirm the app does not crash.
5. Confirm the selector now shows the newly chosen model.
6. Navigate away from the home screen (e.g. open the drawer) and return.
7. Confirm the newly chosen model is still selected.

## Expected Result

The app does not crash when switching models, the selector reflects the new choice, and that choice persists across in-session navigation.

## Status

Not Run

## Notes

**Designed, not yet automated.** This scenario exists in `_bmad-output/test-artifacts/test-design-epic-chat-core.md`'s coverage matrix but has no corresponding automated test yet.

"Persists for the session" is deliberately scoped to in-session navigation only — persistence across an app restart or backgrounding is a separate concern tracked by CHAT-TC-019 / R15, and should not be assumed covered here.
