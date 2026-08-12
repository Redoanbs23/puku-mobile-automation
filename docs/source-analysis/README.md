# Source Analysis (puku-app-flutter)

These 9 documents were generated via **static source-code analysis of the
`puku-app-flutter` repo**, obtained separately — not produced through this
project's own black-box reconnaissance process (no source access, live
device/emulator exploration only; see `docs/00-apk-reconnaissance.md` and
`_bmad-output/test-artifacts/`).

## Why these exist alongside our own black-box docs

Black-box exploration can observe *behavior* but not *implementation* — it
can tell you a button shows a "not connected" toast, but not whether that's a
missing backend call, a feature flag, or a stubbed handler. These documents
close that gap with ground truth our own process couldn't reach without
source access:

- **Confirmed auth storage mechanism** — how/where PUKU persists session
  state, not just observed login-screen behavior (see
  `test-data-and-dependencies.md`, `automation-analysis-summary.md`,
  `feature-inventory.md`, `automation-readiness.md`, `automation-priority.md`,
  `user-flows.md`).
- **A widget `Key` locator catalogue** — actual Flutter `Key`/`ValueKey`
  values from source, a stronger and more stable locator strategy than the
  `content-desc`/semantics-tree approach our black-box locators rely on where
  available (see `automation-candidates.md`, `screen-inventory.md`,
  `automation-priority.md`, `automation-readiness.md`, `user-flows.md`).
- **Confirmed feature implementation status** — which screens/actions are
  real vs. placeholder/no-op, resolving cases our black-box testing could
  only flag as "behaves like a placeholder" (see `feature-inventory.md`).

## The 9 documents

| File | Covers |
|---|---|
| `application-overview.md` | App identity, architecture, tech stack (source-confirmed) |
| `automation-analysis-summary.md` | Executive summary of the static analysis |
| `automation-candidates.md` | Screens/flows rated for black-box automation suitability |
| `automation-priority.md` | Suggested automation priority (business criticality × determinism × locator quality × setup cost) |
| `automation-readiness.md` | Prerequisites checklist and readiness gaps |
| `feature-inventory.md` | Per-feature implementation status (✅ real / 🟨 partial / ❌ placeholder / ❓ unverified) |
| `screen-inventory.md` | Every registered route + modal surface, from `lib/routes/navigation_service.dart` |
| `test-data-and-dependencies.md` | Test data, API, and backend dependencies (no credentials/secrets reproduced) |
| `user-flows.md` | End-to-end flows as observable steps, with locator-quality ratings |

## How to use these

**Treat as authoritative for what the source code says exists** — implementation
status, storage mechanism, and locator values here are ground truth, not
inference.

**Cross-reference against our own test-design docs for prioritization** —
`_bmad-output/test-artifacts/test-design-epic-auth-login.md` and
`test-design-epic-chat-core.md`. These 9 documents weren't produced through
this project's risk-based process (no risk scoring, no P0–P3 classification
tied to our own risk register), so they inform *what's possible and true*,
not *what to automate first* — that call still runs through our existing
risk-based test design.

## Provenance note

Sourced from a separate checkout of `puku-app-flutter`, not this repo. Content
is reproduced as-received and **not modified** by this project's automation
work.
