Feature: Photo Upload
  As a authenticated user
  I want to upload a profile photo
  So that add a photo to my profile

  @p1 @needs-verification
  Scenario: Request signed URL for photo
    Given I am authenticated on the TTC portal
    When I request a signed upload URL for a profile photo
    Then I should receive a signed URL and upload key for the photo
