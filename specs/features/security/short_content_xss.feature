Feature: Short Content XSS Protection
  As a user viewing legacy UI
  I want HTML content to be properly escaped
  So that malicious scripts cannot execute

  Scenario: Short XSS payload is escaped
    Given I am using the legacy utils.js getShowHideHTML function
    When I render content "<img src=x onerror=alert(1)>"
    Then the output should be escaped as "&lt;img src=x onerror=alert(1)&gt;"

  Scenario: Short script tag is escaped
    Given I am using the legacy utils.js getShowHideHTML function
    When I render content "<script>alert(1)</script>"
    Then the output should escape the script tag

  Scenario: Short onerror payload is escaped
    Given I am using the legacy utils.js getShowHideHTML function
    When I render content "<div onmouseover=alert(1)>hover</div>"
    Then the output should escape HTML attributes

  Scenario: Long safe content renders correctly
    Given I am using the legacy utils.js getShowHideHTML function
    When I render long content over 100 characters
    Then the output should contain the show/hide toggle
    And the content should be displayed
