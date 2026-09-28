Feature: The footer
  As a visitor
  I want the footer to show the logo, the footer menus and the copyright
  So that every page ends with the Webship.co footer

  The footer is printed by the page template of the theme, on the pages of
  the block layout (a page not found is always one of them).

  Scenario: The footer shows the logo, the copyright and the back to top link
    Given I am an anonymous user
     When I go to "/no-such-page"
     Then "footer .webtheme-footer-logo img" should be visible
      And the computed style "background-color" of "footer.uk-section-secondary" should be "rgb(49, 54, 55)"
      And "footer .webtheme-footer-copyright" should contain the site name
      And "footer .webtheme-footer-copyright" should contain the current year
      And "footer [uk-totop]" should be visible
