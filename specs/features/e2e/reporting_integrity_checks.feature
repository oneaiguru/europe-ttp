Feature: Reporting Integrity Checks
  As a TTC administrator
  I want integrity reports to flag missing uploads, incomplete forms, and mismatched user IDs
  So that I can identify and fix data quality issues

  Scenario: Integrity report flags missing uploads
    Given applicant has submitted TTC application
    But applicant has NOT uploaded required photo
    And I run the user integrity report
    Then "test.applicant@example.com" should be flagged for missing photo
    And the integrity report should show the missing upload type

  Scenario: Integrity report flags incomplete forms
    Given applicant has started TTC application but not submitted
    And I run the user integrity report
    Then "test.applicant@example.com" should be flagged for incomplete application
    And the report should show the application status as "incomplete"

  Scenario: Integrity report flags mismatched user IDs
    Given evaluation was submitted with email "test.aplicant@example.com"
    But applicant exists with email "test.applicant@different.com"
    And I run the user integrity report
    Then the evaluation should be flagged as unmatched
    And the report should show the mismatched email

  Scenario: Download integrity report as CSV
    Given I run the user integrity report
    When I download the integrity report as CSV
    Then the CSV should contain columns: email, flags, missing_uploads, incomplete_forms, mismatches
    And the CSV should be downloadable via admin dashboard
