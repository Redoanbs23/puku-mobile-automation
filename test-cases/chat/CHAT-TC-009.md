# CHAT-TC-009: "Chats" history list opens and renders

**Priority:** P1 (test-design-epic-chat-core.md coverage matrix)
**Linked automated test:** `CHAT-E2E-009` (tests/specs/chat/chat-history.spec.ts)
**Linked risk(s):** R10

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- Must run on a physical device with a Google account already signed in at the OS level, with a standing OAuth grant already authorized for PUKU — per ADR-006 (docs/adr/ADR-006-oauth-consent-automation.md). On this project: physical phone NIC-LX2 (UDID `AS9J2U6120005225`, Android 15, 720x1604), account `editorpuku@gmail.com`.
- Requires a logged-in PUKU session (see CHAT-TC-001).

## Steps

1. Ensure you're logged in to PUKU and on the home screen (see CHAT-TC-001).
2. Tap the hamburger menu icon (top-left) to open the drawer.
3. Tap "Chats".
4. Observe the resulting screen.

## Expected Result

The chat history list opens and renders without the app crashing.

## Status

Pass

## Notes

Automation status: Automated (passing) — `tests/specs/chat/chat-history.spec.ts`. Requires `DEVICE_UDID` and, on the emulator, `APP_NO_RESET=true` (self-skips otherwise). Verified against the emulator on 2026-08-07.

Deliberately scoped to "renders without crashing" only — **do not** assert on the specific contents of the history list. Per R10, test-generated messages accumulate indefinitely in the shared account's history with no known deletion mechanism, so the list's contents are non-deterministic and will drift over time as testing continues. Any test-authored messages visible here should be identifiable by the `[PUKU-QA-TEST:...]` prefix (`docs/testing/test-message-convention.md`).
