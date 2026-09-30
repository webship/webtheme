@sign-in
Feature: Every state of the sign-in screens
  As a visitor who signs in
  I want each screen to tell me what happened and what to do next
  So that I can sign in, reset my password or know why I cannot

  Background:
    Given the sign-in screens are shown by the UIkit theme
      And the failed attempts on the site are cleared
      And the sign-in settings of the UIkit theme are:
       | sign_in_layout | center |
       | sign_in_header | 0      |
       | sign_in_footer | 0      |

  Scenario: The log in form works with password managers and starts at the skip link
    Given I am an anonymous user
     When I go to "/user/login"
     Then "#edit-name" should have attribute "autocomplete" with value "username"
      And "#edit-pass" should have attribute "autocomplete" with value "current-password"
      And "#edit-name" should not have attribute "autofocus"
      And the keyboard should reach "a[href='#main-content']" before "#edit-name"
      And the keyboard should reach "#edit-name" before "#edit-pass"
      And the computed style "font-size" of "#edit-name" should be "16px"
      And ".webtheme-sign-in__forgot a" should be visible
      And every link and button should be at least 44 by 44 pixels

  Scenario: A wrong password shows the error in the card
    Given I am an anonymous user
     When I go to "/user/login"
      And I fill in "name" with "member"
      And I fill in "pass" with "not the password"
      And I wait 3 seconds
      And I press "Log in"
     Then ".webtheme-sign-in__messages .uk-alert-danger" should be visible within 10 seconds
      And I should see "Unrecognized username or password"
      And "#edit-name" should have attribute "aria-invalid" with value "true"

  Scenario: A reset request comes back to the log in screen
    Given I am an anonymous user
     When I go to "/user/password"
     Then I should see "Log in" in the ".webtheme-sign-in__links" element
     When I fill in "name" with "member"
      And I move the mouse over the page
      And I wait 3 seconds
      And I press "Send reset link"
     Then the url should match "/user/login"
      And ".webtheme-sign-in__messages .uk-alert" should be visible within 10 seconds

  Scenario: A used or expired reset link says so on the password screen
    Given I am an anonymous user
     When I go to "/user/reset/1/1/not-a-valid-hash"
     Then the url should match "/user/password"
      And ".webtheme-sign-in--password .webtheme-sign-in__messages .uk-alert" should be visible within 10 seconds

  Scenario: Registration closed to visitors says who creates the accounts
    Given the page "/user/register" should answer with the status 403
      And I am an anonymous user
     When I go to "/user/register"
     Then ".webtheme-sign-in" should be visible
      And I should see "Accounts are created by an administrator."
      And I should not see "Create new account"
      And ".uikit-admin-rail" should not be attached

  Scenario Outline: The <name> passes the WCAG AAA audit in the <mode> color mode
    Given I am an anonymous user
     When I go to "<path>"
      And I set the "data-theme" attribute of the document to "<mode>"
     Then the page should pass an accessibility audit at level "AAA"
      And the focus ring of every link and button should be solid and 2 pixels wide
      And the page should have no class or token starting with "uikit-admin-"

    Examples:
      | path           | name                    | mode  |
      | /user/login    | log in screen           | light |
      | /user/login    | log in screen           | dark  |
      | /user/password | password reset screen   | light |
      | /user/password | password reset screen   | dark  |

  Scenario Outline: The <layout> layout passes the WCAG AAA audit in the dark color mode
    Given the sign-in setting "sign_in_layout" of the UIkit theme is "<layout>"
      And I am an anonymous user
     When I go to "/user/login?aaa=<layout>"
      And I set the "data-theme" attribute of the document to "dark"
     Then the page should pass an accessibility audit at level "AAA"

    Examples:
      | layout    |
      | start     |
      | top       |
      | spotlight |

  Scenario Outline: The log in screen fits <width> pixels
    Given I am an anonymous user
      And I set the viewport to <width> by 800
     When I go to "/user/login"
     Then the page should not scroll horizontally
      And the computed style "font-size" of "#edit-pass" should be "16px"

    Examples:
      | width |
      | 320   |
      | 390   |

  Scenario: The show password control is a 44 pixel target inside the field, in both directions
    Given the "view_password" module is enabled
      And I am an anonymous user
     When I go to "/user/login"
     Then "button.shwpd" should be at least 44 by 44 pixels
      And the element "button.shwpd" should sit inside the element ".form-item-pass"
     When I click on the element "button.shwpd"
     Then "#edit-pass" should have attribute "type" with value "text"
     When I set the "dir" attribute of the document to "rtl"
     Then the element "button.shwpd" should sit inside the element ".form-item-pass"

  Scenario: Too many failed attempts show the blocked screen
    Given I am an anonymous user
     When I try to log in as "the first user" with a wrong password 9 times
     Then ".webtheme-sign-in--blocked" should be visible
      And I should see "Login failed"
      And I should see "Reset your password" in the ".webtheme-sign-in__links" element

  # Put the site back: the administration theme, the sign-in settings, the
  # flood records and the default page layout.
  Scenario: The sign-in screens are given back to the site
    Then the sign-in screens are given back to the site
    Given the "display_builder_page_layout" module is enabled
     Then the default page layout of the site is restored
