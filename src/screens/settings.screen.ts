import { SettingsNavScreen } from './settings-nav.screen.js';

/**
 * Settings PAGE (what you see after the drawer avatar is tapped).
 *
 * How to get here: settings-nav.screen.ts (hamburger → avatar).
 * Specs import settingsScreen from THIS file — it includes nav methods via extends.
 *
 * Compound labels (Profile, Power, …) use contains() because content-desc is
 * "Label\nLabel". Exact ~Profile fails.
 */

/** Swipe box to reveal Log out (1080-wide baseline; Appium scales). */
const SETTINGS_SCROLL_REGION = { left: 100, top: 500, width: 880, height: 1600 };

class SettingsScreen extends SettingsNavScreen {
  // ---------------------------------------------------------------------------
  // App bar: Back | "Settings" title | Information
  // ---------------------------------------------------------------------------

  /** Page title. ~Settings (SETTINGS-E2E-001 / 008). */
  get settingsHeader(): ChainablePromiseElement {
    return this.byContentDesc('Settings');
  }

  /**
   * In-app Back (top-left). Not Android system Back, and not ~Back
   * (that id is missing here). Do not use preceding:: — UiAutomator2 XPath2
   * crashes on that axis. Icon-sized clickable Button in the top-left;
   * Information is the same size but top-right.
   */
  async getSettingsBackButton(): Promise<ChainablePromiseElement> {
    await this.settingsHeader.waitForDisplayed({ timeout: 10000 });
    const { width, height } = await driver.getWindowSize();
    const buttons = await $$('//android.widget.Button[@clickable="true"]');
    const count = await buttons.length;

    for (let i = 0; i < count; i++) {
      try {
        const el = await buttons[i];
        const loc = await el.getLocation();
        const size = await el.getSize();
        if (size.width > 160 || size.height > 160) {
          continue;
        }
        if (loc.x >= width * 0.25 || loc.y >= height * 0.22) {
          continue;
        }
        return el;
      } catch {
        // Skip stale nodes.
      }
    }

    throw new Error('Settings Back button not found (unlabeled top-left Button)');
  }

  /** Info icon label. ~Information. This node is clickable="false". */
  get informationIcon(): ChainablePromiseElement {
    return this.byContentDesc('Information');
  }

  /** Real tap target: unlabeled child Button (same pattern as haptic switch). */
  get informationIconTapTarget(): ChainablePromiseElement {
    return $('//android.widget.Button[@content-desc="Information"]/android.widget.Button[@clickable="true"]');
  }

  async tapSettingsBackButton(): Promise<void> {
    const back = await this.getSettingsBackButton();
    await back.click();
  }

  async tapInformationIcon(): Promise<void> {
    await this.informationIconTapTarget.click();
  }

  // ---------------------------------------------------------------------------
  // Account block: email, workspace name, role chip
  // Optional env: SETTINGS_USER_EMAIL, SETTINGS_WORKSPACE_NAME, SETTINGS_WORKSPACE_ROLE
  // ---------------------------------------------------------------------------

  /** Email View (content-desc contains "@"), or exact SETTINGS_USER_EMAIL. */
  get userEmailLabel(): ChainablePromiseElement {
    const email = process.env.SETTINGS_USER_EMAIL?.trim();
    if (email) {
      return this.byContentDesc(email);
    }
    return $('//android.view.View[contains(@content-desc, "@")]');
  }

  /** Name View immediately after the email View. */
  get workspaceNameLabel(): ChainablePromiseElement {
    const name = process.env.SETTINGS_WORKSPACE_NAME?.trim();
    if (name) {
      return this.byContentDesc(name);
    }
    return $('//android.view.View[contains(@content-desc, "@")]/following-sibling::android.view.View[1]');
  }

  /**
   * Role chip (default "Power") — also the expand control. No separate chevron.
   * Tap currently shows "Account switcher placeholder".
   */
  get workspaceRoleButton(): ChainablePromiseElement {
    const role = process.env.SETTINGS_WORKSPACE_ROLE?.trim() || 'Power';
    return $(`//android.widget.Button[contains(@content-desc, "${role}")]`);
  }

  // ---------------------------------------------------------------------------
  // Settings list rows (CHAT-E2E-010 / AUTH-E2E-016)
  // ---------------------------------------------------------------------------

  get profileRow(): ChainablePromiseElement {
    return $('//android.widget.Button[contains(@content-desc, "Profile")]');
  }

  get logOutButton(): ChainablePromiseElement {
    return this.byContentDesc('Log out');
  }

  get hapticFeedbackRow(): ChainablePromiseElement {
    return $('//android.widget.Switch[contains(@content-desc, "Haptic feedback")]');
  }

  /** Knob only — tapping the row label does nothing. */
  get hapticFeedbackSwitch(): ChainablePromiseElement {
    return $('//android.widget.Switch[contains(@content-desc, "Haptic feedback")]/android.widget.Switch');
  }

  /** Placeholder toast today; CHAT-E2E-010 only asserts no crash. */
  get notificationsRow(): ChainablePromiseElement {
    return $('//android.widget.Button[contains(@content-desc, "Notifications")]');
  }

  async tapProfileRow(): Promise<void> {
    await this.profileRow.click();
  }

  async tapLogOut(): Promise<void> {
    await this.logOutButton.click();
  }

  async tapHapticFeedbackToggle(): Promise<void> {
    await this.hapticFeedbackSwitch.click();
  }

  async tapNotificationsRow(): Promise<void> {
    await this.notificationsRow.click();
  }

  /** Swipe the list up so Log out (bottom) is visible. */
  async scrollDown(): Promise<void> {
    await driver.execute('mobile: swipeGesture', {
      ...SETTINGS_SCROLL_REGION,
      direction: 'up',
      percent: 0.9,
    });
  }
}

export const settingsScreen = new SettingsScreen();
