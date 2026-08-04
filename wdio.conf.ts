import type { Options } from '@wdio/types';
import { sharedConfig } from './config/wdio.shared.conf.js';
import { androidCapabilities, androidServices } from './config/wdio.android.conf.js';

export const config: Options.Testrunner = {
  ...sharedConfig,
  capabilities: [androidCapabilities],
  services: androidServices,
} as Options.Testrunner;
