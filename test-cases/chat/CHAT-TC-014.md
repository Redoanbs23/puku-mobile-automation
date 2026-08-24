# CHAT-TC-014: Long message input is accepted without crash or truncation

**Priority:** P2 (test-design-epic-chat-core.md coverage matrix)
**Linked automated test:** `CHAT-E2E-014` — spec exists (tests/specs/chat/long-message.spec.ts), assertion re-scoped (mentor-approved, 2026-08-14)
**Linked risk(s):** —

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- Must run on a physical device with a Google account already signed in at the OS level, with a standing OAuth grant already authorized for PUKU — per ADR-006 (docs/adr/ADR-006-oauth-consent-automation.md). On this project: device `R58T90F5ALY`, account `editorpuku@gmail.com`.
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

Pass

**Assertion re-scoped (mentor-approved, 2026-08-14).** The scenario is not an application defect; the re-scope is due to the automation read-back path (see Notes). The test now asserts what the supported stack can reliably observe.

## Notes

**Assertion re-scope (2026-08-14).** The app and the typing path work correctly: the chat input accepts the full 328-char message (raw `adb shell uiautomator dump` verifies all 328 chars 5/5 on the physical A13), and `typeRealText()` types it without truncation. The re-scope is required by the **read-back path**:

1. **Appium/WebdriverIO cannot read the full value.** `getText()`, `getAttribute('text')`, and `getPageSource()` all expose a capped accessibility value of **~299–311 chars** for the populated Flutter `EditText` (confirmed via a temporary probe spec on the A13, 2026-08-13).
2. **Raw ADB dump cannot run during the test session.** The one mechanism that reads the full 328 chars — `adb shell uiautomator dump` — returns a non-zero exit when invoked from inside a running Appium session (confirmed 2/2 runs). The same command succeeds standalone (Appium stopped), proving the failure is **framework contention** (Appium's UiAutomator2 driver vs. a concurrent `uiautomator dump`), not an app defect or code bug.

**Re-scoped assertion (Candidate A, mentor-approved):** after typing the full 328-char payload, the test asserts:
- **No crash** — the populated field (`chatInputFieldWithText`) is displayed (primary signal; a crash would remove the EditText node) and the home screen heading (`chatPromptHeading`) is displayed (secondary signal; its presence in the populated state was observed in a single Day 2 probe page-source snapshot, not multi-run confirmed).
- **Non-empty** entered text.
- **Exact prefix start** — the text begins with `[PUKU-QA-TEST:CHAT-E2E-014]` (proves the full 328-char payload was typed and the start is uncorrupted).

**Accepted known limitation:** this test **cannot detect app-side tail truncation** of the payload beyond what Appium's read path exposes (~299–311 of 328 chars). This is a **framework/read-path limitation, not a demonstrated app defect** — the 5/5 standalone ADB dump evidence shows the app holds all 328 chars. The exact 328-char round-trip is not verifiable through the supported automation stack.

**Locator finding (2026-08-13):** the hint-based `chatInputField` locator (`@hint="Chat with Puku..."`) only matches while the field is empty — Flutter removes the `hintText` once text is present, so the `@hint` attribute disappears from the accessibility tree. Confirmed live on the A13: after typing, the EditText node has `text="..."` and no hint attribute, and `getText()` on the hint-based locator fails with "element wasn't found". Added `homeScreen.chatInputFieldWithText` (class-only `//android.widget.EditText`) for reading text back after typing. This is the same root cause as CHAT-E2E-017's known "chatInputField not found" failure.

**Deliberately scoped to input only — do not send.** Stopping before the send control keeps this case free of R8 cost/ToS exposure. The scenario as designed tests input handling, not the send round-trip, so sending adds no coverage while adding real cost.

**Typing note:** `setValue()` does not work on this field — uses `homeScreen.typeChatMessage()` / `typeRealText()` (see `src/utils/real-text-input.ts` and `ai-log/lessons-learned.md`). Long text via `adb shell input text` was confirmed to work for the 328-char payload without hitting shell-length limits.
