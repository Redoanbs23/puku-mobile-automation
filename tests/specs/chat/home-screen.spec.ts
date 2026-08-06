import { authFlow } from '../../../src/flows/auth.flow.js';
import { homeScreen } from '../../../src/screens/home.screen.js';

/**
 * CHAT-E2E-001: Home screen renders post-login without crash.
 *
 * P0 (test-design-epic-chat-core.md) — foundational; blocks everything
 * else in the chat-core epic if it fails, same role LOGIN-E2E-002 played
 * for auth-login. Requires a logged-in state — reuses
 * authFlow.ensureLoggedIn() rather than duplicating AUTH-E2E-015's flow.
 * Same device-dependency as the rest of chat-core: requires DEVICE_UDID
 * (physical device with a pre-authenticated Google account, ADR-006).
 */
describe('Home screen — P0', () => {
  it('CHAT-E2E-001 @p0: home screen renders post-login (chat prompt, chat input, model selector all visible)', async function () {
    if (!process.env.DEVICE_UDID) {
      this.skip();
    }

    await authFlow.ensureLoggedIn();

    await expect(homeScreen.chatPromptHeading).toBeDisplayed();
    await expect(homeScreen.chatInputField).toBeDisplayed();
    await expect(homeScreen.modelSelector).toBeDisplayed();
  });
});
