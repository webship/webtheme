Feature: The front page is rendered with UIkit
  As a visitor
  I want the site to use the UIkit framework and the theme components
  So that the pages look and behave like UIkit

  The front page can be rendered by the block layout or by a Display Builder
  page layout: the steps check the UIkit markup, not the content of a site.

  Scenario: The UIkit framework and the navbar are loaded
    Given I am an anonymous user
     When I go to the homepage
     Then the UIkit JavaScript version should be "3.25.22"
      And ".uk-navbar-container" should be visible
      And the computed style "background-color" of ".uk-navbar-container" should be "rgb(255, 255, 255)"
      And there should be no JavaScript errors

  Scenario: The branding and the menus are rendered in the navbar
    Given I am an anonymous user
     When I go to the homepage
     Then ".uk-navbar-left .uk-logo" should be visible
      And ".uk-navbar-center .uk-navbar-nav > li > a" should be visible
      And ".uk-navbar-right .uk-navbar-nav" should contain text "Log in"
     When I click on the element ":nth-match(.uk-navbar-center .uk-navbar-nav > li > a, 1)"
     Then ".uk-navbar-center .uk-navbar-nav > li.uk-active" should be visible within 10 seconds

  Scenario: The UIkit design tokens layer is applied
    Given I am an anonymous user
     When I go to the homepage
     Then the computed style "font-family" of ".uk-navbar-nav > li > a" should contain "Atkinson Hyperlegible Next"
      And the computed style "background-color" of "html" should be "rgb(255, 255, 255)"

  Scenario: The footer stays at the bottom of a short page
    Given I am an anonymous user
      And I set the viewport to 1440 by 1400
     When I go to "/webtheme-test-page-not-found"
     Then the footer should reach the bottom of the window

  Scenario: The bar of a content preview sits above the sticky navbar
    Given I am an anonymous user
     When I go to the homepage
     Then a ".node-preview-container" bar added to the page should be above the sticky navbar
