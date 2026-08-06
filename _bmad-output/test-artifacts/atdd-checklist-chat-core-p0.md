---
stepsCompleted: ['step-01-preflight-and-context', 'step-02-generation-mode', 'step-03-test-strategy', 'step-04-generate-tests', 'step-05-validate-and-complete']
lastStep: 'step-05-validate-and-complete'
lastSaved: '2026-08-06'
storyId: 'chat-core-p0'
storyKey: 'chat-core-p0'
storyFile: 'None — no written story exists; _bmad-output/test-artifacts/test-design-epic-chat-core.md (CHAT-E2E-001/002/003) plus the user's direct instruction substitute for one, consistent with how this project has operated throughout.'
atddChecklistPath: '_bmad-output/test-artifacts/atdd-checklist-chat-core-p0.md'
generatedTestFiles:
  - 'tests/specs/chat/home-screen.spec.ts'
  - 'tests/specs/chat/drawer.spec.ts'
  - 'tests/specs/chat/send-message.spec.ts'
---

# ATDD Checklist: chat-core P0 scenarios (CHAT-E2E-001/002/003)

## Step 1: Preflight & Context

**Detected stack:** Mobile (WebdriverIO + Appium/UiAutomator2 + TypeScript) — no `playwright.config.*`/`cypress.config.*` (frontend) or backend manifests exist. This skill's literal prerequisite check (`playwright.config.ts`/`cypress.config.ts` for frontend, `conftest.py`-style config for backend) doesn't match this stack, same mismatch ADR-004 already documented for the TF workflow. The underlying intent — "test framework configured" — is satisfied via `wdio.conf.ts` + Appium, already working and passing tests project-wide.

**Prerequisites:** No written story with formal acceptance criteria exists. The user's direct instruction (3 named scenario IDs from `test-design-epic-chat-core.md`, plus explicit constraints: R14 message-convention compliance, R8 single-execution gate, no locator-guessing) serves as the story substitute, consistent with how every prior workflow in this project has operated.

**Inputs loaded:** `test-design-epic-chat-core.md` (source scenarios/risks), `docs/testing/test-message-convention.md` (R14), `src/screens/home.screen.ts`, `src/screens/settings.screen.ts`, `src/flows/auth.flow.ts` (existing patterns), knowledge fragments: `data-factories.md`, `component-tdd.md`, `test-quality.md`, `test-healing-patterns.md`, `selector-resilience.md`, `timing-debugging.md`, `ci-burn-in.md`. The latter three are frontend/backend-conditioned in this skill's loading rules but loaded anyway as a deliberate, flagged override — their principles (selector hierarchy, deterministic waits, burn-in governance) apply directly to this mobile UI-automation project even though their examples are Playwright/Cypress-flavored.

## Step 2: Generation Mode

**Mode:** AI generation, sequential (no subagent/agent-team dispatch — batch was small and well-scoped: 3 named scenarios with explicit constraints already provided by the user). No recording mode used — not applicable to a native mobile app (Playwright CLI/MCP recording is web-only); the equivalent groundwork was raw accessibility-tree dumps captured during earlier live exploration this project (`post_login_source.xml`, `drawer_source.xml`), re-verified against disk before writing any locator into the new screen objects.

## Step 3: Test Strategy

All three scenarios map to E2E (Mobile) — no lower test level is reachable in black-box mobile testing (no source, no API). Priorities: all P0, inherited directly from `test-design-epic-chat-core.md`. No duplicate coverage: `CHAT-E2E-003`'s drawer assertions reuse `settingsScreen.tapHamburgerMenuTrigger()`/`profileAvatarButton` rather than re-implementing the hamburger tap or Settings entry point.

**Red-phase requirements:** This skill's Master Rule requires all red-phase scaffolds to use `test.skip()`/`it.skip()` (step 4/5). Two of the three scenarios deviated from pure red-phase by design, and this is flagged explicitly rather than silently applied:

- `CHAT-E2E-001` and `CHAT-E2E-003`: written as **real, active tests**, not skip stubs — all required locators were already confirmed (re-verified against the original raw accessibility-tree dumps, not memory), so nothing blocks them from running today. Both were run against `RF8T802226Y` and **passed**. This mirrors how every other test in this project (`LOGIN-E2E-002`, `AUTH-E2E-015`/`016`) was written as an active test from the start — there's no "pre-implementation" phase here, since PUKU already exists; the only thing that would normally be "red" in this project is missing *locator knowledge*, not missing app functionality.
- `CHAT-E2E-002`: written as a genuine `it.skip()` stub, matching this repo's own established convention (`tests/specs/auth/login-screen.spec.ts`'s other `it.skip(...)` entries) — because the send-control and response-bubble locators are genuinely unconfirmed and were not guessed.

## Step 4: Generated Tests

| File | Scenario | Status |
|---|---|---|
| `tests/specs/chat/home-screen.spec.ts` | CHAT-E2E-001 | Active, passing (verified against RF8T802226Y, 2026-08-06) |
| `tests/specs/chat/drawer.spec.ts` | CHAT-E2E-003 | Active, passing (verified against RF8T802226Y, 2026-08-06) |
| `tests/specs/chat/send-message.spec.ts` | CHAT-E2E-002 | `it.skip()` stub — blocked on live locator verification (see file header) |

**Supporting screen objects added:**
- `src/screens/home.screen.ts` — added `modelSelector` (resilient `contains(@content-desc, "puku-ai")` match, deliberately not pinned to a version since "puku-ai-2.7" (confirmed 2026-08-04) vs "puku-ai-2.8" (referenced in this epic's kickoff, 2026-08-06) already shows drift) and `chatInputField` (structural match on `android.widget.EditText[@hint="Chat with Puku..."]` — no content-desc exists on this element).
- `src/screens/drawer.screen.ts` (new) — `chatsMenuItem`, `projectsMenuItem`, `artifactsMenuItem`, `codeMenuItem`, `newChatButton`, all clean single-value content-desc, re-verified against `drawer_source.xml`.

**R8 gate (CHAT-E2E-002):** documented prominently in the stub's header comment — once implemented, must run at most once per invocation, never in a burn-in/retry loop. Confirmed no `retries`/`specFileRetries` exist anywhere in this repo's wdio config today, so nothing currently violates this; the note exists so it stays true if that ever changes.

**R14 gate (CHAT-E2E-002):** test message content specified in the stub's header (`[PUKU-QA-TEST:CHAT-E2E-002] What is 2 + 2?`, per `docs/testing/test-message-convention.md`), ready to use once the stub is implemented.

## Step 5: Validation & Completion

- Prerequisites: satisfied via substitute inputs (see Step 1), consistent with project precedent.
- Test files created: 3, listed above; all typecheck (`tsc --noEmit`) and lint (`eslint`) clean.
- Checklist matches acceptance criteria: yes — each file traces to exactly one `CHAT-E2E-` scenario ID from `test-design-epic-chat-core.md`.
- Red-phase compliance: `CHAT-E2E-002` uses `it.skip()` per the Master Rule; `CHAT-E2E-001`/`003` deliberately deviate (see Step 3) since nothing blocks them.
- No CLI sessions or temp artifacts orphaned — no Playwright CLI/MCP was used (not applicable to mobile); all exploration artifacts already lived under the project's own scratchpad, not `{test_artifacts}`.

**Key risks/assumptions carried into implementation:**
- R8, R9, R14 (message-send cost/ToS exposure, non-deterministic AI output, content leakage into failure artifacts) all apply once `CHAT-E2E-002` is implemented.
- The model selector's exact version string is confirmed to drift (R12-adjacent) — the resilient prefix match in `home.screen.ts` is the mitigation already applied.

**Next recommended workflow:** a live Appium Inspector session against `RF8T802226Y` to identify the send-control and response-bubble locators (unblocks `CHAT-E2E-002`), then re-run this workflow's Step 4 scope for that one scenario. `bmad-testarch-automate` is the natural follow-on once `CHAT-E2E-002` is implemented and the remaining P1/P2/P3 scenarios in `test-design-epic-chat-core.md` are ready to be scaffolded.
