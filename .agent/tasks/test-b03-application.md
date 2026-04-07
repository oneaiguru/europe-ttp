# Task: Application Form Lifecycle (B02+B03)

## Goal
Test form submission lifecycle: save draft, reload, submit, edit, multi-instance, validation.

## Prerequisites
- Seed data from B00 complete
- Read `.agent/test-b00-seed-results.md` for tokens

## Tests

### APP-05: Draft save and resume
Login as applicant.alpha. POST partial form data (only i_fname, i_lname — no i_form_submitted). GET it back. Verify exact data restored.

### APP-06: Multi-instance
Login as applicant.multi. POST form data with form_instance=TTC_OPEN_US_2026. POST again with form_instance=TTC_EXPIRED_CA_2026. GET /users/get-form-instances?form_type=ttc_application. Verify both instances returned.

### APP-08: Submit sets read-only state
POST with i_form_submitted=true, i_agreement_accepted=true. GET back. Verify is_form_submitted=true in response.

### APP-04: Validation
POST to /users/upload-form-data with missing form_type. Verify 400 error (not 500).

### APP-01: US vs non-US form pages render
Use Playwright to navigate /api/forms/ttc_application_us and /api/forms/ttc_application_non_us. Verify both render with form fields. Screenshot both.

## Output
Write PASS/FAIL per test to `.agent/test-b03-app-results.md`. Screenshots to `.agent/screenshots/`.
