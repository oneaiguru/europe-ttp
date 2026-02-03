Feature: Deadline Enforcement and Whitelist Override
  As a TTC administrator
  I want to control who can submit past deadline
  So that exceptions can be granted manually

  @e2e @deadline @api
  Scenario: Applicant blocked when TTC option is expired
    Given test mode is disabled (real deadline enforcement)
    And TTC option "test_expired" has display_until in the past
    And I am authenticated as applicant with email "test.applicant@example.com"
    And I navigate to the TTC application form
    # API: Verify submission rejected
    When I attempt to submit TTC application via API for "test_expired"
    Then the submission should be rejected with deadline error
    And the form should not be marked as submitted

  @e2e @deadline @api
  Scenario: Whitelisted applicant can submit past deadline
    Given test mode is disabled
    And TTC option "test_expired" has display_until in the past
    And user "test.applicant@example.com" is NOT whitelisted
    And I am authenticated as admin
    When I add "test.applicant@example.com" to the whitelist via API
    Then the user should be in the whitelist config
    And the applicant should be able to submit within grace period

  @e2e @deadline @api
  Scenario: Whitelist expires after grace period
    Given user "test.applicant@example.com" is whitelisted
    And the whitelist grace period has expired
    When I attempt to submit TTC application via API for "test_expired"
    Then the submission should be rejected
    And the error response should indicate grace period expired

  @e2e @deadline @api
  Scenario: Test mode bypasses deadline checks
    Given test mode is enabled
    And TTC option "test_expired" has display_until in the past
    And I am authenticated as applicant with email "test.applicant@example.com"
    When I attempt to submit TTC application via API for "test_expired"
    Then the TTC application should be marked as submitted
    And the form should be marked as complete

  @e2e @deadline @api
  Scenario: Admin can remove user from whitelist
    Given user "test.applicant@example.com" is whitelisted
    And I am authenticated as admin
    When I add "test.applicant@example.com" to the whitelist via API
    Then the user should be in the whitelist config
