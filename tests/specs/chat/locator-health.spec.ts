import { authFlow } from '../../../src/flows/auth.flow.js';
import { homeScreen } from '../../../src/screens/home.screen.js';
import { settingsScreen } from '../../../src/screens/settings.screen.js';
import { analyzePageSource, type UnlabeledInteractiveNode } from '../../../src/utils/locator-health.js';

/**
 * CHAT-E2E-015: Locator health-check across home, drawer, and Settings.
 *
 * P2 (test-design-epic-chat-core.md) — R4 early-warning signal for silent
 * semantics-tree regressions. Every interactive element on Home, the Drawer,
 * and Settings must expose a usable locator (content-desc, resource-id,
 * stable text, or hint) or be one of the nine approved exceptions.
 *
 * Interactive-node rule (validated live on the Samsung Galaxy A13,
 * 2026-08-18): clickable="true" AND (focusable="true" OR hasUsableLocator).
 *
 * The nine approved exceptions:
 *   1. Home hamburger trigger
 *   2. Chat send control (absence-based — not present in empty-input state)
 *   3. Home incognito toggle
 *   4. Home plus/attachments button
 *   5. Home mic button
 *   6. Home voice button
 *   7. Settings back button
 *   8. Settings Haptic Feedback switch knob (clickable/focusable child of the
 *      labeled "Haptic feedback" Switch row — reached via the stable
 *      parent-child XPath in settings.screen.ts)
 *   9. Settings Information action child (clickable/focusable child of the
 *      "Information" semantics wrapper — reached via the stable parent-child
 *      XPath //android.widget.Button[@content-desc="Information"]/android.widget.Button)
 *
 * The test inspects the UI only — it never toggles settings or sends
 * messages (no R8 cost exposure). It leaves the app in the repository's
 * established default state (Home) via driver.back().
 */
describe('Locator health — P2', () => {
  it('CHAT-E2E-015 @p2: all interactive elements on home, drawer, and Settings expose usable locators or are approved exceptions', async function () {
    if (!process.env.DEVICE_UDID) {
      this.skip();
    }

    await authFlow.ensureLoggedIn();

    // 1. HOME (empty-input state — the send control is absent by design)
    const homeReport = analyzePageSource(await driver.getPageSource(), 'home');
    expectUnexpected(homeReport.unexpected, 'Home');

    // 2. DRAWER
    await settingsScreen.tapHamburgerMenuTrigger();
    const drawerReport = analyzePageSource(await driver.getPageSource(), 'drawer');
    expectUnexpected(drawerReport.unexpected, 'Drawer');

    // 3. SETTINGS
    await settingsScreen.tapProfileAvatar();
    const settingsReport = analyzePageSource(await driver.getPageSource(), 'settings');
    expectUnexpected(settingsReport.unexpected, 'Settings');

    // 4. TEARDOWN — return to the established default state (Home)
    await driver.back();
    await expect(homeScreen.chatPromptHeading).toBeDisplayed();
  });
});

/**
 * Fails the test if any unexpected unlabeled interactive node was found,
 * with a triage-friendly description of each offending node.
 *
 * Shared with `LOGIN-E2E-006` (tests/specs/auth/login-screen.spec.ts) so a
 * single helper enforces the same triage-friendly error format for every
 * locator-health check. The `scenarioId` is purely for the error prefix so
 * each spec's failure log identifies itself unambiguously.
 */
export function expectUnexpected(
  nodes: UnlabeledInteractiveNode[],
  screenLabel: string,
  scenarioId = 'CHAT-E2E-015',
): void {
  if (nodes.length === 0) {
    return;
  }

  const details = nodes
    .map(
      (node) =>
        `- ${screenLabel}: class=${node.className}, clickable=${node.clickable}, focusable=${node.focusable}, ` +
        `content-desc="${node.contentDesc}", resource-id="${node.resourceId}", text="${node.text}", ` +
        `hint="${node.hint}", bounds=${node.bounds}`,
    )
    .join('\n');

  throw new Error(
    `${scenarioId}: ${nodes.length} interactive node(s) on ${screenLabel} have no usable locator ` +
      `(content-desc, resource-id, text, or hint) and are not one of the approved exceptions.\n` +
      `This may indicate a silent accessibility-tree regression (R4).\n${details}`,
  );
}
