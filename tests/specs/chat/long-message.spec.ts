import { authFlow } from '../../../src/flows/auth.flow.js';
import { homeScreen } from '../../../src/screens/home.screen.js';
import { drawerScreen } from '../../../src/screens/drawer.screen.js';
import { settingsScreen } from '../../../src/screens/settings.screen.js';

/**
 * CHAT-E2E-014: Long message input is accepted without crash or truncation.
 *
 * P2 (test-design-epic-chat-core.md). Deliberately scoped to input only —
 * never sends, so no R8 cost/ToS exposure (see CHAT-TC-014's own note).
 * Asserts the app does not crash and the full entered text is present in
 * the input field, never on AI-generated content (R9 is not even reached
 * here since nothing is sent).
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
  const FILLER_WORD = 'puku';
  const FILLER_REPEATS = 75; // 75 * 4 chars = 300 chars of filler, plus the 28-char tag prefix
  const TEST_MESSAGE = `[PUKU-QA-TEST:CHAT-E2E-014] ${FILLER_WORD.repeat(FILLER_REPEATS)}`;

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
    // only) instead. This both verifies no truncation (the scenario's core
    // intent) and that the field still exists (a crash would fail getText()).
    expect(await homeScreen.chatInputFieldWithText.getText()).toBe(TEST_MESSAGE);

    await settingsScreen.tapHamburgerMenuTrigger();
    await drawerScreen.newChatButton.click();

    await expect(homeScreen.chatPromptHeading).toBeDisplayed();
  });
});