Feature: Webtheme registered regions
  As a site administrator
  I want every region declared in webtheme.info.yml to render
  So that block placement and layout decisions land in real regions

  Background:
    Given I am a logged in user with the "Webmaster" user

  Scenario: Block layout page lists every Webtheme region
    When I navigate to "/admin/structure/block"
    Then I should see "Header"
     And I should see "Primary menu"
     And I should see "Secondary menu"
     And I should see "Hero"
     And I should see "Highlighted"
     And I should see "Breadcrumb"
     And I should see "Social Bar"
     And I should see "Content Above"
     And I should see "Content"
     And I should see "Sidebar"
     And I should see "Content Below"
     And I should see "Footer Top"
     And I should see "Footer Bottom"

  Scenario: Front page contains the content region wrapper
    When I navigate to "/"
    Then the "content" region is rendered
