Feature: Upload Form API Body Size Enforcement
  As a system administrator
  I want the upload form API to enforce strict body size limits
  So that malicious actors cannot cause denial-of-service attacks with oversized payloads

  Scenario: Accept normal-sized JSON payload under limit
    Given I am authenticated as "test.applicant@example.com"
    When I submit a valid form data payload of 100 bytes
    Then the API should return status 200
    And the API response should have ok equal to "true"

  Scenario: Reject JSON payload exceeding 5MB limit
    Given I am authenticated as "test.attacker@example.com"
    When I submit a form data payload of 6000000 bytes
    Then the API should return status 413
    And the API response should have error equal to "Payload too large"

  Scenario: Reject payload without content-length header when body is too large
    Given I am authenticated as "test.attacker@example.com"
    When I submit a form data payload of 6000000 bytes without content-length header
    Then the API should return status 413
    And the API response should have error equal to "Payload too large"

  Scenario: Accept small payload without content-length header
    Given I am authenticated as "test.applicant@example.com"
    When I submit a form data payload of 100 bytes without content-length header
    Then the API should return status 200
    And the API response should have ok equal to "true"
