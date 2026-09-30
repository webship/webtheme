/**
 * @file
 * Step definitions for the sign-in screens of Webtheme.
 *
 * A site can show the sign-in screens in another theme, like the Web Admin
 * module does with UIkit Admin. "the sign-in screens are shown by the UIkit
 * theme" hands them to this theme for the scenarios, and "the sign-in screens
 * are given back" (or the end of the run) puts the site back as it was.
 */

const assert = require('node:assert');
const { execSync } = require('node:child_process');
const { homedir } = require('node:os');
const path = require('node:path');
const { AfterAll, Given, When, Then } = require('@cucumber/cucumber');

const PROJECT_DIR =
  process.env.DRUPAL_PROJECT_DIR ||
  path.join(homedir(), 'workspace/test/webtheme');
const DRUSH = process.env.DRUSH || 'ddev drush';

/**
 * Runs a Drush command on the test site and returns its output.
 *
 * @param {string} command
 *   The Drush command and its arguments.
 *
 * @return {string}
 *   The output.
 */
function drush(command) {
  return execSync(`${DRUSH} ${command}`, {
    cwd: PROJECT_DIR,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

/**
 * Runs PHP on the test site, the code given in base64.
 *
 * @param {string} code
 *   PHP code, without the opening tag.
 *
 * @return {string}
 *   The output.
 */
function php(code) {
  const encoded = Buffer.from(code).toString('base64');
  return drush(`php:eval 'eval(base64_decode("${encoded}"));'`);
}

// The settings of the site before the scenarios changed them: null until
// then.
let saved = null;

// The blocks of the theme placed for the scenarios.
let placedBlocks = [];

/**
 * Puts back the administration theme and the sign-in settings of the site.
 */
function restore() {
  if (!saved) {
    return;
  }
  const values = JSON.stringify(saved);
  php(`$saved = json_decode('${values.replace(/'/g, "\\'")}', TRUE);
\\Drupal::configFactory()->getEditable('system.theme')->set('admin', $saved['admin'])->save();
$config = \\Drupal::configFactory()->getEditable('webtheme.settings');
foreach ($saved['settings'] as $key => $value) { $config->set($key, $value); }
$config->save();
if (\\Drupal::database()->schema()->tableExists('flood')) { \\Drupal::database()->delete('flood')->execute(); }`);
  if (placedBlocks.length) {
    php(`$storage = \\Drupal::entityTypeManager()->getStorage('block');
$storage->delete($storage->loadMultiple(${JSON.stringify(placedBlocks)}));`);
    placedBlocks = [];
  }
  drush('cache:rebuild');
  saved = null;
}

/**
 * Hands the sign-in screens to the UIkit theme.
 *
 * The Web Admin module shows them in UIkit Admin when it is the
 * administration theme: the administration theme becomes Claro for the
 * scenarios.
 *
 * Example: Given the sign-in screens are shown by the UIkit theme
 */
Given(
  /^the sign-in screens are shown by the UIkit theme$/,
  { timeout: 180000 },
  function signInScreensShownByTheTheme() {
    if (!saved) {
      saved = JSON.parse(
        php(`$settings = \\Drupal::config('webtheme.settings')->get();
$keep = [];
foreach ($settings as $key => $value) { if (str_starts_with($key, 'sign_in_')) { $keep[$key] = $value; } }
echo json_encode(['admin' => \\Drupal::config('system.theme')->get('admin'), 'settings' => $keep]);`),
      );
      if (saved.admin === 'uikit_admin') {
        drush('theme:install claro');
        drush('config:set system.theme admin claro -y');
        drush('cache:rebuild');
      }
    }
  },
);

/**
 * Clears the failed log in attempts and the anti-spam records of the site.
 *
 * Example: Given the failed attempts on the site are cleared
 */
Given(
  /^the failed attempts on the site are cleared$/,
  { timeout: 60000 },
  function clearAttempts() {
    php(`$schema = \\Drupal::database()->schema();
foreach (['flood', 'honeypot_user'] as $table) {
  if ($schema->tableExists($table)) { \\Drupal::database()->delete($table)->execute(); }
}`);
  },
);

/**
 * Places the blocks the theme ships, when the site has none of them.
 *
 * A site built with Display Builder page layouts can have an empty block
 * layout: the header and the footer of the sign-in screens come from it.
 *
 * Example: Given the blocks of the UIkit theme are placed
 */
Given(
  /^the blocks of the UIkit theme are placed$/,
  { timeout: 180000 },
  function placeBlocks() {
    const created = php(`use Drupal\\Component\\Serialization\\Yaml;
$storage = \\Drupal::entityTypeManager()->getStorage('block');
$path = \\Drupal::service('extension.list.theme')->getPath('webtheme') . '/config/optional';
$created = [];
foreach (glob($path . '/block.block.*.yml') as $file) {
  $values = Yaml::decode(file_get_contents($file));
  if (!$storage->load($values['id'])) {
    try { $storage->create($values)->save(); $created[] = $values['id']; } catch (\\Throwable $e) {}
  }
}
echo json_encode($created);`);
    placedBlocks = placedBlocks.concat(JSON.parse(created || '[]'));
    drush('cache:rebuild');
  },
);

/**
 * Skips the scenario unless the page is the sign-in page of the theme.
 *
 * Another theme, or a Display Builder page layout, can draw the sign-in
 * screens of a site.
 *
 * Example: Given the "/user/password" page is the sign-in page of the UIkit theme
 */
Given(
  /^the "([^"]*)" page is the sign-in page of the UIkit theme$/,
  async function isSignInPage(pagePath) {
    const response = await this.page.request.get(
      `${this.launchUrl}${pagePath}`,
    );
    const html = await response.text();
    return html.includes('class="webtheme-sign-in ')
      ? undefined
      : 'skipped';
  },
);

/**
 * Example: Then the sign-in screens are given back to the site
 */
Then(
  /^the sign-in screens are given back to the site$/,
  { timeout: 180000 },
  function signInScreensGivenBack() {
    restore();
  },
);

/**
 * Sets sign-in settings of the theme.
 *
 * Example: When the sign-in settings of the UIkit theme are:
 *   | sign_in_layout | end |
 *   | sign_in_header | 1   |
 */
When(
  /^the sign-in settings of the UIkit theme are:$/,
  { timeout: 120000 },
  function setSignInSettings(table) {
    const values = {};
    table.raw().forEach(([key, value]) => {
      values[key] = ['0', '1'].includes(value) ? value === '1' : value;
    });
    const encoded = JSON.stringify(values).replace(/'/g, "\\'");
    php(`$config = \\Drupal::configFactory()->getEditable('webtheme.settings');
foreach (json_decode('${encoded}', TRUE) as $key => $value) { $config->set($key, $value); }
$config->save();`);
  },
);

/**
 * Sets one sign-in setting of the theme.
 *
 * Example: When the sign-in setting "sign_in_layout" of the UIkit theme is "end"
 */
When(
  /^the sign-in setting "([^"]*)" of the UIkit theme is "([^"]*)"$/,
  { timeout: 120000 },
  function setSignInSetting(key, value) {
    const typed = ['0', '1'].includes(value) ? value === '1' : value;
    const encoded = JSON.stringify({ [key]: typed }).replace(/'/g, "\\'");
    php(`$config = \\Drupal::configFactory()->getEditable('webtheme.settings');
foreach (json_decode('${encoded}', TRUE) as $key => $value) { $config->set($key, $value); }
$config->save();`);
  },
);

/**
 * Checks that the page has one landmark of a role, or none.
 *
 * Example: Then the page should have 1 "main" landmark
 * Example: Then the page should have 0 "banner" landmarks
 */
Then(
  /^the page should have (\d+) "(main|banner|contentinfo|navigation)" landmarks?$/,
  async function landmarkCount(count, role) {
    const found = await this.page.getByRole(role).count();
    assert.strictEqual(found, Number(count), `${found} "${role}" landmarks.`);
  },
);

/**
 * Tries to log in with a wrong password, a number of times.
 *
 * Example: When I try to log in as "member" with a wrong password 6 times
 * Example: When I try to log in as "the first user" with a wrong password 6 times
 *
 * "the first user" is the account every site has, whatever its name.
 */
When(
  /^I try to log in as "([^"]*)" with a wrong password (\d+) times?$/,
  { timeout: 180000 },
  async function wrongPassword(account, times) {
    const name =
      account === 'the first user'
        ? String(drush('sql:query "SELECT name FROM users_field_data WHERE uid = 1"')).trim()
        : account;
    for (let attempt = 0; attempt < Number(times); attempt++) {
      // eslint-disable-next-line no-await-in-loop
      await this.page.goto(`${this.launchUrl}/user/login`);
      // eslint-disable-next-line no-await-in-loop
      await this.page.locator('#edit-name').fill(name);
      // eslint-disable-next-line no-await-in-loop
      await this.page.locator('#edit-pass').fill('not the password');
      // The honeypot of the form refuses a form sent too quickly.
      // eslint-disable-next-line no-await-in-loop
      await this.page.waitForTimeout(2500);
      // eslint-disable-next-line no-await-in-loop
      await this.page.locator('#edit-submit').click();
      // eslint-disable-next-line no-await-in-loop
      await this.page.waitForLoadState('load');
    }
  },
);

/**
 * Checks the HTTP status of a page, without a browser.
 *
 * Example: Then the page "/user/login" should answer with the status 403
 */
Then(
  /^the page "([^"]*)" should answer with the status (\d+)$/,
  async function pageStatus(pagePath, status) {
    const response = await this.page.request.get(
      `${this.launchUrl}${pagePath}`,
      { maxRedirects: 0 },
    );
    assert.strictEqual(response.status(), Number(status));
  },
);

/**
 * Checks that no class or token of another theme is on the page.
 *
 * Example: Then the page should have no class or token starting with "uikit-admin-"
 */
Then(
  /^the page should have no class or token starting with "([^"]*)"$/,
  async function noForeignNames(prefix) {
    const found = await this.page.evaluate((start) => {
      const names = new Set();
      document.querySelectorAll('[class]').forEach((element) => {
        element.classList.forEach((name) => {
          if (name.startsWith(start)) {
            names.add(name);
          }
        });
      });
      const style = getComputedStyle(document.documentElement);
      for (let index = 0; index < style.length; index++) {
        if (style[index].startsWith(`--${start}`)) {
          names.add(style[index]);
        }
      }
      return [...names];
    }, prefix);
    assert.deepStrictEqual(found, []);
  },
);

/**
 * Checks the order of the elements the keyboard reaches.
 *
 * Example: Then the keyboard should reach "#edit-name" before "#edit-pass"
 */
Then(
  /^the keyboard should reach "([^"]*)" before "([^"]*)"$/,
  async function keyboardOrder(first, second) {
    // Start from the top of the page.
    await this.page.evaluate(() => {
      const start = document.createElement('div');
      start.tabIndex = -1;
      document.body.prepend(start);
      start.focus();
      start.remove();
    });
    const reached = [];
    for (let step = 0; step < 40; step++) {
      // eslint-disable-next-line no-await-in-loop
      await this.page.keyboard.press('Tab');
      // eslint-disable-next-line no-await-in-loop
      const match = await this.page.evaluate(
        ([one, two]) => {
          const element = document.activeElement;
          if (element?.matches(one)) {
            return 'first';
          }
          return element?.matches(two) ? 'second' : null;
        },
        [first, second],
      );
      if (match) {
        reached.push(match);
      }
      if (reached.includes('second')) {
        break;
      }
    }
    assert.deepStrictEqual(reached.slice(0, 2), ['first', 'second']);
  },
);

/**
 * Checks that an element sits inside the box of another one.
 *
 * Example: Then the element "button.shwpd" should sit inside the element "#edit-pass"
 */
Then(
  /^the element "([^"]*)" should sit inside the element "([^"]*)"$/,
  async function sitsInside(inner, outer) {
    const [a, b] = await Promise.all(
      [inner, outer].map((selector) =>
        this.page
          .locator(selector)
          .first()
          .evaluate((element) => {
            const rect = element.getBoundingClientRect();
            return [rect.left, rect.top, rect.right, rect.bottom];
          }),
      ),
    );
    assert.ok(
      a[0] >= b[0] - 1 &&
        a[1] >= b[1] - 1 &&
        a[2] <= b[2] + 1 &&
        a[3] <= b[3] + 1,
      `${inner} [${a.join(', ')}] is not inside ${outer} [${b.join(', ')}].`,
    );
  },
);

/**
 * Example: Then "#edit-name" should not have attribute "autofocus"
 */
Then(
  /^"([^"]*)" should not have attribute "([^"]*)"$/,
  async function hasNoAttribute(selector, name) {
    const element = this.page.locator(selector).first();
    await element.waitFor({ state: 'attached', timeout: 15000 });
    assert.strictEqual(await element.getAttribute(name), null);
  },
);

AfterAll({ timeout: 180000 }, function restoreSignInScreens() {
  restore();
});

/**
 * Example: Then the current page should be rendered by the UIkit theme
 */
Then(
  /^the current page should be rendered by the UIkit theme$/,
  async function () {
    await this.page.waitForLoadState('load');
    const theme = await this.page.evaluate(
      () => window.drupalSettings?.ajaxPageState?.theme,
    );
    assert.strictEqual(theme, 'webtheme', `The page is rendered by ${theme}.`);
  },
);
