/**
 * @file
 * Step definitions for the Display Builder configuration of Webtheme.
 */


const assert = require('node:assert');
const { execSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { homedir } = require('node:os');
const path = require('node:path');
const { Given, When, Then } = require('@cucumber/cucumber');

const THEME_ROOT = path.resolve(__dirname, '..', '..');
const PROJECT_DIR =
  process.env.DRUPAL_PROJECT_DIR ||
  path.join(homedir(), 'workspace/test/webtheme');
const DRUSH = process.env.DRUSH || 'ddev drush';

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
  return execSync(`${DRUSH} php:eval 'eval(base64_decode("${encoded}"));'`, {
    cwd: PROJECT_DIR,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

/**
 * Example: Then the configuration "display_builder.profile.webtheme" should exist
 */
Then(/^the configuration "([^"]*)" should exist$/, function configExists(name) {
  const found = php(
    `echo \\Drupal::configFactory()->get('${name}')->isNew() ? 'no' : 'yes';`,
  );
  assert.strictEqual(found, 'yes', `The configuration ${name} is missing.`);
});

/**
 * Example: Then the page layout "webtheme_sign_in" should be disabled
 */
Then(
  /^the page layout "([^"]*)" should be (enabled|disabled)$/,
  function pageLayoutStatus(id, status) {
    const found = php(
      `$layout = \\Drupal::entityTypeManager()->getStorage('page_layout')->load('${id}'); echo $layout ? ($layout->status() ? 'enabled' : 'disabled') : 'missing';`,
    );
    assert.strictEqual(found, status);
  },
);

/**
 * Creates a page layout from a fixture of the theme, replacing it.
 *
 * Example: Given the page layout "webtheme_test_landmarks" of the test fixtures exists
 */
Given(
  /^the page layout "([^"]*)" of the test fixtures exists$/,
  { timeout: 180000 },
  function createPageLayout(id) {
    const yaml = readFileSync(
      path.join(
        THEME_ROOT,
        'tests/fixtures',
        `display_builder_page_layout.page_layout.${id}.yml`,
      ),
      'utf8',
    );
    const encoded = Buffer.from(yaml).toString('base64');
    php(`$values = \\Drupal\\Component\\Serialization\\Yaml::decode(base64_decode('${encoded}'));
$storage = \\Drupal::entityTypeManager()->getStorage('page_layout');
$storage->load($values['id'])?->delete();
$storage->create($values)->save();
drupal_flush_all_caches();`);
  },
);

/**
 * Example: Then the page layout "webtheme_test_landmarks" is deleted
 */
Then(
  /^the page layout "([^"]*)" is deleted$/,
  { timeout: 180000 },
  function deletePageLayout(id) {
    php(`\\Drupal::entityTypeManager()->getStorage('page_layout')->load('${id}')?->delete();
\\Drupal::entityTypeManager()->getStorage('display_builder_instance')->load('page_layout__${id}')?->delete();
drupal_flush_all_caches();`);
  },
);

/**
 * Picks the page layout of the sign-in screens in the theme settings.
 *
 * Example: When I pick the page layout "Sign-in screens" for the sign-in screens of the UIkit theme
 */
When(
  /^I pick the page layout "([^"]*)" for the sign-in screens of the UIkit theme$/,
  { timeout: 180000 },
  async function pickSignInPageLayout(label) {
    await this.page.goto(
      `${this.launchUrl}/admin/appearance/settings/webtheme`,
    );
    await this.page
      .locator('select[name="sign_in_page_layout"]')
      .selectOption({ label });
    await this.page
      .locator('input[type="submit"][value="Save configuration"]')
      .first()
      .click();
    await this.page.waitForLoadState('load');
    php('drupal_flush_all_caches();');
  },
);

/**
 * Example: Then the page should be drawn by the page layout "webtheme_sign_in"
 */
Then(
  /^the page should be drawn by the page layout "([^"]*)"$/,
  async function drawnByPageLayout(id) {
    const html = await this.page.content();
    assert.ok(
      html.includes(`Display Builder Page Layout: page_layout__${id}`),
      `The page is not drawn by the page layout ${id}.`,
    );
  },
);

/**
 * Checks that the last part of the page ends at the bottom of the window.
 *
 * Example: Then the footer should reach the bottom of the window
 */
Then(
  /^the footer should reach the bottom of the window$/,
  async function footerAtTheBottom() {
    const { bottom, height } = await this.page.evaluate(() => {
      const wrapper = document.querySelector('[data-off-canvas-main-canvas]');
      const footers = wrapper.querySelectorAll('footer, .uk-section-secondary');
      const last = footers[footers.length - 1];
      return {
        bottom: last.getBoundingClientRect().bottom + window.scrollY,
        height: Math.max(
          window.innerHeight,
          document.documentElement.scrollHeight,
        ),
      };
    });
    assert.ok(
      Math.abs(bottom - height) <= 2,
      `The footer ends at ${bottom}px in a page of ${height}px.`,
    );
  },
);

/**
 * Checks that a fixed bar of Drupal sits above the sticky navbar.
 *
 * Example: Then a ".node-preview-container" bar added to the page should be above the sticky navbar
 */
Then(
  /^an? "\.([a-z-]+)" bar added to the page should be above the sticky navbar$/,
  async function barAboveNavbar(name) {
    await this.page.locator('.uk-sticky').first().waitFor({
      state: 'attached',
      timeout: 15000,
    });
    const [bar, navbar] = await this.page.evaluate((className) => {
      const element = document.createElement('div');
      element.className = className;
      element.style.position = 'fixed';
      document.body.append(element);
      const found = [
        Number(getComputedStyle(element).zIndex),
        Number(getComputedStyle(document.querySelector('.uk-sticky')).zIndex),
      ];
      element.remove();
      return found;
    }, name);
    assert.ok(bar > navbar, `The bar is at ${bar}, the navbar at ${navbar}.`);
  },
);
