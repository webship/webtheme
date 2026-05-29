Feature: Webtheme HTMX boost
  As a site administrator
  I want an optional "boost all links and forms" mode
  So that internal navigation becomes partial-page swaps without writing
  any custom JavaScript, while staying completely off by default

  Scenario: Boost is off by default
    Given I navigate to "/"
    Then the body is not HTMX-boosted

  Scenario: Enabling HTMX boost adds hx-boost to the body and loads HTMX
    Given I enable HTMX boost in webtheme settings
     And I navigate to "/"
    Then the body is HTMX-boosted
     And the htmx global is defined on the page
    When I disable HTMX boost in webtheme settings
     And I navigate to "/"
    Then the body is not HTMX-boosted
