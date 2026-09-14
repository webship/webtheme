Feature: The UIkit components in the UI Patterns library
  As a front-end developer or a site builder
  I want to browse every UIkit component and its stories
  So that I can check how each component renders before using it

  Scenario: The library overview lists the UIkit components
    Given I am logged in as the Drupal administrator
     When I go to "/admin/appearance/ui/components/webtheme"
     Then I should see "Accordion"
      And I should see "Navbar"
      And I should see "Card"
      And I should see "Grid: 2 columns"
      And I should see "Slideshow"
      And I should not see "error has occurred"

  Scenario: Every component page of the library renders without errors
    Given I am logged in as the Drupal administrator
     Then every UIkit component page of the library should render without errors
