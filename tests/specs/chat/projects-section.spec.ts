import { authFlow } from '../../../src/flows/auth.flow.js';
import { homeScreen } from '../../../src/screens/home.screen.js';
import { drawerScreen } from '../../../src/screens/drawer.screen.js';
import { settingsScreen } from '../../../src/screens/settings.screen.js';
import { sectionsScreen } from '../../../src/screens/sections.screen.js';

/**
 * CHAT-E2E-011: Projects section opens without crashing.
 *
 * P2 (test-design-epic-chat-core.md) — R13. Smoke-only, per the coverage
 * plan's explicit scope for this section (zero prior exploration existed
 * before 2026-08-07). Locators confirmed via live exploration that day.
 *
 * Projects' back control has no content-desc (a gap, same class as the
 * hamburger trigger) — uses driver.back() (Android system back action)
 * instead, confirmed live to return cleanly to the home screen.
 */
describe('Projects section — P2', () => {
  it('CHAT-E2E-011 @p2: Projects section opens without crashing', async function () {
    if (!process.env.DEVICE_UDID) {
      this.skip();
    }

    await authFlow.ensureLoggedIn();
    await settingsScreen.tapHamburgerMenuTrigger();
    await drawerScreen.projectsMenuItem.click();

    await expect(sectionsScreen.projectsHeader).toBeDisplayed();
    await expect(sectionsScreen.projectsEmptyState).toBeDisplayed();

    await driver.back();

    await expect(homeScreen.chatPromptHeading).toBeDisplayed();
  });
});
