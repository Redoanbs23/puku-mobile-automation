import { BaseScreen } from './base.screen.js';

/**
 * How we OPEN Settings from Home (not the Settings page itself).
 *
 * Path: Home → hamburger (opens drawer) → one-letter avatar beside "New chat".
 *
 * Specs still call settingsScreen (settings.screen.ts extends this class).
 * Do not put locators in spec files.
 */

/** Fallback tap if the hamburger View is missing. Live dump: icon centre 80,158 on 720×1604. */
const HAMBURGER_X_RATIO = 80 / 720;
const HAMBURGER_Y_RATIO = 158 / 1604;

export class SettingsNavScreen extends BaseScreen {
  // ---------------------------------------------------------------------------
  // Home: hamburger (opens the drawer)
  // No content-desc / resource-id / text (R4). Model selector is an ImageView.
  // ---------------------------------------------------------------------------

  /** Clickable View immediately before the home heading. */
  get hamburgerMenuTrigger(): ChainablePromiseElement {
    return $(
      '//android.view.View[@content-desc="How can i help you today!"]/preceding-sibling::android.view.View[@clickable="true"][1]',
    );
  }

  /** CHAT-E2E-015: expected false until the app adds an a11y id. */
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
   * Open the drawer. Try the View click, then a small top-left icon, then a
   * scaled tap. Stop as soon as "~New chat" is visible.
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

  /** Drawer is open when the New chat button is on screen. */
  private async isDrawerOpen(timeout: number): Promise<boolean> {
    return $('~New chat')
      .waitForDisplayed({ timeout })
      .then(() => true)
      .catch(() => false);
  }

  /** Small clickable View in the top-left (~icon size). Skips full-screen Views. */
  private async clickTopLeftHamburgerIcon(): Promise<boolean> {
    const { width, height } = await driver.getWindowSize();
    const found = await $$('//android.view.View[@clickable="true"]');
    const count = await found.length;

    for (let i = 0; i < count; i++) {
      try {
        const el = await found[i];
        const loc = await el.getLocation();
        const size = await el.getSize();
        if (size.width > 160 || size.height > 160) {
          continue;
        }
        if (loc.x >= width * 0.25 || loc.y >= height * 0.22) {
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

  /** Last fallback: tap icon centre as a fraction of the current window. */
  private async tapHamburgerByScreenRatio(): Promise<void> {
    const { width, height } = await driver.getWindowSize();
    await driver.execute('mobile: clickGesture', {
      x: Math.round(width * HAMBURGER_X_RATIO),
      y: Math.round(height * HAMBURGER_Y_RATIO),
    });
  }

  // ---------------------------------------------------------------------------
  // Drawer: profile avatar (opens Settings)
  // ---------------------------------------------------------------------------

  /** CHAT-E2E-003 only. Do not use for Settings — initial is not always "P". */
  get profileAvatarButton(): ChainablePromiseElement {
    return this.byContentDesc('P');
  }

  /** Sibling before "~New chat". XPath cannot use string-length(); tap uses JS. */
  get profileAvatarBesideNewChat(): ChainablePromiseElement {
    return $(
      '//android.widget.Button[@content-desc="New chat"]/preceding-sibling::android.view.View[@clickable="true"][last()]',
    );
  }

  /** Alias for locator-health specs. Same node as profileAvatarBesideNewChat. */
  get profileAvatar(): ChainablePromiseElement {
    return this.profileAvatarBesideNewChat;
  }

  /** Tap any single-letter avatar (P, M, …). Does not fall back to ~P. */
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

  // ---------------------------------------------------------------------------
  // Emulator login only: Chrome Custom Tab may stay open after Authorize
  // Call from settings.flow.ts only. AUTH-E2E-015 must not use this.
  // ---------------------------------------------------------------------------

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
        // Try the next locator.
      }
    }
  }
}

export const settingsNavScreen = new SettingsNavScreen();
