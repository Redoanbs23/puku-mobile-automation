# CHAT-TC-013: Code section opens without crashing

**Priority:** P2 (test-design-epic-chat-core.md coverage matrix)
**Linked automated test:** `CHAT-E2E-013` (tests/specs/chat/code-section.spec.ts)
**Linked risk(s):** R13

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- Must run on a physical device with a Google account already signed in at the OS level, with a standing OAuth grant already authorized for PUKU — per ADR-006 (docs/adr/ADR-006-oauth-consent-automation.md). On this project: device `RF8T802226Y`, account `editorpuku@gmail.com`.
- Requires a logged-in PUKU session (see CHAT-TC-001).

## Steps

1. Ensure you're logged in to PUKU and on the home screen (see CHAT-TC-001).
2. Tap the hamburger menu icon (top-left) to open the drawer.
3. Tap "Code".
4. Observe the resulting screen.

## Expected Result

The Code section opens and the app does not crash.

## Status

Pass

## Notes

Automation status: Automated (passing) — `tests/specs/chat/code-section.spec.ts`. Requires `DEVICE_UDID` and, on the emulator, `APP_NO_RESET=true` (self-skips otherwise). Verified against the emulator on 2026-08-07.

**Smoke-level only, deliberately** — same R13 reasoning as CHAT-TC-011. Live exploration on 2026-08-07 found this section renders a "Code" header, a "No sessions found" empty state, a "New Session" button, a "Refresh sessions" control, and a labeled "Back" button. Do not extend into deeper assertions before a dedicated exploration pass.
