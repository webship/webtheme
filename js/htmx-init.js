/**
 * @file
 * HTMX boot wiring for Webtheme.
 *
 * Re-attaches Drupal behaviors after HTMX swaps in new content so that
 * theme-side behaviors (navigation, color-picker, tabs, …) keep working
 * on boosted pages and partial replacements.
 *
 * @see https://htmx.org/events/#htmx:afterSwap
 */

((Drupal) => {
  if (typeof window.htmx === 'undefined') {
    return;
  }

  // After every HTMX swap, run Drupal.attachBehaviors on the new content so
  // every theme/module behavior re-binds inside the replaced fragment.
  document.body.addEventListener('htmx:afterSwap', (event) => {
    if (event && event.detail && event.detail.target) {
      Drupal.attachBehaviors(event.detail.target, drupalSettings);
    }
  });

  // Mirror for OOB (out-of-band) swaps so swapped fragments outside the
  // primary target also re-attach behaviors.
  document.body.addEventListener('htmx:oobAfterSwap', (event) => {
    if (event && event.detail && event.detail.target) {
      Drupal.attachBehaviors(event.detail.target, drupalSettings);
    }
  });

  // Before content is removed, detach behaviors so listeners attached by
  // Drupal can clean up references — prevents memory leaks across many swaps.
  document.body.addEventListener('htmx:beforeSwap', (event) => {
    if (event && event.detail && event.detail.target) {
      Drupal.detachBehaviors(event.detail.target, drupalSettings, 'unload');
    }
  });
})(Drupal);
