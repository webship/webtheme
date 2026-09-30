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
     When I go to "/no-such-page"
     Then ".uk-navbar-left .uk-logo" should be visible
      And ".uk-navbar-center .uk-navbar-nav > li > a" should be visible
      And ".uk-navbar-right .uk-navbar-nav" should contain text "Log in"
      And ".uk-offcanvas .uk-nav-primary" should be attached

  Scenario: Without page layout, the page is rendered by the block layout again
    Given I am logged in as the Drupal administrator
      And there is no default page layout
      And I am an anonymous user
     When I go to "/no-such-page"
     Then ".uk-navbar-container" should be visible
      And ".uk-navbar-center .uk-navbar-nav > li > a" should be visible
      And "footer.uk-section-secondary" should be visible
      And "#webtheme-offcanvas .webtheme-offcanvas-account" should be attached

  Scenario: The theme ships its Display Builder profiles and a disabled sign-in page layout
    Given the "display_builder_page_layout" module is enabled
     Then the configuration "display_builder.profile.webtheme" should exist
      And the configuration "display_builder.profile.webtheme_sign_in" should exist
      And the page layout "webtheme_sign_in" should be disabled

  Scenario: The header and footer sections of a page layout are the banner and the contentinfo
    Given the "display_builder_page_layout" module is enabled
      And the page layout "webtheme_test_landmarks" of the test fixtures exists
      And I am an anonymous user
     When I go to "/node?landmarks=1"
     Then the page should be drawn by the page layout "webtheme_test_landmarks"
      And the page should have 1 "banner" landmark
      And the page should have 1 "main" landmark
      And the page should have 1 "contentinfo" landmark
      And the page should have exactly one h1
      And the page should have no critical accessibility violations
    Then the page layout "webtheme_test_landmarks" is deleted

  Scenario: The sign-in page layout draws the sign-in screens when the theme settings pick it
    Given the "display_builder_page_layout" module is enabled
      And the sign-in screens are shown by the UIkit theme
      And I am logged in as the Drupal administrator
     When I pick the page layout "Sign-in screens" for the sign-in screens of the UIkit theme
     Then the page layout "webtheme_sign_in" should be enabled
    Given I am an anonymous user
     When I go to "/user/login?page-layout=1"
     Then the page should be drawn by the page layout "webtheme_sign_in"
      And ".webtheme-sign-in" should be visible
      And "#edit-name" should be visible
      And the page should have exactly one h1
    Given I am logged in as the Drupal administrator
     When I pick the page layout "- The page of the theme -" for the sign-in screens of the UIkit theme
     Then the page layout "webtheme_sign_in" should be disabled
      And the sign-in screens are given back to the site
