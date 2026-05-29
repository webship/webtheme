Feature: Webtheme performance and resource health
  As a site owner
  I want pages to load without broken or runaway requests and within a
  reasonable time budget
  So that the theme stays fast and ships no dead assets

  Scenario: The front page loads cleanly within budget
    Given I navigate to "/node"
    Then there should be no failed network requests
     And the page should become interactive within 8000 milliseconds
     And the page should load fewer than 250 resources

  Scenario: The login page loads cleanly within budget
    Given I navigate to "/user/login"
    Then there should be no failed network requests
     And the page should become interactive within 8000 milliseconds

  Scenario: The front page settles and renders the content
    Given I navigate to "/node"
    Then I see visible Webtheme main wrapper
     And there should be no failed network requests
     And the page should load fewer than 250 resources
