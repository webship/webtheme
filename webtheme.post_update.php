<?php

/**
 * @file
 * Post update functions for Webtheme.
 */

declare(strict_types=1);

use Drupal\webtheme\Hook\ThemeHooks;

/**
 * Give the UI Skins ids of the theme its name, and one color mode control.
 *
 * The ids of UI Skins are shared by every theme of the site: the color modes
 * and the design tokens of this theme now carry its name, so another theme
 * declaring the same UIkit names does not replace them. A color mode picked
 * in UI Skins becomes the "Color mode" theme setting.
 */
function webtheme_post_update_theme_named_ui_skins_ids(): void {
  $config = \Drupal::configFactory()->getEditable('webtheme.settings');
  if ($config->isNew()) {
    return;
  }
  $theme = (string) $config->get('third_party_settings.ui_skins.theme');
  $mode = \preg_replace('/^webtheme_/', '', $theme);
  if ($config->get('color_mode') === NULL) {
    $config->set('color_mode', \in_array($mode, ['light', 'dark'], TRUE) ? $mode : ThemeHooks::COLOR_MODE);
  }
  $variables = $config->get('third_party_settings.ui_skins.css_variables');
  if (\is_array($variables)) {
    $renamed = [];
    foreach ($variables as $id => $values) {
      // The dark scope is ':root[data-theme="dark"]' now, as in UI Suite
      // UIkit: it stays above the light values printed on ':root'.
      if (\is_array($values) && isset($values['[data-theme="dark"]'])) {
        $values[':root[data-theme="dark"]'] ??= $values['[data-theme="dark"]'];
        unset($values['[data-theme="dark"]']);
      }
      $renamed[\str_starts_with((string) $id, 'uk-') ? 'webtheme-' . \substr((string) $id, 3) : $id] = $values;
    }
    $config->set('third_party_settings.ui_skins.css_variables', $renamed);
  }
  ThemeHooks::syncUiSkinsColorMode($config);
}
