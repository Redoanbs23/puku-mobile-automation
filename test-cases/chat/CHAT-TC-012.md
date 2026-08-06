# CHAT-TC-012: Artifacts section opens without crashing

**Priority:** P2 (test-design-epic-chat-core.md coverage matrix)
**Linked automated test:** `CHAT-E2E-012` — designed, not yet automated
**Linked risk(s):** R13

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- Must run on a physical device with a Google account already signed in at the OS level, with a standing OAuth grant already authorized for PUKU — per ADR-006 (docs/adr/ADR-006-oauth-consent-automation.md). On this project: device `RF8T802226Y`, account `editorpuku@gmail.com`.
- Requires a logged-in PUKU session (see CHAT-TC-001).

## Steps

1. Ensure you're logged in to PUKU and on the home screen (see CHAT-TC-001).
2. Tap the hamburger menu icon (top-left) to open the drawer.
3. Tap "Artifacts".
4. Observe the resulting screen.

## Expected Result

The Artifacts section opens and the app does not crash.

## Status

Not Run

## Notes

**Designed, not yet automated.** This scenario exists in `_bmad-output/test-artifacts/test-design-epic-chat-core.md`'s coverage matrix but has no corresponding automated test yet.

**Smoke-level only, deliberately** — same R13 reasoning as CHAT-TC-011. This section is unexplored; do not extend into deeper assertions before a dedicated exploration pass. Record what's actually on screen when executing manually.
