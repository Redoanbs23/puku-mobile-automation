import fs from 'node:fs';
import path from 'node:path';
import type { ChildProcess } from 'node:child_process';
import type { Frameworks } from '@wdio/types';
import { captureLogcat, startScreenRecording, stopScreenRecording, pullFile, removeDeviceFile } from '../utils/adb.js';
import { logger } from '../utils/logger.js';

const RESULTS_DIR = path.resolve(process.cwd(), 'test-results', 'failures');
const DEVICE_VIDEO_PATH = '/sdcard/test-failure.mp4';

let recording: ChildProcess | null = null;

function safeName(title: string): string {
  return title.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

/**
 * beforeTest hook: start an adb screen recording for every test. Only kept
 * (pulled from the device) if the test ends up failing — see onTestFailure.
 */
export function onTestStart(): void {
  recording = startScreenRecording(DEVICE_VIDEO_PATH);
}

/**
 * afterTest hook: on failure, capture screenshot, logcat, and the
 * in-progress screen recording. Black-box testing has no source access or
 * server-side observability (R6 in the test design), so these OS-level
 * artifacts are the only failure-triage signal available.
 */
export async function onTestFailure(
  test: Frameworks.Test,
  _context: unknown,
  result: Frameworks.TestResult,
): Promise<void> {
  const dir = path.join(RESULTS_DIR, safeName(test.fullTitle ?? test.title));

  if (!result.passed) {
    fs.mkdirSync(dir, { recursive: true });

    try {
      await browser.saveScreenshot(path.join(dir, 'screenshot.png'));
    } catch (err) {
      logger.error('Failed to capture screenshot', err);
    }

    try {
      fs.writeFileSync(path.join(dir, 'logcat.txt'), captureLogcat());
    } catch (err) {
      logger.error('Failed to capture logcat', err);
    }
  }

  if (recording) {
    stopScreenRecording(recording);
    recording = null;

    if (!result.passed) {
      try {
        pullFile(DEVICE_VIDEO_PATH, path.join(dir, 'recording.mp4'));
      } catch (err) {
        logger.error('Failed to pull screen recording', err);
      }
    }

    try {
      removeDeviceFile(DEVICE_VIDEO_PATH);
    } catch {
      // best-effort cleanup, not worth failing the test run over
    }
  }
}
