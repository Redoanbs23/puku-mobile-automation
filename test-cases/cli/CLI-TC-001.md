# CLI-TC-001: Puku CLI retains conversational context across a session resume

**Priority:** P0
**Linked automated test:** `CLI-E2E-001` (tests/cli/puku-cli-session.spec.ts) — run with `npm run test:cli`
**Linked risk(s):** R8 (real inference, real cost — see Notes)

## Preconditions

- `puku-cli` is installed and available on `PATH`. On this project: `puku-cli 1.8.51` (verified 2026-09-02).
- Authenticated against the Puku backend — same credentials/environment the manual `puku-cli` invocation already uses for ad-hoc use.
- No device, emulator, or Appium is required. The spec spawns the CLI as a child process and never touches the mobile automation stack.
- Node.js ≥ 24 (matches the `engines` declaration in `package.json`).

## Steps

1. From the repo root, run: `npm run test:cli`.
2. The script executes `tests/cli/puku-cli-session.spec.ts` via `tsx` + the existing `mocha` dependency.
3. The spec generates a unique marker phrase (a `CLI_AUTOMATION_TEST_<UUID>` token), then:
   1. Invokes `puku-cli -p --session-id <uuid> --output-format json "Remember this exact phrase verbatim: <marker>. Reply with a short confirmation that you have stored it."`.
   2. Asserts the CLI exited 0, returned parseable JSON, and produced a non-empty response body.
   3. Invokes `puku-cli -p --resume <uuid> --output-format json "What exact phrase did I ask you to remember in this conversation? Return only the phrase, with no surrounding commentary."`.
   4. Asserts the second response body contains the generated marker verbatim.

## Expected Result

Mocha reports a single passing test:

```
Puku CLI — session resume, --no-appium --no-device
  ✓ CLI-E2E-001: a resumed CLI session retains its prior context
```

A failure in any of the four steps above produces a clear assertion message naming the failing step and including the CLI's stdout/stderr for triage.

## Status

Pass

## Notes

**R8 — real inference, real cost.** Each execution performs two real, live Puku inference calls (one for each CLI invocation). Same cost class as the R8-gated `CHAT-E2E-002` mobile spec. Do not wire this test into a loop, retry, or high-frequency schedule; do not re-run it to debug a failure — read the assertion message first, which always includes the relevant CLI stdout/stderr.

**Determinism via per-run marker.** The marker is a fresh UUID each invocation, not a fixed phrase. A fixed phrase would either (a) be remembered by the model from a prior session outside this test, or (b) be matched on pattern rather than on conversation content — both false-positive paths. A unique random marker forces genuine in-conversation recall to pass the assertion.

**Isolation from mobile automation.** This case is not picked up by `npm test`. The WDIO spec glob in `config/wdio.shared.conf.ts` is `tests/specs/**/*.spec.ts`; the CLI spec lives in `tests/cli/`, outside that glob, and is run by a dedicated `mocha` invocation. No Appium, no Android, no device — it is intentionally a sibling entry point to the mobile suite, not a part of it.

**Leaves no state behind.** The CLI session created by this test persists in the user's normal Puku session history (same place ad-hoc `puku-cli` use goes), but no files, processes, or test artifacts are written to the repository by the spec itself. The npm script does not write to `allure-results/`, `test-results/`, or any other repo-tracked path.