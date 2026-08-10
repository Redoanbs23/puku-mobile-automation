import { authFlow } from '../../../src/flows/auth.flow.js';
import { homeScreen } from '../../../src/screens/home.screen.js';
import { drawerScreen } from '../../../src/screens/drawer.screen.js';
import { settingsScreen } from '../../../src/screens/settings.screen.js';

/**
 * CHAT-E2E-006: "New chat" from drawer starts a fresh session.
 *
 * P1 (test-design-epic-chat-core.md). Deliberately weaker than the
 * scenario's full intent — see CHAT-TC-006's own notes. Proving "New chat"
 * resets FROM visible conversation content requires either sending a
 * fresh message (blocked by R8's single-execution gate, already spent
 * this session) or navigating into a past conversation via the Chats
 * history list, which — confirmed via live exploration on 2026-08-07 —
 * routes to a separate detail screen with its own Back/Incognito controls
 * and no hamburger trigger, not the home screen's own inline state. So
 * this only confirms "New chat" doesn't crash and lands on the expected
 * empty-prompt screen, not that it actually resets prior content. The
 * before/after distinction remains unverified — a real limitation, not
 * hidden.
 */
describe('New chat — P1', () => {
  it('CHAT-E2E-006 @p1: "New chat" from drawer opens a fresh, empty session', async function () {
    if (!process.env.DEVICE_UDID) {
      this.skip();
    }

    await authFlow.ensureLoggedIn();
    await settingsScreen.tapHamburgerMenuTrigger();
    await drawerScreen.newChatButton.click();

    await expect(homeScreen.chatPromptHeading).toBeDisplayed();
    await expect(homeScreen.chatInputField).toBeDisplayed();
  });
});
