Feature: Anonymous user access through Webtheme
  As an anonymous visitor
  I want public pages to load through Webtheme without authentication
  So that visitors can browse the site, log in, and request accounts

  Scenario: Anonymous user can load the front page
    Given I navigate to "/"
    Then I should see "Log in"
     And webtheme is the active default theme

  Scenario: Anonymous user can load the login page
    Given I navigate to "/user/login"
    Then I should see "Username"
     And I should see "Password"

  Scenario: Anonymous user cannot reach the people admin page
    Given I navigate to "/admin/people"
    Then I should see "Access denied"
