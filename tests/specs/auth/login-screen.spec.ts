import { loginScreen } from '../../../src/screens/login.screen.js';

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

  it.skip('LOGIN-E2E-006 @p1: all interactive elements expose usable content-desc locators', async () => {});

  it.skip('LOGIN-E2E-007 @p1: tapping Continue with Google redirects to the external Chrome OAuth screen', async () => {});

  it.skip('LOGIN-E2E-008 @p0: tapping Enter your email shows the "not connected" toast (R1 regression guard)', async () => {});

  it.skip('LOGIN-E2E-009 @p1: broken email-auth error toast contains no sensitive data', async () => {});

  it.skip('LOGIN-E2E-010 @p1: app remains on login screen (no crash) after the broken email-auth toast', async () => {});

  it.skip('LOGIN-E2E-011 @p1: graceful error on network loss mid-Google-OAuth-redirect', async () => {});
});
