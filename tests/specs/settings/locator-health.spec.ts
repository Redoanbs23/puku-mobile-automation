import { authFlow } from '../../../src/flows/auth.flow.js';
import { homeScreen } from '../../../src/screens/home.screen.js';
import { settingsScreen } from '../../../src/screens/settings.screen.js';

/**
 * CHAT-E2E-015: locator health-check (P2, R4).
 *
 * Encodes the two known a11y gaps as accepted exceptions (hamburger, send).
 * Drawer avatar is asserted via settingsScreen.profileAvatar (any-letter sibling).
 */
describe('Locator health — P2', () => {
  it('CHAT-E2E-015 @p2: interactive locators exist, or are documented gaps', async function () {
    if (!process.env.DEVICE_UDID) {
      this.skip();
    }

    await authFlow.ensureLoggedIn();
    await expect(homeScreen.chatPromptHeading).toBeDisplayed();

    expect(await settingsScreen.hasHamburgerA11yLocator()).toBe(false);

    await settingsScreen.tapHamburgerMenuTrigger();
    await expect(settingsScreen.profileAvatar).toBeDisplayed();

    await driver.back();
    await expect(homeScreen.chatPromptHeading).toBeDisplayed();

    expect(await homeScreen.hasSendA11yLocator()).toBe(false);
  });
});
