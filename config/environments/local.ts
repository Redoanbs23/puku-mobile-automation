import { execSync } from 'node:child_process';
import path from 'node:path';

// Absolute path, resolved from the project root — relative paths here are
// ambiguous (they get resolved against whatever process/CWD Appium ends up
// running in, not against this file's location).
const DEFAULT_APK_PATH = path.resolve(process.cwd(), 'apk', 'puku.apk');

const udid = process.env.DEVICE_UDID;

// Physical device + no explicit override: ask adb what it's actually running
// instead of trusting the emulator-tuned default below.
function detectPlatformVersion(deviceUdid: string): string | undefined {
  try {
    return (
      execSync(`adb -s ${deviceUdid} shell getprop ro.build.version.release`, {
        stdio: ['ignore', 'pipe', 'ignore'],
      })
        .toString()
        .trim() || undefined
    );
  } catch {
    return undefined;
  }
}

export const localEnvironment = {
  deviceName: process.env.DEVICE_NAME ?? 'Pixel_7',
  platformVersion: process.env.PLATFORM_VERSION ?? (udid && detectPlatformVersion(udid)) ?? '14',
  appPath: process.env.PUKU_APK_PATH ?? DEFAULT_APK_PATH,
  udid,
};
