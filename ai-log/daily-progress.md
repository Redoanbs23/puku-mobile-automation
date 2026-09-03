# Daily Progress Log

## 2026-08-04

### Session Summary

Environment and toolchain setup, initial black-box reconnaissance of the PUKU Editor Android app, and BMAD methodology setup including a completed Test Design workflow for the login/auth epic.

### Chronological Log

1. **Environment setup** — Node.js 24.19.0 LTS (via nvm), JDK 17.0.19 Temurin, Appium Inspector 2026.7.1, Android Studio + SDK, Appium server 2.16.2 with UiAutomator2 driver 4.1.2.

2. **Created Android emulator** — `Pixel_7`, API 34, Google Play, arm64.

3. **Obtained PUKU APK** — `app-prod-release.apk` (~93MB) via AppTester, installed successfully on the emulator via `adb`. No ABI or signature issues encountered.

4. **Confirmed app identity** — package name `sh.puku.app`, product name "Puku Editor" — an AI code editor mobile app.

5. **Confirmed tech stack** — PUKU is built with Flutter (confirmed via inspection).

6. **First Appium Inspector session** — ran against the login screen. Semantics-tree coverage is HIGH: all interactive elements (Continue with Google button, Enter your email button, legal links) expose usable `content-desc` values, meaning Appium/UiAutomator2 locators are viable as the primary strategy.

7. **Discovered blocker** — tapping "Enter your email" shows an "Email sign in flow is not connected" toast. Reported to the dev team. This blocks further screen exploration past login.

8. **Discovered auth mechanism detail** — "Continue with Google" opens external Chrome (not an in-app WebView), confirming OAuth relies on external browser context switching and requires a pre-configured Google account on any test device/emulator.

9. **Installed BMAD method** — all 8 official modules, plus the `bmad-loop` orchestrator (installed from its Git repository via `uv tool install`), including `uv` and `tmux` as dependencies.

10. **Completed the Test Design (TD) workflow** with Murat (BMad Test Architect agent, `bmad-testarch-test-design`) for the `auth-login` epic: 7 risks registered (4 high-priority), 14 test scenarios defined (P0=3, P1=5, P2=3, P3=3), quality gates and execution strategy established. Output: `_bmad-output/test-artifacts/test-design-epic-auth-login.md`.

### Key Decisions

- **Automation stack**: TypeScript + WebdriverIO + Appium (UiAutomator2) as the primary automation stack for mobile UI testing.
- **Playwright scope**: Playwright is scoped to API-layer test data only — not used for mobile UI automation.
- **Platform scope**: Android-only (no iOS access).
- **Methodology**: BMAD adopted as the project methodology, with all 8 official modules retained.

---

## 2026-08-05

### Session Summary

Full read-only review of the existing project (structure, framework, config, docs, git history), static verification of the toolchain, and selection of the next automation target. No source files modified; no new files created.

### Chronological Log

1. **Reviewed project structure** — read every file under `src/`, `tests/`, `config/`, `docs/`, `test-cases/`, `ai-log/`, plus root config (`package.json`, `tsconfig.json`, `wdio.conf.ts`, `eslint.config.js`, `.prettierrc`, `.env.example`, `.gitignore`) and the completed test design artifact.

2. **Confirmed framework architecture** — Screen Object Model over WebdriverIO 9 + Appium 2/UiAutomator2, TypeScript ESM strict. Config layering: `wdio.conf.ts` → `config/wdio.shared.conf.ts` (runner, reporters, hooks) + `config/wdio.android.conf.ts` (capabilities) + `config/environments/local.ts` (env overrides, `adb`-based `platformVersion` auto-detection). Device targeting resolves `DEVICE_UDID` → physical device, else falls back to `appium:avd` for the emulator.

3. **Confirmed implementation state** — `LOGIN-E2E-002` is the only implemented scenario (passing, 1.199s, capability `android.rf8t802226y`, per `test-results/junit/results-0-1.xml`). The remaining 13 scenarios are `it.skip` stubs across `login-screen.spec.ts` (P0/P1) and `auth-secondary.spec.ts` (P2/P3).

4. **Static verification** — `npx tsc --noEmit` → exit 0. `npx eslint .` → exit 0. Both clean.

### Issues Encountered

- **Sandbox has no Android toolchain.** The assistant's shell is an isolated Linux container without `adb`, the Android SDK, an emulator, or a USB path to the physical device. Device-dependent steps (APK launch, live exploration, `npm test`) therefore cannot be executed by the assistant.
  - **Solution applied:** adopted a "Redoan runs, assistant analyzes" workflow — exact commands are supplied for local execution and the raw output is pasted back for analysis. Chosen over inferring device state from documentation, so that locators are verified against a live UI dump rather than guessed.

### Observations / Doc Gaps

- `test-cases/auth/LOGIN-TC-002.md` is **untracked in git** (`??`) — it exists on disk but was never committed.
- The 2026-08-04 entry above stops at the Test Design workflow, but git contains three later commits from that same day (`d53c5a5` framework scaffold, `33526b7` physical-device targeting, `ffc45ae` LOGIN-E2E-002 implementation). Those are unlogged. Flagged, not backfilled — the assistant has no first-hand record of that work and will not invent one.
- `test-cases/README.md` states individual case files are not written yet; only `LOGIN-TC-002` exists, so 13 manual cases remain outstanding against the 1:1 traceability convention.

### Decisions

- **Next automation target: `LOGIN-E2E-005` @p0** ("both auth entry points render"). Selected over the higher-business-value `LOGIN-E2E-008` because both required locators (`Continue with Google`, `Enter your email`) already exist and are proven by the passing `LOGIN-E2E-002`, so it needs no new framework technique. `LOGIN-E2E-008` requires toast detection whose mechanism (native Android `Toast` vs. Flutter `SnackBar`) is not yet known and needs a spike first.
- **Implementation log location:** appended to this file rather than a new document, preserving the existing convention.

### Next Steps

1. Redoan executes the supplied `adb` verification and `uiautomator dump` commands on both the physical device and the Pixel_7 emulator.
2. Assistant cross-checks the live semantics tree against `docs/00-apk-reconnaissance.md` and `src/screens/login.screen.ts`.
3. Assistant presents the `LOGIN-E2E-005` implementation plan for approval before writing any code.
4. Confirm whether `LOGIN-TC-005.md` should be authored (permission required — new file).

---

## 2026-08-06

### Session Summary

Completed the `chat-core` epic's Test Design with Murat (`bmad-testarch-test-design`), authored the R14 test-message convention it required, ran ATDD for the 3 P0 `chat-core` scenarios, live-unblocked `CHAT-E2E-002`'s locators on the physical device (uncovering a send-button accessibility gap and a `setValue()` framework-level bug along the way), and got all three P0 scenarios passing. Closed with a project-wide test-running reference doc, fixing two real gaps discovered while writing it.

### Chronological Log

1. **Ran the Test Design (TD) workflow** with Murat for the new `chat-core` epic (Epic-Level Mode, same conversational-requirements substitute as `auth-login`): 7 new risks registered (`R8`–`R14`, 4 high-priority — `R8` live-AI cost/ToS exposure, `R9` non-deterministic AI output, `R10` chat-history pollution on the shared account, `R11` voice-input automation gap), plus 6 inherited risks from `auth-login` re-assessed for applicability. Full coverage plan: 18 scenarios (P0=3, P1=7, P2=5, P3=3) under a new `CHAT-E2E-` prefix. Output: `_bmad-output/test-artifacts/test-design-epic-chat-core.md`.

2. **Authored `docs/testing/test-message-convention.md`** to satisfy the `R14` entry criterion before any message-send test could be written — a `[PUKU-QA-TEST:<SCENARIO-ID>]` naming prefix, a no-PII/no-secrets content rule, and 3 concrete example prompts for `CHAT-E2E-002`/`008`/`016`.

3. **Ran the ATDD workflow** (`bmad-testarch-atdd`) for the 3 P0 `chat-core` scenarios. `CHAT-E2E-001` and `CHAT-E2E-003` were written as real, active tests immediately (locators already confirmed from earlier exploration) rather than `test.skip()` red-phase stubs — a deliberate, flagged deviation from the skill's literal red-phase rule, since PUKU already exists and there is no pre-implementation phase in this project. `CHAT-E2E-002` was written as a genuine `it.skip()` stub, blocked on unconfirmed send-button and response-bubble locators. Output: `_bmad-output/test-artifacts/atdd-checklist-chat-core-p0.md`.

4. **Live Appium Inspector session against `RF8T802226Y`** to unblock `CHAT-E2E-002`. Typed the convention-compliant test message into the already-confirmed chat input field via WebdriverIO's `setValue()` — it reported success and the accessibility dump showed the text as set, but the on-screen widget stayed visibly empty.

5. **Diagnosed and fixed a framework-level bug**: `setValue()` only updates Flutter's accessibility/semantics layer, not the real `TextEditingController`, for this app's custom-rendered widgets. Worked around by focusing the field via a normal WebdriverIO `.click()` then injecting real keystrokes via `adb shell input text` — confirmed working live before writing any reusable code.

6. **Identified the send button's locator** (a second confirmed accessibility gap, same class as the hamburger icon): no content-desc, resource-id, or text; the element does not exist at all until the input has text, and its position depends on the on-screen keyboard being open. Coordinate-based tap confirmed as the only option.

7. **Sent the test message and identified the response-bubble pattern**: both the sent message and PUKU's reply render as plain `android.view.View` elements with a `text` attribute (no content-desc). Response matched structurally by excluding the known sent-message text — never by the AI-generated content itself (`R9`).

8. **Implemented the fix and findings as reusable code**: `src/utils/real-text-input.ts` (`typeRealText`, documents the `setValue()` gotcha in detail), `deviceArgs()` exported from `src/utils/adb.ts` for reuse, `src/screens/home.screen.ts` extended with `tapSendButton()`, `typeChatMessage()`, and `responseBubbleExcluding()`. Two new entries added to `ai-log/lessons-learned.md`: the send-button locator gap, and the `setValue()`-fails-on-Flutter-widgets gotcha as its own framework-level finding, independent of this specific test.

9. **Converted `CHAT-E2E-002` from `it.skip()` to a real test** using the confirmed locators, then ran it exactly once, per `R8`'s single-execution gate — passed (21s). `CHAT-E2E-001` and `CHAT-E2E-003` were re-verified passing in the same session (no logic changes to either, so no re-run risk). All 3 P0 `chat-core` scenarios now pass against `RF8T802226Y`.

10. **Authored `docs/running-tests.md`** — single project-wide reference: prerequisites, the `--mochaOpts.grep` pattern with worked examples, `npm run test:p0`/`test:p1`, running the full suite, a scenario/`DEVICE_UDID` table pulled directly from the spec files, and an `R8` caution note against repeated/looped runs of cost-triggering scenarios.

11. **Found and fixed two real gaps** while writing and reviewing that doc: `AUTH-E2E-015` and `AUTH-E2E-016` were missing the `@p0` grep tag entirely (added, title-only change, verified via `tsc`/`eslint` only — not re-run, since no logic changed); `running-tests.md` itself had an internal contradiction, wrongly listing `LOGIN-E2E-002` as requiring `DEVICE_UDID` (it doesn't) — corrected.

### Key Decisions

- **New scenario prefix `CHAT-E2E-`** for the `chat-core` epic, distinct numbering from `LOGIN-E2E-`/`AUTH-E2E-`.
- **`R8` single-execution gate is non-negotiable**: any message-send-triggering scenario runs at most once per session, never in a burn-in/retry loop — enforced this session by running `CHAT-E2E-002` exactly once, after typechecking/linting and a full manual code review, rather than debugging via re-runs.
- **Structural-only assertions for AI output (`R9`)**: `CHAT-E2E-002` never asserts on the AI's generated text, only that a response bubble distinct from the sent message appears.
- **Coordinate-based taps accepted, not worked around**, for both the hamburger icon and the send button — no accessible locator exists for either; both documented as known gaps worth raising with the PUKU dev team, not hidden behind a workaround that pretends otherwise.

### Observations / Doc Gaps

- Two real gaps found and fixed today (see Chronological Log 11): missing `@p0` tags on `AUTH-E2E-015`/`016`, and `running-tests.md`'s own `DEVICE_UDID` contradiction.
- The model selector's content-desc is confirmed to drift (`puku-ai-2.7` on 2026-08-04 vs. `puku-ai-2.8` referenced at this epic's kickoff) — already mitigated via a resilient prefix-match locator, but flagged as a live example of `R12`.
- Send-button and hamburger-icon locator gaps are both now logged in `ai-log/lessons-learned.md` as candidates to raise with the PUKU dev team as accessibility improvements.

### Next Steps

1. A dedicated Appium Inspector exploration pass for Projects, Artifacts, and Code (`R13`) before attempting to automate any of them beyond smoke level.
2. Investigate whether PUKU exposes a chat-deletion capability (`R10`) before scaling up message-send coverage further.
3. Scaffold the remaining `chat-core` P1–P3 scenarios (`CHAT-E2E-004` through `018`) per `test-design-epic-chat-core.md`'s coverage plan.

---

## 2026-08-06 (session 2)

### Session Summary

CI strategy assessment with Murat (self-hosted physical-device runner rejected on risk grounds), an emulator-vs-physical-device behavioral comparison that produced a genuinely surprising result, a real device-targeting bug found and fixed in `src/utils/adb.ts`, the remaining 16 chat-core manual test cases authored, and a self-review pass across `src/`.

### Chronological Log

1. **CI risk assessment (conversation, no artifact yet)** — weighed a self-hosted GitHub Actions runner on `RF8T802226Y` (which would let `AUTH-E2E-015`/`016` and all `CHAT-E2E-` scenarios run in CI) against `R2`, `R3`, and `R8`. **Recommended against it**, on two structural grounds rather than tunable ones: `R2` gets actively *worse* under CI (repeated automated Google re-auth at a frequency no human controls is exactly the bot-detection trigger R2 warns about, and a challenge screen in CI fails with nobody present to resolve it), and `R3` is a known-bad pattern — a self-hosted runner on a public repo lets a malicious fork PR execute on a machine holding a live authenticated Google session. `R8` is the *least* of the three: a real violation of its own gate if `CHAT-E2E-002` ran on every push, but the only one with a clean mechanical fix. **Decision: keep CI limited to emulator-safe scenarios; treat the physical-device suite as permanently local-only.** Middle ground identified if partial movement is ever wanted: a self-hosted runner gated to `workflow_dispatch` only (never `push`/`pull_request`), which removes R3's sharpest edge but does *not* fully address R2's frequency concern.

2. **Confirmed emulator/physical-device disambiguation in `config/wdio.android.conf.ts`** — verified two ways rather than assumed. Traced the installed driver source (`appium:avd` → `getRunningAVDWithRetry` → `getRunningAVD` → `getConnectedEmulators()`, which filters to `emulator-XXXX` serials *before* AVD-name matching, so a physical device structurally cannot match), then confirmed live by cross-referencing both devices' logcat against the test's completion timestamp. **Appium's own device targeting is unambiguous.**

3. **Found a real bug the above check surfaced** — `LOGIN-E2E-002` passed on the emulator but emitted a stray `adb: more than one device/emulator` during teardown. Root cause: `deviceArgs()` in `src/utils/adb.ts` only added `-s <udid>` when `DEVICE_UDID` was *set*. With it unset and two devices attached, the failure-capture hooks' own bare `adb` calls were ambiguous — meaning `R6`'s screen-recording capture was **silently non-functional in that configuration, on every test**. Not caught earlier because the calls are best-effort (`try/catch`) or fire-and-forget (`spawn`), so nothing failed loudly.

4. **Fixed `deviceArgs()`** with an explicit resolution order: `DEVICE_UDID` if set → exactly one attached device, target it explicitly anyway → multiple devices with exactly one emulator, prefer the emulator (the CI-safe, credential-free default per the assessment in item 1) → otherwise **throw** rather than silently falling back to an unscoped call. Re-ran `LOGIN-E2E-002`: warning gone, zero ambiguity errors.

5. **Ran the emulator comparison** — `LOGIN-E2E-002` passes; `AUTH-E2E-015`, `AUTH-E2E-016`, `CHAT-E2E-001`, `CHAT-E2E-003` all fail with the *identical* error. Documented in the new `docs/emulator-vs-device-comparison.md`.

6. **`AUTH-E2E-015`'s emulator failure was not what was predicted.** The Play Integrity / SafetyNet hypothesis is **not supported**. The emulator authenticates, renders PUKU's consent page showing `Signed in as editorpuku@gmail.com` (so the emulator *is* pre-authenticated too — previously undocumented), taps Authorize, fires `flutter_web_auth_2.CallbackActivity`, and returns to `sh.puku.app`. It fails only at the final home-screen wait. Root cause left unconfirmed (slow emulator vs. session not established) — per standing instruction, documented rather than retried. Also recorded a **misleading-evidence trap**: emulator logcat shows `ro.product.*_for_attestation` denials that superficially confirm the attestation theory but actually originate from the investigation's own `adb shell` commands (`scontext=u:r:shell:s0`), not from PUKU.

7. **Wrote the remaining 16 chat-core manual test cases** — `CHAT-TC-004` through `CHAT-TC-019`, all marked "Designed, not yet automated" with `Status: Not Run` rather than claiming a passing status. `CHAT-TC-018` (voice) is marked permanently manual-only per `R11`, distinct from the merely not-yet-automated ones.

8. **Self-review pass across `src/`** — findings and fixes below.

### Key Decisions

- **No self-hosted CI runner.** Two of the three named risks (`R2`, `R3`) are structural mismatches between what CI assumes (ephemeral, safe against untrusted changes) and what this suite requires (one irreplaceable, stateful, credential-bearing phone) — not problems a constraint can tune away.
- **`deviceArgs()` throws rather than guesses** when it cannot safely disambiguate. Consistent with how every other ambiguity in this project has been handled — fail loudly rather than pick silently.
- **The physical-device dependency is narrower than documented.** It is *not* "OAuth can't work on an emulator." That reframing is recorded because it changes what a future fix would target.

### Observations / Doc Gaps

- **`docs/00-apk-reconnaissance.md` contains a now-contradicted claim** — a section headed "Google OAuth is not a practical automation target," directly superseded by ADR-006 and the passing `AUTH-E2E-015`. Flagged, deliberately **not** rewritten: it is a dated historical record, and this project's stated practice (see README) is to preserve superseded reasoning rather than edit it away. Needs a decision on whether to add a "superseded by ADR-006" pointer.
- **ADR numbering has gaps** — only `ADR-004` and `ADR-006` exist; 001–003 and 005 were never written. Harmless but will read as missing files to an outside reader.
- **`src/utils/env.ts` is dead code** — exported but never imported anywhere in `src/`, `tests/`, or `config/`.

### Next Steps

Carried forward from session 1 (unchanged): R13 exploration pass, R10 chat-deletion investigation, scaffolding the remaining chat-core scenarios. Added:

1. Decide whether to disambiguate `AUTH-E2E-015`'s emulator root cause — one timeout-raise experiment would settle it.
2. Decide on the `00-apk-reconnaissance.md` superseded-claim pointer, the ADR numbering gaps, and the `env.ts` dead code (all flagged above, none actioned unilaterally).

---

## 2026-08-07

### Session Summary

A one-hour autonomous session tasked with implementing chat-core's not-yet-automated P1-P3 scenarios (`CHAT-E2E-004`, `006`, `007`, `009`–`013`, `017`) against the emulator's already-logged-in PUKU session, under two hard boundaries: never re-run `CHAT-E2E-002` (or any message-send) more than once total this session, and never debug/retry `AUTH-E2E-015`'s known OAuth stall or attempt automated Google credential entry. The session's first verification step surfaced a blocker that made the rest of the objective unreachable safely, so it pivoted to root-causing and fixing that blocker instead of guessing at scenario implementations without the live locator confirmation this project has consistently required.

**Update, later the same session:** the session continued past the point where this summary and item 5 below originally stopped. Once Redoan manually re-authenticated the emulator, a second bug was found and fixed (`isDisplayed()`'s single-snapshot check racing a slower `APP_NO_RESET=true` cold launch — see `docs/emulator-vs-device-comparison.md`), `CHAT-E2E-001` was re-verified end-to-end, and the originally-assigned 9-scenario backlog was then implemented: **8 of 9 passed** (`CHAT-E2E-004`, `006`, `007`, `009`, `010`, `011`, `012`, `013`); `CHAT-E2E-017` remains blocked. See the continued chronological log (items 6–9) below. Item 5's claim of "did not implement any of the assigned scenarios" was accurate at the moment it was written but is superseded by this update — left in place rather than deleted, per this project's practice of preserving superseded reasoning instead of editing it away.

### Chronological Log

1. **Verified `authFlow.ensureLoggedIn()`'s short-circuit behavior**, as instructed, by running `CHAT-E2E-001` then `CHAT-E2E-003` against the emulator (`DEVICE_UDID=emulator-5554`, PUKU manually confirmed logged in beforehand). Neither short-circuited — both fell through to `completeGoogleSignIn()` and hit the already-documented emulator OAuth stall (`docs/emulator-vs-device-comparison.md`). `CHAT-E2E-003` additionally triggered a real Android ANR in both `sh.puku.app` and Chrome's `CustomTabActivity`, worse than the clean 10s timeout seen previously — new evidence for the closed investigation, not pursued further per the standing boundary.
2. **Root-caused the non-short-circuit as a separate, previously-undocumented bug**, distinct from the OAuth-stall investigation: confirmed via a plain `adb shell am start` (no Appium, no OAuth) that the emulator's manually-established login was actually gone, not merely undetected. `config/wdio.android.conf.ts`'s hard-coded `appium:noReset: false` resets app data at the start of every session, including ones where the app was already logged in — the two verification runs in step 1 each independently wiped the session before `ensureLoggedIn()` ever got to check it.
3. **Fixed it as an opt-in, non-breaking config change**: `'appium:noReset': process.env.APP_NO_RESET === 'true'`, default unchanged (`false`) so `LOGIN-E2E-002`/`AUTH-E2E-015`/`016` keep resetting to a clean logged-out state as they require. Verified via a dry import of the config (capabilities resolve to `false` by default, `true` with the env var set) — not verified end-to-end, since that would require either a manual re-login or retrying the barred OAuth flow.
4. **Corrected two stale doc comments found in the process**: `ensureLoggedIn()`'s docstring wrongly claimed `noReset:true` (the actual default is `false` — this exact mismatch is what caused the bug); `completeGoogleSignIn()`'s docstring still described the OAuth-stall root cause as untested when two experiments (timeout, GPU backend) had already ruled hypotheses out on 2026-08-06.
5. **Did not implement any of the assigned P1-P3 scenarios**, at this point in the session. All of them (`CHAT-E2E-004`, `006`, `007`, `009`–`013`, `017`) require a logged-in home screen to even begin, which is unreachable this session without violating the boundary against retrying the OAuth flow. Writing their locators from the test-design doc's prose instead of live-confirming them would also break this project's established discipline (see `test-design-epic-chat-core.md`'s Notes columns, all written from actual live exploration). Left `test-cases/chat/CHAT-TC-004` through `017`/`019` untouched at this point — still accurately "Not Run" as of here. **(Superseded below — the session continued.)**
6. **Redoan manually re-authenticated the emulator** outside of automation, confirming PUKU went straight to the logged-in home screen with zero interaction needed. Re-running `CHAT-E2E-001` with `APP_NO_RESET=true` still did not short-circuit — it fell through to `completeGoogleSignIn()`, which itself failed with a *different* signature than the closed OAuth-stall investigation: `homeScreen.isDisplayed()` queried once, 5.1s after session start, found nothing, and `attemptGoogleSignIn()` then polled 10s for `~Continue with Google` and found that missing too — meaning the app was never on the login screen at any point, just still mid-launch. A plain `adb shell dumpsys window` + `uiautomator dump` immediately afterward showed the app already back on the true home screen, ruling out both "`APP_NO_RESET` not applied" and "Appium reset it anyway."
7. **Root-caused and fixed a second, distinct bug**: `HomeScreen.isDisplayed()` (`src/screens/home.screen.ts`) did a single non-retried check with no polling window, never previously exposed because the old `noReset:false` default always launched into a fast-rendering login screen — nothing to race. `APP_NO_RESET=true` introduced a session-restoring cold launch that could legitimately take longer than an instant, and the check misread the delay as "not logged in." Fixed with a 4-second poll window (`waitForElement`), returning `false` only on genuine timeout. Documented in full in `docs/emulator-vs-device-comparison.md`'s 2026-08-07 entries (kept as two separate dated findings, not merged, since the two bugs have independent causes).
8. **Verified the fix end-to-end**: re-ran `CHAT-E2E-001` once more with the same command — passed in 9.5s, confirmed via log inspection that only `chatPromptHeading`/`chatInputField`/`modelSelector` were ever queried, no `~Continue with Google` lookup anywhere, i.e. no fall-through to `completeGoogleSignIn()` at all.
9. **Implemented the original 9-scenario backlog** (`CHAT-E2E-004`, `006`, `007`, `009`–`013`, `017`) against the now-genuinely-working logged-in emulator session, with live-locator exploration for each per the project's standing discipline. **Result: 8 of 9 passed.** Notable findings along the way: the model selector's opened dialog lists `puku-ai-2.7`, `puku-ai-2.8`, and `Opus 4.8` *simultaneously* (not simple version drift); Projects' back control has no content-desc (a new accessibility gap, same class as the hamburger trigger); Settings' "Notifications" row is a non-functional placeholder ("Notifications action placeholder" toast, no real toggle); `CHAT-E2E-006` ("New chat") could only be automated in a scope-limited form, since proving it resets *from* visible content would have required a fresh message send (R8). `CHAT-E2E-017` (rotation) correctly handled PUKU's confirmed portrait lock but then hit a second, different failure (`chatInputField` not found) that was flagged rather than chased, per the standing "stop and report, don't sink time into one blocker" instruction. All 9 new spec files plus 2 new screen objects (`chat-history.screen.ts`, `sections.screen.ts`) and 8 `CHAT-TC-*.md` status updates were left **uncommitted** for review.

### Key Decisions

- **Stopped rather than guessed.** The task's own instructions required live locator confirmation before automating anything; with the logged-in path unreachable, guessing would have violated that discipline for no real coverage gain.
- **Treated the `noReset` finding as a distinct bug, not a retry of the closed OAuth-stall investigation.** It concerns state destroyed *before* any OAuth flow starts, and was fixed without invoking OAuth automation at all — consistent with the boundary, not adjacent to it.
- **Left the config default unchanged.** `APP_NO_RESET` is opt-in specifically so every existing passing test keeps its current guarantees; flipping the default would have silently broken `LOGIN-E2E-002` and both `AUTH-E2E-` scenarios that depend on starting logged out.

### Observations / Doc Gaps

- **(Superseded)** The emulator was logged out at the point item 5 was written — confirmed via direct `adb shell am start`. It was subsequently manually re-authenticated by Redoan (item 6), which is what made items 6–9 possible.
- `docs/emulator-vs-device-comparison.md` now carries two distinct findings under the same file: the original OAuth-stall investigation (closed) and this session's session-persistence bug (fixed), plus a third dated entry for the `isDisplayed()` timing bug found in item 7. Kept all three clearly separated by dated heading rather than merged, since they have different causes and different resolution status.
- This entry itself (2026-08-07) is an example of the exact staleness problem it now documents: item 5 and the original Next Steps below were accurate when written but were not updated until several days later, after the session's actual outcome (8/9 passing) was already known. Corrected here rather than silently rewritten.

### Next Steps

1. ~~Manually re-authenticate the emulator, then re-verify `ensureLoggedIn()`'s short-circuit with `APP_NO_RESET=true`~~ — **done** (items 6–8).
2. ~~Proceed with live-locator exploration and implementation for `CHAT-E2E-004`, `006`, `007`, `009`–`013`, `017`~~ — **done** (item 9), 8 of 9 passing, uncommitted.
3. Debug `CHAT-E2E-017`'s remaining failure (`chatInputField` not found after the portrait-lock case is handled) — flagged, not yet investigated.
4. Commit the 18 pending files (2 new screen objects, 9 new spec files, 8 `CHAT-TC-*.md` updates) once `CHAT-E2E-017` is resolved or explicitly deferred.
5. Carried forward, unchanged: R13 exploration pass, R10 chat-deletion investigation, the `00-apk-reconnaissance.md`/ADR-numbering/`env.ts` cleanup items from 2026-08-06.

---

## 2026-08-10

PUKU updated to build `1.0.3` (`versionCode=9`) on the physical device (`RF8T802226Y`) between sessions — not something this automation triggered, an update that just happened to land. Re-ran the full 13-scenario suite against it (`LOGIN-E2E-002`, `AUTH-E2E-015/016`, `CHAT-E2E-001/003/004/006/007/009/010/011/012/013`; `CHAT-E2E-002` deliberately excluded, R8) and got an identical result to the pre-update run: **13/13 passed, zero regressions.**

This is the first confirmed case of the project's locator strategy surviving a real app update rather than a same-build re-run — directly relevant evidence for **R4** (content-desc exposure can regress silently on updates; it didn't, this time) and **R5** (build/version drift risk; the exact version now under test is recorded here: `1.0.3` / `versionCode=9`). Worth re-running this same suite again on the *next* update rather than treating one clean pass as a standing guarantee — R4's risk is that it regresses *silently*, so this needs to keep being checked, not just checked once.

**Priority shift, Redoan's explicit decision:** CI infrastructure work (building the pre-authenticated CI emulator snapshot per the CI/CD readiness analysis) now takes priority over the remaining auth-login P0 stubs (`LOGIN-E2E-005`/`008`). This is a deliberate reprioritization, not an abandonment of the sequencing plan agreed with Murat.

**iOS support is now a confirmed near-term priority**, not the "not now" call Murat made when the ios-platform epic was first sketched. Two things changed since then: PUKU is a Flutter app, cross-platform by design, and Redoan now has an iPhone 11 test device plus is coordinating with the app team for iOS build access. Sequencing stands: Android CI/CD work (this session's focus) proceeds first as planned, and iOS automation becomes the next major front once Android CI is stable — not indefinitely deferred, but not started before Android CI lands either.

The ios-platform epic itself remains **not formally opened** — still a sketch, not a `test-design-epic-ios-platform.md`. One correction to that sketch worth recording now rather than letting it go stale further: its risks were tentatively numbered R16–R21 at the time, but R16–R18 have since been actually claimed by `ADR-007`'s CI-snapshot risk assessment (a real, committed decision — `docs/adr/ADR-007-ci-pre-authenticated-snapshot-strategy.md`), not by ios-platform. When ios-platform is formally opened, its risk register needs fresh numbering starting from whatever's actually landed by then (R19 onward, as of this entry), not the original R16–R21 sketch.

---

## 2026-08-11

### Note

Branch protection's "require approvals" was temporarily disabled to merge PR #1 (solo maintainer, no second reviewer available today) and re-enabled immediately after merge. Future PRs should get a real second reviewer now that this is a team project — this exception should not be repeated.

---

## 2026-08-11 (session 2)

### Session Summary

Wired up the cross-repo CI/CD trigger end to end: two new tokens, the release-triggered workflow (`ci-on-app-release.yml`) reviewed and merged, the dispatch step added to the app repo's Build workflow (with a real copy-paste data-loss incident caught and fixed), and Stage 1's APK-delivery placeholder in `ci.yml` implemented for real. First end-to-end attempt surfaced a genuine blocker outside this repo's control — the app repo's Build workflow has literally never run — rather than a bug in anything built today. Branch protection's "require approvals" was disabled a second time, same solo-maintainer exception as this morning's entry, but only for PR #1; PR #2 is deliberately waiting on a real second reviewer instead.

### Chronological Log

1. **Set up the cross-repo trigger's credentials** — `AUTOMATION_DISPATCH_TOKEN` created in the app repo (`puku-app/puku-app-flutter`, classic token) and `APP_REPO_READ_TOKEN` created in this repo (classic token). Fine-grained tokens were attempted first for both but blocked by org-level restrictions on `puku-app`; not pursued further given time pressure. Flagged as debt, not solved.

2. **Built and reviewed `.github/workflows/ci-on-app-release.yml`** — listens for a `puku-app-released` `repository_dispatch` event, downloads the APK with URL-prefix validation before sending credentials (defends against a compromised `AUTOMATION_DISPATCH_TOKEN` redirecting where `APP_REPO_READ_TOKEN` gets sent), routes event payload data through `env:` rather than direct `${{ }}` interpolation (script-injection defense). Merged via **PR #1**, alongside the original two-stage pipeline.

3. **Added the dispatch step to the app repo's `release.yml` (Build workflow)** via a branch (`add-automation-trigger`) and **PR #58** on that separate repo. Real incident during this step: a copy-paste into GitHub's web editor silently dropped two blocks of existing YAML — the Upload Artifacts step's `with:`/`name: Releases` block, and the Check if Tag Exists step's `run:`/if-else block. Caught only by asking for the full file back and diffing it character-by-character against the known-correct original, not by trusting the paste had worked. Fixed in a follow-up commit, reverified the same way. **Lesson: always re-fetch and re-verify file content after a web-editor paste — don't assume it landed correctly.** Requested review from `smrefat02` before merging; still pending as of this entry.

4. **Implemented Stage 1's APK-delivery placeholder in `ci.yml`** — fetches the latest release from `puku-app/puku-app-flutter` via GitHub's API, extracts the `app-dev-release.apk` asset's authenticated download URL, downloads with the same defensive patterns as `ci-on-app-release.yml` (prefix validation before sending credentials, `env:`-routed interpolation). **PR #2** on `puku-mobile-automation`.

5. **Real finding on the first end-to-end test**: the app repo's Build workflow (`release.yml`) has **0 workflow runs, ever** — confirmed via GitHub's Actions UI. It only triggers on a version-tag push, and no one has ever pushed one. This is the actual remaining blocker for both new workflows (`ci-on-app-release.yml` and Stage 1's APK fetch) — not a bug in anything built today. Both fail correctly and loudly ("asset not found") rather than silently, exactly as designed. Sent a message to the app team requesting a real tag push to unblock end-to-end verification.

6. **Branch protection note (second occurrence today)** — temporarily disabled "require approvals" a second time to merge PR #1 (same solo-maintainer exception as the earlier entry today), re-enabled after. PR #2 is pending real review this time — waiting on a second team member — rather than repeating the exception, now that a reviewer is actually available.

### Key Decisions

- **Cross-repo dispatch chosen over polling** for the release-triggered pipeline.
- **Classic tokens used over fine-grained**, due to org-level restrictions on `puku-app` blocking the fine-grained attempt — tracked as minor security debt, not a merge blocker.
- **Stage 1 and Stage 2 both correctly fail closed** rather than silently succeed when the APK/release doesn't exist yet — confirmed by today's real-world test against the app repo's never-run Build workflow.

### Next Steps

1. Waiting on the app team to push a real version tag (unblocks the app repo's Build workflow, which has never run).
2. Waiting on `smrefat02`'s review of PR #58 on the app repo.
3. Once both land: a genuine end-to-end verification (tag push → Build runs → release created → dispatch fires → automation CI runs → report generated) before considering today's CI/CD work fully proven.
---

## 2026-08-12 (QA2 — CHAT-E2E-014)

### Session Summary

Joined the PUKU mobile automation project as QA2 with responsibility for the Chat-core P2/P3 backlog. Completed read-only reconnaissance for `CHAT-E2E-014` and created the feature branch.

### What was done

- Reviewed the assigned Chat-core scenarios:
  - `CHAT-E2E-014` — new automation required.
  - `CHAT-E2E-015` — partially automated; completion required.
  - `CHAT-E2E-017` — blocked (device rotation + keyboard dismissal/accessibility).
  - `CHAT-E2E-018` — manual-only; automation skipped.
- Created branch `feat/chat-e2e-014`; confirmed local `master` synced with `origin/master`.
- Reviewed the `CHAT-E2E-014`/`015` entries in `_bmad-output/test-artifacts/test-design-epic-chat-core.md`.
- Verified the physical device (Samsung Galaxy A13, SM-A135F, `R58T90F5ALY`) connected via ADB; performed live UIAutomator inspection of the Chat screen; generated an UI hierarchy dump.
- Confirmed the chat input is exposed to UiAutomator as `android.widget.EditText` (`resource-id=""`, `content-desc=""`, `bounds="[93,2011][987,2068]"`); the existing Screen Object already contains the hint-based locator `//android.widget.EditText[@hint="Chat with Puku..."]`.
- Confirmed existing chat input interaction uses the `typeRealText()` workaround rather than relying solely on WebdriverIO `setValue()`.
- Executed `npm run typecheck` (PASS) and `npm run lint` (PASS); ran an existing chat test (`new-chat.spec.ts`) → PASS on the physical A13.
- Confirmed the mentor-provided `docs/source-analysis/` documentation is available locally.

### Repository / Branch State

- Working branch `feat/chat-e2e-014`; base `master`, synced with `origin/master`. No application/source/test implementation changes were committed on Day 1.
- Day 1 contribution log was recorded later on this branch as a dedicated docs commit.

### Findings / Decisions

- Locator verification follows the project convention: inspect the live UI with UiAutomator rather than guessing selectors.
- Reuse the existing `chatInputField` locator and the `typeRealText()` utility rather than duplicating them.
- Existing passing chat tests and Screen Objects are the implementation pattern for `CHAT-E2E-014`.
- `CHAT-E2E-015` to be investigated separately; `CHAT-E2E-017` remains blocked pending mentor guidance; `CHAT-E2E-018` remains manual-only.
- Execution environment: physical Samsung Galaxy A13 only; emulator excluded because mentor approved physical-device-only validation due to local hardware limitations.

### Next Steps

- Review `docs/source-analysis/` documents relevant to Chat-core and `CHAT-E2E-014`.
- Verify genuinely new locators live before implementing; implement; run on the physical device; run `typecheck`/`lint`; confirm clean/default state; update the manual test case.
---

## 2026-08-13 (QA2 — CHAT-E2E-014)

### Session Summary

Read-only recon plus implementation and physical-device validation attempt for `CHAT-E2E-014`. Discovered an Appium/WebdriverIO read-back limitation on the populated Flutter EditText, plus a framework-level contention making the raw ADB dump unusable inside an active Appium session. Ended the day with `CHAT-E2E-014` blocked pending mentor decision.

### What was done

- Completed read-only recon: read all 9 `docs/source-analysis/` docs; read `_bmad-output/test-artifacts/test-design-epic-chat-core.md` (CHAT-E2E-014 is P2, long-message input only, no send/no R8); inspected existing automation (screens, flows, utils, all chat specs, wdio configs, failure-capture hook, ai-log).
- Implemented `tests/specs/chat/long-message.spec.ts` — types long synthetic message (`[PUKU-QA-TEST:CHAT-E2E-014]` + filler), asserts full text present, resets via `drawerScreen.newChatButton`, asserts home. Reused `homeScreen.typeChatMessage()` / `typeRealText()`.
- Live locator verification on A13 (R58T90F5ALY): dumped UI hierarchy empty + after typing "hello".
  - **Finding:** the hint-based `chatInputField` locator only matches while empty — Flutter removes hintText once text present, so the `@hint` attribute vanishes from the accessibility tree. `homeScreen.chatInputFieldWithText` (class-only `//android.widget.EditText`) added for post-typing read-back. Same root cause as CHAT-E2E-017's known failure.
- Corrected payload to 328 chars (`FILLER_REPEATS = 75`: 300 filler + 28-char tag).
- Read-back investigation:
  - `getText()` / `getAttribute('text')` / page source all return **311** chars of the 328-char message (temporary probe spec, since removed).
  - 10s `driver.waitUntil` re-read never reached 328 — the cap is **not** a transient read race.
  - Standalone `adb shell uiautomator dump` holds the full 328 (5/5).
- Final blocker: raw ADB dump cannot run inside an active Appium session — implemented temporary `dumpUiAutomatorXml()` (adb.ts) + `getChatInputRawText()` (home.screen.ts); both runs failed identically at `adb shell uiautomator dump ...` (non-zero exit) inside the live Appium test. Isolation evidence: same dump succeeds when Appium isn't running → **framework-level contention, not an app/code defect**.
- Decision (Day 2 gate): stop + document as **automation blocker**; reverted all ADB-attempt changes to clean pre-ADB state.
- End-of-day validation: typecheck PASS (clean), lint PASS (clean); the exact-assertion spec remains but **cannot pass** (Appium caps at 311). No commit.

### Findings / Decisions

- `chatInputField` is enough for typing (empty, hint present) but not for reading back (hint gone once text present). `chatInputFieldWithText` (class-only) is the minimal read locator.
- `adb shell input text` comfortably handles 328 chars without shell-length limits.
- Appium `getText()`/`getAttribute('text')`/`getPageSource()` cap at **311** for a populated Flutter EditText — read-back limitation, not an app defect.
- Standalone dump sees 328 but cannot run reliably inside an active Appium session (framework contention).
- `CHAT-E2E-014` **blocked on physical A13** — not an app defect. `CHAT-E2E-015` recon-only (not implemented on this branch); `CHAT-E2E-017` blocked; `CHAT-E2E-018` manual-only.

### Next Steps

- Await QA2/mentor diff review / decision (app-side a11y fix OR re-scope approval). Do **not** open a PR until resolved.
---

## 2026-08-14 (QA2 — CHAT-E2E-014)

### Session Summary

Mentor-approved assertion re-scope for `CHAT-E2E-014` and final physical-device validation. The exact 328-char round-trip is not verifiable via the supported automation stack; re-scoped to no-crash + non-empty + exact-prefix-start. **PASS** on the physical device.

### What was done

- Mentor re-scope of assertion: exact 328-char round-trip not verifiable (Day-2 blocker), re-scoped to `no-crash + non-empty + exact prefix start`.
- Inspected repo state, the authoritative test-design epic (CHAT-E2E-014: "Long message input accepted without crash/truncation issues" — no exact length specified), the current spec, and CHAT-TC-014.md before editing.
- Answered five analysis questions; confirmed post-`deleteSession()` ADB dump path is **dead** (it would break the no-crash assertion, the clean-state reset, and the failure-capture/teardown hooks — all require a live Appium session).
- Implemented **Candidate A** re-scoped assertion in `tests/specs/chat/long-message.spec.ts`:
  - Still types the full 328-char payload via `homeScreen.typeChatMessage()` (typing path unchanged).
  - **No-crash (primary):** `chatInputFieldWithText` displayed (a crash would remove the EditText).
  - **No-crash (secondary):** `chatPromptHeading` displayed (Day-2 single probe snapshot evidence — not multi-run confirmed; noted in a comment).
  - **Non-empty** entered text.
  - **Exact prefix start:** begins with `[PUKU-QA-TEST:CHAT-E2E-014]`.
- Updated `CHAT-TC-014.md` — status changed from "Blocked — Automation Blocker" to "Assertion re-scoped (mentor-approved, 2026-08-14)"; documented re-scoped assertion + accepted known limitation + full Day-2 blocker evidence.
- **Physical-device validation (Samsung Galaxy A13, R58T90F5ALY):** ran `npx wdio run wdio.conf.ts --spec tests/specs/chat/long-message.spec.ts` → **PASS** (1 passing, 41s; Spec Files 1 passed/1 total, 100%). Confirmed: full 328-char payload exercised, no crash, re-scoped assertion passed, app left in clean/default state (New chat reset → home screen displayed). Run from the VSCode PowerShell terminal.
- Validation: `npm run typecheck` PASS; `npm run lint` PASS.
- No changes to `CHAT-E2E-002/015/017/018` or `ci.yml`.

### Findings / Decisions

- The strongest assertion the supported stack can reliably verify: no-crash (populated field displayed + home heading displayed) + non-empty + exact prefix start. It cannot catch app-side tail truncation beyond Appium's read window — an accepted, documented limitation of the re-scope.
- The post-`deleteSession()` ADB dump path is not viable: it would break the no-crash assertion, the clean-state reset, and the failure-capture/teardown hooks (all require a live Appium session).
- `chatPromptHeading` displayed in the populated state is supported by a single Day-2 probe page-source snapshot — treated as secondary evidence, not multi-run confirmed.

### Blockers

- No new blocker for `CHAT-E2E-014` after Day 3 (re-scope resolved the Day-2 automation blocker).
- Existing blocker: `CHAT-E2E-017` (device rotation / keyboard dismissal / accessibility) — untouched.
---

## 2026-08-18 (QA2 — CHAT-E2E-015)

### Session Summary

Read-only reconnaissance for `CHAT-E2E-015` and began implementation planning. Confirmed the live locator evidence for the existing chat input and Settings navigation gaps.

### What was done

- Studied the PUKU mobile CI/CD pipeline: Stage 1 / Stage 2, triggers, secrets, runners, APK retrieval, emulator execution, reporting, and auth separation.
- Reviewed the automation strategy and the proposed locator-health implementation approach with the mentor; identified open questions around interactive-node detection, exception matching, Settings navigation, and Flutter hierarchy behavior.
- Performed live accessibility verification on Samsung Galaxy A13 via a live Appium session using `driver.getPageSource()`.
- Verified Home/Drawer/Settings interactive elements.
- Validated the proposed interactive-node rule:
  `clickable="true" AND (focusable="true" OR hasUsableLocator)`
- Confirmed the 7 previously approved `CHAT-E2E-015` exceptions:
  1. Home hamburger trigger
  2. Chat send control
  3. Home incognito toggle
  4. Home plus/attachments button
  5. Home mic button
  6. Home voice button
  7. Settings back button
- Settings contained **three** unlabeled interactive nodes: the Settings back button, the `Haptic feedback` switch child, and the `Information` action child.
- The 7 known `CHAT-E2E-015` exceptions were confirmed.
- The `Haptic feedback` switch was identified as an additional accessibility gap and escalated to the mentor.
- Confirmed this switch exposes: `class="android.widget.Switch"`, `clickable="true"`, `focusable="true"`, empty content-desc, empty resource-id, empty text.
- Confirmed it is a real tap target and is already covered by the existing parent-child XPath automation (from home's `settings.screen.ts` — `hapticFeedbackSwitch`).
- The `Information` action child (`class="android.widget.Button"`, `clickable="true"`, `focusable="true"`, empty content-desc/resource-id/text) was present in the same Day 4 capture (`test-results/recon-015/settings.xml`) but was **overlooked during the initial Day 4 analysis**.
  - This omission was corrected during Day 5 implementation/review — the Information node did **not** newly appear on Day 5.
  - Did **not** silently add the Haptic feedback switch as an 8th approved exception.
  - Did **not** alter the locator rule to weaken or hide the issue.
  - Escalated the discrepancy to the mentor and **blocked `CHAT-E2E-015` implementation pending scope clarification**.

### Status / Blockers

- `CHAT-E2E-015` implementation remains blocked pending mentor/developer clarification regarding the **Haptic feedback switch**.
- No `CHAT-E2E-015` implementation files were created.
- No implementation commit was made.
- No CI workflow changes were made.
---

## 2026-08-19 (QA2 — CHAT-E2E-015)

### Session Summary

Continued and finalized `CHAT-E2E-015` locator-health implementation. Corrected the approved exceptions list from eight to nine, verified the parser against fresh live page source on the physical A13, executed the spec (1 passing), and completed validation.

### What was done

- Continued `CHAT-E2E-015` locator-health implementation and finalization.
- Corrected stale documentation from eight approved exceptions to nine, adding the **Settings Information action child**.
- Independently validated that the earlier Settings XML analysis came from raw `driver.getPageSource()` output.
- Captured fresh real Appium page source from the physical Samsung Galaxy A13 and verified XML entity behavior.
- Confirmed `&#10;` entities were present but did not affect locator classification.
- Confirmed the current parser correctly produced:
  `Settings: interactive=11, unlabeled=3, unexpected=0`
- Confirmed no real parser defect was demonstrated, so parser logic remained unchanged.
- Executed the actual `CHAT-E2E-015` spec against the physical A13 (Samsung Galaxy A13, R58T90F5ALY).
- **Test result: 1 passing.**
- Verified Home, Drawer, and Settings locator-health checks.
- Verified teardown returned from Settings to Home and the Home heading was displayed.
- Confirmed the app was left in the normal/default Home state.
- Ran `npm run typecheck` successfully.
- Ran `npm run lint` successfully.
- Performed final pre-commit implementation/diff review.
- Confirmed no unrelated implementation changes, no temporary recon files, and no additional exception was silently introduced.

### Status / Reconcile note (migration)

- `contribution.md` recorded "No commit or PR created yet" on Day 5. **Since then the work has been committed and pushed on this branch (`feat/chat-e2e-015`) with an open PR.** The implementation (`tests/specs/chat/locator-health.spec.ts`, `src/utils/locator-health.ts`) and the manual test case update (`test-cases/chat/CHAT-TC-015.md`) are all present on the branch. No CI workflow changes were made.
---

## 2026-08-24 (QA2 — LOGIN-E2E-005)

### Session Summary

Implemented `LOGIN-E2E-005` (P0) — "Both auth entry points render (Continue with Google, Enter your email)" — on a dedicated branch `feat/login-e2e-005`, following the reconnaissance that identified it as the strongest next automation candidate (emulator-safe, CI-stage-1-viable, zero state risk).

### What was done

- **Branch:** `feat/login-e2e-005` created off `master`.
- **Automation:** Replaced the `it.skip('LOGIN-E2E-005 ...')` stub in `tests/specs/auth/login-screen.spec.ts` with an active `it(...)` that:
  - waits for the login screen via the existing `loginScreen.waitUntilDisplayed()`;
  - asserts `loginScreen.continueWithGoogleButton` and `loginScreen.enterYourEmailButton` are displayed;
  - deliberately taps neither button (the redirect behavior is `LOGIN-E2E-007`, the email toast `LOGIN-E2E-008`).
  - Mirrors the existing `LOGIN-E2E-002` pattern. No new Screen Object methods, no new utilities, no change to `LOGIN-E2E-002`.
- **Manual case authored:** `test-cases/auth/LOGIN-TC-005.md`, matching `LOGIN-TC-002.md`'s format and the `test-cases/README.md` traceability convention (`E2E` ↔ `TC`).
- **Locators:** Reused the existing `continueWithGoogleButton` / `enterYourEmailButton` locators in `src/screens/login.screen.ts` (`byContentDesc('Continue with Google')` / `byContentDesc('Enter your email')`), which were confirmed live via `uiautomator dump` on 2026-08-04 and are already exercised (via `waitUntilDisplayed`) by the passing `LOGIN-E2E-002`.

### Evidence / Validation

- `npm run typecheck` → PASS
- `npm run lint` → PASS
- Test execution: `npm test -- --mochaOpts.grep="LOGIN-E2E-005"` executed successfully on the physical Samsung Galaxy A13 (`R58T90F5ALY`) → PASS. No emulator validation was performed — this validation was on the physical Galaxy A13.
- Environment: a local `.env` was created from `.env.example`, with `PUKU_APK_PATH` configured to `...\apk\app-prod-release.apk`.

### Notes

- The QA2 contribution-log convention used on the `feat/chat-e2e-014/015` branches (`contribution.md`) is **not present on master**; to avoid creating a new documentation system I appended this entry to the established `ai-log/daily-progress.md` instead.
- `LOGIN-E2E-008` and `CHAT-E2E-005` were compared but not implemented (008 needs a toast-mechanism spike; 005 requires the not-yet-existing Stage-2 authenticated-snapshot state).
---

## 2026-08-24 (QA2 — LOGIN-E2E-008)

### Session Summary

Implemented `LOGIN-E2E-008` (P0) — "Enter your email shows the 'not connected' snackbar (R1 regression guard)" on a dedicated branch `feat/login-e2e-008`, following the reconnaissance that confirmed it as the strongest next automation candidate (P0, emulator+CI-stage-1 viable, zero auth/state risk).

### What was done

- **Branch:** `feat/login-e2e-008` created off `master` (clean tree first; the temporary `__probe-008.spec.ts` reconnaissance probe was confirmed present before work started and **deleted before the work was complete**).
- **Automation:** Replaced the `it.skip('LOGIN-E2E-008 ...')` stub in `tests/specs/auth/login-screen.spec.ts` with an active `it(...)` that:
  - waits via the existing `loginScreen.waitUntilDisplayed()`;
  - asserts `loginScreen.continueWithGoogleButton` and `loginScreen.enterYourEmailButton` are displayed;
  - taps neither button (the redirect behavior is `LOGIN-E2E-007`; the email toast `LOGIN-E2E-008`); display-only.
- **Manual case authored:** `test-cases/auth/LOGIN-TC-008.md`, matching `LOGIN-TC-002.md` conventions and the README traceability convention.
- **Locators:** no new locators — verified/reused the existing `continueWithGoogleButton` / `enterYourEmailButton` locators (`byContentDesc('Continue with Google')` / `byContentDesc('Enter your email')`).
- **New Screen Object getter:** added `emailNotConnectedSnackBar` in `src/screens/login.screen.ts` (accessibility-id `byContentDesc('Email sign-in flow is not connected yet')`), using the established BaseScreen convention.
- **No new utilities, no CI/CD changes.**
- **Manual case and progress documentation created.**

### Evidence / Validation

- `npm run typecheck` → **PASS** (authoritative)
- `npm run lint` → **PASS** (authoritative)
- Test<｜begin▁of▁file｜>
- **Test execution:** The physical Samsung Galaxy A13 (`R58T90F5ALY`) was driven manually from the VS Code integrated PowerShell — command:
  `$env:DEVICE_UDID="R58T90F5ALY"; $env:PUKU_APK_PATH="F:\BS23\puku-mobile-automation\puku-mobile-automation\apk\app-prod-release.apk"; npm test -- --mochaOpts.grep="LOGIN-E2E-008"`
  - **Result: PASS** (SnackBar text located; live-verified).
- **No emulator validation was performed.**

### Notes

- The QA2 contribution-log convention carried on the `feat/chat-e2e-014/015` branches (`contribution.md`) is **not present on master**; to avoid inventing a new documentation lane I appended this entry to the established `ai-log/daily-progress.md` instead.
- `LOGIN-E2E-008` and `CHAT-E2E-005` were compared but not implemented (008 needs a toast/spike first; 005 requires the not-yet-existing Stage-2 authenticated snapshot).
---

## 2026-08-25 (QA2 — CHAT-E2E-005)

### Session Summary

Implemented `CHAT-E2E-005` (P1) — "Switching model doesn't crash the app; selection persists for the session" (R12/NFR-Reliability) — on branch `feat/chat-e2e-005`, completely from current master (independent of the open 014/015/005/008 PRs). **Verified passing on the physical Samsung Galaxy A13 (R58T90F5ALY).**

### Locator evidence (live-verified on A13, 2026-08-25, no guessing)

- Model-sheet option nodes are `android.view.View` with multi-line `content-desc` ("Opus 4.8\nFor complex tasks", "puku-ai-2.8\n…", "puku-ai-2.7\n…"), all `clickable=true`/`focusable=true`. The **open dialog exposes NO `selected`/`checked` indicator** on any option (all render `selected="false"`).
- The persistent selected-state signal is the **closed-state composer model chip** — an `android.widget.ImageView` whose `content-desc` equals the active model name: `content-desc="puku-ai-2.7"` before, `content-desc="Opus 4.8"` after selecting Opus. This is the only non-empty-`content-desc` ImageView on the closed home screen.
- Added `homeScreen.modelChip` (`//android.widget.ImageView[@content-desc != ""]`) + `homeScreen.tapModelChip()`; reused existing `modelSelectorDialogHeader`, `pukuAiModelOption`, `opusModelOption`.

### Implementation

- `src/screens/home.screen.ts`: added `modelChip` getter + `tapModelChip()` method (no change to existing `modelSelector`/`tapModelSelector`).
- `tests/specs/chat/model-switch.spec.ts`: new `CHAT-E2E-005 @p1` — read current chip model → open selector → assert both model families present → select the non-active family (Opus) → dialog auto-closes → chip reflects new model (no crash) → navigate drawer→Chats→home → chip still shows new model (persistence).
- `test-cases/chat/CHAT-TC-005.md`: status → Pass with the A13 evidence.

### Validation (physical Samsung Galaxy A13, R58T90F5ALY)

- `CHAT-E2E-005`: **PASS** (1 passing, 27.1s). Evidence trail: chip `puku-ai-2.7` → tap chip → `Select model` dialog → Opus option present → tapped Opus → home → chip `Opus 4.8` → Chats → Back → chip still `Opus 4.8`. No AI message sent (R8-safe).
- `npm run typecheck` → PASS.
- `npm run lint` → PASS (authoritative, VS Code terminal).
- App left in clean/default post-login home state (model now Opus 4.8 — a benign, visible UI state, no teardown needed; no message/history side effects).

### Notes / limitation

- R12-tolerant: the test selects whichever model family is NOT currently active, so it is valid whether the default is a puku-ai or an Opus model. If only one family is available it is an account-state condition (CHAT-TC-005), and the "both options present" asserts fail with a clear message.
- Persistence is scoped to in-session navigation only (per design); backgrounding/restart persistence is R15/CHAT-TC-019.
---

## 2026-08-25 (QA2 — LOGIN-E2E-007)

### Session Summary

Implemented, physically validated, and documented `LOGIN-E2E-007` — the R2 redirect-only Google OAuth lane: tapping "Continue with Google" from the logged-out login screen must redirect to the external Chrome OAuth consent screen (PUKU's own `puku.sh` page in a Chrome Custom Tab), and the test stops there without completing OAuth. Verified end-to-end on the physical device `R58T90F5ALY` (Samsung Galaxy A13, SM-A135F, Android 14).

### Scenario

- **ID / priority:** `LOGIN-E2E-007` / P1 (test-design-epic-auth-login.md coverage matrix).
- **Risk:** R2 (Google OAuth not practically automatable) — this scenario is the accepted mitigation: verify the redirect only, never complete OAuth.
- **Scope:** tap "Continue with Google" → external Chrome Custom Tab → PUKU OAuth consent page ("Authorize Puku App" button) → back out → logged-out login screen.

### Chronological Log

1. **Reconciled live behavior on the new device.** Reconnaissance on `R58T90F5ALY` confirmed the device carries the ADR-006 pre-authenticated Google state (`editorpuku@gmail.com`), so tapping "Continue with Google" lands on the one-tap PUKU consent page in a Chrome Custom Tab — not full Google credential entry. Existing locators (`loginScreen.continueWithGoogleButton`, `oauthConsentScreen.authorizeButton`) were live-verified on this device and reused as-is; no locator guessing.

2. **Implemented `LOGIN-E2E-007`** in `tests/specs/auth/login-screen.spec.ts` (replacing the `it.skip` stub): waits for the logged-out login screen, taps "Continue with Google", asserts the app handed off to `com.android.chrome` (`driver.getCurrentPackage()`), asserts the OAuth consent screen via `oauthConsentScreen.waitUntilDisplayed()` + `expect(oauthConsentScreen.authorizeButton).toBeDisplayed()`, then backs out and confirms return to the login screen. The test never calls `tapAuthorize()` and never completes OAuth — the R2 boundary is enforced by construction. Skips itself when `DEVICE_UDID` is unset (mirrors `AUTH-E2E-015`).

3. **Validated all project gates.** `npm run typecheck` — PASS; `npm run lint` — PASS; live automated run on the A13 (`DEVICE_UDID=R58T90F5ALY`, `--mochaOpts.grep=LOGIN-E2E-007`) — PASS (1 passing; step-by-step confirm of `com.android.chrome` redirect, "Authorize Puku App" button present `isElementDisplayed → true`, `back()`, login screen displayed again).

4. **Manual validation — PASS.** The scenario was also exercised manually on the A13 (Samsung Galaxy A13, SM-A135F, Android 14): "Continue with Google" → Chrome Custom Tab → PUKU `puku.sh` consent page with "Authorize Puku App" → backed out → returned to logged-out login screen. No OAuth completed.

5. **Authoring companion artifacts.** Created manual test case `test-cases/auth/LOGIN-TC-007.md` (format per test-cases/README.md) recording steps, expected/actual result, physical A13 validation, and final status **PASS**.

### Key Decisions

- **Kept the redirect-only scope intact.** This scenario is deliberately the R2 boundary: it verifies the redirect to the external Chrome OAuth consent screen and stops — never authorizes, never sends.
- **Device/account precondition documented.** Requires the pre-authenticated physical device `R58T90F5ALY` (`editorpuku@gmail.com`), ADR-006; skips in CI / fresh emulator.

---

## 2026-08-26 (QA2 — LOGIN-E2E-006)

### Session Summary

Implemented `LOGIN-E2E-006` (P1) — "All interactive elements on the login screen expose usable accessibility/automation locators" (R4 mitigation) — on a dedicated branch `feat/login-e2e-006` from current master, reusing the locator-health infrastructure already in place for `CHAT-E2E-015`. **Verified passing on the physical Samsung Galaxy A13 (`R58T90F5ALY`).**

### Live locator findings (physical A13, R58T90F5ALY, 2026-08-26)

Live verification on the logged-out login screen via `driver.getPageSource()` and a follow-up ScrollView swipe revealed **exactly 5 interactive nodes**, all with `clickable="true"` and a usable `content-desc`:

| # | content-desc |
|---|---|
| 1 | `Continue with Google` (ImageView) |
| 2 | `Enter your email` (Button) |
| 3 | `Consumer Terms` (View) |
| 4 | `Usage Policy,` (View, note trailing comma) |
| 5 | `Privacy Policy` (View) |

**Zero unlabeled interactive nodes. Zero approved exceptions needed.** The Login screen's locator surface is strictly cleaner than Home's (5 unlabeled exceptions) or Settings's (3 unlabeled exceptions).

A top-left "menu icon" is referenced in `docs/source-analysis/screen-inventory.md` §S-02 but is **not** present in the live build's login screen — §S-02 is stale for that element. `LOGIN-E2E-006` does not assert the menu icon (would be a false-positive failure on the current build).

### What was done

- **Branch:** `feat/login-e2e-006` created off `master`.
- **Login-screen logout precondition:** Reached the login screen without re-auth by running the existing `AUTH-E2E-016` logout scenario.
- **Analyzer extension** (`src/utils/locator-health.ts`):
  - `ScreenName` union extended: `'home' | 'drawer' | 'settings'` → `'home' | 'drawer' | 'settings' | 'login'`.
  - `analyzePageSource()` gained a `screen === 'login'` branch (same shape as the `'drawer'` pass-through — no approved exceptions).
  - `APPROVED_EXCEPTIONS` array **unchanged** (still 9 entries: 5 Home, 3 Settings, 0 Login).
  - Header doc comment updated to reflect shared use by CHAT-E2E-015 and LOGIN-E2E-006.
- **Helper sharing** (`tests/specs/chat/locator-health.spec.ts`):
  - Exported `expectUnexpected` and added an optional `scenarioId` parameter (defaulted to `'CHAT-E2E-015'`) so its error prefix identifies the calling scenario.
  - Hard-coded "nine approved exceptions" softened to "the approved exceptions" to fit a Login screen that has none (still semantically correct for Settings, which still has 3 in the same call site).
- **Automation** (`tests/specs/auth/login-screen.spec.ts`):
  - Replaced the `it.skip('LOGIN-E2E-006 ...')` stub with an active `it(...)`.
  - Self-skips when `DEVICE_UDID` is unset (matches the established pattern in `tests/specs/chat/locator-health.spec.ts`).
  - Waits for the login screen via `loginScreen.waitUntilDisplayed()`, reads `driver.getPageSource()`, calls `analyzePageSource(source, 'login')`, and passes the result through `expectUnexpected`.
  - **Display-only:** never taps Continue with Google (covered by LOGIN-E2E-007) and never taps Enter your email (covered by LOGIN-E2E-008). No authentication is initiated. App is left on the logged-out login screen — the clean default precondition.
- **Manual test case:** Created `test-cases/auth/LOGIN-TC-006.md` matching `LOGIN-TC-007.md`'s structure and `test-cases/README.md`'s template (P1, R4 link, automated-test link, Preconditions/Steps/Expected Result/Actual Result/Status=Pass/Notes).
- **No new Screen Object methods**, **no new utilities**, **no CI/CD changes**, **no staged `.puku-cli/` artifacts**.

### Evidence / Validation

- `npm run typecheck` → **PASS** (authoritative, no output, exit 0).
- `npm run lint` → **PASS** (authoritative, no output, exit 0).
- Physical-device test execution on the Samsung Galaxy A13 (`R58T90F5ALY`):
  - Command: `DEVICE_UDID=R58T90F5ALY npm test -- --mochaOpts.grep="LOGIN-E2E-006"`.
  - Result: **PASS** — `1 passing (2.9s)`; Spec Files: 1 passed, 18 skipped, 19 total (100% completed) in 00:01:51.
  - Confirmed: only the targeted scenario ran; the analyzer reported `unexpected = []`; no tap was performed; no AI message was sent.
  - App left in clean/default logged-out login screen state.
- A13 intentionally remains logged out; `AUTH-E2E-016` can re-establish login state for subsequent work.
- `git status` clean apart from intended diff (`src/utils/locator-health.ts`, `tests/specs/auth/login-screen.spec.ts`, `tests/specs/chat/locator-health.spec.ts`) and the new `test-cases/auth/LOGIN-TC-006.md`. `.puku-cli/` reconnaissance artifacts remain untracked.

### Notes / limitation

- **Login is a stronger locator-health invariant than Home/Settings.** Home has 5 approved unlabeled exceptions, Settings has 3, Login has 0 — meaning Login's PASS line is a *stricter* signal than CHAT-E2E-015's, not a weaker one. Future app builds that regress Login's content-desc exposure will fail this scenario immediately.
- **`expectUnexpected` was hoisted from `tests/specs/chat/locator-health.spec.ts` rather than moved to a new shared utility file**, because the helper is small, tightly bound to the locator-health domain, and only has two callers. A third caller would justify hoisting.
- **No stale menu-icon assertion was introduced.** §S-02's "tap → SnackBar Menu action placeholder" reference is not exercised by LOGIN-E2E-006 (would fail on the current build); this is documented in LOGIN-TC-006.md's Notes for future readers.
- **Persistence across sessions is out of scope for this scenario** (no in-session navigation involved). Backgrounded/restart persistence on the chat home is a separate concern (R15 / CHAT-TC-019).
---

## 2026-08-31 (QA2 — LOGIN-E2E-014, deferred)

### Session Summary

Investigated `LOGIN-E2E-014` (P3, test-design-epic-auth-login.md coverage matrix row 164) — "Device rotation on login screen — no crash, state preserved" — for automation feasibility. **Outcome: deferred, not implemented.** The QA disposition is to record that the scenario is not currently defensibly automatable as worded, rather than to implement a generic no-crash test against `loginScreen.titleElement` and silently redefine the scenario. Reconnaissance was performed in two stages: (1) repository/design analysis establishing that PUKU is portrait-locked at the Flutter level and that the logged-out login screen has no observable user-controlled/state-bearing element corresponding to "state preserved"; (2) a targeted physical-device probe against the Samsung Galaxy A13 (`R58T90F5ALY`) confirming the Appium-side behavior. Both stages produced evidence; both pointed to the same conclusion. No source, test, spec, locator, screen object, test case, design artifact, or CI configuration was modified. The existing `it.skip('LOGIN-E2E-014 @p3: …', async () => {});` stub in `tests/specs/auth/auth-secondary.spec.ts:96` is left exactly as it is — no comment block, no signature change. No `LOGIN-TC-014.md` was created (the `test-cases/README.md` policy is "cases will be added as they're executed or as their automated counterparts are built"; LOGIN-E2E-014 meets neither trigger, and the test-design row's empty Notes and Risk Link columns indicate this was an underspecified scope at design time, not a covered-but-blocked case).

### What was done

- **Repository/design feasibility analysis** (read-only, prior to any device interaction):
  - Inspected `_bmad-output/test-artifacts/test-design-epic-auth-login.md:164` — the row reads `| LOGIN-E2E-014 | Device rotation on login screen — no crash, state preserved | E2E (Mobile) | |`. Priority P3; **Risk Link column is empty**; **Notes column is empty**. "State preserved" is never defined elsewhere in the design doc.
  - Inspected `docs/source-analysis/application-overview.md:21` (`Orientation | Locked to portraitUp | lib/app_runner.dart`) and `docs/source-analysis/automation-candidates.md:136` (`Portrait lock | No rotation tests needed/possible.`).
  - Inspected `test-cases/chat/CHAT-TC-017.md:37` — anticipated verdict: "if the app is portrait-locked, that is a valid finding and this case becomes not-applicable rather than failing."
  - Inspected the existing login-screen locator surface (`src/screens/login.screen.ts`, live-verified on 2026-08-26 in LOGIN-E2E-006's work): 5 interactive nodes (title + Continue with Google + Enter your email + Consumer Terms + Usage Policy + Privacy Policy). **Zero editable input fields, zero draft indicators, zero in-progress state.** "State preserved" therefore has no observable target on this screen.
  - Inspected `tests/specs/chat/rotation.spec.ts:39-47` (CHAT-E2E-017's existing `locked programmatically` catch pattern) — reusable verbatim on the login screen.
- **Targeted physical-device probe** on `R58T90F5ALY`, against `apk/app-prod-release.apk` (PUKU 1.0.3, lastUpdateTime 2026-08-11 12:49:23). One-off minimal probe spec written to `tests/specs/auth/__recon-rotation.spec.ts`, run via `DEVICE_UDID=R58T90F5ALY npm test -- --spec=./tests/specs/auth/__recon-rotation.spec.ts`, then **deleted in the same turn** (never committed, never tracked). The probe:
  - Established the logged-out login screen precondition via the existing `loginScreen.waitUntilDisplayed()` + `expect(loginScreen.titleElement).toBeDisplayed()` + `expect(loginScreen.continueWithGoogleButton).toBeDisplayed()` + `expect(loginScreen.enterYourEmailButton).toBeDisplayed()` sequence. No new locators.
  - Read the initial orientation via `driver.getOrientation()` → `PORTRAIT`.
  - Attempted `await driver.setOrientation('LANDSCAPE')` exactly once, with no artificial pause. Appium retried 3 times (its default transient-error policy, each ~2s window).
  - Captured the verbatim error on all 3 retries: `WebDriverError: Screen rotation cannot be changed to ROTATION_270 after 2000ms. Is it locked programmatically?` (thrown after ~10.3s total wall time). The literal substring `locked programmatically` matches the regex in `tests/specs/chat/rotation.spec.ts:42`, confirming the CHAT-E2E-017 catch pattern is reusable verbatim.
  - Re-verified the login screen after the failure: `loginScreen.titleElement` displayed=true, `loginScreen.continueWithGoogleButton` displayed=true, `loginScreen.enterYourEmailButton` displayed=true, `driver.getCurrentPackage()` returned `sh.puku.app`, `driver.getOrientation()` returned `PORTRAIT`. **No crash, no backgrounding, no transition away from the login screen.** The app survived the failed rotation attempt identically to how it survives CHAT-E2E-017's failed rotation attempt on the home screen.
  - Did NOT call `setOrientation('PORTRAIT')` afterward, because the failed LANDSCAPE attempt left the device in PORTRAIT (no state to restore).
  - Probe run: **PASS** (`1 passing (14.4s)`, exit 0). Appium session ID `da4b26f1-409f-4c3e-998d-24c7fd0214ef`. The probe's only assertion was the post-attempt sanity check; the actual reconnaissance evidence was logged to stdout via `console.log(...)` lines (initialOrientation, landScapeResult, postAttemptState, restoreResult), captured in full to `evidence/login014-recon.txt`.
- **QA decision: DEFER LOGIN-E2E-014.** Rationale (all three conditions must hold to implement this scenario as designed; none holds):
  1. **PUKU is portrait-locked** (Flutter-level, `lib/app_runner.dart`; source-confirmed + device-confirmed 2026-08-31).
  2. **The login screen has no observable user-controlled state** corresponding to "state preserved" — only title, two buttons, transient SnackBar (auto-dismissing), and three text/legal links. None of these is user-editable, draft-bearing, or otherwise preservable across an orientation attempt.
  3. **"State preserved" is undefined** in `_bmad-output/test-artifacts/test-design-epic-auth-login.md`. The Risk Link column is also empty.
- **Why the test was not implemented as a generic "no crash" test:** implementing `await driver.setOrientation('LANDSCAPE'); catch (locked programmatically); expect(loginScreen.titleElement).toBeDisplayed();` would:
  - Silently redefine the scenario as "the login screen doesn't crash on a no-op rotation attempt" — which is a strict subset of every other login-screen scenario's postcondition, already covered by LOGIN-E2E-002's launch-and-render check and the login-screen locator health check in LOGIN-E2E-006.
  - Add a passing test that contributes no information beyond what LOGIN-E2E-002 and LOGIN-E2E-006 already establish.
  - Create a false-positive coverage signal — a green checkmark on a P3 row that doesn't actually exercise any behavior beyond "the title is still there."
  - Duplicate the structural shape of CHAT-E2E-017 without sharing its substantive target (CHAT-E2E-017's typed unsent input is observable user state; the login screen has no equivalent).
  This re-scope was explicitly rejected by the QA decision-maker. The honest disposition is to defer.

### Evidence / Validation

- **Repository/design analysis:** read-only. No files modified.
- **Physical-device probe:** PASS (1 passing (14.4s), exit 0). Full probe log retained locally at `evidence/login014-recon.txt` (15,020 bytes). **Not committed, not staged, not pushed.** This matches the existing `evidence/login*.txt` convention (login009, login011, login012 are all untracked local-only artifacts; `evidence/` is not in `.gitignore` but is consistently left untracked by every recent operator).
- **No source/test/design changes** — verifiable via `git status --short` (only `.puku-cli/` and `evidence/` appear, both untracked).
- **No device interaction after the probe.** The probe session ended cleanly (`deleteSession()` returned successfully, device returned to Launcher); no further adb calls were issued.
- **No OAuth flow entered** (the probe intentionally tapped neither button; the post-attempt sanity check used `isDisplayed()` only, never `click()`).
- **No data clear, no account manipulation, no reinstall, no APK rebuild.**

### Files changed

- `ai-log/daily-progress.md` — this entry.

No other files modified. The temporary probe spec `tests/specs/auth/__recon-rotation.spec.ts` was created and removed within the same turn (never staged, never committed; `git status --short` confirms it is not present). The evidence file `evidence/login014-recon.txt` remains untracked by design.

### Notes / limitation

- **Existing stub unchanged.** `tests/specs/auth/auth-secondary.spec.ts:96` continues to read `it.skip('LOGIN-E2E-014 @p3: device rotation on login screen — no crash, state preserved', async () => {});` — identical to lines 90 (LOGIN-E2E-013), 92 (LOGIN-E2E-003), and 94 (LOGIN-E2E-004), which are bare `it.skip(...)` stubs with no comment block. Adding a comment to one stub but not the others would be a stylistic inconsistency. All non-trivial rationale belongs here in `ai-log/daily-progress.md`, matching the established pattern (LOGIN-E2E-012's 12-step implementation rationale lives in this file, not in source comments).
- **No `LOGIN-TC-014.md` created.** `test-cases/README.md:55` says manual cases are "added as they're executed or as their automated counterparts are built." LOGIN-E2E-014 is neither — it is being declared as not currently defensibly automatable. The strongest existing precedents for a permanent-disposition TC file are CHAT-TC-018.md (R11, microphone input, "manual only, permanently, by design — not a coverage gap") and CHAT-TC-017.md ("designed, not yet automated" + "if the app is portrait-locked, that is a valid finding and this case becomes not-applicable rather than failing"). Neither trigger applies here: there is no R-link in the design row, and the scenario was never "executed" or "built." If the QA decision-maker later asks for the test design to be updated to formally close the row (e.g., fill the Notes column with "Not Applicable — see daily-progress 2026-08-31"), a `LOGIN-TC-014.md` disposition record could be created as part of that design-doc follow-up. Out of scope.
- **No test-design-doc update.** `_bmad-output/test-artifacts/test-design-epic-auth-login.md:164` is left with empty Notes and empty Risk Link, as it has been since the design was authored. Filling the Notes column is a design-doc call owned by the QA decision-maker / test-design author; the daily-progress entry fully captures today's deferral decision regardless.
- **No `ai-log/lessons-learned.md` entry.** The portrait-lock finding is scenario-specific (it's about one underspecified test-design row, not a cross-cutting framework/tooling lesson). `lessons-learned.md` is reserved for cross-cutting lessons (npm audit, setValue behavior on Flutter EditText, noReset reset, ANR capture gap), per the file's own established usage. Adding a "rotation is portrait-locked" lesson there would set a precedent for scenario-specific findings.
- **Carryover if needed:** the deferred disposition can be revisited if (a) PUKU adds per-screen orientation override capability, or (b) the test design adds an "in-progress state on the login screen" concept that gives "state preserved" a concrete target (e.g., an "Email address" field that supports typing before OAuth). Neither is a near-term change on the project's roadmap; both would re-open the question from the design side, not the implementation side.
---

## 2026-08-31 (QA2 — CI readiness audit, Stage 2 status)

### Session Summary

Completed a read-only CI architecture audit of all three CI workflows (`ci.yml`, `ci-authenticated.yml`, `ci-on-app-release.yml`) against ADR-007's CI-pre-authenticated-snapshot strategy, and recorded the resulting CI-readiness decision and the current Stage 2 status. Documentation-only entry — no workflow YAML modified, no test/spec/package.json/README/test-design/test-case file created or modified, no branch created, no commit, no push, no device interaction. Branch: `docs/ci-stage2-status` (base `master` at `b1fa604`).

### What was done

1. **Read each workflow file end-to-end on the current branch** — confirmed Stage 1 (`ci.yml`) is active and intentionally narrow (runs typecheck, lint, APK fetch via `APP_REPO_READ_TOKEN`, then a single scenario `LOGIN-E2E-002` on a fresh emulator, plus evidence upload); Stage 2 (`ci-authenticated.yml`) is `workflow_dispatch`-only and protected by a `ci-pre-authenticated-snapshot` GitHub Environment that does not currently exist, with both placeholder steps (`exit 1`) explicitly fail-closed; Stage 3 (`ci-on-app-release.yml`) is triggered by `repository_dispatch: puku-app-released` and mirrors Stage 1's body. No workflow was modified.
2. **Reconciled the audit against ADR-007** — confirmed the Stage 1 / Stage 2 / Stage 3 split matches `docs/adr/ADR-007-ci-pre-authenticated-snapshot-strategy.md`'s design (R16/R17/R18 snapshot-strategy mitigations require the Stage 2 snapshot infrastructure that is not yet operational).
3. **Reconciled against the current GitHub-side state** — confirmed that the QA2 GitHub account can push branches, open PRs, merge PRs, and configure repository settings where permissions permit. The current restriction is narrower than originally described: PRs authored by QA2 do not currently trigger the configured GitHub Actions CI checks because the account is under GitHub's abuse-detection review. Because of that, opening or merging feature PRs that require CI validation is being deliberately avoided while the review remains in effect. This is an external / GitHub-side condition, not a missing in-repo change.
4. **Reviewed each scenario flagged during the audit against current CI readiness** — six remain genuinely unimplemented (`LOGIN-E2E-001`, `LOGIN-E2E-003`, `LOGIN-E2E-004`, `LOGIN-E2E-013`, `CHAT-E2E-016`, `CHAT-E2E-018`), and a further six are already implemented on feature branches but not yet merged (`LOGIN-E2E-009`/`010`/`011`/`012`, `CHAT-E2E-008`/`019`). `LOGIN-E2E-014` is already separately recorded as deliberately deferred on this date.
5. **Recorded the CI-readiness conclusion** — see `### Findings / Decisions` below.
6. **No other file modified.** Verified via `git status --short` (clean) and `git diff -- ai-log/daily-progress.md` (single-file change only) after this entry was written.

### Findings / Decisions

- **Stage 1 (`ci.yml`) is intentionally narrow and currently operational by design.** It covers what its name says: typecheck, lint, APK delivery, and one emulator-safe smoke scenario. Its single-scenario selection (`LOGIN-E2E-002`) is not currently considered a CI defect — it is a deliberate, fork-safe public/PR smoke gate, not the project's full coverage.
- **Stage 2 (`ci-authenticated.yml`) is intentionally fail-closed but operationally incomplete.** The two `exit 1` placeholder steps are correct design language, not broken implementations: they make Stage 2 fail loudly until the pre-authenticated snapshot artifact and its accompanying GitHub Environment / credentials / storage exist. Until those exist, R16/R17/R18 from ADR-007 are partially mitigated only — `R16` (snapshot never enters the git working tree) is satisfied by structure alone; `R17` (no credential exposure to fork PRs) and `R18` (scheduled re-bake cadence) are infrastructurally incomplete.
- **Stage 2 is blocked by infrastructure prerequisites, not by missing test implementations.** The required pre-authenticated emulator snapshot artifact does not exist yet; the `ci-pre-authenticated-snapshot` GitHub Environment does not exist yet; snapshot storage/access credentials are not established yet; snapshot restoration capability has not yet been validated end-to-end. These are GitHub-side / runner-side / app-developer-side requirements, not gaps in this repository's tests.
- **The current QA2 GitHub abuse-detection review narrows what can be reliably validated end-to-end, but does not block GitHub-side operations themselves.** While the review remains in effect, PRs authored by QA2 do not trigger the configured GitHub Actions CI checks, so opening or merging a feature PR that depends on those checks would amount to merging without an automated gate. Configuring repository secrets, the `ci-pre-authenticated-snapshot` Environment, or branch protection is technically available, but is intentionally deferred until PR-authored CI runs fire reliably — otherwise those configurations would gate nothing. This affects all work that depends on automated CI validation, not just Stage 2.
- **None of the six remaining unimplemented scenarios should be implemented solely for CI-readiness.** The audit concluded that doing so would either produce no real CI gate value (`LOGIN-E2E-004` informational only; `LOGIN-E2E-001`/`003` one-time environment checks) or violate the project's standing constraints in a CI context (`LOGIN-E2E-013` requires ≥2 device sizes / OS configurations that current CI does not provide; `CHAT-E2E-016` is a weekly/manual informational latency test that triggers real AI inference — running it on PRs or releases would violate `R8`'s cost / rate-limit exposure and would not produce a gating signal; `CHAT-E2E-018` is permanently manual-only by design because the current Appium/UiAutomator2 toolchain lacks reliable fake-microphone audio injection).
- **`LOGIN-E2E-013` should remain deferred until legitimate multi-device CI infrastructure exists.** The scenario's intended value — verifying login-screen rendering across ≥2 device sizes/OS versions — cannot be achieved by a single Android emulator runner, which is what `ci.yml` provides today. A multi-runner matrix would be new CI infrastructure, not a missing test.
- **`CHAT-E2E-016` should remain weekly/manual** because of its informational nature and `R8` AI inference cost. It is a latency-tracking scenario, not a regression gate; scheduling it against PRs or releases would create cost and rate-limit exposure without producing a clear pass/fail signal. Leaving it as a manually executed latency baseline preserves its information value while keeping it out of the gating path.
- **`CHAT-E2E-018` remains manual-only** — same reasoning as in `_bmad-output/test-artifacts/test-design-epic-chat-core.md` and `CHAT-TC-018`'s permanent-manual status: the current toolchain cannot reliably inject fake microphone audio, so the voice-input path is structurally outside what automation can verify here.
- **The six already-implemented-but-unmerged branches (`LOGIN-E2E-009`/`010`/`011`/`012`, `CHAT-E2E-008`/`019`) are an integration / PR-validation problem, not an authorship gap.** Their implementations exist on dedicated branches. Push, PR, review, and merge remain available; the reason those branches are not yet landing on master is that opening them as PRs authored by QA2 would currently skip CI check execution, which is not a safe merge posture for feature changes. No further authorship is needed on any of them for CI-readiness purposes — the work that would unblock them is either the abuse-detection review resolving, or their authorship being migrated to an account whose PRs do trigger CI.
- **No in-repo change to CI workflows, tests, or scripts was justified by today's audit.** Stage 1's narrow scope is intentional; Stage 2's placeholders are fail-closed-by-design; Stage 3 mirrors Stage 1. The correct next step is the GitHub-side / infrastructure work described in ADR-007, not a workflow edit.

### Notes / limitation

- **Read-only by design.** This entry records a documented audit decision, not an implementation. Strict scope honored: no workflow YAML modified, no test/spec/package.json/README/test-design/test-case file modified or created, no branch created, no commit, no push, no Appium / emulator / device tests run, no AI/API calls made.
- **Branch name `docs/ci-stage2-status` is descriptive of the audit topic, not the workflow file itself.** The audit covered all three workflows (`ci.yml`, `ci-authenticated.yml`, `ci-on-app-release.yml`), not Stage 2 alone.
- **A future session, once the QA2 review is resolved and an Android runner with app-team support exists to bake the snapshot, may revisit Stage 2.** Until then this entry stands as the current recorded decision.

---

## 2026-09-03 (Day 15 — CLI-only automation, post-Day-14 reset)

### Session Summary

Confirmed the user-requested CLI-only automation scope (Windows ConPTY → real interactive puku-cli → `/remote-control` → real session → chat input), then implemented the smallest maintainable test that proves the workflow end-to-end. After the Day 14 attempt (`puku-cli -p` + a synchronous wrapper + a Day 14 spec called `CLI-E2E-001`) was deleted for automating the wrong surface, today's work rebuilds the same scenario ID against the correct one: the actual Ink/React REPL rendered through a Windows pseudo-terminal. No mobile pairing, no QR scanning, no Android toolchain — the assertion is "real interactive puku-cli can be driven through ConPTY to create a session and the `❯ ` text-input accepts input," which is exactly what the developer asked for.

### Chronological Log

1. **Repository reconnaissance** — read `package.json`, `wdio.conf.ts`, `config/wdio.{shared,android}.conf.ts`, `tsconfig.json`, `eslint.config.js`, the existing `tests/specs/`, `test-cases/` structure, several representative specs (CHAT-E2E-001, CHAT-E2E-002) and their manual counterparts, `src/utils/env.ts`, `src/utils/logger.ts`, `src/hooks/failure-capture.ts`, and the existing `node-pty`-bearing scripts in `F:/puku-experiment/` outside this repo. Identified the established convention: WebdriverIO 9 + Mocha ESM + TypeScript strict, `tests/specs/<lane>/*.spec.ts`, `src/utils/`, screen-object pattern over `src/screens/`, evidence files named `evidence/<scenario-id>-<…>.txt`, daily-progress entries appended to `ai-log/daily-progress.md`. Read `.env`, `.env.example`, `.gitignore` — confirmed `.env` is gitignored and contains the project's existing pattern for credential-bearing local config.

2. **First attempt — WebdriverIO + ConPTY, rejected** — initially added `node-pty` as a devDep, created `src/utils/puku-cli-pty.ts` (a typed ConPTY wrapper around the installed puku-cli), `tests/specs/cli/puku-cli-remote-control.spec.ts` (the spec), and `wdio.cli.conf.ts` (a parallel wdio config without Appium). Goal: keep the WebdriverIO runner for the CLI lane too. Two problems surfaced immediately. First, WebdriverIO insists on a `capabilities` entry with a real `browserName` and would not accept arbitrary values — required `browserName: 'chrome'`, which made wdio launch an actual Chrome session every time `npm run test:cli` ran. Second, wdio's pre-flight validated `capabilities` with no opt-out, so the only escape from a Chrome launch was to drop the launcher altogether. **Decision:** switch to Mocha, which is already in `node_modules` (transitive of `@wdio/mocha-framework`) and provides the same BDD primitives (`describe`/`it`/`before`/`afterEach`) without the Appium/browser dependency. Removed `wdio.cli.conf.ts` and updated the `test:cli` script to `mocha --config .mocharc.cli.json …`. `mocha` promoted to a direct devDep; `.mocharc.cli.json` added with `require: ['dotenv/config', 'tsx']` so `.env` loads and TS compiles inline. **Critically: no Chrome session is launched anymore.**

3. **First PATH-related failure** — `.env` had `PUKU_CLI_PATH="C:\\Users\\<username>\\AppData\\Roaming\\npm\\puku-cli.cmd"` (double-quoted, escaped backslashes). WDIO/the loader passed the value through a re-parser that turned `\U` into a Unicode character and turned `\n`/`\p` into literal newlines, so `process.env.PUKU_CLI_PATH` actually arrived as `C:\\Users\\<username>\\AppData\\Roaming\` + newline + `pm\\puku-cli.cmd`, and node-pty correctly refused to spawn a file with embedded newlines. **Fix:** use forward slashes, no quotes (`PUKU_CLI_PATH=C:/Users/<username>/AppData/Roaming/npm/puku-cli.cmd`). node-pty on Windows accepts forward-slash paths via ConPTY.

4. **Second failure — readiness-heuristic too narrow** — initial `homeReady` required `Opus|puku-ai` AND a literal `❯ /remote-control` text in the buffer. On first boot the composer renders empty (`❯ `), so the heuristic timed out. **Fix:** anchor on the model line + a `Chat: <n> / 40000` token-counter line; both are unconditionally rendered by puku-cli once the home screen is up.

5. **Third failure — `remoteReady` false-negative due to stale frame replay** — the status line first shows `• /rc connecting` (worker WS handshaking) and later flips to `• /rc` (no suffix). Ink replays frames in-place, so the `connecting` substring remains in the cumulative PTY buffer even after the connected re-render arrives — a buffer-wide regex `!/•\s*\/rc\s+connecting/` therefore returns `false` forever. **Fix:** inspect only the trailing 2 KB of the buffer (where Ink writes its most recent re-render) and grab the *last* `• /rc[^\n]*` token; connected iff that last token is NOT `connecting`. Confirmed by re-running twice — the test now reaches the connected state within ~5 s of `WaitForRemoteReady` resolving.

6. **Implemented the wrapper + spec** — `src/utils/puku-cli-pty.ts` is the only place that talks to `node-pty`. It exposes a typed class (`PukuCliPty`) with `sessionId` getter, `homeReady`/`remoteReady` getters, `getSanitizedBuffer()` for evidence, `waitForHomeReady(timeoutMs)` / `waitForRemoteReady(timeoutMs)` resolvers, `write()` to drive keystrokes, and `kill()` for teardown. **Credential safety:** the wrapper refuses to forward `PUKU_{ACCESS,REFRESH,WORKER,MOBILE,API}_TOKEN` env vars; it only sets `FORCE_COLOR=1` and `PUKU_CLI_DISABLE_HEAP_RELAUNCH=1`. `sanitizeForLog()` replaces any Bearer/Authorization header AND any `[A-Za-z0-9_=-]{24,}` token shape with `[redacted-token]` before any evidence is written. The spec (`tests/specs/cli/puku-cli-remote-control.spec.ts`) skips itself cleanly when `PUKU_CLI_PATH` is unset (mirroring the project's `DEVICE_UDID` skip pattern on the Android lane) and when `PUKU_CLI_E2E=skip`.

7. **Spec design** — `before()` skip; `afterEach()` always: snapshot `ptyHandle.getBuffer()` for evidence, then `ptyHandle.kill()` so no orphaned puku-cli holds an open relay session; finally `writeEvidence(...)` writes the sanitized buffer to `evidence/cli-e2e-001-<ts>.txt`. The case itself types `/remote-control\r`, awaits `remoteReady`, asserts the parsed sessionId matches the UUID regex, types the convention-compliant prompt `[PUKU-QA-TEST:CLI-E2E-001] ping\r` (per `docs/testing/test-message-convention.md`, R14), then polls the sanitized buffer for up to 60 s for that prompt string to be echoed. **Exactly one real model inference, no retries, R8 single-shot gate respected.** We deliberately do NOT assert on the AI reply text itself (R9, non-deterministic).

8. **Manual test-case authored** — `test-cases/cli/CLI-TC-001.md` follows the existing template (Preconditions, Steps, Expected Result, Status=Pass, Notes) and explicitly documents the scope boundary (no mobile pairing / no QR / no mobile WS / no popup sub-flow), the rationale for choosing Mocha over WebdriverIO, and what the test asserts vs. what it explicitly does NOT assert. `test-cases/README.md` updated to mention the new `cli/` folder and the same `E2E` ↔ `TC` traceability convention.

9. **Validated end-to-end** — three gates:
   - `npm run typecheck` → PASS (no output, exit 0). Persisted to `evidence/cli001-typecheck.txt`.
   - `npm run lint` → PASS (no output, exit 0). Persisted to `evidence/cli001-lint.txt`.
   - `npm run test:cli` → `1 passing (~21 s)`. The `❯ [PUKU-QA-TEST:CLI-E2E-001] ping` echo + `⠋ Undulating…` spinner in the PTY buffer confirm the composer accepted the submission. Persisted to `evidence/cli001-run.txt`.
   - Re-ran `npm run test:cli` twice (back-to-back) — both runs pass; no leftover puku-cli processes in `tasklist`.

10. **Credential-leak scan** — `grep -E "Bearer|Authorization|sk-|pk-oat|pk-lrot|pk-owt"` over the entire `evidence/` directory returned zero hits; the sessionId in the URL is sanitized to `[redacted-token]` in the written evidence file.

### Findings / Decisions

- **WebdriverIO is the wrong runner for the CLI lane.** It forces a Chrome session open. Mocha alone gives us the same BDD surface with no browser dependency. Separate lane, separate runner, dedicated `--config .mocharc.cli.json` keeps `test:cli` completely orthogonal to `test`.
- **The puku-cli launcher path lives in `.env`, not source.** `.env` is gitignored per the project's existing convention; `.env.example` documents the new `PUKU_CLI_PATH` variable. Hardcoding would have leaked a personal file layout into tracked code and broken CI. The spec skips itself cleanly when the var is unset — same `this.skip()` pattern the Android suite uses for `DEVICE_UDID`.
- **`• /rc connecting` is a deliberate transient state** during the worker WebSocket handshake. Buffer-wide regex was the wrong tool — Ink frame replay keeps the substring alive. Trailing-window + last-token anchoring is the correct fix and is now wrapped in `PukuCliPty.waitForRemoteReady()`.
- **No native compilation required for the CLI lane.** `node-pty@1.1.0` (Microsoft-maintained) ships Win32 ConPTY prebuilds at `node_modules/node-pty/prebuilds/win32-x64/{conpty,pty}.node`. The `node-pty` install script can be skipped (`npm install --ignore-scripts`) when prebuilds are sufficient — confirmed working.
- **The `/remote-control` popup is session-management, not the chat composer.** This was reconfirmed inline: the spec only types into the `❯ ` composer (rendered AT the home screen, not inside the popup), and the prompt echoes our submission back into the buffer within a few hundred ms. The popup's `Disconnect`/`Show QR`/`Continue` options remain for human-driven teardown if the operator ever wants to manually close a session — they are not exercised by automation.

### Files Changed

- `package.json` — added `node-pty@^1.1.0` and `mocha@^10.4.0` devDeps; added `test:cli` script.
- `tsconfig.json` — no change (CLI spec lives under existing `tests/**/*.ts`).
- `eslint.config.js` — `evidence/` added to the ignores list (was missing; now matches the project's pattern).
- `.env.example` — added documented `PUKU_CLI_PATH` section.
- `.env` (local-only, gitignored) — added `PUKU_CLI_PATH=C:/Users/<username>/AppData/Roaming/npm/puku-cli.cmd`.
- `.mocharc.cli.json` (new) — Mocha config for the CLI lane: `dotenv/config`, `tsx`, 180 s timeout.
- `src/utils/puku-cli-pty.ts` (new) — minimal Windows ConPTY wrapper around the real puku-cli; the only place that talks to `node-pty`. Includes the `resolvePukuCliPath` helper that points users at `.env` when unset.
- `src/utils/env.ts` — added a typed `env.pukuCliPath()` accessor (no hardcoded defaults — undef when unset).
- `tests/specs/cli/puku-cli-remote-control.spec.ts` (new) — `CLI-E2E-001 @p1`. Skip-clean when `PUKU_CLI_PATH` unset; one real inference per invocation; sanitized evidence on every exit path.
- `test-cases/cli/CLI-TC-001.md` (new) — manual counterpart. Status: Pass.
- `test-cases/README.md` — extended the "Current scope" section to mention the new `cli/` lane.
- `evidence/cli001-{run,typecheck,lint}.txt` — clean validation output snapshots (untracked, by repo convention).
- `evidence/cli-e2e-001-<ts>.txt` — sanitized PTY buffer captured per run (untracked, by repo convention).

### Validation Results (local, no emulator / no device)

| Gate | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` | exit 0, no output |
| Lint | `npm run lint` | exit 0, no output |
| CLI suite | `npm run test:cli` | `1 passing (~21 s)` |
| Repeatability | second `npm run test:cli` | `1 passing (~20 s)`, no flake |
| Process cleanup | `tasklist` post-run | no orphan `puku-cli.exe` |

### Notes / Limitations

- **Windows-only ConPTY validated.** The wrapper uses `useConpty: true` and the readiness regex matches `Opus|puku-ai` and the `Chat:` token counter — both Ink-rendered lines specific to puku-cli 1.8.x. macOS/Linux would need `useConpty: false` (auto-detect PTY vs ConPTY) and the readiness heuristic to be re-validated against a POSIX rendering of the same prompt. Out of scope today; flagged for a future contributor on a non-Windows host.
- **One real inference per invocation, R8-honored.** The submitted prompt is convention-compliant (`[PUKU-QA-TEST:CLI-E2E-001]` prefix). This is a real message to puku-cli's live AI backend; do NOT wire `npm run test:cli` into a burn-in / retry / high-frequency schedule.
- **No browser-based flakiness introduced.** Because we don't open Chrome, the test no longer depends on the WebDriver session lifecycle and is robust to Chrome version mismatches.
- **CI consideration.** A future CI lane would need to: (a) bake the npm prefix into the runner image, (b) export `PUKU_CLI_PATH` as a CI env var (NOT bake into `.env`), and (c) provide a pre-authenticated puku-cli session if the assertion should ever go beyond the echo check. None of this is required to run the suite locally today.
- **Empty token-shape sanitization is conservative.** The 24-char `[redacted-token]` filter replaces the URL-embedded sessionId UUID before writing evidence. The wrapper exposes `getBuffer()` (raw, for diagnostics) AND `getSanitizedBuffer()` (sanitized, for evidence); the spec deliberately uses the sanitized variant for the echo check too, so even the in-test assertion never depends on UUID-shaped strings.
