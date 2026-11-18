@mobile
Feature: Webtheme mobile menu
  As a visitor on a phone or a tablet
  I want the Menu button to open the main menu, its links to open their
  pages, and the Menu button, the Escape key and the overlay beside the menu
  to close it
  So that I can reach the pages of the site on a small screen

  The open menu slides in over the page, with an overlay behind it. On a
  phone (xs) the menu takes the whole width; on a tablet (md) the overlay
  shows beside it.

  Scenario: On a phone, the Menu button opens the main menu and closes it
    Given I am viewing the site on a "xs" device
      And I navigate to "/node"
     Then ".mobile-nav-button" should have attribute "aria-expanded" with value "false"
      And "#header-nav" should be hidden
     When I tap on ".mobile-nav-button"
     Then ".mobile-nav-button" should have attribute "aria-expanded" with value "true"
      And "#header-nav .primary-nav__menu-link" should be in the viewport
      And "#header-nav .secondary-nav__menu-link" should be in the viewport
     When I tap on ".mobile-nav-button"
     Then ".mobile-nav-button" should have attribute "aria-expanded" with value "false"
      And "#header-nav" should be hidden
      And there should be no JavaScript errors

  Scenario: On a phone, a link in the open menu opens its page
    Given I am viewing the site on a "xs" device
      And I navigate to "/node"
     When I tap on ".mobile-nav-button"
     Then "#header-nav .secondary-nav__menu-link" should be in the viewport
     When I tap on "#header-nav .secondary-nav__menu-link"
     Then "h1.page-title" should contain text "Log in"
      And the path should be "/user/login"

  Scenario: On a phone, the Escape key closes the open menu
    Given I am viewing the site on a "xs" device
      And I navigate to "/node"
     When I tap on ".mobile-nav-button"
     Then ".mobile-nav-button" should have attribute "aria-expanded" with value "true"
     When I press the key "Escape"
     Then ".mobile-nav-button" should have attribute "aria-expanded" with value "false"
      And "#header-nav" should be hidden

  Scenario: On a phone, a touch on the overlay closes the open menu
    Given I am viewing the site on a "xs" device
      And I navigate to "/node"
     When I tap on ".mobile-nav-button"
     Then ".mobile-nav-button" should have attribute "aria-expanded" with value "true"
     When I trigger the JS event "touchstart" on the element ".header-nav-overlay"
     Then ".mobile-nav-button" should have attribute "aria-expanded" with value "false"
      And "#header-nav" should be hidden

  Scenario: On a tablet, a tap beside the open menu closes it
    Given I am viewing the site on a "md" device
      And I navigate to "/node"
     When I tap on ".mobile-nav-button"
     Then ".mobile-nav-button" should have attribute "aria-expanded" with value "true"
      And ".header-nav-overlay" should be visible
     When I tap beside the open menu
     Then ".mobile-nav-button" should have attribute "aria-expanded" with value "false"
      And "#header-nav" should be hidden
      And the path should be "/node"
