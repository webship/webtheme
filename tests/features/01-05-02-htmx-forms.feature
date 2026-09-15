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
      And I fill in "#edit-name" with "HTMX Visitor" by attr
      And I fill in "#edit-email" with "htmx.visitor@example.com" by attr
      And I fill in "#edit-message" with "A message sent from a page loaded by HTMX." by attr
      And I wait 3 seconds
      And I click on the element "form.webform-submission-contact-form [data-drupal-selector='edit-actions-submit']"
     Then eventually I should see "Your message has been sent." within 15 seconds
      And the page should have been reloaded
      And I should not see "Submission failed"
      And the HTMX library should be loaded
      And there should be no JavaScript errors
      And the "contact" webform should have a submission from "htmx.visitor@example.com"

  Scenario: The contact webform shows the validation errors
    Given the "webform" module is enabled
      And I am an anonymous user
     When I go to the homepage
      And I mark the current page
      And I navigate with HTMX to "/form/contact"
     Then the page should not have been reloaded
     When I move the mouse over the page
      And I turn off the browser validation of "form.webform-submission-contact-form"
      And I wait 3 seconds
      And I click on the element "form.webform-submission-contact-form [data-drupal-selector='edit-actions-submit']"
     Then eventually I should see "field is required." within 15 seconds
      And the page should have been reloaded
      And "#edit-email" should have class "uk-form-danger"
      And I should not see "Submission failed"
      And the HTMX library should be loaded
      And there should be no JavaScript errors

  Scenario: The core contact form is sent with a normal page load
    Given the "contact" module is enabled
      And I am logged in as the Drupal administrator
     When I go to the homepage
      And I mark the current page
      And I navigate with HTMX to "/contact"
     Then the page should not have been reloaded
      And "form.contact-message-form" should have attribute "hx-boost" with value "false"
     When I fill in "#edit-subject-0-value" with "HTMX navigation" by attr
      And I fill in "#edit-message-0-value" with "A message sent from a page loaded by HTMX." by attr
      And I click on the element "form.contact-message-form [data-drupal-selector='edit-submit']"
     Then "form.contact-message-form" should not be attached within 10 seconds
      And the page should have been reloaded
      And the HTMX library should be loaded
      And there should be no JavaScript errors

  Scenario: Boosted navigation between pages still works after a form
    Given the "webform" module is enabled
      And I am an anonymous user
     When I go to "/form/contact"
      And I mark the current page
      And I navigate with HTMX to "/user/login"
     Then the page should not have been reloaded
      And "#edit-name" should be visible within 10 seconds
      And "form#user-login-form" should have attribute "hx-boost" with value "false"
