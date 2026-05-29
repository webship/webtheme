Feature: Webtheme responsive navigation
  As a site visitor on any device
  I want the navigation to adapt to the viewport
  So that wide screens get the full primary menu and narrow screens get
  the mobile toggle, with no JavaScript errors at any breakpoint

  Scenario: A wide (xl) viewport shows the primary navigation, not the mobile toggle
    Given I am viewing the site on a "xl" screen
     And I navigate to "/node"
    Then ".site-header" should be visible
     And ".primary-nav__menu" should be visible
     And ".mobile-nav-button" should not be visible
     And there should be no JavaScript errors

  Scenario: A narrow (xs) viewport shows the mobile navigation toggle
    Given I am viewing the site on a "xs" screen
     And I navigate to "/node"
    Then ".mobile-nav-button" should be visible
     And ".site-header" should be visible
     And there should be no JavaScript errors

  Scenario: The login page is usable on a small (sm) viewport
    Given I am viewing the site on a "sm" screen
     And I navigate to "/user/login"
    Then "#page-wrapper" should be visible
     And the "Log in" button should be visible
