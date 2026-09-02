import { spawnSync, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Thin, sync wrapper around the `puku-cli` executable.
 *
 * The mobile automation in this repo talks to a Flutter app on a device
 * through Appium. This helper is the parallel of that for the Puku
 * terminal: it spawns `puku-cli` as a child process, captures stdout and
 * stderr separately, waits for completion, and (when requested) parses the
 * `--output-format json` payload into a typed object.
 *
 * Why sync: every caller that needs a Puku response needs to act on it
 * before the test moves on. The CLI itself is short-lived per invocation
 * (one prompt -> one response -> exit), so the simplicity of a sync
 * spawnSync is worth more than the marginal latency of async streaming.
 *
 * Why no IPC / streaming: the CLI is invoked in -p (non-interactive)
 * mode, which exits as soon as the response is complete. There is no
 * long-running Puku process for this helper to manage, so there is
 * nothing to clean up on the helper side.
 */
export interface PukuCliResult<T = unknown> {
  /** Process exit code. 0 means the CLI considered the call successful. */
  exitCode: number;
  /** Raw stdout (always a string, even when the CLI prints nothing). */
  stdout: string;
  /** Raw stderr. */
  stderr: string;
  /**
   * Parsed JSON payload when `outputFormat === 'json'` AND the CLI exited
   * with code 0 AND stdout parsed cleanly. Otherwise undefined — callers
   * should fall back to inspecting `stdout` for diagnostics.
   */
  parsed?: T;
}

export interface RunPukuCliOptions {
  /**
   * Mirrors the CLI's `--output-format` flag. Defaults to `'json'` because
   * the rest of this helper (and every consumer) treats the response as
   * structured data. Pass `'text'` if you specifically want the raw text
   * output (and to skip JSON parsing).
   */
  outputFormat?: 'text' | 'json' | 'stream-json';
  /**
   * Hard timeout in milliseconds. Puku CLI has no built-in cap, and a
   * stuck process would otherwise hang the test forever. Defaults to
   * 120s — generous enough for a real inference round-trip on a slow
   * network, short enough that a hung CLI surfaces as a clear failure
   * rather than a silent CI timeout.
   */
  timeoutMs?: number;
}

/**
 * Resolve `puku-cli` to the form we actually want to spawn.
 *
 * On Windows, `puku-cli` is a global npm CLI exposed to the user as a
 * `.cmd` shim under their npm prefix (`%AppData%\Roaming\npm` on this
 * project, verified 2026-09-02). The underlying entry point is a plain
 * Node script at `<npm-prefix>\node_modules\@puku\puku-cli\bin\puku-cli`.
 *
 * Spawning the `.cmd` directly via Node requires either `shell: true`
 * (concatenates args into a single command line — observed truncating
 * prompts containing `?` on 2026-09-02) or Node's hidden cmd.exe wrapper
 * (still goes through cmd.exe). Neither preserves free-form text with
 * shell metacharacters. The robust approach is to skip the shim and
 * spawn the underlying Node script via `node` directly — argv semantics
 * are preserved, prompt bytes pass through verbatim.
 *
 * Resolution strategy on Windows (in order):
 *
 *   1. PRIMARY: ask npm for the global node_modules root via
 *      `npm root -g`, then check for
 *      `<global-root>/@puku/puku-cli/bin/puku-cli`. This is npm's own
 *      authoritative answer to "where do globally-installed CLI
 *      packages live on this machine" and is independent of any PATH
 *      ordering quirks (npm's `npm run` injection of
 *      `./node_modules/.bin`, project-local installs that shadow the
 *      global one, PATH cases, etc.). If the package is installed
 *      globally, this is the answer.
 *
 *   2. FALLBACK: if the global install is missing, fall back to
 *      `where puku-cli`. Find any `.cmd` shim, then walk upward from
 *      the shim's directory looking for `@puku/puku-cli/bin/puku-cli`.
 *      The upward walk supports both npm layouts:
 *        - global shim at `<prefix>\puku-cli.cmd` ->
 *          `<prefix>\node_modules\@puku\puku-cli\bin\puku-cli`
 *        - project-local shim at
 *          `<project>\node_modules\.bin\puku-cli.cmd` ->
 *          `<project>\node_modules\@puku\puku-cli\bin\puku-cli`
 *          (i.e. one directory up from `.bin`, NOT inside it).
 *      Earlier versions of this helper hard-coded the global layout
 *      and produced a non-existent path on the project-local case,
 *      which is the bug this fallback now covers
 *      (observed 2026-09-02).
 *
 * On POSIX, `puku-cli` is a normal executable on PATH; just resolve
 * it via `which` and spawn it directly.
 *
 * Throws with a clear message if neither strategy finds an
 * underlying CLI script, so a missing dependency fails the test with a
 * useful diagnostic rather than a generic ENOENT.
 */
interface ResolvedPukuCli {
  /** Executable to spawn (e.g. `node` on Windows, `puku-cli` on POSIX). */
  command: string;
  /** Args to pass to `command` (e.g. the script path on Windows). */
  prefixArgs: string[];
}

/**
 * Normalize a path string for suffix comparison: forward slashes,
 * trimmed trailing slashes, lower case. Used by the PATH filter so
 * trailing separators and mixed separators don't defeat the filter
 * (a `<…>\node_modules\.bin\` entry — with a trailing backslash —
 * would otherwise survive an `endsWith('/node_modules/.bin')` check;
 * observed as a latent bug in the previous version).
 */
function normalizePathForFilter(p: string): string {
  return p.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
}

function findScriptNearShim(startDir: string): string | undefined {
  // Walk upward until we either find
  // `<dir>/@puku/puku-cli/bin/puku-cli` or hit the filesystem root.
  // Each step: check `<dir>/node_modules/@puku/puku-cli/bin/puku-cli`
  // (global layout) AND `<dir>/@puku/puku-cli/bin/puku-cli`
  // (project-local layout, where `node_modules` is a sibling of `.bin`
  // rather than an ancestor). The first hit wins.
  let dir = path.resolve(startDir);
  // Bound the walk to a reasonable depth so a runaway loop is impossible
  // even if the filesystem is broken. 10 levels is enough to climb out
  // of any plausible `node_modules` nesting.
  for (let i = 0; i < 10; i += 1) {
    const candidates = [
      path.join(dir, 'node_modules', '@puku', 'puku-cli', 'bin', 'puku-cli'),
      path.join(dir, '@puku', 'puku-cli', 'bin', 'puku-cli'),
    ];
    for (const candidate of candidates) {
      try {
        if (fs.statSync(candidate).isFile()) {
          return candidate;
        }
      } catch {
        // Not present at this level; keep climbing.
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return undefined;
    }
    dir = parent;
  }
  return undefined;
}

function resolveWindowsPukuCli(): ResolvedPukuCli | undefined {
  // PRIMARY — `npm root -g`. npm's own definition of "where globally-
  // installed packages live on this machine". This is npm-version-
  // aware and ignores PATH ordering.
  let npmGlobalRoot: string | undefined;
  try {
    const raw = execFileSync('npm', ['root', '-g'], { encoding: 'utf8' }).toString();
    const trimmed = raw.split(/\r?\n/).map((l) => l.trim()).find(Boolean);
    if (trimmed) {
      npmGlobalRoot = trimmed;
      const candidate = path.join(
        trimmed,
        '@puku',
        'puku-cli',
        'bin',
        'puku-cli',
      );
      try {
        if (fs.statSync(candidate).isFile()) {
          return { command: 'node', prefixArgs: [candidate] };
        }
      } catch {
        // Global install of @puku/puku-cli not present; fall through.
      }
    }
  } catch {
    // `npm` itself is unavailable or errored — fall through to the
    // PATH-based fallback. We don't want a missing `npm` on PATH to
    // be the reason the helper fails.
  }

  // FALLBACK — `where puku-cli`. PATH is filtered to reduce (but not
  // eliminate) the chance of picking a project-local shadow over the
  // global install. We then walk upward from any `.cmd` shim we find
  // to locate the underlying Node script, which works for both
  // global and project-local layouts.
  const env = { ...process.env } as NodeJS.ProcessEnv;
  if (env.PATH) {
    const filtered = env.PATH.split(';').filter((dir) => {
      const normalized = normalizePathForFilter(dir);
      return !normalized.endsWith('/node_modules/.bin');
    });
    env.PATH = filtered.join(';');
  }

  let raw: string;
  try {
    raw = execFileSync('where', ['puku-cli'], { encoding: 'utf8', env }).toString();
  } catch {
    // `where` failed entirely — nothing on PATH.
    return undefined;
  }

  const candidates = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const candidate of candidates) {
    if (!candidate.toLowerCase().endsWith('.cmd')) {
      continue;
    }
    const shimDir = path.dirname(candidate);
    const scriptPath = findScriptNearShim(shimDir);
    if (scriptPath) {
      return { command: 'node', prefixArgs: [scriptPath] };
    }
  }

  // Last-ditch: try the non-.cmd entries too. On Windows, `where`
  // returns a shim without extension as well as the .cmd; treat both
  // as possible pointers to a parent directory.
  for (const candidate of candidates) {
    const dir = path.dirname(candidate);
    const scriptPath = findScriptNearShim(dir);
    if (scriptPath) {
      return { command: 'node', prefixArgs: [scriptPath] };
    }
  }

  // Surface `npm root -g` even if the global install was missing, so
  // the caller has actionable context.
  if (npmGlobalRoot) {
    throw new Error(
      `Could not find an installed @puku/puku-cli script. 'npm root -g' returned '${npmGlobalRoot}', ` +
        `but '${npmGlobalRoot}\\@puku\\puku-cli\\bin\\puku-cli' does not exist, and no fallback ` +
        `resolution via 'where puku-cli' succeeded either. Install puku-cli globally ` +
        `(npm install -g @puku/puku-cli) or as a local devDependency.`,
    );
  }
  return undefined;
}

function resolvePukuCli(): ResolvedPukuCli {
  const isWindows = os.platform() === 'win32';

  if (isWindows) {
    const resolved = resolveWindowsPukuCli();
    if (resolved) {
      return resolved;
    }
    throw new Error(
      `Could not locate the 'puku-cli' executable. On Windows, this helper expects either:\n` +
        `  - a global install at '<npm-prefix>\\node_modules\\@puku\\puku-cli\\bin\\puku-cli' ` +
        `(verified via 'npm root -g'), or\n` +
        `  - any puku-cli entry on PATH (verified via 'where puku-cli').\n` +
        `Install puku-cli globally (npm install -g @puku/puku-cli) or as a local devDependency, ` +
        `and ensure 'npm' itself is on PATH.`,
    );
  }

  // POSIX — `which puku-cli` and spawn directly. argv semantics
  // are preserved by Node's spawn, no shell in the loop.
  let raw: string;
  try {
    raw = execFileSync('which', ['puku-cli'], { encoding: 'utf8' }).toString();
  } catch (err) {
    throw new Error(
      `Could not locate the 'puku-cli' executable via 'which'. ` +
        `Ensure puku-cli is installed and on PATH. Underlying error: ${(err as Error).message}`,
    );
  }
  const first = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);
  if (!first) {
    throw new Error(`'which puku-cli' returned no results. Ensure puku-cli is installed and on PATH.`);
  }
  return { command: first, prefixArgs: [] };
}

/**
 * Invoke `puku-cli` synchronously with a single prompt.
 *
 * `args` are CLI flags (e.g. ['--session-id', '<uuid>'] or
 * ['--resume', '<uuid>']); `prompt` becomes the final positional
 * argument. The CLI must be installed and on PATH; if it isn't, the
 * helper throws a clear diagnostic at the first call.
 */
export function runPukuCli<T = unknown>(
  args: string[],
  prompt: string,
  options: RunPukuCliOptions = {},
): PukuCliResult<T> {
  const outputFormat = options.outputFormat ?? 'json';
  const timeoutMs = options.timeoutMs ?? 120_000;

  const resolved = resolvePukuCli();
  const cliArgs = [...resolved.prefixArgs, '-p', ...args, '--output-format', outputFormat, prompt];

  // Note: `shell: false`. The prompt is free-form text and may contain
  // characters (`?`, `&`, `>`, quotes, etc.) that go through a shell
  // unmodified would not be a problem on POSIX, but on Windows every
  // `shell: true` invocation runs through `cmd.exe /d /s /c …` with
  // args joined by spaces — observed 2026-09-02 truncating the second
  // prompt of this very test (the `?` plus surrounding punctuation
  // caused the model to receive a partial message and respond with
  // "looks cut off"). The `resolvePukuCli()` helper above returns a
  // direct executable + script path (node + bin script on Windows,
  // puku-cli on POSIX) so we can spawn with `shell: false` and
  // preserve the prompt bytes verbatim, no shell in the loop.
  const result = spawnSync(resolved.command, cliArgs, {
    encoding: 'utf8',
    timeout: timeoutMs,
    maxBuffer: 10 * 1024 * 1024, // 10 MiB — a single Puku reply fits well below this
    shell: false,
    windowsHide: true,
  });

  if (result.error) {
    // ETIMEDOUT, EPIPE, etc. (ENOENT is caught earlier by
    // resolvePukuCli). Surface as a thrown error so the test fails
    // clearly with the underlying cause, instead of a generic
    // "exit code -1".
    throw result.error;
  }

  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  const exitCode = result.status ?? -1;

  let parsed: T | undefined;
  if (outputFormat === 'json' && exitCode === 0 && stdout.trim().length > 0) {
    try {
      parsed = JSON.parse(stdout) as T;
    } catch {
      // Leave parsed undefined; the caller can inspect stdout to debug.
    }
  }

  return { exitCode, stdout, stderr, parsed };
}

/**
 * Puku CLI `--output-format json` envelope. The schema is owned by the
 * CLI and is not formally documented, so this captures only the fields
 * the test actually consumes. The CLI may add fields without notice —
 * treat unknown keys as opaque.
 */
export interface PukuCliJsonResponse {
  type?: string;
  role?: string;
  session_id?: string;
  /**
   * Top-level result text on the `type: "result"` envelope. This is the
   * shape the Puku CLI currently emits (verified 2026-09-02 against
   * puku-cli 1.8.51 — the success envelope has the assistant's reply at
   * `.result`, not nested under `.message`).
   */
  result?: string;
  /**
   * Older / alternative shapes the CLI has used. Kept here so this
   * helper stays resilient if the envelope format changes again.
   * `extractResponseText()` checks both.
   */
  message?: string | Array<{ type?: string; text?: string }>;
  [key: string]: unknown;
}

/**
 * Pull a plain-text response out of the CLI's JSON envelope. Tries, in
 * order:
 *   1. `envelope.result` — the Puku CLI `type: "result"` success shape.
 *   2. `envelope.message` — a string (Claude-SDK-style shape).
 *   3. `envelope.message` — an array of content blocks, joined.
 * Returns '' when none of those paths yield text — the caller treats
 * that as a test failure.
 */
export function extractResponseText(envelope: PukuCliJsonResponse | undefined): string {
  if (!envelope) {
    return '';
  }

  if (typeof envelope.result === 'string' && envelope.result.length > 0) {
    return envelope.result;
  }

  const message = envelope.message;
  if (typeof message === 'string' && message.length > 0) {
    return message;
  }
  if (Array.isArray(message)) {
    return message
      .map((block) => (typeof block?.text === 'string' ? block.text : ''))
      .join('')
      .trim();
  }
  return '';
}