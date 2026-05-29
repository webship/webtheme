Feature: Webtheme brand color custom property
  As a site administrator
  I want the configured brand color to be exposed as a CSS custom
  property on the HTML element
  So that the brand-color pipeline added by
  webtheme_preprocess_html() is exercised in CI

  Scenario: Front page emits the --color--primary-hue custom property
    Given I navigate to "/"
    Then the brand color is applied to the HTML element

  Scenario: Login page emits the --color--primary-hue custom property
    Given I navigate to "/user/login"
    Then the brand color is applied to the HTML element
