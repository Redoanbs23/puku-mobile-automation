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

## 2026-08-18 (QA2 — CHAT-E2E-015, Day 4)

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

### Day 4 Status / Blockers

- `CHAT-E2E-015` implementation remains blocked pending mentor/developer clarification regarding the **Haptic feedback switch**.
- No `CHAT-E2E-015` implementation files were created.
- No implementation commit was made.
- No CI workflow changes were made.
---

## 2026-08-19 (QA2 — CHAT-E2E-015, Day 5)

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

### Day 5 Status / Reconcile note (migration)

- `contribution.md` recorded "No commit or PR created yet" on Day 5. **Since then the work has been committed and pushed on this branch (`feat/chat-e2e-015`) with an open PR.** The implementation (`tests/specs/chat/locator-health.spec.ts`, `src/utils/locator-health.ts`) and the manual test case update (`test-cases/chat/CHAT-TC-015.md`) are all present on the branch. No CI workflow changes were made.
