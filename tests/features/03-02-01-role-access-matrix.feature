Feature: Role access matrix through Webtheme
  As a site administrator
  I want every Standard-profile role to see only the pages it should
  So that Webtheme's region rendering does not leak admin-only blocks
  to unauthorized users

  Background:
    Given I am a logged in user with the "Webmaster" user
    And I add testing users

  Scenario: Webmaster can reach /admin
    Given I am a logged in user with the "Webmaster" user
    When I navigate to "/admin"
    Then I should see "Administration"

  Scenario: Webmaster can reach /admin/appearance
    Given I am a logged in user with the "Webmaster" user
    When I navigate to "/admin/appearance"
    Then I should see "Webtheme"

  Scenario: Content editor cannot reach /admin/appearance
    Given I am a logged in user with the "Content editor" user
    When I navigate to "/admin/appearance"
    Then I should see "Access denied"

  Scenario: Authenticated user cannot reach /admin/appearance
    Given I am a logged in user with the "Authenticated user" user
    When I navigate to "/admin/appearance"
    Then I should see "Access denied"

  Scenario: Authenticated user can reach their own /user dashboard
    Given I am a logged in user with the "Authenticated user" user
    When I navigate to "/user"
    Then I should see "authenticated_user"
     And I should see "Log out"
