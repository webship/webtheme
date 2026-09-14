Feature: Color modes redefine the UIkit design tokens
  As a site builder
  I want a dark color mode driven by CSS variables
  So that every UIkit component follows the selected mode

  Scenario: The dark color mode changes the global background and text colors
    Given I am an anonymous user
     When I go to the homepage
     Then the computed style "background-color" of "html" should be "rgb(255, 255, 255)"
     When I set the "data-theme" attribute of the document to "dark"
     Then the computed style "background-color" of "html" should be "rgb(23, 23, 23)"
      And the computed style "color" of "html" should be "rgba(255, 255, 255, 0.7)"
