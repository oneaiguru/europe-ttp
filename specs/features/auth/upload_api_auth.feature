Feature: Upload API Authentication
  As a system administrator
  I want to control how API routes authenticate users
  So that the application is secure in both App Engine and standalone deployments

  Scenario: Platform mode accepts valid x-user-email header
    Given I am in platform auth mode
    And I have a valid user email "test.applicant@example.com"
    When I call getAuthenticatedUser with x-user-email header "test.applicant@example.com"
    Then the response should be the user "test.applicant@example.com"

  Scenario: Platform mode rejects missing x-user-email header
    Given I am in platform auth mode
    When I call getAuthenticatedUser without x-user-email header
    Then the response should be null

  Scenario: Platform mode rejects invalid email format
    Given I am in platform auth mode
    When I call getAuthenticatedUser with x-user-email header "not-an-email"
    Then the response should be null

  Scenario: Session mode accepts valid bearer token
    Given I am in session auth mode
    And I have a valid session token for "test.applicant@example.com"
    When I call getAuthenticatedUser with bearer token
    Then the response should be the user "test.applicant@example.com"

  Scenario: Session mode rejects invalid bearer token
    Given I am in session auth mode
    When I call getAuthenticatedUser with bearer token "invalid-token"
    Then the response should be null

  Scenario: Session mode rejects missing authorization header
    Given I am in session auth mode
    When I call getAuthenticatedUser without authorization header
    Then the response should be null

  Scenario: Session mode ignores x-user-email header
    Given I am in session auth mode
    And I have a valid user email "test.applicant@example.com"
    When I call getAuthenticatedUser with x-user-email header "test.applicant@example.com" and no bearer token
    Then the response should be null

  Scenario: Session mode rejects expired token
    Given I am in session auth mode
    And I have an expired session token for "test.applicant@example.com"
    When I call getAuthenticatedUser with bearer token
    Then the response should be null

  Scenario: Session mode rejects tampered token
    Given I am in session auth mode
    And I have a tampered session token for "test.applicant@example.com"
    When I call getAuthenticatedUser with bearer token
    Then the response should be null

  Scenario: Session token generation produces valid token
    Given I have a valid user email "test.applicant@example.com"
    When I generate a session token for "test.applicant@example.com"
    Then the token should have a valid format

  Scenario: Verify session token with valid signature
    Given I have a valid user email "test.applicant@example.com"
    And I generated a session token for "test.applicant@example.com"
    When I verify the session token
    Then the response should be the user "test.applicant@example.com"
