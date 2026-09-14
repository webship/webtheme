Feature: The offcanvas menu on small screens
  As a visitor on a phone
  I want the main menu in an offcanvas panel
  So that I can navigate the site on a small screen

  Scenario: The navbar toggle opens and closes the offcanvas menu
    Given I am an anonymous user
      And I set the viewport to the "xs" breakpoint
     When I go to the homepage
     Then ".uk-navbar-center .uk-navbar-nav" should be hidden
      And ".uk-navbar-toggle" should be visible
     When I click on the element ".uk-navbar-toggle"
     Then "#webtheme-offcanvas .uk-offcanvas-bar" should be visible within 5 seconds
      And "#webtheme-offcanvas .uk-nav-primary" should contain text "Home"
     When I click on the element "#webtheme-offcanvas .uk-offcanvas-close"
     Then "#webtheme-offcanvas .uk-offcanvas-bar" should be hidden within 5 seconds

  Scenario: The navbar menu is visible on large screens
    Given I am an anonymous user
      And I set the viewport to the "l" breakpoint
     When I go to the homepage
     Then ".uk-navbar-center .uk-navbar-nav" should be visible
      And ".uk-navbar-toggle" should be hidden
