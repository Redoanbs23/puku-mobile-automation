import { mkdirSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { authFlow } from '../../../src/flows/auth.flow.js';
import { homeScreen } from '../../../src/screens/home.screen.js';
import { settingsScreen } from '../../../src/screens/settings.screen.js';
import { drawerScreen } from '../../../src/screens/drawer.screen.js';
import { adbCommand, setWifiEnabled } from '../../../src/utils/adb.js';

/**
 * CHAT-E2E-008 — Network dropped mid-message-send produces a graceful
 * error, not a crash. P1, R8 + R9 + NFR-Reliability (see
 * test-design-epic-chat-core.md and test-cases/chat/CHAT-TC-008.md).
 *
 * CONTROLLED R8 EXPERIMENT (2026-08-27 — supersedes the plumbing-only
 * placeholder of the same date). The previous valid manual
 * reconnaissance (chat008-sent.xml and the three chat008-post-cut-*.xml
 * captures) confirmed that a human-driven PowerShell sequence
 * introduces enough host-side latency between `adb shell input tap 954
 * 1139` and `adb shell svc wifi disable` that the AI response ("Hello")
 * had already rendered before the Wi-Fi radio flipped off — the cut
 * missed the in-flight request and the contract remained unobserved.
 *
 * This spec eliminates that manual latency by issuing the send-tap and
 * the Wi-Fi disable on the test thread, with NO `driver.pause` between
 * them. The cut is dispatched via the existing `setWifiEnabled(false)`
 * helper (which uses the same `adbCommand(...) + execSync(...)` shape
 * as the rest of `src/utils/adb.ts`). The two operations are dispatched
 * back-to-back on the test thread; the only delay between them is the
 * Node `execSync` round-trip for the adb shell command (sub-second on a
 * local device).
 *
 * Preconditions the spec enforces before the cut (eliminates the
 * silent-failure modes of the manual reconnaissance — verified live on
 * the A13 on 2026-08-27, see CHAT-TC-008.md "What a future run needs"):
 *   1. Keyboard actually open after the chat-input focus tap — read
 *      via `adb shell dumpsys input_method` (project convention; no
 *      `src/utils/keyboard.ts` exists).
 *   2. Exact typed message is present in the EditText — read via the
 *      existing `homeScreen.chatInputFieldWithText` (class-only)
 *      locator.
 *
 * NOTE — there is intentionally NO pre-send user-bubble assertion. The
 * user bubble is rendered as an `android.view.View` only AFTER the
 * send-tap succeeds (compare evidence/008-recon-2026-08-27/chat008-pre-send.xml,
 * where the typed text lives on the `android.widget.EditText` at
 * bounds [93,1082][920,1195], vs chat008-sent.xml, where it lives on a
 * new `android.view.View` at bounds [45,329][1035,543]). Asserting
 * "user bubble present before send" would be structurally unreachable.
 * The EditText text verification (#2 above) is the final pre-send
 * verification on the test side.
 *
 * Post-cut observation (does NOT assume an error UI):
 *   - Capture `driver.getPageSource()` at four checkpoints
 *     (~1 s / ~3 s / ~8 s / ~20 s after the cut). Persist each XML via
 *     Node `fs` APIs (`mkdirSync(..., { recursive: true })` +
 *     `writeFileSync(...)`) — cross-platform: Windows + Linux/macOS +
 *     CI runners, no POSIX-only shell out.
 *   - At each checkpoint, log structural diagnostics: user-bubble
 *     presence, response-candidate presence (using the existing
 *     `homeScreen.responseBubbleExcluding(TEST_MESSAGE)` pattern via
 *     inline XPath — same locator shape, no new locator invented),
 *     error-keyword regex hit, node count, non-empty-text count.
 *     Diagnostics are logged, NOT asserted on — they exist so the
 *     implementer of the future contract assertion can read the
 *     captured XMLs and decide whether an actual recoverable-error
 *     surface exists.
 *
 * Hard assertions remain limited to the no-crash half of the contract:
 *   - foreground package is `sh.puku.app`
 *   - chat composer (`chatInputFieldWithText`) is still rendered
 * Both use existing verified locators. The graceful-error half of the
 * contract is NOT asserted here — without live-verified evidence of an
 * actual network-error surface, asserting one would be guessing.
 *
 * R8 GATE — DO NOT REMOVE THIS NOTE: this spec consumes one real AI
 * send per execution against the shared test account
 * (`editorpuku@gmail.com`). Same constraint as CHAT-E2E-002 / 007 /
 * 019: one minimal send per execution, never burn-in / retry-loop /
 * high-frequency schedule. The send-tap and the Wi-Fi cut are
 * dispatched back-to-back with NO `driver.pause` between them — if the
 * response renders before the cut lands, that is a captured mistimed
 * data point. Do NOT retry the send within the same run; do NOT
 * schedule this test at high frequency.
 *
 * Timing caveat (do not over-claim): automation removes human latency
 * but cannot guarantee zero latency. `tapSendButton()` itself has an
 * Appium round-trip (~200–500 ms); `setWifiEnabled(false)` has an ADB
 * shell round-trip (~50–200 ms). The cut is as immediate as the
 * existing tooling permits, but the test does NOT assert that the cut
 * landed before Flutter's HTTP request initiation — only that it was
 * dispatched immediately after the send-tap. The four post-cut XML
 * checkpoints are the evidence to interpret timing.
 *
 * Cleanup order: `setWifiEnabled(true)` first (so the next test in the
 * run inherits a working radio), then the drawer's new-chat reset
 * (so the clean-default teardown does not fight a still-cut radio).
 */
describe('Network drop — P1 (controlled R8 experiment)', () => {
  const TEST_MESSAGE = '[PUKU-QA-TEST:CHAT-TC-008] Say hello in one word.';
  const EVIDENCE_DIR = 'test-results/008-2026-08-27';

  /**
   * Reads the on-screen IME state via `adb shell dumpsys input_method`
   * and parses the `mInputShown=true|false` line. Same probe that
   * confirmed `mInputShown=true` on the A13 during the manual
   * reconnaissance on 2026-08-27. Uses the existing
   * `adbCommand(...) + execSync(...)` pattern — no new utility.
   * Kept local to this spec; not exported, not promoted to
   * `src/utils/adb.ts`.
   */
  function isImeShown(): boolean {
    const out = execSync(adbCommand('shell', 'dumpsys', 'input_method')).toString();
    const m = /mInputShown=(true|false)/.exec(out);
    return m ? m[1] === 'true' : false;
  }

  /**
   * Captures `driver.getPageSource()` and persists it via Node's `fs`
   * module (cross-platform — works on Windows + CI without shelling
   * out). Best-effort: failure to write the artifact never fails the
   * test, only loses the diagnostic for that checkpoint.
   */
  async function dumpAndPersist(label: string): Promise<string> {
    const xml = await driver.getPageSource();
    try {
      mkdirSync(EVIDENCE_DIR, { recursive: true });
      writeFileSync(`${EVIDENCE_DIR}/${label}.xml`, xml, 'utf8');
    } catch {
      // best-effort; not a test failure
    }
    return xml;
  }

  /**
   * Structural diagnostics extracted from a page-source XML. NOT
   * assertions — logged to stdout so the future implementer of the
   * contract assertion has data to work from, and so the four
   * captures can be compared side-by-side without re-parsing the
   * raw XMLs by hand.
   *
   * No complicated speculative regex involving bounds, coordinates, or
   * assumed UI structure. Each signal is derived from a real XML
   * attribute or a substring the existing repo already uses:
   *   - user-bubble check: substring search for the exact sent text
   *     (`text="TEST_MESSAGE"`). R9 (no asserting on AI text) does
   *     not apply — the user bubble is OUR input.
   *   - response-candidate check: same XPath pattern that
   *     `homeScreen.responseBubbleExcluding(TEST_MESSAGE)` already
   *     uses, evaluated via `$(...)` on the captured `Page Source`
   *     semantics tree is not directly possible here; instead we
   *     count `<node ... text="...">` rows that are NOT the user
   *     bubble and NOT empty. Cheap and conservative.
   *   - error-keyword check: case-insensitive substring for any of
   *     `retry|failed|error|offline|try again|reconnect|resend|
   *     network|connection` anywhere in the XML.
   *   - node count: regex on `<node `.
   *   - non-empty-text count: regex on `text="[^"]+"`.
   * Per project locator discipline, no semantic name is invented for
   * any surface that does not actually appear in the XML.
   */
  function diagnose(label: string, xml: string): void {
    const nodeCount = (xml.match(/<node /g) ?? []).length;
    const nonEmptyTextCount = (xml.match(/text="[^"]+"/g) ?? []).length;
    const userBubblePresent = xml.includes(`text="${TEST_MESSAGE}"`);
    // Count non-empty View@text nodes whose text is not the user's
    // bubble — a conservative proxy for "something else rendered".
    // Uses the same XPath construct shape responseBubbleExcluding
    // already trusts, evaluated as a substring count.
    const nonEmptyTextMatches = xml.match(/text="[^"]+"/g) ?? [];
    // TEST_MESSAGE may contain regex metacharacters (the square brackets
    // in "[PUKU-QA-TEST:CHAT-TC-008]" would be parsed as an invalid
    // character class — confirmed live on 2026-08-27 by the controlled
    // R8 run: `new RegExp("text=\"[PUKU-QA-TEST:CHAT-TC-008] Say hello
    // in one word.\"")` threw "Range out of order in character class"
    // and aborted the post-cut-1s diagnose call). Use a plain substring
    // match against the captured `text="..."` XML attribute instead —
    // identical semantics for this filter, no regex parsing.
    const userBubbleSubstr = `text="${TEST_MESSAGE}"`;
    const responseCandidateCount = nonEmptyTextMatches.filter(
      (m) => m !== userBubbleSubstr,
    ).length;
    const errorKeywordHit = /retry|failed|error|offline|try again|reconnect|resend|network|connection/i.test(
      xml,
    );
    console.log(
      `[008 ${label}] nodes=${nodeCount} nonEmptyText=${nonEmptyTextCount} ` +
        `userBubble=${userBubblePresent} responseCandidate=${responseCandidateCount} ` +
        `errorKeyword=${errorKeywordHit}`,
    );
  }

  it('CHAT-E2E-008 @p1: cuts Wi-Fi programmatically immediately after send', async function () {
    if (!process.env.DEVICE_UDID) {
      this.skip();
    }

    
    await authFlow.ensureLoggedIn();
    await homeScreen.waitUntilDisplayed();

    try {
      // 1. Focus the chat composer (same first step as typeChatMessage).
      await homeScreen.chatInputField.click();

      // 2. Verify IME actually opened. If not, the subsequent
      //    typeChatMessage injection will silently miss its target
      //    and the cut would land on an idle app — the same
      //    silent-failure mode that invalidates the prior manual
      //    reconnaissance. Failing fast produces an actionable
      //    diagnostic.
      expect(isImeShown()).toBe(true);

      // 3. Type the convention message via the framework's proven
      //    path. typeChatMessage → chatInputField.click() +
      //    waitForElement + typeRealText (validated live for our
      //    content shape).
      await homeScreen.typeChatMessage(TEST_MESSAGE);

      // 4. Verify the exact text landed in the EditText. Exact match
      //    is safe here — this is reading OUR typed input, not AI
      //    output (R9 does not apply). This is the FINAL pre-send
      //    verification on the test side: the user bubble does NOT
      //    exist in the semantics tree pre-send (it is rendered as
      //    an android.view.View only AFTER the send-tap succeeds —
      //    confirmed by evidence/008-recon-2026-08-27/chat008-pre-send.xml
      //    vs chat008-sent.xml), so any "user bubble present before
      //    send" assertion is structurally unreachable. The edited
      //    pre-send assertion is intentionally absent here.
      const enteredText = await homeScreen.chatInputFieldWithText.getText();
      expect(enteredText).toBe(TEST_MESSAGE);

      // 5. Tap Send + IMMEDIATELY disable Wi-Fi. NO `driver.pause`
      //    between these. `homeScreen.tapSendButton()` performs an
      //    Appium pointer action at coordinate (954, 1139);
      //    `setWifiEnabled(false)` runs `adb shell svc wifi disable`
      //    via `adbCommand(...) + execSync(...)`.
      //
      //    This is the load-bearing critical-timing block. The only
      //    delay between the two operations is the Node + ADB +
      //    Appium round-trips intrinsic to each call (sub-second on
      //    a local device). Do NOT insert sleeps, polling waits, or
      //    extra commands between these two lines.
      await homeScreen.tapSendButton();
      setWifiEnabled(false);

      // 6. Post-cut observation. Pauses are AFTER the cut, not
      //    between send and cut. Four checkpoints: ~1 s, ~3 s, ~8 s,
      //    ~20 s after the cut. Each captures `getPageSource()` and
      //    persists the raw XML; each runs `diagnose()` to log
      //    structural signals. Diagnostics are NEVER asserted on —
      //    they exist only so a green build does NOT over-claim
      //    contract coverage and so the future implementer of the
      //    contract assertion has evidence to work from.
      for (const [label, ms] of [
        ['post-cut-1s', 1000],
        ['post-cut-3s', 2000],
        ['post-cut-8s', 5000],
        ['post-cut-20s', 12000],
      ] as const) {
        await driver.pause(ms);
        const xml = await dumpAndPersist(label);
        diagnose(label, xml);
      }

      // 7. Hard no-crash assertions, all from existing verified
      //    locators. These confirm the app did not crash, did not
      //    hand off to a system overlay, and the chat surface is
      //    still rendered. They do NOT assert anything about an
      //    error UI — the "recoverable error state" half of the
      //    contract remains pending live observation; the captured
      //    XMLs above are the evidence to derive a future locator
      //    from. No `homeScreen.networkErrorSurface` getter is added
      //    or guessed; if a real error/retry surface appears in any
      //    of the captured XMLs, its actual attributes are surfaced
      //    by the diagnostics for the next implementer to evaluate.
      expect(await driver.getCurrentPackage()).toBe('sh.puku.app');
      await expect(homeScreen.chatInputFieldWithText).toBeDisplayed();
    } finally {
      // 8. Restore Wi-Fi unconditionally — even on assertion failure,
      //    so the next test in the run inherits a working radio.
      setWifiEnabled(true);

      // 9. Standard clean/default-state teardown: drawer reset rather
      //     than attempting to clear the input directly (WebdriverIO's
      //     clear() / setValue() are unreliable against this app's
      //     custom-rendered EditText, per ai-log/lessons-learned.md).
      await settingsScreen.tapHamburgerMenuTrigger();
      await drawerScreen.newChatButton.click();
    }

    // 10. Post-restoration clean/default-state assertion (same one
    //     used by every other chat-core spec).
    await expect(homeScreen.chatPromptHeading).toBeDisplayed();
  });
});
