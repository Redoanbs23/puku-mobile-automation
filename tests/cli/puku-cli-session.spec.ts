import { randomUUID } from 'node:crypto';
import {
  runPukuCli,
  extractResponseText,
  type PukuCliJsonResponse,
} from '../../src/utils/puku-cli.js';

/**
 * CLI-E2E-001: Puku CLI conversation retains context across a session
 * resume boundary.
 *
 * This spec exercises the Puku terminal automation contract end-to-end:
 *
 *   1. Generate a fresh session ID and start a new session with it.
 *   2. Send a deterministic first prompt carrying a unique generated
 *      marker phrase and a confirmation directive.
 *   3. Assert the CLI exited 0, returned parseable JSON, and the response
 *      body is non-empty.
 *   4. Resume the SAME session using the captured session ID.
 *   5. Send a follow-up prompt that asks the model to recall the marker.
 *   6. Assert the second response body contains the generated marker
 *      verbatim.
 *
 * Determinism strategy: the marker is generated per test invocation, not
 *     hardcoded. That sidesteps two problems at once — a fixed marker
 *     would either be remembered by the model across runs (false
 *     positives) or be a known-good phrase the model treats as a pattern
 *     it should echo regardless of the session (also false positives).
 *     A unique random marker forces the model to actually have seen it
 *     in the conversation to reproduce it.
 *
 * R8-equivalent: every CLI invocation here is a real, live inference
 *     call to the Puku backend (same cost class as CHAT-E2E-002's
 *     R8-gated send-message scenario). The spec runs exactly two
 *     inferences per invocation. Don't wire it into a loop, retry, or
 *     burn-in.
 *
 * NOT mobile: this file is run by `npm run test:cli`, not by `npm test`.
 *     It does not import Appium, the WDIO globals, or any screen
 *     object. The two test scripts are intentionally independent entry
 *     points and never invoke each other.
 */
describe('Puku CLI — session resume, --no-appium --no-device', () => {
  // Generated per test invocation — see Determinism strategy above.
  const MARKER = `CLI_AUTOMATION_TEST_${randomUUID().replace(/-/g, '').toUpperCase()}`;
  const FIRST_PROMPT =
    `Remember this exact phrase verbatim: ${MARKER}. ` +
    `Reply with a short confirmation that you have stored it.`;
  const SECOND_PROMPT =
    'What exact phrase did I ask you to remember in this conversation? ' +
    'Return only the phrase, with no surrounding commentary.';

  it('CLI-E2E-001: a resumed CLI session retains its prior context', function () {
    // Generous: a real inference round-trip + a JSON envelope parse is
    // well below this on a healthy network, and the helper itself caps
    // each individual CLI call at 120s. Two calls back-to-back is the
    // worst case this needs to cover.
    this.timeout(180_000);

    // --- 1. Start a new session with a fresh UUID ---
    const sessionId = randomUUID();

    // --- 2. Send the first prompt ---
    const first = runPukuCli<PukuCliJsonResponse>(['--session-id', sessionId], FIRST_PROMPT, {
      outputFormat: 'json',
    });

    // --- 3. Validate the first response ---
    if (first.exitCode !== 0) {
      throw new Error(
        `First CLI invocation exited with code ${first.exitCode}. ` +
          `stderr: ${first.stderr || '(empty)'}; stdout: ${first.stdout || '(empty)'}`,
      );
    }
    if (!first.parsed) {
      throw new Error(
        `First CLI stdout was not parseable as JSON. stdout: ${first.stdout || '(empty)'}`,
      );
    }
    const firstText = extractResponseText(first.parsed);
    if (firstText.length === 0) {
      throw new Error(
        `First CLI response body was empty. Envelope: ${JSON.stringify(first.parsed)}`,
      );
    }

    // --- 4. Resume the same session and send the follow-up ---
    const second = runPukuCli<PukuCliJsonResponse>(['--resume', sessionId], SECOND_PROMPT, {
      outputFormat: 'json',
    });

    // --- 5. Validate the second response ---
    if (second.exitCode !== 0) {
      throw new Error(
        `Resumed CLI invocation exited with code ${second.exitCode}. ` +
          `stderr: ${second.stderr || '(empty)'}; stdout: ${second.stdout || '(empty)'}`,
      );
    }
    if (!second.parsed) {
      throw new Error(
        `Resumed CLI stdout was not parseable as JSON. stdout: ${second.stdout || '(empty)'}`,
      );
    }

    // --- 6. Core assertion: the marker from prompt #1 must reappear ---
    const secondText = extractResponseText(second.parsed);
    if (!secondText.includes(MARKER)) {
      throw new Error(
        `Resumed session did not retain the original context. ` +
          `Expected the response to contain the marker "${MARKER}". ` +
          `Actual response body: ${JSON.stringify(secondText)}`,
      );
    }
  });
});