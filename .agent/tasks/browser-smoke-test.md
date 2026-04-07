# Browser Smoke Test — GCS Emulator + Auth + Data Flow

## Goal
Verify the TS app works end-to-end with the GCS emulator: pages render, auth blocks unauthorized access, form data persists, and admin pages show real data.

## Prerequisites
- Dev server running at http://localhost:8009
- GCS emulator running at http://localhost:4443
- Bucket `artofliving-ttcdesk.appspot.com` exists

## Tests

Use Playwright browser tools for navigation. Use curl/fetch for API calls.

### 1. Landing page renders
- Navigate to http://localhost:8009
- Verify the page loads with visible content (not blank, not error)
- Take a screenshot

### 2. Admin pages require auth
- Navigate to http://localhost:8009/api/admin/ttc_applicants_summary
- Verify the response is a 401 status or auth redirect (NOT the full admin page)
- This proves the auth middleware is working

### 3. Dev-mode login works
- POST to http://localhost:8009/api/auth/login with body `{"email":"test@example.com"}`
- Verify response contains a session token
- Save the token for subsequent requests

### 4. Form data persists through GCS
- POST to http://localhost:8009/users/upload-form-data with:
  - Header: Cookie or Authorization with the session token from step 3
  - Body: form_type=ttc_application, form_instance=default, form_data={"i_fname":"Test","i_lname":"User","i_email":"test@example.com"}, form_instance_page_data={}, form_instance_display="Test Application"
- Verify 200 response with `{"ok":true}`
- GET http://localhost:8009/users/get-form-data?form_type=ttc_application&form_instance=default (with auth)
- Verify response contains the form data we just submitted (i_fname=Test, i_lname=User)

### 5. Admin config persists through GCS
- POST to http://localhost:8009/api/admin/admin/set-config with auth and body: `{"config_params":{"test_key":"test_value"}}`
- GET http://localhost:8009/api/admin/admin/get-config with auth
- Verify response contains `test_key: test_value`

### 6. Reporting job runs without error
- POST to http://localhost:8009/jobs/reporting/user-summary/load with admin auth header
- Verify 200 response (job completes without crash)

## Output
Report each test as PASS or FAIL with details. Take screenshots of any pages navigated to.
Write results to `.agent/browser-smoke-results.md`.
