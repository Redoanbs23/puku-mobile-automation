import { authFlow } from '../../../src/flows/auth.flow.js';
import { homeScreen } from '../../../src/screens/home.screen.js';

/**
 * CHAT-E2E-007: Empty message cannot be sent.
 *
 * P1 (test-design-epic-chat-core.md). No R8 exposure — never types into
 * chatInputField, so no real message is ever sent. Per CHAT-TC-007 and
 * lessons-learned.md, the send control has no locator at all and does not
 * render while the input is empty (confirmed live on 2026-08-06), so
 * "does it exist" can't be queried directly. Instead this taps the known
 * send-button coordinate (homeScreen.tapSendButton()) while the input is
 * genuinely empty and asserts nothing happened — matches CHAT-TC-007's
 * own accepted wording: "no send control is presented... or tapping it
 * has no effect."
 */
describe('Empty message — P1', () => {
  it('CHAT-E2E-007 @p1: empty message cannot be sent', async function () {
    if (!process.env.DEVICE_UDID) {
      this.skip();
    }

    await authFlow.ensureLoggedIn();

    await expect(homeScreen.chatInputField).toHaveText('');

    await homeScreen.tapSendButton();

    await expect(homeScreen.chatPromptHeading).toBeDisplayed();
    await expect(homeScreen.chatInputField).toHaveText('');
  });
});
