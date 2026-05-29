Feature: Webtheme renders real content on every front-facing surface
  As a site administrator
  I want default content (articles, a page, tags, menu links)
  So that the theme is exercised with real data — node teasers, the full
  node display, the frontpage Views listing and its pager, and the
  primary navigation — not just empty pages

  Scenario: Seeding demo content fills the frontpage listing and its pager
    Given I am a logged in user with the "Webmaster" user
     And I add demo content
    When I navigate to "/node"
    Then I should see "Webtheme demo article"
     And I see visible Webtheme article teaser
     And I see visible Webtheme pager

  Scenario: A full article page renders title, body and tags
    Given I am a logged in user with the "Webmaster" user
    When I navigate to "/node"
     And I open the "Webtheme demo article 12" article
    Then I see visible Webtheme page title
     And I should see "Demo article 12 body"
     And I should see "Drupal" in the ".field--name-field-tags" element

  Scenario: The Basic page content type renders through Webtheme
    Given I am a logged in user with the "Webmaster" user
    When I navigate to "/admin/content"
     And I open the "About Webtheme" content
    Then I see visible Webtheme page title
     And webtheme is the active default theme

  Scenario: The primary navigation renders the seeded menu links
    Given I navigate to "/node"
    Then I should see "Home"
     And I should see "Articles"
     And I should see "Drupal.org"
