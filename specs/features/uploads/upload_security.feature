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

  Scenario: Valid content type is accepted
    Given I am authenticated as a TTC applicant
    When I request a signed URL with content type "image/jpeg"
    Then I should receive a signed URL and upload key for the photo
    And the signed URL should expire within 15 minutes
