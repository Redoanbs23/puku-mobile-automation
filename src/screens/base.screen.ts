/**
 * Base class for Screen Objects. Centralizes the locator strategy: PUKU's
 * Flutter semantics tree exposes high-coverage content-desc values
 * (confirmed via Appium Inspector), so screens locate elements by
 * accessibility id (`~`) rather than XPath or resource-id.
 */
export abstract class BaseScreen {
  protected byContentDesc(contentDesc: string): ChainablePromiseElement {
    return $(`~${contentDesc}`);
  }

  protected async waitForElement(element: ChainablePromiseElement, timeout = 10000): Promise<void> {
    await element.waitForDisplayed({ timeout });
  }
}
