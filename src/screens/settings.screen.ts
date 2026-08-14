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
 * Hamburger icon centre as a fraction of the window (live dump NIC-LX2
 * 720×1604, 2026-08-14: bounds [32,110][128,206], centre 80,158).
 * Used only if the unlabeled View cannot be clicked (R4).
 */
const HAMBURGER_X_RATIO = 80 / 720;
const HAMBURGER_Y_RATIO = 158 / 1604;

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
      '//android.view.View[@content-desc="How can i help you today!"]/preceding-sibling::android.view.View[@clickable="true"][1]',
    );
  }

  /**
   * CHAT-E2E-015: hamburger has no content-desc / resource-id / text (R4).
   * Returns false today — that is the documented gap, not a missing helper.
   */
  async hasHamburgerA11yLocator(): Promise<boolean> {
    try {
      const desc = (await this.hamburgerMenuTrigger.getAttribute('content-desc'))?.trim();
      const rid = (await this.hamburgerMenuTrigger.getAttribute('resource-id'))?.trim();
      return Boolean(desc || rid);
    } catch {
      return false;
    }
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
   * Any single-character content-desc (any account initial). Do not pin "P".
   * UiAutomator2 XPath2 cannot evaluate string-length(); tapProfileAvatar
   * reads content-desc in JS instead.
   */
  get profileAvatarBesideNewChat(): ChainablePromiseElement {
    return $(
      '//android.widget.Button[@content-desc="New chat"]/preceding-sibling::android.view.View[@clickable="true"][last()]',
    );
  }

  /** Alias for locator-health specs — same node as profileAvatarBesideNewChat. */
  get profileAvatar(): ChainablePromiseElement {
    return this.profileAvatarBesideNewChat;
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
   * Hamburger has no content-desc (R4). Live dump on NIC-LX2 (720×1604):
   * unlabeled clickable View [32,110][128,206], sibling before the home heading.
   * Click that node (not a scaled 1080×2408 pixel). If the drawer still does
   * not open, tap the icon centre via UiAutomator2 clickGesture.
   */
  async tapHamburgerMenuTrigger(): Promise<void> {
    await $('~How can i help you today!').waitForDisplayed({ timeout: 10000 });

    try {
      await this.hamburgerMenuTrigger.waitForDisplayed({ timeout: 3000 });
      await this.hamburgerMenuTrigger.click();
    } catch {
      await this.clickTopLeftHamburgerIcon();
    }

    if (await this.isDrawerOpen(4000)) {
      return;
    }

    await this.clickTopLeftHamburgerIcon();
    if (await this.isDrawerOpen(3000)) {
      return;
    }

    await this.tapHamburgerByScreenRatio();
  }

  private async isDrawerOpen(timeout: number): Promise<boolean> {
    return $('~New chat')
      .waitForDisplayed({ timeout })
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Icon-sized clickable View in the top-left (hamburger). Live: ~96×96 px.
   * Skips full-screen Flutter Views. Uses element.click(), not W3C pointer.
   */
  private async clickTopLeftHamburgerIcon(): Promise<boolean> {
    const { width, height } = await driver.getWindowSize();
    const found = await $$('//android.view.View[@clickable="true"]');
    const count = await found.length;

    for (let i = 0; i < count; i++) {
      try {
        const el = await found[i];
        const loc = await el.getLocation();
        const size = await el.getSize();
        const iconSized = size.width <= 160 && size.height <= 160;
        const topLeft = loc.x < width * 0.25 && loc.y < height * 0.22;
        if (!iconSized || !topLeft) {
          continue;
        }
        await el.click();
        return true;
      } catch {
        // Skip stale nodes.
      }
    }
    return false;
  }

  private async tapHamburgerByScreenRatio(): Promise<void> {
    const { width, height } = await driver.getWindowSize();
    const x = Math.round(width * HAMBURGER_X_RATIO);
    const y = Math.round(height * HAMBURGER_Y_RATIO);
    await driver.execute('mobile: clickGesture', { x, y });
  }

  /**
   * Opens Settings from the open drawer.
   *
   * Taps the one-letter avatar beside New chat (any initial: P, M, …).
   */
  async tapProfileAvatar(): Promise<void> {
    await $('~New chat').waitForDisplayed({ timeout: 8000 });

    const clickableViews = await $$('//android.view.View[@clickable="true"]');
    for (const el of clickableViews) {
      const desc = ((await el.getAttribute('content-desc')) ?? '').trim();
      const initial = desc.split('\n')[0]?.trim() ?? '';
      if (initial.length === 1 && /[A-Za-z]/.test(initial)) {
        await el.click();
        return;
      }
    }

    try {
      if (await this.profileAvatarBesideNewChat.isDisplayed()) {
        await this.profileAvatarBesideNewChat.click();
        return;
      }
    } catch {
      // No sibling match.
    }

    throw new Error(
      'Drawer profile avatar not found: need a clickable View whose content-desc is any single letter beside New chat',
    );
  }

  /**
   * Settings-only: Chrome Custom Tab X after Authorize on emulator.
   * Not used by AUTH-E2E-015 / completeGoogleSignIn().
   */
  async dismissChromeCustomTabIfOpen(): Promise<void> {
    const candidates: ChainablePromiseElement[] = [
      $('id:com.android.chrome:id/close_button'),
      $('~Close tab'),
      $('~Close'),
      $('//android.widget.ImageButton[contains(@content-desc, "Close")]'),
    ];
    for (const el of candidates) {
      try {
        if (await el.isDisplayed()) {
          await el.click();
          return;
        }
      } catch {
        // Next locator.
      }
    }
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
