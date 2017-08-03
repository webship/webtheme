<?php

/**
 * @file
 * Provides theme settings for Webtheme.
 */

/**
 * Implements hook_form_system_theme_settings_alter().
 */
function webtheme_form_system_theme_settings_alter(&$form, \Drupal\Core\Form\FormStateInterface $form_state, $form_id = NULL) {
  // General "alters" use a form id. Settings should not be set here. The only
  // thing useful about this is if you need to alter the form for the running
  // theme and *not* the theme setting.
  // @see http://drupal.org/node/943212
  if (isset($form_id)) {
    return;
  }
}
