/**
 * Base class for Screen Objects. Centralizes the default locator strategy:
 * PUKU's Flutter semantics tree exposes high-coverage content-desc values
 * (confirmed via Appium Inspector), so screens prefer accessibility id
 * (`~`) via byContentDesc() over XPath or resource-id.
 *
 * That default does not hold everywhere, and the exceptions are deliberate
 * rather than sloppy — each is documented at its own getter:
 * - Chrome Custom Tab / WebView content exposes no content-desc at all
 *   (oauth-consent.screen.ts) — text + element class via XPath instead.
 * - Some content-desc values are compound (`"Profile\nProfile"`) or embed
 *   a drifting version string (`"puku-ai-2.7"`), so exact-match fails —
 *   `contains()` XPath instead (settings.screen.ts, home.screen.ts).
 * - A few elements expose no locator whatsoever and need coordinate taps
 *   (hamburger trigger, chat send control) — see ai-log/lessons-learned.md.
 *
 * Rule of thumb: use byContentDesc() unless the element genuinely can't be
 * reached that way, and say why in a comment when it can't.
 */
export abstract class BaseScreen {
  protected byContentDesc(contentDesc: string): ChainablePromiseElement {
    return $(`~${contentDesc}`);
  }

  protected async waitForElement(element: ChainablePromiseElement, timeout = 10000): Promise<void> {
    await element.waitForDisplayed({ timeout });
  }
}
