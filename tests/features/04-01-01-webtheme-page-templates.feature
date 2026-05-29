Feature: Webtheme page templates render the documented wrappers
  As a developer
  I want Webtheme's page templates to render the wrappers and IDs
  documented in templates/layout/*.html.twig
  So that downstream subthemes can rely on those selectors

  Scenario: Front page renders the page wrapper template
    Given I navigate to "/"
    Then I see visible Webtheme page wrapper
     And I see visible Webtheme main wrapper

  Scenario: Login page renders the skip link
    Given I navigate to "/user/login"
    Then I see visible Webtheme skip link
