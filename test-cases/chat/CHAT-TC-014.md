# CHAT-TC-014: Long message input is accepted without crash or truncation

**Priority:** P2 (test-design-epic-chat-core.md coverage matrix)
**Linked automated test:** `CHAT-E2E-014` — spec exists (tests/specs/chat/long-message.spec.ts) but **automation blocked**
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

**Blocked — Automation Blocker** (documented 2026-08-13). The scenario itself is not an application defect; the blocker is the automation read-back path (see Notes).

## Notes

**Blocked — Automation Blocker (2026-08-13).** The app and the typing path work correctly: the chat input accepts the full 328-char message (raw `adb shell uiautomator dump` verifies all 328 chars 5/5 on the physical A13), and `typeRealText()` types it without truncation. The blocker is the **read-back path**:

1. **Appium/WebdriverIO cannot read the full value.** `getText()`, `getAttribute('text')`, and `getPageSource()` all expose a capped accessibility value of **311 chars** for the populated Flutter `EditText` (confirmed via a temporary probe spec on the A13, 2026-08-13).
2. **Raw ADB dump cannot run during the test session.** The one mechanism that reads the full 328 chars — `adb shell uiautomator dump` — returns a non-zero exit when invoked from inside a running Appium session (confirmed 2/2 runs). The same command succeeds standalone (Appium stopped), proving the failure is **framework contention** (Appium's UiAutomator2 driver vs. a concurrent `uiautomator dump`), not an app defect or code bug.

Because the two viable reads are mutually exclusive under the test, the exact 328-character round-trip assertion cannot be validated through automation at this time. The spec `tests/specs/chat/long-message.spec.ts` remains (with the corrected 328-char payload and exact assertion), but **cannot pass** until the read-back path is unblocked.

**Locator finding (2026-08-13):** the hint-based `chatInputField` locator (`@hint="Chat with Puku..."`) only matches while the field is empty — Flutter removes the `hintText` once text is present, so the `@hint` attribute disappears from the accessibility tree. Confirmed live on the A13: after typing, the EditText node has `text="..."` and no hint attribute, and `getText()` on the hint-based locator fails with "element wasn't found". Added `homeScreen.chatInputFieldWithText` (class-only `//android.widget.EditText`) for reading text back after typing. This is the same root cause as CHAT-E2E-017's known "chatInputField not found" failure.

**Deliberately scoped to input only — do not send.** Stopping before the send control keeps this case free of R8 cost/ToS exposure. The scenario as designed tests input handling, not the send round-trip, so sending adds no coverage while adding real cost.

**Typing note:** `setValue()` does not work on this field — uses `homeScreen.typeChatMessage()` / `typeRealText()` (see `src/utils/real-text-input.ts` and `ai-log/lessons-learned.md`). Long text via `adb shell input text` was confirmed to work for the 328-char payload without hitting shell-length limits.
