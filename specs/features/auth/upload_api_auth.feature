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

  Scenario: Platform mode requires explicit opt-in
    Given I have not set AUTH_MODE environment variable
    When I call getAuthenticatedUser with x-user-email header "test.applicant@example.com"
    Then the response should be null

  Scenario: Platform mode with strict IAP verification rejects non-IAP requests
    Given I am in platform auth mode with strict IAP verification
    And I have a valid user email "test.applicant@example.com"
    When I call getAuthenticatedUser with x-user-email header "test.applicant@example.com" without IAP JWT assertion
    Then the response should be null

  Scenario: Platform mode with strict IAP verification accepts verified IAP JWT assertion
    Given I am in platform auth mode with strict IAP verification
    And I have a valid user email "test.applicant@example.com"
    When I call getAuthenticatedUser with x-user-email header "test.applicant@example.com" with verified IAP JWT assertion
    Then the response should be the user "test.applicant@example.com"

  Scenario: Platform mode with strict IAP verification rejects spoofed x-user-email
    Given I am in platform auth mode with strict IAP verification
    When I call getAuthenticatedUser with x-user-email header "spoof@example.com" and a verified IAP JWT assertion for "test.applicant@example.com"
    Then the response should be null

  Scenario: Platform mode in production without strict verification fails closed
    Given I am in platform auth mode in production
    And I have a valid user email "test.applicant@example.com"
    When I call getAuthenticatedUser in platform mode without strict verification
    Then the response should be null in production without strict mode

  Scenario: Platform mode in development without strict verification works
    Given I am in platform auth mode in development
    And I have a valid user email "test.applicant@example.com"
    When I call getAuthenticatedUser in platform mode without strict verification
    Then the response should be the user in development without strict mode

  # ============================================================================
  # NODE_ENV and AUTH_MODE_PLATFORM_STRICT combination tests
  # ============================================================================

  Scenario Outline: Platform mode behavior across NODE_ENV values without strict
    Given I am in platform auth mode with NODE_ENV "<node_env>"
    And AUTH_MODE_PLATFORM_STRICT is "unset"
    And I have a valid user email "test@example.com"
    When I call getAuthenticatedUser with x-user-email header "test@example.com"
    Then the response should be "<expected_result>"

    Examples:
      | node_env    | expected_result |
      | production  | null            |
      | development | test@example.com |
      | test        | test@example.com |
      | staging     | test@example.com |
      | unset       | test@example.com |

  Scenario Outline: Platform mode behavior across NODE_ENV values with strict enabled
    Given I am in platform auth mode with NODE_ENV "<node_env>"
    And AUTH_MODE_PLATFORM_STRICT is "true"
    And IAP is configured for testing
    And I have a valid user email "test@example.com"
    When I call getAuthenticatedUser with x-user-email header "test@example.com" without IAP JWT assertion
    Then the response should require IAP verification

    Examples:
      | node_env    |
      | production  |
      | development |
      | test        |
      | staging     |
      | unset       |

  Scenario: NODE_ENV case sensitivity - Production (capitalized) is not production
    Given I am in platform auth mode with NODE_ENV "Production"
    And AUTH_MODE_PLATFORM_STRICT is "unset"
    And I have a valid user email "test@example.com"
    When I call getAuthenticatedUser with x-user-email header "test@example.com"
    Then the response should be the user "test@example.com"

  Scenario: NODE_ENV case sensitivity - PRODUCTION (uppercase) is not production
    Given I am in platform auth mode with NODE_ENV "PRODUCTION"
    And AUTH_MODE_PLATFORM_STRICT is "unset"
    And I have a valid user email "test@example.com"
    When I call getAuthenticatedUser with x-user-email header "test@example.com"
    Then the response should be the user "test@example.com"

  Scenario: AUTH_MODE_PLATFORM_STRICT only accepts literal "true"
    Given I am in platform auth mode with NODE_ENV "production"
    And AUTH_MODE_PLATFORM_STRICT is "TRUE"
    And I have a valid user email "test@example.com"
    When I call getAuthenticatedUser with x-user-email header "test@example.com"
    Then the response should be null

  Scenario: AUTH_MODE_PLATFORM_STRICT "yes" is not treated as true
    Given I am in platform auth mode with NODE_ENV "production"
    And AUTH_MODE_PLATFORM_STRICT is "yes"
    And I have a valid user email "test@example.com"
    When I call getAuthenticatedUser with x-user-email header "test@example.com"
    Then the response should be null

  Scenario: AUTH_MODE_PLATFORM_STRICT "1" is not treated as true
    Given I am in platform auth mode with NODE_ENV "production"
    And AUTH_MODE_PLATFORM_STRICT is "1"
    And I have a valid user email "test@example.com"
    When I call getAuthenticatedUser with x-user-email header "test@example.com"
    Then the response should be null

  Scenario: Non-production with AUTH_MODE_PLATFORM_STRICT "yes" allows header
    Given I am in platform auth mode with NODE_ENV "development"
    And AUTH_MODE_PLATFORM_STRICT is "yes"
    And I have a valid user email "test@example.com"
    When I call getAuthenticatedUser with x-user-email header "test@example.com"
    Then the response should be the user "test@example.com"

  Scenario: Unset NODE_ENV with strict mode requires IAP
    Given I am in platform auth mode with NODE_ENV "unset"
    And AUTH_MODE_PLATFORM_STRICT is "true"
    And IAP is configured for testing
    And I have a valid user email "test@example.com"
    When I call getAuthenticatedUser with x-user-email header "test@example.com" without IAP JWT assertion
    Then the response should require IAP verification

  Scenario: Unset NODE_ENV without strict mode allows header
    Given I am in platform auth mode with NODE_ENV "unset"
    And AUTH_MODE_PLATFORM_STRICT is "unset"
    And I have a valid user email "test@example.com"
    When I call getAuthenticatedUser with x-user-email header "test@example.com"
    Then the response should be the user "test@example.com"
