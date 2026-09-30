@ui-skins
Feature: The fonts are served by the theme
  As a visitor
  I want one readable font on every device, loaded from the site itself
  So that I can tell the letters apart and no other site knows what I read

  Scenario: The text, the headings and the code use the fonts of the theme
    Given I am an anonymous user
     When I go to the homepage
     Then "html" should have attribute "data-font" with value "atkinson"
      And the computed style "font-family" of "body" should contain "Atkinson Hyperlegible Next"
      And the computed style "font-family" of ".uk-logo" should contain "Atkinson Hyperlegible Next"
      And an "h2" element added to "main" should have the computed style "font-family" containing "Zen Maru Gothic"
      And a "code" element added to "main" should have the computed style "font-family" containing "Atkinson Hyperlegible Mono"
      And a "pre" element added to "main" should have the computed style "font-variant-ligatures" containing "none"

  Scenario: The font files come from the theme, and from no other site
    Given I am an anonymous user
      And I record the requests of the page
     When I go to the homepage
      And the fonts of the page are loaded
     Then the file "atkinson-hyperlegible-next-latin-wght-normal.woff2" should be requested once, with the status 200, from "/webtheme/assets/fonts/atkinson-hyperlegible-next/"
      And no request should go to "fonts.googleapis.com"
      And no request should go to "fonts.gstatic.com"
      And no request should go to "noto-sans-arabic"
      And there should be no JavaScript errors

  Scenario Outline: The lines of a paragraph hold at most 80 characters at <width> pixels
    Given I am an anonymous user
      And I set the viewport to <width> by 900
     When I go to the homepage
     Then a paragraph in "main" should have at most 80 characters per line

    Examples:
      | width |
      | 1440  |
      | 960   |

  Scenario: The font of the operating system is a theme setting
    Given I am logged in as the Drupal administrator
     When I pick "The fonts of the operating system" in the settings of the UIkit theme
      And I am an anonymous user
      And I record the requests of the page
      And I go to "/?font=system"
      And the fonts of the page are loaded
     Then "html" should have attribute "data-font" with value "system"
      And the computed style "font-family" of "body" should contain "system-ui"
      And no request should go to ".woff2"
    Given I am logged in as the Drupal administrator
     When I pick "Atkinson Hyperlegible Next" in the settings of the UIkit theme
      And I am an anonymous user
      And I go to "/?font=atkinson"
     Then "html" should have attribute "data-font" with value "atkinson"
      And the computed style "font-family" of "body" should contain "Atkinson Hyperlegible Next"

  Scenario: A font family saved in UI Skins replaces the font of the theme
    Given I am logged in as the Drupal administrator
     When I set the UI Skins CSS variable "webtheme-global-font-family" of the UIkit theme to "Georgia, serif"
      And I set the UI Skins CSS variable "webtheme-measure" of the UIkit theme to "24em"
      And I am an anonymous user
      And I go to "/?font=georgia"
     Then the computed style "font-family" of "body" should be "Georgia, serif"
      And the computed style "--uk-measure" of "html" should be "24em"
    Given I am logged in as the Drupal administrator
     When I set the UI Skins CSS variable "webtheme-global-font-family" of the UIkit theme to "var(--uk-font-family-sans)"
      And I set the UI Skins CSS variable "webtheme-measure" of the UIkit theme to "32em"
      And I am an anonymous user
      And I go to "/?font=default"
     Then the computed style "font-family" of "body" should contain "Atkinson Hyperlegible Next"
