# CHAT-TC-008: Network dropped mid-message-send produces a graceful error, not a crash

**Priority:** P1 — **pending evidence.** Per `test-design-epic-chat-core.md`, this scenario's priority cannot be responsibly assessed until the actual failure mode (graceful error vs. crash/hang) has been observed once, carefully and R8-mindfully. If it crashes or hangs, it likely belongs at P0.
**Linked automated test:** `CHAT-E2E-008` — designed, not yet automated
**Linked risk(s):** R8, R9, NFR-Reliability

## Preconditions

- PUKU APK (`sh.puku.app`) is installed and launchable.
- Must run on a physical device with a Google account already signed in at the OS level, with a standing OAuth grant already authorized for PUKU — per ADR-006 (docs/adr/ADR-006-oauth-consent-automation.md). On this project: device `RF8T802226Y`, account `editorpuku@gmail.com`.
- Requires a logged-in PUKU session (see CHAT-TC-001).
- Test message content must follow `docs/testing/test-message-convention.md` (R14).
- A way to disable connectivity mid-request (airplane mode toggle, or `adb shell svc wifi disable` / `svc data disable`).

## Steps

1. Ensure you're logged in to PUKU and on the home screen (see CHAT-TC-001).
2. Type a convention-compliant test message, e.g. `[PUKU-QA-TEST:CHAT-TC-008] Say hello in one word.`
3. Tap the send control.
4. Immediately disable network connectivity, before a response returns.
5. Observe the app's behavior.

## Expected Result

The app surfaces a recoverable error state (e.g. a failure indication or retry affordance) and remains responsive. It does not crash, and does not hang in a state requiring a force-quit.

## Status

Reconnaissance attempted 2026-08-27 (two manual runs on physical Samsung Galaxy A13, `R58T90F5ALY`, Android 14). Both runs inconclusive — the test message never reached the AI backend in either run, so the actual network-failure UI contract (graceful error, no crash) was never observed. **R8 budget preserved**: zero AI sends occurred across both attempts (the shared test account `editorpuku@gmail.com` has no new messages from this scenario). **Partial test plumbing implemented 2026-08-27** (`tests/specs/chat/network-drop.spec.ts` exists with the `setWifiEnabled(true)` restore path and the post-restoration clean/default-state assertion; `src/utils/adb.ts` exports the new `setWifiEnabled(enabled: boolean)` helper). The plumbing-only spec does NOT provide coverage of the actual contract — it focuses the chat input and exercises the wifi-restore helper, but does NOT type a message, send, cut wifi, or assert any network-failure UI behavior. **Actual contract assertion (graceful error / no crash in response to mid-send network loss) remains pending live observation** and requires a future R8-permitted session with verified-send preconditions before a real assertion can be written.

## Notes

**Designed, not yet automated.** This scenario exists in `_bmad-output/test-artifacts/test-design-epic-chat-core.md`'s coverage matrix but has no corresponding automated test yet.

**Reconnaissance attempts 2026-08-27 (inconclusive, R8 budget preserved).** Two manual runs were attempted against the physical A13 (`R58T90F5ALY`, Android 14) to discover the actual network-failure UI before committing to a spec. Both runs followed the same procedure: focus the chat input, type the convention message, tap the send control + immediately issue `adb shell svc wifi disable` from a single host-side dispatch, then dump the post-cut UI at three checkpoints (~2 s / ~8 s / ~20 s after the cut) via `adb shell uiautomator dump`.

- **Run 1** — the procedure sequenced tap-send directly without first focusing the input or typing a message. The cut landed cleanly (`settings get global wifi_on` returned `0`), but there was nothing in flight to interrupt. All three post-cut XMLs (`cut-now.xml`, `cut-8s.xml`, `cut-20s.xml`) plus the `responsiveness.xml` capture show the same empty home state with `chatPromptHeading` ("How can i help you today!") present and `chatInputFieldWithText` (class-only `android.widget.EditText`) present at bounds [93,2011][987,2068]. Every `<node>` in the tree has `text=""` — no user bubble, no response bubble, no error surface. Root cause identified post-hoc: the `tapSendButton()` coordinate (954, 1139) from `home.screen.ts` is documented as only valid "immediately after typing into chatInputField while the keyboard remains open" (see its JSDoc, lines 8–14), and the keyboard was not open during this run. Zero AI sends.

- **Run 2 (corrected)** — the procedure was amended to first tap the chat input at its bounds center (540, 2040) to focus it and open the keyboard, then `adb shell input text '[PUKU-QA-TEST:CHAT-TC-008]%sSay%shello%sin%sone%sword.'` to inject the message, then the same tap-send + wifi-cut pair. The cut landed cleanly (`wifi_on=0`); `mCurrentFocus` confirmed PUKU still foreground throughout. All three post-cut XMLs again show the same empty home state with no user bubble, no response bubble, no error surface. Most likely root cause: the `input text` command either dispatched into the wrong focus target (if the keyboard-open precondition was not met before the text injection), or the text was injected but the send-tap coordinate again landed off the actual send control because the keyboard-open precondition was not re-verified between text injection and send-tap. Zero AI sends. The screen recording started during this run (`/sdcard/post-cut.mp4`, 60 s cap) was confirmed not to exist on device when the pull was attempted — the XMLs are the only evidence.

**Why the failure mode matters.** The reconnaissance produced a useful negative finding: the framework's manual ADB path for cut-the-network is verified to work on this A13 (both `svc wifi disable` and the restore-and-reconnect polling loop are validated, `reconnect` confirmed via `ping -c 1 -W 2 1.1.1.1` succeeding within 1 s of the next poll after re-enable). What is *not* verified is the actual PUKU network-failure UI — and per `CHAT-TC-008.md`'s own "priority pending evidence" framing, that observation is precisely the deciding input for whether this stays P1 or moves to P0. The priority question remains open.

**What a future run needs.** Three preconditions must be verified live on the device, *before* the cut is dispatched, for the cut to actually interrupt an in-flight request: (1) `dumpsys input_method | findstr mInputShown` returns `true` after the input-tap, (2) a fresh `uiautomator dump` after the `input text` injection shows a `<node class="android.widget.EditText">` with `text="[PUKU-QA-TEST:CHAT-TC-008] Say hello in one word."` (not `text=""`), and (3) the user bubble has already appeared in the semantics tree before the cut — i.e., a fresh dump shows `<node text="[PUKU-QA-TEST:CHAT-TC-008] Say hello in one word.">`. If any of those three preconditions is not met, the cut is on an empty/idle app and the observation is meaningless. The framework's `homeScreen.tapSendButton()` coordinate is documented to require the same keyboard-open + populated-input geometry, and the existing `tests/specs/chat/send-message.spec.ts` works because `typeChatMessage()` always opens the keyboard as part of its flow — that precondition is implicit in the framework and easy to miss in a manual procedure that splits the steps.

**Evidence location.** All four XMLs from both runs are preserved at `evidence/008-recon-2026-08-27/` (`cut-now.xml`, `cut-8s.xml`, `cut-20s.xml`, `responsiveness.xml`). They are byte-for-byte identical and show only the empty home state — confirming no in-flight conversation existed at any of the four capture points.

**R8 — real message, real account.** This case sends a real message to PUKU's live AI backend on the shared test account before the network is cut, so it carries the same inference-cost and rate-limit exposure as CHAT-TC-002. Do not run it repeatedly while experimenting with the timing of the network cut. If the first attempt mistimes the cut (response returns before connectivity drops), treat that as a data point and stop rather than immediately retrying — the R8 gate applies to manual execution exactly as it does to automation.

Executing this case is also what unblocks the priority question above. Record precisely what the app does, since that observation is the deciding input for whether this stays P1 or moves to P0.
