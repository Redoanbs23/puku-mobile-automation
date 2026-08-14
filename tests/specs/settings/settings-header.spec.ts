import { settingsFlow } from '../../../src/flows/settings.flow.js';
import { homeScreen } from '../../../src/screens/home.screen.js';
import { settingsScreen } from '../../../src/screens/settings.screen.js';

/**
 * SETTINGS-E2E-006 … 010 — Settings app bar (header).
 *
 * Open Settings once in before(). Do not put locators here — use settingsScreen.
 * Skip without DEVICE_UDID. Use APP_NO_RESET=true so login survives.
 *
 * Back has no content-desc. Information label exists; tap the nested Button.
 * Run Back-navigation LAST so the other checks still see Settings.
 */
describe('Settings header section — P1', () => {
  let openedSettings = false;
  let returnedToHome = false;

  before(async function () {
    // CI has no DEVICE_UDID — skip instead of failing LOGIN-E2E-002's job.
    if (!process.env.DEVICE_UDID) {
      this.skip();
    }
    await settingsFlow.ensureOnSettings();
    openedSettings = true;
  });

  after(async function () {
    // 007 already returned to Home — do not press Back again (can leave the app).
    if (!openedSettings || returnedToHome) {
      return;
    }
    await settingsFlow.dismissSettingsToHome();
    await expect(homeScreen.chatPromptHeading).toBeDisplayed();
  });

  it('SETTINGS-E2E-008 @p1: Settings title is displayed', async function () {
    await expect(settingsScreen.settingsHeader).toBeDisplayed();
  });

  it('SETTINGS-E2E-006 @p1: Back button is visible', async function () {
    const back = await settingsScreen.getSettingsBackButton();
    await expect(back).toBeDisplayed();
  });

  it('SETTINGS-E2E-009 @p1: Information icon is visible', async function () {
    await expect(settingsScreen.informationIcon).toBeDisplayed();
  });

  it('SETTINGS-E2E-010 @p1: Information icon is clickable', async function () {
    await expect(await settingsScreen.informationIconTapTarget.getAttribute('clickable')).toBe('true');
    await settingsScreen.tapInformationIcon();
    await expect(settingsScreen.settingsHeader).toBeDisplayed();
  });

  it('SETTINGS-E2E-007 @p1: Back button navigates to the previous screen', async function () {
    await settingsScreen.tapSettingsBackButton();
    await homeScreen.waitUntilDisplayed();
    await expect(homeScreen.chatPromptHeading).toBeDisplayed();
    returnedToHome = true;
  });
});
