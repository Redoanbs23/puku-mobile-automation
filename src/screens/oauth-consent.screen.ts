import { BaseScreen } from './base.screen.js';

/**
 * The OAuth consent screen (ADR-006): tapping "Continue with Google"
 * opens a Chrome Custom Tab rendering PUKU's own puku.sh page, not a
 * native Google screen. WebView content exposes no content-desc or
 * resource-id, so this uses text + XPath instead of the accessibility-id
 * discipline the rest of the app's screens use. The heading TextView
 * shares the exact same text as the button ("Authorize Puku App"), so
 * the element class ("Button") is required to disambiguate — confirmed
 * via a live page-source dump against RF8T802226Y on 2026-08-04.
 */
class OAuthConsentScreen extends BaseScreen {
  get authorizeButton(): ChainablePromiseElement {
    return $('//android.widget.Button[@text="Authorize Puku App"]');
  }

  async waitUntilDisplayed(timeout = 15000): Promise<void> {
    await this.waitForElement(this.authorizeButton, timeout);
  }

  async tapAuthorize(): Promise<void> {
    await this.authorizeButton.click();
  }
}

export const oauthConsentScreen = new OAuthConsentScreen();
