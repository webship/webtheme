Feature: Webtheme is the active default theme
  As a site administrator
  I want Webtheme to be the active default theme after site install
  So that anonymous and authenticated visitors see the Webtheme look
  and the suite is testing the right theme

  Scenario: Front page renders with the Webtheme as the active theme
    Given I navigate to "/"
    Then webtheme is the active default theme

  Scenario: Login page renders with the Webtheme as the active theme
    Given I navigate to "/user/login"
    Then webtheme is the active default theme

  Scenario: Admin area uses Webtheme for users without admin theme override
    Given I am a logged in user with the "Content editor" user
    When I navigate to "/user"
    Then webtheme is the active default theme

  Scenario: Webmaster can see Webtheme in the appearance admin page
    Given I am a logged in user with the "Webmaster" user
    When I navigate to "/admin/appearance"
    Then I should see "Webtheme"
     And I should see "Webship"
