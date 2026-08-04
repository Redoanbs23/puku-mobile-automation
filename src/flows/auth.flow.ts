import { loginScreen } from '../screens/login.screen.js';

/**
 * Composed flows over screen objects. Only the login screen is reachable
 * today — R1 in the test design (the broken email-auth flow) blocks
 * everything past it — so this stays thin until more screens open up.
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
};
