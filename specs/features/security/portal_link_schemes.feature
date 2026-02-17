Feature: Portal Link Scheme Validation
  As a portal user
  I want clickable links to be safe
  So that malicious scripts cannot execute

  # Security Policy: HTTP URLs are allowed for backward compatibility with legacy
  # partner sites and intranet resources. HSTS should be enabled at deployment
  # level to enforce HTTPS upgrades where applicable. See docs/security/URL_POLICY.md.

  Background:
    Given I am viewing the portal home page

  Scenario: javascript: URL is rejected
    When a report link contains "javascript:alert(1)"
    Then the link should be rejected or sanitized

  Scenario: javascript: URL with uppercase is rejected
    When a report link contains "JAVASCRIPT:alert(1)"
    Then the link should be rejected or sanitized

  Scenario: data: URL is rejected
    When a report link contains "data:text/html,<script>alert(1)</script>"
    Then the link should be rejected or sanitized

  Scenario: vbscript: URL is rejected
    When a report link contains "vbscript:msgbox(1)"
    Then the link should be rejected or sanitized

  Scenario: file: URL is rejected
    When a report link contains "file:///etc/passwd"
    Then the link should be rejected or sanitized

  Scenario: https: URL is allowed
    When a report link contains "https://example.com/report.pdf"
    Then the link should be rendered correctly

  Scenario: http: URL is allowed
    When a report link contains "http://example.com/report.pdf"
    Then the link should be rendered correctly

  Scenario: Relative path URL is allowed
    When a report link contains "/reports/annual.pdf"
    Then the link should be rendered correctly

  Scenario: Protocol-relative URL is rejected
    When a report link contains "//evil.com/phishing"
    Then the link should be rejected or sanitized

  Scenario: blob: URL is rejected
    When a report link contains "blob:https://example.com/550e8400-e29b-41d4-a716-446655440000"
    Then the link should be rejected or sanitized

  Scenario: about:blank URL is rejected
    When a report link contains "about:blank"
    Then the link should be rejected or sanitized

  Scenario: about:srcdoc URL is rejected
    When a report link contains "about:srcdoc"
    Then the link should be rejected or sanitized

  Scenario: filesystem: URL is rejected
    When a report link contains "filesystem:http://example.com/temporary/malicious.html"
    Then the link should be rejected or sanitized
