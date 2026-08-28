
import { loginScreen } from '../../../src/screens/login.screen.js';
import { oauthConsentScreen } from '../../../src/screens/oauth-consent.screen.js';
import { analyzePageSource } from '../../../src/utils/locator-health.js';
import { disableWifi, enableWifi } from '../../../src/utils/adb.js';
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

  it.skip('LOGIN-E2E-009 @p1: broken email-auth error toast contains no sensitive data', async () => {});

  it.skip('LOGIN-E2E-010 @p1: app remains on login screen (no crash) after the broken email-auth toast', async () => {});

  /**
   * LOGIN-E2E-011 @p1 (R2 + NFR-Reliability): the OAuth-redirect reliability
   * contract — if the network drops while PUKU is mid-handoff to the external
   * Chrome Custom Tab, PUKU must not crash. The app process must remain
   * healthy and the logged-out login screen must remain reachable.
   *
   * Reuses LOGIN-E2E-007's redirect-detection pattern (driver.getCurrentPackage()
   * === 'com.android.chrome') up to the point where the redirect is
   * demonstrably underway. Then disables the device's Wi-Fi radio via the
   * new disableWifi() helper, asserts PUKU's process and login screen
   * survive the offline window, and unconditionally restores Wi-Fi in a
   * finally block — a failed assertion must NEVER leave the device offline.
   *
   * What this scenario deliberately does NOT do, per R2 (Google OAuth
   * fragility) and the design doc's NFR-Reliability wording:
   *   - never taps Authorize / never completes OAuth (R2 hard boundary)
   *   - never asserts anything about Chrome's offline UI / never enters
   *     credentials / never modifies the Google account state
   *   - never asserts a specific Chrome behavior (offline dino, error
   *     page, etc.) — Chrome's offline presentation is Chrome's problem,
   *     not PUKU's. PUKU's contract is just "still alive and reachable".
   *
   * Device-dependent: same precondition shape as LOGIN-E2E-006/007/009 —
   * the Appium session is what performs the assertions, and the network
   * disable/restore is via adb-over-USB (NOT the Wi-Fi being toggled), so
   * disabling Wi-Fi on the device does not sever the Appium session.
   * Self-skips when DEVICE_UDID is unset (CI / fresh emulator).
   *
   * Empirical baseline for this scenario on R58T90F5ALY (Samsung Galaxy
   * A13, SM-A135F, Android 14, user build), recon 2026-08-28:
   *   - Continue with Google tap → com.android.chrome IntentDispatcher
   *     (~t+1s) → org.chromium.chrome.browser.customtabs.CustomTabActivity
   *     (~t+2s and stable thereafter) — verified live.
   *   - adb shell svc wifi disable → wifi_on flips 1→0, Active default
   *     network flips to "none" — verified live, restored after.
   *   - adb shell svc data disable is silently a no-op on this firmware
   *     (no SIM, no SubscriptionId), so Wi-Fi toggle alone is the entire
   *     network-control surface here. The disableWifi/enableWifi helpers
   *     in src/utils/adb.ts are deliberately named to match.
   */
  it('LOGIN-E2E-011 @p1: graceful error on network loss mid-Google-OAuth-redirect', async function () {
    if (!process.env.DEVICE_UDID) {
      this.skip();
    }

    // Baseline: logged-out login screen.
    await loginScreen.waitUntilDisplayed();

    // Begin the OAuth redirect.
    await loginScreen.tapContinueWithGoogle();

    // Verify the redirect is demonstrably underway. Mirrors LOGIN-E2E-007's
    // assertion shape, but stops there: this scenario does NOT wait for the
    // consent page (it deliberately interrupts the network before the page
    // could load) and does NOT call oauthConsentScreen (that gate is for
    // AUTH-E2E-015 / LOGIN-E2E-007, both of which complete the happy path
    // observation; LOGIN-E2E-011 asserts the negative-path reliability).
    await driver.waitUntil(async () => (await driver.getCurrentPackage()) === 'com.android.chrome', {
      timeout: 15000,
      timeoutMsg: 'App did not hand off to external Chrome after tapping Continue with Google',
    });

    // Network drop — the actual SUT input. Wi-Fi is the only active
    // network interface on this device (no SIM, no SubscriptionId); see
    // src/utils/adb.ts disableWifi() doc for the empirical justification.
    disableWifi();

    try {
      // Brief settle window — Chrome may transition to its offline UI on
      // its own schedule; PUKU is paused but its process is alive.
      await driver.pause(1500);

      // Best-effort: if Chrome is still foreground, dismiss the Custom Tab
      // so PUKU resumes. If Chrome has already auto-dismissed (offline
      // Custom Tabs do this in some OS versions), this is a no-op.
      const currentPackage = await driver.getCurrentPackage();
      if (currentPackage !== 'sh.puku.app') {
        await driver.back();
      }

      // NFR-Reliability contract: PUKU's process is alive AND PUKU's own
      // login screen is reachable again. The title content-desc is the
      // strongest such signal — it is a Flutter semantics node that
      // exists only when the login screen has actually rendered.
      // Polled, not single-snapshot, because the foreground transition
      // back to PUKU is not instantaneous on this firmware.
      await driver.waitUntil(
        async () => {
          try {
            return await loginScreen.titleElement.isDisplayed();
          } catch {
            return false;
          }
        },
        {
          timeout: 10000,
          timeoutMsg: 'PUKU login screen not reachable after network loss during OAuth redirect',
        },
      );

      // Clean default state: logged-out login screen.
      await loginScreen.waitUntilDisplayed();
    } finally {
      // ALWAYS restore Wi-Fi — even if any assertion above failed. The
      // device must never be left offline by a failed test.
      try {
        enableWifi();
      } catch {
        // Swallow: a restore-side failure must not mask the assertion
        // failure that caused us to enter finally. The assertion failure
        // is the primary signal; the device's network state can be
        // recovered externally if this swallow ever fires.
      }
      // Best-effort: leave PUKU foreground on the logged-out login screen.
      try {
        const finalPackage = await driver.getCurrentPackage();
        if (finalPackage !== 'sh.puku.app') {
          await driver.back();
        }
      } catch {
        // Same reasoning — swallow secondary failures in finally.
      }
    }
  });
});
