module.exports = {
  default: {
    timeout: 60000,
    // Re-run a failed scenario once. This rides out transient navigation
    // hiccups (a flaky `I navigate to …` under load) without masking real
    // failures: a deterministic error (e.g. an HTTP 500) fails both the
    // initial run and the retry, so it is still reported.
    retry: 1,
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
    worldParameters: {
      launchUrl: process.env.LAUNCH_URL || 'http://localhost',
      // Test users for the Drupal Standard profile roles. Webmaster is the
      // site-install super-admin (created by `drush site:install …
      // --account-name=webmaster --account-pass=dD.123123ddd`). The rest are
      // provisioned by `Given I add testing users` — see
      // tests/step-definitions/webtheme.steps.js — which iterates this
      // registry and skips entries flagged `isAdmin: true`.
      users: {
        "Webmaster": {
          "username": "webmaster",
          "email": "webmaster@example.test",
          "password": "dD.123123ddd",
          "isAdmin": true,
        },
        "Content editor": {
          "username": "content_editor_user",
          "email": "content_editor_user@example.test",
          "password": "dD.123123ddd",
          "roles": ["content_editor"],
        },
        "Authenticated user": {
          "username": "authenticated_user",
          "email": "authenticated_user@example.test",
          "password": "dD.123123ddd",
          "roles": [],
        },
      },
      minWaitTime: {
        page: 3000,
        before_scenario: 0,
        after_scenario: 0,
        before_step: 0,
        after_step: 0,
      },
      selectors: {
        css: {},
        xpath: {},
        filesPath: './tests/selectors/',
        files: [
          'cms-drupal-core-claro.json',
          'cms-drupal-cms-gin.json',
          'webtheme.json',
        ],
        offset: 60,
        breakpoints: {
          xs:  { width: 375,  height: 667  },
          sm:  { width: 576,  height: 800  },
          md:  { width: 768,  height: 1024 },
          lg:  { width: 992,  height: 768  },
          xl:  { width: 1200, height: 900, default: true },
          xxl: { width: 1400, height: 900 },
        },
      },
      screenshot: {
        dir: './tests/screenshots',
        purge: false,
        onFailed: true,
        onEveryStep: false,
        alwaysFullscreen: false,
        failedPrefix: 'failed_',
        filenamePattern: '{datetime}.{feature_file}.feature_{step_line}.{ext}',
        filenamePatternFailed: '{failed_prefix}{datetime}.{feature_file}.feature_{step_line}.{ext}',
        infoTypes: '',
      },
      video: {
        mode: 'on-failure',
        dir: './tests/videos',
        size: { width: 1280, height: 720 },
        filenamePattern: '{datetime}.{feature_file}.{scenario}.{status}.{ext}',
      },
      javascript: {
        mode: 'warn',
        levels: ['error'],
        ignore: '',
        beforeScenario: false,
        afterScenario: true,
      },
    },
  },
};
