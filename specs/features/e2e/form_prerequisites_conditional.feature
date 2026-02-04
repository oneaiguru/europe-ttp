Feature: Form Prerequisites and Conditional Availability
  As a TTC applicant
  I want forms to appear based on my profile completion and prior course completion
  So that I only see forms I'm eligible for

  Scenario: DSN form available after Happiness Program completion
    Given I am authenticated as applicant with email "test.applicant@example.com"
    When I have NOT completed the Happiness Program
    Then the DSN application form should NOT be available
    When I complete the Happiness Program
    Then the DSN application form should become available

  Scenario: YES++ form requires Part 1 and Part 2 completion
    Given I am authenticated as applicant with email "test.applicant@example.com"
    When I have completed Part 1 but NOT Part 2
    Then the YES+ application form should NOT be available
    When I complete Part 2
    Then the YES+ application form should become available

  Scenario: Part 1 availability requires Happiness Program
    Given I am authenticated as applicant with email "test.applicant@example.com"
    When I have NOT completed the Happiness Program
    Then the Part 1 course application should NOT be available
    When I complete the Happiness Program
    Then the Part 1 course application should become available

  Scenario: Part 2 availability requires Part 1 completion
    Given I am authenticated as applicant with email "test.applicant@example.com"
    When I have NOT completed Part 1
    Then the Part 2 course application should NOT be available
    When I complete Part 1
    Then the Part 2 course application should become available

  Scenario: Form eligibility changes based on home country
    Given I am authenticated as applicant with email "test.applicant@example.com"
    When my home country is "US"
    Then US-specific TTC options should be available
    And India-specific TTC options should NOT be available
    When I update my home country to "IN"
    Then India-specific TTC options should become available
