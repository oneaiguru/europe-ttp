Feature: Empty Cells in Examples Table

  Scenario Outline: Outline with empty cell values
    Given I have a name of "<name>"
    When I set the value to "<value>"
    Then I have notes of "<notes>"

    Examples:
      | name  | value | notes      |
      | test1 | 123   |            |
      | test2 |       | important  |
      | test3 | 789   | some notes |
      |       | 456   | empty name |
