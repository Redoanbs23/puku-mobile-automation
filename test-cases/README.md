# Manual Test Cases

This folder holds manual test case documents — the human-executable counterpart to the automated specs in `tests/specs/`. Every manual case traces to exactly one automated scenario ID from the completed test design (`_bmad-output/test-artifacts/test-design-epic-auth-login.md`).

## Why manual test cases exist alongside automation

Not everything here is automated by design — Google OAuth (risk R2 in the test design) is a deliberate manual-only lane, and other scenarios may be exercised manually before their automated counterpart exists. Manual cases also document acceptance criteria in a form reviewable by non-engineers.

## Traceability convention

Each manual test case ID mirrors its automated counterpart's ID, with `E2E` swapped for `TC`:

| Automated (test design + `tests/specs/`) | Manual (`test-cases/`) |
|---|---|
| `LOGIN-E2E-002` | `LOGIN-TC-002` |
| `LOGIN-E2E-008` | `LOGIN-TC-008` |

A manual case's filename is its ID: `test-cases/auth/LOGIN-TC-008.md`.

## Test case format

Each manual test case file uses this structure:

```markdown
# LOGIN-TC-XXX: {Title}

**Priority:** P0 | P1 | P2 | P3
**Linked automated test:** `LOGIN-E2E-XXX` (tests/specs/auth/{file}.spec.ts) — or "Manual only" for scenarios that are deliberately not automated (e.g. Google OAuth completion, per R2)
**Linked risk(s):** {Risk ID(s) from test-design-epic-auth-login.md, if any}

## Preconditions

- {State required before executing}

## Steps

1. {Step}
2. {Step}

## Expected Result

{What should happen}

## Status

Not Run | Pass | Fail | Blocked

## Notes

{Anything relevant — device used, blockers hit, etc.}
```

## Current scope

14 manual test cases correspond 1:1 to the scenarios in `test-design-epic-auth-login.md`'s coverage matrix (`LOGIN-TC-001` through `LOGIN-TC-014`, in `auth/`). Individual case files are not written yet — this README and the folder structure are scaffolded first; cases will be added as they're executed or as their automated counterparts are built.

The `cli/` folder holds the manual counterpart to the CLI ConPTY suite (`tests/specs/cli/`). It uses the same `E2E` ↔ `TC` traceability convention (e.g. `CLI-E2E-001` ↔ `CLI-TC-001`). The CLI lane is **deliberately separate** from the Android suite because it does not require Appium, an Android device, or a mobile-app session — see `cli/CLI-TC-001.md` for the rationale and `docs/running-tests.md` for the `npm run test:cli` invocation.
