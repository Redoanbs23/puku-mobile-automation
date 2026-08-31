/**
 * P2/P3 scenarios from test-design-epic-auth-login.md's coverage matrix.
 * Stubs only — implementation comes via the ATDD/automate workflow, not
 * this scaffold.
 */
import { loginScreen } from '../../../src/screens/login.screen.js';

describe('Login screen — P2/P3', () => {
  it.skip('LOGIN-E2E-001 @p2: app installs from sideloaded APK without error', async () => {});

  /**
   * LOGIN-E2E-012 @p2: back navigation from the Chrome OAuth redirect
   * returns the app to a sane login-screen state.
   *
   * Scenario scope (test-design-epic-auth-login.md coverage matrix, line 151):
   * assert the post-redirect back-nav result — that pressing the system back
   * key while the Chrome Custom Tab is foreground returns PUKU to its
   * logged-out login screen (the clean default precondition). Risk link: none
   * (the design doc notes column is empty); adjacent to R2 by topic only.
   *
   * Out of scope by construction — mirroring LOGIN-E2E-007's R2 boundary:
   *   - never asserts on the Custom Tab's page content (no consent-page UI,
   *     no "Authorize Puku App" button, no Google sign-in prompt);
   *   - never calls oauthConsentScreen or any authorize-tap helper;
   *   - never requires a pre-authenticated Google account at the OS level
   *     (the redirect to PUKU's own puku.sh authorize endpoint is a property
   *     of the app's intent, not of the device's account state — confirmed
   *     by reconnaissance on R58T90F5ALY on 2026-08-28: tapping "Continue
   *     with Google" still hands off to a Chrome Custom Tab even with no
   *     `com.google` account present in `dumpsys account`).
   *
   * Reuses the existing redirect-detection pattern from LOGIN-E2E-007
   * (`driver.waitUntil(getCurrentPackage() === 'com.android.chrome', { timeout: 15000 })`)
   * and the existing `loginScreen.waitUntilDisplayed()` as the sane-state
   * signal. The teardown after the assertion leaves the device on the
   * logged-out login screen — the clean default state, no OAuth was
   * completed.
   *
   * Self-skips when DEVICE_UDID is unset (CI / fresh emulator) because the
   * scenario's SUT is the live OS-level back-press behavior on a real
   * device, mirroring the established pattern in LOGIN-E2E-006/007/011.
   */
  it('LOGIN-E2E-012 @p2: back navigation from the Chrome OAuth redirect returns to a sane login-screen state', async function () {
    if (!process.env.DEVICE_UDID) {
      this.skip();
    }

    // Baseline: logged-out login screen.
    await loginScreen.waitUntilDisplayed();

    // Trigger the OAuth redirect — same mechanism as LOGIN-E2E-007. Does not
    // require any specific Google-account state at the OS level.
    await loginScreen.tapContinueWithGoogle();

    // Brief observability pause after the tap. Without this pause, the redirect+back sequence can pass synchronously
    // in a way that's not visibly observable during local physical execution.
    // 1s is short enough that no scenario timeout (15s Chrome-wait, 10s
    // PUKU-return, 10s login-wait, 60s Mocha) is at risk, and long enough
    // that the intermediate Chrome Custom Tab transition is clearly visible
    // to the operator. The synchronization below (the Chrome-package wait)
    // is still the authoritative handoff signal — this pause does NOT
    // replace it, weaken it, or alter its timeout.
    await driver.pause(1000);

    // Wait until the Chrome Custom Tab is foreground — confirms the redirect
    // happened and there is something to back out of. We deliberately do NOT
    // assert on the Custom Tab's page content here (that's LOGIN-E2E-007 /
    // AUTH-E2E-015 territory and requires a pre-authenticated Google account).
    await driver.waitUntil(async () => (await driver.getCurrentPackage()) === 'com.android.chrome', {
      timeout: 15000,
      timeoutMsg: 'App did not hand off to external Chrome after tapping Continue with Google',
    });

    // The actual SUT action under test: a single system back press from the
    // Custom Tab. Mirrors the teardown half of LOGIN-E2E-007 but is here the
    // assertion target, not a teardown.
    await driver.back();

    // PUKU is foreground again. This is the observable back-nav
    // result: the Custom Tab closed and the app resumed.
    await driver.waitUntil(async () => (await driver.getCurrentPackage()) === 'sh.puku.app', {
      timeout: 10000,
      timeoutMsg: 'App did not return to PUKU after system back from OAuth redirect',
    });

    await loginScreen.waitUntilDisplayed();
    await expect(loginScreen.titleElement).toBeDisplayed();
  });

  it.skip('LOGIN-E2E-013 @p2: login screen renders correctly across >=2 device sizes/OS versions', async () => {});

  it.skip('LOGIN-E2E-003 @p3: sideload/Play Protect install warning behavior documented', async () => {});

  it.skip('LOGIN-E2E-004 @p3: cold start time observed (informational)', async () => {});

  it.skip('LOGIN-E2E-014 @p3: device rotation on login screen — no crash, state preserved', async () => {});
});
