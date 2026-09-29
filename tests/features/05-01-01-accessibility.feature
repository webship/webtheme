@a11y
Feature: Accessibility of the pages
  As a visitor who uses a screen reader or the keyboard
  I want the pages to follow the accessibility standards
  So that I can read and use the site

  The front page, a page of the block layout (a page not found) and the login
  and password pages reached from the navbar are checked. The user pages are
  skipped on a site that renders them with the administration theme: HTMX
  loads them in full there.

  Scenario Outline: <name> passes the accessibility checks
    Given the "<path>" page is rendered by the default theme
      And I am an anonymous user
     When I go to "<start>"
      And I navigate with HTMX to "<path>"
     Then the page should have a title
      And the page should declare a language
      And the page should have a main landmark
      And the page should have exactly one h1
      And the heading hierarchy should be valid
      And every image should have an alt attribute
      And every form field should have an accessible label
      And every link should have an accessible name
      And every button should have an accessible name
      And every ARIA role should be valid
      And every ARIA reference should resolve
      And no element should have a positive tabindex
      And user zoom should be allowed
      And the page should have no critical accessibility violations
      And the page should have no serious accessibility violations

    Examples:
      | start         | path           | name                         |
      | /no-such-page | /              | the front page               |
      | /no-such-page | /user/login    | the login page               |
      | /no-such-page | /user/password | the password reset page      |

  Scenario: A page not found passes the accessibility checks
    Given I am an anonymous user
     When I go to "/no-such-page"
     Then the page should have a title
      And the page should have a main landmark
      And the page should have exactly one h1
      And the heading hierarchy should be valid
      And every link should have an accessible name
      And every button should have an accessible name
      And the page should have no serious accessibility violations

  Scenario: The keyboard reaches the content of the front page
    Given I am an anonymous user
     When I go to "/"
      And I press the key "Tab"
     Then the focused element should match "a, button, input, [tabindex]"
      And the page should have a skip link
