Feature: The interactive UIkit components work with the UIkit JavaScript
  As a visitor
  I want accordions, modals, switchers and dropdowns to react
  So that the interactive components are usable

  Background:
    Given I am logged in as the Drupal administrator

  Scenario: The accordion toggles its items
     When I go to "/admin/appearance/ui/components/webtheme/accordion"
     Then ":nth-match(.uk-accordion > div, 2) > .uk-accordion-content" should be hidden
     When I click on the element ":nth-match(.uk-accordion > div, 2) > .uk-accordion-title"
     Then ":nth-match(.uk-accordion > div, 2) > .uk-accordion-content" should be visible within 5 seconds

  Scenario: The modal opens with a button toggle and closes
     When I go to "/admin/appearance/ui/components/webtheme/modal"
      And I click on the element ":nth-match(button[uk-toggle='target: #modal-story'], 1)"
     Then "#modal-story .uk-modal-dialog" should be visible within 5 seconds
      And "#modal-story .uk-modal-title" should have text "Modal title"
     When I click on the element "#modal-story .uk-modal-close-default"
     Then "#modal-story .uk-modal-dialog" should be hidden within 5 seconds

  Scenario: The switcher shows the connected panel
     When I go to "/admin/appearance/ui/components/webtheme/switcher"
     Then ":nth-match(.uk-switcher, 1) > :nth-child(2)" should be hidden
     When I click on the element ":nth-match(ul.uk-tab, 1) > :nth-child(2) > a"
     Then ":nth-match(.uk-switcher, 1) > :nth-child(2)" should be visible within 5 seconds

  Scenario: The dropdown opens on click
     When I go to "/admin/appearance/ui/components/webtheme/dropdown"
      And I click on the element ":nth-match(.uk-inline > button.uk-button, 1)"
     Then ":nth-match(.uk-dropdown.uk-open, 1)" should be visible within 5 seconds

  Scenario: The icons are inline SVG from the UIkit icon pack
     When I go to "/admin/appearance/ui/components/webtheme/icon"
     Then ":nth-match(svg.uk-icon[width='40'], 1)" should be visible
