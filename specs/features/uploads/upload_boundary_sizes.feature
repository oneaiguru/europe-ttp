Feature: Upload Size Boundary Testing
  # Size Constant Reference:
  # 5MB = 5 * 1024 * 1024 = 5242880 bytes
  # See: app/users/upload-form-data/route.ts:MAX_PAYLOAD_SIZE
  #
  # As an applicant
  # I want to submit applications near the size limit
  # So that I know exactly what is allowed

  Background:
    Given I am authenticated as a TTC applicant
    And I am using the upload-form-data endpoint

  Scenario: Upload at exact 5MB limit succeeds
    When I submit a form with payload size 5242880 bytes
    Then the submission should succeed

  Scenario: Upload at 5MB minus 1 byte succeeds
    When I submit a form with payload size 5242879 bytes
    Then the submission should succeed

  Scenario: Upload at 5MB plus 1 byte is rejected
    When I submit a form with payload size 5242881 bytes
    Then I should receive a 413 error
    And the error should mention size limit

  Scenario: Upload well over 5MB is rejected
    When I submit a form with payload size 6000000 bytes
    Then I should receive a 413 error
    And the error should mention size limit

  Scenario: Upload well under 5MB succeeds
    When I submit a form with payload size 1000000 bytes
    Then the submission should succeed

  Scenario: Upload at minimum JSON size succeeds
    When I submit a form with payload size 16 bytes
    Then the submission should succeed
