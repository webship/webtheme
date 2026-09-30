/**
 * @file
 * Step definitions for the fonts and the theme settings of Webtheme.
 */

const assert = require('node:assert');
const { execSync } = require('node:child_process');
const { homedir } = require('node:os');
const path = require('node:path');
const { Given, When, Then } = require('@cucumber/cucumber');

const PROJECT_DIR =
  process.env.DRUPAL_PROJECT_DIR ||
  path.join(homedir(), 'workspace/test/webtheme');
const DRUSH = process.env.DRUSH || 'ddev drush';

// A paragraph of plain English, long enough to fill several lines.
const PARAGRAPH =
  'A theme sets the type of a site before a visitor reads a word of it. The letters have to be easy to tell apart, the lines short enough to find the next one, and the space between them wide enough to keep the eye on its line. Readers with low vision, dyslexia or a small screen notice first when one of these is missing, and everyone reads faster when they are all in place. This paragraph is here to be measured: it fills the column of the page from one side to the other, line after line, and the longest line is counted.';

/**
 * Picks a radio button or a checkbox of the theme settings, and saves.
 *
 * Example: When I pick "The fonts of the operating system" in the settings of the UIkit theme
 * Example: When I clear "Sticky navbar" in the settings of the UIkit theme
 */
When(
  /^I (pick|clear) "([^"]*)" in the settings of the UIkit theme$/,
  { timeout: 180000 },
  async function pickThemeSetting(action, label) {
    await this.page.goto(
      `${this.launchUrl}/admin/appearance/settings/webtheme`,
    );
    const control = this.page
      .getByRole('radio', { name: label, exact: true })
      .or(this.page.getByRole('checkbox', { name: label, exact: true }))
      .first();
    await control.waitFor({ state: 'attached', timeout: 15000 });
    // A control can sit in a closed group: set it without a click.
    await control.evaluate((element, checked) => {
      element.checked = checked;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }, action === 'pick');
    await this.page
      .locator('input[type="submit"][value="Save configuration"]')
      .first()
      .click();
    await this.page.waitForLoadState('load');
    execSync(`${DRUSH} cache:rebuild`, {
      cwd: PROJECT_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  },
);

/**
 * Keeps the requests of the pages opened after this step.
 *
 * Example: Given I record the requests of the page
 */
Given(/^I record the requests of the page$/, async function recordRequests() {
  this.recordedRequests = [];
  this.page.on('response', (response) => {
    this.recordedRequests.push({
      url: response.url(),
      status: response.status(),
    });
  });
});

/**
 * Waits for the fonts the page uses.
 *
 * Example: When the fonts of the page are loaded
 */
When(/^the fonts of the page are loaded$/, async function fontsAreLoaded() {
  await this.page.evaluate(() => document.fonts.ready);
  await this.page.waitForLoadState('networkidle');
});

/**
 * Checks a recorded request: its count, its status and where it was served.
 *
 * Example: Then the file "atkinson-hyperlegible-next-latin-wght-normal.woff2" should be requested once, with the status 200, from "/webtheme/assets/fonts/"
 */
Then(
  /^the file "([^"]*)" should be requested once, with the status (\d+), from "([^"]*)"$/,
  async function fileIsRequestedOnce(file, status, folder) {
    const found = (this.recordedRequests || []).filter(({ url }) =>
      new URL(url).pathname.endsWith(`/${file}`),
    );
    assert.strictEqual(
      found.length,
      1,
      `"${file}" was requested ${found.length} times.`,
    );
    assert.strictEqual(found[0].status, Number(status));
    assert.ok(
      found[0].url.startsWith(this.launchUrl) && found[0].url.includes(folder),
      `"${file}" was served from ${found[0].url}.`,
    );
  },
);

/**
 * Checks that no recorded request matches a text: a host, a file extension.
 *
 * Example: Then no request should go to "fonts.googleapis.com"
 * Example: Then no request should go to ".woff2"
 */
Then(
  /^no request should go to "([^"]*)"$/,
  async function noRequestGoesTo(text) {
    assert.ok(this.recordedRequests, 'The requests were not recorded.');
    const found = this.recordedRequests
      .map(({ url }) => url)
      .filter((url) => url.includes(text));
    assert.deepStrictEqual(found, []);
  },
);

/**
 * Checks the computed style of an element added to the page for the check.
 *
 * Example: Then a "code" element added to "main" should have the computed style "font-family" containing "Atkinson Hyperlegible Mono"
 */
Then(
  /^an? "([a-z0-9]+)" element added to "([^"]*)" should have the computed style "([^"]*)" containing "([^"]*)"$/,
  async function addedElementHasStyle(tag, selector, property, expected) {
    const parent = this.page.locator(selector).first();
    await parent.waitFor({ state: 'attached', timeout: 15000 });
    const actual = await parent.evaluate(
      (element, [name, style]) => {
        const added = document.createElement(name);
        added.textContent = 'Sample 0O 1lI';
        element.append(added);
        const value = getComputedStyle(added).getPropertyValue(style);
        added.remove();
        return value;
      },
      [tag, property],
    );
    assert.ok(
      actual.includes(expected),
      `Computed "${property}" of the added "${tag}" is "${actual}".`,
    );
  },
);

/**
 * Counts the characters of the lines of a paragraph (WCAG 1.4.8).
 *
 * A paragraph of plain English is added to the element, and each of its
 * characters is placed on its line.
 *
 * Example: Then a paragraph in "main" should have at most 80 characters per line
 */
Then(
  /^a paragraph in "([^"]*)" should have at most (\d+) characters per line$/,
  async function paragraphLineLength(selector, maximum) {
    const parent = this.page.locator(selector).first();
    await parent.waitFor({ state: 'attached', timeout: 15000 });
    await this.page.evaluate(() => document.fonts.ready);
    const lines = await parent.evaluate((element, text) => {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      element.append(paragraph);
      const node = paragraph.firstChild;
      const range = document.createRange();
      const counts = new Map();
      for (let index = 0; index < text.length; index++) {
        range.setStart(node, index);
        range.setEnd(node, index + 1);
        const rect = range.getBoundingClientRect();
        if (rect.width > 0) {
          const line = Math.round(rect.top);
          counts.set(line, (counts.get(line) || 0) + 1);
        }
      }
      paragraph.remove();
      return [...counts.values()];
    }, PARAGRAPH);
    assert.ok(lines.length > 2, `The paragraph has ${lines.length} lines.`);
    const longest = Math.max(...lines);
    assert.ok(
      longest <= Number(maximum),
      `The longest line has ${longest} characters: ${lines.join(', ')}.`,
    );
  },
);
