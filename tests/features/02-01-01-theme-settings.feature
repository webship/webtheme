Feature: UIkit theme settings
  As a site administrator
  I want to configure the UIkit library source and the navbar
  So that I can serve UIkit locally and choose the navbar behavior

  Scenario: The theme settings form exposes the UIkit settings
    Given I am logged in as the Drupal administrator
     When I go to "/admin/appearance/settings/webtheme"
     Then I should see "UIkit library source"
      And I should see "jsDelivr CDN (UIkit 3.25.22)"
      And I should see "Sticky navbar"
      And I should see "Show the logo in the footer"
      And I should see "Footer copyright"
