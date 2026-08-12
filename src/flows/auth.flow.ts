import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { localEnvironment } from '../../config/environments/local.js';
import { loginScreen } from '../screens/login.screen.js';
import { oauthConsentScreen } from '../screens/oauth-consent.screen.js';
import { homeScreen } from '../screens/home.screen.js';
import { captureLogcat, restoreNetwork, setAirplaneMode } from '../utils/adb.js';
import { logger } from '../utils/logger.js';

const emailNotConnectedToast = () =>
  $('//*[contains(@content-desc, "not connected")]');

const APP_ID = 'sh.puku.app';

const playProtectUiPatterns = [
  '//*[contains(@text, "Play Protect")]',
  '//*[contains(@text, "Install anyway")]',
  '//*[contains(@text, "harmful")]',
  '//*[contains(@text, "Blocked")]',
  '//*[contains(@content-desc, "Play Protect")]',
];

async function scanPlayProtectUi(): Promise<string[]> {
  const hits: string[] = [];
  for (const pattern of playProtectUiPatterns) {
    const el = await $(pattern);
    if (await el.isDisplayed().catch(() => false)) {
      hits.push(pattern);
    }
  }
  return hits;
}

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
  async verifySideloadedApkInstall(): Promise<void> {
    const apkPath = localEnvironment.appPath;
    if (!existsSync(apkPath)) {
      throw new Error(`LOGIN-E2E-001: APK not found at ${apkPath}`);
    }

    const sha256 = createHash('sha256').update(readFileSync(apkPath)).digest('hex');
    logger.info(`LOGIN-E2E-001 apk=${apkPath} sha256=${sha256}`);

    if (await driver.isAppInstalled(APP_ID)) {
      await driver.removeApp(APP_ID);
    }

    await driver.installApp(apkPath);
    expect(await driver.isAppInstalled(APP_ID)).toBe(true);

    await driver.activateApp(APP_ID);
    await loginScreen.waitUntilDisplayed(30000);
    await expect(loginScreen.continueWithGoogleButton).toBeDisplayed();
  },

  async documentPlayProtectSideloadBehavior(): Promise<void> {
    const apkPath = localEnvironment.appPath;
    if (!existsSync(apkPath)) {
      throw new Error(`LOGIN-E2E-003: APK not found at ${apkPath}`);
    }

    if (await driver.isAppInstalled(APP_ID)) {
      await driver.removeApp(APP_ID);
    }

    await driver.installApp(apkPath);
    await driver.pause(1500);

    const foregroundPkg = await driver.getCurrentPackage().catch(() => 'unknown');
    const uiHits = await scanPlayProtectUi();
    const logcatHit = /play protect|verify apps|harmful app|blocked by play protect/i.test(
      captureLogcat(300),
    );
    const onInstaller = /packageinstaller|vending|gms/.test(foregroundPkg);

    const behavior =
      uiHits.length > 0
        ? `ui-warning:${uiHits.length}`
        : onInstaller
          ? 'system-installer-foreground'
          : logcatHit
            ? 'logcat-mention-only'
            : 'none-observed-adb-sideload';

    logger.info(
      `LOGIN-E2E-003 play-protect-behavior=${behavior} foreground=${foregroundPkg} apk=${apkPath}`,
    );

    expect(await driver.isAppInstalled(APP_ID)).toBe(true);
    await driver.activateApp(APP_ID);
    await loginScreen.waitUntilDisplayed(30000);
    await expect(loginScreen.continueWithGoogleButton).toBeDisplayed();
  },

  async attemptGoogleSignIn(): Promise<void> {
    await loginScreen.waitUntilDisplayed();
    await loginScreen.tapContinueWithGoogle();
  },

  async attemptEmailSignIn(): Promise<void> {
    await loginScreen.waitUntilDisplayed();
    await loginScreen.tapEnterYourEmail();
  },

  async verifyLoginDeviceCompatibility(): Promise<void> {
    await loginScreen.waitUntilDisplayed();
    await expect(loginScreen.continueWithGoogleButton).toBeEnabled();
    await expect(loginScreen.enterYourEmailButton).toBeEnabled();
  },

  async verifyLoginSurvivesRotation(): Promise<void> {
    await loginScreen.waitUntilDisplayed();
    try {
      await driver.setOrientation('LANDSCAPE');
      await driver.setOrientation('PORTRAIT');
    } catch (error) {
      if (!(error instanceof Error && /locked programmatically/.test(error.message))) throw error;
    }
    await expect(loginScreen.continueWithGoogleButton).toBeDisplayed();
  },

  async observeColdStartToLogin(): Promise<void> {
    await driver.terminateApp(APP_ID);
    const start = Date.now();
    await driver.activateApp(APP_ID);
    await loginScreen.waitUntilDisplayed(30000);
    logger.info(`LOGIN-E2E-004 cold-start-to-login: ${Date.now() - start}ms`);
    await expect(loginScreen.continueWithGoogleButton).toBeDisplayed();
  },

  async verifyEmailNotConnectedToast(): Promise<void> {
    await this.attemptEmailSignIn();
    await emailNotConnectedToast().waitForDisplayed({ timeout: 5000 });
  },

  async verifyEmailToastHasNoSensitiveData(): Promise<void> {
    await this.attemptEmailSignIn();
    await driver.pause(500);
    const logcat = captureLogcat(300).toLowerCase();
    expect(logcat).not.toMatch(/bearer|password|api[_-]?key|secret/);
  },

  async verifyLoginScreenAfterEmailToast(): Promise<void> {
    await this.attemptEmailSignIn();
    await driver.pause(500);
    await expect(loginScreen.continueWithGoogleButton).toBeDisplayed();
    await expect(loginScreen.enterYourEmailButton).toBeDisplayed();
  },

  async verifyGracefulOAuthNetworkLoss(): Promise<void> {
    try {
      await setAirplaneMode(true);
      await driver.pause(1500);
      await this.attemptGoogleSignIn();
      await driver.pause(3000);
      await expect(loginScreen.continueWithGoogleButton).toBeDisplayed();
    } finally {
      await restoreNetwork();
    }
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
   * below. Two hypotheses (slow emulator; Chrome GPU-process crash-looping)
   * were tested directly on 2026-08-06 and both were ruled out. Root cause
   * remains unconfirmed beyond that; investigation is deliberately closed,
   * not open-ended — do not retry it here. See
   * docs/emulator-vs-device-comparison.md.
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
   * already displayed, otherwise runs the full OAuth consent flow first.
   *
   * That short-circuit only has something to detect if the session survived
   * into this run. The default capability (`appium:noReset: false`, see
   * config/wdio.android.conf.ts) resets app data at the start of *every*
   * session — including ones where the app was already logged in, manually
   * or otherwise. Set `APP_NO_RESET=true` when invoking tests if you need a
   * prior login to persist across runs; without it, this always falls
   * through to completeGoogleSignIn(). Discovered 2026-08-07 when this
   * silently wiped a manually-established emulator login between two
   * verification runs — see docs/emulator-vs-device-comparison.md.
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
