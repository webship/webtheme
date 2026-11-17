# Webtheme tests

The behaviour tests of Webtheme: Gherkin features run by
[webship-js](https://www.npmjs.com/package/webship-js) (Playwright and Cucumber)
with the Drupal steps of
[@webship-js/drupal-core-steps](https://www.npmjs.com/package/@webship-js/drupal-core-steps)
(the login by account handle). `cucumber.js` in the theme's root holds the
configuration; the custom steps run Drush for the site (`DRUSH`, from
`DRUPAL_PROJECT_DIR`) to set the theme's options and to put them back.

| Folder | What it holds |
| --- | --- |
| `features/` | the features (17 files, 116 scenarios) |
| `step-definitions/` | the theme's own steps |
| `fixtures/` | a page layout the Display Builder scenarios install and remove |
| `src/` | PHPUnit tests (Kernel and Unit) |
| `reports/` | what a run writes (not committed) |

## From nothing to a green run

### 1. A Webship site in DDEV

```bash
mkdir webship-site && cd webship-site
ddev config --project-type=drupal --docroot=web --database=mysql:8.0
ddev start
ddev composer create-project drupal/webship_project:12.0.x-dev
ddev restart
```

### 2. The site, with the test account and Webtheme as its theme

The suite logs in as the account `cucumber.js` lists in
`worldParameters.users`, the Webmaster the installer creates; it never
creates or deletes an account. Choose its password and keep it in your
environment:

```bash
export DRUPAL_ADMIN_PASS='…'
ddev drush site:install webship --account-name=webmaster --account-mail=webmaster@example.test --account-pass="$DRUPAL_ADMIN_PASS" -y
ddev drush theme:enable webtheme -y
ddev drush config:set system.theme default webtheme -y
ddev drush config:set system.performance css.preprocess 0 -y
ddev drush config:set system.performance js.preprocess 0 -y
ddev drush cache:rebuild
```

Aggregation is off so the asset steps see the URL of each library, as in CI.
CI builds the same with the Standard profile and the UI Suite modules (see
the `webship-js-test` job in `.gitlab-ci.yml`).

### 3. Run the suite

From the theme's folder, with Node.js 24 and Yarn 4 (through Corepack):

```bash
corepack enable
yarn install
npx playwright install chromium
export LAUNCH_URL=https://webship-site.ddev.site
export NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem"
export DRUPAL_PROJECT_DIR=/path/to/webship-site
export DRUSH="ddev drush"
export DRUPAL_LOGIN_WAIT=3000
yarn test --tags "not @wip"
```

`DRUPAL_LOGIN_WAIT` is for the login form of the Webship site, which Honeypot
protects with a time limit; `NODE_EXTRA_CA_CERTS` lets Node.js trust DDEV's
HTTPS certificate. `@role-switch` marks the scenarios that log in a
second time: the Webmaster changes a setting, a visitor sees the result, and
the Webmaster puts the setting back. A scenario skips itself when the site
lacks what it checks: the Contact module, or sign-in pages shown in Webtheme
(a Webship site shows them in the administration theme).

### 4. What green looks like

Every scenario passes or skips itself; no step fails or is undefined. On a
Webship site 12 scenarios skip themselves: 11 that need the sign-in pages in
Webtheme, and the core contact form one (no Contact module):

```
116 scenarios (12 skipped, 104 passed)
1026 steps (133 skipped, 893 passed)
```

The report is written to `tests/reports/`. The scenarios put back every
setting they change (the UI Skins values, the sign-in options, the page
layouts, the flood records), so a second run is green too.

## Test users

The account as `cucumber.js` lists it in `worldParameters.users`. The values
come from the environment variables named below; `CHANGE_ME` stands for the
password you chose in step 2.

```json
{
  "Webmaster": { "username": "webmaster", "password": "CHANGE_ME", "email": "webmaster@example.test", "isAdmin": true }
}
```

| Handle | Variables | The account |
| --- | --- | --- |
| Webmaster | `DRUPAL_ADMIN_USER`, `DRUPAL_ADMIN_PASS`, `DRUPAL_ADMIN_MAIL` | the account the installer created |
