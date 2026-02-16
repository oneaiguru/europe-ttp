Feature: Upload Security
  As a TTC applicant
  I want the upload URL generation to be secure
  So that unauthorized users cannot abuse the system

  Scenario: Anonymous user cannot request signed URL
    When I request a signed upload URL without authentication
    Then I should receive a 401 error
    And no signed URL should be generated

  Scenario: Directory traversal is blocked
    Given I am authenticated as a TTC applicant
    When I request a signed URL with filepath "../../etc/passwd"
    Then I should receive a 400 error
    And the error should mention "Invalid filepath"

  Scenario: Invalid content type is rejected
    Given I am authenticated as a TTC applicant
    When I request a signed URL with content type "application/exe"
    Then I should receive a 400 error
    And the error should mention "Invalid content type"

  Scenario: Missing content type is rejected
    Given I am authenticated as a TTC applicant
    When I request a signed URL without a content type
    Then I should receive a 400 error
    And the error should mention "content_type"

  Scenario: Valid content type with GCS not configured
    Given I am authenticated as a TTC applicant
    When I request a signed URL with content type "image/jpeg"
    Then I should receive a 501 error
    And the response should indicate GCS is not configured

  Scenario: User cannot request signed URL for another user's directory
    Given I am authenticated as user "alice@example.com"
    When I request a signed URL for user "bob@example.com"
    Then I should receive a 403 error
    And the error should mention "authorization"

  Scenario: User cannot request signed URL with another user's email without path separator
    Given I am authenticated as user "alice@example.com"
    When I request a signed URL with filepath "bob@example.com"
    Then I should receive a 403 error
    And the error should mention "authorization"

  Scenario: User can request signed URL with their own email in filepath
    Given I am authenticated as user "alice@example.com"
    When I request a signed URL with filepath "alice@example.com"
    Then I should receive a 501 error
    And the response should indicate GCS is not configured
