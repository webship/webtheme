<?php

declare(strict_types=1);

namespace Drupal\webtheme;

/**
 * The page title of a Display Builder page layout, in a level 1 heading.
 *
 * Since Display Builder 1.0.0-beta10, the page title source prints the title
 * text only, no longer in an h1. A page layout placing it straight in a slot
 * loses the heading of the page: the source goes in the Heading component of
 * the theme, level 1.
 *
 * @see webtheme_post_update_sign_in_page_title_heading()
 */
final class PageTitleHeading {

  /**
   * The ID of the page title source of Display Builder.
   */
  public const string SOURCE_ID = 'page_title';

  /**
   * The Heading component, level 1, holding a page title source.
   *
   * @param array $page_title
   *   The page title source.
   *
   * @return array
   *   The component source.
   */
  public static function heading(array $page_title): array {
    return [
      'source_id' => 'component',
      'source' => [
        'component' => [
          'component_id' => 'webtheme:heading',
          'variant_id' => NULL,
          'props' => [
            'heading_level' => [
              'source_id' => 'select',
              'source' => ['value' => 1],
            ],
          ],
          'slots' => [
            'title' => ['sources' => [$page_title]],
          ],
        ],
      ],
    ];
  }

  /**
   * Puts the page title placed straight in a slot in the heading.
   *
   * Only the top-level instances of the component are read: the page layouts
   * of the theme place their page components at the top.
   *
   * @param array $sources
   *   The sources of a page layout.
   * @param string $component_id
   *   The component holding the slot, like webtheme:sign_in.
   * @param string $slot
   *   The slot, like title.
   *
   * @return array
   *   The sources, the page title in the heading. Unchanged when no page
   *   title is straight in the slot.
   */
  public static function inSlot(array $sources, string $component_id, string $slot): array {
    foreach ($sources as $delta => $source) {
      if (!\is_array($source) || ($source['source']['component']['component_id'] ?? NULL) !== $component_id) {
        continue;
      }
      $slot_sources = $source['source']['component']['slots'][$slot]['sources'] ?? NULL;
      if (!\is_array($slot_sources)) {
        continue;
      }
      foreach ($slot_sources as $index => $slot_source) {
        if (\is_array($slot_source) && ($slot_source['source_id'] ?? NULL) === self::SOURCE_ID) {
          $sources[$delta]['source']['component']['slots'][$slot]['sources'][$index] = self::heading($slot_source);
        }
      }
    }
    return $sources;
  }

}
