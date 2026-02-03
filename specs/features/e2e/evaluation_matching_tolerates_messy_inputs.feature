Feature: Evaluation Matching Tolerates Messy Inputs
  As a TTC administrator
  I want evaluations to match applicants even with messy input
  So that teachers' real-world typing mistakes don't cause data loss

  @e2e @api @fuzzy-matching
  Scenario: Evaluator enters email with case variations and spaces
    Given applicant "Test Applicant" exists with email "test.applicant@example.com"
    And applicant has submitted TTC application for "test_us_future"
    When evaluator submits evaluation with candidate email "  Test.Applicant@Example.com  " for applicant "Test Applicant"
    Then the evaluation should be matched to the applicant
    And the evaluation should count toward the applicant's evaluation total

  @e2e @api @fuzzy-matching
  Scenario: Evaluator enters no @ but name matches
    Given applicant "Test Applicant" exists with email "test.applicant@example.com"
    And applicant has submitted TTC application for "test_us_future"
    When evaluator submits evaluation with candidate email "notanemail" for applicant "Test Applicant"
    Then the evaluation should be matched via name fallback
    And the evaluation should count toward the applicant's evaluation total

  @e2e @api @fuzzy-matching
  Scenario: Minor name typo still matches
    Given applicant "Test Applicant" exists with email "test.applicant@example.com"
    And applicant has submitted TTC application for "test_us_future"
    When evaluator submits evaluation with candidate email "test.aplicant@example.com" for applicant "Test Applicant"
    Then the evaluation should be matched via fuzzy email matching
    And the evaluation should count toward the applicant's evaluation total

  @e2e @api @fuzzy-matching
  Scenario: Extra dots in email still matches
    Given applicant "Test Applicant" exists with email "test.applicant@example.com"
    And applicant has submitted TTC application for "test_us_future"
    When evaluator submits evaluation with candidate email "test..applicant@example.com" for applicant "Test Applicant"
    Then the evaluation should be matched via fuzzy email matching
    And the evaluation should count toward the applicant's evaluation total

  @e2e @api @fuzzy-matching
  Scenario: Mixed case email matches correctly
    Given applicant "Test Applicant" exists with email "test.applicant@example.com"
    And applicant has submitted TTC application for "test_us_future"
    When evaluator submits evaluation with candidate email "TEST.APPLICANT@EXAMPLE.COM" for applicant "Test Applicant"
    Then the evaluation should be matched to the applicant
    And the evaluation should count toward the applicant's evaluation total
