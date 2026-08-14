# CHAT-TC-016: AI response latency observed and logged

**Priority:** P3 (test-design-epic-chat-core.md coverage matrix)
**Linked automated test:** `CHAT-E2E-016` — designed, not yet automated
**Linked risk(s):** R8, NFR-Performance

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- Must run on a physical device with a Google account already signed in at the OS level, with a standing OAuth grant already authorized for PUKU — per ADR-006 (docs/adr/ADR-006-oauth-consent-automation.md). On this project: physical phone NIC-LX2 (UDID `AS9J2U6120005225`, Android 15, 720x1604), account `editorpuku@gmail.com`.
- Requires a logged-in PUKU session (see CHAT-TC-001).
- Test message content must follow `docs/testing/test-message-convention.md` (R14).

## Steps

1. Ensure you're logged in to PUKU and on the home screen (see CHAT-TC-001).
2. Type a convention-compliant test message, e.g. `[PUKU-QA-TEST:CHAT-TC-016] Write a one-sentence fun fact about volcanoes.`
3. Note the time, tap the send control, and note the time when a response first appears.
4. Record the observed latency.

## Expected Result

**Informational only — there is no pass/fail threshold.** No SLA has ever been defined for this app (NFR-Performance is marked UNKNOWN in the test design, and no value has been guessed). The result of this case is a recorded number, not a verdict. It does not gate anything.

## Status

Not Run

## Notes

**Designed, not yet automated.** This scenario exists in `_bmad-output/test-artifacts/test-design-epic-chat-core.md`'s coverage matrix but has no corresponding automated test yet.

**R8 — real message, real account.** This case sends a real message to PUKU's live AI backend, with the same inference-cost and rate-limit exposure as CHAT-TC-002. Because its output is purely informational with no threshold to gate against, the cost/benefit of running it repeatedly is especially poor — the test design deliberately places it in the least frequent execution tier for exactly this reason. Do not run it in a loop to "get a better average."

If a meaningful latency baseline is ever actually needed, that is a reason to first define an NFR threshold worth measuring against — not a reason to run this case more often.
