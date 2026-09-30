/**
 * @file
 * Custom webship-js step definitions for the Webtheme theme.
 */

// The steps drive one browser page: the loops wait for each action in turn.
/* eslint-disable no-await-in-loop, no-restricted-syntax */

const assert = require("node:assert");
const { execSync } = require("node:child_process");
const { existsSync, readdirSync, readFileSync } = require("node:fs");
const { createRequire } = require("node:module");
const { homedir } = require("node:os");
const path = require("node:path");
const {
  After,
  AfterAll,
  Before,
  Given,
  When,
  Then,
} = require("@cucumber/cucumber");

const THEME_ROOT = path.resolve(__dirname, "..", "..");
const PROJECT_DIR =
  process.env.DRUPAL_PROJECT_DIR ||
  path.join(homedir(), "workspace/test/webtheme");
const DRUSH = process.env.DRUSH || "ddev drush";

/**
 * Runs a Drush command on the test site and returns its output.
 */
function drush(command) {
  return execSync(`${DRUSH} ${command}`, {
    cwd: PROJECT_DIR,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

/**
 * Quotes a value as one shell argument.
 */
function shellArgument(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

/**
 * Reads a configuration value of the test site.
 */
function configValue(name, key) {
  const output = JSON.parse(drush(`config:get ${name} ${key} --format=json`));
  return output[`${name}:${key}`];
}

/**
 * Loads axe-core for Playwright, a dependency of webship-js.
 */
function axeBuilder() {
  const webshipRequire = createRequire(
    require.resolve("webship-js/package.json"),
  );
  return webshipRequire("@axe-core/playwright").default;
}

/**
 * Lists the UIkit components with their first variant.
 */
function uikitComponents() {
  const dir = path.join(THEME_ROOT, "components");
  return readdirSync(dir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        existsSync(path.join(dir, entry.name, `${entry.name}.component.yml`)),
    )
    .map((entry) => {
      const yaml = readFileSync(
        path.join(dir, entry.name, `${entry.name}.component.yml`),
        "utf8",
      );
      const block = yaml.match(/^variants:\n((?:[ ]{2,}.*\n)+)/m);
      const variants = block
        ? [...block[1].matchAll(/^ {2}([a-z0-9_]+):\s*$/gm)].map(
            (match) => match[1],
          )
        : [];
      return { id: entry.name, variant: variants[0] || "default" };
    });
}

/**
 * Logs in as user 1 with a one-time login link, without the login form.
 *
 * Example: Given I am logged in as the Drupal administrator
 */
Given(/^I am logged in as the Drupal administrator$/, async function () {
  const link = drush("user:login --no-browser").split("\n").pop();
  await this.page.goto(`${this.launchUrl}${new URL(link).pathname}`);
  await this.page.waitForURL((url) => /\/user\/\d+/.test(url.pathname));
});

/**
 * Example: When the Drupal caches are rebuilt
 */
When(/^the Drupal caches are rebuilt$/, { timeout: 180000 }, function () {
  drush("cache:rebuild");
});

/**
 * Example: Then the computed style "background-color" of ".uk-navbar-container" should be "rgb(248, 248, 248)"
 */
Then(
  /^the computed style "([^"]*)" of "([^"]*)" should (be|contain) "([^"]*)"$/,
  async function (property, selector, operator, expected) {
    const locator = this.page.locator(selector).first();
    await locator.waitFor({ state: "attached", timeout: 15000 });
    const actual = await locator.evaluate(
      (element, name) => getComputedStyle(element).getPropertyValue(name),
      property,
    );
    if (operator === "be") {
      assert.strictEqual(
        actual.trim(),
        expected,
        `Computed "${property}" of "${selector}" is "${actual}".`,
      );
    } else {
      assert.ok(
        actual.includes(expected),
        `Computed "${property}" of "${selector}" is "${actual}".`,
      );
    }
  },
);

/**
 * Checks that two visible elements share a row: their boxes overlap vertically.
 *
 * Example: Then ".uk-navbar-left .uk-logo" and ".uk-navbar-toggle" should be on the same row
 */
Then(
  /^"([^"]*)" and "([^"]*)" should be on the same row$/,
  async function (first, second) {
    const boxes = [];
    for (const selector of [first, second]) {
      const locator = this.page.locator(selector).first();
      await locator.waitFor({ state: "visible", timeout: 15000 });
      boxes.push(await locator.boundingBox());
    }
    const [a, b] = boxes;
    const overlap =
      Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
    assert.ok(
      overlap > 0,
      `"${first}" (top ${a.y}) and "${second}" (top ${b.y}) are not on the same row.`,
    );
  },
);

/**
 * Example: Then the page should not scroll horizontally
 */
Then(/^the page should not scroll horizontally$/, async function () {
  const [scrollWidth, clientWidth] = await this.page.evaluate(() => [
    document.documentElement.scrollWidth,
    document.documentElement.clientWidth,
  ]);
  assert.ok(
    scrollWidth <= clientWidth,
    `The page is ${scrollWidth}px wide in a ${clientWidth}px viewport.`,
  );
});

/**
 * Example: Then "footer .webtheme-footer-copyright" should contain the current year
 */
Then(/^"([^"]*)" should contain the current year$/, async function (selector) {
  const locator = this.page.locator(selector).first();
  await locator.waitFor({ state: "attached", timeout: 15000 });
  const text = await locator.textContent();
  const year = String(new Date().getFullYear());
  assert.ok(
    text.includes(year),
    `"${selector}" is "${text}", without ${year}.`,
  );
});

/**
 * Example: Then the UIkit JavaScript version should be "3.25.22"
 */
Then(
  /^the UIkit JavaScript version should be "([^"]*)"$/,
  async function (expected) {
    await this.page.waitForFunction(
      () => typeof window.UIkit === "function",
      null,
      { timeout: 15000 },
    );
    assert.strictEqual(
      await this.page.evaluate(() => window.UIkit.version),
      expected,
    );
  },
);

/**
 * Waits for the end of the CSS transitions, like the color transitions that
 * follow a change of color mode: axe would read the colors half way.
 */
async function transitionsEnd(page) {
  await page.evaluate(() =>
    Promise.race([
      Promise.all(
        document
          .getAnimations()
          .filter((animation) => animation instanceof window.CSSTransition)
          .map((animation) => animation.finished.catch(() => null)),
      ),
      new Promise((resolve) => {
        setTimeout(resolve, 3000);
      }),
    ]),
  );
}

/**
 * Sets an attribute of the document, then waits for the CSS transitions.
 *
 * Example: When I set the "data-theme" attribute of the document to "dark"
 */
When(
  /^I set the "([^"]*)" attribute of the document to "([^"]*)"$/,
  async function (name, value) {
    await this.page.evaluate(
      ([attribute, attributeValue]) =>
        document.documentElement.setAttribute(attribute, attributeValue),
      [name, value],
    );
    await transitionsEnd(this.page);
  },
);

/**
 * Example: Then the HTMX library should be loaded
 */
Then(/^the HTMX library should be loaded$/, async function () {
  await this.page.waitForFunction(
    () =>
      typeof window.htmx === "object" &&
      typeof window.Drupal?.htmx === "object",
    null,
    { timeout: 15000 },
  );
});

/**
 * Marks the current document, to detect full page reloads.
 *
 * Example: When I mark the current page
 */
When(/^I mark the current page$/, async function () {
  await this.page.evaluate(() => {
    window.__webthemeMarker = "not-reloaded";
  });
});

/**
 * Example: Then the page should not have been reloaded
 * Example: Then the page should have been reloaded
 */
Then(/^the page should (not )?have been reloaded$/, async function (not) {
  await this.page.waitForLoadState("domcontentloaded");
  const marker = await this.page.evaluate(() => window.__webthemeMarker);
  if (not) {
    assert.strictEqual(
      marker,
      "not-reloaded",
      "The page was fully reloaded instead of being swapped by HTMX.",
    );
  } else {
    assert.strictEqual(
      marker,
      undefined,
      "The page was swapped by HTMX instead of a normal page load.",
    );
  }
});

/**
 * Skips the scenario when a module is not enabled on the test site.
 *
 * Example: Given the "webform" module is enabled
 */
Given(
  /^the "([^"]*)" module is enabled$/,
  { timeout: 60000 },
  function (module) {
    const enabled = drush("pm:list --status=enabled --field=name")
      .split("\n")
      .map((name) => name.trim());
    return enabled.includes(module) ? undefined : "skipped";
  },
);

/**
 * Follows a link to a path from the boosted page wrapper, as a visitor would.
 *
 * The link is added to the page for the test when the page has none.
 *
 * Example: When I navigate with HTMX to "/form/contact"
 */
When(/^I navigate with HTMX to "([^"]*)"$/, async function (target) {
  const selector = await this.page.evaluate((href) => {
    const wrapper = document.querySelector("[data-off-canvas-main-canvas]");
    let link = [...wrapper.querySelectorAll("a[href]")].find(
      (element) =>
        new URL(element.href).pathname === href &&
        element.closest("[hx-boost]")?.getAttribute("hx-boost") === "true" &&
        element.checkVisibility(),
    );
    if (!link) {
      link = document.createElement("a");
      link.href = href;
      link.textContent = "Test link";
      wrapper.prepend(link);
      window.htmx.process(link);
    }
    link.setAttribute("data-test-htmx-link", "");
    return "[data-test-htmx-link]";
  }, target);
  await this.page.locator(selector).first().click();
  await this.page.waitForURL((url) => url.pathname === target, {
    timeout: 15000,
  });
  await this.page.waitForLoadState("domcontentloaded");
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
When(
  /^I turn off the browser validation of "([^"]*)"$/,
  async function (selector) {
    const form = this.page.locator(selector).first();
    await form.waitFor({ state: "attached", timeout: 15000 });
    await form.evaluate((element) => {
      element.noValidate = true;
    });
  },
);

/**
 * Example: Then the "contact" webform should have a submission from "visitor@example.com"
 */
Then(
  /^the "([^"]*)" webform should have a submission from "([^"]*)"$/,
  { timeout: 60000 },
  function (webform, email) {
    const count = drush(
      `sql:query "SELECT COUNT(*) FROM webform_submission_data WHERE webform_id = '${webform}' AND name = 'email' AND value = '${email}'"`,
    );
    assert.ok(
      Number.parseInt(count, 10) > 0,
      `No "${webform}" submission from ${email} is stored.`,
    );
  },
);

/**
 * Checks that the links to a path are rendered with or without hx-boost="false".
 *
 * Example: Then the links to "/user/logout" should be excluded from the HTMX navigation
 */
Then(
  /^the links to "([^"]*)" should (not )?be excluded from the HTMX navigation$/,
  async function (path, not) {
    const links = this.page.locator(
      `[data-off-canvas-main-canvas] a[href*="${path}"]`,
    );
    await links.first().waitFor({ state: "attached", timeout: 15000 });
    const values = await links.evaluateAll((elements) =>
      elements.map((element) =>
        element.closest("[hx-boost]").getAttribute("hx-boost"),
      ),
    );
    const expected = not ? "true" : "false";
    assert.ok(
      values.every((value) => value === expected),
      `The hx-boost values of the links to "${path}" are ${values.join(", ")}.`,
    );
  },
);

/**
 * Example: Then the element "#main-content" should have the focus
 */
Then(
  /^the element "([^"]*)" should have the focus$/,
  async function (selector) {
    await this.page.waitForFunction(
      (target) => document.activeElement?.matches(target),
      selector,
      { timeout: 15000 },
    );
  },
);

/**
 * Turns off the HTTP cache of the browser for the scenario.
 *
 * A site can send the pages of the anonymous visitors with a max-age: the
 * browser would show the page of before a change of the settings.
 * Playwright turns the HTTP cache off when it routes the requests.
 */
async function withoutHttpCache(world) {
  if (!world.webthemeNoHttpCache) {
    await world.page.context().route("**/*", (route) => route.continue());
    world.webthemeNoHttpCache = true;
  }
}

/**
 * Sets a UI Skins CSS variable of the theme from the CSS variables form.
 *
 * Example: When I set the UI Skins CSS variable "Primary background" of the UIkit theme to "#ff3300"
 */
When(
  /^I set the UI Skins CSS variable "([^"]*)" of the UIkit theme to "([^"]*)"$/,
  async function (variable, value) {
    await withoutHttpCache(this);
    await this.page.goto(
      `${this.launchUrl}/admin/appearance/css-variables/webtheme`,
    );
    const input = this.page
      .locator(`input[name$="[${variable}][values_container][0][value]"]`)
      .first();
    await input.waitFor({ state: "attached", timeout: 15000 });
    // The variables are grouped in collapsed details and vertical tabs: set the
    // value of the color input directly.
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
    drush("cache:rebuild");
  },
);

/**
 * Sets the "Color mode" theme setting of the theme.
 *
 * Example: When I set the color mode of the UIkit theme to "Follow the operating system"
 */
When(
  /^I set the color mode of the UIkit theme to "([^"]*)"$/,
  async function (label) {
    await withoutHttpCache(this);
    await this.page.goto(
      `${this.launchUrl}/admin/appearance/settings/webtheme`,
    );
    await this.page.getByRole("radio", { name: label, exact: true }).check();
    await this.page.getByRole("button", { name: "Save configuration" }).click();
    await this.page.waitForLoadState("load");
    drush("cache:rebuild");
  },
);

/**
 * Emulates the color scheme the operating system of the visitor asks for.
 *
 * Example: Given the operating system asks for the dark color scheme
 */
Given(
  /^the operating system asks for the (dark|light) color scheme$/,
  async function (scheme) {
    await this.page.emulateMedia({ colorScheme: scheme });
  },
);

/**
 * Visits the library page of every component.
 *
 * Example: Then every UIkit component page of the library should render without errors
 */
Then(
  /^every UIkit component page of the library should render without errors$/,
  { timeout: 600000 },
  async function () {
    const failures = [];
    const errors = [];
    const onError = (error) => errors.push(error.message);
    this.page.on("pageerror", onError);
    const components = uikitComponents();
    assert.ok(
      components.length > 50,
      `Only ${components.length} components found.`,
    );
    for (const { id } of components) {
      errors.length = 0;
      const response = await this.page.goto(
        `${this.launchUrl}/admin/appearance/ui/components/webtheme/${id}`,
      );
      const body = await this.page.locator("body").innerText();
      if (response.status() !== 200) {
        failures.push(`${id}: HTTP ${response.status()}`);
      } else if (/error has occurred|Twig\\Error|Exception:/i.test(body)) {
        failures.push(`${id}: error message on the page`);
      } else if (errors.length) {
        failures.push(`${id}: ${errors.join(", ")}`);
      }
    }
    this.page.off("pageerror", onError);
    assert.deepStrictEqual(failures, []);
  },
);

/**
 * Requests the Display Builder preview of every component.
 *
 * Example: Then every UIkit component should have a Display Builder preview
 */
Then(
  /^every UIkit component should have a Display Builder preview$/,
  { timeout: 300000 },
  async function () {
    const failures = [];
    for (const { id, variant } of uikitComponents()) {
      const response = await this.page.request.get(
        `${this.launchUrl}/api/display-builder/component/webtheme:${id}/preview/${variant}`,
      );
      const html = await response.text();
      if (
        response.status() !== 200 ||
        !html.includes(`data-component-id="webtheme:${id}"`)
      ) {
        failures.push(`${id} (${variant}): HTTP ${response.status()}`);
      }
    }
    assert.deepStrictEqual(failures, []);
  },
);

// The default page layout of the site before the first deletion, as JSON:
// null until then, an empty string when the site had none.
let sitePageLayout = null;

/**
 * Puts the default page layout of the site back, when a test deleted it.
 *
 * The page layout is created again with the values it had, and its Display
 * Builder instance is removed: Display Builder builds it again from them.
 */
function restoreSitePageLayout() {
  if (!sitePageLayout) {
    sitePageLayout = null;
    return;
  }
  const values = Buffer.from(sitePageLayout).toString("base64");
  drush(
    `php:eval ${shellArgument(`$storage = \\Drupal::entityTypeManager()->getStorage("page_layout"); $storage->load("default")?->delete(); \\Drupal::entityTypeManager()->getStorage("display_builder_instance")->load("page_layout__default")?->delete(); $storage->create(json_decode(base64_decode("${values}"), TRUE))->save();`)}`,
  );
  drush("cache:rebuild");
  sitePageLayout = null;
}

/**
 * Puts back the default page layout the site had before the tests.
 *
 * Example: Then the default page layout of the site is restored
 */
Then(
  /^the default page layout of the site is restored$/,
  { timeout: 180000 },
  function () {
    restoreSitePageLayout();
  },
);

AfterAll({ timeout: 180000 }, function () {
  restoreSitePageLayout();
});

/**
 * Deletes the default page layout if it exists.
 *
 * Display Builder keeps its page template in the runtime theme registry after
 * the deletion, so the caches are rebuilt too. The page layout the site had
 * is kept, and put back by "the default page layout of the site is restored"
 * or at the end of the run.
 *
 * Example: Given there is no default page layout
 */
Given(
  /^there is no default page layout$/,
  { timeout: 180000 },
  async function () {
    if (sitePageLayout === null) {
      sitePageLayout = drush(
        `php:eval ${shellArgument('echo json_encode(\\Drupal::entityTypeManager()->hasDefinition("page_layout") ? \\Drupal::entityTypeManager()->getStorage("page_layout")->load("default")?->toArray() : NULL);')}`,
      );
      if (sitePageLayout === "null") {
        sitePageLayout = "";
      }
    }
    // Check with a request first: a 404 page would be reported as a JavaScript
    // (console) error by the webship-js error tracking.
    const url = `${this.launchUrl}/admin/structure/page-layout/default/delete`;
    const exists = await this.page.request.get(url);
    if (exists.status() === 200) {
      await this.page.goto(url);
      await this.page.getByRole("button", { name: "Delete" }).click();
      await this.page.waitForLoadState("load");
    }
    drush("cache:rebuild");
  },
);

/**
 * Example: When I create the default page layout from the current site
 */
When(
  /^I create the default page layout from the current site$/,
  async function () {
    await this.page.goto(
      `${this.launchUrl}/admin/structure/page-layout/add-default`,
    );
    await this.page
      .locator('input[name="starting_point"][value="theme"]')
      .check();
    await this.page.getByRole("button", { name: "Save" }).click();
    await this.page.waitForLoadState("load");
  },
);

/**
 * Lists the visible links, buttons and form controls of the page, as a
 * script added to the page (window.webthemeInteractive()).
 *
 * The links inside a sentence are left out: WCAG 2.5.5 exempts them.
 */
const INTERACTIVE_ELEMENTS = `window.webthemeInteractive = () => {
  const visible = (el) => {
    const style = getComputedStyle(el);
    const box = el.getBoundingClientRect();
    return style.visibility !== 'hidden' && style.display !== 'none' && box.width > 1 && box.height > 1
      && !el.closest('[aria-hidden="true"], [hidden], .visually-hidden, #toolbar-administration, .contextual');
  };
  const inSentence = (el) => {
    if (el.tagName !== 'A' || getComputedStyle(el).display !== 'inline') {
      return false;
    }
    const block = el.parentElement.closest('p, li, dd, td, blockquote, figcaption, label, span, .description, .view-empty, .text-formatted') || el.parentElement;
    return block && block.textContent.trim().length > el.textContent.trim().length + 3;
  };
  return [...document.querySelectorAll('a[href], button, input:not([type=hidden]), select, textarea')]
    .filter((el) => visible(el) && !inSentence(el) && !el.disabled);
};
window.webthemeContrast = (first, second) => {
  const luminance = (color) => {
    const [r, g, b] = color.match(/[\\d.]+/g).slice(0, 3).map((value) => {
      const channel = Number(value) / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
};`;

/**
 * WCAG 2.5.5 Target Size (Enhanced).
 *
 * Example: Then every link and button should be at least 44 by 44 pixels
 */
Then(
  /^every link and button should be at least (\d+) by (\d+) pixels$/,
  async function (width, height) {
    await this.page.addScriptTag({ content: INTERACTIVE_ELEMENTS });
    const small = await this.page.evaluate(
      ([w, h]) => {
        const elements = window.webthemeInteractive();
        // A checkbox or a radio is a target with its label: its form item.
        const target = (el) =>
          ["checkbox", "radio"].includes(el.type)
            ? el.closest(".form-type-checkbox, .form-type-radio, label") || el
            : el;
        return elements
          .map((el) => ({ el, box: target(el).getBoundingClientRect() }))
          .filter(
            ({ box }) =>
              Math.round(box.width) < w || Math.round(box.height) < h,
          )
          .map(
            ({ el, box }) =>
              `${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 3).join(".")} "${(el.innerText || el.value || el.getAttribute("aria-label") || "").trim().slice(0, 30)}" ${Math.round(box.width)}x${Math.round(box.height)}`,
          );
      },
      [Number(width), Number(height)],
    );
    assert.deepStrictEqual(
      small,
      [],
      `Targets smaller than ${width}x${height}:\n  ${small.join("\n  ")}`,
    );
  },
);

/**
 * WCAG 2.4.13 Focus Appearance: a solid outline of 2 pixels at least.
 *
 * Each element gets the focus from the keyboard (Tab), then its outline is
 * read.
 *
 * Example: Then the focus ring of every link and button should be solid and 2 pixels wide
 */
Then(
  /^the focus ring of every link and button should be solid and (\d+) pixels wide$/,
  async function (width) {
    await this.page.addScriptTag({ content: INTERACTIVE_ELEMENTS });
    await this.page.keyboard.press("Tab");
    const wrong = await this.page.evaluate((w) => {
      const elements = window.webthemeInteractive();
      const out = [];
      for (const el of elements) {
        el.focus();
        if (document.activeElement !== el) {
          continue;
        }
        const style = getComputedStyle(el);
        const halo = (style.boxShadow.match(/rgba?\([^)]+\)/) || [])[0];
        const ratio = halo
          ? window.webthemeContrast(style.outlineColor, halo)
          : 0;
        if (
          style.outlineStyle !== "solid" ||
          parseFloat(style.outlineWidth) < w ||
          ratio < 3
        ) {
          out.push(
            `${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 3).join(".")}: ${style.outlineStyle} ${style.outlineWidth}, ${ratio.toFixed(2)}:1 against its halo`,
          );
        }
        el.blur();
      }
      return out;
    }, Number(width));
    assert.deepStrictEqual(
      wrong,
      [],
      `Focus rings that are not solid or ${width}px:\n  ${wrong.join("\n  ")}`,
    );
  },
);

/**
 * WCAG 2.3.3: no transition or animation longer than 0.01s when reduced
 * motion is requested.
 *
 * Example: Then nothing should move when reduced motion is requested
 */
Then(
  /^nothing should move when reduced motion is requested$/,
  async function () {
    await this.page.emulateMedia({ reducedMotion: "reduce" });
    const moving = await this.page.evaluate(() =>
      [...document.querySelectorAll("body *")]
        .filter((el) => {
          const style = getComputedStyle(el);
          const longest = (value) =>
            Math.max(...value.split(",").map(parseFloat));
          return (
            longest(style.transitionDuration) > 0.01 ||
            (style.animationName !== "none" &&
              longest(style.animationDuration) > 0.01)
          );
        })
        .slice(0, 10)
        .map(
          (el) =>
            `${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 3).join(".")}`,
        ),
    );
    await this.page.emulateMedia({ reducedMotion: null });
    assert.deepStrictEqual(
      moving,
      [],
      `Elements still animated:\n  ${moving.join("\n  ")}`,
    );
  },
);

/**
 * The UI Skins settings of the theme, saved before a scenario tagged
 * @ui-skins and restored after it, even when it fails.
 */
let savedUiSkins = null;

// The "Color mode" theme setting before a @ui-skins scenario: null outside
// of one, an empty string when the site had none.
let savedColorMode = null;

/**
 * PHP code reading or restoring the UI Skins settings of the theme.
 *
 * The value travels as base64-encoded JSON: no quoting problem in the shell
 * of DDEV or of the CI.
 */
function uiSkinsCode(encoded) {
  if (encoded === undefined) {
    return "echo base64_encode(json_encode(\\Drupal::config('webtheme.settings')->get('third_party_settings.ui_skins')));";
  }
  return [
    "$config = \\Drupal::configFactory()->getEditable('webtheme.settings');",
    `$value = json_decode(base64_decode('${encoded}'), TRUE);`,
    "if ($value === NULL) { $config->clear('third_party_settings.ui_skins'); if (!$config->get('third_party_settings')) { $config->clear('third_party_settings'); } }",
    "else { $config->set('third_party_settings.ui_skins', $value); }",
    "$config->save();",
  ].join(" ");
}

Before({ tags: "@ui-skins", timeout: 60000 }, function () {
  savedUiSkins = drush(`php:eval ${shellArgument(uiSkinsCode())}`)
    .split("\n")
    .pop()
    .trim();
  savedColorMode = drush(
    `php:eval ${shellArgument("echo (string) \\Drupal::config('webtheme.settings')->get('color_mode');")}`,
  )
    .split("\n")
    .pop()
    .trim();
});

After({ tags: "@ui-skins", timeout: 180000 }, function () {
  if (savedColorMode !== null) {
    drush(
      savedColorMode
        ? `config:set webtheme.settings color_mode ${savedColorMode} --yes`
        : "config:delete webtheme.settings color_mode --yes",
    );
    savedColorMode = null;
  }
  if (savedUiSkins !== null) {
    drush(`php:eval ${shellArgument(uiSkinsCode(savedUiSkins))}`);
    drush("cache:rebuild");
    savedUiSkins = null;
  }
});

/**
 * Skips the scenario when a page is rendered by another theme than the
 * default one, like the user pages rendered by the administration theme.
 *
 * Example: Given the "/user/password" page is rendered by the default theme
 */
Given(
  /^the "([^"]*)" page is rendered by the default theme$/,
  { timeout: 60000 },
  async function (pagePath) {
    const response = await this.page.request.get(
      `${this.launchUrl}${pagePath}`,
    );
    const match = (await response.text()).match(
      /"ajaxPageState":\{[^}]*?"theme":"([a-z0-9_]+)"/,
    );
    return match && match[1] === configValue("system.theme", "default")
      ? undefined
      : "skipped";
  },
);

/**
 * Skips the scenario unless another theme renders the page on a full load,
 * like the sign-in pages that Web Admin shows in UIkit Admin.
 *
 * Example: Given the "/user/login" page is rendered by another theme than the default theme
 */
Given(
  /^the "([^"]*)" page is rendered by another theme than the default theme$/,
  { timeout: 60000 },
  async function (pagePath) {
    const response = await this.page.request.get(
      `${this.launchUrl}${pagePath}`,
    );
    const match = (await response.text()).match(
      /"ajaxPageState":\{[^}]*?"theme":"([a-z0-9_]+)"/,
    );
    return match && match[1] !== configValue("system.theme", "default")
      ? undefined
      : "skipped";
  },
);

/**
 * Example: Then the current page should not be rendered by the default theme
 */
Then(
  /^the current page should not be rendered by the default theme$/,
  { timeout: 60000 },
  async function () {
    await this.page.waitForLoadState("load");
    const theme = await this.page.evaluate(
      () => window.drupalSettings?.ajaxPageState?.theme,
    );
    assert.notStrictEqual(
      theme,
      configValue("system.theme", "default"),
      "The page is rendered by the default theme.",
    );
  },
);

/**
 * Example: Then "footer .webtheme-footer-copyright" should contain the site name
 */
Then(
  /^"([^"]*)" should contain the site name$/,
  { timeout: 60000 },
  async function (selector) {
    const name = configValue("system.site", "name");
    const locator = this.page.locator(selector).first();
    await locator.waitFor({ state: "attached", timeout: 15000 });
    const text = await locator.textContent();
    assert.ok(
      text.includes(name),
      `"${selector}" is "${text}", without the site name "${name}".`,
    );
  },
);

/**
 * Waits until an element no longer contains a text, like the title of the
 * previous page after an HTMX navigation.
 *
 * Example: Then "h1" should not contain text "Page not found" within 10 seconds
 */
Then(
  /^"([^"]*)" should not contain text "([^"]*)" within (\d+) seconds?$/,
  async function (selector, text, seconds) {
    await this.page.waitForFunction(
      ([target, unwanted]) => {
        const element = document.querySelector(target);
        return element && !element.textContent.includes(unwanted);
      },
      [selector, text],
      { timeout: Number(seconds) * 1000 },
    );
  },
);

/**
 * Presses a key until an element has the focus, as a keyboard user does.
 *
 * Example: When I press the key "Tab" until ".uk-navbar-toggle" has the focus
 */
When(
  /^I press the key "([^"]*)" until "([^"]*)" has the focus$/,
  async function (key, selector) {
    for (let presses = 0; presses < 80; presses++) {
      if (
        await this.page.evaluate(
          (target) => document.activeElement?.matches(target) ?? false,
          selector,
        )
      ) {
        return;
      }
      await this.page.keyboard.press(key);
    }
    assert.fail(
      `"${selector}" did not get the focus after 80 presses of ${key}.`,
    );
  },
);

/**
 * Example: Then the focused element should be inside ".uk-offcanvas-bar"
 */
Then(
  /^the focused element should be inside "([^"]*)"$/,
  async function (selector) {
    await this.page.waitForFunction(
      (target) => Boolean(document.activeElement?.closest(target)),
      selector,
      { timeout: 5000 },
    );
  },
);

/**
 * WCAG 2.5.5 Target Size (Enhanced), for one element.
 *
 * Example: Then ".uk-navbar-toggle" should be at least 44 by 44 pixels
 */
Then(
  /^"([^"]*)" should be at least (\d+) by (\d+) pixels$/,
  async function (selector, width, height) {
    const locator = this.page.locator(selector).first();
    await locator.waitFor({ state: "visible", timeout: 15000 });
    const box = await locator.boundingBox();
    assert.ok(
      Math.round(box.width) >= Number(width) &&
        Math.round(box.height) >= Number(height),
      `"${selector}" is ${Math.round(box.width)}x${Math.round(box.height)} pixels.`,
    );
  },
);

/**
 * Runs axe-core at a WCAG level on the stories of every component of the
 * library, in a color mode.
 *
 * Components drawn as a whole page, with their own main landmark, are checked
 * on the pages that use them: they are left out with "except".
 *
 * Example: Then every UIkit component story should pass an accessibility audit at level "AAA" in the "dark" color mode
 * Example: Then every UIkit component story should pass an accessibility audit at level "AAA" in the "dark" color mode except "page"
 */
Then(
  /^every UIkit component story should pass an accessibility audit at level "(AA|AAA)" in the "(light|dark)" color mode(?: except "([^"]*)")?$/,
  { timeout: 900000 },
  async function (level, mode, except) {
    const skipped = (except || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const AxeBuilder = axeBuilder();
    const tags = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
    if (level === "AAA") {
      tags.push("wcag2aaa", "wcag21aaa", "wcag22aaa");
    }
    const failures = [];
    const components = uikitComponents();
    assert.ok(
      components.length > 50,
      `Only ${components.length} components found.`,
    );
    for (const { id } of components.filter(
      (component) => !skipped.includes(component.id),
    )) {
      await this.page.goto(
        `${this.launchUrl}/admin/appearance/ui/components/webtheme/${id}`,
      );
      const stories = this.page.locator(".ui_patterns_component__stories");
      if (!(await stories.count())) {
        failures.push(`${id}: no stories`);
        continue;
      }
      await this.page.evaluate(
        (value) => document.documentElement.setAttribute("data-theme", value),
        mode,
      );
      await transitionsEnd(this.page);
      const result = await new AxeBuilder({ page: this.page })
        .include(".ui_patterns_component__stories")
        .withTags(tags)
        .analyze();
      for (const violation of result.violations) {
        failures.push(
          `${id}: ${violation.id} (${violation.nodes.length}) ${violation.nodes
            .slice(0, 3)
            .map((node) => node.target.join(" "))
            .join(", ")}`,
        );
      }
    }
    assert.deepStrictEqual(
      failures,
      [],
      `WCAG ${level} violations in the ${mode} color mode:\n  ${failures.join("\n  ")}`,
    );
  },
);

/**
 * WCAG 1.4.1 Use of Color: the links inside a line of text are underlined,
 * or reach 3:1 against the text around them.
 *
 * Example: Then the links inside text should not be shown by color alone
 */
Then(
  /^the links inside text should not be shown by color alone$/,
  async function () {
    await this.page.addScriptTag({ content: INTERACTIVE_ELEMENTS });
    const plain = await this.page.evaluate(() =>
      [...document.querySelectorAll("a[href]")]
        .filter((link) => {
          const style = getComputedStyle(link);
          const text = link.parentElement;
          const ownText = [...text.childNodes]
            .filter((node) => node.nodeType === Node.TEXT_NODE)
            .map((node) => node.nodeValue)
            .join("")
            .trim();
          return (
            style.display === "inline" &&
            link.getBoundingClientRect().width > 1 &&
            ownText.length > 2 &&
            !style.textDecorationLine.includes("underline") &&
            window.webthemeContrast(style.color, getComputedStyle(text).color) <
              3
          );
        })
        .map((link) => `"${link.textContent.trim().slice(0, 30)}"`),
    );
    assert.deepStrictEqual(
      plain,
      [],
      `Links shown by color alone:\n  ${plain.join("\n  ")}`,
    );
  },
);
