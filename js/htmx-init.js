/**
 * @file
 * HTMX boot wiring for Webtheme.
 *
 * Bridges HTMX with Drupal's behavior system so theme/module behaviors
 * (navigation, tabs, messages, …) keep working after HTMX swaps in new
 * content — boosted navigation, partial replacements, and out-of-band
 * swaps. Written defensively: every hook is guarded and wrapped so a
 * single failing behavior, a missing global, or an HTMX timing quirk can
 * never break a swap or throw an uncaught error.
 *
 * @see https://htmx.org/events/
 */

((Drupal, once) => {
  'use strict';

  /**
   * Run Drupal.attachBehaviors on a swapped-in fragment, never throwing.
   *
   * @param {Element} element
   *   The container that received new markup.
   */
  function attach(element) {
    if (!element || !Drupal || typeof Drupal.attachBehaviors !== 'function') {
      return;
    }
    const settings = (typeof drupalSettings !== 'undefined' && drupalSettings) || {};
    try {
      Drupal.attachBehaviors(element, settings);
    } catch (e) {
      // A behavior threw — log, but let the swap complete. Failing soft here
      // keeps one buggy behavior from breaking all HTMX navigation.
      if (typeof console !== 'undefined') {
        console.error('webtheme/htmx: attachBehaviors failed after swap', e);
      }
    }
  }

  /**
   * Run Drupal.detachBehaviors on a fragment about to be replaced/removed.
   *
   * @param {Element} element
   *   The container whose markup is being swapped out.
   */
  function detach(element) {
    if (!element || !Drupal || typeof Drupal.detachBehaviors !== 'function') {
      return;
    }
    const settings = (typeof drupalSettings !== 'undefined' && drupalSettings) || {};
    try {
      Drupal.detachBehaviors(element, settings, 'unload');
    } catch (e) {
      if (typeof console !== 'undefined') {
        console.error('webtheme/htmx: detachBehaviors failed before swap', e);
      }
    }
  }

  /**
   * Wire the HTMX ⇆ Drupal bridge exactly once, when HTMX is present.
   *
   * Implemented as a Drupal behavior so it (re)runs on the normal Drupal
   * lifecycle and is safe to call repeatedly — `once()` guarantees the
   * document-level listeners are bound a single time even across AJAX.
   */
  Drupal.behaviors.webthemeHtmx = {
    attach() {
      // HTMX is opt-in; bail out cleanly when the library is not loaded.
      if (typeof window.htmx === 'undefined') {
        return;
      }

      // Bind the document-level bridge once.
      if (once('webtheme-htmx', document.documentElement).length === 0) {
        return;
      }

      // Tell Drupal these are AJAX requests so server-side code that checks
      // for the XMLHttpRequest header behaves consistently with core AJAX.
      document.body.addEventListener('htmx:configRequest', (event) => {
        try {
          if (event && event.detail && event.detail.headers) {
            event.detail.headers['X-Requested-With'] = 'XMLHttpRequest';
          }
        } catch (e) {
          // Non-fatal — the request still proceeds without the header.
        }
      });

      // Detach behaviors from content about to be replaced (prevents leaks).
      document.body.addEventListener('htmx:beforeSwap', (event) => {
        if (event && event.detail && event.detail.target) {
          detach(event.detail.target);
        }
      });

      // Re-attach behaviors to the primary swapped-in fragment …
      document.body.addEventListener('htmx:afterSwap', (event) => {
        if (event && event.detail && event.detail.target) {
          attach(event.detail.target);
        }
      });

      // … and to out-of-band swapped fragments outside the primary target.
      document.body.addEventListener('htmx:oobAfterSwap', (event) => {
        if (event && event.detail && event.detail.target) {
          attach(event.detail.target);
        }
      });

      // Surface (but swallow) HTMX network/swap errors so a failed request
      // degrades gracefully instead of leaving the UI in a broken state.
      document.body.addEventListener('htmx:responseError', (event) => {
        if (typeof console !== 'undefined') {
          const status = event && event.detail && event.detail.xhr && event.detail.xhr.status;
          console.warn('webtheme/htmx: response error', status || '', event && event.detail);
        }
      });
      document.body.addEventListener('htmx:sendError', () => {
        if (typeof console !== 'undefined') {
          console.warn('webtheme/htmx: network send error');
        }
      });
    },
  };
})(Drupal, once);
