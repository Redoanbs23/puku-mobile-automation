# CHAT-TC-002: Sending a message produces a visible response

**Priority:** P0 (test-design-epic-chat-core.md coverage matrix)
**Linked automated test:** `CHAT-E2E-002` (tests/specs/chat/send-message.spec.ts)
**Linked risk(s):** R8, R9

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- Must run on a physical device with a Google account already signed in at the OS level, with a standing OAuth grant already authorized for PUKU — per ADR-006 (docs/adr/ADR-006-oauth-consent-automation.md). On this project: physical phone NIC-LX2 (UDID `AS9J2U6120005225`, Android 15, 720x1604), account `editorpuku@gmail.com`.
- Requires a logged-in PUKU session (see CHAT-TC-001).
- Test message content must follow `docs/testing/test-message-convention.md` (R14) — synthetic, non-sensitive, tagged with the `[PUKU-QA-TEST:...]` prefix. Never type real PII, secrets, or sensitive content.
- Not meaningful on CI or a fresh emulator, for the same reasons as the auth-login epic's device-dependent cases.

## Steps

1. Ensure you're logged in to PUKU and on the home screen (see CHAT-TC-001).
2. Tap the chat input field and type a convention-compliant test message, e.g. `[PUKU-QA-TEST:CHAT-TC-002] What is 2 + 2?`
3. Tap the send control.
4. Observe the screen after sending.

## Expected Result

A response bubble appears, distinct from the message you sent. Per R9, this case does not check the response's content — only that a response renders is required.

## Status

Pass

## Notes

Automation status: Automated (passing) — `tests/specs/chat/send-message.spec.ts`. Requires the `DEVICE_UDID` environment variable set to run (the test skips itself otherwise). Verified against physical device `RF8T802226Y` on 2026-08-06, run exactly once against the live account per R8's single-execution gate (see test-design-epic-chat-core.md).

**R8 — real message, real account, don't repeat this carelessly.** Like the automated test, executing this case sends a real message to PUKU's live AI backend on the shared test account (`editorpuku@gmail.com`) — real inference cost, and a small but non-zero chance of triggering rate-limiting that could affect other testing on this account. If running this manually, use a fresh, convention-compliant message each time (`docs/testing/test-message-convention.md`) and don't re-run it more than necessary to confirm the result — the same reasoning that keeps the automated test to a single execution per invocation applies here too.
