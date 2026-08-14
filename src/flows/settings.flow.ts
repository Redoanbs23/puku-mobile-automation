import { authFlow } from './auth.flow.js';
import { drawerScreen } from '../screens/drawer.screen.js';
import { homeScreen } from '../screens/home.screen.js';
import { settingsScreen } from '../screens/settings.screen.js';

/**
 * Multi-step Settings journeys. Specs call these instead of repeating
 * hamburger → avatar → back in every test.
 *
 * Same path as CHAT-E2E-003 / CHAT-E2E-010: drawer then profile avatar.
 * Teardown matches CHAT-E2E-010: Android Back, then assert home.
 */
export const settingsFlow = {
  /**
   * Best-effort return to Home before login checks.
   *
   * Appium noReset restores the last screen. If that is Settings or the
   * drawer, home heading is hidden and ensureLoggedIn() wrongly starts
   * Google sign-in. Does not spam Back (that can leave the app).
   *
   * Steps: bring sh.puku.app to foreground → if Settings title visible,
   * Back → if New chat (drawer) visible, Back.
   */
  async returnToHomeIfPossible(): Promise<void> {
    try {
      await driver.activateApp('sh.puku.app');
    } catch {
      // Some sessions do not implement activateApp; UI checks still run.
    }

    const onSettings = await settingsScreen.settingsHeader
      .waitForDisplayed({ timeout: 1500 })
      .then(() => true)
      .catch(() => false);
    if (onSettings) {
      await driver.back();
    }

    const onDrawer = await drawerScreen.newChatButton
      .waitForDisplayed({ timeout: 1500 })
      .then(() => true)
      .catch(() => false);
    if (onDrawer) {
      await driver.back();
    }
  },

  /**
   * From Home: open drawer, tap avatar beside New chat, wait for Settings title.
   * Does not install/uninstall the APK.
   */
  async openSettingsFromHome(): Promise<void> {
    await settingsScreen.tapHamburgerMenuTrigger();
    await settingsScreen.tapProfileAvatar();
    await settingsScreen.settingsHeader.waitForDisplayed({ timeout: 10000 });
  },

  /**
   * Shared path for Settings verification specs.
   *
   * Same login gate as CHAT-E2E-003 / CHAT-E2E-010: always call
   * authFlow.ensureLoggedIn() before opening Settings. If Home is already
   * shown, that helper returns immediately; if the session is on login,
   * it runs completeGoogleSignIn(). Skipping this step leaves the suite
   * on the login screen and every Settings assertion fails.
   */
  async ensureOnSettings(): Promise<void> {
    await this.returnToHomeIfPossible();
    await authFlow.ensureLoggedIn();
    await this.openSettingsFromHome();
  },

  /**
   * Leave Settings via system Back and wait until the home prompt is shown
   * so the next spec does not start on Settings.
   */
  async dismissSettingsToHome(): Promise<void> {
    await driver.back();
    await homeScreen.waitUntilDisplayed();
  },
};
