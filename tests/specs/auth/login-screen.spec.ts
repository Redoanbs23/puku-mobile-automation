import { authFlow } from '../../../src/flows/auth.flow.js';
import { loginScreen } from '../../../src/screens/login.screen.js';
import { oauthConsentScreen } from '../../../src/screens/oauth-consent.screen.js';

/**
 * P0/P1 scenarios from test-design-epic-auth-login.md's coverage matrix.
 * Each title carries its scenario ID and priority tag for grep-based
 * execution (npm run test:p0 / test:p1).
 */
describe('Login screen — P0/P1', () => {
  it('LOGIN-E2E-002 @p0: app launches, login screen renders without crash', async () => {
    await loginScreen.waitUntilDisplayed();
    await expect(loginScreen.titleElement).toBeDisplayed();
  });

  it('LOGIN-E2E-005 @p0: both auth entry points render on the login screen', async () => {
    await loginScreen.waitUntilDisplayed();
    await expect(loginScreen.continueWithGoogleButton).toBeDisplayed();
    await expect(loginScreen.enterYourEmailButton).toBeDisplayed();
  });

  it('LOGIN-E2E-006 @p1: all interactive elements expose usable content-desc locators', async () => {
    await loginScreen.waitUntilDisplayed();
    await expect(loginScreen.titleElement).toBeDisplayed();
    await expect(loginScreen.continueWithGoogleButton).toBeDisplayed();
    await expect(loginScreen.orDivider).toBeDisplayed();
    await expect(loginScreen.enterYourEmailButton).toBeDisplayed();
  });

  it('LOGIN-E2E-007 @p1: tapping Continue with Google redirects to the external Chrome OAuth screen', async function () {
    if (!process.env.DEVICE_UDID) this.skip();
    await authFlow.attemptGoogleSignIn();
    await expect(oauthConsentScreen.authorizeButton).toBeDisplayed();
  });

  it('LOGIN-E2E-008 @p0: tapping Enter your email shows the "not connected" toast (R1 regression guard)', async () => {
    await authFlow.verifyEmailNotConnectedToast();
  });

  it('LOGIN-E2E-009 @p1: broken email-auth error toast contains no sensitive data', async () => {
    await authFlow.verifyEmailToastHasNoSensitiveData();
  });

  it('LOGIN-E2E-010 @p1: app remains on login screen (no crash) after the broken email-auth toast', async () => {
    await authFlow.verifyLoginScreenAfterEmailToast();
  });

  it('LOGIN-E2E-011 @p1: graceful error on network loss mid-Google-OAuth-redirect', async function () {
    if (!process.env.DEVICE_UDID) this.skip();
    await authFlow.verifyGracefulOAuthNetworkLoss();
  });
});
