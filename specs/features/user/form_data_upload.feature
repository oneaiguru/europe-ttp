Feature: User Form Data Upload
  As a authenticated user
  I want to upload form data
  So that save my application progress

  @p1 @needs-verification
  Scenario: Upload form data
    Given I am authenticated on the TTC portal
    When I upload form data for a specific form instance
    Then my form data should be stored for that instance
