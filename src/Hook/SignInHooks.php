<?php

declare(strict_types=1);

namespace Drupal\webtheme\Hook;

use Drupal\block\BlockInterface;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Controller\TitleResolverInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Extension\ModuleHandlerInterface;
use Drupal\Core\Extension\ThemeExtensionList;
use Drupal\Core\Extension\ThemeSettingsProvider;
use Drupal\Core\File\FileUrlGeneratorInterface;
use Drupal\Core\Hook\Attribute\Hook;
use Drupal\Core\Routing\RouteMatchInterface;
use Drupal\Core\Session\AccountInterface;
use Drupal\Core\StringTranslation\StringTranslationTrait;
use Drupal\Core\Url;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * The sign-in screens: log in, create an account, reset the password.
 *
 * The screens get a page of their own, page--sign-in.html.twig, drawn with
 * the sign_in component. The blocks of the page are sorted into its slots:
 * the messages, the form, the other blocks of the content. The layout, the
 * header, the footer, the logo and the texts come from the theme settings.
 */
class SignInHooks {

  use StringTranslationTrait;

  /**
   * The routes of the sign-in screens, and the screen of each one.
   */
  public const array ROUTES = [
    'user.login' => 'login',
    'user.register' => 'register',
    'user.pass' => 'password',
    'user.reset' => 'reset',
    'user.reset.form' => 'reset',
    'user.reset.login' => 'reset',
    'user.logout.confirm' => 'logout',
  ];

  /**
   * The paths of the sign-in screens, for the pages of an error on them.
   */
  public const array PATHS = [
    '/user/login' => 'login',
    '/user/register' => 'register',
    '/user/password' => 'password',
    '/user/logout/confirm' => 'logout',
  ];

  /**
   * The layouts of the sign-in screens.
   */
  public const array LAYOUTS = ['center', 'start', 'end', 'top', 'bottom', 'spotlight'];

  /**
   * The sources of the logo.
   */
  public const array LOGOS = ['site', 'theme', 'none'];

  public function __construct(
    protected ThemeSettingsProvider $themeSettingsProvider,
    protected RouteMatchInterface $routeMatch,
    protected RequestStack $requestStack,
    protected EntityTypeManagerInterface $entityTypeManager,
    protected TitleResolverInterface $titleResolver,
    protected ConfigFactoryInterface $configFactory,
    protected ThemeExtensionList $themeExtensionList,
    protected FileUrlGeneratorInterface $fileUrlGenerator,
    protected AccountInterface $currentUser,
    protected ModuleHandlerInterface $moduleHandler,
  ) {}

  /**
   * The sign-in screen of the page, or NULL on another page.
   *
   * The page of an error (403, 404) on a sign-in path, like /user/register
   * when only administrators create accounts, is a sign-in screen too.
   *
   * @return string|null
   *   One of login, register, password, reset, logout.
   */
  public function screen(): ?string {
    $route = (string) $this->routeMatch->getRouteName();
    $path = $this->mainPath();
    if (isset(self::ROUTES[$route])) {
      // The error page of /user/register can be the log in form.
      return $path === '/user/register' && $route !== 'user.register' ? 'register' : self::ROUTES[$route];
    }
    if (\in_array($route, ['system.401', 'system.403', 'system.404'], TRUE)) {
      if (\str_starts_with($path, '/user/reset/')) {
        return 'reset';
      }
      return self::PATHS[$path] ?? NULL;
    }
    return NULL;
  }

  /**
   * The path of the main request, without the base path and the language.
   */
  protected function mainPath(): string {
    $request = $this->requestStack->getMainRequest();
    return $request ? \rtrim($request->getPathInfo(), '/') : '';
  }

  /**
   * A setting of the theme.
   */
  protected function setting(string $name, mixed $default = NULL): mixed {
    return $this->themeSettingsProvider->getSetting($name, 'webtheme') ?? $default;
  }

  /**
   * Tells if visitors can create an account.
   */
  protected function registrationOpen(): bool {
    return $this->configFactory->get('user.settings')->get('register') !== 'admin_only';
  }

  /**
   * Adds the sign-in variables to the page.
   *
   * @param array $variables
   *   The variables of the page template.
   *
   * @see \Drupal\webtheme\Hook\ThemeHooks::preprocessPage()
   */
  public function preprocessPage(array &$variables): void {
    $variables['#cache']['contexts'][] = 'route';
    $variables['#cache']['contexts'][] = 'url.path';
    $screen = $this->screen();
    if ($screen === NULL) {
      return;
    }
    $variables['#cache']['tags'][] = 'config:webtheme.settings';
    $variables['#cache']['tags'][] = 'config:user.settings';
    $variables['#cache']['tags'][] = 'config:system.site';

    $sign_in = $this->props($screen);
    $request = $this->requestStack->getCurrentRequest();
    $route = $this->routeMatch->getRouteObject();
    $sign_in['title'] = $request && $route ? $this->titleResolver->getTitle($request, $route) : '';
    $sign_in['links'] = $this->links($screen);
    $sign_in['messages'] = [];
    $sign_in['content'] = [];

    // The blocks of the page, sorted into the slots of the component.
    foreach (['highlighted', 'help', 'header', 'content'] as $region) {
      $elements = $variables['page'][$region] ?? [];
      if (!\is_array($elements)) {
        continue;
      }
      $blocks = $this->entityTypeManager->hasDefinition('block') ? $this->entityTypeManager->getStorage('block')->loadMultiple(\array_filter(\array_keys($elements), 'is_string')) : [];
      foreach ($elements as $key => $element) {
        if (!\is_array($element) || \str_starts_with((string) $key, '#')) {
          continue;
        }
        $plugin = isset($blocks[$key]) && $blocks[$key] instanceof BlockInterface ? $blocks[$key]->getPluginId() : ($element['#plugin_id'] ?? '');
        $slot = match (TRUE) {
          $plugin === 'system_messages_block' => 'messages',
          \in_array($plugin, ['page_title_block', 'local_tasks_block', 'local_actions_block', 'system_breadcrumb_block'], TRUE) => NULL,
          $region === 'header' => NULL,
          default => 'content',
        };
        if ($slot) {
          $sign_in[$slot][$key] = $element;
        }
      }
    }

    // Without a messages block, the screen prints the messages itself: a
    // wrong password must always say so.
    if (!$sign_in['messages']) {
      $sign_in['messages']['webtheme_messages'] = ['#type' => 'status_messages'];
    }
    if ($screen === 'register' && $this->routeMatch->getRouteName() !== 'user.register' && !$this->registrationOpen()) {
      $sign_in['messages']['webtheme_registration_closed'] = [
        '#type' => 'component',
        '#component' => 'webtheme:alert',
        '#props' => ['variant' => 'primary'],
        '#slots' => ['message' => $this->t('Accounts are created by an administrator.')],
        '#weight' => -100,
      ];
    }
    $variables['sign_in'] = $sign_in;
  }

  /**
   * The props of the sign-in component from the theme settings.
   *
   * @param string $screen
   *   The screen.
   *
   * @return array
   *   The props, and the help text.
   */
  public function props(string $screen): array {
    $layout = $this->setting('sign_in_layout', 'center');
    $logo = $this->setting('sign_in_logo', 'site');
    $logo_url = match (\in_array($logo, self::LOGOS, TRUE) ? $logo : 'site') {
      'site' => (string) $this->setting('logo.url', ''),
      'theme' => $this->fileUrlGenerator->generateString($this->themeExtensionList->getPath('webtheme') . '/logo.svg'),
      default => '',
    };
    return [
      'layout' => \in_array($layout, self::LAYOUTS, TRUE) ? $layout : 'center',
      'screen' => $screen,
      'site_name' => (string) $this->configFactory->get('system.site')->get('name'),
      'home_url' => Url::fromRoute('<front>')->toString(),
      'logo' => $logo_url,
      'logo_alt' => '',
      'message' => \mb_substr((string) $this->setting('sign_in_message', ''), 0, 160),
      'image' => (string) $this->setting('sign_in_image', ''),
      'image_credit' => (string) $this->setting('sign_in_image_credit', ''),
      'show_header' => (bool) $this->setting('sign_in_header', FALSE),
      'show_footer' => (bool) $this->setting('sign_in_footer', FALSE),
      'help' => (string) $this->setting('sign_in_help', ''),
    ];
  }

  /**
   * The links to the other sign-in screens.
   *
   * @param string $screen
   *   The screen.
   *
   * @return array
   *   A render array: a list of plain links, or nothing.
   */
  public function links(string $screen): array {
    $links = [];
    if ($this->currentUser->isAnonymous()) {
      if ($screen !== 'login') {
        $links[] = ['title' => $this->t('Log in'), 'url' => Url::fromRoute('user.login')->toString()];
      }
      if (\in_array($screen, ['login', 'password'], TRUE) && $this->registrationOpen()) {
        $links[] = ['title' => $this->t('Create new account'), 'url' => Url::fromRoute('user.register')->toString()];
      }
      if (\in_array($screen, ['register', 'blocked'], TRUE)) {
        $links[] = ['title' => $this->t('Reset your password'), 'url' => Url::fromRoute('user.pass')->toString()];
      }
    }
    if ($screen === 'blocked') {
      $links[] = ['title' => $this->t('Go to the front page'), 'url' => Url::fromRoute('<front>')->toString()];
    }
    if (!$links) {
      return [];
    }
    return [
      '#type' => 'inline_template',
      '#template' => '<ul>{% for link in links %}<li><a href="{{ link.url }}">{{ link.title }}</a></li>{% endfor %}</ul>',
      '#context' => ['links' => $links],
    ];
  }

  /**
   * Implements hook_preprocess_HOOK() for 'maintenance_page'.
   *
   * The page core shows after too many failed log in attempts is a bare
   * maintenance page: it gets the sign-in screen, blocked.
   *
   * @see templates/layout/maintenance-page--flood.html.twig
   */
  #[Hook('preprocess_maintenance_page')]
  public function preprocessMaintenancePage(array &$variables): void {
    $variables['sign_in'] = $this->props('blocked');
    $variables['sign_in']['links'] = $this->links('blocked');
    $variables['#cache']['tags'][] = 'config:webtheme.settings';
  }

}
