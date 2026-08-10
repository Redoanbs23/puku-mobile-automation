# CHAT-TC-006: "New chat" starts a fresh session

**Priority:** P1 (test-design-epic-chat-core.md coverage matrix)
**Linked automated test:** `CHAT-E2E-006` (tests/specs/chat/new-chat.spec.ts)
**Linked risk(s):** —

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- Must run on a physical device with a Google account already signed in at the OS level, with a standing OAuth grant already authorized for PUKU — per ADR-006 (docs/adr/ADR-006-oauth-consent-automation.md). On this project: device `RF8T802226Y`, account `editorpuku@gmail.com`.
- Requires a logged-in PUKU session (see CHAT-TC-001).

## Steps

1. Ensure you're logged in to PUKU and on the home screen (see CHAT-TC-001).
2. Tap the hamburger menu icon (top-left) to open the drawer.
3. Tap "New chat".
4. Observe the resulting screen.

## Expected Result

A fresh chat session is presented — the "How can i help you today!" prompt state is shown, with no prior conversation content displayed.

## Status

Pass (weaker than full scope — see Notes)

## Notes

Automation status: Automated (passing) — `tests/specs/chat/new-chat.spec.ts`. Requires `DEVICE_UDID` and, on the emulator, `APP_NO_RESET=true` (self-skips otherwise). Verified against the emulator on 2026-08-07.

**This automation is deliberately weaker than the scenario's full intent, and that gap is still open.** It confirms "New chat" doesn't crash and lands on the expected empty-prompt screen — it does **not** confirm it resets away from visible prior content, which is the more meaningful half of "starts a fresh session." Live exploration on 2026-08-07 found that reusing existing conversation content (as this note originally suggested) doesn't work as a substitute the way expected: opening a past conversation from the Chats history list routes to a separate detail screen (its own Back control and an "Incognito chat" toggle, confirmed live — no hamburger trigger there), not the home screen's own inline chat state. Proving the reset behavior properly still requires either a fresh message send (R8 cost) or further exploration of whether a past conversation can be made the home screen's active session. Left as a known gap rather than worked around.
