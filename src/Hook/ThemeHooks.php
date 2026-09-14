<?php

declare(strict_types=1);

namespace Drupal\webtheme\Hook;

use Drupal\block\BlockInterface;
use Drupal\Component\Utility\Xss;
use Drupal\Core\Render\Markup;
use Drupal\Core\Cache\Cache;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Extension\ThemeSettingsProvider;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Hook\Attribute\Hook;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\Core\Url;

/**
 * Library, theme settings, page and block hooks for Webtheme.
 */
class ThemeHooks {

  use StringTranslationTrait;

  /**
   * The UIkit version shipped with the theme.
   */
  public const string UIKIT_VERSION = '3.25.22';

  /**
   * The ID of the offcanvas printing the "Offcanvas" region.
   */
  public const string OFFCANVAS_ID = 'webtheme-offcanvas';

  public function __construct(
    protected ThemeSettingsProvider $themeSettingsProvider,
    protected EntityTypeManagerInterface $entityTypeManager,
  ) {}

  /**
   * Implements hook_library_info_alter().
   *
   * Switches the UIkit framework assets to a local copy when requested in the
   * theme settings.
   */
  #[Hook('library_info_alter')]
  public function libraryInfoAlter(array &$libraries, string $extension): void {
    if ($extension !== 'webtheme' || !isset($libraries['uikit'])) {
      return;
    }
    if ($this->themeSettingsProvider->getSetting('uikit_source', 'webtheme') !== 'local') {
      return;
    }
    $libraries['uikit']['css'] = [
      'base' => [
        '/libraries/uikit/dist/css/uikit.min.css' => ['minified' => TRUE],
      ],
    ];
    $libraries['uikit']['js'] = [
      '/libraries/uikit/dist/js/uikit.min.js' => ['minified' => TRUE],
      '/libraries/uikit/dist/js/uikit-icons.min.js' => ['minified' => TRUE],
    ];
  }

  /**
   * Implements hook_form_FORM_ID_alter() for 'system_theme_settings'.
   */
  #[Hook('form_system_theme_settings_alter')]
  public function formSystemThemeSettingsAlter(array &$form, FormStateInterface $form_state): void {
    // The theme settings form calls theme alters directly, and the form alter
    // runs again when this theme is also the active theme: add the settings
    // only once. See issue #943212.
    if (isset($form['webtheme'])) {
      return;
    }

    $form['webtheme'] = [
      '#type' => 'details',
      '#title' => $this->t('UIkit'),
      '#open' => TRUE,
    ];
    $form['webtheme']['uikit_source'] = [
      '#type' => 'radios',
      '#title' => $this->t('UIkit library source'),
      '#options' => [
        'cdn' => $this->t('jsDelivr CDN (UIkit @version)', ['@version' => static::UIKIT_VERSION]),
        'local' => $this->t('Local copy in <code>/libraries/uikit</code>'),
      ],
      '#default_value' => $this->themeSettingsProvider->getSetting('uikit_source', 'webtheme') ?? 'cdn',
    ];
    $form['webtheme']['navbar_sticky'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Sticky navbar'),
      '#default_value' => $this->themeSettingsProvider->getSetting('navbar_sticky', 'webtheme') ?? TRUE,
    ];
    $form['webtheme']['htmx_navigation'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('HTMX navigation'),
      '#description' => $this->t('Links are loaded with HTMX: only the page content is swapped, without full page reloads. Forms, administration pages and files keep the normal navigation.'),
      '#default_value' => $this->themeSettingsProvider->getSetting('htmx_navigation', 'webtheme') ?? TRUE,
    ];
    $form['#submit'][] = [static::class, 'themeSettingsSubmit'];
  }

  /**
   * Submit callback: the library source changes the library definitions.
   */
  public static function themeSettingsSubmit(array &$form, FormStateInterface $form_state): void {
    Cache::invalidateTags(['library_info']);
  }

  /**
   * Implements hook_preprocess_HOOK() for 'page'.
   */
  #[Hook('preprocess_page')]
  public function preprocessPage(array &$variables): void {
    $variables['navbar_sticky'] = (bool) ($this->themeSettingsProvider->getSetting('navbar_sticky', 'webtheme') ?? TRUE);
    $variables['offcanvas_id'] = static::OFFCANVAS_ID;

    // Display Builder page layouts render the blocks without block entities
    // and block templates: tag the menus with their region here, and render
    // the site branding as the UIkit logo.
    foreach (['navbar_left', 'navbar_center', 'navbar_right', 'offcanvas', 'footer'] as $region) {
      if (isset($variables['page'][$region]) && \is_array($variables['page'][$region])) {
        $this->prepareRegionElements($variables['page'][$region], $region);
      }
    }
  }

  /**
   * Prepares the eagerly built menus and branding elements of a region.
   *
   * @param array $element
   *   A render array of the region.
   * @param string $region
   *   The region machine name.
   * @param int $depth
   *   The recursion depth.
   */
  protected function prepareRegionElements(array &$element, string $region, int $depth = 0): void {
    if ($depth > 8) {
      return;
    }
    foreach ($element as $key => &$child) {
      if (!\is_array($child) || (\is_string($key) && \str_starts_with($key, '#'))) {
        continue;
      }
      $theme = $child['#theme'] ?? '';
      if (\is_string($theme) && \str_starts_with($theme, 'menu')) {
        $child['#attributes']['data-uikit-region'] = $region;
        continue;
      }
      if (\str_starts_with($region, 'navbar_') && \array_key_exists('site_name', $child) && \array_key_exists('site_logo', $child)) {
        $child = [
          '#type' => 'inline_template',
          '#template' => '<a href="{{ url }}" class="uk-navbar-item uk-logo" rel="home">{% if logo %}<span class="uk-margin-small-right">{{ logo }}</span>{% endif %}{% if name %}<span>{{ name }}</span>{% endif %}</a>',
          '#context' => [
            'url' => Url::fromRoute('<front>')->toString(),
            'logo' => $child['site_logo'] ?? NULL,
            'name' => $child['site_name'] ?? NULL,
          ],
          '#cache' => $child['#cache'] ?? [],
        ];
        continue;
      }
      $this->prepareRegionElements($child, $region, $depth + 1);
    }
  }

  /**
   * Tells if the HTMX navigation is enabled.
   */
  protected function htmxNavigation(): bool {
    return (bool) ($this->themeSettingsProvider->getSetting('htmx_navigation', 'webtheme') ?? TRUE);
  }

  /**
   * Implements hook_preprocess_HOOK() for 'off_canvas_page_wrapper'.
   */
  #[Hook('preprocess_off_canvas_page_wrapper')]
  public function preprocessOffCanvasPageWrapper(array &$variables): void {
    $variables['htmx_navigation'] = $this->htmxNavigation();
    $variables['#cache']['tags'][] = 'config:webtheme.settings';
    if ($variables['htmx_navigation']) {
      $variables['#attached']['library'][] = 'webtheme/htmx';
    }
  }

  /**
   * Implements hook_preprocess_HOOK() for 'form'.
   *
   * Forms keep their normal submission (form tokens, Drupal AJAX), except the
   * GET forms (search, exposed filters) which are boosted by HTMX.
   */
  #[Hook('preprocess_form')]
  public function preprocessForm(array &$variables): void {
    if (!$this->htmxNavigation()) {
      return;
    }
    $method = strtolower((string) ($variables['element']['#method'] ?? 'post'));
    if ($method !== 'get') {
      $variables['attributes']['hx-boost'] = 'false';
    }
  }

  /**
   * Implements hook_preprocess_HOOK() for 'page_title'.
   *
   * Display Builder page layouts cast the title markup (for example the
   * <span> of the node title field) to a plain string, which would be
   * escaped: restore it as filtered markup.
   */
  #[Hook('preprocess_page_title')]
  public function preprocessPageTitle(array &$variables): void {
    $title = $variables['title'] ?? NULL;
    if (\is_string($title) && \str_contains($title, '<')) {
      $variables['title'] = Markup::create(Xss::filter($title, ['span', 'em', 'strong', 'i', 'b', 'small', 'sup', 'sub']));
    }
  }

  /**
   * Implements hook_preprocess_HOOK() for 'block'.
   *
   * Passes the block region to the menus, so they are rendered with the
   * navbar, offcanvas or subnav components.
   */
  #[Hook('preprocess_block')]
  public function preprocessBlock(array &$variables): void {
    if (($variables['base_plugin_id'] ?? '') !== 'system_menu_block' || empty($variables['elements']['#id'])) {
      return;
    }
    $block = $this->entityTypeManager->getStorage('block')->load($variables['elements']['#id']);
    if ($block instanceof BlockInterface) {
      $variables['content']['#attributes']['data-uikit-region'] = $block->getRegion();
    }
  }

  /**
   * Implements hook_theme_suggestions_HOOK_alter() for 'menu'.
   */
  #[Hook('theme_suggestions_menu_alter')]
  public function themeSuggestionsMenuAlter(array &$suggestions, array $variables): void {
    $region = $variables['attributes']['data-uikit-region'] ?? NULL;
    $suggestion = match ($region) {
      'navbar_left', 'navbar_center', 'navbar_right' => 'menu__uikit_navbar',
      'offcanvas' => 'menu__uikit_offcanvas',
      'footer' => 'menu__uikit_subnav',
      default => NULL,
    };
    if ($suggestion) {
      $suggestions[] = $suggestion;
    }
  }

  /**
   * Implements hook_preprocess_HOOK() for 'menu'.
   */
  #[Hook('preprocess_menu')]
  public function preprocessMenu(array &$variables): void {
    $variables['uikit_region'] = $variables['attributes']['data-uikit-region'] ?? NULL;
    unset($variables['attributes']['data-uikit-region']);
  }

  /**
   * Implements hook_preprocess_HOOK() for 'menu_local_action'.
   */
  #[Hook('preprocess_menu_local_action')]
  public function preprocessMenuLocalAction(array &$variables): void {
    $variables['link']['#options']['attributes']['class'][] = 'uk-button';
    $variables['link']['#options']['attributes']['class'][] = 'uk-button-primary';
    $variables['link']['#options']['attributes']['class'][] = 'uk-button-small';
  }

}
