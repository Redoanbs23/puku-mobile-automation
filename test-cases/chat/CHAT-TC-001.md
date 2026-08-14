# CHAT-TC-001: Home screen renders post-login without crash

**Priority:** P0 (test-design-epic-chat-core.md coverage matrix)
**Linked automated test:** `CHAT-E2E-001` (tests/specs/chat/home-screen.spec.ts)
**Linked risk(s):** —

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- Must run on a physical device with a Google account already signed in at the OS level, with a standing OAuth grant already authorized for PUKU — per ADR-006 (docs/adr/ADR-006-oauth-consent-automation.md). On this project: physical phone NIC-LX2 (UDID `AS9J2U6120005225`, Android 15, 720x1604), account `editorpuku@gmail.com`.
- Requires a logged-in PUKU session — either already logged in, or established first by completing the Google sign-in flow (Continue with Google → Authorize Puku App, see AUTH-TC-015).
- Not meaningful on CI or a fresh emulator, for the same reasons as the auth-login epic's device-dependent cases.

## Steps

1. Ensure you're logged in to PUKU (launch the app; if the login screen appears, complete the Google sign-in flow first).
2. Observe the home screen.
3. Confirm the "How can i help you today!" heading is visible.
4. Confirm the chat input field (showing placeholder text "Chat with Puku...") is visible.
5. Confirm a model selector is visible.

## Expected Result

The home screen renders without the app crashing. The "How can i help you today!" heading, the chat input field, and a model selector are all visible.

## Status

Pass

## Notes

Automation status: Automated (passing) — `tests/specs/chat/home-screen.spec.ts`. Requires the `DEVICE_UDID` environment variable set to run (the test skips itself otherwise). Verified against physical device `RF8T802226Y` on 2026-08-06.

The model selector's exact label is not asserted by automation and shouldn't be treated as a fixed expectation here either — it drifts as PUKU updates its default model (observed as "puku-ai-2.7" on 2026-08-04, then "puku-ai-2.8" by this epic's kickoff on 2026-08-06). Only confirm that *some* model-selector element is present, not a specific version string.
