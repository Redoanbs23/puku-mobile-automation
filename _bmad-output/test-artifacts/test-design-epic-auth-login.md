---
workflowStatus: 'completed'
totalSteps: 5
stepsCompleted: ['step-01-detect-mode', 'step-02-load-context', 'step-03-risk-and-testability', 'step-04-coverage-plan', 'step-05-generate-output']
lastStep: 'step-05-generate-output'
nextStep: ''
lastSaved: '2026-08-04'
---

# Test Design: Epic auth-login - Puku Login / Authentication (Black-Box)

**Date:** 2026-08-04
**Author:** Redoan
**Status:** Draft

---

## Executive Summary

**Scope:** Epic-level test design for the Puku Editor (`sh.puku.app`, Android, Flutter) login screen and authentication entry points. Black-box only — no source access, no PRD, no architecture docs; requirements captured conversationally in lieu of a written epic (see Assumptions).

**Risk Summary:**

- Total risks identified: 7
- High-priority risks (≥6): 4 (R1, R2, R3, R6)
- Critical categories: TECH (4 of 7 risks), BUS/OPS (2 each), SEC (1)

**Coverage Summary:**

- P0 scenarios: 3 (~4–8 hours)
- P1 scenarios: 5 (~6–10 hours)
- P2/P3 scenarios: 6 (~6–12 hours)
- **Total effort**: ~16–30 hours (~2–4 days) — test-authoring only, excludes framework scaffold (TF workflow, not yet run)

---

## Not in Scope

| Item | Reasoning | Mitigation |
|------|-----------|------------|
| **Screens beyond login** | Blocked by R1 — the email sign-in flow is broken, preventing any exploration past the login screen | Revisit once R1 is resolved; LOGIN-E2E-008 is the trigger signal |
| **Full Google OAuth completion (through consent + real account)** | R2 — not practically automatable (external browser, live account required, high fragility, Google actively resists automated sign-in) | Treated as a permanent manual/exploratory-only lane, not a coverage gap |
| **API-level testing** | No backend endpoints have been identified yet from black-box exploration | Revisit if/when endpoints surface (e.g. via traffic capture during later exploration) |
| **Performance/load testing** | No SLA/threshold exists to test against (NFR-Performance marked UNKNOWN) | LOGIN-E2E-004 logs cold-start time informationally only, no gate |
| **Compliance/ToS assessment** | Not automatable — a legal/business judgment call (R7) | Deferred to Redoan's own review of PUKU's ToS before publishing findings |

---

## Risk Assessment

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner | Timeline |
|---------|----------|--------------|-------------|--------|-------|------------|-------|----------|
| R1 | BUS | Email sign-in flow broken ("Email sign in flow is not connected"), blocking all exploration past login | 3 | 3 | 9 | Track as confirmed defect with dev team; hold post-login coverage until resolved; LOGIN-E2E-008 is the regression guard/trigger | Redoan (liaises with dev team) | TBD — no fix ETA committed |
| R2 | TECH | Google OAuth not practically automatable (external Chrome redirect, live account required, environment-dependent, high fragility) | 3 | 2 | 6 | Treat as manual/exploratory-only lane; verify redirect only (LOGIN-E2E-007), never complete OAuth; document as accepted limitation | Redoan | Ongoing / permanent |
| R3 | SEC | Test credential exposure risk — this becomes a public GitHub portfolio repo | 2 | 3 | 6 | Disposable test accounts only; secrets via env vars/CI secret store, never committed; `.gitignore` credential/session files; scrub PII from committed screenshots/video | Redoan | Before any credentials touch the repo |
| R6 | TECH | No source access, no crash logs, no server-side observability — failure triage relies entirely on black-box signals | 3 | 2 | 6 | Capture `adb logcat` + screenshot + video on every test failure at the framework level (OS-level, no app cooperation needed) | Framework build-out (TF) | Before first automated run |

### Medium-Priority Risks (Score 3-4)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation | Owner |
|---------|----------|--------------|-------------|--------|-------|------------|-------|
| R4 | TECH | Flutter's semantics tree (content-desc exposure) can regress silently on app updates — a framework convention, not a guarantee | 2 | 2 | 4 | LOGIN-E2E-006 locator health-check smoke test; fails fast if key content-desc values disappear | Framework build-out (TF) |
| R5 | OPS/TECH | Third-party APK sourced via AppTester may drift from the official Play Store release (version, signing, bundled services) | 2 | 2 | 4 | Record exact APK version/hash under test; periodically re-verify against the live Play Store release | Redoan |
| R7 | OPS/BUS | Automating against, and publicly documenting bugs in, a third-party production app as a public portfolio project may raise ToS/legal considerations | 2 | 2 | 4 | Flagged for Redoan's judgment, not resolved by this workflow — review PUKU's ToS/acceptable-use terms before publishing | Redoan |

### Low-Priority Risks (Score 1-2)

None identified at this scope — all registered risks scored ≥4.

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
| Security | UNKNOWN — no PRD-defined threshold. Working assumption: broken-auth error paths must not leak sensitive data | R3 | E2E assertion (LOGIN-E2E-009): error toast text generic, no PII/tokens in logcat | Test report + logcat scrub |
| Reliability | UNKNOWN — no defined recovery-time/behavior threshold. Working assumption: no crash on auth failure or network loss | R2, R6 | E2E (LOGIN-E2E-010, LOGIN-E2E-011): graceful failure on broken email-auth and on network loss mid-OAuth-redirect | Test pass/fail + screenshot/video on failure |
| Maintainability | N/A — framework choice (Flutter semantics tree), not a stated requirement | R4 | Locator health-check (LOGIN-E2E-006) | CI test-result trend over time |
| Performance | UNKNOWN — no SLA defined | — | LOGIN-E2E-004, informational only | Logged cold-start metric, no threshold to gate |

**Unknown thresholds:** All NFR thresholds are UNKNOWN — no PRD, ADR, or architecture doc exists to source them from. None have been guessed; each is either converted into a risk above or left as an explicit clarification item for whoever owns product requirements going forward.

---

## Entry Criteria

- [ ] WebdriverIO + Appium/UiAutomator2 framework scaffold exists (TF workflow — not yet run)
- [ ] Target Android device/emulator provisioned with `sh.puku.app` installed from the known APK build
- [ ] Secrets handling in place (R3) before any test account credentials are introduced
- [ ] `adb logcat`/screenshot/video capture wired into the framework (R6)

## Exit Criteria

- [ ] All P0 tests passing
- [ ] All P1 tests passing (or failures triaged with an owner)
- [ ] No open P0/P1 bugs beyond the already-tracked R1 (email-auth) and R2 (OAuth automation limitation)
- [ ] LOGIN-E2E-008 status reviewed — if it now fails (flow fixed), scope re-opens for screens beyond login

---

## Test Coverage Plan

**Note:** P0/P1/P2/P3 below reflect priority/risk classification only, not execution timing — see Execution Strategy for scheduling.

### P0 (Critical)

**Criteria**: Blocks core journey + High risk (≥6) + No workaround

| Test ID | Requirement | Test Level | Risk Link | Notes |
|---------|-------------|------------|-----------|-------|
| LOGIN-E2E-002 | App launches, login screen renders without crash | E2E (Mobile) | — | Core functionality; blocks all further testing if it fails |
| LOGIN-E2E-005 | Both auth entry points render ("Continue with Google", "Enter your email") | E2E (Mobile) | — | Core functionality |
| LOGIN-E2E-008 | Tap "Enter your email" → shows "Email sign in flow is not connected" toast | E2E (Mobile) | R1 | Regression guard; failing (i.e. flow starts working) is the trigger to re-open scope |

**Total P0**: 3 tests, ~4–8 hours

### P1 (High)

**Criteria**: Important paths + Medium/high risk + Common auth workflows

| Test ID | Requirement | Test Level | Risk Link | Notes |
|---------|-------------|------------|-----------|-------|
| LOGIN-E2E-006 | All login-screen interactive elements expose usable content-desc locators | E2E (Mobile) | R4 | Locator health-check, early warning for silent semantics-tree regressions |
| LOGIN-E2E-007 | Tap "Continue with Google" → correctly redirects to external Chrome OAuth consent screen | E2E (Mobile) | R2 | Verify redirect only — never complete OAuth |
| LOGIN-E2E-009 | Broken email-auth error toast contains no sensitive data | E2E (Mobile) | NFR-Security | |
| LOGIN-E2E-010 | App remains on login screen (no crash) after broken email-auth toast | E2E (Mobile) | NFR-Reliability | |
| LOGIN-E2E-011 | Network dropped mid-Google-OAuth-redirect → graceful error, not a crash | E2E (Mobile) | R2, NFR-Reliability | |

**Total P1**: 5 tests, ~6–10 hours

### P2 (Medium)

**Criteria**: Secondary flows + Low/medium risk + Edge cases

| Test ID | Requirement | Test Level | Risk Link | Notes |
|---------|-------------|------------|-----------|-------|
| LOGIN-E2E-001 | App installs from sideloaded APK without error | E2E (Mobile) | R5 | One-time environment check; record APK version/hash |
| LOGIN-E2E-012 | Back navigation from Chrome OAuth redirect returns app to a sane login-screen state | E2E (Mobile) | — | |
| LOGIN-E2E-013 | Login screen renders correctly across ≥2 device sizes/OS versions | E2E (Mobile) | — | Basic compatibility smoke |

**Total P2**: 3 tests, ~4–8 hours

### P3 (Low)

**Criteria**: Nice-to-have + Exploratory + Informational benchmarks

| Test ID | Requirement | Test Level | Notes |
|---------|-------------|------------|-------|
| LOGIN-E2E-003 | Sideload/Play Protect install warning behavior documented | E2E (Mobile) | Likely manual one-time check, not repeatedly automated |
| LOGIN-E2E-004 | Cold start time observed | E2E (Mobile) | Informational metric only, no gate |
| LOGIN-E2E-014 | Device rotation on login screen — no crash, state preserved | E2E (Mobile) | |

**Total P3**: 3 tests, ~2–4 hours

---

## Execution Strategy

Philosophy: run everything in PRs if it fits comfortably under 15 minutes; defer only what's expensive or long-running.

- **PR (every commit):** All P0 + P1 (8 scenarios) — login-flow interactions are fast, this fits well under 15 minutes.
- **Nightly:** P2 (3 scenarios) — the device-size compatibility check (LOGIN-E2E-013) adds enough setup overhead to not belong in the PR gate.
- **Weekly/manual:** P3 (3 scenarios) — low recurring value; the Play Protect check (LOGIN-E2E-003) is realistically a one-time manual verification rather than a repeated automated run.

**Framework-level requirements** (mitigate R6 and R3, not test scenarios themselves):
- Every failed test run captures `adb logcat` + screenshot + video
- Secrets management (disposable test accounts, env-var/CI-secret storage, `.gitignore`'d credential files) is in place before any credentials touch this repo

---

## Resource Estimates

**Test-authoring only** — assumes the WebdriverIO + Appium framework scaffold already exists. It doesn't yet; add scaffold and CI setup time separately when running the TF and CI workflows.

| Priority | Count | Estimated Hours | Notes |
|----------|-------|------------------|-------|
| P0 | 3 | ~4–8 | Foundational flows, needs solid device/emulator setup validated first |
| P1 | 5 | ~6–10 | Standard coverage, includes NFR-derived scenarios |
| P2 | 3 | ~4–8 | Device-size matrix adds setup overhead |
| P3 | 3 | ~2–4 | Exploratory/informational |
| **Total** | **14** | **~16–30** | **~2–4 days** |

### Prerequisites

**Test Data:**

- N/A — no API or data-seeding access exists in black-box mode; all test data is UI-driven (real login-screen interactions only)

**Tooling:**

- WebdriverIO + Appium/UiAutomator2 for mobile UI automation
- `adb` for logcat capture (R6 mitigation)
- Playwright — reserved for API-layer test data only; not yet applicable, no backend endpoints identified

**Environment:**

- Android device/emulator matching the AppTester-sourced APK build
- `sh.puku.app` installed from a recorded, known APK version/hash (R5)
- No test account credentials committed to the repo (R3) — external secret storage required before use

---

## Quality Gate Criteria

### Pass/Fail Thresholds

- **P0 pass rate**: 100% (no exceptions)
- **P1 pass rate**: ≥95% (waivers required for failures)
- **P2/P3 pass rate**: ≥90% (informational)
- **High-risk mitigations**: R1, R2, R3, R6 addressed or explicitly accepted (R1/R2 are structural limitations, not "fixable" by testing)

### Coverage Targets

- **Explorable surface (login screen + entry points)**: 100% — a blanket "≥80%" target isn't meaningful yet since most of the app is inaccessible until R1 resolves
- **Security scenarios**: 100% (LOGIN-E2E-009)
- **Reliability scenarios**: 100% (LOGIN-E2E-010, LOGIN-E2E-011)

### Non-Negotiable Requirements

- [ ] All P0 tests pass
- [ ] LOGIN-E2E-008 status reviewed before every release/report — it's the R1 unlock signal
- [ ] R2 (Google OAuth) explicitly documented as a permanent manual-only limitation, not tracked as an open gap
- [ ] LOGIN-E2E-006 (locator health-check) stays green
- [ ] Planned NFR evidence (Security, Reliability) exists, or `nfr-assess` has documented CONCERNS

---

## Mitigation Plans

### R1: Email sign-in flow broken, blocks all screens past login (Score: 9)

**Mitigation Strategy:** 1) Confirmed and reported to the dev team already. 2) Do not attempt to build automated coverage for post-login screens until resolved. 3) Keep LOGIN-E2E-008 as a standing regression guard — its failure (meaning the flow started working) is the signal to re-run exploration and expand scope.
**Owner:** Redoan (liaises with dev team on fix status)
**Timeline:** TBD — no fix ETA committed by the dev team yet
**Status:** Planned
**Verification:** LOGIN-E2E-008 flips from pass (bug confirmed) to fail (bug gone) — treat that flip as the trigger, not a red flag

### R2: Google OAuth not practically automatable (Score: 6)

**Mitigation Strategy:** 1) Verify only that tapping "Continue with Google" redirects correctly to Chrome's OAuth consent screen (LOGIN-E2E-007) — do not attempt to complete sign-in. 2) Document this boundary explicitly in the framework README so it isn't mistaken for a coverage gap later. 3) Keep this path as a manual/exploratory test lane only.
**Owner:** Redoan
**Timeline:** Ongoing / permanent (not something to "resolve")
**Status:** Planned
**Verification:** README documents the limitation; LOGIN-E2E-007 passes consistently for the redirect-only assertion

### R3: Test credential exposure risk in a public portfolio repo (Score: 6)

**Mitigation Strategy:** 1) Use dedicated, disposable test accounts only — never real/personal accounts. 2) Store any secrets via environment variables or a CI secrets store, never in committed files. 3) `.gitignore` credential/session files. 4) Scrub screenshots/videos for PII before committing as fixtures or documentation.
**Owner:** Redoan
**Timeline:** Before any credentials touch the repository
**Status:** Planned
**Verification:** Repo audit / secret-scanning check before each push, especially before making the repo public

### R6: No source access, no crash logs, no server-side observability (Score: 6)

**Mitigation Strategy:** 1) Capture `adb logcat` output on every test failure (OS-level, needs no app cooperation). 2) Capture a screenshot and video recording on every test failure. 3) Store all failure artifacts under `{test_artifacts}/` for triage.
**Owner:** Framework build-out phase (TF workflow)
**Timeline:** Before the first automated run
**Status:** Planned
**Verification:** A deliberately-forced test failure produces logcat + screenshot + video artifacts

---

## Assumptions and Dependencies

### Assumptions

1. PUKU app under test remains at the observed APK version/build (`apk/puku.apk`) unless explicitly re-verified against the live Play Store release
2. The dev team will address the email sign-in bug (R1) on their own timeline; no committed date exists as of this writing
3. Any Google account used for OAuth exploration is a disposable/non-production test account, never a real personal account

### Dependencies

1. Email-auth fix from the PUKU dev team — required before scope can expand past login (no date committed; tracked as R1)
2. WebdriverIO + Appium framework scaffold (TF workflow) — required before any of these scenarios can actually be automated; not yet run

### Risks to Plan

- **Risk**: The dev team doesn't prioritize the email-auth fix
  - **Impact**: This project stalls indefinitely at login-only coverage
  - **Contingency**: Continue deepening breadth within the login screen itself (NFR/edge-case scenarios, framework quality) while waiting; revisit scope periodically

---

## Follow-on Workflows (Manual)

- Run `bmad-testarch-framework` (TF) to scaffold the WebdriverIO + Appium framework — nothing here can run until this exists
- Run `bmad-testarch-atdd` to generate failing P0 tests once the framework scaffold exists (separate workflow; not auto-run)
- Run `bmad-testarch-automate` for broader coverage once the framework and P0 tests exist

---

## Approval

**Test Design Reviewed By:**

- [ ] Redoan (solo project — QA/Dev/PM) Date: _____

**Comments:**

---

## Interworking & Regression

Not applicable — this is a greenfield black-box automation project with no existing test suite or adjacent services to regress against.

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
- Architecture: none exists (third-party, black-box)
- Tech Spec: none exists

---

**Generated by**: BMad TEA Agent (Murat) - Test Architect Module
**Workflow**: `bmad-testarch-test-design`
**Version**: 4.0 (BMad v6)
