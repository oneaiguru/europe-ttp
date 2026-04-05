@browser
Feature: Portal Tab Page - Browser Behavior
  As an authenticated user
  I want to view the portal tabs page
  So that I can access TTC Desk information and contact details

  Background:
    Given I navigate to "/api/portal/tabs"

  Scenario: Tab displays TTC Desk info
    Then I should see "United States TTC Desk" on the page

  Scenario: Tab displays contact email
    Then I should see link "ttc@artofliving.org"

  Scenario: Contact section has correct structure
    Then I should see element ".tab-contact"
