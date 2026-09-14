Feature: Drupal forms and local tasks use UIkit
  As a visitor
  I want the Drupal forms and tabs to be styled with UIkit
  So that the whole site shares the same design system

  Scenario: The login form uses the UIkit form classes
    Given I am an anonymous user
     When I go to "/user/login"
     Then "#edit-name" should have class "uk-input"
      And "#edit-pass" should have class "uk-input"
      And "#edit-submit" should have class "uk-button"
      And "#edit-submit" should have class "uk-button-primary"
      And the computed style "background-color" of "#edit-submit" should be "rgb(12, 127, 200)"

  Scenario: The local tasks are UIkit tabs
    Given I am an anonymous user
     When I go to "/user/login"
     Then "ul.uk-tab > li.uk-active a" should contain text "Log in"
      And "ul.uk-tab" should contain text "Reset your password"

  Scenario: The status messages are UIkit alerts
    Given I am an anonymous user
     When I go to "/user/password"
      And I fill in "name" with "nobody-at-all-test"
      And I press "Submit"
     Then ".uk-alert" should be visible within 10 seconds
