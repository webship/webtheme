<?php

declare(strict_types=1);

namespace Drupal\webtheme;

use Drupal\ui_skins\UiSkinsUtility;

/**
 * The design tokens of UI Skins when the operating system picks the mode.
 *
 * UI Skins prints the saved dark values for ':root[data-theme="dark"]'. With
 * the "Follow the operating system" color mode the html element has no
 * data-theme: the saved dark values are printed a second time, for the
 * visitors whose system asks for the dark mode. No JavaScript reads the
 * system.
 */
final class SystemDarkMode {

  /**
   * The scope of the dark values in UI Skins.
   */
  public const string DARK_SCOPE = ':root[data-theme="dark"]';

  /**
   * The selector of the dark mode picked by the operating system.
   *
   * The same selector as in assets/css/drupal.css: printed after the
   * stylesheets, the saved values win over the values of the theme.
   */
  public const string SYSTEM_DARK_SCOPE = ':root:not([data-theme="light"])';

  /**
   * The saved dark values, for the dark mode of the operating system.
   *
   * @param mixed $saved
   *   The CSS variables saved by UI Skins in the theme settings: the values
   *   by scope, keyed by variable id.
   *
   * @return string
   *   The CSS, empty when no dark value is saved.
   */
  public static function css(mixed $saved): string {
    if (!\is_array($saved)) {
      return '';
    }
    $scope = UiSkinsUtility::getConfigScopeName(self::DARK_SCOPE);
    $variables = [];
    foreach ($saved as $id => $values) {
      $value = \is_array($values) ? ($values[$scope] ?? NULL) : NULL;
      // A value is one declaration: nothing that closes the rule or the
      // style element.
      if (\is_string($value) && $value !== '' && !\preg_match('/[<>{};]/', $value)) {
        $variables[UiSkinsUtility::getCssVariableName((string) $id)] = $value;
      }
    }
    if (!$variables) {
      return '';
    }
    return '@media (prefers-color-scheme: dark){' . UiSkinsUtility::getCssVariablesInlineCss([self::SYSTEM_DARK_SCOPE => $variables]) . '}';
  }

}
