import { loginScreen } from '../../../src/screens/login.screen.js';
import { oauthConsentScreen } from '../../../src/screens/oauth-consent.screen.js';

/**
 * P0/P1 scenarios from test-design-epic-auth-login.md's coverage matrix.
 * Stubs only — implementation comes via the ATDD/automate workflow, not
 * this scaffold. Each title carries its scenario ID and priority tag for
 * traceability and grep-based execution (npm run test:p0 / test:p1).
 */
describe('Login screen — P0/P1', () => {
  it('LOGIN-E2E-002 @p0: app launches, login screen renders without crash', async () => {
    await loginScreen.waitUntilDisplayed();
    // Title's content-desc is a clean single value (confirmed via live
    // uiautomator dump); the Google button is an ImageView and less stable
    // as render-proof, so the title is the chosen "known element" signal.
    await expect(loginScreen.titleElement).toBeDisplayed();
  });

  it.skip('LOGIN-E2E-005 @p0: both auth entry points render on the login screen', async () => {});

  it.skip('LOGIN-E2E-006 @p1: all interactive elements expose usable content-desc locators', async () => {});

  /**
   * LOGIN-E2E-007 @p1 (R2 lane): tapping "Continue with Google" redirects the
   * app off to the external Chrome OAuth consent screen — and stops there.
   *
   * Device-dependent (see ADR-006, docs/adr/ADR-006-oauth-consent-automation.md):
   * only runs on a physical device with a Google account already signed in at
   * the OS level (on this project, the ADR-006 fixture, e.g. R58T90F5ALY as
   * editorpuku@gmail.com). With that state, tapping the button triggers
   * Google's silent OS-level re-auth and opens a Chrome Custom Tab rendering
   * PUKU's OWN puku.sh consent page (not Google's UI), whose "Authorize Puku
   * App" button this test waits for. Without that pre-authenticated state, the
   * same tap lands on full Google credential entry / 2FA — a permanent
   * manual-only lane (R2) NOT exercised here. Like oauth-consent.spec.ts
   * (AUTH-E2E-015), it skips itself when DEVICE_UDID is unset (CI / fresh
   * emulator) and will not run meaningfully there.
   *
   * Boundary: this test verifies the redirect to the external Chrome OAuth
   * consent screen ONLY. It never taps "Authorize" and never completes OAuth —
   * that is the R2 hard boundary, enforced here by construction (no call to
   * oauthConsentScreen.tapAuthorize()).
   */
  it('LOGIN-E2E-007 @p1: tapping Continue with Google redirects to the external Chrome OAuth screen', async function () {
    // Requires a pre-authenticated physical device; skip everywhere else.
    if (!process.env.DEVICE_UDID) {
      this.skip();
    }

    await loginScreen.waitUntilDisplayed();
    await loginScreen.tapContinueWithGoogle();

    // Part 1 — the redirect actually leaves the app for the system browser:
    // the consent page renders inside an external Chrome (CustomTabActivity).
    await driver.waitUntil(async () => (await driver.getCurrentPackage()) === 'com.android.chrome', {
      timeout: 15000,
      timeoutMsg: 'App did not hand off to external Chrome after tapping Continue with Google',
    });

    // Part 2 — the AUTHORITATIVE assertion: the OAuth consent screen is
    // reached. oauthConsentScreen waits for PUKU's "Authorize Puku App"
    // Button on the puku.sh consent page rendered in the Chrome Custom Tab.
    // (Authorize is NOT tapped — completing OAuth is out of scope for this
    // scenario.)
    await oauthConsentScreen.waitUntilDisplayed();
    await expect(oauthConsentScreen.authorizeButton).toBeDisplayed();

    // Teardown — return to the app's logged-out login screen (clean default
    // state, per project rules; no OAuth was completed so no session exists).
    await driver.back();
    await loginScreen.waitUntilDisplayed();
  });

  it.skip('LOGIN-E2E-008 @p0: tapping Enter your email shows the "not connected" toast (R1 regression guard)', async () => {});

  it.skip('LOGIN-E2E-009 @p1: broken email-auth error toast contains no sensitive data', async () => {});

  it.skip('LOGIN-E2E-010 @p1: app remains on login screen (no crash) after the broken email-auth toast', async () => {});

  it.skip('LOGIN-E2E-011 @p1: graceful error on network loss mid-Google-OAuth-redirect', async () => {});
});
