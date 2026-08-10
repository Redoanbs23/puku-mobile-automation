import { authFlow } from '../../../src/flows/auth.flow.js';
import { homeScreen } from '../../../src/screens/home.screen.js';
import { drawerScreen } from '../../../src/screens/drawer.screen.js';
import { settingsScreen } from '../../../src/screens/settings.screen.js';
import { sectionsScreen } from '../../../src/screens/sections.screen.js';

/**
 * CHAT-E2E-012: Artifacts section opens without crashing.
 *
 * P2 (test-design-epic-chat-core.md) — R13. Smoke-only, same reasoning as
 * CHAT-E2E-011. Locators confirmed via live exploration against the
 * emulator's logged-in session on 2026-08-07.
 */
describe('Artifacts section — P2', () => {
  it('CHAT-E2E-012 @p2: Artifacts section opens without crashing', async function () {
    if (!process.env.DEVICE_UDID) {
      this.skip();
    }

    await authFlow.ensureLoggedIn();
    await settingsScreen.tapHamburgerMenuTrigger();
    await drawerScreen.artifactsMenuItem.click();

    await expect(sectionsScreen.artifactsHeader).toBeDisplayed();
    await expect(sectionsScreen.artifactsEmptyState).toBeDisplayed();

    await sectionsScreen.backButton.click();

    await expect(homeScreen.chatPromptHeading).toBeDisplayed();
  });
});
