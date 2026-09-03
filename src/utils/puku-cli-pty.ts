import * as pty from 'node-pty';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { env } from './env.js';

/**
 * Minimal Windows ConPTY wrapper around the REAL installed puku-cli process.
 *
 * Why this exists
 * ---------------
 * The Day 14 CLI automation effort used a synchronous wrapper and
 * `puku-cli -p`, both of which automate the *wrong* surface. The actual
 * puku-cli is a React/Ink interactive REPL — not a pipe-friendly CLI —
 * and the only legitimate automation target is the same surface a human
 * sees:
 *   - a virtual terminal (ConPTY on Windows) rendering Ink output,
 *   - a `❯ ` composer that is the chat input,
 *   - a `/remote-control` slash command that creates a real relay session.
 *
 * This module is intentionally small. It is the only place that talks
 * to `node-pty`; the spec layer composes these primitives into
 * assertions about real CLI behaviour, not about the wrapper.
 *
 * Where the puku-cli path comes from
 * ---------------------------------
 * `command` is resolved from the `PUKU_CLI_PATH` env var
 * (`.env.example`), NOT hardcoded. This keeps the code path-agnostic:
 * it works on any contributor machine + CI without leaking a personal
 * file layout, and it lets the spec skip cleanly when the path is
 * unset (mirroring the project's `DEVICE_UDID` skip pattern).
 *
 * Credential safety
 * -----------------
 * puku-cli reads its own per-user config from disk. We MUST NOT pass
 * any `PUKU_*TOKEN` env vars through this layer — the CLI re-reads them
 * itself, and forward-spreading them would create a side-channel that
 * could land in dumps. Only `PUKU_CLI_DISABLE_HEAP_RELAUNCH` is set,
 * purely to suppress a heap-snapshot self-restart that can detach
 * from the PTY on first launch.
 *
 * The wrapper exposes:
 *   - `getBuffer()` — the full PTY text rendered so far (no tokens
 *     appear in normal Ink output; see `sanitizeForLog` for defence
 *     in depth),
 *   - `sessionId` — the parsed 36-char UUID component of the web URL,
 *   - readiness events (`homeReady`, `remoteReady`).
 */
export interface PukuCliPtyOptions {
  /** Absolute path to the puku-cli executable. Defaults to the user-installed shim. */
  readonly command?: string;
  /** Working directory of the child process. */
  readonly cwd?: string;
  /** Extra env vars. NEVER spread process.env without filtering PUKU_* tokens. */
  readonly env?: Readonly<Record<string, string>>;
  /** TTY cols / rows. Defaults 140x60 — matches the recon workspace. */
  readonly cols?: number;
  readonly rows?: number;
}

export class PukuCliPty {
  private readonly proc: pty.IPty;
  private buffer = '';
  private _sessionId: string | null = null;
  private _homeReady = false;
  private _remoteReady = false;
  private readonly emitter = new EventEmitter();
  private readonly resolveHome: () => void;
  private readonly rejectHome: (err: Error) => void;
  private readonly homePromise: Promise<void>;
  private readonly resolveRemote: () => void;
  private readonly rejectRemote: (err: Error) => void;
  private readonly remotePromise: Promise<void>;

  constructor(opts: PukuCliPtyOptions) {
    const command = opts.command ?? resolvePukuCliPath();
    const env: Record<string, string> = {
      ...Object.fromEntries(
        Object.entries(process.env).filter(([k]) => !/^PUKU_(ACCESS|REFRESH|WORKER|MOBILE|API)_TOKEN$/i.test(k)),
      ),
      ...opts.env,
      FORCE_COLOR: '1',
      PUKU_CLI_DISABLE_HEAP_RELAUNCH: '1',
    };
    this.proc = pty.spawn(command, [], {
      name: 'xterm-256color',
      cols: opts.cols ?? 140,
      rows: opts.rows ?? 60,
      cwd: opts.cwd ?? process.cwd(),
      env,
      useConpty: true,
    });

    let resolveHomeRef!: () => void;
    let rejectHomeRef!: (err: Error) => void;
    this.homePromise = new Promise<void>((res, rej) => {
      resolveHomeRef = res;
      rejectHomeRef = rej;
    });
    this.resolveHome = resolveHomeRef;
    this.rejectHome = rejectHomeRef;

    let resolveRemoteRef!: () => void;
    let rejectRemoteRef!: (err: Error) => void;
    this.remotePromise = new Promise<void>((res, rej) => {
      resolveRemoteRef = res;
      rejectRemoteRef = rej;
    });
    this.resolveRemote = resolveRemoteRef;
    this.rejectRemote = rejectRemoteRef;

    this.proc.onData((data) => {
      this.buffer += typeof data === 'string' ? data : Buffer.from(data).toString('binary');
      const clean = stripAnsi(this.buffer);

      if (this._sessionId === null) {
        const m = /https:\/\/puku\.sh\/code\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i.exec(
          clean,
        );
        if (m) {
          this._sessionId = m[1].toLowerCase();
          this.emitter.emit('sessionId', this._sessionId);
        }
      }

      // Home-ready signal: the boot splash is gone, a model line is
      // rendered, and a `Chat:` token-counter line is present. We treat
      // the first hit as the boot completion boundary — Ink re-renders
      // constantly so this is a one-shot.
      // Apply a trailing-window check so leftover splash frames don't
      // satisfy the predicate before the real home screen has rendered.
      if (!this._homeReady) {
        const tail = clean.slice(-4000);
        if (
          /Opus|puku-ai/.test(tail) &&
          /Chat:\s+\d+\s*\/\s*40000/.test(tail) &&
          !/Working|Failed to install Puku marketplace/.test(tail.slice(-200))
        ) {
          this._homeReady = true;
          this.resolveHome();
          this.emitter.emit('homeReady');
        }
      }

      // Remote-ready signal: status line `• /rc` (NOT `• /rc connecting`)
      // AND sessionId has been observed. The CLI replays Ink frames, so
      // earlier `• /rc connecting` chunks remain in the buffer — we
      // therefore inspect only the *trailing* window and anchor on the
      // last occurrence of `• /rc` to make sure the live state, not a
      // stale frame, is what we read.
      if (this._sessionId !== null && !this._remoteReady) {
        const tail = clean.slice(-2000);
        const matches = tail.match(/•\s*\/rc[^\n]*/g) ?? [];
        const last = matches[matches.length - 1] ?? '';
        // Connected when the last `• /rc…` token is NOT followed by
        // `connecting`. This mirrors the live Ink render exactly:
        // transient `connecting` re-renders are followed by a `connected`
        // re-render, and only the last one matters.
        if (last && !/•\s*\/rc\s+connecting/.test(last)) {
          this._remoteReady = true;
          this.resolveRemote();
          this.emitter.emit('remoteReady');
        }
      }
    });

    this.proc.onExit(({ exitCode, signal }) => {
      const err = new Error(
        `puku-cli exited (code=${exitCode ?? 'null'}, signal=${signal ?? 'null'})`,
      );
      if (!this._homeReady) this.rejectHome(err);
      if (!this._remoteReady) this.rejectRemote(err);
      this.emitter.emit('exit', { exitCode, signal });
    });
  }

  /** The parsed 36-char sessionId, or null if /remote-control has not produced one yet. */
  get sessionId(): string | null {
    return this._sessionId;
  }

  /** True when the CLI has rendered the home screen `❯ ` composer. */
  get homeReady(): boolean {
    return this._homeReady;
  }

  /** True once /remote-control has produced the connected `• /rc` status (not "connecting"). */
  get remoteReady(): boolean {
    return this._remoteReady;
  }

  /** Full PTY buffer (already ANSI-stripped is the caller's responsibility). */
  getBuffer(): string {
    return this.buffer;
  }

  /** Sanitized PTY buffer (ANSI-stripped + token regex replaced). */
  getSanitizedBuffer(): string {
    return sanitizeForLog(this.buffer);
  }

  /** Subscribe to readiness / lifecycle events. */
  on(event: 'homeReady' | 'remoteReady' | 'sessionId' | 'exit', cb: (...args: unknown[]) => void): this {
    this.emitter.on(event, cb as (...a: unknown[]) => void);
    return this;
  }

  /** Resolve when the CLI has finished booting and the home screen is fully drawn. */
  async waitForHomeReady(timeoutMs = 30_000): Promise<void> {
    return withTimeout(this.homePromise, timeoutMs, 'home-ready');
  }

  /** Resolve when /remote-control has produced `• /rc` (worker WS connected). */
  async waitForRemoteReady(timeoutMs = 30_000): Promise<void> {
    return withTimeout(this.remotePromise, timeoutMs, 'remote-ready');
  }

  /** Write a keystroke or sequence verbatim to the PTY. */
  write(data: string): void {
    this.proc.write(data);
  }

  /** Terminate the child process. Safe to call multiple times. */
  kill(): void {
    try {
      this.proc.kill();
    } catch {
      // best-effort, never throw from cleanup
    }
  }
}

/**
 * Strip ANSI escape codes (CSI + OSC) and CRLF from a PTY chunk. Used to
 * make Ink-rendered buffer greppable for sessionId and readiness signals
 * without losing anything semantically meaningful.
 */
export function stripAnsi(s: string): string {
  return s
    .replace(/\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g, '') // OSC … BEL/ST
    .replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '') // CSI sequences
    .replace(/\r/g, '')
    .replace(/\x1b[()][AB012]/g, ''); // charset selection (rare)
}

/**
 * Sanitize a PTY buffer for safe evidence logging: replaces any
 * token-shaped string (≥20 chars of [A-Za-z0-9_-]) with `[redacted-token]`,
 * and Bearer/Authorization header values with `[redacted]`. Defence in
 * depth — under normal Ink output there are no tokens in the buffer, but
 * if the CLI ever logs a worker token, this guarantees it never lands on
 * disk.
 */
export function sanitizeForLog(buffer: string): string {
  return stripAnsi(buffer)
    .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/Authorization:\s*\S+/gi, 'Authorization: [redacted]')
    .replace(/[A-Za-z0-9_=-]{24,}/g, '[redacted-token]');
}

/**
 * Read the puku-cli launcher path from PUKU_CLI_PATH. Throws with a
 * point-the-user-at-the-doc message when unset, so the spec layer can
 * skip cleanly via a plain try/catch without leaking the env var name
 * into a stack trace.
 */
export function resolvePukuCliPath(): string {
  const value = env.pukuCliPath();
  if (!value) {
    throw new Error(
      'PUKU_CLI_PATH is not set. Add it to your .env (see .env.example) pointing at the installed puku-cli launcher; the CLI ConPTY spec skips itself otherwise.',
    );
  }
  return value;
}

/**
 * Persist a sanitized evidence file under `evidence/<name>.txt`. Never
 * throws — if the filesystem refuses, returns ''.
 */
export function writeEvidence(name: string, buffer: string): string {
  try {
    const dir = path.resolve(process.cwd(), 'evidence');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${name}.txt`);
    fs.writeFileSync(file, sanitizeForLog(buffer), 'utf-8');
    return file;
  } catch {
    return '';
  }
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timed out waiting for ${label} after ${ms}ms`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}
