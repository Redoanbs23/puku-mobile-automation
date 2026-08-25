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

  /**
   * The transient SnackBar shown when "Enter your email" is tapped while the
   * email sign-in flow is not wired up (R1 regression guard, LOGIN-E2E-008).
   * Exposed as a Flutter semantics node with the message in its content-desc
   * (live-verified 2026-08-24 on physical A13: class android.view.View,
   * text="", content-desc="Email sign-in flow is not connected yet").
   * Temporary — remove when email sign-in ships and this guard is retired.
   */
  get emailNotConnectedSnackBar(): ChainablePromiseElement {
    return this.byContentDesc('Email sign-in flow is not connected yet');
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
