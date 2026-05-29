Feature: Webtheme CSS and JS libraries load on key pages
  As a developer
  I want webtheme's libraries to be attached on every front-facing page
  So that the theme styling and behaviors are available for the user

  Scenario: Front page loads core Webtheme CSS
    Given I navigate to "/"
    Then the "css/base/base.css" Webtheme asset is loaded
     And the "css/layout/layout.css" Webtheme asset is loaded

  Scenario: Front page loads core Webtheme JavaScript
    Given I navigate to "/"
    Then the "js/checkbox.js" Webtheme asset is loaded
     And the "js/navigation.js" Webtheme asset is loaded

  Scenario: Login page loads core Webtheme CSS
    Given I navigate to "/user/login"
    Then the "css/base/base.css" Webtheme asset is loaded
