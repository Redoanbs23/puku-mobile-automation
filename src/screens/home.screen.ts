import { BaseScreen } from './base.screen.js';

/**
 * content-desc confirmed via a live Appium page-source dump against the
 * physical device (RF8T802226Y) on 2026-08-04, immediately after
 * completing the OAuth consent flow (see ADR-006).
 */
class HomeScreen extends BaseScreen {
  get chatPromptHeading(): ChainablePromiseElement {
    return this.byContentDesc('How can i help you today!');
  }

  async isDisplayed(): Promise<boolean> {
    return this.chatPromptHeading.isDisplayed();
  }

  async waitUntilDisplayed(timeout = 10000): Promise<void> {
    await this.waitForElement(this.chatPromptHeading, timeout);
  }
}

export const homeScreen = new HomeScreen();
