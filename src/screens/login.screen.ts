import { BaseScreen } from './base.screen.js';

/**
 * content-desc values below confirmed via a live `adb shell uiautomator
 * dump` against the running emulator on 2026-08-04 (see
 * docs/00-apk-reconnaissance.md, which only documented these in prose —
 * flagged as a doc gap to fix separately).
 */
class LoginScreen extends BaseScreen {
  get titleElement(): ChainablePromiseElement {
    return this.byContentDesc('Puku Editor');
  }

  get continueWithGoogleButton(): ChainablePromiseElement {
    return this.byContentDesc('Continue with Google');
  }

  get enterYourEmailButton(): ChainablePromiseElement {
    return this.byContentDesc('Enter your email');
  }

  get orDivider(): ChainablePromiseElement {
    return this.byContentDesc('OR');
  }

  async waitUntilDisplayed(timeout = 10000): Promise<void> {
    await this.waitForElement(this.continueWithGoogleButton, timeout);
  }

  async tapContinueWithGoogle(): Promise<void> {
    await this.continueWithGoogleButton.click();
  }

  async tapEnterYourEmail(): Promise<void> {
    await this.enterYourEmailButton.click();
  }
}

export const loginScreen = new LoginScreen();
