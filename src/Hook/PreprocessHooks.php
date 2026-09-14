<?php

declare(strict_types=1);

namespace Drupal\webtheme\Hook;

use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Hook\Attribute\Hook;
use Drupal\Core\Template\Attribute;
use Drupal\ui_patterns\Plugin\UiPatterns\PropType\LinksPropType;

/**
 * Preprocess hooks mapping Drupal markup to UIkit.
 */
class PreprocessHooks {

  /**
   * Form element types rendered as UIkit text inputs.
   */
  protected const array TEXT_INPUTS = [
    'color', 'date', 'datetime', 'datelist', 'email', 'entity_autocomplete',
    'machine_name', 'number', 'password', 'password_confirm', 'search', 'tel',
    'textfield', 'time', 'url', 'token',
  ];

  /**
   * Implements hook_preprocess_HOOK() for 'pager'.
   */
  #[Hook('preprocess_pager')]
  public function preprocessPager(array &$variables): void {
    if (!isset($variables['items'])) {
      return;
    }

    $before = LinksPropType::normalize(\array_filter([
      $variables['items']['first'] ?? [],
      $variables['items']['previous'] ?? [],
    ]));

    $pages = LinksPropType::normalize($variables['items']['pages'] ?? []);
    if (isset($variables['current'])) {
      $current_page_index = $variables['current'] - 1;
      if (isset($pages[$current_page_index])) {
        unset($pages[$current_page_index]['url']);
      }
    }

    $after = LinksPropType::normalize(\array_filter([
      $variables['items']['next'] ?? [],
      $variables['items']['last'] ?? [],
    ]));

    $variables['items'] = \array_merge($before, $pages, $after);
  }

  /**
   * Implements hook_preprocess_HOOK() for 'views_mini_pager'.
   */
  #[Hook('preprocess_views_mini_pager')]
  public function preprocessViewsMiniPager(array &$variables): void {
    if (!isset($variables['items'])) {
      return;
    }

    $variables['items'] = LinksPropType::normalize(\array_filter([
      $variables['items']['previous'] ?? [],
      ['title' => (string) ($variables['items']['current'] ?? '')],
      $variables['items']['next'] ?? [],
    ]));
  }

  /**
   * Implements hook_form_alter().
   *
   * The main submit button of a form is a primary UIkit button, unless the
   * form already sets a button type.
   */
  #[Hook('form_alter')]
  public function formAlter(array &$form, FormStateInterface $form_state, string $form_id): void {
    if (isset($form['actions']['submit']) && \is_array($form['actions']['submit']) && empty($form['actions']['submit']['#button_type'])) {
      $form['actions']['submit']['#button_type'] = 'primary';
    }
  }

  /**
   * Implements hook_preprocess_HOOK() for 'input'.
   */
  #[Hook('preprocess_input')]
  public function preprocessInput(array &$variables): void {
    $element = $variables['element'];
    $type = $element['#type'] ?? '';
    $attributes = $variables['attributes'] instanceof Attribute ? $variables['attributes'] : new Attribute($variables['attributes']);

    if (\in_array($type, static::TEXT_INPUTS, TRUE)) {
      $attributes->addClass('uk-input');
      if (!empty($element['#errors'])) {
        $attributes->addClass('uk-form-danger');
      }
    }
    elseif ($type === 'checkbox') {
      $attributes->addClass('uk-checkbox');
    }
    elseif ($type === 'radio') {
      $attributes->addClass('uk-radio');
    }
    elseif ($type === 'range') {
      $attributes->addClass('uk-range');
    }
    elseif (\in_array($type, ['submit', 'button', 'image_button'], TRUE)) {
      $button_type = $element['#button_type'] ?? '';
      $style = 'uk-button-default';
      if ($button_type === 'primary' || $attributes->hasClass('button--primary')) {
        $style = 'uk-button-primary';
      }
      if ($button_type === 'danger' || $attributes->hasClass('button--danger')) {
        $style = 'uk-button-danger';
      }
      $attributes->addClass(['uk-button', $style]);
      if ($attributes->hasClass('button--small')) {
        $attributes->addClass('uk-button-small');
      }
    }
    $variables['attributes'] = $attributes;
  }

  /**
   * Implements hook_preprocess_HOOK() for 'select'.
   */
  #[Hook('preprocess_select')]
  public function preprocessSelect(array &$variables): void {
    $variables['attributes']['class'][] = 'uk-select';
    if (!empty($variables['element']['#errors'])) {
      $variables['attributes']['class'][] = 'uk-form-danger';
    }
  }

  /**
   * Implements hook_preprocess_HOOK() for 'textarea'.
   */
  #[Hook('preprocess_textarea')]
  public function preprocessTextarea(array &$variables): void {
    $variables['attributes']['class'][] = 'uk-textarea';
    if (!empty($variables['element']['#errors'])) {
      $variables['attributes']['class'][] = 'uk-form-danger';
    }
  }

  /**
   * Implements hook_preprocess_HOOK() for 'form_element_label'.
   */
  #[Hook('preprocess_form_element_label')]
  public function preprocessFormElementLabel(array &$variables): void {
    if (($variables['element']['#title_display'] ?? '') !== 'after') {
      $variables['attributes']['class'][] = 'uk-form-label';
    }
  }

  /**
   * Implements hook_preprocess_HOOK() for 'fieldset'.
   */
  #[Hook('preprocess_fieldset')]
  public function preprocessFieldset(array &$variables): void {
    $variables['attributes']['class'][] = 'uk-fieldset';
    if (isset($variables['legend']['attributes']) && $variables['legend']['attributes'] instanceof Attribute) {
      $variables['legend']['attributes']->addClass('uk-legend');
    }
  }

  /**
   * Implements hook_preprocess_HOOK() for 'table'.
   */
  #[Hook('preprocess_table')]
  public function preprocessTable(array &$variables): void {
    $variables['attributes']['class'][] = 'uk-table';
    $variables['attributes']['class'][] = 'uk-table-divider';
    $variables['attributes']['class'][] = 'uk-table-small';
  }

}
