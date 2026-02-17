Feature: Carousel Edge Cases
  As a user viewing tabbed content
  I want the carousel to handle edge cases gracefully
  So that the UI doesn't break

  Background:
    Given I am viewing a page with a carousel

  Scenario: Carousel with no rows does not crash
    And the carousel has zero content rows
    When I click the carousel arrow
    Then the page should not throw an error
    And no content should be displayed

  Scenario: Carousel with single row cycles correctly
    And the carousel has one content row
    When I click the carousel arrow
    Then the same row should be displayed
    And the carousel should cycle back to the first row

  Scenario: Carousel with multiple rows cycles correctly
    And the carousel has three content rows
    When I click the carousel arrow
    Then the next row should be displayed
    And the carousel should cycle when reaching the end
