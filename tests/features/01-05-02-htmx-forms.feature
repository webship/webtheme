Feature: Forms in the HTMX navigation
  As a visitor
  I want to send forms from pages loaded by the HTMX navigation
  So that my message is sent, and I see the errors when a field is missing

  Scenario: The contact webform is sent with a normal page load
    Given the "webform" module is enabled
      And I am an anonymous user
     When I go to the homepage
      And I mark the current page
      And I navigate with HTMX to "/form/contact"
     Then the page should not have been reloaded
      And "form.webform-submission-contact-form" should have attribute "hx-boost" with value "false"
     When I move the mouse over the page
      And I fill in "name" with "HTMX Visitor"
      And I fill in "email" with "htmx.visitor@example.com"
      And I fill in "message" with "A message sent from a page loaded by HTMX."
      And I wait out the form time limit
      And I click on the element "form.webform-submission-contact-form [data-drupal-selector='edit-actions-submit']"
     Then eventually I should see "Your message has been sent." within 15 seconds
      And the page should have been reloaded
      And I should not see "Submission failed"
      And the HTMX library should be loaded
      And there should be no JavaScript errors
      And the "contact" webform should have a submission from "htmx.visitor@example.com"
      And the submissions of the "contact" webform from "htmx.visitor@example.com" are deleted

  Scenario: The contact webform shows the validation errors
    Given the "webform" module is enabled
      And I am an anonymous user
     When I go to the homepage
      And I mark the current page
      And I navigate with HTMX to "/form/contact"
     Then the page should not have been reloaded
     When I move the mouse over the page
      And I turn off the browser validation of "form.webform-submission-contact-form"
      And I wait out the form time limit
      And I click on the element "form.webform-submission-contact-form [data-drupal-selector='edit-actions-submit']"
     Then eventually I should see "field is required." within 15 seconds
      And the page should have been reloaded
      And "#edit-email" should have class "uk-form-danger"
      And ".uk-alert-danger[role='alert']" should be visible
      And I should not see "Submission failed"
      And the HTMX library should be loaded
      And there should be no JavaScript errors

  Scenario: The core contact form is sent with a normal page load
    Given I am a logged in user with the "Webmaster" user
      And the "contact" module is enabled
     When I go to the homepage
      And I mark the current page
      And I navigate with HTMX to "/contact"
     Then the page should not have been reloaded
      And "form.contact-message-form" should have attribute "hx-boost" with value "false"
     When I fill in "Subject" with "HTMX navigation"
      And I fill in "Message" with "A message sent from a page loaded by HTMX."
      And I click on the element "form.contact-message-form [data-drupal-selector='edit-submit']"
     Then "form.contact-message-form" should not be attached within 10 seconds
      And the page should have been reloaded
      And the HTMX library should be loaded
      And there should be no JavaScript errors

  Scenario: Boosted navigation between pages still works after a form
    Given the "webform" module is enabled
      And the "/user/login" page is rendered by the default theme
      And I am an anonymous user
     When I go to "/form/contact"
      And I mark the current page
      And I navigate with HTMX to "/user/login"
     Then the page should not have been reloaded
      And "#edit-name" should be visible within 10 seconds
      And "form#user-login-form" should have attribute "hx-boost" with value "false"
