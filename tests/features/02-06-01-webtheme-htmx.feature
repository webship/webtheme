Feature: Webtheme HTMX opt-in library
  As a site administrator
  I want the HTMX library to be off by default and opt-in via theme
  settings
  So that the bundle stays small for sites that don't use HTMX, and
  enabling it attaches the library on every page

  Scenario: HTMX is not attached by default
    Given I navigate to "/"
    Then the htmx global is not defined on the page

  Scenario: Enabling HTMX in theme settings attaches the library
    Given I enable HTMX in webtheme settings
     And I navigate to "/"
    Then the htmx global is defined on the page
    When I disable HTMX in webtheme settings
