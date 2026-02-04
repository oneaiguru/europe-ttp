Feature: Validation Errors
  As a TTC applicant
  I want to see clear field-level errors when I submit incomplete forms
  So that I know exactly what needs to be fixed

  Scenario: Submit with missing required fields
    Given I am authenticated as a TTC applicant
    When I submit the TTC application form with missing required fields:
      | missing_field | error_message                    |
      | i_fname       | First name is required           |
      | i_lname       | Last name is required            |
      | i_email       | Email is required                |
    Then I should see field-level errors
    And the submission should be blocked
    And my draft data should remain intact

  Scenario: Submit with invalid email format
    Given I am authenticated as a TTC applicant
    When I submit the TTC application with an invalid email format
    Then I should see an email format validation error
    And the submission should be blocked

  Scenario: Submit past deadline shows deadline error
    Given test mode is disabled (real deadline enforcement)
    And TTC option "test_expired" has display_until in the past
    And I am authenticated as a TTC applicant
    When I attempt to submit the TTC application
    Then I should see "deadline_expired" error message
    And the form should not be marked as submitted
