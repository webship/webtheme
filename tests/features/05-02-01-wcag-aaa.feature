@a11y @aaa
Feature: WCAG 2.2 AAA
  As a visitor with low vision, a motor impairment or a vestibular disorder
  I want the theme to meet the WCAG 2.2 AAA criteria it controls
  So that I can read and use every page in both color modes

  The pages are the front page (block layout, or a Display Builder page
  layout), a page of the block layout (a page not found) and the login form
  reached from the navbar. The criteria that depend on the content are in the
  checklist of the README.

  Scenario Outline: <name> passes the WCAG AAA audit in the <mode> color mode
    Given I am an anonymous user
     When I go to "<path>"
      And I set the "data-theme" attribute of the document to "<mode>"
     Then the page should pass an accessibility audit at level "AAA"
      And the links inside text should not be shown by color alone

    Examples:
      | path          | mode  | name             |
      | /             | light | The front page   |
      | /             | dark  | The front page   |
      | /no-such-page | light | A page not found |
      | /no-such-page | dark  | A page not found |

  Scenario Outline: The login form passes the WCAG AAA audit in the <mode> color mode
    Given the "/user/login" page is rendered by the default theme
      And I am an anonymous user
     When I go to "/no-such-page"
      And I navigate with HTMX to "/user/login"
      And I set the "data-theme" attribute of the document to "<mode>"
     Then the page should pass an accessibility audit at level "AAA"
      And every link and button should be at least 44 by 44 pixels
      And the focus ring of every link and button should be solid and 2 pixels wide

    Examples:
      | mode  |
      | light |
      | dark  |

  Scenario Outline: The component library passes the WCAG AAA audit in the <mode> color mode
    Given I am logged in as the Drupal administrator
     Then every UIkit component story should pass an accessibility audit at level "AAA" in the "<mode>" color mode

    Examples:
      | mode  |
      | light |
      | dark  |

  Scenario Outline: The targets, the focus ring and the reflow of <path> at <width> pixels
    Given I am an anonymous user
      And I set the viewport to <width> by 800
     When I go to "<path>"
     Then every link and button should be at least 44 by 44 pixels
      And the focus ring of every link and button should be solid and 2 pixels wide
      And the page should not scroll horizontally

    Examples:
      | path          | width |
      | /             | 1280  |
      | /             | 768   |
      | /             | 320   |
      | /no-such-page | 1280  |
      | /no-such-page | 320   |

  Scenario Outline: The offcanvas menu of <path> is used with the keyboard only
    Given I am an anonymous user
      And I set the viewport to 320 by 800
     When I go to "<path>"
      And I press the key "Tab" until ".uk-navbar-toggle" has the focus
     Then ".uk-navbar-toggle" should be at least 44 by 44 pixels
     When I press the key "Enter"
     Then ".uk-offcanvas .uk-offcanvas-bar" should be visible within 5 seconds
      And ".uk-navbar-toggle" should have attribute "aria-expanded" with value "true"
      And every link and button should be at least 44 by 44 pixels
     When I press the key "Tab"
     Then the focused element should be inside ".uk-offcanvas-bar"
     When I press the key "Escape"
     Then ".uk-offcanvas .uk-offcanvas-bar" should be hidden within 5 seconds
      And the element ".uk-navbar-toggle" should have the focus

    Examples:
      | path          |
      | /             |
      | /no-such-page |

  Scenario Outline: The <name> component is used with the keyboard only
    Given I am logged in as the Drupal administrator
     When I go to "/admin/appearance/ui/components/webtheme/<component>"
      And I press the key "Tab" until "<toggle>" has the focus
      And I press the key "Enter"
     Then "<panel>" should be visible within 5 seconds
     When I press the key "Escape"
     Then "<panel>" should be hidden within 5 seconds
      And the element "<toggle>" should have the focus

    Examples:
      | name      | component | toggle                                       | panel                        |
      | modal     | modal     | .ui_patterns_component__stories button[uk-toggle='target: #modal-story'] | #modal-story .uk-modal-dialog |
      | offcanvas | offcanvas | .ui_patterns_component__stories [uk-toggle]  | .uk-offcanvas.uk-open .uk-offcanvas-bar |
      | dropdown  | dropdown  | .ui_patterns_component__stories .uk-inline > button.uk-button | .uk-dropdown.uk-open |

  Scenario Outline: Nothing moves on <path> when reduced motion is requested
    Given I am an anonymous user
     When I go to "<path>"
     Then nothing should move when reduced motion is requested

    Examples:
      | path          |
      | /             |
      | /no-such-page |
