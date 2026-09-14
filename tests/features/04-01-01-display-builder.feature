Feature: The UIkit components with Display Builder
  As a site builder
  I want to build displays with the UIkit components in Display Builder
  So that I can design pages without writing templates

  Scenario: Every UIkit component has a Display Builder preview
    Given I am logged in as the Drupal administrator
     Then every UIkit component should have a Display Builder preview

  Scenario: The page layout builder lists the UIkit components by group
    Given I am logged in as the Drupal administrator
      And there is no default page layout
     When I create the default page layout from the current site
     Then I should see "Created new page layout Default."
     When I go to "/admin/structure/page-layout/default/builder"
     Then "#island-page_layout__default-component_library" should contain text "Grid: 2 columns"
      And "#island-page_layout__default-component_library" should contain text "Navbar"
      And "#island-page_layout__default-component_library" should contain text "Slideshow"
      And "#island-page_layout__default-component_library" should contain text "Accordion"
      And ":nth-match(#island-page_layout__default-builder .uk-navbar-container, 1)" should be attached
      And there should be no JavaScript errors

  Scenario: The page rendered through the page layout keeps the UIkit navbar
    Given I am an anonymous user
     When I go to "/user/login"
     Then ".uk-navbar-left .uk-logo" should be visible
      And ".uk-navbar-center .uk-navbar-nav" should contain text "Home"
      And ".uk-navbar-right .uk-navbar-nav" should contain text "Log in"
      And "#webtheme-offcanvas .uk-nav-primary" should be attached

  Scenario: Without page layout, the page is rendered by the block layout again
    Given I am logged in as the Drupal administrator
      And there is no default page layout
      And I am an anonymous user
     When I go to "/user/login"
     Then ".uk-navbar-container" should be visible
      And ".uk-navbar-center .uk-navbar-nav" should contain text "Home"
