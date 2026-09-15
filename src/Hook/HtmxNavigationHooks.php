<?php

declare(strict_types=1);

namespace Drupal\webtheme\Hook;

use Drupal\Component\Render\MarkupInterface;
use Drupal\Component\Utility\UrlHelper;
use Drupal\Core\Cache\Cache;
use Drupal\Core\Extension\ThemeSettingsProvider;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Hook\Attribute\Hook;
use Drupal\Core\Render\Markup;
use Drupal\Core\Security\TrustedCallbackInterface;
use Drupal\Core\Url;
use Drupal\views\ViewExecutable;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * HTMX navigation of Webtheme, without custom JavaScript.
 *
 * The page wrapper boosts its links with HTMX (see
 * off-canvas-page-wrapper.html.twig) and Drupal core (core/drupal.htmx) loads
 * the assets, settings and behaviors of the swapped page. The rest is done on
 * the server:
 * - the links HTMX must not handle (administration, edit and delete pages,
 *   log out, Display Builder, files) get hx-boost="false", in the rendered
 *   page and in the links rendered later in placeholders;
 * - on a boosted request, the main content gets the autofocus attribute,
 *   which HTMX focuses after the swap;
 * - the page title is printed in a polite live region outside of the wrapper,
 *   updated from each boosted response with hx-select-oob.
 *
 * The open UIkit offcanvas and dropdowns are closed by UIkit itself when HTMX
 * removes them from the page.
 */
class HtmxNavigationHooks implements TrustedCallbackInterface {

  /**
   * The placeholder of the form actions, rendered by renderFormAction().
   *
   * It starts with "form_action_" like the core placeholder, which Webform
   * checks to keep the Form API fields.
   */
  public const string FORM_ACTION_PLACEHOLDER = 'form_action_p_webtheme_htmx_navigation';

  /**
   * The ID of the live region announcing the page title.
   */
  public const string ANNOUNCER_ID = 'webtheme-htmx-announcer';

  /**
   * Paths always loaded with a full page load, without the base path.
   */
  public const array EXCLUDED_PATHS = [
    '#^/admin(/|$)#',
    '#^/user/logout#',
    '#^/batch#',
    '#^/node/add#',
    '#^/node/\d+/(edit|delete|revisions|layout|display-builder)#',
    '#^/(taxonomy/term|media|user|block|comment)/\d+/(edit|delete)#',
    '#/display-builder(/|$)#',
    '#^/(core|modules|themes|profiles|sites|system/files)/#',
    '#\.[a-z0-9]{2,5}$#i',
  ];

  public function __construct(
    protected ThemeSettingsProvider $themeSettingsProvider,
    protected RequestStack $requestStack,
  ) {}

  /**
   * Tells if the HTMX navigation is enabled.
   */
  protected function enabled(): bool {
    return (bool) ($this->themeSettingsProvider->getSetting('htmx_navigation', 'webtheme') ?? TRUE);
  }

  /**
   * Tells if a path must be loaded with a full page load.
   *
   * @param string $path
   *   A path, without the base path, the query and the fragment.
   */
  public static function isExcludedPath(string $path): bool {
    $path = '/' . \ltrim($path, '/');
    foreach (static::EXCLUDED_PATHS as $pattern) {
      if (\preg_match($pattern, $path)) {
        return TRUE;
      }
    }
    return FALSE;
  }

  /**
   * Tells if the link to a URL string must be loaded with a full page load.
   *
   * @param string $href
   *   The URL of the link, as rendered.
   * @param string $host
   *   The host of the site.
   * @param string $base_path
   *   The base path of the site.
   */
  public static function isExcludedHref(string $href, string $host, string $base_path): bool {
    if ($href === '' || \str_starts_with($href, '#')) {
      return FALSE;
    }
    $link_host = \parse_url($href, \PHP_URL_HOST);
    if (\is_string($link_host)) {
      // HTMX never boosts links to another host.
      if (\strcasecmp($link_host, $host) !== 0) {
        return FALSE;
      }
    }
    elseif (\preg_match('#^[a-z][a-z0-9+.-]*:#i', $href)) {
      // mailto:, tel:...
      return FALSE;
    }
    $path = (string) \parse_url($href, \PHP_URL_PATH);
    if ($base_path !== '' && $base_path !== '/' && \str_starts_with($path, $base_path . '/')) {
      $path = \substr($path, \strlen($base_path));
    }
    return static::isExcludedPath($path);
  }

  /**
   * Adds hx-boost="false" to the links HTMX must not handle in markup.
   *
   * Only the start tags of the links are changed: the rest of the markup is
   * kept as it is.
   *
   * @param string $markup
   *   The rendered markup.
   * @param string $host
   *   The host of the site.
   * @param string $base_path
   *   The base path of the site.
   *
   * @return string
   *   The markup, with hx-boost="false" on the excluded links.
   */
  public static function excludeLinksInMarkup(string $markup, string $host, string $base_path): string {
    if (!\str_contains($markup, '<a')) {
      return $markup;
    }
    return (string) \preg_replace_callback('/<a\s[^>]*>/i', static function (array $matches) use ($host, $base_path): string {
      $tag = $matches[0];
      if (\preg_match('/\shx-boost\s*=/i', $tag) || !\preg_match('/\shref\s*=\s*(?:"([^"]*)"|\'([^\']*)\')/i', $tag, $href)) {
        return $tag;
      }
      $url = \html_entity_decode(($href[1] ?? '') !== '' ? $href[1] : ($href[2] ?? ''), \ENT_QUOTES | \ENT_HTML5);
      $excluded = static::isExcludedHref($url, $host, $base_path)
        || \preg_match('/\s(download|data-dialog-type)(\s|=|>)/i', $tag)
        || \preg_match('/\sclass\s*=\s*"[^"]*\buse-ajax\b/i', $tag);
      return $excluded ? \substr($tag, 0, -1) . ' hx-boost="false">' : $tag;
    }, $markup);
  }

  /**
   * Adds the autofocus attribute to the main content of markup.
   *
   * The main content anchor of the page template, or the main element of the
   * page (Display Builder page layouts).
   *
   * @param string $markup
   *   The rendered markup.
   *
   * @return string
   *   The markup, with autofocus on the main content.
   */
  public static function autofocusMainContent(string $markup): string {
    $count = 0;
    $markup = (string) \preg_replace('/<a(\s[^>]*\bid="main-content"[^>]*)>/i', '<a$1 autofocus>', $markup, 1, $count);
    if ($count > 0) {
      return $markup;
    }
    return (string) \preg_replace_callback('/<(main\b[^>]*|[a-z][a-z0-9]*\s[^>]*\brole="main"[^>]*)>/i', static function (array $matches): string {
      $tabindex = \preg_match('/\stabindex\s*=/i', $matches[1]) ? '' : ' tabindex="-1"';
      return '<' . $matches[1] . $tabindex . ' autofocus>';
    }, $markup, 1);
  }

  /**
   * Adds hx-boost="false" to a URL when its link must not be boosted.
   *
   * @param mixed $url
   *   The URL of the link.
   * @param array $attributes
   *   The attributes of the link.
   */
  protected function excludeUrl(mixed $url, array $attributes = []): void {
    if (!$url instanceof Url) {
      return;
    }
    $attributes += $url->getOption('attributes') ?? [];
    $classes = (array) ($attributes['class'] ?? []);
    $excluded = \in_array('use-ajax', $classes, TRUE) || isset($attributes['data-dialog-type']) || isset($attributes['download']);
    if (!$excluded) {
      try {
        $request = $this->requestStack->getCurrentRequest();
        $excluded = static::isExcludedHref($url->toString(), $request?->getHost() ?? '', $request?->getBasePath() ?? '');
      }
      catch (\Exception) {
        return;
      }
    }
    if ($excluded) {
      $url->mergeOptions(['attributes' => ['hx-boost' => 'false']]);
    }
  }

  /**
   * Adds hx-boost="false" to the link render element when needed.
   */
  protected function excludeLinkElement(mixed &$element): void {
    if (\is_array($element) && ($element['#type'] ?? NULL) === 'link' && isset($element['#url'])) {
      $this->excludeUrl($element['#url'], $element['#options']['attributes'] ?? []);
    }
  }

  /**
   * Tells if a form keeps its normal submission, without HTMX.
   *
   * HTMX boosts the forms of the boosted page wrapper too. Only the GET forms
   * without Drupal AJAX (search, exposed filters) stay boosted: the forms
   * posting data (form tokens, redirects, validation errors, file uploads,
   * Antibot changing the form action in the browser) and the AJAX forms keep
   * the normal submission.
   *
   * @param array $element
   *   The form, or a form element.
   * @param bool $ajax_view
   *   Whether the form is the exposed form of a view using AJAX.
   */
  public static function keepsNormalSubmission(array $element, bool $ajax_view = FALSE): bool {
    if ($ajax_view || \strtolower((string) ($element['#method'] ?? 'post')) !== 'get') {
      return TRUE;
    }
    return static::hasAjax($element);
  }

  /**
   * Tells if a form element or one of its children uses Drupal AJAX.
   */
  protected static function hasAjax(array $element, int $depth = 0): bool {
    if (!empty($element['#ajax']) || \in_array('use-ajax-submit', (array) ($element['#attributes']['class'] ?? []), TRUE)) {
      return TRUE;
    }
    if ($depth > 20) {
      return FALSE;
    }
    foreach ($element as $key => $child) {
      if (\is_array($child) && !(\is_string($key) && \str_starts_with($key, '#')) && static::hasAjax($child, $depth + 1)) {
        return TRUE;
      }
    }
    return FALSE;
  }

  /**
   * Form alter, called from PreprocessHooks.
   *
   * A theme implements each hook once.
   *
   * The attribute is set on the form element, not in a 'form' preprocess:
   * webforms are rendered with their own 'webform' wrapper. Without HTMX, the
   * redirect after the submission is a normal page load.
   */
  public function formAlter(array &$form, FormStateInterface $form_state): void {
    $form['#cache']['tags'] = Cache::mergeTags($form['#cache']['tags'] ?? [], ['config:webtheme.settings']);
    if (!$this->enabled()) {
      return;
    }
    $view = $form_state->get('view');
    if (static::keepsNormalSubmission($form, $view instanceof ViewExecutable && $view->ajaxEnabled())) {
      $form['#attributes']['hx-boost'] = 'false';
    }

    // On a page loaded by HTMX, the request has the page state of the
    // previous page in its query (see core/misc/htmx/htmx-assets.js), and the
    // form action is built from that request. The normal submission of the
    // form must not send it: the next page would be rendered without the
    // libraries of the previous page. The action stays a placeholder, so
    // webforms keep their Form API fields.
    $core_placeholder = $form['#action'] ?? NULL;
    if (\is_string($core_placeholder) && isset($form['#attached']['placeholders'][$core_placeholder]) && \str_starts_with($core_placeholder, 'form_action_')) {
      unset($form['#attached']['placeholders'][$core_placeholder]);
      $form['#action'] = static::FORM_ACTION_PLACEHOLDER;
      $form['#attached']['placeholders'][static::FORM_ACTION_PLACEHOLDER] = [
        '#lazy_builder' => [static::class . ':renderFormAction', []],
      ];
    }
  }

  /**
   * Renders the form action without the HTMX page state.
   *
   * A #lazy_builder callback, replacing
   * \Drupal\Core\Form\FormBuilder::renderPlaceholderFormAction().
   *
   * @return array
   *   A renderable array representing the form action.
   */
  public function renderFormAction(): array {
    $request = $this->requestStack->getMainRequest();
    $request_uri = $request?->getRequestUri() ?? '/';
    // Prevent cross site requests by using an absolute URL when the request
    // URI starts with multiple slashes, as core does.
    if ($request && \str_starts_with($request_uri, '//')) {
      $request_uri = $request->getUri();
    }
    return [
      '#markup' => static::removePageState($request_uri),
      '#cache' => ['contexts' => ['url.path', 'url.query_args']],
    ];
  }

  /**
   * {@inheritdoc}
   */
  public static function trustedCallbacks(): array {
    return ['renderFormAction'];
  }

  /**
   * Removes the HTMX page state from a request URI.
   *
   * @param string $request_uri
   *   A request URI, with its query.
   *
   * @return string
   *   The URI without the page state and the wrapper format.
   */
  public static function removePageState(string $request_uri): string {
    $parsed = UrlHelper::parse($request_uri);
    unset(
      $parsed['query']['ajax_page_state'],
      $parsed['query']['_wrapper_format'],
      $parsed['query']['_triggering_element_name'],
      $parsed['query']['_triggering_element_value'],
      $parsed['query']['ajax_form'],
    );
    $path = '/' . \ltrim($parsed['path'], '/');
    return UrlHelper::filterBadProtocol($path . ($parsed['query'] ? '?' . UrlHelper::buildQuery($parsed['query']) : ''));
  }

  /**
   * Implements hook_preprocess_HOOK() for 'html'.
   *
   * Prints the live region announcing the title of the boosted pages.
   */
  #[Hook('preprocess_html')]
  public function preprocessHtml(array &$variables): void {
    if (!$this->enabled()) {
      return;
    }
    $title = \array_map(static fn ($part) => \strip_tags((string) $part), $variables['head_title'] ?? []);
    $variables['page_top'][static::ANNOUNCER_ID] = [
      '#type' => 'html_tag',
      '#tag' => 'div',
      '#value' => \implode(' | ', \array_filter($title)),
      '#attributes' => [
        'id' => static::ANNOUNCER_ID,
        'class' => ['visually-hidden'],
        'aria-live' => 'polite',
        'aria-atomic' => 'true',
      ],
      '#weight' => -1000,
    ];
  }

  /**
   * Preprocess for 'off_canvas_page_wrapper', called from ThemeHooks.
   *
   * A theme implements each hook once.
   *
   * The children of the wrapper are the rendered page: the excluded links get
   * hx-boost="false", and the main content gets the focus on boosted requests.
   */
  public function preprocessOffCanvasPageWrapper(array &$variables): void {
    $variables['htmx_announcer_id'] = static::ANNOUNCER_ID;
    if (!$this->enabled()) {
      return;
    }
    $variables['#cache']['contexts'][] = 'headers:HX-Boosted';
    $children = $variables['children'] ?? NULL;
    if (!\is_string($children) && !$children instanceof MarkupInterface) {
      return;
    }
    $request = $this->requestStack->getCurrentRequest();
    $markup = static::excludeLinksInMarkup((string) $children, $request?->getHost() ?? '', $request?->getBasePath() ?? '');
    if ($request?->headers->has('HX-Boosted')) {
      $markup = static::autofocusMainContent($markup);
    }
    $variables['children'] = Markup::create($markup);
  }

  /**
   * Preprocess for 'menu', called from ThemeHooks.
   *
   * A theme implements each hook once.
   */
  public function preprocessMenu(array &$variables): void {
    if ($this->enabled() && !empty($variables['items'])) {
      $this->excludeMenuItems($variables['items']);
    }
  }

  /**
   * Adds hx-boost="false" to the excluded menu links, recursively.
   */
  protected function excludeMenuItems(array &$items): void {
    foreach ($items as &$item) {
      $this->excludeUrl($item['url'] ?? NULL);
      if (!empty($item['below'])) {
        $this->excludeMenuItems($item['below']);
      }
    }
  }

  /**
   * Implements hook_preprocess_HOOK() for 'links'.
   *
   * Node, comment and contextual links, language switcher...
   */
  #[Hook('preprocess_links')]
  public function preprocessLinks(array &$variables): void {
    if (!$this->enabled() || empty($variables['links'])) {
      return;
    }
    foreach ($variables['links'] as &$link) {
      if (isset($link['link'])) {
        $this->excludeLinkElement($link['link']);
      }
    }
  }

  /**
   * Implements hook_preprocess_HOOK() for 'menu_local_task'.
   */
  #[Hook('preprocess_menu_local_task')]
  public function preprocessMenuLocalTask(array &$variables): void {
    if ($this->enabled() && isset($variables['link'])) {
      $this->excludeLinkElement($variables['link']);
    }
  }

  /**
   * Preprocess for 'menu_local_action', called from ThemeHooks.
   *
   * A theme implements each hook once.
   */
  public function preprocessMenuLocalAction(array &$variables): void {
    if ($this->enabled() && isset($variables['link'])) {
      $this->excludeLinkElement($variables['link']);
    }
  }

  /**
   * Implements hook_preprocess_HOOK() for 'file_link'.
   */
  #[Hook('preprocess_file_link')]
  public function preprocessFileLink(array &$variables): void {
    if ($this->enabled() && isset($variables['link'])) {
      $this->excludeLinkElement($variables['link']);
    }
  }

  /**
   * Implements hook_preprocess_HOOK() for 'image_formatter'.
   */
  #[Hook('preprocess_image_formatter')]
  #[Hook('preprocess_responsive_image_formatter')]
  public function preprocessImageFormatter(array &$variables): void {
    if ($this->enabled()) {
      $this->excludeUrl($variables['url'] ?? NULL);
    }
  }

  /**
   * Implements hook_preprocess_HOOK() for 'field'.
   *
   * Link fields rendered in placeholders.
   */
  #[Hook('preprocess_field')]
  public function preprocessField(array &$variables): void {
    if (!$this->enabled() || empty($variables['items'])) {
      return;
    }
    foreach ($variables['items'] as &$item) {
      if (isset($item['content']) && \is_array($item['content'])) {
        $this->excludeLinkElement($item['content']);
      }
    }
  }

}
