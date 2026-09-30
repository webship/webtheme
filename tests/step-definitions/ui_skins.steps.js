/**
 * @file
 * UI Skins step definitions for Webtheme.
 *
 * They read the design tokens from webtheme.ui_skins.css_variables.yml, so a
 * token added to the file is checked without a new scenario.
 */

const assert = require("node:assert");
const { execSync } = require("node:child_process");
const { readFileSync } = require("node:fs");
const { homedir } = require("node:os");
const path = require("node:path");
const { When, Then } = require("@cucumber/cucumber");

const THEME_ROOT = path.resolve(__dirname, "..", "..");
const PROJECT_DIR =
  process.env.DRUPAL_PROJECT_DIR ||
  path.join(homedir(), "workspace/test/webtheme");
const DRUSH = process.env.DRUSH || "ddev drush";
const DARK_SCOPE = ':root[data-theme="dark"]';

/**
 * Reads the design tokens of the theme.
 *
 * @return {Array<{id: string, type: string, description: string, defaults: Object<string, string>}>}
 *   The tokens, with their default value by scope.
 */
function designTokens() {
  const yaml = readFileSync(
    path.join(THEME_ROOT, "webtheme.ui_skins.css_variables.yml"),
    "utf8",
  );
  const tokens = [];
  let token = null;
  yaml.split("\n").forEach((line) => {
    const id = line.match(/^([a-z0-9-]+):\s*$/);
    if (id) {
      token = { id: id[1], type: "", description: "", defaults: {} };
      tokens.push(token);
      return;
    }
    if (!token) {
      return;
    }
    const property = line.match(/^ {2}(type|description): "(.*)"\s*$/);
    if (property) {
      token[property[1]] = property[2];
      return;
    }
    const value = line.match(
      /^ {4}(?:"([^"]+)"|'([^']+)'): (?:"(.*)"|'(.*)')\s*$/,
    );
    if (value) {
      token.defaults[value[1] || value[2]] = value[3] ?? value[4];
    }
  });
  return tokens;
}

/**
 * Checks the description and the field of every design token.
 *
 * Example: Then every UI Skins CSS variable of the UIkit theme should have a description and a field
 */
Then(
  /^every UI Skins CSS variable of the UIkit theme should have a description and a field$/,
  async function () {
    const tokens = designTokens();
    assert.ok(tokens.length > 40, `Only ${tokens.length} design tokens found.`);
    const names = await this.page
      .locator('input[name^="ui_skins_css_variables"]')
      .evaluateAll((elements) => elements.map((element) => element.name));
    const failures = [];
    tokens.forEach(({ id, description, defaults }) => {
      if (description.length < 20) {
        failures.push(`${id}: no description`);
      }
      Object.keys(defaults).forEach((scope, index) => {
        const field = `[${id}][values_container][${index}][value]`;
        if (!names.some((name) => name.includes(field))) {
          failures.push(`${id}: no field for ${scope}`);
        }
      });
    });
    assert.deepStrictEqual(failures, []);
  },
);

/**
 * Compares the defaults of UI Skins with the values the theme sets.
 *
 * Example: Then the defaults of the UI Skins CSS variables should be the values of the page in the "dark" color mode
 */
Then(
  /^the defaults of the UI Skins CSS variables should be the values of the page in the "(light|dark)" color mode$/,
  async function (mode) {
    const expected = designTokens().map(({ id, type, defaults }) => ({
      id,
      color: type === "color" || type === "ui_skins_alpha_color",
      value:
        mode === "dark" && DARK_SCOPE in defaults
          ? defaults[DARK_SCOPE]
          : defaults[":root"],
    }));
    const failures = await this.page.evaluate((tokens) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      const rgba = (color) => {
        context.clearRect(0, 0, 1, 1);
        context.fillStyle = color;
        context.fillRect(0, 0, 1, 1);
        return [...context.getImageData(0, 0, 1, 1).data].join(",");
      };
      // The aggregated CSS has no space after a comma.
      const plain = (value) =>
        value
          .trim()
          .replace(/\s+/g, " ")
          .replace(/\s*,\s*/g, ", ");
      const style = getComputedStyle(document.documentElement);
      // A default like var(--uk-font-family-sans) is read as that variable:
      // the page holds the value it points to.
      const resolve = (value) => {
        const reference = value.match(/^var\((--[a-z0-9-]+)\)$/);
        return reference
          ? resolve(style.getPropertyValue(reference[1]))
          : value;
      };
      return tokens
        .map(({ id, color, value }) => {
          const actual = style.getPropertyValue(`--${id}`);
          const expected = resolve(value);
          const same = color
            ? rgba(actual) === rgba(expected)
            : plain(actual) === plain(expected);
          return same ? null : `--${id}: "${plain(actual)}", not "${value}"`;
        })
        .filter(Boolean);
    }, expected);
    assert.deepStrictEqual(failures, []);
  },
);

/**
 * Sets the dark value of a design token from the CSS variables form.
 *
 * The dark color mode is the second scope of the variable.
 *
 * Example: When I set the UI Skins CSS variable "webtheme-global-link-color" of the UIkit theme to "#ffcc00" in the dark color mode
 */
When(
  /^I set the UI Skins CSS variable "([^"]*)" of the UIkit theme to "([^"]*)" in the dark color mode$/,
  { timeout: 180000 },
  async function (variable, value) {
    await this.page.goto(
      `${this.launchUrl}/admin/appearance/css-variables/webtheme`,
    );
    const input = this.page
      .locator(`input[name$="[${variable}][values_container][1][value]"]`)
      .first();
    await input.waitFor({ state: "attached", timeout: 15000 });
    await input.evaluate((element, color) => {
      element.value = color;
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    await this.page
      .locator('#edit-submit, input[type="submit"][value="Save configuration"]')
      .first()
      .click();
    await this.page.waitForLoadState("load");
    execSync(`${DRUSH} cache:rebuild`, {
      cwd: PROJECT_DIR,
      stdio: ["ignore", "pipe", "pipe"],
    });
  },
);

/**
 * Checks that emphasized text keeps the color of the text around it.
 *
 * The emphasis is added to the element for the check.
 *
 * Example: Then emphasized text in "main p" should have the color of its text
 */
Then(
  /^emphasized text in "([^"]*)" should have the color of its text$/,
  async function (selector) {
    const parent = this.page.locator(selector).first();
    await parent.waitFor({ state: "attached", timeout: 15000 });
    const colors = await parent.evaluate((element) => {
      const emphasis = document.createElement("em");
      emphasis.className = "placeholder";
      emphasis.textContent = "Emphasis";
      element.append(emphasis);
      const found = [
        getComputedStyle(element).color,
        getComputedStyle(emphasis).color,
      ];
      emphasis.remove();
      return found;
    });
    assert.strictEqual(colors[1], colors[0]);
  },
);
