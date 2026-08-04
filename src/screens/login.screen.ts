import { BaseScreen } from './base.screen.js';

/**
 * TODO: the content-desc values below are placeholders based on manual
 * exploration notes (docs/00-apk-reconnaissance.md) — confirm the exact
 * strings against a fresh Appium Inspector session before relying on them
 * in real specs.
 */
class LoginScreen extends BaseScreen {
  get continueWithGoogleButton(): ChainablePromiseElement {
    return this.byContentDesc('Continue with Google');
  }

  get enterYourEmailButton(): ChainablePromiseElement {
    return this.byContentDesc('Enter your email');
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
