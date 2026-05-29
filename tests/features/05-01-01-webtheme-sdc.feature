Feature: Webtheme renders via Single-Directory Components
  As a developer
  I want the theme's templates to delegate to SDC components
  So that the markup is reusable, documented, and previewable in the
  UI Patterns library, while staying byte-compatible with the live site

  Scenario: Front page renders the structural SDC components
    Given I navigate to "/"
    Then the "site-branding" SDC component is rendered
     And the "region" SDC component is rendered

  Scenario: Login page renders the breadcrumb SDC and the page-title H1
    Given I navigate to "/user/login"
    Then the "breadcrumb" SDC component is rendered
     And I see visible Webtheme page title

  Scenario: An access-denied page still renders the page-title H1
    Given I navigate to "/admin/people"
    Then I see visible Webtheme page title
     And I should see "Access denied"

  Scenario: A validation error renders the status-messages SDC component
    Given I navigate to "/user/login"
     And I fill in "Username" with "no_such_user"
     And I fill in "Password" with "wrong-pass"
     And I press "Log in" by "value" attribute
    Then the "status-messages" SDC component is rendered
