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

  Scenario: Every design token has a description and a field in UI Skins
    Given I am logged in as the Drupal administrator
     When I go to "/admin/appearance/css-variables/webtheme"
     Then every UI Skins CSS variable of the UIkit theme should have a description and a field
      And I should see "Corner radius"
      And I should see "Target size"
      And I should see "Muted color on inverse areas"

  Scenario Outline: The defaults of UI Skins are the values of the <mode> color mode
    Given I am an anonymous user
     When I go to "/no-such-page?ui-skins=defaults-<mode>"
      And I set the "data-theme" attribute of the document to "<mode>"
     Then the defaults of the UI Skins CSS variables should be the values of the page in the "<mode>" color mode

    Examples:
      | mode  |
      | light |
      | dark  |

  Scenario: The links and the focus ring follow their design tokens
    Given I am logged in as the Drupal administrator
     When I set the UI Skins CSS variable "webtheme-global-link-color" of the UIkit theme to "#7a1f5c"
      And I set the UI Skins CSS variable "webtheme-focus-color" of the UIkit theme to "#7a1f5c"
      And I am an anonymous user
      And I go to "/no-such-page?ui-skins=custom-link"
     Then the computed style "--uk-global-link-color" of "html" should be "#7a1f5c"
     When I press the key "Tab"
     Then the computed style "outline-color" of ":focus" should be "rgb(122, 31, 92)"
    Given I am logged in as the Drupal administrator
     When I set the UI Skins CSS variable "webtheme-global-link-color" of the UIkit theme to "#07527f"
      And I set the UI Skins CSS variable "webtheme-focus-color" of the UIkit theme to "#0d1214"
      And I am an anonymous user
      And I go to "/no-such-page?ui-skins=default-link"
     Then the computed style "--uk-global-link-color" of "html" should be "#07527f"

  Scenario: A dark value saved in UI Skins shows in the dark mode of the operating system
    Given I am logged in as the Drupal administrator
     When I set the color mode of the UIkit theme to "Follow the operating system"
      And I set the UI Skins CSS variable "webtheme-global-link-color" of the UIkit theme to "#ffcc00" in the dark color mode
      And I am an anonymous user
      And the operating system asks for the dark color scheme
      And I go to "/no-such-page?ui-skins=system-dark"
     Then the computed style "--uk-global-link-color" of "html" should be "#ffcc00"
    Given the operating system asks for the light color scheme
      And I go to "/no-such-page?ui-skins=system-light"
     Then the computed style "--uk-global-link-color" of "html" should be "#07527f"
    Given I am logged in as the Drupal administrator
     When I set the UI Skins CSS variable "webtheme-global-link-color" of the UIkit theme to "#85c0f9" in the dark color mode
      And I set the color mode of the UIkit theme to "Light"
      And I am an anonymous user
      And I go to "/no-such-page?ui-skins=system-default"
     Then the computed style "--uk-global-link-color" of "html" should be "#07527f"
