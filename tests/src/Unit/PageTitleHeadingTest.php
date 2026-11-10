<?php

declare(strict_types=1);

namespace Drupal\Tests\webtheme\Unit;

use Drupal\Component\Serialization\Yaml;
use Drupal\Tests\UnitTestCase;
use Drupal\webtheme\PageTitleHeading;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

/**
 * Tests the page title of a page layout goes in a level 1 heading.
 */
#[CoversClass(PageTitleHeading::class)]
#[Group('webtheme')]
final class PageTitleHeadingTest extends UnitTestCase {

  /**
   * Tests the page title placed straight in the slot goes in the heading.
   */
  public function testPageTitleGoesInHeading(): void {
    $page_title = [
      'node_id' => '1f0a2b3c4d5e6f70',
      'source_id' => 'page_title',
      'source' => [],
    ];
    $text = ['source_id' => 'textfield', 'source' => ['value' => 'Welcome back']];
    $sources = [$this->signIn(['title' => [$page_title, $text]])];

    $title = PageTitleHeading::inSlot($sources, 'webtheme:sign_in', 'title')[0]['source']['component']['slots']['title']['sources'];

    $heading = $title[0]['source']['component'];
    $this->assertSame('webtheme:heading', $heading['component_id']);
    $this->assertSame(1, $heading['props']['heading_level']['source']['value']);
    $this->assertSame([$page_title], $heading['slots']['title']['sources']);
    $this->assertSame($text, $title[1]);
  }

  /**
   * Tests the page layouts without a page title straight in the slot.
   */
  public function testOtherPlacesAreKept(): void {
    $page_title = ['source_id' => 'page_title', 'source' => []];

    // Already in the heading: a second run changes nothing.
    $once = PageTitleHeading::inSlot([$this->signIn(['title' => [$page_title]])], 'webtheme:sign_in', 'title');
    $this->assertSame($once, PageTitleHeading::inSlot($once, 'webtheme:sign_in', 'title'));

    // In another slot, in another component, at the top level, or no slot.
    $sources = [
      $this->signIn(['content' => [$page_title]]),
      [
        'source_id' => 'component',
        'source' => [
          'component' => [
            'component_id' => 'webtheme:section',
            'slots' => ['title' => ['sources' => [$page_title]]],
          ],
        ],
      ],
      $page_title,
      $this->signIn([]),
    ];
    $this->assertSame($sources, PageTitleHeading::inSlot($sources, 'webtheme:sign_in', 'title'));
  }

  /**
   * Tests the page layouts of the theme have their page title in a heading.
   *
   * @param string $file
   *   The page layout file, from the root of the theme.
   * @param string $component_id
   *   The component holding the page title.
   * @param string $slot
   *   Its slot.
   */
  #[DataProvider('providerPageLayouts')]
  public function testPageLayoutsOfTheTheme(string $file, string $component_id, string $slot): void {
    $sources = Yaml::decode((string) \file_get_contents(\dirname(__DIR__, 3) . '/' . $file))['sources'];

    $this->assertSame($sources, PageTitleHeading::inSlot($sources, $component_id, $slot), 'No page title is straight in the slot.');
    $headings = [];
    foreach ($sources as $source) {
      if (($source['source']['component']['component_id'] ?? NULL) === $component_id) {
        foreach ($source['source']['component']['slots'][$slot]['sources'] ?? [] as $slot_source) {
          $component = $slot_source['source']['component'] ?? [];
          if (($component['slots']['title']['sources'][0]['source_id'] ?? NULL) === PageTitleHeading::SOURCE_ID) {
            $headings[] = [$component['component_id'], $component['props']['heading_level']['source']['value']];
          }
        }
      }
    }
    $this->assertSame([['webtheme:heading', 1]], $headings);
  }

  /**
   * The page layouts of the theme, and where they place the page title.
   *
   * @return array
   *   The test cases.
   */
  public static function providerPageLayouts(): array {
    return [
      'sign-in screens' => [
        'config/optional/display_builder_page_layout.page_layout.webtheme_sign_in.yml',
        'webtheme:sign_in',
        'title',
      ],
      'landmarks test fixture' => [
        'tests/fixtures/display_builder_page_layout.page_layout.webtheme_test_landmarks.yml',
        'webtheme:section',
        'content',
      ],
    ];
  }

  /**
   * A Sign in component source.
   *
   * @param array $slots
   *   The sources of its slots, keyed by slot.
   *
   * @return array
   *   The component source.
   */
  private function signIn(array $slots): array {
    $component = ['component_id' => 'webtheme:sign_in', 'variant_id' => NULL];
    foreach ($slots as $slot => $sources) {
      $component['slots'][$slot]['sources'] = $sources;
    }
    return ['source_id' => 'component', 'source' => ['component' => $component]];
  }

}
