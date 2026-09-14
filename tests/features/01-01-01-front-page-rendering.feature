Feature: The front page is rendered with UIkit
  As a visitor
  I want the site to use the UIkit framework and the theme components
  So that the pages look and behave like UIkit

  Scenario: The UIkit framework and the page shell are loaded
    Given I am an anonymous user
     When I go to the homepage
     Then the UIkit JavaScript version should be "3.25.22"
      And ".uk-navbar-container" should be visible
      And the computed style "background-color" of ".uk-navbar-container" should be "rgb(243, 246, 248)"
      And the computed style "background-color" of "footer.uk-section-secondary" should be "rgb(49, 54, 55)"
      And there should be no JavaScript errors

  Scenario: The branding and the menus are rendered in the navbar
    Given I am an anonymous user
     When I go to the homepage
     Then ".uk-navbar-left .uk-logo" should be visible
      And ".uk-navbar-center .uk-navbar-nav" should contain text "Home"
      And ".uk-navbar-right .uk-navbar-nav" should contain text "Log in"
      And ".uk-navbar-center .uk-navbar-nav > li.uk-active" should be visible

  Scenario: The UIkit design tokens layer is applied
    Given I am an anonymous user
     When I go to the homepage
     Then the computed style "font-family" of ".uk-navbar-nav > li > a" should contain "Zen Maru Gothic"
      And the computed style "background-color" of "html" should be "rgb(255, 255, 255)"
