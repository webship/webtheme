<?php

declare(strict_types=1);

namespace Drupal\webtheme\Hook;

use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Hook\Attribute\Hook;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\Core\Url;

/**
 * The forms of the sign-in screens.
 */
class FormHooks {

  use StringTranslationTrait;

  /**
   * Implements hook_form_FORM_ID_alter() for 'user_login_form'.
   *
   * The keyboard starts at the skip link, not in the form. The link to reset
   * the password sits under the password field, where it is needed.
   */
  #[Hook('form_user_login_form_alter')]
  public function formUserLoginFormAlter(array &$form, FormStateInterface $form_state): void {
    if (isset($form['name'])) {
      unset($form['name']['#description'], $form['name']['#attributes']['autofocus']);
      $form['name']['#attributes']['autocomplete'] = 'username';
    }
    if (isset($form['pass'])) {
      unset($form['pass']['#description']);
      $form['pass']['#attributes']['autocomplete'] = 'current-password';
      $form['webtheme_forgot'] = [
        '#type' => 'container',
        '#attributes' => ['class' => ['webtheme-sign-in__forgot']],
        '#weight' => ($form['pass']['#weight'] ?? 0) + 0.1,
        'link' => [
          '#type' => 'link',
          '#title' => $this->t('Forgot your password?'),
          '#url' => Url::fromRoute('user.pass'),
        ],
      ];
    }
  }

  /**
   * Implements hook_form_FORM_ID_alter() for 'user_pass'.
   *
   * The button says what it does, and the visitor comes back to the log in
   * screen, where the message says the mail was sent.
   */
  #[Hook('form_user_pass_alter')]
  public function formUserPassAlter(array &$form, FormStateInterface $form_state): void {
    if (isset($form['actions']['submit'])) {
      $form['actions']['submit']['#value'] = $this->t('Send reset link');
    }
    if (isset($form['name'])) {
      unset($form['name']['#attributes']['autofocus']);
      $form['name']['#attributes']['autocomplete'] = 'username';
    }
    $form['#submit'][] = [static::class, 'userPassSubmit'];
  }

  /**
   * Submit callback: back to the log in screen after a reset request.
   */
  public static function userPassSubmit(array &$form, FormStateInterface $form_state): void {
    $form_state->setRedirect('user.login');
  }

  /**
   * Implements hook_form_FORM_ID_alter() for 'user_form'.
   *
   * With a password reset link, the new password comes first.
   */
  #[Hook('form_user_form_alter')]
  public function formUserFormAlter(array &$form, FormStateInterface $form_state): void {
    if ($form_state->get('user_pass_reset') && isset($form['account']['pass'])) {
      $form['account']['pass']['#weight'] = -100;
    }
  }

}
