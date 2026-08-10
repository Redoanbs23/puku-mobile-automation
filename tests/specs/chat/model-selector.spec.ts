import { authFlow } from '../../../src/flows/auth.flow.js';
import { homeScreen } from '../../../src/screens/home.screen.js';

/**
 * CHAT-E2E-004: Model selector opens and lists available models.
 *
 * P1 (test-design-epic-chat-core.md) — R12. Requires a logged-in state;
 * reuses authFlow.ensureLoggedIn() rather than duplicating the OAuth flow.
 * Requires DEVICE_UDID (this.skip() otherwise) and, on the emulator,
 * APP_NO_RESET=true so the already-logged-in session survives the session
 * boundary — see docs/emulator-vs-device-comparison.md.
 *
 * Opened-dialog locators confirmed via live exploration against the
 * emulator's logged-in session on 2026-08-07. Per R12 and CHAT-TC-004,
 * exact model names/versions are deliberately not asserted — only that the
 * dialog opens and that an option from each currently-known model family
 * is present, tolerating version drift the same way modelSelector's own
 * closed-state locator already does (see home.screen.ts).
 *
 * Dismisses the dialog before finishing (tap-outside-to-dismiss via
 * modelSelectorScrim, confirmed live as the natural dismiss gesture) and
 * asserts the home screen is visible again — otherwise this test would
 * leave the app on the dialog for whatever spec runs next.
 */
describe('Model selector — P1', () => {
  it('CHAT-E2E-004 @p1: model selector opens and lists available models', async function () {
    if (!process.env.DEVICE_UDID) {
      this.skip();
    }

    await authFlow.ensureLoggedIn();

    await homeScreen.tapModelSelector();

    await expect(homeScreen.modelSelectorDialogHeader).toBeDisplayed();
    await expect(homeScreen.pukuAiModelOption).toBeDisplayed();
    await expect(homeScreen.opusModelOption).toBeDisplayed();

    await homeScreen.dismissModelSelector();

    await expect(homeScreen.modelSelectorDialogHeader).not.toBeDisplayed();
    await expect(homeScreen.chatPromptHeading).toBeDisplayed();
  });
});
