Feature: Webtheme structural selectors and web-first assertions
  As a developer building on Webtheme
  I want the documented layout wrappers, header, breadcrumb and page title
  to be reliably present
  So that sub-themes and tests can target them with stable selectors

  Scenario: The core layout wrappers render via their named selectors
    Given I navigate to "/user/login"
    Then I see visible Webtheme page wrapper
     And I see visible Webtheme main wrapper
     And I see visible Webtheme site header
     And I see visible Webtheme skip link

  Scenario: Web-first selectors resolve the page shell
    Given I navigate to "/user/login"
    Then "#page-wrapper" should be visible
     And "#main-wrapper" should be visible
     And ".skip-link" should be attached

  Scenario: Interior pages render the breadcrumb and page-title regions
    Given I navigate to "/user/login"
    Then "h1.page-title" should be visible
     And "nav.breadcrumb" should be visible
     And "h1.page-title" should contain text "Log in"
