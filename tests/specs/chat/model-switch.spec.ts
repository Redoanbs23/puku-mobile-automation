import { authFlow } from '../../../src/flows/auth.flow.js';
import { homeScreen } from '../../../src/screens/home.screen.js';
import { settingsScreen } from '../../../src/screens/settings.screen.js';
import { drawerScreen } from '../../../src/screens/drawer.screen.js';
import { chatHistoryScreen } from '../../../src/screens/chat-history.screen.js';

/**
 * CHAT-E2E-005: Switching model doesn't crash the app; selection persists.
 *
 * P1 (test-design-epic-chat-core.md) — R12, NFR-Reliability. Requires a
 * logged-in state (reuses authFlow.ensureLoggedIn()), DEVICE_UDID- gated.
 *
 * Selection state is exposed by the closed-state composer model chip's
 * content-desc (homeScreen.modelChip) — verified live on the A13
 * (R58T90F5ALY) 2026-08-25: the chip reads "puku-ai-2.7" before selection
 * and becomes "Opus 4.8" immediately after tapping the Opus option. The
 * open model dialog itself exposes no selected/checked attribute on any
 * option (all render selected="false"), so the chip is the only reliable
 * persistence signal. R12-tolerant: picks the model family that is NOT
 * currently active, so the test is valid whether the default is a puku-ai
 * model or an Opus model (if only one family is available, this is an
 * account-state condition per CHAT-TC-005, and the display-only asserts
 * below will fail with a clear "not displayed" rather than guess).
 *
 * No AI message is sent — this is R8-safe (model selection only).
 *
 * Persistence is verified across in-session navigation (open drawer →
 * Chats → back home), mirroring the established CHAT-E2E-009 pattern —
 * not across a restart/background (that is R15 / CHAT-TC-019).
 */
describe('Model switch — P1', () => {
  it('CHAT-E2E-005 @p1: switching model does not crash; selection persists', async function () {
    if (!process.env.DEVICE_UDID) {
      this.skip();
    }

    await authFlow.ensureLoggedIn();

    // Current active model from the chip (e.g. "puku-ai-2.7").
    const current = ((await homeScreen.modelChip.getAttribute('content-desc')) ?? '').toLowerCase();
    expect(current.length).toBeGreaterThan(0);

    // Open the model sheet and confirm the known model families are present.
    await homeScreen.tapModelChip();
    await expect(homeScreen.modelSelectorDialogHeader).toBeDisplayed();
    await expect(homeScreen.pukuAiModelOption).toBeDisplayed();
    await expect(homeScreen.opusModelOption).toBeDisplayed();

    // Select the model family that is not currently active (deterministic,
    // R12-tolerant). Verify the chip has actually changed afterward.
    if (current.includes('opus')) {
      await homeScreen.pukuAiModelOption.click();
    } else {
      await homeScreen.opusModelOption.click();
    }

    // Tapping an option auto-closes the dialog (verified live 2026-08-25)
    // and returns to the home screen without crashing.
    await expect(homeScreen.chatPromptHeading).toBeDisplayed();

    const after = ((await homeScreen.modelChip.getAttribute('content-desc')) ?? '').toLowerCase();
    expect(after.length).toBeGreaterThan(0);
    expect(after).not.toBe(current);

    // Persistence across in-session navigation (drawer → Chats → home).
    await settingsScreen.tapHamburgerMenuTrigger();
    await drawerScreen.chatsMenuItem.click();
    await expect(chatHistoryScreen.backButton).toBeDisplayed();
    await chatHistoryScreen.backButton.click();
    await expect(homeScreen.chatPromptHeading).toBeDisplayed();

    const afterNavigation = ((await homeScreen.modelChip.getAttribute('content-desc')) ?? '').toLowerCase();
    expect(afterNavigation).toBe(after);
  });
});
