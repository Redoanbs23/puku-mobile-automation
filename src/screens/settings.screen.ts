import { BaseScreen } from './base.screen.js';
import { scalePoint, scaleRect } from '../utils/device-scale.js';

/**
 * Home screen's hamburger menu trigger has no content-desc, resource-id,
 * or text (confirmed via live page-source dump against RF8T802226Y on
 * 2026-08-06) — a genuine gap in the Flutter semantics tree, the same
 * class of issue R4 in the test design anticipated (see
 * ai-log/lessons-learned.md). A coordinate-based tap is the only way to
 * reach it today. Baseline pixels are RF8T802226Y (1080x2408); taps are
 * scaled via device-scale.ts so other screen sizes keep the same ratios.
 */
const HAMBURGER_MENU_TRIGGER_X = 112;
const HAMBURGER_MENU_TRIGGER_Y = 178;

const SETTINGS_SCROLL_REGION = { left: 100, top: 500, width: 880, height: 1600 };

class SettingsScreen extends BaseScreen {
  /**
   * Previous (RF8T802226Y): accessibility id "P".
   * New (Honor / other accounts): 1-letter sibling of "New chat".
   * Getter unions both so CHAT-E2E-003 display checks work on either device.
   */
  get profileAvatarButton(): ChainablePromiseElement {
    return $(
      '//*[@content-desc="P"] | //android.widget.Button[@content-desc="New chat"]/preceding-sibling::*[string-length(@content-desc)=1][1]',
    );
  }

  /** Confirms the navigation drawer opened (stable on all devices). */
  get drawerOpenedMarker(): ChainablePromiseElement {
    return this.byContentDesc('Chats');
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

  /**
   * Opens the drawer by tapping top-left candidates until "~Chats" appears.
   * Single fixed/scaled point is not enough across Honor vs RF8T802226Y.
   */
  async tapHamburgerMenuTrigger(): Promise<void> {
    if (await this.drawerOpenedMarker.isDisplayed().catch(() => false)) {
      return;
    }

    const { width, height } = await driver.getWindowSize();
    const scaled = await scalePoint(HAMBURGER_MENU_TRIGGER_X, HAMBURGER_MENU_TRIGGER_Y);
    const points = [
      scaled,
      { x: Math.round(width * 0.07), y: Math.round(height * 0.055) },
      { x: Math.round(width * 0.1), y: Math.round(height * 0.07) },
      { x: Math.round(width * 0.14), y: Math.round(height * 0.09) },
      { x: Math.round(width * 0.05), y: Math.round(height * 0.1) },
    ];

    for (const { x, y } of points) {
      await driver
        .action('pointer', { parameters: { pointerType: 'touch' } })
        .move(x, y)
        .down()
        .pause(100)
        .up()
        .perform();

      try {
        await this.drawerOpenedMarker.waitForDisplayed({ timeout: 2000 });
        return;
      } catch {
        // try next candidate
      }
    }

    await $('android=new UiSelector().clickable(true).instance(0)').click();
    await this.drawerOpenedMarker.waitForDisplayed({ timeout: 5000 });
  }

  async tapProfileAvatar(): Promise<void> {
    // 1) Previous — Redoan path: ~P + click
    const previous = this.byContentDesc('P');
    if (await previous.isDisplayed().catch(() => false)) {
      await previous.click();
      return;
    }

    // 2) New — any account initial beside New chat + center tap (Honor: clickable=false)
    const avatar = $(
      '//android.widget.Button[@content-desc="New chat"]/preceding-sibling::*[string-length(@content-desc)=1][1]',
    );
    await avatar.waitForDisplayed({ timeout: 10000 });

    const location = await avatar.getLocation();
    const size = await avatar.getSize();
    const x = Math.round(location.x + size.width / 2);
    const y = Math.round(location.y + size.height / 2);

    await driver
      .action('pointer', { parameters: { pointerType: 'touch' } })
      .move(x, y)
      .down()
      .pause(100)
      .up()
      .perform();
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
      ...(await scaleRect(SETTINGS_SCROLL_REGION)),
      direction: 'up',
      percent: 0.9,
    });
  }
}

export const settingsScreen = new SettingsScreen();
