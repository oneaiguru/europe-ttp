Feature: User Config Management
  As a authenticated user
  I want to manage my configuration
  So that store portal preferences

  @p2
  Scenario: Get user configuration
    Given I am authenticated on the TTC portal
    When I request my user configuration
    Then I should receive my saved configuration

  @p2
  Scenario: Update user configuration
    Given I am authenticated on the TTC portal
    When I update my user configuration
    Then my configuration should be saved
