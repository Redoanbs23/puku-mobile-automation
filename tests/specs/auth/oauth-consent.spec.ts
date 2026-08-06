import { authFlow } from '../../../src/flows/auth.flow.js';
import { homeScreen } from '../../../src/screens/home.screen.js';

/**
 * AUTH-E2E-015: OAuth consent tap flow (pre-authenticated device only).
 *
 * Requires a physical device with a Google account already signed in at
 * the OS level, with a standing OAuth grant already authorized for PUKU.
 * On this project that device is RF8T802226Y, signed in as
 * editorpuku@gmail.com — a dedicated test account, never a personal one,
 * per the R3 credential-hygiene practice in the original test design.
 * Without that pre-authenticated state, tapping "Continue with Google"
 * lands on full Google credential entry / 2FA instead, which remains a
 * permanent manual-only lane (R2) and is NOT what this test exercises.
 *
 * This test will not run meaningfully in CI or against a fresh emulator
 * — neither has a pre-configured, pre-authorized Google account. It only
 * runs when DEVICE_UDID is set (see config/environments/local.ts) and
 * skips itself otherwise.
 *
 * See docs/adr/ADR-006-oauth-consent-automation.md for full context,
 * scope, and the named risks this test depends on.
 */
describe('OAuth consent tap flow — device-dependent', () => {
  it('AUTH-E2E-015 @p0: tapping Authorize on the consent screen logs in to PUKU', async function () {
    if (!process.env.DEVICE_UDID) {
      this.skip();
    }

    await authFlow.completeGoogleSignIn();

    await expect(homeScreen.chatPromptHeading).toBeDisplayed();
  });
});
