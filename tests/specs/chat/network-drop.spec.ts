import { authFlow } from '../../../src/flows/auth.flow.js';
import { homeScreen } from '../../../src/screens/home.screen.js';
import { settingsScreen } from '../../../src/screens/settings.screen.js';
import { drawerScreen } from '../../../src/screens/drawer.screen.js';
import { setWifiEnabled } from '../../../src/utils/adb.js';

/**
 * CHAT-E2E-008 — Network dropped mid-message-send produces a graceful
 * error, not a crash. P1, R8 + R9 + NFR-Reliability (see
 * test-design-epic-chat-core.md and test-cases/chat/CHAT-TC-008.md).
 *
 * SCOPE OF THIS SPEC AS OF 2026-08-27 (PLUMBING ONLY — does NOT provide
 * coverage of the actual CHAT-TC-008 contract):
 *
 * Two manual reconnaissance runs against the physical A13
 * (`R58T90F5ALY`, Android 14) on 2026-08-27 — both inconclusive — failed
 * to deliver an AI message past the chat composer (the send-tap
 * coordinate (954, 1139) is documented in home.screen.ts as only valid
 * immediately after typing into chatInputField while the keyboard
 * remains open; neither reconnaissance verified that precondition before
 * dispatching the cut, so the cut landed on an idle app with nothing in
 * flight). Without an observed network-failure UI, neither the
 * recoverable-error locator nor the no-crash assertion can be written
 * without guessing — and per the project's locator discipline
 * (locator-health check + ai-log/lessons-learned.md), guessing is not
 * permitted.
 *
 * This spec therefore exercises only the safe plumbing: it focuses the
 * chat input (the same opening-the-keyboard precondition the real
 * contract will require), wraps that step in a `try / finally` whose
 * `finally` block calls `setWifiEnabled(true)` (so the new helper's
 * re-enable path is exercised live on the A13 without sending a
 * message), and asserts only the post-restoration clean/default state
 * via the same drawer-reset pattern used by long-message.spec.ts /
 * rotation.spec.ts / conversation-background-resume.spec.ts.
 *
 * It explicitly does NOT:
 *   - Type a message into the chat composer.
 *   - Tap the send control.
 *   - Disable Wi-Fi during this spec.
 *   - Assert any "graceful error" / "retry affordance" / "no crash"
 *     behavior — those are the unobserved CHAT-TC-008 contract and
 *     remain pending live observation in a future R8-permitted session.
 *   - Define or rely on a `networkErrorSurface` locator.
 *
 * R8 GATE — DO NOT REMOVE THIS NOTE: the real CHAT-E2E-008 body (which
 * will type, send, and cut) will trigger R8 (real inference cost, one
 * send per execution, never burn-in/retry-loop/high-frequency — same
 * constraint as CHAT-E2E-002/007/019). Until that body exists, this
 * spec contributes zero R8 exposure and zero coverage of the contract.
 *
 * The `setWifiEnabled(true)` call in the `finally` is the load-bearing
 * part of this spec: it proves the new helper works on the A13, and it
 * guarantees that even if anything between the `try` and the `finally`
 * throws (an unverified `homeScreen.chatInputField.click()` shape, an
 * unexpected UI state, an assertion timeout), the device is left with
 * Wi-Fi ON — a host-discoverable failure mode, not a silent network
 * regression for whatever spec runs next.
 */
describe('Network drop — P1 (plumbing only, contract pending)', () => {
  it('CHAT-E2E-008 @p1: plumbing — wifi-restore helper works on A13, app stays in clean/default state', async function () {
    if (!process.env.DEVICE_UDID) {
      this.skip();
    }

    // Establish the logged-in state every chat-core scenario depends on
    // (per auth.flow.ts's doc comment, every logged-in-state spec funnels
    // through ensureLoggedIn). Home screen prompt heading must render.
    await authFlow.ensureLoggedIn();
    await homeScreen.waitUntilDisplayed();

    try {
      // Focus the chat input — same opening-the-keyboard precondition the
      // real CHAT-TC-008 body will require before typing + sending. Does
      // NOT type any text into the composer. The exact `click()` shape
      // here is the same one homeScreen.typeChatMessage() uses as its
      // first step (home.screen.ts JSDoc, lines 197-201), minus the
      // typeRealText() call — so this also serves as a low-cost smoke
      // check that the input-focus path is still working.
      await homeScreen.chatInputField.click();
    } finally {
      // Restore Wi-Fi unconditionally. Even though this spec never
      // disables it, having the helper actually run on the A13 validates
      // that `adb shell svc wifi enable` works end-to-end through
      // deviceArgs() on this device — a regression in either the helper
      // or the underlying adb command would surface here as a thrown
      // exception rather than as a silent CI failure the next day.
      setWifiEnabled(true);

      // Standard clean/default-state teardown established across
      // long-message.spec.ts / rotation.spec.ts /
      // conversation-background-resume.spec.ts: drawer reset rather than
      // attempting to clear the input directly (WebdriverIO's clear() /
      // setValue() are unreliable against this app's custom-rendered
      // EditText, per ai-log/lessons-learned.md). Leaves the app in the
      // clean/default home state for whatever spec runs next.
      await settingsScreen.tapHamburgerMenuTrigger();
      await drawerScreen.newChatButton.click();
    }

    // Post-restoration clean/default-state assertion — same one the
    // established chat-core specs use at the end of their teardown.
    // Asserted OUTSIDE the `finally` so a failure here produces a real
    // test result (and so the failure-capture hook fires with a
    // logcat/screenshot/video of the actual post-restoration state),
    // rather than being swallowed by the `finally` itself.
    await expect(homeScreen.chatPromptHeading).toBeDisplayed();
  });
});
