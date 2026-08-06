import { execSync, spawn, type ChildProcess } from 'node:child_process';

// Targets the device from DEVICE_UDID when set. Without it, a bare `adb`
// command fails with "more than one device/emulator" as soon as more than
// one device/emulator is attached — exactly the setup this project runs
// under (physical device + emulator both connected).
export function deviceArgs(): string[] {
  const udid = process.env.DEVICE_UDID;
  return udid ? ['-s', udid] : [];
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
