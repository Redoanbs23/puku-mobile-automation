import { execFileSync } from 'node:child_process';
import { deviceArgs } from './adb.js';

/**
 * Types text into whatever input field currently has focus, via real
 * keyboard/IME input events (`adb shell input text`) rather than
 * WebdriverIO's standard setValue().
 *
 * WHY THIS EXISTS: WebdriverIO's setValue() (the WebDriver `element/value`
 * endpoint) invokes the accessibility layer's "setText" action. Flutter
 * maintains an accessibility/semantics tree in parallel with its actual
 * rendered widget tree, and for custom-rendered widgets (PUKU's chat
 * input is exposed as an android.widget.EditText purely via semantics,
 * not a real native EditText), that semantics action does not forward to
 * the widget's real TextEditingController. The practical symptom:
 * setValue() reports success, an accessibility dump shows the text as
 * set, but the on-screen widget never updates and stays visibly empty.
 * Confirmed live against RF8T802226Y on 2026-08-06 while unblocking
 * CHAT-E2E-002 (see ai-log/lessons-learned.md) — that cost real
 * debugging time once; the point of this utility is that it doesn't
 * cost anyone that time again.
 *
 * The target field must already be focused (e.g. via a prior
 * WebdriverIO .click()) so the on-screen keyboard is showing — this
 * dispatches real keystrokes through the device's input system, entirely
 * outside of Appium/WebdriverIO.
 *
 * Only space-escaping is handled explicitly (adb's `input text` requires
 * literal spaces to arrive as `%s`). This has been validated live for
 * the simple, synthetic prompts docs/testing/test-message-convention.md
 * requires (including basic punctuation like `?`, `+`, `:`, `[`, `]`) —
 * but text containing shell-special characters (`; & | $ \` ( ) " '`)
 * has not been validated against the device's remote shell and may
 * behave unexpectedly. Keep injected text simple and synthetic, which
 * the convention doc already requires anyway.
 */
export function typeRealText(text: string): void {
  const encoded = text.replace(/ /g, '%s');
  execFileSync('adb', [...deviceArgs(), 'shell', 'input', 'text', encoded]);
}
