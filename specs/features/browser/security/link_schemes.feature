@browser @pending
Feature: Link Scheme Security - Browser Behavior
  As a user clicking links in the portal
  I want dangerous URL schemes to be blocked
  So that javascript: and data: links cannot execute

  # NOTE: This feature tests sanitizeHref behavior in rendered links.
  # Executable once forms/admin render functions include link elements.

  @p2
  Scenario: Links do not use javascript scheme
    Given I navigate to "/api/portal/home"
    Then no link should have a "javascript:" href
