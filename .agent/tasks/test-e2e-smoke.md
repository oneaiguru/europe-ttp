# Task: End-to-End Smoke Test with GCS Emulator

## Goal
Verify the full data flow: login → submit form data → run reporting jobs → verify admin pages show real data. All against the GCS emulator.

## Prerequisites Check
Before starting, verify infrastructure:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8009  # must be 200
curl -s http://localhost:4443/storage/v1/b | grep artofliving  # must find bucket
```
If either fails, stop and report "INFRASTRUCTURE NOT READY".

## Task 1: Seed Test Data

### 1a. Login as 3 test personas and save tokens
```bash
# Admin user
curl -s -X POST http://localhost:8009/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@ttc.test"}'
# Save the token from response

# Applicant
curl -s -X POST http://localhost:8009/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"applicant.alpha@ttc.test"}'

# Evaluator
curl -s -X POST http://localhost:8009/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"evaluator.1@ttc.test"}'
```

### 1b. Submit TTC application for applicant.alpha
POST to `/users/upload-form-data` with applicant's session cookie:
- `form_type=ttc_application`
- `form_instance=default`
- `form_data={"i_fname":"Alpha","i_lname":"Applicant","i_email":"applicant.alpha@ttc.test","i_agreement_accepted":"true","i_form_submitted":"true","i_enrolled_people":[{"i_first_name":"John","i_last_name":"Doe","i_email":"john@example.com","i_city":"New York","i_state":"NY"}],"i_org_courses":[{"i_from_date":"2026-01-01","i_to_date":"2026-01-15","i_city":"New York","i_state":"NY","i_lead_teacher":"Jane Smith"}]}`
- `form_instance_page_data={}`
- `form_instance_display=Alpha Application`

### 1c. Submit TTC evaluation for evaluator.1
POST to `/users/upload-form-data` with evaluator's session cookie:
- `form_type=ttc_evaluation`
- `form_instance=default`
- `form_data={"i_fname":"Eval","i_lname":"One","i_email":"evaluator.1@ttc.test","i_applicant_fname":"Alpha","i_applicant_lname":"Applicant","i_applicant_email":"applicant.alpha@ttc.test","i_agreement_accepted":"true","i_form_submitted":"true","i_teaching_readiness":"ready","i_overall_rating":"4"}`
- `form_instance_page_data={}`
- `form_instance_display=Eval for Alpha`

### 1d. Verify round-trip
GET `/users/get-form-data?form_type=ttc_application&form_instance=default` with applicant's cookie.
Must return the form data submitted in 1b.

## Task 2: Run Reporting Jobs

POST to these endpoints with admin session cookie:
- `/jobs/reporting/user-summary/load` — generates user_summary_by_user.json and _by_form_type.json
- `/jobs/integrity/user-integrity/load` — generates user_integrity_by_user.json

Both must return 200. If either returns 500, read the response body and report the error.

## Task 3: Verify Admin Pages

Use Playwright to navigate each page. For each: take a screenshot, check for real content.

### 3a. Summary page
Navigate to `http://localhost:8009/api/admin/ttc_applicants_summary` with admin session cookie.
- Page must load (not 401, not blank)
- Must contain a data table
- Screenshot to `.agent/screenshots/admin-summary.png`

### 3b. Reports page
Navigate to `http://localhost:8009/api/admin/ttc_applicants_reports` with admin session cookie.
- Page must load
- Screenshot to `.agent/screenshots/admin-reports.png`

### 3c. Integrity page
Navigate to `http://localhost:8009/api/admin/ttc_applicants_integrity` with admin session cookie.
- Page must load
- Screenshot to `.agent/screenshots/admin-integrity.png`

### 3d. Settings page
Navigate to `http://localhost:8009/api/admin/settings` with admin session cookie.
- Page must load
- Screenshot to `.agent/screenshots/admin-settings.png`

## Output
Write results to `.agent/test-e2e-results.md` with PASS/FAIL per subtask and any error details.
Save all screenshots to `.agent/screenshots/`.

## Verification
- `npx tsc --noEmit` (should still pass — no code changes in this task)

## Constraints
- Do NOT modify any source code
- Do NOT commit anything
- This is a read-only verification task
