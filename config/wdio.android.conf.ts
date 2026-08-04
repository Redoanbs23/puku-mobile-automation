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
  'appium:noReset': false,
  ...targetCapability,
};

export const androidServices: Options.Testrunner['services'] = [['appium', { args: { address: '127.0.0.1', port: 4723 } }]];
