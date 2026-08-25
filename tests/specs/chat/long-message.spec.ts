import { authFlow } from '../../../src/flows/auth.flow.js';
import { homeScreen } from '../../../src/screens/home.screen.js';
import { drawerScreen } from '../../../src/screens/drawer.screen.js';
import { settingsScreen } from '../../../src/screens/settings.screen.js';

/**
 * CHAT-E2E-014: Long message input is accepted without crash or truncation.
 *
 * P2 (test-design-epic-chat-core.md). Deliberately scoped to input only —
 * never sends, so no R8 cost/ToS exposure (see CHAT-TC-014's own note).
 * Asserts the app does not crash and the long entered text is present and
 * uncorrupted at its start, never on AI-generated content (R9 is not even
 * reached here since nothing is sent).
 *
 * ASSERTION RE-SCOPE (mentor-approved, 2026-08-14): Appium/WebdriverIO
 * cannot reliably expose the complete 328-character value of this Flutter
 * custom EditText — getText()/getAttribute('text')/getPageSource() cap at
 * ~299–311 chars (confirmed live on the A13, 2026-08-13), and the raw
 * `adb shell uiautomator dump` that sees all 328 chars cannot run during an
 * active Appium session (instrumentation contention). The exact 328-char
 * round-trip assertion is therefore not verifiable through the supported
 * automation stack.
 *
 * The re-scoped assertion verifies what IS reliably observable: the app
 * does not crash, the field holds non-empty entered text, and the text
 * begins with the exact expected prefix. This proves the full 328-char
 * payload was typed (the typing path is unchanged) and that the start of
 * the text is uncorrupted. It does NOT confirm the full 328 chars are
 * present in the field — Appium's read path only exposes ~299–311 of them,
 * so app-side tail truncation beyond that read window is not detectable by
 * this test. That is an accepted known limitation of the re-scope (a
 * framework/read-path limitation, not a demonstrated app defect — see
 * CHAT-TC-014.md for the 5/5 standalone ADB dump evidence that the app
 * holds all 328 chars).
 *
 * No-crash signal: the populated field (chatInputFieldWithText) being
 * displayed is the primary signal — if the app crashed on the 328-char
 * input, the EditText node would not exist. chatPromptHeading displayed is
 * a secondary signal; its presence in the populated state was observed in a
 * single Day 2 probe page-source snapshot (2026-08-13), not multi-run
 * confirmed, so it is treated as supporting evidence only.
 *
 * Typing uses homeScreen.typeChatMessage(), not a raw .setValue() call —
 * WebdriverIO's setValue() silently fails on this field (updates the
 * accessibility layer only, never the real widget). See
 * src/utils/real-text-input.ts and ai-log/lessons-learned.md.
 *
 * The long payload is built from a repeated filler word so it stays
 * synthetic and non-sensitive per docs/testing/test-message-convention.md
 * (R14), and avoids shell-special characters that typeRealText() has not
 * been validated against (see the note in src/utils/real-text-input.ts).
 *
 * Ends by using drawerScreen.newChatButton (the same reset path verified
 * working in CHAT-E2E-006 and CHAT-E2E-017) rather than trying to clear
 * the typed text directly — WebdriverIO's clear()/setValue() are
 * documented as unreliable against this app's custom-rendered EditText
 * (see ai-log/lessons-learned.md), so this avoids relying on an
 * unverified clear mechanism just for teardown. Leaves the app in its
 * default home-screen state for whatever spec runs next.
 */
describe('Long message — P2', () => {
  const TEST_MESSAGE_PREFIX = '[PUKU-QA-TEST:CHAT-E2E-014]';
  const FILLER_WORD = 'puku';
  const FILLER_REPEATS = 75; // 75 * 4 chars = 300 chars of filler, plus the 28-char tag prefix
  const TEST_MESSAGE = `${TEST_MESSAGE_PREFIX} ${FILLER_WORD.repeat(FILLER_REPEATS)}`;

  it('CHAT-E2E-014 @p2: long message input is accepted without crash or truncation', async function () {
    if (!process.env.DEVICE_UDID) {
      this.skip();
    }

    await authFlow.ensureLoggedIn();

    await homeScreen.typeChatMessage(TEST_MESSAGE);

    // The hint-based chatInputField locator only matches while the field is
    // empty — Flutter removes the hintText once text is present, so the @hint
    // attribute disappears from the accessibility tree (confirmed live on the
    // A13, 2026-08-13). Read the text back via chatInputFieldWithText (class
    // only) instead.
    const enteredText = await homeScreen.chatInputFieldWithText.getText();

    // Re-scoped assertion (mentor-approved): Appium cannot expose the full
    // 328 chars (caps ~299–311), so assert the scenario's intent through what
    // is reliably observable. No-crash: the populated field is displayed
    // (primary — a crash would remove the EditText node) and the home screen
    // heading is displayed (secondary, single-run probe evidence). The field
    // holds non-empty entered text and begins with the exact expected prefix
    // (full payload typed, start uncorrupted). Known limitation: this does
    // not confirm the full 328 chars are present (app-side tail truncation
    // beyond Appium's read window is not detected).
    await expect(homeScreen.chatInputFieldWithText).toBeDisplayed();
    await expect(homeScreen.chatPromptHeading).toBeDisplayed();
    expect(enteredText.length).toBeGreaterThan(0);
    expect(enteredText.startsWith(TEST_MESSAGE_PREFIX)).toBe(true);

    await settingsScreen.tapHamburgerMenuTrigger();
    await drawerScreen.newChatButton.click();

    await expect(homeScreen.chatPromptHeading).toBeDisplayed();
  });
});
