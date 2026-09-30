@sign-in
Feature: The options of the sign-in screens
  As a site builder
  I want to pick the layout of the sign-in screens, and show the site header and footer on them
  So that signing in looks like the rest of the site, without code

  # The scenarios hand the sign-in screens to this theme, and put the site
  # back at the end of the next feature (01-04-03).

  Scenario: The sign-in screens are handed to the UIkit theme
    Given the "display_builder_page_layout" module is enabled
      And I am logged in as the Drupal administrator
      And there is no default page layout
    Given the sign-in screens are shown by the UIkit theme
      And the blocks of the UIkit theme are placed
      And I am an anonymous user
     When I go to "/user/login"
     Then the current page should be rendered by the UIkit theme
      And ".webtheme-sign-in" should be visible

  Scenario Outline: The <layout> layout, with the header <header> and the footer <footer>
    Given the sign-in screens are shown by the UIkit theme
     When the sign-in setting "sign_in_layout" of the UIkit theme is "<layout>"
      And the sign-in setting "sign_in_header" of the UIkit theme is "<header>"
      And the sign-in setting "sign_in_footer" of the UIkit theme is "<footer>"
      And I am an anonymous user
      And I go to "/user/login?layout=<layout>-<header>-<footer>"
     Then ".webtheme-sign-in--<layout>" should be visible
      And "#edit-name" should be visible
      And the page should have exactly one h1
      And the page should have 1 "main" landmark
      And the page should have 1 "banner" landmark
      And the page should have <footer> "contentinfo" landmark
      And I should see <header> ".webtheme-sign-in__header .uk-navbar-container" elements
      And the page should not scroll horizontally

    Examples:
      | layout    | header | footer |
      | center    | 0      | 0      |
      | center    | 1      | 1      |
      | start     | 0      | 0      |
      | start     | 1      | 1      |
      | end       | 0      | 1      |
      | end       | 1      | 0      |
      | top       | 0      | 0      |
      | top       | 1      | 1      |
      | bottom    | 0      | 0      |
      | bottom    | 1      | 1      |
      | spotlight | 0      | 0      |
      | spotlight | 1      | 1      |

  Scenario: The message, the help and the logo come from the theme settings
    Given the sign-in screens are shown by the UIkit theme
     When the sign-in settings of the UIkit theme are:
       | sign_in_layout  | end                                       |
       | sign_in_header  | 0                                         |
       | sign_in_footer  | 0                                         |
       | sign_in_message | Sign in to write, review and publish.     |
       | sign_in_help    | Trouble signing in? Write to the team.    |
       | sign_in_logo    | theme                                     |
      And I am an anonymous user
      And I go to "/user/login?texts=1"
     Then I should see "Sign in to write, review and publish."
      And I should see "Trouble signing in? Write to the team."
      And ".webtheme-sign-in__logo" should be visible
     When the sign-in settings of the UIkit theme are:
       | sign_in_logo    | none |
       | sign_in_message |      |
       | sign_in_help    |      |
       | sign_in_layout  | center |
      And I go to "/user/login?texts=0"
     Then ".webtheme-sign-in__logo" should not be attached
      And ".webtheme-sign-in__name" should be visible

  Scenario: The options are theme settings
    Given I am logged in as the Drupal administrator
     When I go to "/admin/appearance/settings/webtheme"
     Then I should see "Sign-in screens"
      And I should see "Show the site header"
      And I should see "Show the site footer"
      And I should see "Spotlight: the form floating over the brand color"
