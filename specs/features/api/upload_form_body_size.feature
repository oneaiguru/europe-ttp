Feature: Upload Form API Body Size Enforcement
  As a system administrator
  I want the upload form API to enforce strict body size limits
  So that malicious actors cannot cause denial-of-service attacks with oversized payloads

  Scenario: Accept normal-sized JSON payload under limit
    Given I am in session auth mode
    And I have a valid user email "test.applicant@example.com"
    And I have a valid session token for "test.applicant@example.com"
    When I submit a valid form data payload of 200 bytes
    Then the API should return status 200
    And the API response should have ok equal to "true"

  Scenario Outline: Accept small payload sizes with serialization edge cases
    Given I am in session auth mode
    And I have a valid user email "test.applicant@example.com"
    And I have a valid session token for "test.applicant@example.com"
    When I submit a valid form data payload of <size> bytes
    Then the API should return status 200
    And the API response should have ok equal to "true"

    Examples:
      | size |
      | 162  |
      | 163  |
      | 164  |
      | 165  |
      | 166  |
      | 167  |
      | 168  |
      | 169  |
      | 170  |
      | 171  |

  Scenario Outline: Accept payload sizes near 5MB limit
    Given I am in session auth mode
    And I have a valid user email "test.applicant@example.com"
    And I have a valid session token for "test.applicant@example.com"
    When I submit a valid form data payload of <size> bytes
    Then the API should return status 200
    And the API response should have ok equal to "true"

    Examples:
      | size    |
      | 5242879 |
      | 5242880 |

  Scenario: Reject JSON payload exceeding 5MB limit
    Given I am in session auth mode
    And I have a valid user email "test.attacker@example.com"
    And I have a valid session token for "test.attacker@example.com"
    When I submit a form data payload of 6000000 bytes
    Then the API should return status 413
    And the API response should have error equal to "Payload too large"

  Scenario: Reject payload without content-length header when body is too large
    Given I am in session auth mode
    And I have a valid user email "test.attacker@example.com"
    And I have a valid session token for "test.attacker@example.com"
    When I submit a form data payload of 6000000 bytes without content-length header
    Then the API should return status 413
    And the API response should have error equal to "Payload too large"

  Scenario: Accept small payload without content-length header
    Given I am in session auth mode
    And I have a valid user email "test.applicant@example.com"
    And I have a valid session token for "test.applicant@example.com"
    When I submit a form data payload of 200 bytes without content-length header
    Then the API should return status 200
    And the API response should have ok equal to "true"

  Scenario: Reject multipart/form-data without content-length header
    Given I am in session auth mode
    And I have a valid user email "test.attacker@example.com"
    And I have a valid session token for "test.attacker@example.com"
    When I submit a multipart/form-data payload of 1000 bytes without content-length header
    Then the API should return status 411
    And the API response should have error equal to "Content-Length header required"

  Scenario: Accept multipart/form-data with valid content-length header
    Given I am in session auth mode
    And I have a valid user email "test.applicant@example.com"
    And I have a valid session token for "test.applicant@example.com"
    When I submit a multipart/form-data payload of 1000 bytes
    Then the API should return status 200
    And the API response should have ok equal to "true"

  Scenario: Reject application/x-www-form-urlencoded without content-length header
    Given I am in session auth mode
    And I have a valid user email "test.attacker@example.com"
    And I have a valid session token for "test.attacker@example.com"
    When I submit a application/x-www-form-urlencoded payload of 1000 bytes without content-length header
    Then the API should return status 411
    And the API response should have error equal to "Content-Length header required"

  Scenario: Accept application/x-www-form-urlencoded with valid content-length header
    Given I am in session auth mode
    And I have a valid user email "test.applicant@example.com"
    And I have a valid session token for "test.applicant@example.com"
    When I submit a application/x-www-form-urlencoded payload of 1000 bytes
    Then the API should return status 200
    And the API response should have ok equal to "true"

  Scenario: Reject multipart with dishonest Content-Length header (DoS protection)
    Given I am in session auth mode
    And I have a valid user email "test.attacker@example.com"
    And I have a valid session token for "test.attacker@example.com"
    When I submit a multipart/form-data payload claiming 1000 bytes but actually 6000000 bytes
    Then the API should return status 413
    And the API response should have error equal to "Payload too large"

