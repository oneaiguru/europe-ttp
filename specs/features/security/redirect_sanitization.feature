Feature: Redirect URL Sanitization
  As a security measure
  I want to reject unsafe redirect URLs
  So users are not phished via open redirects

  # Security Policy: Same-origin HTTP redirects are allowed because:
  # 1. Same-origin check prevents cross-origin phishing attacks
  # 2. If user is on http://, same-origin http:// redirect is not a downgrade
  # 3. If user is on https://, browser blocks mixed-content navigation
  # See docs/security/URL_POLICY.md for full policy details.

  Scenario: Protocol-relative URLs are rejected
    Given I have a redirect URL "//evil.com/path"
    When I sanitize the redirect URL
    Then the result should be null

  Scenario: Protocol-relative URLs with subdomain are rejected
    Given I have a redirect URL "//attacker.evil.com/path"
    When I sanitize the redirect URL
    Then the result should be null

  Scenario: Root-relative paths are allowed
    Given I have a redirect URL "/safe-path"
    When I sanitize the redirect URL
    Then the result should be "/safe-path"

  Scenario: Root-relative paths with query string are allowed
    Given I have a redirect URL "/safe-path?query=value"
    When I sanitize the redirect URL
    Then the result should be "/safe-path?query=value"

  Scenario: Cross-origin HTTPS URLs are rejected
    Given I have a redirect URL "https://not-this-host.example/path"
    When I sanitize the redirect URL
    Then the result should be null

  Scenario: Cross-origin HTTP URLs are rejected
    Given I have a redirect URL "http://evil.com/path"
    When I sanitize the redirect URL
    Then the result should be null

  Scenario: Same-origin HTTPS URLs are allowed
    Given I have a redirect URL "https://example.com/same-path"
    When I sanitize the redirect URL
    Then the result should be the original URL

  Scenario: Same-origin HTTP URLs are allowed
    Given I have a redirect URL "http://example.com/same-path"
    When I sanitize the redirect URL
    Then the result should be the original URL

  Scenario: Empty string returns null
    Given I have a redirect URL ""
    When I sanitize the redirect URL
    Then the result should be null

  Scenario: String literal "null" returns null
    Given I have a redirect URL "null"
    When I sanitize the redirect URL
    Then the result should be null

  Scenario: Actual null input returns null
    Given I have a null redirect URL
    When I sanitize the redirect URL
    Then the result should be null

  Scenario: Non-HTTP protocol URLs are rejected
    Given I have a redirect URL "javascript:alert(1)"
    When I sanitize the redirect URL
    Then the result should be null

  # URL Encoding Bypass Tests
  Scenario: URL-encoded protocol-relative URLs are rejected
    Given I have a redirect URL "%2F%2Fevil.com%2Fpath"
    When I sanitize the redirect URL
    Then the result should be null

  Scenario: Double-encoded protocol-relative URLs are rejected
    Given I have a redirect URL "%252F%252Fevil.com%252Fpath"
    When I sanitize the redirect URL
    Then the result should be null

  Scenario: Mixed-case URL-encoded protocol-relative URLs are rejected
    Given I have a redirect URL "%2f%2fevil.com%2fpath"
    When I sanitize the redirect URL
    Then the result should be null

  # Mixed-Case Protocol Tests
  Scenario: Mixed-case javascript: URLs are rejected
    Given I have a redirect URL "JaVaScRiPt:alert(1)"
    When I sanitize the redirect URL
    Then the result should be null

  Scenario: URL-encoded javascript: protocol is rejected
    Given I have a redirect URL "%6A%61%76%61%73%63%72%69%70%74%3Aalert(1)"
    When I sanitize the redirect URL
    Then the result should be null

  # Unicode Attack Tests
  Scenario: Unicode homograph URLs with Cyrillic lookalikes are handled safely
    Given I have a redirect URL "https://pаypal.com/login"
    When I sanitize the redirect URL
    Then the result should be null

  Scenario: Unicode fullwidth colon character is rejected
    Given I have a redirect URL "javascript\uff1aalert(1)"
    And the redirect URL contains codepoint "U+FF1A" at position 10
    When I sanitize the redirect URL
    Then the result should be null

  # Injection Attack Tests
  Scenario: Null byte injection in redirect URL is rejected
    Given I have a redirect URL "https://example.com%00.evil.com/path"
    When I sanitize the redirect URL
    Then the result should be null

  Scenario: Tab character injection in javascript: URL is rejected
    Given I have a redirect URL "java\tscript:alert(1)"
    And the redirect URL contains codepoint "U+0009" at position 4
    When I sanitize the redirect URL
    Then the result should be null
