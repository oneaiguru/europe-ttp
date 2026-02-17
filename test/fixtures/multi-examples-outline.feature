Feature: Multi-Examples Scenario Outline Test

Scenario Outline: Multi-example outline
  Given I have <count> apples
  When I eat <eaten> apples
  Then I have <remaining> apples

  Examples:
    | count | eaten | remaining |
    | 5     | 2     | 3          |
    | 10    | 4     | 6          |

  Examples:
    | count | eaten | remaining |
    | 3     | 1     | 2          |
    | 7     | 3     | 4          |
