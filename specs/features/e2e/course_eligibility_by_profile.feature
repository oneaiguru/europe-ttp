Feature: Course Eligibility by User Profile
  As a TTC applicant
  I want to see which courses I'm eligible for based on my profile
  So that I don't waste time on applications I can't complete

  Scenario: Eligibility shows required prerequisites
    Given I am authenticated as a TTC applicant
    When I view my course eligibility dashboard
    Then I should see a list of available courses with prerequisites:
      | course | prerequisite | status |
      | TTC Application | None | Eligible |
      | TTC Evaluation | TTC Application submitted | Not Eligible |
      | DSN Application | Happiness Program completed | Not Eligible |
      | Part 1 | Happiness Program completed | Not Eligible |
      | Part 2 | Part 1 completed | Not Eligible |

  Scenario: Ineligible user gets "not available" message
    Given I am authenticated as applicant with email "test.applicant@example.com"
    And I have NOT completed the Happiness Program
    When I attempt to access the DSN application form
    Then I should see "not available" message
    And the message should explain the prerequisite: "Complete Happiness Program first"

  Scenario: Eligibility updates after completing prerequisite
    Given I have NOT completed the Happiness Program
    And the DSN form shows as "not available"
    When I complete the Happiness Program
    And I refresh the eligibility dashboard
    Then the DSN form should show as "available"
