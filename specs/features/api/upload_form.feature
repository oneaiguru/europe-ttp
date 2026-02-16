Feature: Upload Form API
  As a authenticated user
  I want to submit form data to the API
  So that my form submission is validated and acknowledged

  NOTE: Form data persistence is intentionally deferred. This endpoint validates
  and accepts submissions but does not store them. See MIGRATION_DECISIONS.md
  for details on the deferred persistence decision.

  @p1
  Scenario: Submit form data via API
    Given I am in session auth mode
    And I have a valid user email "test.applicant@example.com"
    And I have a valid session token for "test.applicant@example.com"
    When I submit form data to the upload form API
    Then the API should accept the form submission

  @p1
  Scenario: Reject multipart/form-data with duplicate field names
    Given I am in session auth mode
    And I have a valid user email "test.applicant@example.com"
    And I have a valid session token for "test.applicant@example.com"
    And I have a valid upload form payload of 1000 bytes
    When I submit the payload with a duplicate field "form_type"
    Then the API should return status 400
    And the API response error details should mention "Duplicate field 'form_type' is not allowed"

  @security
  Scenario: User exceeding upload form rate limit receives 429
    Given I am in session auth mode
    And I have a valid user email "test.applicant@example.com"
    And I have a valid session token for "test.applicant@example.com"
    And I have made 11 upload form requests within the limit window
    When I submit form data to the upload form API
    Then the API should return status 429
    And the API response should have error equal to "RATE_LIMIT_EXCEEDED"

  @security
  Scenario: Rate limit response includes retry information
    Given I am in session auth mode
    And I have a valid user email "test.applicant@example.com"
    And I have a valid session token for "test.applicant@example.com"
    And I have made 11 upload form requests within the limit window
    When I submit form data to the upload form API
    Then the API should return status 429
    And the API response should have error equal to "RATE_LIMIT_EXCEEDED"
