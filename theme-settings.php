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
}
