import { authFlow } from '../../../src/flows/auth.flow.js';
import { settingsScreen } from '../../../src/screens/settings.screen.js';
import { drawerScreen } from '../../../src/screens/drawer.screen.js';

/**
 * CHAT-E2E-003: Hamburger menu opens; drawer shows all expected entries.
 *
 * P0 (test-design-epic-chat-core.md) — gateway to the rest of the
 * chat-core epic's scope (Chats, Projects, Artifacts, Code are only
 * reachable through this drawer). Same device-dependency as the rest of
 * chat-core: requires DEVICE_UDID.
 *
 * Reuses settingsScreen.tapHamburgerMenuTrigger() (coordinate-based tap —
 * the trigger icon itself has no locator, see settings.screen.ts and
 * ai-log/lessons-learned.md) and settingsScreen.profileAvatarButton for
 * the Settings entry point, rather than duplicating either.
 */
describe('Navigation drawer — P0', () => {
  it('CHAT-E2E-003 @p0: drawer shows Chats, Projects, Artifacts, Code, New chat, and the Settings entry point', async function () {
    if (!process.env.DEVICE_UDID) {
      this.skip();
    }

    await authFlow.ensureLoggedIn();
    await settingsScreen.tapHamburgerMenuTrigger();

    await expect(drawerScreen.chatsMenuItem).toBeDisplayed();
    await expect(drawerScreen.projectsMenuItem).toBeDisplayed();
    await expect(drawerScreen.artifactsMenuItem).toBeDisplayed();
    await expect(drawerScreen.codeMenuItem).toBeDisplayed();
    await expect(drawerScreen.newChatButton).toBeDisplayed();
    await expect(settingsScreen.profileAvatarButton).toBeDisplayed();
  });
});
