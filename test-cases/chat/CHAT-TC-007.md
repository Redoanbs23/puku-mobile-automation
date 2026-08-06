# CHAT-TC-007: Empty message cannot be sent

**Priority:** P1 (test-design-epic-chat-core.md coverage matrix)
**Linked automated test:** `CHAT-E2E-007` — designed, not yet automated
**Linked risk(s):** —

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- Must run on a physical device with a Google account already signed in at the OS level, with a standing OAuth grant already authorized for PUKU — per ADR-006 (docs/adr/ADR-006-oauth-consent-automation.md). On this project: device `RF8T802226Y`, account `editorpuku@gmail.com`.
- Requires a logged-in PUKU session (see CHAT-TC-001).

## Steps

1. Ensure you're logged in to PUKU and on the home screen (see CHAT-TC-001).
2. Leave the chat input field empty (do not type anything).
3. Observe the chat input area.
4. If a send control is present, attempt to tap it.

## Expected Result

No message is sent. Either no send control is presented at all while the input is empty, or tapping it has no effect.

## Status

Not Run

## Notes

**Designed, not yet automated.** This scenario exists in `_bmad-output/test-artifacts/test-design-epic-chat-core.md`'s coverage matrix but has no corresponding automated test yet.

Live exploration on 2026-08-06 found that the send control **does not render at all** while the chat input is empty — it only appears once text is present (see `ai-log/lessons-learned.md`). So the likely-correct expected result here is "no send control exists," not "send control is present but disabled." The step above is worded to accept either, since only the empty-state absence has been directly confirmed.

This case does not trigger a real message send, so it carries no R8 cost exposure.
