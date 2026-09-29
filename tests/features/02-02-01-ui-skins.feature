@ui-skins
Feature: UI Skins design tokens and color modes
  As a site builder
  I want to change the UIkit design tokens from UI Skins and the color mode from the theme settings
  So that the whole UIkit design system follows the brand without code

  The UI Skins settings of the theme are saved before each scenario and
  restored after it, even when it fails.

  Scenario: A CSS variable changes the UIkit primary color
    Given the "webform" module is enabled
      And I am logged in as the Drupal administrator
     When I set the UI Skins CSS variable "webtheme-global-primary-background" of the UIkit theme to "#ff3300"
      And I am an anonymous user
      And I go to "/form/contact"
     Then the computed style "background-color" of "#edit-actions-submit" should be "rgb(255, 51, 0)"
    Given I am logged in as the Drupal administrator
     When I set the UI Skins CSS variable "webtheme-global-primary-background" of the UIkit theme to "#07527f"
      And I am an anonymous user
      And I go to "/form/contact"
     Then the computed style "background-color" of "#edit-actions-submit" should be "rgb(7, 82, 127)"

  Scenario: The dark color mode is selected in the theme settings
    Given I am logged in as the Drupal administrator
     When I set the color mode of the UIkit theme to "Dark"
      And I am an anonymous user
      And I go to "/no-such-page"
     Then "html" should have attribute "data-theme" with value "dark"
      And the computed style "background-color" of "html" should be "rgb(23, 23, 23)"
    Given I am logged in as the Drupal administrator
     When I set the color mode of the UIkit theme to "Light"
      And I am an anonymous user
      And I go to "/no-such-page"
     Then "html" should have attribute "data-theme" with value "light"
      And the computed style "background-color" of "html" should be "rgb(255, 255, 255)"

  Scenario: The color mode follows the operating system
    Given I am logged in as the Drupal administrator
     When I set the color mode of the UIkit theme to "Follow the operating system"
      And I am an anonymous user
      And the operating system asks for the dark color scheme
      And I go to "/no-such-page"
     Then the computed style "background-color" of "html" should be "rgb(23, 23, 23)"
    Given the operating system asks for the light color scheme
      And I go to "/no-such-page"
     Then the computed style "background-color" of "html" should be "rgb(255, 255, 255)"
