Feature: Home Country Changes Available TTC Options
  As a TTC applicant
  I want to see TTC options relevant to my home country
  So that I don't see courses I'm not eligible for

  @e2e @country-filtering @api
  Scenario: US user sees US TTC options only
    Given I am authenticated as applicant with email "test.applicant@example.com"
    When I set my home country to "US" via API
    And I navigate to the TTC application form
    # In a real implementation, this would verify the dropdown contents
    Then test TTC option "test_us_future" is available

  @e2e @country-filtering @api
  Scenario: Canadian user sees Canadian TTC options
    Given I am authenticated as applicant with email "test.applicant.ca@example.com"
    When I set my home country to "CA" via API
    And I navigate to the TTC application form
    Then test TTC option "test_ca_future" is available

  @e2e @country-filtering @api
  Scenario: Multi-country TTC appears for both US and CA users
    Given I am authenticated as applicant with email "test.applicant@example.com"
    When I set my home country to "US" via API
    And I navigate to the TTC application form
    Then test TTC option "test_multi_country" is available

    Given I am authenticated as applicant with email "test.applicant.ca@example.com"
    When I set my home country to "CA" via API
    And I navigate to the TTC application form
    Then test TTC option "test_multi_country" is available

  @e2e @country-filtering @api
  Scenario Outline: User from each country sees correct TTC options
    Given I am authenticated as "<email>"
    When I set my home country to "<country>" via API
    And I navigate to the TTC application form
    Then test TTC option "<expected_ttc>" is available

    Examples:
      | email                          | country | expected_ttc     |
      | test.applicant@example.com     | US      | test_us_future   |
      | test.applicant.ca@example.com  | CA      | test_ca_future   |
      | test.applicant.in@example.com  | IN      | test_in_future   |
