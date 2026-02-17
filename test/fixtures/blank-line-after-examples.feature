Feature: Scenario Outline with Blank Lines in Examples

Scenario Outline: Apple counting with blank line after Examples
  Given I have <count> apples
  When I eat <eaten> apples
  Then I have <remaining> apples

  Examples:

    | count | eaten | remaining |
    | 5     | 2     | 3          |
    | 10    | 4     | 6          |

Scenario Outline: Apple counting with comment after Examples
  Given I have <count> apples
  When I eat <eaten> apples
  Then I have <remaining> apples

  Examples:
    # This is a comment
    | count | eaten | remaining |
    | 3     | 1     | 2          |
    | 7     | 3     | 4          |
