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
  // Default matches the prod-release build tested locally/on-device all
  // along (sh.puku.app). CI overrides this to sh.puku.app.dev when
  // testing against the dev-release build fetched from the app repo's
  // latest release — confirmed via aapt (see ci.yml) that the dev variant
  // installs under a different applicationId, not sh.puku.app.
  appPackage: process.env.APP_PACKAGE ?? 'sh.puku.app',
  udid,
};
