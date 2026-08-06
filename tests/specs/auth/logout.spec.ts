import { authFlow } from '../../../src/flows/auth.flow.js';
import { loginScreen } from '../../../src/screens/login.screen.js';
import { settingsScreen } from '../../../src/screens/settings.screen.js';

/**
 * AUTH-E2E-016: Logged-in user can log out via Settings and is
 * redirected to the login screen.
 *
 * Requires a logged-in session, which itself requires the physical,
 * pre-authenticated device path from AUTH-E2E-015 (see ADR-006,
 * docs/adr/ADR-006-oauth-consent-automation.md) — this test will not run
 * meaningfully in CI or against a fresh emulator, for the same reasons
 * documented there. Only runs when DEVICE_UDID is set; skips itself
 * otherwise.
 *
 * The hamburger menu trigger tapped below has no stable locator — see
 * settings.screen.ts and ai-log/lessons-learned.md — a real fragility
 * point tied to this device's screen size/DPI.
 */
describe('Log out flow — device-dependent', () => {
  it('AUTH-E2E-016: logging out via Settings redirects to the login screen', async function () {
    if (!process.env.DEVICE_UDID) {
      this.skip();
    }

    await authFlow.ensureLoggedIn();

    await settingsScreen.tapHamburgerMenuTrigger();
    await settingsScreen.tapProfileAvatar();
    await settingsScreen.scrollDown();
    await settingsScreen.tapLogOut();

    await expect(loginScreen.titleElement).toBeDisplayed();
  });
});
