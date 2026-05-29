Feature: Webtheme is free of JavaScript errors
  As a site visitor
  I want every page to run without JavaScript errors or warnings
  So that the theme's vanilla-JS behaviors work and nothing breaks the
  page — anonymous, authenticated, and on interior pages

  Scenario: The front page has no JavaScript errors
    Given I navigate to "/node"
    Then there should be no JavaScript errors

  Scenario: The login page has no JavaScript errors
    Given I navigate to "/user/login"
    Then there should be no JavaScript errors

  Scenario: The admin block layout has no JavaScript errors
    Given I am a logged in user with the "Webmaster" user
    When I navigate to "/admin/structure/block"
    Then there should be no JavaScript errors

  Scenario: A full article page has no JavaScript errors
    Given I am a logged in user with the "Webmaster" user
    When I navigate to "/node"
     And I open the "Webtheme demo article 12" article
    Then there should be no JavaScript errors
