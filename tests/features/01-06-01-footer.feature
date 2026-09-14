Feature: The footer
  As a visitor
  I want the footer to show the logo, the footer menus and the copyright
  So that every page ends with the Webship.co footer

  Scenario: The footer shows the logo, the copyright and the back to top link
    Given I am an anonymous user
     When I go to the homepage
     Then "footer .webtheme-footer-logo img" should be visible
      And "footer .webtheme-footer-copyright" should contain text "Webtheme Test"
      And "footer .webtheme-footer-copyright" should contain the current year
      And "footer [uk-totop]" should be visible
