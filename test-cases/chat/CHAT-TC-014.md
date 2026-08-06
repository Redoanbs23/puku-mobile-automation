# CHAT-TC-014: Long message input is accepted without crash or truncation

**Priority:** P2 (test-design-epic-chat-core.md coverage matrix)
**Linked automated test:** `CHAT-E2E-014` — designed, not yet automated
**Linked risk(s):** —

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- Must run on a physical device with a Google account already signed in at the OS level, with a standing OAuth grant already authorized for PUKU — per ADR-006 (docs/adr/ADR-006-oauth-consent-automation.md). On this project: device `RF8T802226Y`, account `editorpuku@gmail.com`.
- Requires a logged-in PUKU session (see CHAT-TC-001).
- Test message content must follow `docs/testing/test-message-convention.md` (R14) — the long text used must still be synthetic and non-sensitive.

## Steps

1. Ensure you're logged in to PUKU and on the home screen (see CHAT-TC-001).
2. Tap the chat input field.
3. Enter a long, convention-compliant synthetic message (e.g. `[PUKU-QA-TEST:CHAT-TC-014]` followed by several hundred characters of filler text).
4. Observe the input field's behavior as the text grows.
5. Confirm the app does not crash and the entered text is not visibly truncated or corrupted.

## Expected Result

The input field accepts the long message. The app does not crash, and the text is not silently truncated.

## Status

Not Run

## Notes

**Designed, not yet automated.** This scenario exists in `_bmad-output/test-artifacts/test-design-epic-chat-core.md`'s coverage matrix but has no corresponding automated test yet.

**Deliberately scoped to input only — do not send.** Stopping before the send control keeps this case free of R8 cost/ToS exposure. The scenario as designed tests input handling, not the send round-trip, so sending adds no coverage while adding real cost.

If automating this, note that `setValue()` does not work on this field — use `homeScreen.typeChatMessage()` / `typeRealText()` instead (see `src/utils/real-text-input.ts` and `ai-log/lessons-learned.md`). Long text via `adb shell input text` may also be slow or hit shell-length limits, which is worth confirming during implementation.
