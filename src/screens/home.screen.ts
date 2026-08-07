import { BaseScreen } from './base.screen.js';
import { typeRealText } from '../utils/real-text-input.js';

/**
 * Send control has no content-desc, resource-id, or text (confirmed via
 * live dump against RF8T802226Y on 2026-08-06) — a second accessibility
 * gap, same class of issue as the hamburger menu trigger (see
 * settings.screen.ts and ai-log/lessons-learned.md). Worse than the
 * hamburger's: this element does not exist at all until the chat input
 * has text, and its position depends on the on-screen keyboard being
 * open, which shifts the whole input card upward. These coordinates are
 * only valid immediately after typing into chatInputField while the
 * keyboard remains open — do not reuse them in any other state.
 */
const SEND_BUTTON_X = 954;
const SEND_BUTTON_Y = 1139;

/**
 * content-desc confirmed via a live Appium page-source dump against the
 * physical device (RF8T802226Y) on 2026-08-04, immediately after
 * completing the OAuth consent flow (see ADR-006).
 */
class HomeScreen extends BaseScreen {
  get chatPromptHeading(): ChainablePromiseElement {
    return this.byContentDesc('How can i help you today!');
  }

  /**
   * content-desc includes the active model's version string (confirmed
   * "puku-ai-2.7" via the 2026-08-04 dump). This drifts as PUKU updates
   * its models — the chat-core epic kickoff on 2026-08-06 already
   * references "puku-ai-2.8" as currently observed. Deliberately matched
   * by prefix rather than pinned to either exact version, since the
   * element and its stable prefix are confirmed but the exact current
   * suffix is not.
   */
  get modelSelector(): ChainablePromiseElement {
    return $('//android.widget.ImageView[contains(@content-desc, "puku-ai")]');
  }

  /**
   * No content-desc on this element (confirmed via the 2026-08-04 dump —
   * content-desc="" on the raw EditText node). Matched structurally by
   * class + hint text instead of the usual accessibility-id discipline.
   */
  get chatInputField(): ChainablePromiseElement {
    return $('//android.widget.EditText[@hint="Chat with Puku..."]');
  }

  /**
   * Both the user's own sent message and PUKU's response render as plain
   * android.view.View elements with a `text` attribute (no content-desc)
   * — confirmed via live dump against RF8T802226Y on 2026-08-06. Matched
   * this way, excluding the known sent message, rather than by the
   * response's own content — never assert on AI-generated text itself
   * (R9: AI output is non-deterministic). `ownMessage` must exactly equal
   * what was sent, and must not itself contain a double-quote character
   * (the docs/testing/test-message-convention.md content rule already
   * keeps test messages simple enough that this holds).
   */
  responseBubbleExcluding(ownMessage: string): ChainablePromiseElement {
    return $(`//android.view.View[@text != "" and @text != "${ownMessage}"]`);
  }

  /**
   * A single, un-retried isDisplayed() check races a cold app launch: with
   * APP_NO_RESET=true (config/wdio.android.conf.ts), a session-restoring
   * launch can take longer to render than the instant this check used to
   * run at, producing a false "not logged in" read even though the app is
   * genuinely logged in and about to show the home screen. Found via
   * ensureLoggedIn() (src/flows/auth.flow.ts) misfiring on 2026-08-07 — see
   * docs/emulator-vs-device-comparison.md. Short poll window instead: long
   * enough to tolerate that slower cold launch, short enough not to
   * meaningfully slow down the normal noReset:false path, where the
   * correct answer is genuinely "false" and returns quickly anyway.
   */
  async isDisplayed(): Promise<boolean> {
    try {
      await this.waitForElement(this.chatPromptHeading, 4000);
      return true;
    } catch {
      return false;
    }
  }

  async waitUntilDisplayed(timeout = 10000): Promise<void> {
    await this.waitForElement(this.chatPromptHeading, timeout);
  }

  /**
   * Focuses the chat input (opens the keyboard) then types via real
   * IME injection — WebdriverIO's setValue() silently fails on this
   * field, see ai-log/lessons-learned.md and src/utils/real-text-input.ts.
   */
  async typeChatMessage(text: string): Promise<void> {
    await this.chatInputField.click();
    typeRealText(text);
  }

  async tapSendButton(): Promise<void> {
    await driver
      .action('pointer', { parameters: { pointerType: 'touch' } })
      .move(SEND_BUTTON_X, SEND_BUTTON_Y)
      .down()
      .pause(100)
      .up()
      .perform();
  }
}

export const homeScreen = new HomeScreen();
