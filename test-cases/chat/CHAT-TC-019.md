# CHAT-TC-019: Conversation survives app backgrounding and resume

**Priority:** P0 (test-design-epic-chat-core.md coverage matrix)
**Linked automated test:** `CHAT-E2E-019` — designed, not yet automated
**Linked risk(s):** R15

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- Must run on a physical device with a Google account already signed in at the OS level, with a standing OAuth grant already authorized for PUKU — per ADR-006 (docs/adr/ADR-006-oauth-consent-automation.md). On this project: physical phone NIC-LX2 (UDID `AS9J2U6120005225`, Android 15, 720x1604), account `editorpuku@gmail.com`.
- Requires a logged-in PUKU session (see CHAT-TC-001).
- Test message content must follow `docs/testing/test-message-convention.md` (R14).

## Steps

1. Ensure you're logged in to PUKU and on the home screen (see CHAT-TC-001).
2. Send a convention-compliant test message, e.g. `[PUKU-QA-TEST:CHAT-TC-019] What is 2 + 2?`, and wait for a response to appear.
3. Background the app (tap the device Home button, or use the app switcher to move away).
4. Wait a few seconds.
5. Return to the app (via the app switcher or launcher icon).
6. Observe whether the conversation from step 2 is still present.

## Expected Result

After resuming, the conversation sent in step 2 is still visible. The message and its response have not been silently lost, and the app has not reset to an empty chat state.

## Status

Not Run

## Notes

**Designed, not yet automated.** This scenario was added to `_bmad-output/test-artifacts/test-design-epic-chat-core.md` on 2026-08-06 alongside R15; no corresponding automated test exists yet.

**Why this is P0 despite being newly added.** `AUTH-E2E-015`'s `noReset:true` only ever proved that the *login session* survives an Activity restart — nothing in either epic had tested whether *conversation content* survives. For a chat product, silent loss of an in-progress conversation is a trust-destroying failure, and backgrounding is a near-certain real-world interaction, not an edge case. Note this is a genuinely different question from the narrower "chat-history persistence correctness" item listed under Not in Scope in the test design, which concerns exact content fidelity gated on R10's cleanup investigation.

**R8 — real message, real account.** Step 2 sends a real message to PUKU's live AI backend, with the same inference-cost and rate-limit exposure as CHAT-TC-002. Do not repeat the send while experimenting with backgrounding technique — if you need to retry the backgrounding step, resume from the existing conversation rather than sending a fresh message.

**Scope boundary.** This case tests backgrounding/resume only. A full process-kill (force-stop) or device-reboot variant is a *separate* concern — an app can survive one and not the other — and is tracked as a candidate follow-on scenario in R15's residual-risk note, not covered here.
