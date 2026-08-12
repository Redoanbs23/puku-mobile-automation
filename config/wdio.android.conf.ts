import type { Options } from '@wdio/types';
import { localEnvironment } from './environments/local.js';

// Physical device: target it explicitly by udid.
// No udid: fall back to the emulator, selected by AVD name (disambiguates
// even if a physical device happens to be attached at the same time).
const targetCapability = localEnvironment.udid
  ? { 'appium:udid': localEnvironment.udid }
  : { 'appium:avd': localEnvironment.deviceName };

export const androidCapabilities = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:deviceName': localEnvironment.deviceName,
  'appium:platformVersion': localEnvironment.platformVersion,
  'appium:app': localEnvironment.appPath,
  'appium:appPackage': 'sh.puku.app',
  'appium:autoGrantPermissions': true,
  // Default false, unchanged: every session resets app data, guaranteeing a
  // clean logged-out state (relied on by LOGIN-E2E-002, AUTH-E2E-015/016,
  // all of which expect to start from the login screen). Opt-in only:
  // APP_NO_RESET=true skips that reset so a session already logged in
  // (manually or otherwise) survives into the next test run. Needed for any
  // chat-core scenario that assumes an existing logged-in state rather than
  // re-running the OAuth flow itself. See docs/emulator-vs-device-comparison.md
  // (2026-08-07 entry) — discovered when this same default reset silently
  // wiped a manually-established emulator login between test invocations.
  'appium:noReset': process.env.APP_NO_RESET === 'true',
  ...targetCapability,
};

export const androidServices: Options.Testrunner['services'] = [
  ['appium', { args: { address: '127.0.0.1', port: 4723 } }],
];
