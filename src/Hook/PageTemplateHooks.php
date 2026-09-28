<?php

declare(strict_types=1);

namespace Drupal\webtheme\Hook;

use Drupal\Core\Hook\Attribute\Hook;
use Drupal\Core\Theme\Registry;

/**
 * Keeps the page template of the theme on the pages of the block layout.
 *
 * A Display Builder page layout swaps the "page" and "region" templates in
 * the runtime theme registry, and removes their suggestions. The runtime
 * registry is cached: when a page layout is the first page rendered after a
 * cache clear, the swap is saved, and every page of the block layout loses
 * its header, main and footer until the next cache clear. Both the classic
 * and the HTMX navigation are hit.
 */
class PageTemplateHooks {

  public function __construct(
    protected Registry $themeRegistry,
  ) {}

  /**
   * Implements hook_theme_suggestions_HOOK_alter() for 'page'.
   *
   * Restores the page and region templates, and their suggestions, of the
   * block layout when the runtime registry still holds the ones of a page
   * layout.
   */
  #[Hook('theme_suggestions_page_alter')]
  public function themeSuggestionsPageAlter(array &$suggestions, array $variables): void {
    $page = $variables['page'] ?? [];
    if (isset($page['display_builder_content']) || ($page['#page_variant'] ?? NULL) === 'display_builder_full') {
      return;
    }

    $registry = $this->themeRegistry->get();
    $runtime = $this->themeRegistry->getRuntime();
    if (!isset($registry['page']['path']) || ($runtime->get('page')['path'] ?? NULL) === $registry['page']['path']) {
      return;
    }

    foreach ($registry as $hook => $info) {
      if (\in_array($hook, ['page', 'region'], TRUE) || \str_starts_with($hook, 'page__') || \str_starts_with($hook, 'region__')) {
        $runtime->set($hook, $info);
      }
    }

    // The template of "page" was read before the suggestions: add it as the
    // least specific suggestion so that the restored template is used.
    array_unshift($suggestions, 'page');
  }

}
