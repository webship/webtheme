/**
 * @file
 * Custom webship-js step definitions for the Webtheme theme.
 */

const assert = require('node:assert');
const { execSync } = require('node:child_process');
const { existsSync, readdirSync, readFileSync } = require('node:fs');
const { homedir } = require('node:os');
const path = require('node:path');
const { Given, When, Then } = require('@cucumber/cucumber');

const THEME_ROOT = path.resolve(__dirname, '..', '..');
const PROJECT_DIR = process.env.DRUPAL_PROJECT_DIR || path.join(homedir(), 'workspace/test/webtheme');
const DRUSH = process.env.DRUSH || 'ddev drush';

/**
 * Runs a Drush command on the test site and returns its output.
 */
function drush(command) {
  return execSync(`${DRUSH} ${command}`, { cwd: PROJECT_DIR, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

/**
 * Lists the UIkit components with their first variant.
 */
function uikitComponents() {
  const dir = path.join(THEME_ROOT, 'components');
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(path.join(dir, entry.name, `${entry.name}.component.yml`)))
    .map((entry) => {
      const yaml = readFileSync(path.join(dir, entry.name, `${entry.name}.component.yml`), 'utf8');
      const block = yaml.match(/^variants:\n((?:[ ]{2,}.*\n)+)/m);
      const variants = block ? [...block[1].matchAll(/^ {2}([a-z0-9_]+):\s*$/gm)].map((match) => match[1]) : [];
      return { id: entry.name, variant: variants[0] || 'default' };
    });
}

/**
 * Logs in as user 1 with a one-time login link, without the login form.
 *
 * Example: Given I am logged in as the Drupal administrator
 */
Given(/^I am logged in as the Drupal administrator$/, async function () {
  const link = drush('user:login --no-browser').split('\n').pop();
  await this.page.goto(`${this.launchUrl}${new URL(link).pathname}`);
  await this.page.waitForURL((url) => /\/user\/\d+/.test(url.pathname));
});

/**
 * Example: When the Drupal caches are rebuilt
 */
When(/^the Drupal caches are rebuilt$/, { timeout: 180000 }, function () {
  drush('cache:rebuild');
});

/**
 * Example: Then the computed style "background-color" of ".uk-navbar-container" should be "rgb(248, 248, 248)"
 */
Then(/^the computed style "([^"]*)" of "([^"]*)" should (be|contain) "([^"]*)"$/, async function (property, selector, operator, expected) {
  const locator = this.page.locator(selector).first();
  await locator.waitFor({ state: 'attached', timeout: 15000 });
  const actual = await locator.evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property);
  if (operator === 'be') {
    assert.strictEqual(actual.trim(), expected, `Computed "${property}" of "${selector}" is "${actual}".`);
  }
  else {
    assert.ok(actual.includes(expected), `Computed "${property}" of "${selector}" is "${actual}".`);
  }
});

/**
 * Checks that two visible elements share a row: their boxes overlap vertically.
 *
 * Example: Then ".uk-navbar-left .uk-logo" and ".uk-navbar-toggle" should be on the same row
 */
Then(/^"([^"]*)" and "([^"]*)" should be on the same row$/, async function (first, second) {
  const boxes = [];
  for (const selector of [first, second]) {
    const locator = this.page.locator(selector).first();
    await locator.waitFor({ state: 'visible', timeout: 15000 });
    boxes.push(await locator.boundingBox());
  }
  const [a, b] = boxes;
  const overlap = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  assert.ok(overlap > 0, `"${first}" (top ${a.y}) and "${second}" (top ${b.y}) are not on the same row.`);
});

/**
 * Example: Then the page should not scroll horizontally
 */
Then(/^the page should not scroll horizontally$/, async function () {
  const [scrollWidth, clientWidth] = await this.page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  assert.ok(scrollWidth <= clientWidth, `The page is ${scrollWidth}px wide in a ${clientWidth}px viewport.`);
});

/**
 * Example: Then "footer .webtheme-footer-copyright" should contain the current year
 */
Then(/^"([^"]*)" should contain the current year$/, async function (selector) {
  const locator = this.page.locator(selector).first();
  await locator.waitFor({ state: 'attached', timeout: 15000 });
  const text = await locator.textContent();
  const year = String(new Date().getFullYear());
  assert.ok(text.includes(year), `"${selector}" is "${text}", without ${year}.`);
});

/**
 * Example: Then the UIkit JavaScript version should be "3.25.22"
 */
Then(/^the UIkit JavaScript version should be "([^"]*)"$/, async function (expected) {
  await this.page.waitForFunction(() => typeof window.UIkit === 'function', null, { timeout: 15000 });
  assert.strictEqual(await this.page.evaluate(() => window.UIkit.version), expected);
});

/**
 * Example: When I set the "data-theme" attribute of the document to "dark"
 */
When(/^I set the "([^"]*)" attribute of the document to "([^"]*)"$/, async function (name, value) {
  await this.page.evaluate(([attribute, attributeValue]) => document.documentElement.setAttribute(attribute, attributeValue), [name, value]);
});

/**
 * Example: Then the HTMX library should be loaded
 */
Then(/^the HTMX library should be loaded$/, async function () {
  await this.page.waitForFunction(() => typeof window.htmx === 'object' && typeof window.Drupal?.htmx === 'object', null, { timeout: 15000 });
});

/**
 * Marks the current document, to detect full page reloads.
 *
 * Example: When I mark the current page
 */
When(/^I mark the current page$/, async function () {
  await this.page.evaluate(() => {
    window.__webthemeMarker = 'not-reloaded';
  });
});

/**
 * Example: Then the page should not have been reloaded
 * Example: Then the page should have been reloaded
 */
Then(/^the page should (not )?have been reloaded$/, async function (not) {
  await this.page.waitForLoadState('domcontentloaded');
  const marker = await this.page.evaluate(() => window.__webthemeMarker);
  if (not) {
    assert.strictEqual(marker, 'not-reloaded', 'The page was fully reloaded instead of being swapped by HTMX.');
  }
  else {
    assert.strictEqual(marker, undefined, 'The page was swapped by HTMX instead of a normal page load.');
  }
});

/**
 * Skips the scenario when a module is not enabled on the test site.
 *
 * Example: Given the "webform" module is enabled
 */
Given(/^the "([^"]*)" module is enabled$/, { timeout: 60000 }, function (module) {
  const enabled = drush('pm:list --status=enabled --field=name').split('\n').map((name) => name.trim());
  return enabled.includes(module) ? undefined : 'skipped';
});

/**
 * Follows a link to a path from the boosted page wrapper, as a visitor would.
 *
 * The link is added to the page for the test when the page has none.
 *
 * Example: When I navigate with HTMX to "/form/contact"
 */
When(/^I navigate with HTMX to "([^"]*)"$/, async function (target) {
  const selector = await this.page.evaluate((href) => {
    const wrapper = document.querySelector('[data-off-canvas-main-canvas]');
    let link = [...wrapper.querySelectorAll('a[href]')].find((element) => new URL(element.href).pathname === href && element.closest('[hx-boost]')?.getAttribute('hx-boost') === 'true' && element.checkVisibility());
    if (!link) {
      link = document.createElement('a');
      link.href = href;
      link.textContent = 'Test link';
      wrapper.prepend(link);
      window.htmx.process(link);
    }
    link.setAttribute('data-test-htmx-link', '');
    return '[data-test-htmx-link]';
  }, target);
  await this.page.locator(selector).first().click();
  await this.page.waitForURL((url) => url.pathname === target, { timeout: 15000 });
  await this.page.waitForLoadState('domcontentloaded');
});

/**
 * Moves the mouse over the page, as a visitor does before a submission.
 *
 * Example: When I move the mouse over the page
 */
When(/^I move the mouse over the page$/, async function () {
  await this.page.mouse.move(200, 200);
  await this.page.mouse.move(400, 300, { steps: 5 });
});

/**
 * Lets the browser submit a form without its own required field checks.
 *
 * Example: When I turn off the browser validation of "form.webform-submission-form"
 */
When(/^I turn off the browser validation of "([^"]*)"$/, async function (selector) {
  const form = this.page.locator(selector).first();
  await form.waitFor({ state: 'attached', timeout: 15000 });
  await form.evaluate((element) => {
    element.noValidate = true;
  });
});

/**
 * Example: Then the "contact" webform should have a submission from "visitor@example.com"
 */
Then(/^the "([^"]*)" webform should have a submission from "([^"]*)"$/, { timeout: 60000 }, function (webform, email) {
  const count = drush(`sql:query "SELECT COUNT(*) FROM webform_submission_data WHERE webform_id = '${webform}' AND name = 'email' AND value = '${email}'"`);
  assert.ok(Number.parseInt(count, 10) > 0, `No "${webform}" submission from ${email} is stored.`);
});

/**
 * Checks that the links to a path are rendered with or without hx-boost="false".
 *
 * Example: Then the links to "/user/logout" should be excluded from the HTMX navigation
 */
Then(/^the links to "([^"]*)" should (not )?be excluded from the HTMX navigation$/, async function (path, not) {
  const links = this.page.locator(`[data-off-canvas-main-canvas] a[href*="${path}"]`);
  await links.first().waitFor({ state: 'attached', timeout: 15000 });
  const values = await links.evaluateAll((elements) => elements.map((element) => element.closest('[hx-boost]').getAttribute('hx-boost')));
  const expected = not ? 'true' : 'false';
  assert.ok(values.every((value) => value === expected), `The hx-boost values of the links to "${path}" are ${values.join(', ')}.`);
});

/**
 * Example: Then the element "#main-content" should have the focus
 */
Then(/^the element "([^"]*)" should have the focus$/, async function (selector) {
  await this.page.waitForFunction((target) => document.activeElement?.matches(target), selector, { timeout: 15000 });
});

/**
 * Sets a UI Skins CSS variable of the theme from the CSS variables form.
 *
 * Example: When I set the UI Skins CSS variable "Primary background" of the UIkit theme to "#ff3300"
 */
When(/^I set the UI Skins CSS variable "([^"]*)" of the UIkit theme to "([^"]*)"$/, async function (variable, value) {
  await this.page.goto(`${this.launchUrl}/admin/appearance/css-variables/webtheme`);
  const input = this.page.locator(`input[name$="[${variable}][values_container][0][value]"]`).first();
  await input.waitFor({ state: 'attached', timeout: 15000 });
  // The variables are grouped in collapsed details and vertical tabs: set the
  // value of the color input directly.
  await input.evaluate((element, color) => {
    element.value = color;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
  await this.page.locator('#edit-submit, input[type="submit"][value="Save configuration"]').first().click();
  await this.page.waitForLoadState('load');
  drush('cache:rebuild');
});

/**
 * Selects a UI Skins theme (color mode) in the theme settings.
 *
 * Example: When I select the UI Skins theme "Dark" for the UIkit theme
 */
When(/^I select the UI Skins theme "([^"]*)" for the UIkit theme$/, async function (label) {
  await this.page.goto(`${this.launchUrl}/admin/appearance/settings/webtheme`);
  await this.page.locator('select[name="theme"]').selectOption({ label });
  await this.page.getByRole('button', { name: 'Save configuration' }).click();
  await this.page.waitForLoadState('load');
  drush('cache:rebuild');
});

/**
 * Visits the library page of every component.
 *
 * Example: Then every UIkit component page of the library should render without errors
 */
Then(/^every UIkit component page of the library should render without errors$/, { timeout: 600000 }, async function () {
  const failures = [];
  const errors = [];
  const onError = (error) => errors.push(error.message);
  this.page.on('pageerror', onError);
  const components = uikitComponents();
  assert.ok(components.length > 50, `Only ${components.length} components found.`);
  for (const { id } of components) {
    errors.length = 0;
    const response = await this.page.goto(`${this.launchUrl}/admin/appearance/ui/components/webtheme/${id}`);
    const body = await this.page.locator('body').innerText();
    if (response.status() !== 200) {
      failures.push(`${id}: HTTP ${response.status()}`);
    }
    else if (/error has occurred|Twig\\Error|Exception:/i.test(body)) {
      failures.push(`${id}: error message on the page`);
    }
    else if (errors.length) {
      failures.push(`${id}: ${errors.join(', ')}`);
    }
  }
  this.page.off('pageerror', onError);
  assert.deepStrictEqual(failures, []);
});

/**
 * Requests the Display Builder preview of every component.
 *
 * Example: Then every UIkit component should have a Display Builder preview
 */
Then(/^every UIkit component should have a Display Builder preview$/, { timeout: 300000 }, async function () {
  const failures = [];
  for (const { id, variant } of uikitComponents()) {
    const response = await this.page.request.get(`${this.launchUrl}/api/display-builder/component/webtheme:${id}/preview/${variant}`);
    const html = await response.text();
    if (response.status() !== 200 || !html.includes(`data-component-id="webtheme:${id}"`)) {
      failures.push(`${id} (${variant}): HTTP ${response.status()}`);
    }
  }
  assert.deepStrictEqual(failures, []);
});

/**
 * Deletes the default page layout if it exists.
 *
 * Display Builder keeps its page template in the runtime theme registry after
 * the deletion, so the caches are rebuilt too.
 *
 * Example: Given there is no default page layout
 */
Given(/^there is no default page layout$/, { timeout: 180000 }, async function () {
  // Check with a request first: a 404 page would be reported as a JavaScript
  // (console) error by the webship-js error tracking.
  const url = `${this.launchUrl}/admin/structure/page-layout/default/delete`;
  const exists = await this.page.request.get(url);
  if (exists.status() === 200) {
    await this.page.goto(url);
    await this.page.getByRole('button', { name: 'Delete' }).click();
    await this.page.waitForLoadState('load');
  }
  drush('cache:rebuild');
});

/**
 * Example: When I create the default page layout from the current site
 */
When(/^I create the default page layout from the current site$/, async function () {
  await this.page.goto(`${this.launchUrl}/admin/structure/page-layout/add-default`);
  await this.page.locator('input[name="starting_point"][value="theme"]').check();
  await this.page.getByRole('button', { name: 'Save' }).click();
  await this.page.waitForLoadState('load');
});
