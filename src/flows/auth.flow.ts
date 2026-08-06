import { loginScreen } from '../screens/login.screen.js';
import { oauthConsentScreen } from '../screens/oauth-consent.screen.js';
import { homeScreen } from '../screens/home.screen.js';

/**
 * Composed flows over screen objects.
 *
 * attemptEmailSignIn() only reaches the login screen's own tap — R1 in
 * the test design (the broken email-auth flow) blocks everything past
 * it. completeGoogleSignIn() goes further: on a physical device with a
 * pre-authenticated Google account, Google's OAuth consent can be
 * completed and reaches PUKU's logged-in home screen. That path remains
 * device-dependent — see ADR-006 (docs/adr/ADR-006-oauth-consent-automation.md)
 * for the full context and constraints.
 */
export const authFlow = {
  async attemptGoogleSignIn(): Promise<void> {
    await loginScreen.waitUntilDisplayed();
    await loginScreen.tapContinueWithGoogle();
  },

  async attemptEmailSignIn(): Promise<void> {
    await loginScreen.waitUntilDisplayed();
    await loginScreen.tapEnterYourEmail();
  },

  /**
   * Completes the full OAuth consent tap flow (AUTH-E2E-015 / ADR-006):
   * tap "Continue with Google" -> wait for and tap PUKU's "Authorize"
   * consent page in the Chrome Custom Tab -> wait for the app context to
   * return to sh.puku.app. Requires a physical device with a
   * pre-authenticated Google account; see ADR-006.
   */
  async completeGoogleSignIn(): Promise<void> {
    await this.attemptGoogleSignIn();
    await oauthConsentScreen.waitUntilDisplayed();
    await oauthConsentScreen.tapAuthorize();

    await driver.waitUntil(async () => (await driver.getCurrentPackage()) === 'sh.puku.app', {
      timeout: 15000,
      timeoutMsg: 'App did not return to sh.puku.app after tapping Authorize',
    });

    // Package switching to sh.puku.app confirms we've left Chrome, but not
    // that Flutter has finished laying out the home screen yet. Callers
    // that need to interact with home-screen content immediately (e.g.
    // logout.spec.ts's coordinate-based hamburger tap) need the real UI
    // to be ready, not just the correct package name.
    await homeScreen.waitUntilDisplayed();
  },

  /**
   * Precondition helper for tests that need a logged-in state but don't
   * care how it was reached (e.g. logout.spec.ts). Skips straight through
   * if the home screen is already displayed (session persisted from a
   * prior run — noReset:true), otherwise runs the full OAuth consent
   * flow first.
   */
  async ensureLoggedIn(): Promise<void> {
    if (await homeScreen.isDisplayed()) {
      return;
    }
    await this.completeGoogleSignIn();
  },
};
