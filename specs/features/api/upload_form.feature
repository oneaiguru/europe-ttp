Feature: Upload Form API
  As a authenticated user
  I want to submit form data to the API
  So that save my form data

  @p1 @needs-verification
  Scenario: Submit form data via API
    Given I am authenticated on the TTC portal
    When I submit form data to the upload form API
    Then the API should accept the form submission
