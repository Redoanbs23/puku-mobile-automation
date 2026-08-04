import 'dotenv/config';
import type { Options } from '@wdio/types';
import { onTestStart, onTestFailure } from '../src/hooks/failure-capture.js';

export const sharedConfig: Partial<Options.Testrunner> = {
  runner: 'local',
  specs: ['../tests/specs/**/*.spec.ts'],
  maxInstances: 1,
  logLevel: 'info',
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  framework: 'mocha',
  reporters: [
    'spec',
    [
      'junit',
      {
        outputDir: './test-results/junit',
        outputFileFormat: (opts: { cid: string }) => `results-${opts.cid}.xml`,
      },
    ],
    [
      'allure',
      {
        outputDir: './allure-results',
        disableWebdriverStepsReporting: false,
        disableWebdriverScreenshotsReporting: false,
      },
    ],
  ],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
  },
  beforeTest: onTestStart,
  afterTest: onTestFailure,
};
