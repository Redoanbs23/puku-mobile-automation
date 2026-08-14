import { BaseScreen } from './base.screen.js';

/**
 * Screen Object for PUKU Settings and the path used to open it.
 *
 * Specs must not use raw locators. They call getters / tap* methods here.
 *
 * User journey used by SETTINGS-E2E-001 (and chat-core Settings tests):
 *   Home → hamburger (opens drawer) → profile avatar beside New chat → Settings
 *
 * Existing chat-core locators (Profile row, Log out, Haptic, Notifications,
 * ~P) remain. SETTINGS-E2E-001 adds email / workspace / role getters. Hamburger
 * and avatar taps prefer live element locators, with a scaled coordinate
 * fallback when the hamburger still has no content-desc (R4).
 */

/**
 * Pixel tap fallback for the hamburger when the element click is not found.
 * Baseline 1080×2408; scaled to the current window size on every device (R4).
 */
const HAMBURGER_MENU_TRIGGER_X = 112;
const HAMBURGER_MENU_TRIGGER_Y = 178;
/** Width/height of the device those pixels were recorded on; used to scale. */
const HAMBURGER_BASELINE_WIDTH = 1080;
const HAMBURGER_BASELINE_HEIGHT = 2408;

/** Swipe region for revealing Log out at the bottom of the Settings list (1080-wide baseline). */
const SETTINGS_SCROLL_REGION = { left: 100, top: 500, width: 880, height: 1600 };

class SettingsScreen extends BaseScreen {
  /**
   * Hamburger (drawer) control on Home — the unlabeled top-left View.
   *
   * No content-desc / resource-id / text. Locator is structural: the nearest
   * clickable View *before* the home heading (~How can i help you today!).
   * Model selector is an ImageView so it is not matched.
   */
  get hamburgerMenuTrigger(): ChainablePromiseElement {
    return $(
      '//android.view.View[@content-desc="How can i help you today!"]/preceding::android.view.View[@clickable="true"][1]',
    );
  }

  /**
   * Drawer avatar accessibility id "P" (live dump RF8T802226Y, 2026-08-06).
   * CHAT-E2E-003 still asserts this getter. The signed-in initial is not
   * always "P" — tapProfileAvatar prefers profileAvatarBesideNewChat.
   */
  get profileAvatarButton(): ChainablePromiseElement {
    return this.byContentDesc('P');
  }

  /**
   * Drawer avatar beside New chat (opens Settings).
   *
   * Live Inspector 2026-08-14: android.view.View, clickable, content-desc is
   * the signed-in account's single-character initial (observed "P" and "M").
   * Does not pin one letter, index, or bounds.
   */
  get profileAvatarBesideNewChat(): ChainablePromiseElement {
    return $(
      '//android.widget.Button[@content-desc="New chat"]/preceding-sibling::android.view.View[@clickable="true" and string-length(@content-desc)=1][last()]',
    );
  }

  /**
   * Settings list row "Profile". Compound content-desc "Profile\nProfile"
   * (live 2026-08-06) — exact ~Profile fails, so contains() XPath.
   */
  get profileRow(): ChainablePromiseElement {
    return $('//android.widget.Button[contains(@content-desc, "Profile")]');
  }

  /** Settings list "Log out" control (~Log out). May need scrollDown() first. */
  get logOutButton(): ChainablePromiseElement {
    return this.byContentDesc('Log out');
  }

  /**
   * Settings page title. Confirms SETTINGS-E2E-001 "Settings page opened".
   * Locator: ~Settings
   */
  get settingsHeader(): ChainablePromiseElement {
    return this.byContentDesc('Settings');
  }

  /**
   * Signed-in email on the Settings header.
   *
   * Live: android.view.View whose content-desc is the full email.
   * If SETTINGS_USER_EMAIL is set, match that exactly; otherwise any View
   * whose content-desc contains "@".
   */
  get userEmailLabel(): ChainablePromiseElement {
    const email = process.env.SETTINGS_USER_EMAIL?.trim();
    if (email) {
      return this.byContentDesc(email);
    }
    return $('//android.view.View[contains(@content-desc, "@")]');
  }

  /**
   * Workspace / display name under the email + role row.
   *
   * Live: View after the email View (Power is a Button in between).
   * Optional SETTINGS_WORKSPACE_NAME pins an exact content-desc.
   */
  get workspaceNameLabel(): ChainablePromiseElement {
    const name = process.env.SETTINGS_WORKSPACE_NAME?.trim();
    if (name) {
      return this.byContentDesc(name);
    }
    return $('//android.view.View[contains(@content-desc, "@")]/following-sibling::android.view.View[1]');
  }

  /**
   * Workspace role chip (e.g. Power) — also the expand/dropdown beside the role.
   *
   * Compound content-desc "Power\nPower". No separate chevron content-desc.
   * Tap currently shows "Account switcher placeholder" (app stub).
   * Override label with SETTINGS_WORKSPACE_ROLE if the plan is not Power (R12).
   */
  get workspaceRoleButton(): ChainablePromiseElement {
    const role = process.env.SETTINGS_WORKSPACE_ROLE?.trim() || 'Power';
    return $(`//android.widget.Button[contains(@content-desc, "${role}")]`);
  }

  /**
   * Haptic feedback row Switch (compound content-desc). `checked` mirrors
   * the nested knob. Used by CHAT-E2E-010 to read toggle state.
   */
  get hapticFeedbackRow(): ChainablePromiseElement {
    return $('//android.widget.Switch[contains(@content-desc, "Haptic feedback")]');
  }

  /**
   * Actual haptic tap target: unlabeled child Switch under hapticFeedbackRow.
   * Tapping the parent label does nothing (live 2026-08-07).
   */
  get hapticFeedbackSwitch(): ChainablePromiseElement {
    return $('//android.widget.Switch[contains(@content-desc, "Haptic feedback")]/android.widget.Switch');
  }

  /**
   * Notifications row. Not a real toggle today — tap shows
   * "Notifications action placeholder". CHAT-E2E-010 only asserts no crash.
   */
  get notificationsRow(): ChainablePromiseElement {
    return $('//android.widget.Button[contains(@content-desc, "Notifications")]');
  }

  /**
   * Opens the navigation drawer from Home.
   *
   * 1) Click hamburgerMenuTrigger (element, no screen-size).
   * 2) If that View is missing within 2s, tap scaled 112,178 (RF8T802226Y baseline).
   */
  async tapHamburgerMenuTrigger(): Promise<void> {
    try {
      await this.hamburgerMenuTrigger.waitForDisplayed({ timeout: 2000 });
      await this.hamburgerMenuTrigger.click();
      return;
    } catch {
      // Element path failed — use density-scaled coordinate fallback.
    }

    const { width, height } = await driver.getWindowSize();
    const x = Math.round((HAMBURGER_MENU_TRIGGER_X * width) / HAMBURGER_BASELINE_WIDTH);
    const y = Math.round((HAMBURGER_MENU_TRIGGER_Y * height) / HAMBURGER_BASELINE_HEIGHT);

    await driver
      .action('pointer', { parameters: { pointerType: 'touch' } })
      .move(x, y)
      .down()
      .pause(100)
      .up()
      .perform();
  }

  /**
   * Opens Settings from the open drawer.
   *
   * 1) Click the one-letter avatar beside New chat (any initial).
   * 2) If missing, click ~P (live dump 2026-08-06).
   */
  async tapProfileAvatar(): Promise<void> {
    try {
      if (await this.profileAvatarBesideNewChat.isDisplayed()) {
        await this.profileAvatarBesideNewChat.click();
        return;
      }
    } catch {
      // Fall through to ~P.
    }
    await this.profileAvatarButton.click();
  }

  /** Taps the Profile row on the Settings list. */
  async tapProfileRow(): Promise<void> {
    await this.profileRow.click();
  }

  /** Taps Log out (caller should scrollDown() if the button is off-screen). */
  async tapLogOut(): Promise<void> {
    await this.logOutButton.click();
  }

  /** Taps the haptic switch knob (not the row label). */
  async tapHapticFeedbackToggle(): Promise<void> {
    await this.hapticFeedbackSwitch.click();
  }

  /** Taps Notifications (placeholder toast; does not persist a toggle). */
  async tapNotificationsRow(): Promise<void> {
    await this.notificationsRow.click();
  }

  /**
   * Swipes the Settings list upward so lower rows (Log out) become visible.
   */
  async scrollDown(): Promise<void> {
    await driver.execute('mobile: swipeGesture', {
      ...SETTINGS_SCROLL_REGION,
      direction: 'up',
      percent: 0.9,
    });
  }
}

export const settingsScreen = new SettingsScreen();
