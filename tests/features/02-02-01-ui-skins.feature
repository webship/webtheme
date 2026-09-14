Feature: UI Skins design tokens and color modes
  As a site builder
  I want to change the UIkit design tokens and the color mode from the UI Skins settings
  So that the whole UIkit design system follows the brand without code

  Scenario: A CSS variable changes the UIkit primary color
    Given I am logged in as the Drupal administrator
     When I set the UI Skins CSS variable "uk-global-primary-background" of the UIkit theme to "#ff3300"
      And I am an anonymous user
      And I go to "/user/login"
     Then the computed style "background-color" of "#edit-submit" should be "rgb(255, 51, 0)"
    Given I am logged in as the Drupal administrator
     When I set the UI Skins CSS variable "uk-global-primary-background" of the UIkit theme to "#0c7fc8"
      And I am an anonymous user
      And I go to "/user/login"
     Then the computed style "background-color" of "#edit-submit" should be "rgb(12, 127, 200)"

  Scenario: The dark color mode is selected in the theme settings
    Given I am logged in as the Drupal administrator
     When I select the UI Skins theme "Dark" for the UIkit theme
      And I am an anonymous user
      And I go to "/user/login"
     Then "html" should have attribute "data-theme" with value "dark"
      And the computed style "background-color" of "html" should be "rgb(23, 23, 23)"
    Given I am logged in as the Drupal administrator
     When I select the UI Skins theme "Light" for the UIkit theme
      And I am an anonymous user
      And I go to "/user/login"
     Then the computed style "background-color" of "html" should be "rgb(255, 255, 255)"
