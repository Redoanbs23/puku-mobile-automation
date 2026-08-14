# CHAT-TC-008: Network dropped mid-message-send produces a graceful error, not a crash

**Priority:** P1 — **pending evidence.** Per `test-design-epic-chat-core.md`, this scenario's priority cannot be responsibly assessed until the actual failure mode (graceful error vs. crash/hang) has been observed once, carefully and R8-mindfully. If it crashes or hangs, it likely belongs at P0.
**Linked automated test:** `CHAT-E2E-008` — designed, not yet automated
**Linked risk(s):** R8, R9, NFR-Reliability

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- Must run on a physical device with a Google account already signed in at the OS level, with a standing OAuth grant already authorized for PUKU — per ADR-006 (docs/adr/ADR-006-oauth-consent-automation.md). On this project: physical phone NIC-LX2 (UDID `AS9J2U6120005225`, Android 15, 720x1604), account `editorpuku@gmail.com`.
- Requires a logged-in PUKU session (see CHAT-TC-001).
- Test message content must follow `docs/testing/test-message-convention.md` (R14).
- A way to disable connectivity mid-request (airplane mode toggle, or `adb shell svc wifi disable` / `svc data disable`).

## Steps

1. Ensure you're logged in to PUKU and on the home screen (see CHAT-TC-001).
2. Type a convention-compliant test message, e.g. `[PUKU-QA-TEST:CHAT-TC-008] Say hello in one word.`
3. Tap the send control.
4. Immediately disable network connectivity, before a response returns.
5. Observe the app's behavior.

## Expected Result

The app surfaces a recoverable error state (e.g. a failure indication or retry affordance) and remains responsive. It does not crash, and does not hang in a state requiring a force-quit.

## Status

Not Run

## Notes

**Designed, not yet automated.** This scenario exists in `_bmad-output/test-artifacts/test-design-epic-chat-core.md`'s coverage matrix but has no corresponding automated test yet.

**R8 — real message, real account.** This case sends a real message to PUKU's live AI backend on the shared test account before the network is cut, so it carries the same inference-cost and rate-limit exposure as CHAT-TC-002. Do not run it repeatedly while experimenting with the timing of the network cut. If the first attempt mistimes the cut (response returns before connectivity drops), treat that as a data point and stop rather than immediately retrying — the R8 gate applies to manual execution exactly as it does to automation.

Executing this case is also what unblocks the priority question above. Record precisely what the app does, since that observation is the deciding input for whether this stays P1 or moves to P0.
