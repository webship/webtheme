<?php

declare(strict_types=1);

namespace Drupal\webtheme\Hook;

use Drupal\Core\Hook\Attribute\Hook;
use Drupal\Core\Theme\Registry;

/**
 * The page templates: the sign-in screens, and the block layout pages.
 *
 * A Display Builder page layout swaps the "page" and "region" templates in
 * the runtime theme registry, and removes their suggestions. The runtime
 * registry is cached: when a page layout is the first page rendered after a
 * cache clear, the swap is saved, and every page of the block layout loses
 * its header, main and footer (and the sign-in screens their own page) until
 * the next cache clear.
 */
class PageTemplateHooks {

  public function __construct(
    protected Registry $themeRegistry,
    protected SignInHooks $signInHooks,
  ) {}

  /**
   * Implements hook_theme_suggestions_HOOK_alter() for 'page'.
   *
   * Restores the page and region templates, and their suggestions, of the
   * block layout when the runtime registry still holds the ones of a page
   * layout. The sign-in screens get page--sign-in.html.twig.
   */
  #[Hook('theme_suggestions_page_alter')]
  public function themeSuggestionsPageAlter(array &$suggestions, array $variables): void {
    $page = $variables['page'] ?? [];
    if (isset($page['display_builder_content']) || ($page['#page_variant'] ?? NULL) === 'display_builder_full') {
      return;
    }

    $registry = $this->themeRegistry->get();
    $runtime = $this->themeRegistry->getRuntime();
    $sign_in = $this->signInHooks->screen() !== NULL;
    // The page template, or the sign-in page, went missing from the runtime
    // registry.
    $swapped = isset($registry['page']['path']) && ($runtime->get('page')['path'] ?? NULL) !== $registry['page']['path'];
    $missing = $sign_in && isset($registry['page__sign_in']) && !$runtime->has('page__sign_in');
    if ($swapped || $missing) {
      foreach ($registry as $hook => $info) {
        if (\in_array($hook, ['page', 'region'], TRUE) || \str_starts_with($hook, 'page__') || \str_starts_with($hook, 'region__')) {
          $runtime->set($hook, $info);
        }
      }
      // The template of "page" was read before the suggestions: add it as the
      // least specific suggestion so that the restored template is used.
      \array_unshift($suggestions, 'page');
    }

    if ($sign_in) {
      $suggestions[] = 'page__sign_in';
    }
  }

}
