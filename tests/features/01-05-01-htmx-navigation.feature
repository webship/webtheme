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

  Scenario: The main content gets the focus and the new page title is announced
    Given I am an anonymous user
     When I go to the homepage
      And I mark the current page
      And I click on the element ".uk-navbar-right .uk-navbar-nav a"
     Then I wait until the URL contains "/user/login"
      And the page should not have been reloaded
      And the element "#main-content" should have the focus
      And "#webtheme-htmx-announcer" should contain text "Log in"
      And "#webtheme-htmx-announcer" should have attribute "aria-live" with value "polite"

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

  Scenario: The offcanvas menu is closed after an HTMX navigation
    Given I am an anonymous user
      And I set the viewport to the "xs" breakpoint
     When I go to the homepage
      And I mark the current page
      And I click on the element ".uk-navbar-toggle"
     Then "#webtheme-offcanvas .webtheme-offcanvas-account" should be visible within 5 seconds
     When I click on the element "#webtheme-offcanvas .webtheme-offcanvas-account a"
     Then I wait until the URL contains "/user/login"
      And the page should not have been reloaded
      And "#webtheme-offcanvas .uk-offcanvas-bar" should be hidden within 5 seconds

  Scenario: The links HTMX must not handle keep the normal navigation
    Given I am logged in as the Drupal administrator
     When I go to "/user/1"
     Then the links to "/user/logout" should be excluded from the HTMX navigation
    Given I am an anonymous user
     When I go to the homepage
     Then the links to "/user/login" should not be excluded from the HTMX navigation
