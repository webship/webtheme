Feature: Drupal forms and local tasks use UIkit
  As a visitor
  I want the Drupal forms and tabs to be styled with UIkit
  So that the whole site shares the same design system

  A site can render the user pages with its administration theme. The HTMX
  navigation keeps the theme of the page it starts from, so the login page is
  reached from the navbar, as a visitor does.

  Scenario: The login form uses the UIkit form classes
    Given I am an anonymous user
     When I go to "/no-such-page"
      And I navigate with HTMX to "/user/login"
     Then "#edit-name" should have class "uk-input"
      And "#edit-pass" should have class "uk-input"
      And "#edit-submit" should have class "uk-button"
      And "#edit-submit" should have class "uk-button-primary"
      And the computed style "background-color" of "#edit-submit" should be "rgb(7, 82, 127)"

  Scenario: The local tasks are UIkit tabs
    Given I am an anonymous user
     When I go to "/no-such-page"
      And I navigate with HTMX to "/user/login"
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
