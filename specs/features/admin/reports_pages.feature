Feature: Admin Reports Pages
  As a admin user
  I want to open report pages
  So that review applicant data

  @p2 @needs-verification
  Scenario: Admin opens report pages
    Given I am authenticated as an admin user
    When I open the admin reports list page
    Then I should see the list of available report pages
