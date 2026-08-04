---
workflowStatus: 'completed'
totalSteps: 5
stepsCompleted: ['step-01-detect-mode', 'step-02-load-context', 'step-03-risk-and-testability', 'step-04-coverage-plan', 'step-05-generate-output']
lastStep: 'step-05-generate-output'
nextStep: ''
lastSaved: '2026-08-04'
inputDocuments:
  - '_bmad/tea/config.yaml'
  - '.claude/skills/bmad-testarch-test-design/resources/knowledge/risk-governance.md'
  - '.claude/skills/bmad-testarch-test-design/resources/knowledge/probability-impact.md'
  - '.claude/skills/bmad-testarch-test-design/resources/knowledge/test-levels-framework.md'
  - '.claude/skills/bmad-testarch-test-design/resources/knowledge/test-priorities-matrix.md'
  - '.claude/skills/bmad-testarch-test-design/resources/knowledge/nfr-criteria.md'
---

# Test Design — Puku Editor (Android, Black-Box)

## Step 1: Mode & Prerequisites

**Mode selected:** Epic-Level Mode (bounded feature scope, not full-system).

**Rationale:** No PRD/ADR (System-Level prerequisite) and no formal epic/story
doc exists in this repo — this is a third-party production app with no
source access. In place of a written epic, the user supplied a conversational
requirements substitute bounded to a single feature area (authentication /
login screen), which stands in for "epic/story requirements with acceptance
criteria." Full-system test design is out of reach until further screens are
explorable, so scope is intentionally narrowed to what is testable today.

## Captured Requirements (conversational substitute for epic/story input)

**App under test:** PUKU ("Puku Editor") — AI code editor mobile app
- Package: `sh.puku.app`
- Platform: Android only (no iOS access)
- Framework: Flutter (confirmed via semantics-tree diagnostic)

**Testing constraints:**
- Black-box only — no source code, no PRD, no architecture docs
- Third-party production APK (obtained via AppTester)
- Cannot modify the app or inject test hooks

**Observed via manual exploration + Appium Inspector:**
- Login screen exposes two auth entry points:
  - "Continue with Google" — OAuth, redirects to external Chrome browser (confirmed working via manual testing)
  - "Enter your email" — currently **BROKEN**: shows "Email sign in flow is not connected" toast; reported to dev team; **blocks all further app exploration past login**
- Semantics-tree coverage on the login screen is HIGH — all interactive elements (buttons, links, text) expose usable `content-desc` values → Appium/UiAutomator2 locator strategy is viable as primary approach
- No screens beyond login have been explored yet (blocked by the email-auth bug)
- Google OAuth is not practically automatable in this context: requires a live Google account, is environment-dependent, and is high-fragility

**Target framework (for later stages, not this workflow):** TypeScript + WebdriverIO + Appium/UiAutomator2 for UI; Playwright scoped to API-layer test data only. Secondary goal: public GitHub portfolio project demonstrating AI-assisted QA across the full STLC.

**Requested scope for this test design:**
1. Full-detail coverage of what's testable today: login screen, auth entry points, app launch/install behavior
2. Flag Google OAuth as a known high-risk / likely-manual-only test area
3. Record the email-auth blocker as a dependency gating all further screen coverage — revisit once resolved

## Step 2: Load Context & Knowledge Base

**Config loaded** (`_bmad/tea/config.yaml`):
- `tea_use_playwright_utils`: true
- `tea_use_pactjs_utils`: false
- `tea_pact_mcp`: none
- `tea_browser_automation`: auto
- `test_stack_type`: auto
- `test_artifacts`: `{project-root}/_bmad-output/test-artifacts`

**Stack detection:** Scanned repo root for standard frontend/backend indicators (`playwright.config.*`, `cypress.config.*`, `package.json`, `pyproject.toml`, `pom.xml`/`build.gradle`, `go.mod`, `*.csproj`, `Gemfile`, `Cargo.toml`, `wdio.conf.*`) — none found. This is a greenfield repo (only `apk/puku.apk` present, no test framework scaffolded yet). Target stack per user's stated architecture is **mobile** (TypeScript + WebdriverIO + Appium/UiAutomator2 for UI), which sits outside the frontend/backend/fullstack taxonomy this workflow auto-detects for. Recorded `detected_stack: mobile` for this run.

**Playwright Utils profile:** No `page.goto`/`page.locator` usage exists (no test files at all), and per the user's own architecture, Playwright is scoped to **API-layer test data only** — UI automation runs through Appium, not Playwright. → **API-only profile** selected: `overview`, `api-request`, `auth-session`, `recurse` (not yet loaded; will pull on-demand if/when API-layer test-data design is needed — no backend/API surface has been described yet for this login-screen scope).

**Project artifacts (Epic-Level Mode):** No epic/story doc, no PRD, no architecture/tech-spec doc, and no prior system-level test-design output exist in this repo. Substituted with the conversational requirements captured in Step 1 above, which stands in as the testable-requirements input for this run.

**Existing test coverage scan:** No `tests/`, `spec`, `e2e`, or `api` directories found anywhere in the repo — zero existing coverage, zero fixture/test patterns to reconcile with. This is a from-scratch test design.

**Browser exploration:** Skipped. `tea_browser_automation` is `auto`, but the app under test is a native/Flutter Android app, not a website — Playwright CLI's `open`/`snapshot`/`screenshot` flow targets web pages and doesn't apply to the login screen itself. The one web surface in scope (Google OAuth's external Chrome redirect) is being treated as a high-risk/manual-only area per the user's request, not an automation exploration target. Relying instead on the user's own Appium Inspector findings already captured in Step 1 (high semantics-tree/content-desc coverage on the login screen).

**Knowledge fragments loaded** (Epic-Level required set, tier: core):
- `risk-governance.md` — risk scoring matrix, gate decision engine, traceability
- `probability-impact.md` — probability × impact scoring (1-9), DOCUMENT/MONITOR/MITIGATE/BLOCK thresholds
- `test-levels-framework.md` — unit/integration/E2E selection rules
- `test-priorities-matrix.md` — P0-P3 criteria and coverage targets

**Additional fragment loaded (extended tier, contextually relevant):**
- `nfr-criteria.md` — loaded because the in-scope area is authentication (security-relevant NFR category)

**Fragments intentionally not loaded:** `playwright-cli.md` (no browser exploration performed, see above); Pact.js / Pact MCP fragments (`tea_use_pactjs_utils: false`, `tea_pact_mcp: none`, and no microservices/contract-testing surface exists yet); `adr-quality-readiness-checklist.md` (System-Level-only fragment, not applicable to Epic-Level mode).

**Confirmed with user:** proceeding — see below.

## Step 3: Testability & Risk Assessment

**Testability review:** Not applicable — this is Epic-Level Mode, not System-Level, so the formal architecture testability review (controllability/observability/reliability of the app's internals) is skipped. Informally: this is black-box testing against a third-party binary with **no controllability** (can't seed state, can't mock, can't inject faults) and **no server-side observability** (no logs/traces/metrics). The only observability available is client-side: semantics tree, screenshots, video, and Android's own `adb logcat` (OS-level, doesn't require app cooperation). This constraint is carried into the risk register below (R6) rather than a full ASR list, since there's no architecture doc to derive ASRs from.

### Risk Register

| ID | Category | Risk | P | I | Score | Level | Mitigation | Owner |
|----|----------|------|---|---|-------|-------|------------|-------|
| R1 | BUS | Email sign-in flow is broken ("Email sign in flow is not connected"), blocking all app exploration past login | 3 | 3 | **9** | 🔴 CRITICAL / BLOCK | Track as a confirmed defect with the dev team; do not attempt to build coverage for post-login screens until resolved; re-run exploration immediately once fixed | Redoan (liaises with dev team on fix ETA) |
| R2 | TECH | Google OAuth login is not practically automatable — external Chrome redirect, requires a live Google account, environment-dependent, high fragility (Google actively fights automated sign-in) | 3 | 2 | **6** | 🟠 HIGH / MITIGATE | Treat as a manual/exploratory-only test lane; do not attempt full E2E automation through Google's consent screens; document as a known limitation in the framework README | Redoan |
| R3 | SEC | Test credentials (Google test account, future email-auth test accounts) risk exposure since this becomes a **public GitHub portfolio repo** | 2 | 3 | **6** | 🟠 HIGH / MITIGATE | Dedicated disposable test accounts only; secrets via env vars / CI secrets store, never committed; `.gitignore` for credential/session files; scrub screenshots/videos for PII before committing fixtures | Redoan |
| R4 | TECH | Flutter's semantics tree (content-desc exposure) can regress silently on app updates — it's a framework-level convention, not guaranteed, and invisible to a black-box tester until it breaks | 2 | 2 | 4 | 🟡 MEDIUM / MONITOR | Add a lightweight locator health-check smoke test that fails fast if key `content-desc` values disappear after a PUKU app update | Framework build-out phase |
| R5 | OPS/TECH | Third-party APK sourced via AppTester may drift from the official Play Store release (version, signing, bundled services) | 2 | 2 | 4 | 🟡 MEDIUM / MONITOR | Record the exact APK version/hash under test in test docs; periodically re-verify against the live Play Store release | Redoan |
| R6 | TECH | No source access, no crash logs, no server-side observability — all failure triage relies on black-box signals only | 3 | 2 | **6** | 🟠 HIGH / MITIGATE | Capture `adb logcat`, screenshots, and video on every test failure at the framework level (OS-level capture, needs no app cooperation) | Framework build-out phase |
| R7 | OPS/BUS | Automating against, and publicly documenting known bugs in, a third-party production app (as a public portfolio project) may raise ToS/legal considerations | 2 | 2 | 4 | 🟡 MEDIUM / MONITOR | **Flagged for your judgment, not resolved here** — recommend reviewing PUKU's ToS/acceptable-use terms before publishing bug findings or automation against their app publicly | Redoan |

**High risks requiring mitigation (score ≥6):** R1 (blocker — dev-team dependency), R2 (OAuth automation boundary), R3 (credential hygiene for a public repo), R6 (black-box observability gap).

## Step 4: Coverage Plan & Execution Strategy

**Test level note:** Every scenario below is **E2E (Mobile UI, Appium/UiAutomator2)**. There is no accessible unit or integration level in this project — no source access means no code-level seams to test below the UI, and no backend API surface has been identified yet. So the usual "avoid duplicate coverage across levels" concern doesn't apply here; there's only one level available today. API-level scenarios will re-enter the picture only if/when backend endpoints are discovered (e.g. via traffic capture during later exploration).

### Coverage Matrix

| ID | Scenario | Priority | Linked Risk/NFR | Notes |
|----|----------|----------|------------------|-------|
| LOGIN-E2E-001 | App installs from sideloaded APK without error | P2 | R5 | One-time environment setup check; record exact APK version/hash tested |
| LOGIN-E2E-002 | App launches and login screen renders without crash | **P0** | — | Core functionality; blocks all further testing if it fails |
| LOGIN-E2E-003 | Sideload / Play Protect install warning behavior documented | P3 | — | Informational, environment-dependent; likely manual one-time check rather than automated |
| LOGIN-E2E-004 | Cold start time observed | P3 | NFR-Performance | Informational metric only, no gate |
| LOGIN-E2E-005 | Both auth entry points render on login screen ("Continue with Google", "Enter your email") | **P0** | — | Core functionality |
| LOGIN-E2E-006 | All login-screen interactive elements expose usable content-desc locators | P1 | R4 | Locator health-check — acts as an early warning for R4 (silent semantics-tree regressions) |
| LOGIN-E2E-007 | Tap "Continue with Google" → correctly redirects to external Chrome OAuth consent screen | P1 | R2 | Verify redirect only — do **not** attempt to complete OAuth login (manual-only boundary per R2) |
| LOGIN-E2E-008 | Tap "Enter your email" → shows "Email sign in flow is not connected" toast, confirming current broken state | **P0** | R1 | This test is the trigger: once it starts failing (i.e. the flow starts working), that's the signal to re-run exploration and expand scope past login |
| LOGIN-E2E-009 | Broken email-auth error toast contains no sensitive data (no tokens/PII/stack traces) | P1 | NFR-Security | |
| LOGIN-E2E-010 | App remains on login screen (no crash) after the broken email-auth toast | P1 | NFR-Reliability | |
| LOGIN-E2E-011 | Network dropped mid-Google-OAuth-redirect → graceful error, not a crash | P1 | R2, NFR-Reliability | |
| LOGIN-E2E-012 | Back navigation from the Chrome OAuth redirect returns the app to a sane login-screen state | P2 | — | |
| LOGIN-E2E-013 | Login screen renders correctly across ≥2 device sizes/OS versions | P2 | — | Basic compatibility smoke |
| LOGIN-E2E-014 | Device rotation on login screen — no crash, state preserved | P3 | — | |

**Distribution:** P0 = 3, P1 = 5, P2 = 3, P3 = 3 (14 total).

## Step 5: Generate Output

Epic-Level Mode → single output document generated (System-Level's two-document architecture/QA split does not apply here).

**Output file:** `_bmad-output/test-artifacts/test-design-epic-auth-login.md`

Populated using `test-design-template.md`: executive summary, not-in-scope table, risk assessment (high/medium/low), NFR planning, entry/exit criteria, coverage plan by priority, execution strategy (PR/nightly/weekly — kept simple per checklist, not the template's more elaborate smoke/P0/P1/P2 tiering), resource estimates as ranges, quality gate criteria, mitigation plans for all four high-priority risks, assumptions/dependencies, and appendix references. No BMAD handoff document generated (System-Level-only artifact).

Validated against `checklist.md`: all risks carry unique IDs with P×I scores and mitigations; coverage matrix has no duplicate cross-level coverage (single E2E-mobile level only, by necessity); priority sections carry only criteria, not execution timing (moved to Execution Strategy per the checklist's explicit anti-tiering guidance); resource estimates are ranges, not false-precision numbers; NFR final PASS/CONCERNS/FAIL explicitly deferred to a future `nfr-assess` run.

**Workflow complete.**

### NFR Coverage & Evidence Plan

| Category | Validation scenario(s) | Evidence artifact for later `nfr-assess` |
|----------|------------------------|-------------------------------------------|
| Security | LOGIN-E2E-009 | Test assertion result + logcat scrub confirming no leaked tokens/PII |
| Reliability | LOGIN-E2E-010, LOGIN-E2E-011 | Test pass/fail + captured screenshot/video on any failure |
| Maintainability | LOGIN-E2E-006 | CI test-result trend over time (locator health regressing after an app update is the signal) |
| Performance | LOGIN-E2E-004 | Logged cold-start metric, informational only — no threshold exists to gate against |
| Compliance | — | Not automatable; deferred to your own review of PUKU's ToS (R7) |

### Execution Strategy

- **PR gate (<15 min target):** All P0 + P1 (8 scenarios: 002, 005, 006, 007, 008, 009, 010, 011) — login flows are fast; this fits comfortably.
- **Nightly:** P2 (001, 012, 013) — the device-size compatibility matrix (013) adds enough setup overhead to not belong in the PR gate.
- **Weekly / manual:** P3 (003, 004, 014) — low recurring value; 003 (Play Protect warning) is realistically a one-time manual check rather than something worth automating repeatedly.

**Framework-level requirements (not test scenarios, carried from Step 3's risk register, not the coverage matrix):**
- Every test run captures `adb logcat` + screenshot + video on failure (mitigates R6 — the black-box observability gap)
- Secrets management (dedicated disposable test accounts, env-var/CI-secret storage, `.gitignore`'d credential files) is in place **before** any credentials touch this repo (mitigates R3)

### Resource Estimates

These are **test-authoring estimates only** — they assume the WebdriverIO + Appium framework scaffold already exists. It doesn't yet (that's the TF — Test Framework — workflow, still to come); add scaffold + CI setup time separately when you run TF/CI.

- P0 (3 scenarios): ~4–8 hours
- P1 (5 scenarios): ~6–10 hours
- P2 (3 scenarios): ~4–8 hours (device-size matrix adds setup overhead)
- P3 (3 scenarios): ~2–4 hours
- **Total: ~16–30 hours** of test-authoring, excluding framework scaffold and CI pipeline setup

### Quality Gates

- P0 pass rate = 100% before any further screen coverage begins
- P1 pass rate ≥ 95%
- **R1 gate:** LOGIN-E2E-008 must flip from "confirms broken" to "confirms working" before scope expands past login — this is the literal unlock condition
- **R2 accepted limitation:** full Google OAuth completion is permanently out of automated-gate scope, documented as a known limitation, not tracked as a coverage gap
- LOGIN-E2E-006 (locator health-check) must stay green — a red result is the earliest signal that R4 has materialized
- Coverage target: 100% of what's currently explorable (login screen + entry points) — a blanket "≥80%" target isn't meaningful yet since most of the app is inaccessible until R1 resolves
- NFR evidence identified for Security and Reliability categories; Performance and Compliance evidence explicitly deferred/out of automated scope

### NFR Planning (planning only — not a PASS/FAIL assessment; run `nfr-assess` later once evidence exists)

| Category | In scope for this design? | Threshold | Status | Planned evidence source |
|----------|---------------------------|-----------|--------|--------------------------|
| Security | Yes — auth entry points | Not defined (no PRD) | **UNKNOWN** → folded into R3; separate clarification item: does the broken email-auth error path leak any sensitive data in its toast/logs? | Automated assertion: error toast text is generic, no PII/tokens in logcat during the failure |
| Reliability | Yes — OAuth redirect handling, app launch | Not defined | **UNKNOWN** → clarification item: expected app behavior if network drops mid-Google-OAuth-redirect | Automated test: simulate network loss during the Chrome redirect hop, assert graceful error state (not a crash) |
| Maintainability | Yes — locator strategy stability | N/A (framework choice, not a stated requirement) | Addressed via R4 | Locator health-check smoke test |
| Performance | Low priority at this scope | Not defined | **UNKNOWN**, deferred | Optional: log cold-start time as an informational metric only, no gate |
| Compliance | Flagged, not testable | Not defined | **UNKNOWN** → clarification item, see R7 | Not automatable — requires your own review of PUKU's terms |

### Summary

Two risks dominate: **R1 (email-auth blocker, score 9)** — this is the hard gate on everything beyond login, owned by the dev team's fix timeline, not something testing can work around. And **R2 (Google OAuth automation boundary, score 6)** — by design this becomes a permanent manual-testing lane rather than a gap to close. The other high risks (R3 credential hygiene, R6 observability gap) are addressed by decisions baked into the framework itself (secrets handling, logcat/video capture on failure) rather than by test cases — they'll show up as framework requirements in the coverage plan, not as test scenarios.
