# puku-mobile-automation

Black-box mobile test automation for **PUKU Editor** (`sh.puku.app`), a Flutter-based AI code-editor Android app. No source access to the app under test — every locator, risk, and architectural decision below was derived from live device exploration, not documentation the app vendor provided. This is also a portfolio project: it exists to demonstrate a full, AI-assisted software test lifecycle (risk-based test design → ATDD → automation → documentation) against a real, uncooperative third-party target, not a toy app built to be easy to test.

## What this demonstrates

- **Risk-based test design**, not ad hoc test writing — two full epics (`auth-login`, `chat-core`) each went through a formal risk register (probability × impact scoring, mitigation plans, residual-risk analysis) before a single test was automated. See [Quick links](#quick-links).
- **AI-assisted STLC end-to-end** — test design, ATDD scaffolding, and traceability were run through structured BMAD workflows (Murat/TEA agent), not just "write some tests" prompting. The workflow outputs are committed artifacts, not throwaway chat.
- **Real device automation**, not emulator-only — physical-device-dependent scenarios (OAuth consent, logout, all chat-core scenarios) are gated behind a documented device-authentication precondition (ADR-006), not glossed over.
- **Documented architecture decisions with real corrections** — ADRs here aren't ceremony; one of them (`ADR-006`) was factually wrong on first write and corrected after live evidence contradicted it, and that correction is preserved in the doc rather than quietly edited away.
- **Cost-aware testing of a live AI feature** — sending a message in this app hits a real AI backend with real inference cost and ToS exposure. That's treated as a first-class risk (`R8`) with an enforced single-execution discipline, not an afterthought.
- **Honest coverage reporting** — the state below distinguishes "passing," "scaffolded but not yet automated," and "designed but not yet scaffolded" rather than rolling everything into one aggregate number.

## Tech stack

- **TypeScript** (strict, ESM) + **WebdriverIO 9** + **Appium 2** / **UiAutomator2** driver
- **Mocha** test framework, **JUnit** + **Allure** + **spec** reporters
- **ESLint** + **Prettier**
- **BMAD methodology** (Murat/TEA agent) for test design, ATDD, and traceability workflows
- Target: Android emulator (Pixel_7, API 34) or a physical device, `adb`-driven device targeting

## Project status

Two epics designed, both partially automated:

| | `auth-login` | `chat-core` |
|---|---|---|
| Risks registered | 7 (`R1`–`R7`) | 8 new (`R8`–`R15`) |
| Scenarios designed | 14 | 19 |
| Scenarios scaffolded in code | 14 (all of them) | 3 |
| — of those, passing | 3 | 3 |
| — of those, `it.skip()` stubs | 11 | 0 |

**6 tests pass today**, all verified against a physical device: `LOGIN-E2E-002`, `AUTH-E2E-015`, `AUTH-E2E-016`, `CHAT-E2E-001`, `CHAT-E2E-002`, `CHAT-E2E-003`. 13 more `auth-login` scenarios exist as `it.skip()` scaffolds awaiting implementation. `chat-core`'s remaining 16 scenarios (P1–P3) exist only in its test-design document — not yet scaffolded into spec files at all. 6 manual test cases exist, traced 1:1 to the 6 passing automated scenarios.

## Architecture overview

Screen Object Model over WebdriverIO, with composed flows layered on top of screens rather than re-implemented per test:

```
config/           WebdriverIO config (shared / Android-Appium / environment overrides, DEVICE_UDID-aware)
src/screens/      Screen Object Model — one class per app screen, content-desc-first locators
src/flows/        Composed user flows over screen objects (e.g. login + OAuth consent in one call)
src/hooks/        Test lifecycle hooks (automatic failure capture: screenshot, logcat, recording)
src/utils/        adb helpers, logger, env accessor, real-keyboard-input workaround
tests/specs/      Automated test specs, grouped by epic (auth/, chat/)
test-cases/       Manual test cases, traced 1:1 to automated scenario IDs
```

The *why* behind these choices — not just the *what* — lives in `docs/adr/`. See Quick links below rather than this section for the reasoning.

## Quick links

| Resource | Path |
|---|---|
| Test Design — `auth-login` (risk register, coverage plan) | [`_bmad-output/test-artifacts/test-design-epic-auth-login.md`](_bmad-output/test-artifacts/test-design-epic-auth-login.md) |
| Test Design — `chat-core` (risk register, coverage plan) | [`_bmad-output/test-artifacts/test-design-epic-chat-core.md`](_bmad-output/test-artifacts/test-design-epic-chat-core.md) |
| ATDD checklist — `chat-core` P0 | [`_bmad-output/test-artifacts/atdd-checklist-chat-core-p0.md`](_bmad-output/test-artifacts/atdd-checklist-chat-core-p0.md) |
| Architecture Decision Records | [`docs/adr/`](docs/adr/) |
| How to run every test | [`docs/running-tests.md`](docs/running-tests.md) |
| Test message convention (R14) | [`docs/testing/test-message-convention.md`](docs/testing/test-message-convention.md) |
| Manual test cases | [`test-cases/`](test-cases/) |
| APK reconnaissance notes | [`docs/00-apk-reconnaissance.md`](docs/00-apk-reconnaissance.md) |
| Session-by-session log | [`ai-log/daily-progress.md`](ai-log/daily-progress.md) |
| Lessons learned (bugs, gotchas, framework decisions) | [`ai-log/lessons-learned.md`](ai-log/lessons-learned.md) |

## Running tests

```bash
npm install
npm test
```

Physical-device-dependent scenarios need `DEVICE_UDID` set and will otherwise skip themselves. Full prerequisites, the `--mochaOpts.grep` pattern, priority-based runs, and the complete scenario table live in **[`docs/running-tests.md`](docs/running-tests.md)** — not duplicated here.

## Notable engineering decisions

- **WebdriverIO's `setValue()` silently fails on this app's custom-rendered input.** It updates Flutter's accessibility/semantics layer but never touches the real `TextEditingController` — a test can report success while the on-screen field stays empty. Root-caused live on device, fixed with a real-IME-injection utility rather than papering over it with a retry. → [`ai-log/lessons-learned.md`](ai-log/lessons-learned.md)
- **An ADR was wrong, and stayed wrong in the record until evidence corrected it.** `ADR-006` originally assumed Google's OAuth consent screen was a native Google UI; live exploration showed it's actually PUKU's own web page rendered in a Chrome Custom Tab. The correction — and the reasoning that produced the original mistake — is preserved in the doc rather than rewritten away. → [`docs/adr/ADR-006-oauth-consent-automation.md`](docs/adr/ADR-006-oauth-consent-automation.md)
- **Testing a live AI feature required a cost/ToS risk category that static-UI testing never needed.** Every automated message-send hits a real inference backend on a shared account. `R8` treats this as a hard gate — enforced by convention, not just documented — that message-send scenarios never run in a burn-in/retry loop or more than once per invocation. → [`_bmad-output/test-artifacts/test-design-epic-chat-core.md`](_bmad-output/test-artifacts/test-design-epic-chat-core.md)
- **Two real accessibility gaps found in production, not manufactured for the demo.** Both the hamburger menu trigger and the chat send button expose no `content-desc`, `resource-id`, or text to Android's accessibility tree — same defect class, found independently, in a shipped app. Logged as candidates to raise with PUKU's dev team, not just worked around silently. → [`ai-log/lessons-learned.md`](ai-log/lessons-learned.md)

## Authorization & ethics

This project tests a live, third-party production app in a black-box capacity for educational/portfolio purposes. **No formal authorization or affiliation with PUKU is claimed** — the ToS/legal standing of automating against a third-party app is tracked as an explicit open risk (`R7`) in both test-design documents, deferred to the author's own judgment before any wider publication, not resolved by this repo. In practice: a dedicated test account (`editorpuku@gmail.com`) is used, never a personal one (`R3`); no credentials are committed, ever; and all chat content sent during testing is synthetic, tagged, and non-sensitive by convention (`R14`, [`docs/testing/test-message-convention.md`](docs/testing/test-message-convention.md)) — never real user data.
