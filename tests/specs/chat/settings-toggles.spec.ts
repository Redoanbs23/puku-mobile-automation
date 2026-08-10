import { authFlow } from '../../../src/flows/auth.flow.js';
import { homeScreen } from '../../../src/screens/home.screen.js';
import { settingsScreen } from '../../../src/screens/settings.screen.js';

/**
 * CHAT-E2E-010: Settings toggles respond without crashing.
 *
 * P1 (test-design-epic-chat-core.md). Locators confirmed via live
 * exploration against the emulator's logged-in session on 2026-08-07.
 *
 * Two real findings from that exploration, both reflected below rather
 * than assumed away:
 * 1. Haptic feedback's actual tap target is a separate, unlabeled child
 *    element nested under the labeled row — tapping the row's label area
 *    does nothing (see settings.screen.ts).
 * 2. Notifications is not a working toggle today — tapping it shows a
 *    "Notifications action placeholder" message with no persistent state
 *    change. This test only asserts it doesn't crash the app, matching
 *    that real behavior rather than CHAT-TC-010's original assumption
 *    that it behaves like a second Haptic-feedback-style switch.
 *
 * Restores Haptic feedback to its original state before finishing, per
 * CHAT-TC-010's own note preferring restoration over drift, then leaves
 * Settings via driver.back() and confirms the home screen is visible
 * again for whatever spec runs next.
 */
describe('Settings toggles — P1', () => {
  it('CHAT-E2E-010 @p1: Settings toggles can be interacted with without crashing', async function () {
    if (!process.env.DEVICE_UDID) {
      this.skip();
    }

    await authFlow.ensureLoggedIn();
    await settingsScreen.tapHamburgerMenuTrigger();
    await settingsScreen.tapProfileAvatar();

    const originalChecked = await settingsScreen.hapticFeedbackRow.getAttribute('checked');

    await settingsScreen.tapHapticFeedbackToggle();
    const toggledChecked = await settingsScreen.hapticFeedbackRow.getAttribute('checked');
    expect(toggledChecked).not.toBe(originalChecked);

    await settingsScreen.tapHapticFeedbackToggle();
    const restoredChecked = await settingsScreen.hapticFeedbackRow.getAttribute('checked');
    expect(restoredChecked).toBe(originalChecked);

    await settingsScreen.tapNotificationsRow();
    await expect(settingsScreen.settingsHeader).toBeDisplayed();

    await driver.back();

    await expect(homeScreen.chatPromptHeading).toBeDisplayed();
  });
});
