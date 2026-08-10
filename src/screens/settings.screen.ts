import { BaseScreen } from './base.screen.js';

/**
 * Home screen's hamburger menu trigger has no content-desc, resource-id,
 * or text (confirmed via live page-source dump against RF8T802226Y on
 * 2026-08-06) — a genuine gap in the Flutter semantics tree, the same
 * class of issue R4 in the test design anticipated (see
 * ai-log/lessons-learned.md). A coordinate-based tap is the only way to
 * reach it today. This is fragile: these coordinates are tied to this
 * device's screen resolution (RF8T802226Y, 1080x2408) and will not
 * generalize to other screen sizes/DPIs. Replace with a real locator if
 * PUKU ever exposes one on this element.
 */
const HAMBURGER_MENU_TRIGGER_X = 112;
const HAMBURGER_MENU_TRIGGER_Y = 178;

const SETTINGS_SCROLL_REGION = { left: 100, top: 500, width: 880, height: 1600 };

class SettingsScreen extends BaseScreen {
  get profileAvatarButton(): ChainablePromiseElement {
    return this.byContentDesc('P');
  }

  /**
   * Settings-list rows render a compound content-desc — icon label and
   * text label joined by a literal newline (e.g. "Profile\nProfile"),
   * confirmed via a live dump on 2026-08-06. An exact accessibility-id
   * match on "Profile" alone fails, so this uses a `contains()` XPath
   * instead of the usual exact-match `byContentDesc`.
   */
  get profileRow(): ChainablePromiseElement {
    return $('//android.widget.Button[contains(@content-desc, "Profile")]');
  }

  get logOutButton(): ChainablePromiseElement {
    return this.byContentDesc('Log out');
  }

  get settingsHeader(): ChainablePromiseElement {
    return this.byContentDesc('Settings');
  }

  /**
   * Same compound content-desc pattern as profileRow ("Haptic
   * feedback\nHaptic feedback"). Reading this element's `checked`
   * attribute reflects the toggle's current state, confirmed live on
   * 2026-08-07 — it mirrors the value of its own nested Switch child (see
   * hapticFeedbackSwitch) even though this outer node isn't the tap
   * target itself.
   */
  get hapticFeedbackRow(): ChainablePromiseElement {
    return $('//android.widget.Switch[contains(@content-desc, "Haptic feedback")]');
  }

  /**
   * The actual tappable switch knob is a separate, unlabeled child node
   * nested under hapticFeedbackRow (content-desc="", confirmed live on
   * 2026-08-07) — tapping the parent row's label area does nothing; only
   * this specific child toggles the state. Matched structurally by
   * parent-child XPath rather than a coordinate tap, since the
   * relationship (not just a fixed pixel position) is what's stable here.
   */
  get hapticFeedbackSwitch(): ChainablePromiseElement {
    return $('//android.widget.Switch[contains(@content-desc, "Haptic feedback")]/android.widget.Switch');
  }

  /**
   * Confirmed live on 2026-08-07: this is NOT a working toggle today —
   * tapping it shows a "Notifications action placeholder" message and
   * changes no persistent state (no navigation, no checked attribute to
   * flip; unlike hapticFeedbackRow this renders as a plain Button, not a
   * Switch). Treat this as the app's current real behavior, not a test
   * gap — CHAT-E2E-010 only asserts that tapping it doesn't crash the
   * app, not that it toggles anything.
   */
  get notificationsRow(): ChainablePromiseElement {
    return $('//android.widget.Button[contains(@content-desc, "Notifications")]');
  }

  async tapHamburgerMenuTrigger(): Promise<void> {
    await driver
      .action('pointer', { parameters: { pointerType: 'touch' } })
      .move(HAMBURGER_MENU_TRIGGER_X, HAMBURGER_MENU_TRIGGER_Y)
      .down()
      .pause(100)
      .up()
      .perform();
  }

  async tapProfileAvatar(): Promise<void> {
    await this.profileAvatarButton.click();
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

  /**
   * UiAutomator2 scroll gesture over the Settings list — same technique
   * used during live exploration to reveal "Log out" at the bottom of
   * the screen.
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
