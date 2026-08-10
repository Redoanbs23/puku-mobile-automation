import { authFlow } from '../../../src/flows/auth.flow.js';
import { homeScreen } from '../../../src/screens/home.screen.js';
import { drawerScreen } from '../../../src/screens/drawer.screen.js';
import { settingsScreen } from '../../../src/screens/settings.screen.js';

/**
 * CHAT-E2E-017: Device rotation on the home/chat screen — no crash,
 * state preserved.
 *
 * P3 (test-design-epic-chat-core.md). Scoped to unsent input text only —
 * never sends a message, no R8 exposure. Confirmed live on 2026-08-07:
 * PUKU's MainActivity is portrait-locked. driver.setOrientation('LANDSCAPE')
 * doesn't silently no-op — it throws ("Screen rotation cannot be changed
 * to ROTATION_270 after 2000ms. Is it locked programmatically?"). Per
 * CHAT-TC-017, a portrait lock is a valid finding, not a failure, so that
 * specific error is caught and treated as a confirmed result rather than
 * a test failure. The hard assertions are "no crash" and "input text
 * survives the attempt," not "the orientation actually changed."
 *
 * Ends by using drawerScreen.newChatButton (the same reset path verified
 * working in CHAT-E2E-006) rather than trying to clear the typed text
 * directly — WebdriverIO's clear()/setValue() are documented as
 * unreliable against this app's custom-rendered EditText (see
 * ai-log/lessons-learned.md), so this avoids relying on an unverified
 * clear mechanism just for teardown.
 */
describe('Device rotation — P3', () => {
  it('CHAT-E2E-017 @p3: device rotation does not crash the app or lose unsent input', async function () {
    if (!process.env.DEVICE_UDID) {
      this.skip();
    }

    await authFlow.ensureLoggedIn();

    const testText = '[PUKU-QA-TEST:CHAT-E2E-017] rotation check';
    await homeScreen.typeChatMessage(testText);

    let rotatedToLandscape = true;
    try {
      await driver.setOrientation('LANDSCAPE');
    } catch (error) {
      if (error instanceof Error && /locked programmatically/.test(error.message)) {
        rotatedToLandscape = false;
      } else {
        throw error;
      }
    }

    await expect(homeScreen.chatInputField).toBeDisplayed();
    expect(await homeScreen.chatInputField.getText()).toBe(testText);

    if (rotatedToLandscape) {
      await driver.setOrientation('PORTRAIT');
      await expect(homeScreen.chatInputField).toBeDisplayed();
      expect(await homeScreen.chatInputField.getText()).toBe(testText);
    }

    await settingsScreen.tapHamburgerMenuTrigger();
    await drawerScreen.newChatButton.click();

    await expect(homeScreen.chatPromptHeading).toBeDisplayed();
  });
});
