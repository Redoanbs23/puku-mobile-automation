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
   * return to sh.puku.app -> wait for the home screen to actually render.
   *
   * Only known to succeed on the physical device (RF8T802226Y) with a
   * pre-authenticated Google account; see ADR-006. Note the dependency is
   * narrower than "emulators can't do OAuth": measured on 2026-08-06, the
   * emulator authenticates, renders the consent page, and fires the OAuth
   * callback successfully — it fails only at the final home-screen wait
   * below. Root cause unconfirmed (slow emulator vs. session not
   * established). See docs/emulator-vs-device-comparison.md.
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
    //
    // Kept at the 10000ms default deliberately. A 40s timeout was tested
    // on 2026-08-06 against the emulator and did NOT help: the emulator's
    // failure here is Chrome's GPU process crash-looping during the OAuth
    // handoff, not slow initialization. Raising this only delays the
    // failure. See docs/emulator-vs-device-comparison.md.
    await homeScreen.waitUntilDisplayed();
  },

  /**
   * Precondition helper for tests that need a logged-in state but don't
   * care how it was reached. Skips straight through if the home screen is
   * already displayed (session persisted from a prior run — noReset:true),
   * otherwise runs the full OAuth consent flow first.
   *
   * Used by every logged-in-state spec: logout, chat/home-screen,
   * chat/drawer, chat/send-message. Because they all funnel through here,
   * they share a single point of failure — if this can't establish a
   * session on a given target, all four fail identically (confirmed on the
   * emulator, 2026-08-06).
   */
  async ensureLoggedIn(): Promise<void> {
    if (await homeScreen.isDisplayed()) {
      return;
    }
    await this.completeGoogleSignIn();
  },
};
