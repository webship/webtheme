Feature: Webtheme renders without JavaScript console errors
  As a site visitor
  I want every page to load without runtime JavaScript errors
  So that interactive features work and accessibility is not broken

  Scenario: Front page has no JavaScript errors
    Given I start collecting JavaScript errors
     And I navigate to "/"
    Then there are no JavaScript errors on the page

  Scenario: Login page has no JavaScript errors
    Given I start collecting JavaScript errors
     And I navigate to "/user/login"
    Then there are no JavaScript errors on the page

  Scenario: User dashboard has no JavaScript errors
    Given I am a logged in user with the "Webmaster" user
     And I start collecting JavaScript errors
     And I navigate to "/user"
    Then there are no JavaScript errors on the page
