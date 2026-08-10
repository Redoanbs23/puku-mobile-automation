import { authFlow } from '../../../src/flows/auth.flow.js';
import { homeScreen } from '../../../src/screens/home.screen.js';
import { drawerScreen } from '../../../src/screens/drawer.screen.js';
import { settingsScreen } from '../../../src/screens/settings.screen.js';
import { chatHistoryScreen } from '../../../src/screens/chat-history.screen.js';

/**
 * CHAT-E2E-009: "Chats" drawer entry opens; history list renders without crash.
 *
 * P1 (test-design-epic-chat-core.md) — R10. Deliberately smoke-only: does
 * not assert on the list's specific contents, since test-generated
 * messages accumulate indefinitely in the shared account's history with
 * no known deletion mechanism (see CHAT-TC-009). Locators confirmed via
 * live exploration against the emulator's logged-in session on 2026-08-07.
 *
 * Dismisses via chatHistoryScreen.backButton and asserts the home screen
 * is visible again, leaving the app in its default state for whatever
 * spec runs next.
 */
describe('Chat history — P1', () => {
  it('CHAT-E2E-009 @p1: "Chats" drawer entry opens; history list renders without crash', async function () {
    if (!process.env.DEVICE_UDID) {
      this.skip();
    }

    await authFlow.ensureLoggedIn();
    await settingsScreen.tapHamburgerMenuTrigger();
    await drawerScreen.chatsMenuItem.click();

    await expect(chatHistoryScreen.backButton).toBeDisplayed();

    await chatHistoryScreen.backButton.click();

    await expect(homeScreen.chatPromptHeading).toBeDisplayed();
  });
});
