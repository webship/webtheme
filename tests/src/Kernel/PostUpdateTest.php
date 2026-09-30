<?php

declare(strict_types=1);

namespace Drupal\Tests\webtheme\Kernel;

use Drupal\KernelTests\KernelTestBase;
use PHPUnit\Framework\Attributes\CoversNothing;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests the post updates of the theme settings.
 */
#[CoversNothing]
#[RunTestsInSeparateProcesses]
#[Group('webtheme')]
final class PostUpdateTest extends KernelTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'system',
    'ui_patterns',
    'ui_skins',
    'ui_styles',
    'ui_icons',
    'ui_icons_patterns',
  ];

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    $this->container->get('theme_installer')->install(['webtheme']);
    require_once \dirname(__DIR__, 3) . '/webtheme.post_update.php';
  }

  /**
   * Tests the saved design tokens keep their name and their look.
   */
  public function testUiSkinsTokenValues(): void {
    $this->config('webtheme.settings')
      ->set('third_party_settings.ui_skins.css_variables', [
        'webtheme-global-inverse-color' => [':root' => '#fff'],
        'webtheme-global-border' => [':root[data-theme="dark"]' => '#abc'],
        'webtheme-global-primary-background' => [':root' => '#7a1f5c'],
        'webtheme-global-danger-background' => [':root' => '#990000'],
        'webtheme-danger-color' => [':root' => '#880000'],
        'webtheme-form-border' => [':root' => '#666666', ':root[data-theme="dark"]' => '#999999'],
        'webtheme-global-emphasis-color' => [':root[data-theme="dark"]' => '#eeeeee'],
      ])
      ->save();

    webtheme_post_update_ui_skins_token_values();

    $variables = $this->config('webtheme.settings')->get('third_party_settings.ui_skins.css_variables');
    $this->assertSame('#ffffffff', $variables['webtheme-global-inverse-color'][':root']);
    $this->assertSame('#aabbccff', $variables['webtheme-global-border'][':root[data-theme="dark"]']);
    $this->assertSame('#7a1f5c', $variables['webtheme-global-primary-color'][':root']);
    $this->assertSame('#880000', $variables['webtheme-global-danger-color'][':root']);
    $this->assertSame('#999999', $variables['webtheme-form-border-color'][':root[data-theme="dark"]']);
    $this->assertSame('#eeeeee', $variables['webtheme-focus-color'][':root[data-theme="dark"]']);
    $this->assertArrayNotHasKey('webtheme-danger-color', $variables);
    $this->assertArrayNotHasKey('webtheme-form-border', $variables);
    $this->assertArrayNotHasKey('webtheme-global-success-color', $variables);
  }

  /**
   * Tests a site without saved design tokens is left as it is.
   */
  public function testNoSavedTokens(): void {
    webtheme_post_update_ui_skins_token_values();
    $this->assertNull($this->config('webtheme.settings')->get('third_party_settings.ui_skins.css_variables'));
  }

  /**
   * Tests the existing sites get the font of the theme.
   */
  public function testFontFamily(): void {
    webtheme_post_update_font_family();
    $this->assertSame('atkinson', $this->config('webtheme.settings')->get('font_family'));

    $this->config('webtheme.settings')->set('font_family', 'system')->save();
    webtheme_post_update_font_family();
    $this->assertSame('system', $this->config('webtheme.settings')->get('font_family'));
  }

  /**
   * Tests the existing sites get the options of the sign-in screens.
   */
  public function testSignInOptions(): void {
    $this->config('webtheme.settings')->set('sign_in_layout', 'end')->save();
    webtheme_post_update_sign_in_options();
    $settings = $this->config('webtheme.settings');
    $this->assertSame('end', $settings->get('sign_in_layout'));
    $this->assertFalse($settings->get('sign_in_header'));
    $this->assertSame('site', $settings->get('sign_in_logo'));
    $this->assertSame('', $settings->get('sign_in_page_layout'));
    $this->assertSame('en', $settings->get('langcode'));
  }

}
