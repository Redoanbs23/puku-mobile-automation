import fs from 'node:fs';
import path from 'node:path';
import WDIOReporter, { type TestStats } from '@wdio/reporter';

const SUMMARY_PATH = path.resolve(process.cwd(), 'test-results', 'summary.txt');
const RAW_PATH = path.resolve(process.cwd(), 'test-results', 'summary.raw.txt');

export function resetRunSummary(): void {
  fs.mkdirSync(path.dirname(SUMMARY_PATH), { recursive: true });
  fs.writeFileSync(RAW_PATH, '');
  fs.writeFileSync(SUMMARY_PATH, `Run started: ${new Date().toISOString()}\n`);
}

function writeRaw(status: string, title: string): void {
  fs.appendFileSync(RAW_PATH, `${status}\t${title}\n`);
}

/** Group PASSED / FAILED / SKIPPED so each section is easy to find. */
export function finalizeRunSummary(): void {
  const raw = fs.existsSync(RAW_PATH) ? fs.readFileSync(RAW_PATH, 'utf8') : '';
  const lines = raw.split('\n').filter(Boolean);
  const passed = lines.filter((l) => l.startsWith('PASSED'));
  const failed = lines.filter((l) => l.startsWith('FAILED'));
  const skipped = lines.filter((l) => l.startsWith('SKIPPED'));

  const started = fs.existsSync(SUMMARY_PATH)
    ? fs.readFileSync(SUMMARY_PATH, 'utf8').split('\n')[0]
    : `Run started: ${new Date().toISOString()}`;

  fs.writeFileSync(
    SUMMARY_PATH,
    [
      started,
      '',
      `Totals: ${passed.length} passed, ${failed.length} failed, ${skipped.length} skipped`,
      '',
      '=== PASSED ===',
      ...(passed.length ? passed : ['(none)']),
      '',
      '=== FAILED ===',
      ...(failed.length ? failed : ['(none)']),
      '',
      '=== SKIPPED ===',
      ...(skipped.length ? skipped : ['(none)']),
      '',
    ].join('\n'),
  );
  if (fs.existsSync(RAW_PATH)) fs.unlinkSync(RAW_PATH);
}

/** Captures it.skip via reporter events (afterTest never runs for those). */
export default class SummaryReporter extends WDIOReporter {
  onTestPass(test: TestStats): void {
    writeRaw('PASSED', test.title);
  }

  onTestFail(test: TestStats): void {
    writeRaw('FAILED', test.title);
  }

  onTestSkip(test: TestStats): void {
    writeRaw('SKIPPED', test.title);
  }
}
