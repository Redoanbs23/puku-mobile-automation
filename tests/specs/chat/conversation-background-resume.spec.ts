import { authFlow } from '../../../src/flows/auth.flow.js';
import { homeScreen } from '../../../src/screens/home.screen.js';
import { settingsScreen } from '../../../src/screens/settings.screen.js';
import { drawerScreen } from '../../../src/screens/drawer.screen.js';

/**
 * CHAT-E2E-019 — Conversation survives app backgrounding and resume
 *
 * Priority: P0
 * Risk:    R15 (conversation persistence across backgrounding)
 * TC ref:  test-cases/chat/CHAT-TC-019.md
 *
 * Contract under test (CHAT-TC-019 expected outcome):
 *   After sending a message and receiving an AI response, background the app,
 *   wait, resume it, and confirm the conversation is still visible.
 *   The sent message and AI response must not be silently lost; the app must
 *   not have reset to an empty chat state.
 *
 * Assertion strategy (post-resume is the persistence contract, not the
 * empty/new-chat chrome):
 *   - Confirm the chat composer card is back (single EditText on the chat
 *     surface, matched by class — see chatInputFieldWithText in
 *     home.screen.ts). This proves we are on the chat surface without
 *     asserting chatPromptHeading, which is the EMPTY-state chrome and is
 *     correctly absent once an active conversation is present.
 *   - Confirm the sent CHAT-TC-019 message is still in the semantics tree
 *     (user bubble persistence). Uses the same `text`-attribute XPath
 *     pattern the Screen Object already trusts (see responseBubbleExcluding
 *     in home.screen.ts) — no new locator.
 *   - Confirm the AI response bubble is still displayed and, most
 *     importantly, that its `text` equals the pre-background capture
 *     (preResumeResponseText). This is the literal-content identity check
 *     — proves the SAME response content survived backgrounding, not just
 *     that some response-shaped View now happens to exist.
 *
 * Notable: this test does NOT special-case or swallow an HTTP 429 from the
 * upstream inference endpoint. If the device currently rate-limits, the
 * "wait for AI response" step will time out and the failure is captured as
 * real evidence of the backend condition.
 */
describe('Conversation survives app backgrounding and resume — P0', () => {
  const TEST_MESSAGE = '[PUKU-QA-TEST:CHAT-TC-019] What is 2 + 2?';

  it('CHAT-E2E-019 @p0: message and AI response persist across background/resume', async function () {
    if (!process.env.DEVICE_UDID) {
      this.skip();
    }

    // 1. Ensure authenticated and on the home screen.
    await authFlow.ensureLoggedIn();
    await homeScreen.waitUntilDisplayed();

    // 2. Send the TC-019 message exactly as the case specifies.
    await homeScreen.typeChatMessage(TEST_MESSAGE);
    await homeScreen.tapSendButton();

    // 3. Wait for the AI response. This XPath excludes the user bubble by
    //    text, so any non-empty View@text that appears is a response bubble.
    const responseLocator = homeScreen.responseBubbleExcluding(TEST_MESSAGE);
    await expect(responseLocator).toBeDisplayed({ wait: 20000 });

    // 4. Identity check: capture the actual response text so we can prove
    //    the SAME response is present after resume (not a stale/empty UI).
    const preResumeResponseText = await responseLocator.getText();
    expect(preResumeResponseText.length).toBeGreaterThan(0);

    // 5. Real app background/resume cycle.
    await driver.appiumBackground(null);
    await driver.pause(5000);
    await driver.activateApp('sh.puku.app');
    await driver.waitUntil(
      async () => (await driver.getCurrentPackage()) === 'sh.puku.app',
      { timeout: 15000 },
    );
    // Let Flutter settle and the semantic tree rebuild post-foreground.
    await driver.pause(3000);

    // 6. Chat composer card is back — proves we are on the chat surface
    //    without asserting the empty-state chrome (chatPromptHeading is
    //    correctly absent once an active conversation is present).
    //    chatInputFieldWithText matches by class only and is documented in
    //    home.screen.ts as unambiguous on the home/chat surface.
    await homeScreen.chatInputFieldWithText.waitForDisplayed({ timeout: 10000 });

    // 7. Sent message is still in the semantics tree (user bubble
    //    persistence). Same `text`-attribute XPath pattern used by
    //    responseBubbleExcluding — not a new locator.
    const sentMessageLocator = $(`//android.view.View[@text="${TEST_MESSAGE}"]`);
    await expect(sentMessageLocator).toBeDisplayed();

    // 8. AI response bubble is still displayed — structural guard so that
    //    the getText() below is well-defined.
    await expect(responseLocator).toBeDisplayed({ wait: 10000 });

    // 9. The response is the SAME response content — the literal-content
    //    identity assertion. This is the strongest persistence proof:
    //    proves the pre-background response text survived backgrounding,
    //    not just that some response-shaped View exists.
    const postResumeResponseText = await responseLocator.getText();
    expect(postResumeResponseText).toBe(preResumeResponseText);

    // 10. Teardown — leave the app in the clean/default home state. The
    //     established convention in long-message.spec.ts / rotation.spec.ts
    //     uses the drawer's newChatButton rather than attempting to clear
    //     the input directly: WebdriverIO's clear()/setValue() are
    //     unreliable against this app's custom-rendered EditText (see
    //     ai-log/lessons-learned.md).
    await settingsScreen.tapHamburgerMenuTrigger();
    await drawerScreen.newChatButton.click();
    await expect(homeScreen.chatPromptHeading).toBeDisplayed();
  });
});
