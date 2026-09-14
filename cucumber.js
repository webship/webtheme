/**
 * @file
 * Webship-js (Cucumber-js + Playwright) configuration for Webtheme.
 *
 * Environment:
 * - LAUNCH_URL: the Drupal site running the theme
 *   (default https://webtheme.ddev.site).
 * - DRUSH: command running Drush for that site, used by the custom steps
 *   (default "ddev drush", run from DRUPAL_PROJECT_DIR).
 * - DRUPAL_PROJECT_DIR: the Drupal project directory
 *   (default ~/workspace/test/webtheme).
 */
module.exports = {
  default: {
    timeout: 60000,
    requireModule: ['tsx/cjs'],
    require: [
      'node_modules/webship-js/tests/step-definitions/**/*.js',
      'tests/step-definitions/**/*.js',
    ],
    paths: ['tests/features/**/*.feature'],
    format: [
      '@cucumber/pretty-formatter',
      'json:tests/reports/cucumber_report.json',
    ],
    formatOptions: {
      colorsEnabled: true,
      theme: {
        'feature keyword': ['bold', 'blue'],
        'feature name': ['blue', 'underline'],
        'feature description': ['blueBright'],
        'scenario keyword': ['bold', 'magenta'],
        'scenario name': ['magenta', 'underline'],
        'step keyword': ['bold', 'green'],
        'step text': ['greenBright', 'italic'],
      },
    },
    worldParameters: {
      launchUrl: process.env.LAUNCH_URL || 'https://webtheme.ddev.site',
      minWaitTime: {
        page: 1000,
        before_scenario: 0,
        after_scenario: 0,
        before_step: 0,
        after_step: 0,
      },
      selectors: {
        css: {},
        xpath: {},
        filesPath: './tests/selectors/',
        files: [],
        offset: 60,
        breakpoints: {
          xs: { width: 400, height: 800 },
          s: { width: 640, height: 900 },
          m: { width: 960, height: 900 },
          l: { width: 1200, height: 900, default: true },
          xl: { width: 1600, height: 1000 },
        },
      },
      screenshot: {
        dir: './screenshots',
        purge: false,
        onFailed: true,
        onEveryStep: false,
        alwaysFullscreen: false,
        failedPrefix: 'failed_',
        filenamePattern: '{datetime}.{feature_file}.feature_{step_line}.{ext}',
        filenamePatternFailed: '{failed_prefix}{datetime}.{feature_file}.feature_{step_line}.{ext}',
        infoTypes: '',
      },
      // Test users, created on the test site with:
      // drush user:create Admin --password=... && drush user:role:add administrator Admin
      users: {
        Admin: {
          name: 'Admin',
          email: 'test.admin@example.com',
          password: 'dD.123123ddd',
        },
        'Authenticated user': {
          name: 'Authenticated user',
          email: 'test.authenticated@example.com',
          password: 'dD.123123ddd',
        },
      },
    },
  },
};
