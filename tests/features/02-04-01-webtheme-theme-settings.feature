Feature: Webtheme theme settings form
  As a site administrator
  I want the Webtheme theme settings form to load and expose its
  custom controls
  So that I can configure the mobile menu width and the header
  branding background color

  Background:
    Given I am a logged in user with the "Webmaster" user

  Scenario: Theme settings page exposes the Webtheme Utilities fieldset
    When I navigate to "/admin/appearance/settings/webtheme"
    Then I should see "Webtheme Utilities"
     And I should see "Enable mobile menu at all widths"
     And I should see "Header site branding background color"
     And I should see "Enable Debug Options"
