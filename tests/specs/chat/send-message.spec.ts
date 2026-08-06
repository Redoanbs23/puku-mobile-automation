import { authFlow } from '../../../src/flows/auth.flow.js';
import { homeScreen } from '../../../src/screens/home.screen.js';

/**
 * CHAT-E2E-002: Sending a message produces a visible response.
 *
 * P0 (test-design-epic-chat-core.md). Structural assertion only, by
 * design — never asserts on the AI-generated response text itself (R9:
 * AI output is non-deterministic). Matches any response bubble that
 * isn't our own sent message; see homeScreen.responseBubbleExcluding().
 *
 * R8 GATE — DO NOT REMOVE THIS NOTE: this test sends a real message to a
 * live AI backend on every execution (real inference cost, rate-limit/
 * ToS exposure — see R8 in test-design-epic-chat-core.md). It must run
 * at most once per invocation and must NEVER be wired into a burn-in,
 * retry, or high-frequency schedule. No retries are configured anywhere
 * in this repo's wdio config as of 2026-08-06 (confirmed: no `retries`/
 * `specFileRetries` in wdio.shared.conf.ts or wdio.android.conf.ts) — if
 * that ever changes, this test must be explicitly excluded from it.
 *
 * Message content follows docs/testing/test-message-convention.md (R14).
 *
 * Typing uses homeScreen.typeChatMessage(), not a raw .setValue() call —
 * WebdriverIO's setValue() silently fails on this field (updates the
 * accessibility layer only, never the real widget). See
 * src/utils/real-text-input.ts and ai-log/lessons-learned.md.
 *
 * The send control has no content-desc/resource-id/text and is tapped
 * by coordinate (homeScreen.tapSendButton()) — see the fragility note on
 * SEND_BUTTON_X/Y in home.screen.ts and ai-log/lessons-learned.md.
 */
describe('Send message — P0', () => {
  const TEST_MESSAGE = '[PUKU-QA-TEST:CHAT-E2E-002] What is 2 + 2?';

  it('CHAT-E2E-002 @p0: sending a message produces a visible response', async function () {
    if (!process.env.DEVICE_UDID) {
      this.skip();
    }

    await authFlow.ensureLoggedIn();

    await homeScreen.typeChatMessage(TEST_MESSAGE);
    await homeScreen.tapSendButton();

    await expect(homeScreen.responseBubbleExcluding(TEST_MESSAGE)).toBeDisplayed({ wait: 20000 });
  });
});
