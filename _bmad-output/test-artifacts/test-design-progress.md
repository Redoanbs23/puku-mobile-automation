---
workflowStatus: 'completed'
totalSteps: 5
stepsCompleted: ['step-01-detect-mode', 'step-02-load-context', 'step-03-risk-and-testability', 'step-04-coverage-plan', 'step-05-generate-output']
lastStep: 'step-05-generate-output'
nextStep: ''
lastSaved: '2026-08-06'
inputDocuments:
  - '_bmad/tea/config.yaml'
  - '_bmad-output/test-artifacts/test-design-epic-auth-login.md'
  - 'docs/adr/ADR-004-tf-workflow-gap.md'
  - 'docs/adr/ADR-006-oauth-consent-automation.md'
  - 'src/screens/home.screen.ts'
  - 'src/screens/settings.screen.ts'
  - '.claude/skills/bmad-testarch-test-design/resources/knowledge/risk-governance.md'
  - '.claude/skills/bmad-testarch-test-design/resources/knowledge/probability-impact.md'
  - '.claude/skills/bmad-testarch-test-design/resources/knowledge/test-levels-framework.md'
  - '.claude/skills/bmad-testarch-test-design/resources/knowledge/test-priorities-matrix.md'
  - '.claude/skills/bmad-testarch-test-design/resources/knowledge/nfr-criteria.md'
---

# Test Design — Puku Editor (Android, Black-Box) — Epic: chat-core

## Step 1: Mode & Prerequisites

**Mode selected:** Epic-Level Mode (bounded feature scope, not full-system).

**Rationale:** No PRD/ADR (System-Level prerequisite), and no formal
epic/story doc exists in this repo — same situation as the completed
`auth-login` epic. In place of a written epic, the user supplied a
conversational requirements substitute bounded to a single feature area
(core AI chat functionality: home screen, drawer navigation, model
selector, Settings), which stands in for "epic/story requirements with
acceptance criteria." File-based detection also confirms Epic-Level:
no `sprint-status.yaml` exists in this repo.

**Prior art carried forward from `auth-login`:**

- Framework/tooling: WebdriverIO + Appium/UiAutomator2, TypeScript, `content-desc`-based locators on native Flutter screens (per ADR established during framework scaffold).
- A reliable, automated path to a logged-in state now exists: `AUTH-E2E-015` (`tests/specs/auth/oauth-consent.spec.ts`), requiring a physical device with a pre-authenticated Google account (`RF8T802226Y` / `editorpuku@gmail.com`, per ADR-006, docs/adr/ADR-006-oauth-consent-automation.md). This unblocks black-box exploration and automation past login for the first time.
- A logged-in `AUTH-E2E-016` logout path also exists (`tests/specs/auth/logout.spec.ts`).
- Known constraints carrying forward unchanged: black-box only (no source/API access), Android only, third-party production app (portfolio/QA-practice context).
- Known locator-discipline nuance from `auth-login`: most native Flutter screens expose clean `content-desc`; some rows render **compound** content-desc joined by a literal newline (e.g. `"Profile\nProfile"`, found in Settings); the home screen's hamburger-menu trigger icon has **no** content-desc/resource-id/text at all (a real accessibility gap, logged in `ai-log/lessons-learned.md`).

**Prerequisite check:** Epic/story requirements — satisfied via the user's conversational scope description (this message) in place of a written epic, consistent with how `auth-login` was handled. Architecture context — same black-box constraint as before (no source/API access); the only "architecture" available is what's been observed live via Appium Inspector, listed below.

Proceeding to Step 2: Load Context.

## Step 2: Load Context & Knowledge Base

**Config:** `tea_use_playwright_utils: true`, `tea_use_pactjs_utils: false`, `tea_pact_mcp: none`, `tea_browser_automation: auto`, `test_stack_type: auto`.

**Detected stack:** Mobile (WebdriverIO + Appium/UiAutomator2 + TypeScript) — no frontend or backend auto-detection indicators apply; matches ADR-004's conclusion. Deliberately skipped Playwright Utils/CLI knowledge fragments and the Playwright-CLI browser-exploration sub-step despite `tea_use_playwright_utils: true` and `tea_browser_automation: auto`, since this is a native Android app, not a website — same substitution the `auth-login` epic made (user's live Appium Inspector exploration stands in for CLI-driven exploration).

**Project artifacts loaded:** `test-design-epic-auth-login.md` (R-numbering continuity, shared risks, locator-discipline precedent), `ADR-004-tf-workflow-gap.md`, `ADR-006-oauth-consent-automation.md` (gates what's automatable — the only known path to a logged-in state), `home.screen.ts` and `settings.screen.ts` (existing partial scaffolding touching this epic's surface).

**Existing coverage scan:** `tests/specs/` contains only `auth/` — zero coverage for chat, drawer nav beyond Settings/logout, model selector, Projects, Artifacts, or Code.

**Knowledge fragments loaded:** `risk-governance.md`, `probability-impact.md`, `test-levels-framework.md`, `test-priorities-matrix.md` (all core, Epic-Level required), plus `nfr-criteria.md` (triggered — scope touches security/PII in chat content, reliability of model switching and persistence, and potential AI-response-latency performance concerns).

Proceeding to Step 3: Risk & Testability Assessment.

## Step 3: Risk Assessment (Epic-Level — testability review skipped, system-level only)

### Inherited Risks (carried forward, not re-scored)

| Risk ID | Applies to chat-core? | Note |
|---|---|---|
| R1 (score 9) | Not applicable | Chat-core reached via Google OAuth path (AUTH-E2E-015), not email — orthogonal |
| R2 (score 6) | Yes — gating | Now a hard entry criterion for the whole epic, not just auth |
| R3 (score 6) | Yes | Extended by R14 to cover test *content*, not just credentials |
| R4 (score 4) | Yes | Extends to all new chat-core screens once explored |
| R5 (score 4) | Yes, unchanged | |
| R6 (score 6) | Yes, unchanged | Framework mitigation already in place |
| R7 (score 4) | Yes — amplified | See R8 |

### New Risks — chat-core (R8–R14)

| Risk ID | Category | Description | P | I | Score | Mitigation | Owner |
|---|---|---|---|---|---|---|---|
| R8 | OPS/BUS | Automated message-sending hits a live AI backend — real cost, rate limits, ToS exposure; worst case blocks both epics (shared account) | 2 | 3 | 6 | Keep message-send scenarios few/deliberate; never burn-in loop them; amplifies R7 | Redoan |
| R9 | TECH | AI response content is non-deterministic — exact-text assertions are inherently flaky | 3 | 2 | 6 | Assert structural/behavioral signals only, never exact AI text — same philosophy as R2 | Redoan |
| R10 | DATA/OPS | Test messages persist indefinitely in the real shared account's history — could pollute future Chats-history assertions | 3 | 2 | 6 | Consistent test-message naming convention; investigate deletion before scaling coverage | Redoan |
| R11 | TECH | Voice/audio input not practically automatable (no mic-injection path via Appium) | 3 | 2 | 6 | Permanent manual/exploratory-only lane, same treatment as R2 | Redoan |
| R12 | TECH | Model availability may be gated by account plan/tier | 2 | 2 | 4 | Record test account's plan at authoring time; treat plan-related failures as environment issues | Redoan |
| R13 | TECH | Projects/Artifacts/Code sections completely unexplored — testability unknown | 2 | 2 | 4 | Dedicated Appium Inspector exploration pass before automating each section | Redoan |
| R14 | SEC | Test chat input/AI responses could leak into failure-capture artifacts committed to a public repo | 2 | 2 | 4 | Synthetic/non-sensitive test prompts only — same spirit as R3 | Redoan |

**High-priority (≥6) this epic:** R8, R9, R10, R11 (new) + inherited R2, R3, R6.

### NFR Planning

| NFR Category | Threshold | Risk Link | Planned Validation |
|---|---|---|---|
| Security | UNKNOWN — synthetic test content only | R14, R3 | Manual convention + spot-check artifacts before commit |
| Reliability | UNKNOWN — no crash on model-switch or network loss mid-send | R9 | E2E: model switch survives; graceful failure on network loss mid-send |
| Performance | UNKNOWN — no SLA | — | Log AI response latency informationally, no gate |
| Maintainability | N/A | R4 | Locator health-check extended to new screens once explored |

**Summary:** Four new high risks (R8–R11) all trace to one root cause — this is the first epic testing a *live AI feature*, not static UI: real inference cost/ToS exposure, non-deterministic output, persistent side effects on a shared account, and a voice-input automation-fundamentals gap. None block starting the epic; all should shape the coverage plan toward structural assertions over content assertions, sparse message-send scenarios, and voice treated as permanently manual.

Proceeding to Step 4: Coverage Plan.

## Step 4: Coverage Plan & Execution Strategy

**Scenario prefix:** `CHAT-E2E-` (fresh numbering for this epic). 18 scenarios total: P0=3 (~5–10h), P1=7 (~10–18h), P2=5 (~6–12h), P3=3 (~2–5h). Total ~23–45 hours (~3–6 days), test-authoring only.

Full coverage matrix, Not-in-Scope table, NFR evidence plan, execution strategy, resource estimates, and quality gates presented in full to the user in-conversation (this step's chat output) — condensed here for the progress record:

- **P0:** CHAT-E2E-001 (home renders post-login), CHAT-E2E-002 (send message, structural assertion only, R8/R9), CHAT-E2E-003 (hamburger drawer shows all entries, R4)
- **P1:** CHAT-E2E-004/005 (model selector + switch, R12), CHAT-E2E-006 (new chat), CHAT-E2E-007 (empty-send blocked), CHAT-E2E-008 (network-loss-mid-send, R9/NFR-Reliability, cost-triggering R8), CHAT-E2E-009 (chat history list smoke, R10), CHAT-E2E-010 (Settings toggles)
- **P2:** CHAT-E2E-011/012/013 (Projects/Artifacts/Code smoke only, R13), CHAT-E2E-014 (long input), CHAT-E2E-015 (locator health-check, R4)
- **P3:** CHAT-E2E-016 (latency, informational, cost-triggering R8), CHAT-E2E-017 (rotation), CHAT-E2E-018 (Voice — manual only, R11)

**Not in Scope:** AI response quality/correctness (R9), voice/audio automation (R11), deep Projects/Artifacts/Code functional testing (R13), chat-history persistence correctness (R10), performance/load beyond informational latency, API-level testing.

**Execution Strategy — key deviation from auth-login:** CHAT-E2E-008 and CHAT-E2E-016 deliberately excluded from PR (moved to Nightly/Weekly) specifically because of R8 (real inference cost per run) — auth-login had no equivalent per-run-cost risk. CHAT-E2E-002 stays in PR as a single, never-looped minimal send. Non-negotiable gate: no message-send-triggering scenario may ever run in a burn-in/retry-loop.

**NFR evidence plan:** Security (R14) defaults to CONCERNS until a written test-content convention doc exists (no automated PII scan possible for free-text). Reliability, Performance, Maintainability evidence sources mirror auth-login's pattern (CHAT-E2E-008/016/015 respectively).

Proceeding to Step 5: Generate Output.

## Step 5: Generate Output

Mode: Epic-Level (single document, single-worker, sequential). Output written to `_bmad-output/test-artifacts/test-design-epic-chat-core.md`, following `test-design-template.md`'s structure with the same epic-appropriate adaptations `test-design-epic-auth-login.md` established (Execution Strategy replaces the template's Smoke/P0/P1/P2P3 tiered Execution Order per the anti-bloat checklist rule; Project Team section omitted, solo project).

Validated against `checklist.md`. All applicable Epic-Level items pass. Two items called out explicitly rather than silently passed:
- Added explicit **Residual Risk** lines to all four R8–R11 mitigation plans (checklist Step 2 item; `auth-login` didn't include this either, but it was cheap and worth adding).
- Nightly/Weekly placement of CHAT-E2E-008/016 is justified by cost/ToS risk (R8), not by runtime length — a deliberate, explained deviation from the checklist's literal "Nightly/Weekly: only performance/chaos/long-running/manual" guidance, not an oversight.

`workflowStatus` set to `completed`.
