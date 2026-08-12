import { authFlow } from '../../../src/flows/auth.flow.js';
import { loginScreen } from '../../../src/screens/login.screen.js';

/**
 * P2/P3 scenarios from test-design-epic-auth-login.md's coverage matrix.
 */
describe('Login screen — P2/P3', () => {
  it('LOGIN-E2E-001 @p2: app installs from sideloaded APK without error', async () => {
    await authFlow.verifySideloadedApkInstall();
  });

  it('LOGIN-E2E-012 @p2: back navigation from the Chrome OAuth redirect returns to a sane login-screen state', async function () {
    if (!process.env.DEVICE_UDID) this.skip();
    await authFlow.attemptGoogleSignIn();
    await driver.back();
    await expect(loginScreen.continueWithGoogleButton).toBeDisplayed();
  });

  it('LOGIN-E2E-013 @p2: login screen renders correctly across >=2 device sizes/OS versions', async () => {
    await authFlow.verifyLoginDeviceCompatibility();
  });

  it('LOGIN-E2E-003 @p3: sideload/Play Protect install warning behavior documented', async () => {
    await authFlow.documentPlayProtectSideloadBehavior();
  });

  it('LOGIN-E2E-004 @p3: cold start time observed (informational)', async () => {
    await authFlow.observeColdStartToLogin();
  });

  it('LOGIN-E2E-014 @p3: device rotation on login screen — no crash, state preserved', async () => {
    await authFlow.verifyLoginSurvivesRotation();
  });
});
