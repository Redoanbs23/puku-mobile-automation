import { execSync, spawn, type ChildProcess } from 'node:child_process';

/**
 * Targets the device from DEVICE_UDID when set. Without it, a bare `adb`
 * command fails with "more than one device/emulator" as soon as more than
 * one device/emulator is attached — exactly the setup this project runs
 * under (physical device + emulator both connected). Confirmed live on
 * 2026-08-06: LOGIN-E2E-002 passed against the emulator (Appium's own
 * `appium:avd` resolution is unambiguous — see config/wdio.android.conf.ts),
 * but this file's own bare adb calls in the failure-capture hooks (which
 * run on every test, not just failures) still hit the ambiguity, since
 * they had no way to disambiguate without DEVICE_UDID set.
 *
 * Resolution order when DEVICE_UDID is unset:
 * 1. Zero devices attached — nothing to disambiguate; let the bare `adb`
 *    call surface its own "no devices" error, a different failure mode.
 * 2. Exactly one device attached — target it explicitly anyway, so this
 *    stays unambiguous even if a second device gets attached later.
 * 3. Multiple devices, exactly one matching the emulator serial pattern
 *    (`emulator-<port>`) — prefer it. The emulator is this project's
 *    CI-safe, credential-free default (no physical device, no
 *    pre-authenticated account) — see the CI risk assessment weighing
 *    R2/R3/R8 against a self-hosted physical-device runner.
 * 4. Multiple devices, and not exactly one emulator match (zero, or more
 *    than one) — cannot safely guess. Throws rather than silently
 *    falling back to an unscoped call.
 */
export function deviceArgs(): string[] {
  const udid = process.env.DEVICE_UDID;
  if (udid) {
    return ['-s', udid];
  }

  const devices = listConnectedDeviceSerials();
  if (devices.length <= 1) {
    return devices.length === 1 ? ['-s', devices[0]] : [];
  }

  const emulators = devices.filter((serial) => /^emulator-\d+$/.test(serial));
  if (emulators.length === 1) {
    return ['-s', emulators[0]];
  }

  throw new Error(
    `Cannot disambiguate adb target: DEVICE_UDID is unset and ${devices.length} devices are attached ` +
      `(${devices.join(', ')}), with ${emulators.length} matching the emulator pattern. ` +
      'Set DEVICE_UDID explicitly, or ensure exactly one emulator is attached.',
  );
}

function listConnectedDeviceSerials(): string[] {
  return execSync('adb devices')
    .toString()
    .split('\n')
    .slice(1) // drop the "List of devices attached" header
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(/\s+/))
    .filter(([, status]) => status === 'device') // exclude offline/unauthorized entries
    .map(([serial]) => serial);
}

function adbCommand(...args: string[]): string {
  return ['adb', ...deviceArgs(), ...args].join(' ');
}

export function captureLogcat(lines = 500): string {
  return execSync(adbCommand('logcat', '-d', '-t', String(lines))).toString();
}

export function startScreenRecording(devicePath: string, timeLimitSeconds = 180): ChildProcess {
  return spawn('adb', [...deviceArgs(), 'shell', 'screenrecord', '--time-limit', String(timeLimitSeconds), devicePath]);
}

export function stopScreenRecording(recording: ChildProcess): void {
  recording.kill('SIGINT');
}

export function pullFile(devicePath: string, localPath: string): void {
  execSync(adbCommand('pull', devicePath, localPath));
}

export function removeDeviceFile(devicePath: string): void {
  execSync(adbCommand('shell', 'rm', '-f', devicePath));
}
