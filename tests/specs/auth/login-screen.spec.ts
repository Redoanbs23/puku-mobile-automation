
import { loginScreen } from '../../../src/screens/login.screen.js';
import { oauthConsentScreen } from '../../../src/screens/oauth-consent.screen.js';
import { analyzePageSource } from '../../../src/utils/locator-health.js';
import { expectUnexpected } from '../chat/locator-health.spec.js';

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

  it('LOGIN-E2E-005 @p0: both auth entry points render on the login screen', async () => {
    await loginScreen.waitUntilDisplayed();
    // Both entry points are clean, single-value content-desc values — same
    // class of stable locator as the title (confirmed via live uiautomator
    // dump, 2026-08-04; see login.screen.ts). Display-only — deliberately
    // does NOT tap either button, so no authentication is initiated (the
    // redirect behavior itself is covered separately by LOGIN-E2E-007).
    await expect(loginScreen.continueWithGoogleButton).toBeDisplayed();
    await expect(loginScreen.enterYourEmailButton).toBeDisplayed();
  });

  /**
   * LOGIN-E2E-006 @p1: all interactive elements on the login screen expose
   * usable locators.
   *
   * P1 (test-design-epic-auth-login.md coverage matrix) — R4 early-warning
   * signal for silent accessibility-tree regressions on the login screen.
   * Reuses the locator-health analyzer from CHAT-E2E-015
   * (src/utils/locator-health.ts), extended with a 'login' branch.
   *
   * Live-verified on the Samsung Galaxy A13 (R58T90F5ALY) 2026-08-26: the
   * logged-out login screen has exactly 5 interactive nodes (Continue with
   * Google, Enter your email, Consumer Terms, Usage Policy,, Privacy
   * Policy), every one of which exposes a content-desc. Zero approved
   * exceptions are needed for the Login screen — the analyzer treats any
   * unlabeled interactive node as unexpected by definition.
   *
   * Display-only: this test never taps Continue with Google (covered by
   * LOGIN-E2E-007) and never taps Enter your email (covered by
   * LOGIN-E2E-008), so no authentication is initiated. It leaves the app
   * on the logged-out login screen — the clean default precondition for
   * every other login-screen scenario.
   *
   * Self-skips when DEVICE_UDID is unset (CI / fresh emulator) because the
   * live UiAutomator tree is what this scenario validates — the analyzer
   * itself is pure, but the input data is real-device-only here. Matches
   * the established pattern in tests/specs/chat/locator-health.spec.ts.
   */
  it('LOGIN-E2E-006 @p1: all interactive elements on the login screen expose usable locators', async function () {
    if (!process.env.DEVICE_UDID) {
      this.skip();
    }

    await loginScreen.waitUntilDisplayed();

    const report = analyzePageSource(await driver.getPageSource(), 'login');
    expectUnexpected(report.unexpected, 'Login', 'LOGIN-E2E-006');
  });


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

  it('LOGIN-E2E-008 @p0: tapping Enter your email shows the "not connected" toast (R1 regression guard)', async () => {
    await loginScreen.waitUntilDisplayed();
    // P0/R1 temporary regression guard: while the email sign-in flow is not
    // implemented, tapping "Enter your email" must show the
    // "Email sign-in flow is not connected yet" notification (verified live
    // as a Flutter SnackBar semantics node, 2026-08-24, physical A13).
    // This test should NOT be silently updated to keep it green: if it
    // starts failing because the expected "not connected" behavior
    // disappears, the email sign-in flow may now be implemented — that is the
    // signal to review/re-open scope (see R1 in test-design-epic-auth-login.md).
    await loginScreen.tapEnterYourEmail();
    await expect(loginScreen.emailNotConnectedSnackBar).toBeDisplayed();
  });

  /**
   * LOGIN-E2E-010 @p1: NFR-Reliability — the app remains on the login screen
   * (no crash) after the broken email-auth SnackBar fires.
   *
   * P1 (test-design-epic-auth-login.md coverage matrix; Quality Gate
   * Reliability 100%). Mirrors LOGIN-E2E-008's precondition (logged-out
   * login screen; R1 in the test design means "Enter your email" still
   * surfaces the "not connected" SnackBar today) and reuses its
   * live-verified locator (`loginScreen.emailNotConnectedSnackBar` —
   * confirmed on the Samsung Galaxy A13 (R58T90F5ALY) 2026-08-24, content-
   * desc="Email sign-in flow is not connected yet", class android.view.View).
   *
   * "No crash" is operationalized as:
   *   1. the broken email-auth SnackBar appears — proves the intended
   *      failure path actually executed (a test that never reaches the
   *      SnackBar would pass trivially and lie about reliability);
   *   2. loginScreen.titleElement (`~Puku Editor`) remains displayed —
   *      the login screen is still rendered, the Flutter engine is alive;
   *   3. driver.getCurrentPackage() === 'sh.puku.app' — focus did not
   *      leak to Chrome or a system error dialog.
   *
   * Out of scope (deliberately):
   *   - ANR / hang detection — the test design's NFR-Reliability wording
   *     is "no crash", not "no hang"; a separate, deeper probe would be
   *     needed for hang detection and is not added here.
   *   - Logcat / PII assertion — that is LOGIN-E2E-009's scope (NFR-
   *     Security); not duplicated here.
   *
   * No sleep, no retry: `expect(...).toBeDisplayed()` already polls the
   * semantics tree on the locator's default cadence, and `getCurrentPackage`
   * is a synchronous driver call. Project convention matches the rest of
   * `login-screen.spec.ts`.
   */
  it('LOGIN-E2E-010 @p1: app remains on login screen (no crash) after the broken email-auth toast', async () => {
    await loginScreen.waitUntilDisplayed();
    await loginScreen.tapEnterYourEmail();

    // (1) The intended failure path actually fired — the SnackBar appeared.
    await expect(loginScreen.emailNotConnectedSnackBar).toBeDisplayed();

    // (2) The login screen is still rendered (Flutter engine is alive).
    await expect(loginScreen.titleElement).toBeDisplayed();

    // (3) Focus has not leaked to Chrome / a system error dialog.
    expect(await driver.getCurrentPackage()).toBe('sh.puku.app');
  });

  it.skip('LOGIN-E2E-009 @p1: broken email-auth error toast contains no sensitive data', async () => {});

  it.skip('LOGIN-E2E-011 @p1: graceful error on network loss mid-Google-OAuth-redirect', async () => {});
});
