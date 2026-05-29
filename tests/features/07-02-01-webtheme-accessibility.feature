Feature: Webtheme accessibility (webship-js a11y audits)
  As a site owner
  I want the theme's pages to meet a broad accessibility baseline
  So that the site is usable with assistive technology and does not
  regress on landmarks, headings, language, names, ARIA, or contrast

  Scenario: The front page meets the full structural accessibility baseline
    Given I navigate to "/node"
    Then the page should have a title
     And the page should declare a language
     And the page language should be "en"
     And the page should have exactly one h1
     And the heading hierarchy should be valid
     And the page should have a main landmark
     And the page should have a navigation landmark
     And the page should have a skip link
     And every image should have an alt attribute
     And every link should have an accessible name
     And every button should have an accessible name
     And no element should have a positive tabindex
     And every ARIA reference should resolve
     And every ARIA role should be valid
     And user zoom should be allowed

  Scenario: The front page passes the axe accessibility audit
    Given I navigate to "/node"
    Then the page should have no critical accessibility violations
     And the page should have no serious accessibility violations

  Scenario: The login page exposes accessible form labels
    Given I navigate to "/user/login"
    Then every form field should have an accessible label
     And the page should have exactly one h1
     And the page should have no critical accessibility violations

  # Note: heading-hierarchy is asserted on the front page above. It is not
  # asserted here because the comment form's text-format help ("Restricted
  # HTML / About text formats") injects a core-controlled <h4> that skips
  # from the article <h1> — that markup belongs to core's filter module, not
  # to Webtheme.
  Scenario: A full article page is accessible
    Given I am a logged in user with the "Webmaster" user
    When I navigate to "/node"
     And I open the "Webtheme demo article 12" article
    Then the page should have exactly one h1
     And the page should have a main landmark
     And the page should have a navigation landmark
     And every image should have an alt attribute
     And the page should have no critical accessibility violations
