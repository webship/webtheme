Feature: The offcanvas menu on small screens
  As a visitor on a phone
  I want the main menu in an offcanvas panel
  So that I can navigate the site on a small screen

  The pages are checked with the block layout (a page not found) and with
  the front page, which a site can render with a Display Builder page layout.

  Scenario Outline: The navbar toggle opens and closes the offcanvas menu on <name>
    Given I am an anonymous user
      And I set the viewport to the "xs" breakpoint
     When I go to "<path>"
     Then ".uk-navbar-center .uk-navbar-nav" should be hidden
      And ".uk-navbar-toggle" should be visible
     When I click on the element ".uk-navbar-toggle"
     Then ".uk-offcanvas .uk-offcanvas-bar" should be visible within 5 seconds
      And ".uk-offcanvas .uk-nav-primary > li > a" should be visible
     When I click on the element ".uk-offcanvas .uk-offcanvas-close"
     Then ".uk-offcanvas .uk-offcanvas-bar" should be hidden within 5 seconds

    Examples:
      | path          | name                 |
      | /             | the front page       |
      | /no-such-page | a page of the blocks |

  Scenario Outline: The navbar fits in one row on a phone, with the account menu in the offcanvas on <name>
    Given I am an anonymous user
      And I set the viewport to the "xs" breakpoint
     When I go to "<path>"
     Then ".uk-navbar-right .uk-navbar-nav" should be hidden
      And ".uk-navbar-left .uk-logo" and ".uk-navbar-toggle" should be on the same row
      And the page should not scroll horizontally
     When I click on the element ".uk-navbar-toggle"
     Then ".uk-offcanvas-bar a[href$='/user/login']" should be visible within 5 seconds

    Examples:
      | path          | name                 |
      | /             | the front page       |
      | /no-such-page | a page of the blocks |

  Scenario: The account menu of the block layout is printed in the offcanvas
    Given I am an anonymous user
      And I set the viewport to the "xs" breakpoint
     When I go to "/no-such-page"
      And I click on the element ".uk-navbar-toggle"
     Then "#webtheme-offcanvas .webtheme-offcanvas-account" should be visible within 5 seconds
      And "#webtheme-offcanvas .webtheme-offcanvas-account" should contain text "Log in"

  Scenario: The navbar menu is visible on large screens
    Given I am an anonymous user
      And I set the viewport to the "l" breakpoint
     When I go to the homepage
     Then ".uk-navbar-center .uk-navbar-nav" should be visible
      And ".uk-navbar-toggle" should be hidden
