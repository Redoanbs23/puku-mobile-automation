# CHAT-TC-004: Model selector opens and lists available models

**Priority:** P1 (test-design-epic-chat-core.md coverage matrix)
**Linked automated test:** `CHAT-E2E-004` — designed, not yet automated
**Linked risk(s):** R12

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- Must run on a physical device with a Google account already signed in at the OS level, with a standing OAuth grant already authorized for PUKU — per ADR-006 (docs/adr/ADR-006-oauth-consent-automation.md). On this project: device `RF8T802226Y`, account `editorpuku@gmail.com`.
- Requires a logged-in PUKU session (see CHAT-TC-001).

## Steps

1. Ensure you're logged in to PUKU and on the home screen (see CHAT-TC-001).
2. Tap the model selector in the chat input area.
3. Observe the list of models presented.

## Expected Result

The model selector opens and presents a list of selectable models.

## Status

Not Run

## Notes

**Designed, not yet automated.** This scenario exists in `_bmad-output/test-artifacts/test-design-epic-chat-core.md`'s coverage matrix but has no corresponding automated test yet — no `CHAT-E2E-004` spec exists in `tests/specs/chat/`.

Do not treat the specific model names in the test design (`puku-ai-2.8`, `Opus 4.8`) as a fixed expectation. The available set drifts — the selector was observed as `puku-ai-2.7` on 2026-08-04 and `puku-ai-2.8` by 2026-08-06. Per R12, model availability may also be gated by the test account's plan tier ("Power" as observed), so a missing model may be an account-state condition rather than an app defect. Confirm the account's current tier before filing any discrepancy as a bug.
