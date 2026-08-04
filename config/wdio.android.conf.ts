import type { Options } from '@wdio/types';
import { localEnvironment } from './environments/local.js';

export const androidCapabilities = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:deviceName': localEnvironment.deviceName,
  'appium:platformVersion': localEnvironment.platformVersion,
  'appium:app': localEnvironment.appPath,
  'appium:appPackage': 'sh.puku.app',
  'appium:autoGrantPermissions': true,
  'appium:noReset': false,
};

export const androidServices: Options.Testrunner['services'] = [['appium', { args: { address: 'localhost', port: 4723 } }]];
