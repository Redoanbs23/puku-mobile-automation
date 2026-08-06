# CHAT-TC-006: "New chat" starts a fresh session

**Priority:** P1 (test-design-epic-chat-core.md coverage matrix)
**Linked automated test:** `CHAT-E2E-006` — designed, not yet automated
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

Not Run

## Notes

**Designed, not yet automated.** This scenario exists in `_bmad-output/test-artifacts/test-design-epic-chat-core.md`'s coverage matrix but has no corresponding automated test yet.

Note that a fresh app launch already lands on this same empty prompt state (observed repeatedly during exploration), so verifying "New chat" meaningfully requires starting from a session that already has visible conversation content — otherwise the before/after states are indistinguishable and the case proves nothing. Sending a message first to create that content would make this a cost-triggering scenario under R8; an alternative is to run it immediately after CHAT-TC-002 or CHAT-TC-019, reusing conversation content that already exists rather than generating more.
