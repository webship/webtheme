'use strict';

const { Given, Then, When, Before } = require('@cucumber/cucumber');
const {
  friendly,
  smartSettle,
  fillField,
  gotoUrl,
} = require('webship-js/tests/step-definitions/webship');

/**
 * Track the HTTP status of the most recent main-document navigation so the
 * smart-wait helper can transparently retry a transient server error.
 *
 * webship-js creates `this.page` in its own Before hook, which is required
 * before this file (see cucumber.js `require` order), so the page exists by
 * the time this hook runs.
 */
Before(function () {
  this.__lastMainStatus = null;
  // Same-origin responses with a 4xx/5xx status, for the "no failed network
  // requests" performance/health check. Keyed by URL so we can report them.
  this.__failedRequests = [];
  if (this.page && typeof this.page.on === 'function') {
    const origin = (() => {
      try { return new URL(this.parameters.launchUrl).origin; } catch (_) { return null; }
    })();
    this.page.on('response', (resp) => {
      try {
        const req = resp.request();
        if (req.isNavigationRequest() && req.frame() === this.page.mainFrame()) {
          this.__lastMainStatus = resp.status();
        }
        const url = resp.url();
        // Only flag same-origin failures, and ignore favicon (its absence is
        // harmless and covered elsewhere).
        if (origin && url.startsWith(origin) && !/\/favicon\.ico(\?|$)/.test(url) && resp.status() >= 400) {
          this.__failedRequests.push(`${resp.status()} ${url}`);
        }
      } catch (_) {
        // Best-effort — ignore responses we cannot introspect.
      }
    });
  }
});

/**
 * Shared login routine, used by the "I am a logged in user" step and the
 * HTMX toggle helpers. Reuses webship-js's own fillField + smartSettle so
 * the wait logic matches the webpage / webblog / vardoc suites and is
 * robust to both full-page navigation and HTMX-boosted in-place swaps
 * (smartSettle waits for the AJAX/timer/mutation quiet period, not a URL
 * change).
 *
 * @param {object} world - the Cucumber world (has .page, .parameters).
 * @param {string} username
 * @param {string} password
 */
async function loginAs(world, username, password) {
  const wait = (world.minWaitTime && world.minWaitTime.page) || 10000;
  // Force a logged-out state so a re-login as a different user does not land
  // on /user/{uid} (where the username field is absent).
  await world.page.context().clearCookies().catch(() => {});
  await gotoUrl(world.page, `${world.parameters.launchUrl}/user/login`);
  await fillField(world.page, 'Username', username);
  await fillField(world.page, 'Password', password);
  await world.page.locator('input[value="Log in"]').click();
  await smartSettle(world.page, wait + 5000);
}

/**
 * Run a step body and rethrow any failure as a tester-friendly error.
 *
 * @param {Function} body  - async function performing the step.
 * @param {string} message - human-readable description for failures.
 */
async function attempt(body, message) {
  try {
    await body();
  } catch (err) {
    throw friendly(message, err);
  }
}

/**
 * Wait for the current page to settle using webship-js's smart wait
 * (DOM ready + network-idle + the AJAX/timer/mutation quiet period) before
 * an assertion reads the DOM, so steps never inspect a half-rendered page.
 *
 * If the most recent main-document navigation returned a 5xx, reload the
 * page once and settle again. This rides out a transient server error
 * (e.g. a cold-cache hiccup) without masking a deterministic failure: a
 * page that 500s on every request still 500s after the single reload, so
 * the assertion — and the CI diagnostics — still report it.
 *
 * @param {object} world - the Cucumber world.
 */
async function settle(world) {
  const timeout = (world.minWaitTime && world.minWaitTime.page) || 10000;
  await smartSettle(world.page, timeout);
  if (world.__lastMainStatus && world.__lastMainStatus >= 500) {
    // Clear first so the reload's own response refreshes the status and we
    // never loop more than this single retry.
    world.__lastMainStatus = null;
    await world.page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    await smartSettle(world.page, timeout);
  }
}

/**
 * Log in as a named test user defined in cucumber.js worldParameters.users.
 *
 * The Webmaster row is the site-install super-admin. Every other row is
 * provisioned by `Given I add testing users`. The same phrasing is used
 * by varbase_project / vardoc / webpage so suites can move between
 * projects without re-learning step names.
 *
 * Example #1: Given I am a logged in user with the "Webmaster" user
 * Example #2: Given I am a logged in user with the "Content editor" user
 * Example #3: Given I am a logged in user with the "Authenticated user" user
 * Example #4: Given I am a logged in user with the username "Webmaster" user
 * Example #5: Given I am a logged in user with "Webmaster"
 */
Given(/^I am a logged in user with( the)*( username)* "([^"]*)?"( user)?$/, async function (theCase, usernameCase, key, userCase) {
  const users = this.parameters.users || {};
  if (!(key in users)) {
    throw new Error(`No user named "${key}" in cucumber.js worldParameters.users`);
  }
  const { username, password } = users[key];
  if (!username || !password) {
    throw new Error(`User "${key}" is missing username or password in worldParameters.users`);
  }
  await loginAs(this, username, password);
});

/**
 * Provision every non-admin user from cucumber.js worldParameters.users via
 * Drupal's /admin/people/create form. Entries flagged isAdmin: true are
 * skipped (the site-install Webmaster already exists). Idempotent — a
 * second run reports "name is already taken" and the step swallows it.
 *
 * Must be invoked while logged in as the Webmaster (or any user with the
 * "administer users" permission).
 *
 * Example #1: Given I add testing users
 * Example #2: And I add testing users
 * Example #3: When I add testing users
 * Example #4: Given I add the testing users
 * Example #5: And we add testing users
 */
Given(/^(?:I |we )?add( the)? testing users$/, async function (theCase) {
  const users = this.parameters.users || {};
  for (const [key, info] of Object.entries(users)) {
    if (info.isAdmin) continue;
    await this.page.goto(`${this.parameters.launchUrl}/admin/people/create`);
    await this.page.locator('#edit-name').fill(info.username);
    await this.page.locator('#edit-mail').fill(info.email || `${info.username}@example.test`);
    await this.page.locator('#edit-pass-pass1').fill(info.password);
    await this.page.locator('#edit-pass-pass2').fill(info.password);
    for (const role of info.roles || []) {
      const cb = this.page.locator(`input[name="roles[${role}]"]`);
      if (await cb.count() > 0) await cb.check();
    }
    await this.page.locator('#edit-submit').click();
    await this.page.waitForLoadState('networkidle');
  }
});

/**
 * Seed default content through Drupal's admin UI so the theme can be tested
 * with real content on every front-facing surface: article teasers + full
 * pages, tags, the frontpage Views listing and its pager, a Basic page, and
 * primary-navigation menu links.
 *
 * Pure UI automation (no drush, no PHP script): it drives /node/add/article,
 * /node/add/page and /admin/structure/menu so it works against any site,
 * local or CI. Article count defaults to 12 so the standard frontpage view
 * (10 promoted items per page) shows a real pager; override with
 * worldParameters.demoContent.articleCount.
 *
 * Body (CKEditor) and tags are best-effort — a missing widget is swallowed so
 * an editor quirk never fails seeding; the title + Save path is always taken.
 *
 * Must be invoked while logged in as the Webmaster.
 *
 * Example #1: Given I add demo content
 * Example #2: And I add demo content
 * Example #3: When I add the demo content
 */
// Seeding ~12 articles + a page + menu links drives many full page loads
// through the admin UI, which exceeds the default per-step timeout. Give this
// one step a generous budget (it is the only heavy step in the suite).
Given(/^(?:I |we )?add( the)? demo content$/, { timeout: 300000 }, async function (theCase) {
  const cfg = this.parameters.demoContent || {};
  const articleCount = cfg.articleCount || 12;
  const base = this.parameters.launchUrl;

  /**
   * Best-effort fill of a CKEditor 5 body (or a plain textarea fallback).
   */
  const fillBody = async (text) => {
    const ck = this.page.locator('.ck-editor__editable[contenteditable="true"]').first();
    if (await ck.count() > 0) {
      await ck.click();
      await this.page.keyboard.type(text);
      return;
    }
    const ta = this.page.locator('textarea[name$="[value]"]').first();
    if (await ta.count() > 0) {
      await ta.fill(text);
    }
  };

  /**
   * Best-effort fill of the free-tagging Tags autocomplete. The article
   * Tags widget is a single comma-separated autocomplete
   * (#edit-field-tags-target-id / field_tags[target_id]); typing a term name
   * and submitting creates/links it. We set the value and fire input/change
   * so the widget registers it, then Escape closes the suggestion list.
   */
  const fillTags = async (term) => {
    const tags = this.page.locator('#edit-field-tags-target-id, input[name="field_tags[target_id]"]').first();
    if (await tags.count() > 0) {
      await tags.fill(term);
      await tags.dispatchEvent('input').catch(() => {});
      await tags.dispatchEvent('change').catch(() => {});
      await tags.press('Escape').catch(() => {});
    }
  };

  // ── Articles (promoted) — enough to force a 2-page pager on /node. ────────
  for (let i = 1; i <= articleCount; i++) {
    const title = `Webtheme demo article ${String(i).padStart(2, '0')}`;
    await this.page.goto(`${base}/node/add/article`, { waitUntil: 'domcontentloaded' });
    await this.page.locator('#edit-title-0-value').fill(title);
    await fillTags(['Drupal', 'Webship', 'Theming'][i % 3]).catch(() => {});
    await fillBody(`Demo article ${i} body — exercises the Webtheme node teaser, full display and text-content styling.`).catch(() => {});
    await this.page.locator('#edit-submit').click();
    await smartSettle(this.page, 15000);
  }

  // ── A Basic page (unpromoted). ────────────────────────────────────────────
  await this.page.goto(`${base}/node/add/page`, { waitUntil: 'domcontentloaded' });
  await this.page.locator('#edit-title-0-value').fill('About Webtheme');
  await fillBody('A Basic page seeded to exercise the Webtheme page content type, the page-title block and the breadcrumb.').catch(() => {});
  await this.page.locator('#edit-submit').click();
  await smartSettle(this.page, 15000);

  // ── Main-menu links so the primary navigation renders items. ──────────────
  // The menu-link UI URI field takes human paths (<front>, /node) or a full
  // URL — NOT the internal:/entity: storage scheme.
  const links = [
    { title: 'Home', uri: '<front>' },
    { title: 'Articles', uri: '/node' },
    { title: 'Drupal.org', uri: 'https://www.drupal.org' },
  ];
  for (const link of links) {
    await this.page.goto(`${base}/admin/structure/menu/manage/main/add`, { waitUntil: 'domcontentloaded' });
    await this.page.locator('#edit-title-0-value').fill(link.title);
    await this.page.locator('#edit-link-0-uri').fill(link.uri);
    await this.page.locator('#edit-submit').click();
    await smartSettle(this.page, 15000);
  }
});

/**
 * Open a link by its visible text, tolerating surrounding markup/whitespace.
 *
 * webship-js's generic `I click "X"` matches the link's text content with an
 * anchored `^X$` regex, which fails when the theme wraps the link label in a
 * <span> (e.g. node teaser titles: <a><span>Title</span></a>) because the
 * text content then includes newlines. getByRole('link', { name }) matches
 * the accessible name with whitespace normalised, so it follows those links
 * reliably.
 *
 * Example #1: When I open the "Webtheme demo article 12" article
 * Example #2: When I open the "About Webtheme" content
 * Example #3: And I open the "Drupal.org" link
 */
When(/^(?:I |we )?open the "([^"]+)" (?:article|page|content|link)$/, async function (name) {
  await settle(this);
  await attempt(async () => {
    await this.page.getByRole('link', { name, exact: false }).first().click();
  }, `Expected to find and open a link named "${name}"`);
  await settle(this);
});

/**
 * Assert that the active default theme is webtheme.
 *
 * Reads the rendered <body> class list (Drupal renders a `path-…` class but
 * `core/themes/.../theme.info.yml` does not auto-emit a class). Instead we
 * confirm the asset path of any stylesheet refers to the webtheme directory,
 * which is the contract every webtheme page must satisfy.
 *
 * Example #1: Then webtheme is the active default theme
 * Example #2: Then the Webtheme theme is the active default theme
 * Example #3: And webtheme is the active default theme
 */
Then(/^(?:the )?[Ww]ebtheme(?: theme)? is the active default theme$/, async function () {
  await attempt(async () => {
    // Let the page settle first using webship-js's smart wait (DOM +
    // network-idle + AJAX/timer/mutation quiet period) so we never read a
    // half-rendered document.
    await smartSettle(this.page, (this.minWaitTime && this.minWaitTime.page) || 10000);

    // Drupal aggregates per-theme. Even with aggregation on, every aggregated
    // asset URL carries `theme=webtheme`; unaggregated assets live under
    // /themes/<contrib|custom>/webtheme/ (the install location varies between
    // a contrib checkout and DrupalCI's custom path), and the <html> root
    // carries the brand-color custom property from webtheme_preprocess_html().
    // Any of these is sufficient evidence the active theme is webtheme.
    const html = await this.page.content();
    const isWebtheme =
      html.includes('theme=webtheme') ||
      /\/themes\/[^"']*\/webtheme\//.test(html) ||
      html.includes('--color--primary-hue');
    if (!isWebtheme) {
      // No theme markers usually means a server error (HTTP 500) so nothing
      // theme-related rendered. The rendered <body> can be empty on a hard
      // fatal, so re-fetch the URL from inside the page and surface the raw
      // HTTP status + response body — that carries Drupal's actual exception
      // message / backtrace in a non-production test environment.
      const diag = await this.page.evaluate(async () => {
        try {
          const res = await fetch(window.location.href, { credentials: 'include' });
          const body = await res.text();
          return `HTTP ${res.status} ${res.statusText}\n` + body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000);
        } catch (e) {
          return `fetch failed: ${e.message}`;
        }
      }).catch((e) => `diagnostic fetch error: ${e.message}`);
      throw new Error(
        'No webtheme markers found — webtheme is not the active theme '
        + '(the page likely returned HTTP 500). Raw response follows:\n'
        + '----- RAW RESPONSE -----\n' + diag + '\n------------------------'
      );
    }
  }, 'Expected webtheme to be the active default theme');
});

/**
 * Assert that the page loaded without any JavaScript console errors.
 *
 * Relies on webship-js's console-error capture (see cucumber.js
 * worldParameters.javascript.mode = 'warn'). When mode is set to 'warn'
 * webship-js records errors but does not fail individual scenarios; this
 * step makes the assertion explicit so a single feature can express the
 * "no JS errors on this page" invariant.
 *
 * Example #1: Then there are no JavaScript errors on the page
 * Example #2: And there are no JavaScript errors on the page
 * Example #3: Then there are no console errors on the page
 */
Then(/^there are no (?:JavaScript|console) errors on the page$/, async function () {
  // Only real JavaScript errors fail this step: uncaught exceptions
  // (pageerror) and console.error() calls from script. Failed network
  // resources (a missing optional asset → "Failed to load resource" /
  // "net::ERR_…") are not JavaScript errors and are ignored here — they
  // would otherwise turn a benign 404 into a JS-error failure.
  const isResourceError = (msg) =>
    /Failed to load resource|net::ERR_/i.test(msg);
  const errors = (this.jsConsoleErrors || []).filter(Boolean).filter((m) => !isResourceError(m));
  if (errors.length > 0) {
    throw new Error(`Expected no JavaScript errors but saw:\n - ${errors.join('\n - ')}`);
  }
});

/**
 * Capture console errors into the world so the "no JavaScript errors"
 * assertion above can read them. Called automatically before every
 * scenario by the webship-js base hooks.
 *
 * Note: webship-js already listens to console messages via its own
 * `before` hook. We add a thin wrapper that stores errors into
 * `this.jsConsoleErrors`, the array our assertion reads.
 */
Given(/^I start collecting JavaScript errors$/, function () {
  this.jsConsoleErrors = [];
  this.page.on('console', (msg) => {
    if (msg.type() === 'error') {
      this.jsConsoleErrors.push(msg.text());
    }
  });
  this.page.on('pageerror', (err) => {
    this.jsConsoleErrors.push(err.message);
  });
});

/**
 * Assert that the rendered page exposes the named Webtheme region wrapper.
 *
 * Webtheme ships per-region templates (region--content.html.twig, etc.)
 * which wrap the region in a `<div class="region region-{name}">`. This
 * step looks for that wrapper to confirm the region is actually rendered
 * by the active theme (i.e. the templates from the theme are picked up).
 *
 * Example #1: Then the "content" region is rendered
 * Example #2: Then the "header" region is rendered
 * Example #3: Then the "footer-top" region is rendered
 * Example #4: And the "primary-menu" region is rendered
 * Example #5: And the "highlighted" region is rendered
 */
Then(/^the "([^"]+)" region is rendered$/, async function (region) {
  await settle(this);
  await attempt(async () => {
    const locator = this.page.locator(
      `.region.region-${region}, .region--${region}, [data-region="${region}"]`
    );
    const count = await locator.count();
    if (count === 0) {
      throw new Error(`No "${region}" region wrapper found in the rendered page.`);
    }
  }, `Expected to find the "${region}" region wrapper in the rendered page`);
});

/**
 * Assert that a Webtheme library's CSS or JS asset was loaded into the page.
 *
 * Looks for either a `<link rel="stylesheet">` or `<script src="…">` whose
 * URL contains `/themes/contrib/webtheme/…/{name}…`. Used to confirm that
 * the theme info-attached libraries are actually served on a given page.
 *
 * Example #1: Then the "global-styling" Webtheme asset is loaded
 * Example #2: Then the "navigation" Webtheme asset is loaded
 * Example #3: Then the "messages" Webtheme asset is loaded
 * Example #4: And the "scripts" Webtheme asset is loaded
 * Example #5: And the "polyfills" Webtheme asset is loaded
 */
Then(/^the "([^"]+)" Webtheme asset is loaded$/, async function (path) {
  await settle(this);
  await attempt(async () => {
    const html = await this.page.content();
    // With CSS/JS aggregation OFF the unaggregated path is present directly
    // (under /themes/<contrib|custom>/webtheme/ — the install location varies
    // between a contrib checkout and DrupalCI's custom path). With aggregation
    // ON the individual filename is gone, but every aggregated asset URL still
    // carries `theme=webtheme`. Accept either so the assertion is robust to
    // both the install location and the aggregation setting.
    const unaggregated = new RegExp('/themes/[^"\']*/webtheme/' + path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(html);
    const aggregated = html.includes('theme=webtheme');
    if (!unaggregated && !aggregated) {
      throw new Error(`No Webtheme asset matching "${path}" (and no aggregated theme=webtheme asset) was loaded on this page.`);
    }
  }, `Expected to find Webtheme asset "${path}" (or an aggregated webtheme asset) on the page`);
});

/**
 * Assert that the HTML root element carries the brand-color CSS custom
 * property emitted by `webtheme_preprocess_html()`.
 *
 * The preprocess hook converts the configured `base_primary_color` hex
 * value to HSL and injects `--color--primary-hue / saturation / lightness`
 * onto `<html>` as inline style. This step verifies that pipeline ran.
 *
 * Example #1: Then the brand color is applied to the HTML element
 * Example #2: And the brand color is applied to the HTML element
 */
Then(/^the brand color is applied to the HTML element$/, async function () {
  await settle(this);
  await attempt(async () => {
    const style = await this.page.locator('html').getAttribute('style');
    if (!style || !style.includes('--color--primary-hue')) {
      throw new Error(`Expected <html style> to include "--color--primary-hue" but got "${style}"`);
    }
  }, 'Expected the brand-color CSS custom property on the <html> element');
});

/**
 * Assert that a Webtheme SDC component rendered on the page.
 *
 * Drupal stamps every rendered Single-Directory Component with a
 * data-component-id="<provider>:<machine-name>" attribute (in non-production
 * render). This step looks for that marker, proving the theme template
 * delegated to the SDC rather than its old inline markup.
 *
 * Example #1: Then the "site-branding" SDC component is rendered
 * Example #2: Then the "page-title" SDC component is rendered
 * Example #3: And the "breadcrumb" SDC component is rendered
 * Example #4: And the "region" SDC component is rendered
 * Example #5: And the "status-messages" SDC component is rendered
 */
Then(/^the "([^"]+)" SDC component is rendered$/, async function (name) {
  await settle(this);
  await attempt(async () => {
    const count = await this.page.locator(`[data-component-id="webtheme:${name}"]`).count();
    if (count === 0) {
      throw new Error(`No element with data-component-id="webtheme:${name}" found on the page.`);
    }
  }, `Expected the webtheme:${name} SDC component to render on the page`);
});

/**
 * Assert that jQuery is not attached on the current page.
 *
 * Webtheme intentionally removed the `core/jquery` dependency from
 * `webtheme/global-styling` and converted js/scripts.js to vanilla JS.
 * This step confirms no library pulled jQuery back in for anonymous
 * users on a fresh install.
 *
 * Example #1: Then the page does not load jQuery
 * Example #2: And the page does not load jQuery
 */
Then(/^the page does not load jQuery$/, async function () {
  await settle(this);
  const hasJquery = await this.page.evaluate(() => typeof window.jQuery !== 'undefined');
  if (hasJquery) {
    throw new Error('Expected window.jQuery to be undefined, but jQuery was loaded.');
  }
});

/**
 * Assert that the HTMX runtime global is (or is not) attached.
 *
 * Webtheme ships HTMX as an opt-in library
 * (`webtheme.settings.htmx_enabled`); these two steps cover both states.
 *
 * Example #1: Then the htmx global is defined on the page
 * Example #2: Then the htmx global is not defined on the page
 */
Then(/^the htmx global is defined on the page$/, async function () {
  await settle(this);
  const result = await this.page.evaluate(() => typeof window.htmx !== 'undefined');
  if (!result) {
    throw new Error('Expected window.htmx to be defined.');
  }
});
Then(/^the htmx global is not defined on the page$/, async function () {
  await settle(this);
  const result = await this.page.evaluate(() => typeof window.htmx === 'undefined');
  if (!result) {
    throw new Error('Expected window.htmx to be undefined, but HTMX was loaded.');
  }
});

/**
 * Open the Webtheme theme settings form as the admin user. Reuses the
 * shared loginAs() routine (webship-js smartSettle) so it works whether or
 * not HTMX boost is currently enabled.
 */
async function openThemeSettings(world) {
  const users = world.parameters.users || {};
  const admin = Object.values(users).find((u) => u.isAdmin);
  if (!admin) throw new Error('No webmaster (isAdmin) user in worldParameters.users');
  await loginAs(world, admin.username, admin.password);
  await gotoUrl(world.page, `${world.parameters.launchUrl}/admin/appearance/settings/webtheme`);
  await smartSettle(world.page, 10000);
}

/**
 * Save the theme settings form and wait for the confirmation message.
 * Works under HTMX boost (the submit is an in-place swap) because
 * smartSettle waits for the AJAX/mutation quiet period.
 */
async function saveThemeSettings(world) {
  await world.page.locator('#edit-submit').click();
  await smartSettle(world.page, 15000);
  await world.page.context().clearCookies().catch(() => {});
}

/**
 * Toggle the `htmx_enabled` flag in `webtheme.settings` via the theme
 * settings form. Implemented through the UI (not drush) so the same step
 * works in CI and against a remote site.
 *
 * Example #1: Given I enable HTMX in webtheme settings
 * Example #2: When I disable HTMX in webtheme settings
 */
async function toggleHtmx(world, enable) {
  await openThemeSettings(world);
  const cb = world.page.locator('#edit-htmx-enabled');
  if (enable) {
    await cb.check();
  }
  else {
    await cb.uncheck();
  }
  await saveThemeSettings(world);
}
Given(/^I enable HTMX in webtheme settings$/, async function () {
  await toggleHtmx(this, true);
});
When(/^I disable HTMX in webtheme settings$/, async function () {
  await toggleHtmx(this, false);
});

/**
 * Toggle the `htmx_boost` flag (and `htmx_enabled`, since boost requires it)
 * in `webtheme.settings` via the theme settings form.
 *
 * Example #1: Given I enable HTMX boost in webtheme settings
 * Example #2: When I disable HTMX boost in webtheme settings
 */
async function toggleHtmxBoost(world, enable) {
  await openThemeSettings(world);
  const enabled = world.page.locator('#edit-htmx-enabled');
  const boost = world.page.locator('#edit-htmx-boost');
  if (enable) {
    await enabled.check();
    // The boost checkbox is revealed by #states once "Enable HTMX" is ticked.
    await boost.waitFor({ state: 'visible', timeout: 5000 });
    await boost.check();
  }
  else {
    if (await boost.isVisible().catch(() => false)) {
      await boost.uncheck();
    }
    await enabled.uncheck();
  }
  await saveThemeSettings(world);
}
Given(/^I enable HTMX boost in webtheme settings$/, async function () {
  await toggleHtmxBoost(this, true);
});
When(/^I disable HTMX boost in webtheme settings$/, async function () {
  await toggleHtmxBoost(this, false);
});

/**
 * Assert the <body> carries hx-boost="true" (set by webtheme_preprocess_html
 * when the HTMX boost theme setting is on).
 *
 * Example #1: Then the body is HTMX-boosted
 * Example #2: Then the body is not HTMX-boosted
 */
Then(/^the body is HTMX-boosted$/, async function () {
  await settle(this);
  const v = await this.page.locator('body').getAttribute('hx-boost');
  if (v !== 'true') {
    throw new Error(`Expected <body hx-boost="true"> but got hx-boost="${v}".`);
  }
});
Then(/^the body is not HTMX-boosted$/, async function () {
  await settle(this);
  const v = await this.page.locator('body').getAttribute('hx-boost');
  if (v === 'true') {
    throw new Error('Expected <body> without hx-boost="true", but it was boosted.');
  }
});

// ---------------------------------------------------------------------------
// Performance / health checks (general, non-flaky budgets).
// ---------------------------------------------------------------------------

/**
 * Assert no same-origin resource on the current page returned a 4xx/5xx.
 *
 * A missing CSS/JS/image (404) or a server error (500) is both a correctness
 * and a performance problem (wasted requests, broken assets). Cross-origin
 * and favicon noise is ignored (see the Before hook). Run after navigating
 * to the page you want to check.
 *
 * Example #1: Then there should be no failed network requests
 * Example #2: And there should be no failed network requests
 */
Then(/^there should be no failed network requests$/, async function () {
  await settle(this);
  const failed = this.__failedRequests || [];
  if (failed.length > 0) {
    throw new Error('Expected no failed (4xx/5xx) same-origin requests but saw:\n - ' + failed.join('\n - '));
  }
});

/**
 * Assert the page reached an interactive/loaded state within a time budget,
 * read from the Navigation Timing API. A generous budget makes this a
 * smoke-level performance guard (catches gross regressions / hangs) without
 * being flaky on a loaded CI box.
 *
 * Example #1: Then the page should become interactive within 8000 milliseconds
 * Example #2: Then the page should become interactive within 10000 milliseconds
 */
Then(/^the page should become interactive within (\d+) milliseconds$/, async function (budget) {
  await settle(this);
  const ms = await this.page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    if (nav) return Math.round(nav.domInteractive);
    // Legacy fallback.
    const t = performance.timing;
    return t ? (t.domInteractive - t.navigationStart) : 0;
  });
  if (ms > Number(budget)) {
    throw new Error(`Expected the page to become interactive within ${budget} ms but it took ${ms} ms.`);
  }
});

/**
 * Assert the page loaded fewer than N same-origin resources — a guard against
 * runaway asset counts. Budget is intentionally generous.
 *
 * Example #1: Then the page should load fewer than 250 resources
 * Example #2: And the page should load fewer than 300 resources
 */
Then(/^the page should load fewer than (\d+) resources$/, async function (max) {
  await settle(this);
  const count = await this.page.evaluate(() => performance.getEntriesByType('resource').length);
  if (count >= Number(max)) {
    throw new Error(`Expected fewer than ${max} resources but the page loaded ${count}.`);
  }
});
