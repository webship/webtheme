Feature: Drupal forms and local tasks use UIkit
  As a visitor
  I want the Drupal forms and tabs to be styled with UIkit
  So that the whole site shares the same design system

  A site can render the user pages with its administration theme, on a full
  load and with the HTMX navigation alike: the user page scenarios are
  skipped there, and the webform shows the forms of the theme.

  Scenario: The login form uses the UIkit form classes
    Given the "/user/login" page is rendered by the default theme
      And I am an anonymous user
     When I go to "/user/login"
     Then "#edit-name" should have class "uk-input"
      And "#edit-pass" should have class "uk-input"
      And "#edit-submit" should have class "uk-button"
      And "#edit-submit" should have class "uk-button-primary"
      And the computed style "background-color" of "#edit-submit" should be "rgb(7, 82, 127)"

  Scenario: The webform fields use the UIkit form classes
    Given the "webform" module is enabled
      And I am an anonymous user
     When I go to "/form/contact"
     Then "#edit-name" should have class "uk-input"
      And "#edit-actions-submit" should have class "uk-button"
      And "#edit-actions-submit" should have class "uk-button-primary"
      And the computed style "background-color" of "#edit-actions-submit" should be "rgb(7, 82, 127)"

  Scenario: The local tasks are UIkit tabs
    Given the "/user/login" page is rendered by the default theme
      And I am an anonymous user
     When I go to "/user/login"
     Then "ul.uk-tab > li.uk-active a" should contain text "Log in"
      And "ul.uk-tab" should contain text "Reset your password"

  Scenario: The status messages are UIkit alerts
    Given the "/user/password" page is rendered by the default theme
      And I am an anonymous user
     When I go to "/user/password"
      And I fill in "name" with "nobody-at-all-test"
      And I press "Submit"
     Then ".uk-alert" should be visible within 10 seconds
      And ".uk-alert[role='status'], .uk-alert[role='alert']" should be visible
