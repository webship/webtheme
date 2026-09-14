Feature: HTMX navigation
  As a visitor
  I want to move between pages without full page reloads
  So that the navigation is fast and the UIkit components keep working

  Scenario: The links of the page are boosted by HTMX
    Given I am an anonymous user
     When I go to the homepage
     Then "[data-off-canvas-main-canvas]" should have attribute "hx-boost" with value "true"
      And the HTMX library should be loaded
     When I mark the current page
      And I click on the element ".uk-navbar-right .uk-navbar-nav a"
     Then I wait until the URL contains "/user/login"
      And the page should not have been reloaded
      And "#edit-name" should be visible within 10 seconds
      And "#edit-name" should have class "uk-input"
      And the UIkit JavaScript version should be "3.25.22"
      And there should be no JavaScript errors

  Scenario: Drupal forms keep their normal submission
    Given I am an anonymous user
     When I go to "/user/login"
     Then "form#user-login-form" should have attribute "hx-boost" with value "false"

  Scenario: The UIkit components work after an HTMX navigation
    Given I am an anonymous user
      And I set the viewport to the "xs" breakpoint
     When I go to "/user/login"
      And I mark the current page
      And I click on the element ".uk-navbar-left .uk-logo"
     Then I wait until the URL contains "/"
      And the page should not have been reloaded
     When I click on the element ".uk-navbar-toggle"
     Then "#webtheme-offcanvas .uk-offcanvas-bar" should be visible within 5 seconds

  Scenario: Administration pages and files are loaded without HTMX
    Given I am an anonymous user
     When I go to the homepage
     Then the URL "/admin/content" should be excluded from the HTMX navigation
      And the URL "/user/logout" should be excluded from the HTMX navigation
      And the URL "/sites/default/files/image.jpg" should be excluded from the HTMX navigation
      And the URL "/user/login" should not be excluded from the HTMX navigation
