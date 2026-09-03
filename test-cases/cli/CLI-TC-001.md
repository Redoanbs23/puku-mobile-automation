# CLI-TC-001: Real interactive puku-cli under ConPTY -> /remote-control -> chat input accepted

**Priority:** P1
**Linked automated test:** `CLI-E2E-001` (tests/specs/cli/puku-cli-remote-control.spec.ts)
**Linked risk(s):** Day-15 reset — replaces a prior wrong-surface attempt that drove `puku-cli -p` (deleted). Risk register alignment tracked under a future test-design epic; no R-link in the current design matrix.

## Preconditions

- Windows host (the CLI uses Windows ConPTY; macOS/Linux need POSIX pseudo-terminal handling that has not been validated yet).
- Node.js ≥ 24 (matches the repo's `engines.node`).
- `node-pty@^1.1.0` installed — ships Win32 ConPTY prebuilds (verified at `node_modules/node-pty/prebuilds/win32-x64/pty.node`); no native compilation step required.
- Installed puku-cli accessible on the host. The test does NOT hardcode a path; set the absolute path to the launcher (the `.cmd` shim on Windows) via `PUKU_CLI_PATH` in `.env` (see `.env.example`). The spec skips itself when the var is unset.
- A valid authenticated puku-cli session (i.e. `puku login` has already been completed on the host's user-level config — the spec relies on puku-cli's existing credential store and does not perform OAuth).
- No Android toolchain, Appium, or Android device required.
- No mobile device, Appium server, or `appium:udid` required.

## Steps

1. Install/update dependencies: `npm install --ignore-scripts` (the `node-pty` install script is unnecessary; Win32 ConPTY prebuilds are shipped in-tree).
2. Configure `.env`: set `PUKU_CLI_PATH=<absolute path to the installed puku-cli.cmd>`. The path is intentionally NOT hardcoded anywhere in source so this works on any contributor machine + CI.
3. Run the automated lane: `npm run test:cli` (uses Mocha directly, with `dotenv/config` + `tsx` loaded via `.mocharc.cli.json`).
4. Observe Mocha's progress lines for:
   - `puku-cli real interactive REPL under Windows ConPTY — P1` (suite)
   - `✔ CLI-E2E-001 @p1: real interactive puku-cli under ConPTY -> /remote-control -> real session -> chat input accepted` (case)
   - `1 passing (~21s)` (final)
5. Confirm the sanitized evidence file exists at `evidence/cli-e2e-001-<timestamp>.txt`. The file MUST NOT contain any Bearer token, Authorization header value, or worker/oauth token. The URL renders as `https://puku.sh/code/[redacted-token]` in evidence because the 36-char sessionId is replaced by the sanitizer before write.

## Expected Result

- The PTY launches puku-cli.exe via `node-pty`'s ConPTY binding (no Chrome browser launched — Mocha, not WebdriverIO, drives the suite).
- The home screen renders the `❯ ` composer with a model line (`Opus 4.8` or `puku-ai-2.x`) and a `Chat: <n> / 40000` token counter — these together trigger the `homeReady` signal.
- After `/remote-control` + Enter is written to the PTY:
  - The status line first shows `• /rc connecting`, then flips to `• /rc` (no connecting) once the worker WebSocket is connected.
  - The URL `https://puku.sh/code/<sessionId>` is rendered; the sessionId is parsed into the wrapper's `sessionId` getter and asserted against the UUID-v4 shape.
- The composer accepts the convention-compliant test message `[PUKU-QA-TEST:CLI-E2E-001] ping` and shows a "Undulating…" spinner — proof that the real `❯ ` text-input area accepted the input AND that the local prompt submission path participates in the real relay bridge.
- The CLI process is killed in `afterEach`, so no orphaned puku-cli holds an open relay session after the run.
- No credential-bearing string appears in stdout, stderr, or evidence.

## Status

Pass

## Notes

**Scope boundary.** This case covers CLI-side only — puku-cli → /remote-control → real session → chat input. Mobile pairing, QR scanning, mobile Remote Chat UI, mobile WebSocket authentication, and the `/remote-control` popup's disconnect/QR sub-flows are NOT part of this case and are deliberately not attempted here. Those concerns are tracked under separate future test-design rows.

**Why Mocha, not WebdriverIO.** WebdriverIO insists on a real browser/app session through its `capabilities` gate. The CLI ConPTY lane never touches a browser — only the puku-cli desktop process is under test. Forcing a Chrome session open for the CLI lane would (a) waste a process, (b) leave a WebDriver server running for the lifetime of the suite, and (c) interact with a surface that has nothing to do with the assertion. Mocha's BDD primitives (`describe`/`it`/`before`/`afterEach`) are sufficient and remove the dependency on Appium/Android for a CLI-only test.

**Why `PUKU_CLI_PATH` lives in `.env`.** The puku-cli launcher's absolute path varies per host. Hardcoding it would (a) leak a personal file layout into source, (b) break the test the moment a contributor moves their npm prefix, and (c) forbid CI from configuring a different launcher location. `.env` is gitignored, so each operator can configure the path locally without affecting the tracked tree.

**What the test asserts vs what it explicitly does NOT assert.** The test asserts:
- real interactive puku-cli rendered the home composer (`homeReady`),
- `/remote-control` created a real relay session (UUID-shaped `sessionId`),
- the worker WebSocket came up (`• /rc` line, not `connecting`),
- the `❯ ` composer echoed the submitted prompt verbatim (proof the text-input accepted it).

It deliberately does NOT assert on the AI-generated reply text (R9, non-deterministic) and submits exactly one real message (R8 single-shot, no retry loop).

**Cleanup.** The wrapper kills the PTY child in `afterEach` even on failure, and the cleanest way to relaunch is `npm run test:cli` again — there's no static state on the host. The puku-cli user-level config is left intact (a session ID it never wrote remains invisible to the user).
