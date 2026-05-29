<?php

/**
 * @file
 * Functions to support Webtheme theme settings.
 */

use Drupal\Core\Form\FormStateInterface;

/**
 * Implements hook_form_FORM_ID_alter() for system_theme_settings.
 */
function webtheme_form_system_theme_settings_alter(&$form, FormStateInterface $form_state) {
  $form['webtheme_settings']['webtheme_utilities'] = [
    '#type' => 'fieldset',
    '#title' => t('Webtheme Utilities'),
  ];
  $form['webtheme_settings']['webtheme_utilities']['mobile_menu_all_widths'] = [
    '#type' => 'checkbox',
    '#title' => t('Enable mobile menu at all widths'),
    '#default_value' => theme_get_setting('mobile_menu_all_widths'),
    '#description' => t('Enables the mobile menu toggle at all widths.'),
  ];
  $form['webtheme_settings']['webtheme_utilities']['site_branding_bg_color'] = [
    '#type' => 'select',
    '#title' => t('Header site branding background color'),
    '#options' => [
      'default' => t('Primary Branding Color'),
      'gray' => t('Gray'),
      'white' => t('White'),
    ],
    '#default_value' => theme_get_setting('site_branding_bg_color'),
  ];
  $form['webtheme_settings']['webtheme_utilities']['debug'] = [
    '#type' => 'checkbox',
    '#title' => t('Enable Debug Options'),
    '#default_value' => theme_get_setting('debug', 'webtheme'),
    '#description' => t('Enables a fixed debug block in the bottom corner of your screen.'),
  ];

  $form['webtheme_settings']['webtheme_progressive'] = [
    '#type' => 'fieldset',
    '#title' => t('Progressive enhancement'),
    '#description' => t('Webtheme ships zero jQuery and uses vanilla JavaScript. Enable HTMX below to get boosted navigation and partial-page swaps without writing extra JavaScript.'),
  ];
  $form['webtheme_settings']['webtheme_progressive']['htmx_enabled'] = [
    '#type' => 'checkbox',
    '#title' => t('Enable HTMX'),
    '#default_value' => theme_get_setting('htmx_enabled') ?? 0,
    '#description' => t('Attaches the <code>webtheme/htmx</code> library on every request. Drupal behaviors are automatically re-attached after each HTMX swap. See <a href="https://htmx.org" target="_blank" rel="noopener">htmx.org</a>.'),
  ];
  $form['webtheme_settings']['webtheme_progressive']['htmx_boost'] = [
    '#type' => 'checkbox',
    '#title' => t('Boost all internal links and forms'),
    '#default_value' => theme_get_setting('htmx_boost') ?? 0,
    '#description' => t('Adds <code>hx-boost="true"</code> to the <code>&lt;body&gt;</code> element so every internal link and form submits via HTMX, replacing only the page content instead of doing a full reload. Requires <em>Enable HTMX</em>.'),
    '#states' => [
      'visible' => [':input[name="htmx_enabled"]' => ['checked' => TRUE]],
    ],
  ];
}
