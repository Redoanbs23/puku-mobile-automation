---
workflowStatus: 'completed'
totalSteps: 5
stepsCompleted: ['step-01-detect-mode', 'step-02-load-context', 'step-03-risk-and-testability', 'step-04-coverage-plan', 'step-05-generate-output']
lastStep: 'step-05-generate-output'
nextStep: ''
lastSaved: '2026-08-06'
---

# Test Design: Epic chat-core - Puku Core AI Chat Functionality (Black-Box)

**Date:** 2026-08-06
**Author:** Redoan
**Status:** Draft

---

## Executive Summary

**Scope:** Epic-level test design for the Puku Editor (`sh.puku.app`, Android, Flutter) core AI chat functionality — the logged-in home screen (chat prompt, model selector, chat input), drawer navigation (Chats, Projects, Artifacts, Code, New chat, Settings), and the Settings screen's remaining unautomated surface (Haptic feedback, Notifications, Voice). Black-box only — no source access, no PRD, no architecture docs; requirements captured conversationally in lieu of a written epic, consistent with the completed `auth-login` epic.

This epic is only reachable at all because `auth-login`'s `AUTH-E2E-015` now provides a reliable, automated path to a logged-in state (physical device with a pre-authenticated Google account, per ADR-006). Every scenario below inherits that dependency.

**Risk Summary:**

- Total risks identified this epic: 8 new (R8–R15), plus 6 inherited and still active from `auth-login` (R2, R3, R4, R5, R6, R7)
- High-priority risks (≥6) this epic: 5 new (R8, R9, R10, R11, R15) + 3 inherited (R2, R3, R6)
- Critical categories: TECH (5 of 8 new risks — R9, R11, R12, R13, R15), OPS (2 — R8, R10), DATA (2 — R10, R15), BUS (1 — R8), SEC (1 — R14). *Corrected from the original "TECH (5 of 7)" line, which undercounted against the 7-risk baseline it described — recomputed cleanly now that R15 is added.*
- **New risk class not present in `auth-login`:** this is the first epic testing a *live AI feature* rather than static UI — real inference cost/ToS exposure, non-deterministic output, and persistent side effects on a shared account are all new to this project

**Coverage Summary:**

- P0 scenarios: 4 (~7–14 hours)
- P1 scenarios: 7 (~10–18 hours)
- P2/P3 scenarios: 8 (~8–17 hours)
- **Total effort**: ~25–49 hours (~3–6 days) — test-authoring only, excludes the dedicated exploration passes R13 requires for Projects/Artifacts/Code

---

## Not in Scope

| Item | Reasoning | Mitigation |
|------|-----------|------------|
| **AI response quality/correctness** | No ground truth exists for black-box assessment of LLM output; asserting on exact generated text is inherently flaky | R9 — structural/behavioral assertions only (response rendered, input cleared), never exact text |
| **Voice/audio input automation** | No mic-injection path exists via Appium/UiAutomator2 — a tooling-fundamentals gap, not a project choice | R11 — permanent manual/exploratory-only lane, same treatment R2 got for Google OAuth |
| **Deep functional testing of Projects, Artifacts, Code** | Zero prior exploration; testability and locator coverage are completely unknown | R13 — smoke-only ("opens without crash") until a dedicated Appium Inspector exploration pass is run on each section |
| **Chat-history persistence correctness** (exact content survives restart, etc.) | No known cleanup/deletion mechanism exists yet to keep test-generated data isolated from the real account's history | R10 — only smoke-level "history list renders" planned until deletion/isolation is investigated |
| **Performance/load testing beyond informational latency** | No SLA/threshold exists to test against (NFR-Performance marked UNKNOWN) | CHAT-E2E-016 logs response latency informationally only, no gate |
| **API-level testing** | No backend endpoints have been identified from black-box exploration | Revisit if/when endpoints surface |

---

## Risk Assessment

### Inherited Risks (carried forward from `auth-login`, not re-scored)

| Risk ID | Original Score | Applies to chat-core? | Note |
|---|---|---|---|
| R1 | 9 | **No** | Chat-core is reached via the Google OAuth path (`AUTH-E2E-015`), not the broken email flow — orthogonal to this epic |
| R2 | 6 | **Yes — gating** | No longer just "OAuth automation is limited" — it's now a hard **entry criterion** for this entire epic, since every scenario requires the logged-in state R2's mitigation makes possible |
| R3 | 6 | **Yes** | Extended by R14 below to cover test *content*, not just credentials |
| R4 | 4 | **Yes** | Extends to all new chat-core screens as they're explored |
| R5 | 4 | **Yes, unchanged** | |
| R6 | 6 | **Yes, unchanged** | Framework-level mitigation (device-scoped logcat/screenshot/video) already in place |
| R7 | 4 | **Yes — amplified** | Automating against a live AI backend (not just static UI) raises the ToS/legal stakes — see R8 |

### High-Priority Risks (Score ≥6) — New This Epic

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|--------------|-------------|--------|-------|------------|-------|----------|
| R8 | OPS/BUS | Automated message-sending hits a live, real AI backend — real inference cost, rate limits, and potential ToS exposure for bot-like usage. Worst case (account flagged/suspended) blocks **both** epics, since they share one test account/device | 2 | 3 | 9→6* | Keep message-send scenarios few and deliberate; never burn-in/retry-loop them; never schedule in tight CI loops; amplifies R7 | Redoan | Before any message-send test is automated |
| R9 | TECH | AI response content is non-deterministic — asserting on exact response text is inherently flaky | 3 | 2 | 6 | Assert structural/behavioral signals only (response bubble renders, input clears, no crash) — never exact AI-generated text, same philosophy as R2's "verify redirect, not content" | Redoan | Before first message-send test is written |
| R10 | DATA/OPS | Test-generated messages persist indefinitely in the real, shared account's chat history — no known cleanup mechanism; risks polluting/confusing future Chats-history assertions | 3 | 2 | 6 | Consistent, recognizable test-message naming convention; investigate whether chat deletion exists before scaling up message-send coverage | Redoan | Before chat-history-list scenarios are written |
| R11 | TECH | Voice/audio input (Settings → Voice, mic icon on home) is not practically automatable — no reliable way to inject fake mic audio via Appium/UiAutomator2 | 3 | 2 | 6 | Same treatment as R2: permanent manual/exploratory-only lane, documented as an accepted limitation, not a coverage gap | Redoan | Ongoing / permanent |
| R15 | TECH/DATA | In-progress conversation state may not survive app backgrounding/restart — `AUTH-E2E-015`'s `noReset:true` only ever proved login-session persistence, never conversation/message persistence within a session | 2 | 3 | 6 | Add `CHAT-E2E-019` (P0): send a message, background/resume the app, confirm the conversation is still present | Redoan | Before `CHAT-E2E-019` is authored |

*R8: scored 2×3=6 (HIGH/MITIGATE band), not 9 — probability set to "Possible" (2) rather than "Likely" (3) since it's unconfirmed whether PUKU actively detects/rate-limits automated usage; impact set to "Critical" (3) because the worst case (account suspension) would block both epics on a shared account.
*R15: probability set to "Possible" (2), not "Likely" (3) — whether PUKU actually loses conversation state on backgrounding is unconfirmed, not assumed broken without evidence, same epistemic stance used for R8. Impact set to "Critical" (3) because silent loss of an in-progress conversation is a trust-destroying failure for a chat product specifically, not a cosmetic bug.

### Medium-Priority Risks (Score 3-4) — New This Epic

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
|---------|----------|--------------|-------------|--------|-------|------------|-------|
| R12 | TECH | Model availability may be gated by account plan/tier (Settings shows "Power" tier; Opus 4.8 vs puku-ai-2.8 access might differ by plan) — model-switch tests could fail for account-state reasons unrelated to the app | 2 | 2 | 4 | Record the test account's plan/tier at time of test authoring; treat plan-related failures as environment issues, not app bugs, until confirmed otherwise | Redoan |
| R13 | TECH | Projects, Artifacts, and Code sections are completely unexplored — testability/locator coverage is unknown, could hide gaps similar to (or worse than) the hamburger-icon gap | 2 | 2 | 4 | Dedicated black-box exploration pass (Appium Inspector) before attempting automation of each section, same discipline used for login/home/Settings | Redoan |
| R14 | SEC | Test chat input and AI responses could be captured verbatim in failure-diagnostic artifacts (logcat/screenshot/video per R6) and committed to a public portfolio repo | 2 | 2 | 4 | All test chat inputs must be synthetic/non-sensitive by convention — same spirit as R3's disposable-account rule, applied to message content | Redoan |

### Low-Priority Risks (Score 1-2)

None identified at this scope — all newly registered risks scored ≥4, consistent with `auth-login`'s pattern.

### Risk Category Legend

- **TECH**: Technical/Architecture (flaws, integration, scalability)
- **SEC**: Security (access controls, auth, data exposure)
- **PERF**: Performance (SLA violations, degradation, resource limits)
- **DATA**: Data Integrity (loss, corruption, inconsistency)
- **BUS**: Business Impact (UX harm, logic errors, revenue)
- **OPS**: Operations (deployment, config, monitoring)

---

## NFR Planning

**Purpose:** Capture epic-specific NFR thresholds, planned validation, and evidence expected for later `nfr-assess`. This is not a final evidence audit.

| NFR Category | Requirement / Threshold | Risk Link | Planned Validation | Evidence Needed |
|---------------|--------------------------|-----------|---------------------|------------------|
| Security | UNKNOWN — no PRD-defined threshold. Working assumption: test chat content must never contain real PII/secrets | R14, R3 | Manual convention (synthetic, non-sensitive test prompts only); spot-check failure artifacts before commit | Repo audit — **defaults to CONCERNS** until a written test-content convention doc exists (no automated PII scanner is possible for free-text chat content) |
| Reliability | UNKNOWN — no defined recovery-time/behavior threshold. Working assumption: no crash on model switch or network loss mid-message-send | R9, R6 | E2E (CHAT-E2E-005, CHAT-E2E-008): app survives model switch; graceful failure on network loss mid-send | Test pass/fail + screenshot/video on failure |
| Performance | UNKNOWN — no SLA defined | — | CHAT-E2E-016, informational only | Logged AI-response-latency metric, no threshold to gate |
| Maintainability | N/A — framework choice (Flutter semantics tree), not a stated requirement | R4, R13 | Locator health-check (CHAT-E2E-015), extended to new screens as explored | CI test-result trend over time |

**Unknown thresholds:** All NFR thresholds are UNKNOWN — no PRD, ADR, or architecture doc exists to source them from, same situation as `auth-login`. None have been guessed.

---

## Entry Criteria

- [ ] `AUTH-E2E-015` passes — a logged-in state must be reachable before any chat-core scenario can run (hard gate; this epic cannot start without it)
- [ ] Physical device (`RF8T802226Y`) with a pre-authenticated Google account (`editorpuku@gmail.com`) available, per ADR-006 — this epic is device-dependent for the same reasons `AUTH-E2E-015`/`016` are
- [ ] A synthetic, non-sensitive test-message content convention is written down before any message-send scenario is authored (R14)
- [ ] `adb logcat`/screenshot/video capture already wired into the framework and device-scoped (inherited from `auth-login`, R6)

## Exit Criteria

- [ ] All P0 tests passing
- [ ] All P1 tests passing (or failures triaged with an owner)
- [ ] R8 (message-send cost/ToS exposure) and R11 (voice automation) explicitly documented as accepted limitations, not open gaps — same treatment R1/R2 got in `auth-login`
- [ ] R13 (unexplored Projects/Artifacts/Code) either mitigated via a completed exploration pass, or explicitly carried forward as a tracked follow-on task
- [ ] No message-send-triggering scenario (CHAT-E2E-002, 008, 016) is wired into any burn-in/retry-loop or high-frequency schedule

---

## Test Coverage Plan

**Note:** P0/P1/P2/P3 below reflect priority/risk classification only, not execution timing — see Execution Strategy for scheduling. Scenario prefix `CHAT-E2E-` is new for this epic (distinct numbering from `LOGIN-E2E-`/`AUTH-E2E-`).

### P0 (Critical)

**Criteria**: Blocks core journey + High risk (≥6) + No workaround

| Test ID | Requirement | Test Level | Risk Link | Notes |
|---------|-------------|------------|-----------|-------|
| CHAT-E2E-001 | Home screen renders post-login without crash (chat prompt heading, chat input, model selector all visible) | E2E (Mobile) | — | Foundational; blocks everything else in this epic if it fails, same role `LOGIN-E2E-002` played |
| CHAT-E2E-002 | Sending a message produces a visible response (structural: response bubble renders, input clears) | E2E (Mobile) | R8, R9 | Asserts structure only, never exact AI text. Single minimal-content send — see Execution Strategy |
| CHAT-E2E-003 | Hamburger menu opens; drawer shows all expected entries (Chats, Projects, Artifacts, Code, New chat, Settings) | E2E (Mobile) | R4 | Gateway to the rest of this epic's scope |
| CHAT-E2E-019 | Send a message, background the app (`driver.background()`) and resume, confirm the conversation is still present | E2E (Mobile) | R15 | New gap, added 2026-08-06 — `AUTH-E2E-015`'s `noReset:true` only ever proved login-session persistence, never conversation persistence. Scoped to the single most common real-world interruption (backgrounding); a full process-kill/restart variant is a candidate follow-on, not this scenario's scope |

**Total P0**: 4 tests, ~7–14 hours

### P1 (High)

**Criteria**: Important paths + Medium/high risk + Common workflows

| Test ID | Requirement | Test Level | Risk Link | Notes |
|---------|-------------|------------|-----------|-------|
| CHAT-E2E-004 | Model selector opens and lists available models (puku-ai-2.8, Opus 4.8) | E2E (Mobile) | R12 | |
| CHAT-E2E-005 | Switching model doesn't crash the app; selection persists for the session | E2E (Mobile) | R12, NFR-Reliability | |
| CHAT-E2E-006 | "New chat" from drawer starts a fresh session (chat-prompt state resets) | E2E (Mobile) | — | Frequently used |
| CHAT-E2E-007 | Empty message cannot be sent (send control disabled/no-op) | E2E (Mobile) | — | Cheap edge case — does not trigger a real send, no R8 exposure |
| CHAT-E2E-008 | Network dropped mid-message-send → graceful error, no crash | E2E (Mobile) | R9, R8, NFR-Reliability | Mirrors `LOGIN-E2E-011`'s pattern. Cost-triggering (R8). Priority pending evidence — requires one careful, R8-mindful manual observation of the actual failure mode (graceful error vs. crash/hang) before this can be responsibly assessed |
| CHAT-E2E-009 | "Chats" drawer entry opens; history list renders without crash | E2E (Mobile) | R10 | Structural only; foundational for later detecting R10 pollution |
| CHAT-E2E-010 | Settings toggles (Haptic feedback, Notifications) can be toggled without crash; state visibly reflects the tap | E2E (Mobile) | — | Extends `settings.screen.ts`, not yet automated for these two toggles |

**Total P1**: 7 tests, ~10–18 hours

### P2 (Medium)

**Criteria**: Secondary flows + Low/medium risk + Edge cases

| Test ID | Requirement | Test Level | Risk Link | Notes |
|---------|-------------|------------|-----------|-------|
| CHAT-E2E-011 | Projects section opens without crash | E2E (Mobile) | R13 | Smoke only — zero prior exploration |
| CHAT-E2E-012 | Artifacts section opens without crash | E2E (Mobile) | R13 | Smoke only |
| CHAT-E2E-013 | Code section opens without crash | E2E (Mobile) | R13 | Smoke only |
| CHAT-E2E-014 | Long message input accepted without crash/truncation issues | E2E (Mobile) | — | Edge case |
| CHAT-E2E-015 | Locator health-check: all interactive elements on home/drawer/Settings expose usable locators, or are explicitly documented gaps | E2E (Mobile) | R4 | Encodes the hamburger-icon gap as a known, accepted exception — catches future *silent* regressions elsewhere, same role `LOGIN-E2E-006` played |

**Total P2**: 5 tests, ~6–12 hours

### P3 (Low)

**Criteria**: Nice-to-have + Exploratory + Informational benchmarks

| Test ID | Requirement | Test Level | Risk Link | Notes |
|---------|-------------|------------|-----------|-------|
| CHAT-E2E-016 | AI response latency observed/logged (cold + warm) | E2E (Mobile) | NFR-Performance, R8 | Informational only, no gate. Cost-triggering (R8) |
| CHAT-E2E-017 | Device rotation on home/chat screen — no crash, state preserved | E2E (Mobile) | — | Mirrors `LOGIN-E2E-014` |
| CHAT-E2E-018 | Voice entry point (Settings → Voice, mic icon) — behavior documented | Manual only | R11 | Permanent manual lane, same framing as `LOGIN-E2E-003` |

**Total P3**: 3 tests, ~2–5 hours

---

## Execution Strategy

Philosophy carried forward from `auth-login`: run everything in PR if it fits comfortably and isn't cost-risky; defer only what's expensive, long-running, **or newly risky per R8**.

- **PR (every commit):** P0 (3) + P1 minus cost-triggering scenarios (CHAT-E2E-004, 005, 006, 007, 009, 010) = 8 scenarios. CHAT-E2E-002 stays in PR despite touching R8 — it's the epic's single most load-bearing scenario — but strictly as **one minimal-content send, never retried or looped**.
- **Nightly:** CHAT-E2E-008 (network-loss-mid-send) + P2 (5 scenarios). CHAT-E2E-008 is moved out of PR specifically because of R8 (it triggers real inference cost on every run), not because it's low-value.
- **Weekly/manual:** P3 (3 scenarios). CHAT-E2E-016 (latency) is deliberately infrequent per R8; CHAT-E2E-018 (voice) is manual-only and never scheduled at all.

**This is a deliberate deviation from `auth-login`'s "everything P0+P1 fits under 15 minutes, put it all in PR" execution philosophy** — justified because `auth-login` had no scenario that cost real money or carried per-run ToS exposure. R8 didn't exist there; it's new to this epic.

**Framework-level requirements** (mitigate R6, R3, R14 — not test scenarios themselves):
- Every failed test run captures `adb logcat` + screenshot + video (already in place, device-scoped)
- Secrets/credential handling already in place (R3); extended discipline for test *message content* (R14) still needs a written convention before message-send scenarios scale up

---

## Resource Estimates

**Test-authoring only** — assumes the WebdriverIO + Appium framework and `AUTH-E2E-015` login path already exist (they do). Excludes the dedicated exploration time R13 requires for Projects/Artifacts/Code before those sections can be automated beyond smoke level.

| Priority | Count | Estimated Hours | Notes |
|----------|-------|------------------|-------|
| P0 | 4 | ~7–14 | New locator work for drawer/home exceeds `auth-login`'s already-mapped login screen; `CHAT-E2E-019` (added 2026-08-06) needs a new backgrounding/resume interaction on top of that |
| P1 | 7 | ~10–18 | Broadest tier — model switching, history, Settings toggles |
| P2 | 5 | ~6–12 | Three of five are pure smoke tests, cheap but exploration-gated (R13) |
| P3 | 3 | ~2–5 | |
| **Total** | **19** | **~25–49** | **~3–6 days** |

### Prerequisites

**Test Data:**

- N/A for most scenarios — UI-driven interactions only
- A short list of synthetic, non-sensitive test prompts for message-send scenarios (R14) — needs to be written down before CHAT-E2E-002/008/016 are authored

**Tooling:**

- WebdriverIO + Appium/UiAutomator2 for mobile UI automation (already in place)
- `adb` for logcat capture, device-scoped via `DEVICE_UDID` (already in place, R6)

**Environment:**

- Physical device `RF8T802226Y` with `sh.puku.app` installed and `editorpuku@gmail.com` pre-authenticated (ADR-006) — this epic cannot run against a fresh emulator or in CI, same constraint as `AUTH-E2E-015`/`016`

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions)
- **P1 pass rate**: ≥95% (waivers required for failures)
- **P2/P3 pass rate**: ≥90% (informational)
- **High-risk mitigations**: R8, R9, R10, R11 addressed or explicitly accepted (R11 is a structural limitation, not "fixable" by testing, same as R2)

### Coverage Targets

- **Explorable surface (home, drawer, Settings)**: 100% at smoke level; deeper coverage of Projects/Artifacts/Code deferred until R13's exploration pass
- **Reliability scenarios**: 100% (CHAT-E2E-005, CHAT-E2E-008)

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] R8 documented as an accepted limitation — no message-send-triggering scenario (CHAT-E2E-002, 008, 016) may ever run in a burn-in/retry-loop or high-frequency schedule; this is a gate violation, not a preference
- [ ] R11 (voice) explicitly documented as a permanent manual-only limitation, not tracked as an open gap
- [ ] CHAT-E2E-015 (locator health-check) stays green
- [ ] Planned NFR evidence (Security, Reliability) exists, or `nfr-assess` has documented CONCERNS

---

## Mitigation Plans

### R8: Automated message-sending hits a live AI backend — real cost/ToS exposure (Score: 6)

**Mitigation Strategy:** 1) Keep message-send scenarios to the minimum needed (CHAT-E2E-002, 008, 016) — do not add more without a specific reason. 2) Never wire any of them into a burn-in, retry-loop, or high-frequency schedule. 3) Keep CHAT-E2E-002 as a single minimal-content send in PR; move CHAT-E2E-008/016 to Nightly/Weekly specifically to reduce frequency.
**Owner:** Redoan
**Timeline:** Before any message-send test is automated
**Status:** Planned
**Verification:** CI schedule/config review confirms no message-send scenario runs more than once per pipeline stage, and none are burn-in candidates
**Residual Risk:** Even with frequency limits, every PR run still sends at least one real message (CHAT-E2E-002) — the underlying exposure isn't eliminated, only bounded. If PUKU's actual rate-limiting/ToS enforcement turns out to be stricter than assumed, this residual exposure could still trigger the worst case (account action) at low but non-zero probability.

### R9: AI response content is non-deterministic (Score: 6)

**Mitigation Strategy:** 1) All message-send assertions check structure/behavior only (response bubble appears, input clears, no crash) — never exact generated text. 2) Document this constraint directly in the message-send spec's code comments, same discipline used for ADR-006's device-dependency note in `oauth-consent.spec.ts`.
**Owner:** Redoan
**Timeline:** Before first message-send test is written
**Status:** Planned
**Verification:** Code review of message-send specs confirms no assertion depends on exact AI-generated text
**Residual Risk:** Structural assertions are more stable but not immune — a PUKU UI redesign of the response-rendering surface (bubble structure, loading states) could still break these tests even without any AI-content dependency. Lower residual severity than the original risk, not zero.

### R10: Test messages persist indefinitely in the real shared account's history (Score: 6)

**Mitigation Strategy:** 1) Adopt a consistent, recognizable naming/content convention for test-generated messages so they're identifiable later. 2) Investigate whether PUKU exposes a chat-deletion capability before scaling up message-send or chat-history coverage.
**Owner:** Redoan
**Timeline:** Before chat-history-list scenarios (CHAT-E2E-009) are written
**Status:** Planned
**Verification:** A documented test-message convention exists; chat-deletion capability (or its absence) is confirmed and recorded
**Residual Risk:** If no deletion capability exists, the naming convention only makes pollution identifiable, not reversible — the real account's chat history will grow indefinitely with test data regardless. Accepted as a standing cost of testing against a real account, not a solvable gap.

### R11: Voice/audio input not practically automatable (Score: 6)

**Mitigation Strategy:** 1) Treat as a permanent manual/exploratory-only lane, same as R2. 2) Document this boundary in the framework so it isn't mistaken for a coverage gap later (CHAT-E2E-018 tracks it explicitly as "Manual only").
**Owner:** Redoan
**Timeline:** Ongoing / permanent (not something to "resolve")
**Status:** Planned
**Verification:** README/test-design documents the limitation; CHAT-E2E-018 stays tagged manual-only, never converted to an automated attempt
**Residual Risk:** None beyond the accepted coverage gap itself — voice/audio simply stays untested by automation, same permanent trade-off already accepted for R2 (Google OAuth completion). Not expected to change unless Appium/UiAutomator2 gains audio-injection support.

### R15: In-progress conversation may not survive app backgrounding/restart (Score: 6)

**Mitigation Strategy:** 1) Add `CHAT-E2E-019` as a P0 scenario: send a message, background the app, resume it, and confirm the conversation is still present. 2) If it fails, treat as a confirmed defect and escalate — unlike R11/R2-style automation-tooling limitations, this isn't something the test suite can work around by design; it would be a real product bug. 3) No mitigation is possible before the scenario runs at least once — this risk starts as an open question, not a known, already-accepted limitation.
**Owner:** Redoan
**Timeline:** Before `CHAT-E2E-019` is authored
**Status:** Planned
**Verification:** `CHAT-E2E-019` passes consistently across repeated backgrounding/resume cycles
**Residual Risk:** `CHAT-E2E-019` as scoped tests one specific interruption mechanism (backgrounding via `driver.background()`) — if PUKU's persistence behaves inconsistently across interruption types (e.g. survives backgrounding but not a full process kill/force-stop, or vice versa), this scenario alone won't catch every variant. A process-kill/restart variant remains a candidate follow-on scenario, not yet in scope.

---

## Assumptions and Dependencies

### Assumptions

1. `editorpuku@gmail.com`'s current plan/tier ("Power", observed in Settings) remains stable for the duration of this epic's test authoring — a plan downgrade could invalidate R12's assumptions about model availability
2. Any chat messages sent during testing are synthetic and non-sensitive by convention (R14) — no real user data or secrets are ever typed into the chat input
3. PUKU does not currently rate-limit or flag this test account for automated usage (R8) — unconfirmed, treated as a live risk rather than a settled fact

### Dependencies

1. `AUTH-E2E-015` (logged-in state) — hard dependency; nothing in this epic can run without it
2. A written, synthetic test-message content convention — required before CHAT-E2E-002/008/016 are authored (R14)
3. A dedicated exploration pass (Appium Inspector) for Projects, Artifacts, and Code — required before those sections can be automated beyond smoke level (R13)

### Risks to Plan

- **Risk**: PUKU detects and rate-limits/suspends the test account for automated message-sending (R8 realized)
  - **Impact**: Both `chat-core` and `auth-login` epics stall — the shared account/device becomes unusable for further automation
  - **Contingency**: Reduce message-send scenario frequency further, or fall back to fully manual exploration for anything touching real message-sends until account status is confirmed safe

---

## Follow-on Workflows (Manual)

- Run `bmad-testarch-atdd` to generate failing P0 tests once the test-message content convention (R14) exists
- Run a dedicated exploration pass (Appium Inspector, live device) for Projects, Artifacts, and Code before attempting to expand this epic's P2 smoke tests into deeper coverage (R13)
- Run `bmad-testarch-automate` for broader coverage once P0 tests exist and R13's exploration is complete

---

## Approval

**Test Design Reviewed By:**

- [ ] Redoan (solo project — QA/Dev/PM) Date: _____

**Comments:**

---

## Interworking & Regression

| Service/Component | Impact | Regression Scope |
|---|---|---|
| `auth-login` epic (`AUTH-E2E-015`/`016`) | This epic's entire entry path depends on `AUTH-E2E-015` continuing to pass | Re-run `AUTH-E2E-015`/`016` alongside `chat-core`'s suite — a regression there silently invalidates every chat-core scenario's precondition |
| Shared test account/device (`RF8T802226Y`, `editorpuku@gmail.com`) | R8/R10 mean this epic's own test execution can affect the account state `auth-login` also depends on | No automated regression possible (black-box) — manual account-health spot-check recommended if either epic's pass rate degrades unexpectedly |

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification framework
- `probability-impact.md` — Risk scoring methodology
- `test-levels-framework.md` — Test level selection
- `test-priorities-matrix.md` — P0-P3 prioritization
- `nfr-criteria.md` — NFR validation criteria (security/reliability focus)

### Related Documents

- PRD: none exists
- Epic: none exists — this document's Executive Summary and the source progress file (`test-design-progress.md`) serve as the substitute requirements record
- Architecture: none exists (third-party, black-box); `ADR-004-tf-workflow-gap.md` and `ADR-006-oauth-consent-automation.md` are the closest available architecture-decision context
- Tech Spec: none exists
- Prior epic: `test-design-epic-auth-login.md` — source of inherited risks R1–R7 and the locator-discipline precedent this document builds on

---

**Generated by**: BMad TEA Agent (Murat) - Test Architect Module
**Workflow**: `bmad-testarch-test-design`
**Version**: 4.0 (BMad v6)
