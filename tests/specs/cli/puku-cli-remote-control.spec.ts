import assert from 'node:assert/strict';
import {
  PukuCliPty,
  writeEvidence,
} from '../../../src/utils/puku-cli-pty.js';
import { env } from '../../../src/utils/env.js';

/**
 * CLI-E2E-001: real interactive puku-cli under Windows ConPTY drives
 * `/remote-control` to a real relay session and accepts chat input through
 * the `❯ ` composer.
 *
 * Scope (Day 15, post-Day-14 reset):
 *   - Spawn the actual installed puku-cli.exe under Windows ConPTY
 *     (Microsoft node-pty 1.1.0 — uses Win32 ConPTY prebuilds).
 *   - Drive `/remote-control` and extract the sessionId from the rendered
 *     web URL — no OCR, no synthetic REST calls, no fake worker.
 *   - Validate the worker WebSocket is up (status line `• /rc`,
 *     NOT `• /rc connecting`).
 *   - Type a controlled, synthetic prompt into the real `❯ ` text-input
 *     surface and press Enter ONCE.
 *
 * What is OUT of scope:
 *   - Mobile pairing, QR scanning, mobile Remote Chat, mobile WS auth.
 *   - The /remote-control popup is not the chat composer (verified live
 *     in the Day 14 recon, source-verified in cli.mjs:gUz/Eq7).
 *   - `puku-cli -p` (Day 14's wrong-interface approach).
 *   - Multiple sends, retries, reconnect handling — this is a single,
 *     gated interaction.
 *
 * Why Mocha, not WebdriverIO
 * --------------------------
 * WebdriverIO insists on a real browser/app session via its `capabilities`
 * gate. The CLI ConPTY lane never touches a browser — it only ever
 * drives a desktop puku-cli under Windows ConPTY. Forcing a Chrome
 * session open just to satisfy wdio's launcher would (a) waste a
 * process, (b) cause the test to interact with a surface that has
 * nothing to do with the assertion, and (c) leave an unrelated
 * WebDriver server running for the lifetime of the suite. Mocha
 * alone gives us the same BDD primitives (`describe`/`it`/`before`/
 * `afterEach`) with no browser dependency.
 *
 * Skip semantics
 * --------------
 *   - `PUKU_CLI_PATH` unset → skip (mirrors the `DEVICE_UDID` skip
 *     pattern in the Android suite). The path must be configured in
 *     `.env` (see `.env.example`); it is intentionally NOT hardcoded
 *     so this code works on any contributor machine + CI.
 *   - `PUKU_CLI_E2E=skip` → skip (explicit opt-out for a session that
 *     is not running this surface).
 *
 * R8 discipline
 * -------------
 * Sends exactly one real prompt to the live puku relay. No retries.
 * Test message follows docs/testing/test-message-convention.md (R14).
 *
 * Cleanup
 * -------
 * `afterEach` always:
 *   - kills the child PTY process (best-effort) so we never leak a
 *     puku-cli holding an open relay session,
 *   - writes the sanitized PTY buffer under `evidence/cli-e2e-001-<ts>.txt`.
 *     Sanitization strips Bearer/Authorization headers and token-shaped
 *     strings (≥24 chars of [A-Za-z0-9_=-]) so any worker/oauth token
 *     that ever lands in stdout cannot leak to disk.
 */
describe('puku-cli real interactive REPL under Windows ConPTY — P1', () => {
  let ptyHandle: PukuCliPty | null = null;
  let ptyBuffer = '';
  let evidenceLabel = 'cli-e2e-001';

  before(function () {
    if (!env.pukuCliPath()) {
      this.skip();
      return;
    }
    if (process.env.PUKU_CLI_E2E === 'skip') {
      this.skip();
      return;
    }
    // Generous headroom: Ink boot ~12s, /remote-control round-trip ~5s,
    // one model inference variable. Bound at 120s as the upper guard.
    this.timeout(120_000);
  });

  afterEach(function () {
    if (ptyHandle) {
      try {
        // Snapshot the wrapper's full buffer (which is what carries the
        // real rendered puku-cli output) for evidence, then kill the
        // child process so the relay session gets closed cleanly.
        ptyBuffer = ptyHandle.getBuffer();
        ptyHandle.kill();
      } catch {
        // best-effort
      }
      ptyHandle = null;
    }
    if (ptyBuffer) {
      writeEvidence(evidenceLabel, ptyBuffer);
      ptyBuffer = '';
    }
  });

  it('CLI-E2E-001 @p1: real interactive puku-cli under ConPTY -> /remote-control -> real session -> chat input accepted', async function () {
    if (!env.pukuCliPath()) {
      this.skip();
      return;
    }
    if (process.env.PUKU_CLI_E2E === 'skip') {
      this.skip();
      return;
    }

    evidenceLabel = `cli-e2e-001-${Date.now()}`;
    ptyHandle = new PukuCliPty({});
    ptyHandle.on('homeReady', () => {
      /* readiness reached — surfaced via await */
    });

    const snapshot = (): string =>
      ptyHandle ? ptyHandle.getSanitizedBuffer() : '';

    // 1. Wait for the home screen composer (real Ink TUI readiness
    //    signal — NOT an arbitrary sleep).
    await ptyHandle.waitForHomeReady(30_000);

    // 2. Drive /remote-control through the PTY.
    ptyHandle.write('/remote-control\r');

    // 3. /remote-control creates a session and the status line flips
    //    to `• /rc` once the worker WS is connected.
    await ptyHandle.waitForRemoteReady(30_000);

    // 4. sessionId must be a UUID and must come from the real session.
    const sid = ptyHandle.sessionId;
    assert.ok(sid, 'sessionId never observed in PTY buffer after /remote-control');
    assert.match(
      sid,
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      `sessionId must be a UUID, got: ${sid}`,
    );

    // 5. Type one controlled prompt into the real `❯ ` composer. R8
    //    single-shot, no retry. Convention-compliant prefix per
    //    docs/testing/test-message-convention.md (R14).
    const message = '[PUKU-QA-TEST:CLI-E2E-001] ping';
    ptyHandle.write(`${message}\r`);

    // 6. Structural assertion: the prompt must echo our message
    //    verbatim into the PTY buffer. This is the proof that the
    //    TUI accepted the input. We intentionally do NOT assert on
    //    the assistant reply text — R9 (non-deterministic output).
    const deadline = Date.now() + 60_000;
    let echoed = false;
    while (Date.now() < deadline) {
      if (snapshot().includes(message)) {
        echoed = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 250));
    }
    assert.ok(
      echoed,
      'Submitted prompt was not echoed back into the PTY buffer within 60s — the ❯ composer did not accept the input.',
    );
  });
});
