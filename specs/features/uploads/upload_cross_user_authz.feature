Feature: Upload Cross-User Authorization
  As a security measure
  Upload endpoints must enforce per-user access control
  So that users cannot access each other's uploads

  Background:
    Given I am in session auth mode
    And GCS is configured for testing

  Scenario: User A cannot verify User B's upload token
    Given I have a valid session token for "user.a@example.com"
    And User B "user.b@example.com" has generated an upload token
    When I verify User B's upload token
    Then the verification should fail with 403 forbidden

  Scenario: User A cannot request URL for User B's filepath
    Given I have a valid session token for "user.a@example.com"
    When I request a signed URL with filepath "photos/user.b@example.com/photo.jpg"
    Then I should receive a 403 forbidden error

  Scenario: Platform mode isolates rate limits per user
    Given I am in platform auth mode
    And user "user.a@example.com" has made 10 upload requests
    When user "user.b@example.com" requests a signed upload URL
    Then the request should succeed
    And rate limits should not be shared between users
