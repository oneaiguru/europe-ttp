Feature: Upload API Rate Limiting and Error Redaction

  As a security measure
  The upload API endpoints should enforce rate limits
  And production error responses should not leak internal details

  Background:
    Given I am in session auth mode
    And I have a valid session token for "test.applicant@example.com"
    And GCS is configured for testing

  Scenario: User within rate limit succeeds
    When I request a signed upload URL via the API
    Then the response should contain a valid signed URL

  Scenario: Production error responses are generic
    Given NODE_ENV is set to "production"
    And GCS signed URL generation fails
    When I request a signed upload URL via the API
    Then the error message should be generic
    And production error responses should not leak internal details

  Scenario: Development error responses are detailed
    Given NODE_ENV is set to "development"
    And GCS signed URL generation fails
    When I request a signed upload URL via the API
    Then the error message should be detailed

  Scenario: User exceeding rate limit receives 429
    Given I have made 11 upload requests within the limit window
    When I request a signed upload URL via the API
    Then I should receive a 429 rate limit error
    And the error message should indicate rate limit exceeded

  Scenario: Session mode rate limits by user email not token
    Given I am in session auth mode
    And I have a valid session token for "user.a@example.com"
    And I have made 10 upload requests as "user.a@example.com"
    When I authenticate with a new session token for "user.a@example.com"
    And I request a signed upload URL via the API
    Then I should receive a 429 rate limit error
    And the rate limit should be based on user email not token

  Scenario: Platform mode rate limits by x-user-email header
    Given I am in platform auth mode
    And GCS is configured for testing
    And user "platform.user@example.com" has made 10 upload requests
    When user "platform.user@example.com" requests a signed upload URL
    Then I should receive a 429 rate limit error
    And the error message should indicate rate limit exceeded
