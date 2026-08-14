import { settingsFlow } from '../../../src/flows/settings.flow.js';
import { homeScreen } from '../../../src/screens/home.screen.js';
import { settingsScreen } from '../../../src/screens/settings.screen.js';

/**
 * Settings profile header checks (P1). One assertion per test.
 *
 * Shared path (once per describe): ensureOnSettings()
 *   recover Home/drawer leftover → authFlow.ensureLoggedIn() →
 *   hamburger → avatar → Settings
 * Teardown (once): dismissSettingsToHome() so the next spec starts on Home.
 *
 * Locators are structural (any Android device/emulator). Live-confirmed 2026-08-14.
 * Requires DEVICE_UDID and APP_NO_RESET=true with an existing login.
 */
describe('Settings profile header — P1', () => {
  let openedSettings = false;

  before(async function () {
    if (!process.env.DEVICE_UDID) {
      this.skip();
    }
    await settingsFlow.ensureOnSettings();
    openedSettings = true;
  });

  after(async function () {
    if (!openedSettings) {
      return;
    }
    await settingsFlow.dismissSettingsToHome();
    await expect(homeScreen.chatPromptHeading).toBeDisplayed();
  });

  it('SETTINGS-E2E-001 @p1: Settings page opens successfully', async function () {
    await expect(settingsScreen.settingsHeader).toBeDisplayed();
  });

  it('SETTINGS-E2E-002 @p1: user email is displayed', async function () {
    await expect(settingsScreen.userEmailLabel).toBeDisplayed();
  });

  it('SETTINGS-E2E-003 @p1: workspace/organization name is displayed', async function () {
    await expect(settingsScreen.workspaceNameLabel).toBeDisplayed();
  });

  it('SETTINGS-E2E-004 @p1: workspace role is displayed', async function () {
    await expect(settingsScreen.workspaceRoleButton).toBeDisplayed();
  });

  it('SETTINGS-E2E-005 @p1: expand/dropdown control is visible beside the role', async function () {
    await expect(settingsScreen.workspaceRoleButton).toBeDisplayed();
    await expect(await settingsScreen.workspaceRoleButton.getAttribute('clickable')).toBe('true');
  });
});
