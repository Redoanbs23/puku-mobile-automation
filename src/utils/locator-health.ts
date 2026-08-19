/**
 * CHAT-E2E-015 locator health-check helper.
 *
 * Parses the UiAutomator2 XML returned by driver.getPageSource() and
 * identifies interactive nodes that lack a usable locator, excluding the
 * nine approved exceptions documented for CHAT-E2E-015.
 *
 * Interactive-node rule (validated live on the Samsung Galaxy A13,
 * 2026-08-18):
 *   clickable="true" AND (focusable="true" OR hasUsableLocator)
 *
 * A node has a usable locator if it exposes a non-empty content-desc,
 * resource-id, text, or hint attribute. hint is included because the
 * repository's established convention locates the chat input via its hint
 * attribute (home.screen.ts chatInputField:
 * //android.widget.EditText[@hint="Chat with Puku..."]).
 *
 * This utility is pure (parse + analyze) and does not navigate the app.
 */

export type ScreenName = 'home' | 'drawer' | 'settings';

export interface AccessibilityNode {
  className: string;
  clickable: boolean;
  focusable: boolean;
  contentDesc: string;
  resourceId: string;
  text: string;
  hint: string;
  bounds: string;
  /** Parent node, when present — used for stable structural matching. */
  parent?: AccessibilityNode;
}

export interface UnlabeledInteractiveNode extends AccessibilityNode {
  screen: ScreenName;
}

export interface LocatorHealthReport {
  screen: ScreenName;
  interactiveCount: number;
  unlabeledCount: number;
  unexpected: UnlabeledInteractiveNode[];
}

export interface ApprovedException {
  key: string;
  screen: ScreenName;
  reason: string;
}

/**
 * The nine approved CHAT-E2E-015 exceptions.
 *
 * Home (5): the approved Home exceptions are exactly the unlabeled clickable
 * nodes on the empty-input Home screen (validated live on the Samsung Galaxy
 * A13, 2026-08-18). None exposes a distinguishing attribute, so they are
 * matched as a closed set via a count guard in analyzePageSource() — the
 * health check fails if more than five unlabeled clickable nodes appear on
 * Home.
 *
 * Chat send control: absence-based — it does not exist in the empty-input
 * Home state (confirmed live 2026-08-06), so it contributes no node.
 *
 * Settings (3): matched by stable structural/semantic characteristics:
 *  - settings-back: the unlabeled clickable android.widget.Button in the
 *    Settings app-bar.
 *  - settings-haptic-switch: the unlabeled clickable android.widget.Switch
 *    child of the labeled "Haptic feedback" Switch row — reached by the
 *    existing parent-child XPath in settings.screen.ts
 *    (//android.widget.Switch[contains(@content-desc, "Haptic feedback")]/android.widget.Switch).
 *  - settings-information-child: the unlabeled clickable child of the
 *    "Information" action's semantics wrapper — same parent-child pattern,
 *    reached via
 *    //android.widget.Button[@content-desc="Information"]/android.widget.Button.
 */
export const APPROVED_EXCEPTIONS: readonly ApprovedException[] = [
  {
    key: 'home-hamburger',
    screen: 'home',
    reason:
      'Home app-bar hamburger trigger has no content-desc/resource-id/text (confirmed live 2026-08-06; A13 2026-08-18).',
  },
  {
    key: 'chat-send-control',
    screen: 'home',
    reason:
      'Chat send control has no content-desc/resource-id/text and does not exist until the input has text (confirmed live 2026-08-06). Absence-based: not present in the empty-input Home state.',
  },
  {
    key: 'home-incognito',
    screen: 'home',
    reason: 'Home incognito toggle has no content-desc/resource-id/text (A13 2026-08-18).',
  },
  {
    key: 'home-plus',
    screen: 'home',
    reason: 'Home plus/attachments button has no content-desc/resource-id/text (A13 2026-08-18).',
  },
  {
    key: 'home-mic',
    screen: 'home',
    reason: 'Home mic button has no content-desc/resource-id/text (A13 2026-08-18).',
  },
  {
    key: 'home-voice',
    screen: 'home',
    reason: 'Home voice button has no content-desc/resource-id/text (A13 2026-08-18).',
  },
  {
    key: 'settings-back',
    screen: 'settings',
    reason:
      'Settings back button has an empty semantic label (automation-readiness.md G-4) — no content-desc/resource-id/text (A13 2026-08-18).',
  },
  {
    key: 'settings-haptic-switch',
    screen: 'settings',
    reason:
      'Haptic feedback switch knob is the clickable/focusable child of the labeled "Haptic feedback" Switch row; it has no direct content-desc/resource-id/text and is reached via the stable parent-child XPath in settings.screen.ts (A13 2026-08-18).',
  },
  {
    key: 'settings-information-child',
    screen: 'settings',
    reason:
      'Settings Information action child is the clickable/focusable child of the "Information" semantics wrapper (parent content-desc="Information", clickable=false); it has no direct content-desc/resource-id/text and is reached via the stable parent-child XPath //android.widget.Button[@content-desc="Information"]/android.widget.Button (A13 2026-08-18).',
  },
];

/** Number of approved unlabeled exceptions on the empty-input Home screen. */
const HOME_APPROVED_UNLABELED_COUNT = 5;

const TAG_PATTERN = /<(\/?)([a-zA-Z][\w.]*)\b([^>]*)>/g;
const ATTR_PATTERN = /([a-zA-Z-]+)="([^"]*)"/g;

function parseAttributes(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  let match: RegExpExecArray | null;
  ATTR_PATTERN.lastIndex = 0;
  while ((match = ATTR_PATTERN.exec(raw)) !== null) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

function parseNodes(source: string): AccessibilityNode[] {
  const nodes: AccessibilityNode[] = [];
  const stack: AccessibilityNode[] = [];
  let match: RegExpExecArray | null;
  TAG_PATTERN.lastIndex = 0;
  while ((match = TAG_PATTERN.exec(source)) !== null) {
    const closing = match[1] === '/';
    const tagName = match[2];
    const attrsRaw = match[3];
    if (closing) {
      stack.pop();
      continue;
    }
    if (tagName === 'hierarchy') {
      continue;
    }
    const attrs = parseAttributes(attrsRaw);
    const node: AccessibilityNode = {
      className: attrs['class'] ?? tagName,
      clickable: attrs['clickable'] === 'true',
      focusable: attrs['focusable'] === 'true',
      contentDesc: attrs['content-desc'] ?? '',
      resourceId: attrs['resource-id'] ?? '',
      text: attrs['text'] ?? '',
      hint: attrs['hint'] ?? '',
      bounds: attrs['bounds'] ?? '',
      parent: stack.length > 0 ? stack[stack.length - 1] : undefined,
    };
    nodes.push(node);
    if (!attrsRaw.trimEnd().endsWith('/')) {
      stack.push(node);
    }
  }
  return nodes;
}

export function hasUsableLocator(node: AccessibilityNode): boolean {
  return (
    node.contentDesc.trim() !== '' ||
    node.resourceId.trim() !== '' ||
    node.text.trim() !== '' ||
    node.hint.trim() !== ''
  );
}

export function isInteractive(node: AccessibilityNode): boolean {
  return node.clickable && (node.focusable || hasUsableLocator(node));
}

/**
 * Settings back: the unlabeled clickable android.widget.Button in the
 * Settings app-bar (empty semantic label, G-4). Distinguished from the
 * Information action's child Button (which has the same parent-child shape)
 * by requiring the parent to ALSO be an unlabeled Button — the Settings back
 * parent carries no label, whereas the Information parent carries
 * content-desc="Information" (confirmed live on the A13, 2026-08-18).
 */
function isSettingsBack(node: AccessibilityNode): boolean {
  return (
    node.className === 'android.widget.Button' &&
    !hasUsableLocator(node) &&
    node.parent?.className === 'android.widget.Button' &&
    !hasUsableLocator(node.parent)
  );
}

/**
 * Haptic feedback switch knob: the unlabeled clickable android.widget.Switch
 * child of the labeled "Haptic feedback" Switch row. The parent provides the
 * label; the child is the actual clickable/focusable target. This does NOT
 * hide all Switch elements — only the specific child whose parent row is
 * labeled "Haptic feedback".
 */
function isHapticFeedbackSwitch(node: AccessibilityNode): boolean {
  return (
    node.className === 'android.widget.Switch' &&
    !hasUsableLocator(node) &&
    node.parent?.className === 'android.widget.Switch' &&
    node.parent.contentDesc.includes('Haptic feedback')
  );
}

/**
 * Settings Information action child: the unlabeled clickable
 * android.widget.Button child of the "Information" action's semantics wrapper.
 * The parent provides the stable label ("Information"); the child is the
 * actual clickable/focusable tap target. This does NOT match every unlabeled
 * Button child — only the specific child whose parent Button row is labeled
 * "Information".
 */
function isInformationActionChild(node: AccessibilityNode): boolean {
  return (
    node.className === 'android.widget.Button' &&
    !hasUsableLocator(node) &&
    node.parent?.className === 'android.widget.Button' &&
    node.parent.contentDesc.trim() === 'Information'
  );
}

/**
 * Analyzes a UiAutomator2 page-source XML string and returns the interactive
 * nodes that lack a usable locator and are not covered by the approved
 * exceptions.
 */
export function analyzePageSource(source: string, screen: ScreenName): LocatorHealthReport {
  const nodes = parseNodes(source);
  const interactive = nodes.filter(isInteractive);
  const unlabeled = interactive.filter((node) => !hasUsableLocator(node));

  let unexpected: AccessibilityNode[];
  if (screen === 'home') {
    // The five approved Home exceptions are exactly the unlabeled clickable
    // nodes on the empty-input Home screen. None exposes a distinguishing
    // attribute, so the health check asserts the count does not exceed five.
    // Count-based (not index-based): when a sixth unlabeled node appears, all
    // unlabeled nodes are reported for triage since the approved five cannot
    // be told apart from the new one.
    unexpected = unlabeled.length > HOME_APPROVED_UNLABELED_COUNT ? unlabeled : [];
  } else if (screen === 'drawer') {
    // No approved exceptions on the Drawer.
    unexpected = unlabeled;
  } else {
    // Settings: three approved exceptions with specific structural matchers.
    // Any unlabeled node that is neither the Settings back, the Haptic
    // feedback switch knob, nor the Information action child is unexpected.
    unexpected = unlabeled.filter(
      (node) => !isSettingsBack(node) && !isHapticFeedbackSwitch(node) && !isInformationActionChild(node),
    );
  }

  return {
    screen,
    interactiveCount: interactive.length,
    unlabeledCount: unlabeled.length,
    unexpected: unexpected.map((node) => ({ ...node, screen })),
  };
}