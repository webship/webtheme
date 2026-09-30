<?php

/**
 * @file
 * Post update functions for Webtheme.
 */

declare(strict_types=1);

use Drupal\Core\Config\FileStorage;
use Drupal\Core\Config\MemoryStorage;
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

/**
 * Keep the design tokens saved in UI Skins under their new names.
 *
 * The tokens take the names of UI Suite UIkit, so a theme generated from it
 * and this one share them: the text colors of primary, success, warning and
 * danger, and the border colors of the form controls. The text and border
 * colors take a transparency: a saved color gets the opaque one. The text
 * colors of primary, success, warning and danger, and the focus ring, have a
 * value of their own now: a site that saved the background, or the emphasis
 * color, keeps it for them.
 */
function webtheme_post_update_ui_skins_token_values(): void {
  $config = \Drupal::configFactory()->getEditable('webtheme.settings');
  $variables = $config->get('third_party_settings.ui_skins.css_variables');
  if ($config->isNew() || !\is_array($variables) || !$variables) {
    return;
  }

  $renamed = [
    'primary-color' => 'global-primary-color',
    'success-color' => 'global-success-color',
    'warning-color' => 'global-warning-color',
    'danger-color' => 'global-danger-color',
    'form-border' => 'form-border-color',
    'inverse-form-border' => 'inverse-form-border-color',
  ];
  foreach ($renamed as $old => $new) {
    if (isset($variables['webtheme-' . $old])) {
      $variables['webtheme-' . $new] = ($variables['webtheme-' . $new] ?? []) + $variables['webtheme-' . $old];
      unset($variables['webtheme-' . $old]);
    }
  }

  $alpha = [
    'global-color',
    'global-muted-color',
    'global-inverse-color',
    'global-border',
    'inverse-muted-color',
    'inverse-form-border-color',
  ];
  foreach ($alpha as $name) {
    foreach ($variables['webtheme-' . $name] ?? [] as $scope => $value) {
      if (\preg_match('/^#([0-9a-f]{3}|[0-9a-f]{6})$/i', (string) $value, $matches)) {
        $hex = \strlen($matches[1]) === 3 ? \preg_replace('/(.)/', '$1$1', $matches[1]) : $matches[1];
        $variables['webtheme-' . $name][$scope] = '#' . \strtolower($hex) . 'ff';
      }
    }
  }

  $follows = [
    'global-primary-color' => 'global-primary-background',
    'global-success-color' => 'global-success-background',
    'global-warning-color' => 'global-warning-background',
    'global-danger-color' => 'global-danger-background',
    'focus-color' => 'global-emphasis-color',
    'focus-halo' => 'global-background',
  ];
  foreach ($follows as $name => $source) {
    foreach ($variables['webtheme-' . $source] ?? [] as $scope => $value) {
      // The dark mode already had text colors of its own.
      if (!isset($variables['webtheme-' . $name][$scope]) && ($scope === ':root' || \str_starts_with($name, 'focus-'))) {
        $variables['webtheme-' . $name][$scope] = $value;
      }
    }
  }

  $config->set('third_party_settings.ui_skins.css_variables', $variables)->save();
}

/**
 * Pick the font of the theme on the existing sites.
 *
 * The theme serves its own fonts and no longer loads a font from Google
 * Fonts. "Font" in the theme settings goes back to the fonts of the operating
 * system.
 */
function webtheme_post_update_font_family(): void {
  $config = \Drupal::configFactory()->getEditable('webtheme.settings');
  if ($config->isNew() || $config->get('font_family') !== NULL) {
    return;
  }
  $config->set('font_family', ThemeHooks::FONT_FAMILY)->save();
}

/**
 * Add the options of the sign-in screens, with their defaults.
 *
 * Their texts are translatable: the settings get a language code, or the
 * theme settings form can not save them.
 */
function webtheme_post_update_sign_in_options(): void {
  $config = \Drupal::configFactory()->getEditable('webtheme.settings');
  if ($config->isNew()) {
    return;
  }
  if (!$config->get('langcode')) {
    $config->set('langcode', \Drupal::languageManager()->getDefaultLanguage()->getId());
  }
  $defaults = [
    'sign_in_layout' => 'center',
    'sign_in_message' => '',
    'sign_in_header' => FALSE,
    'sign_in_footer' => FALSE,
    'sign_in_page_layout' => '',
    'sign_in_logo' => 'site',
    'sign_in_image' => '',
    'sign_in_image_credit' => '',
    'sign_in_help' => '',
  ];
  foreach ($defaults as $key => $value) {
    if ($config->get($key) === NULL) {
      $config->set($key, $value);
    }
  }
  $config->save();
}

/**
 * Install the Display Builder profiles and the page part agents.
 *
 * A site that has Display Builder gets the profiles of the theme, the
 * sign-in page layout (disabled) and the agents of the Page, Header, Footer
 * and Sign in components. Configuration that exists is kept.
 */
function webtheme_post_update_display_builder_config(): void {
  $path = \Drupal::service('extension.list.theme')->getPath('webtheme') . '/config/optional';
  $names = [
    'display_builder.profile.webtheme',
    'display_builder.profile.webtheme_sign_in',
    'display_builder_page_layout.page_layout.webtheme_sign_in',
    'ai_agents.ai_agent.webtheme_page',
    'ai_agents.ai_agent.webtheme_header',
    'ai_agents.ai_agent.webtheme_footer',
    'ai_agents.ai_agent.webtheme_sign_in',
  ];
  $source = new FileStorage($path);
  $storage = new MemoryStorage();
  foreach ($names as $name) {
    if ($source->exists($name) && \Drupal::configFactory()->get($name)->isNew()) {
      $storage->write($name, $source->read($name));
    }
  }
  \Drupal::service('config.installer')->installOptionalConfig($storage);
}
