# CHAT-TC-005: Switching model does not crash the app; selection persists for the session

**Priority:** P1 (test-design-epic-chat-core.md coverage matrix)
**Linked automated test:** `CHAT-E2E-005` (tests/specs/chat/model-switch.spec.ts)
**Linked risk(s):** R12, NFR-Reliability

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- Must run on a physical device with a Google account already signed in at the OS level, with a standing OAuth grant already authorized for PUKU — per ADR-006 (docs/adr/ADR-006-oauth-consent-automation.md). On this project: device `R58T90F5ALY` (Samsung Galaxy A13), account `editorpuku@gmail.com`.
- Requires a logged-in PUKU session (see CHAT-TC-001).
- At least two models must be available to the test account (see CHAT-TC-004 and R12 — if only one is available, this case cannot be executed and that is an account-state condition, not a failure).

## Steps

1. Ensure you're logged in to PUKU and on the home screen (see CHAT-TC-001).
2. Note which model is currently selected (the composer model chip content-desc).
3. Tap the model selector and choose a different model.
4. Confirm the app does not crash.
5. Confirm the selector now shows the newly chosen model (the chip content-desc updated).
6. Navigate away from the home screen (e.g. open the drawer → Chats) and return.
7. Confirm the newly chosen model is still selected (still on the chip).

## Expected Result

The app does not crash when switching models, the selector reflects the new choice, and that choice persists across in-session navigation.

## Status

Pass

## Notes

Automation status: Automated (passing) — `tests/specs/chat/model-switch.spec.ts`. Verified on the physical Samsung Galaxy A13 (`R58T90F5ALY`) on 2026-08-25: chip `puku-ai-2.7` → selected `Opus 4.8` → chip `Opus 4.8` → navigated Chats → returned → chip still `Opus 4.8`. No AI message is sent (R8-safe).

**Selection state is verified via the closed-state composer model chip's content-desc** (live-verified 2026-08-25). The open model dialog exposes no `selected`/`checked` indicator on any option — all render `selected="false"` — so the chip is the only reliable persistence signal. The automated test deliberately selects the model family that is NOT currently active, so it is valid whether the default is a puku-ai model or an Opus model (R12-tolerant).

"Persists for the session" is deliberately scoped to in-session navigation only — persistence across an app restart or backgrounding is a separate concern tracked by CHAT-TC-019 / R15, and should not be assumed covered here.
