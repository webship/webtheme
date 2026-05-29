Feature: Webtheme does not depend on jQuery
  As a site administrator
  I want anonymous pages to load without jQuery
  So that the theme can ship on jQuery-free Drupal builds and pages stay
  light by default

  Scenario: Front page does not attach core/jquery for anonymous users
    Given I navigate to "/"
    Then the page does not load jQuery

  Scenario: Login page does not attach core/jquery for anonymous users
    Given I navigate to "/user/login"
    Then the page does not load jQuery
