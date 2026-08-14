# CHAT-TC-004: Model selector opens and lists available models

**Priority:** P1 (test-design-epic-chat-core.md coverage matrix)
**Linked automated test:** `CHAT-E2E-004` (tests/specs/chat/model-selector.spec.ts)
**Linked risk(s):** R12

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- Must run on a physical device with a Google account already signed in at the OS level, with a standing OAuth grant already authorized for PUKU — per ADR-006 (docs/adr/ADR-006-oauth-consent-automation.md). On this project: physical phone NIC-LX2 (UDID `AS9J2U6120005225`, Android 15, 720x1604), account `editorpuku@gmail.com`.
- Requires a logged-in PUKU session (see CHAT-TC-001).

## Steps

1. Ensure you're logged in to PUKU and on the home screen (see CHAT-TC-001).
2. Tap the model selector in the chat input area.
3. Observe the list of models presented.

## Expected Result

The model selector opens and presents a list of selectable models.

## Status

Pass

## Notes

Automation status: Automated (passing) — `tests/specs/chat/model-selector.spec.ts`. Requires `DEVICE_UDID` and, on the emulator, `APP_NO_RESET=true` (self-skips otherwise). Verified against the emulator on 2026-08-07.

Do not treat the specific model names in the test design (`puku-ai-2.8`, `Opus 4.8`) as a fixed expectation — the automated test deliberately does not assert exact model names either, only that the dialog opens and an option from each currently-known model family is present. The available set drifts, and it's broader than a simple version bump: live exploration on 2026-08-07 found `puku-ai-2.7`, `puku-ai-2.8`, and `Opus 4.8` all listed as separate, concurrently-available options, not one replacing another. Per R12, model availability may also be gated by the test account's plan tier ("Power" as observed), so a missing model may be an account-state condition rather than an app defect. Confirm the account's current tier before filing any discrepancy as a bug.
