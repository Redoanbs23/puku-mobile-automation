import { execSync, spawn, type ChildProcess } from 'node:child_process';

export function captureLogcat(lines = 500): string {
  return execSync(`adb logcat -d -t ${lines}`).toString();
}

export function startScreenRecording(devicePath: string, timeLimitSeconds = 180): ChildProcess {
  return spawn('adb', ['shell', 'screenrecord', '--time-limit', String(timeLimitSeconds), devicePath]);
}

export function stopScreenRecording(recording: ChildProcess): void {
  recording.kill('SIGINT');
}

export function pullFile(devicePath: string, localPath: string): void {
  execSync(`adb pull ${devicePath} ${localPath}`);
}

export function removeDeviceFile(devicePath: string): void {
  execSync(`adb shell rm -f ${devicePath}`);
}
