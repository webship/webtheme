/**
 * @file
 * HTMX navigation for Webtheme.
 *
 * Links inside the page wrapper are boosted by HTMX (hx-boost, see
 * off-canvas-page-wrapper.html.twig): the page content is swapped without a
 * full reload. Drupal core (core/drupal.htmx) loads the new CSS/JS assets,
 * merges drupalSettings and attaches the behaviors; UIkit initializes the
 * swapped components by itself.
 *
 * This file keeps full page loads for the URLs HTMX must not handle, closes
 * the open UIkit overlays and manages the focus after each navigation.
 */
((Drupal, drupalSettings, htmx) => {
  /**
   * Paths always loaded with a full page load.
   */
  const excludedPaths = [
    /^\/admin(\/|$)/,
    /^\/user\/logout/,
    /^\/batch/,
    /^\/node\/add/,
    /^\/node\/\d+\/(edit|delete|revisions|layout|display-builder)/,
    /^\/(taxonomy\/term|media|user|block|comment)\/\d+\/(edit|delete)/,
    /\/display-builder(\/|$)/,
    /^\/(core|modules|themes|profiles|sites|system\/files)\//,
    /\.[a-z0-9]{2,5}$/i,
  ];

  Drupal.webtheme = Drupal.webtheme || {};

  /**
   * Tells if a URL must be loaded without HTMX.
   *
   * @param {string} url
   *   The requested URL.
   * @param {Element|null} element
   *   The element triggering the request.
   *
   * @return {boolean}
   *   TRUE for a full page load.
   */
  Drupal.webtheme.isExcludedFromHtmx = (url, element = null) => {
    const parsed = new URL(url, window.location.href);
    if (parsed.origin !== window.location.origin) {
      return true;
    }
    let path = parsed.pathname;
    const base = drupalSettings.path?.baseUrl || '/';
    if (base !== '/' && path.startsWith(base)) {
      path = `/${path.substring(base.length)}`;
    }
    if (excludedPaths.some((pattern) => pattern.test(path))) {
      return true;
    }
    return Boolean(
      element?.closest(
        '.use-ajax, [data-dialog-type], [target], [download], [data-contextual-id], .contextual, [hx-boost="false"]',
      ),
    );
  };

  // Full page load for the excluded URLs.
  htmx.on('htmx:beforeRequest', (event) => {
    const { detail } = event;
    if (!detail.boosted) {
      return;
    }
    const url = detail.requestConfig?.path || detail.pathInfo?.requestPath;
    if (url && Drupal.webtheme.isExcludedFromHtmx(url, detail.elt)) {
      event.preventDefault();
      window.location.assign(url);
      return;
    }
    // Close the UIkit overlays (offcanvas menu, modals, dropdowns).
    if (window.UIkit) {
      document
        .querySelectorAll('.uk-offcanvas.uk-open')
        .forEach((element) => window.UIkit.offcanvas(element).hide());
      document
        .querySelectorAll('.uk-modal.uk-open')
        .forEach((element) => window.UIkit.modal(element).hide());
      document
        .querySelectorAll('.uk-drop.uk-open')
        .forEach((element) => window.UIkit.drop(element).hide(false));
    }
  });

  // Accessibility: move the focus to the content and announce the new page.
  htmx.on('htmx:afterSettle', ({ detail }) => {
    if (!detail.boosted) {
      return;
    }
    const target =
      document.getElementById('main-content') ||
      document.querySelector('main, [role="main"]');
    if (target) {
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }
      target.focus({ preventScroll: true });
    }
    Drupal.announce(document.title);
  });
})(Drupal, drupalSettings, htmx);
