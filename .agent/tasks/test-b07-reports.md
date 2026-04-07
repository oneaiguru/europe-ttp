# Task: Reports, Integrity, and Post-TTC Verification (B07+B05+B08)

## Goal
Verify admin report pages show correct data from reporting jobs, integrity matches are visible, and post-TTC/Sahaj feedback matching works.

## Prerequisites
- Seed data from B00 complete
- Reporting + integrity jobs have run

## Tests

### Summary page data
Use Playwright to navigate /api/admin/ttc_applicants_summary with admin auth (akshay.ponda@artofliving.org).
- Verify DataTables table has at least 1 row (not "No data available")
- Check table columns include: Name, Status, Evals Status, Email
- Screenshot to `.agent/screenshots/summary-with-data.png`

### Reports page data
Navigate /api/admin/ttc_applicants_reports with admin auth.
- Verify page renders with table
- Screenshot

### Integrity page data
Navigate /api/admin/ttc_applicants_integrity with admin auth (must have integrity permission).
- Login as n84.amit@gmail.com or akshay.ponda@artofliving.org (both have ttc_applicants_integrity.html permission)
- Verify DataTables has content
- Screenshot

### Post-TTC feedback page
Navigate /api/admin/post_ttc_course_feedback with admin auth.
- Verify page renders
- Screenshot

### Post-Sahaj feedback page
Navigate /api/admin/post_sahaj_ttc_course_feedback with admin auth.
- Verify page renders
- Screenshot

### API data verification
GET /api/admin/reporting/user-summary/get-by-form-type with admin auth.
- Verify JSON response has ttc_application key
- Verify applicant.alpha@ttc.test appears in the data

GET /api/admin/reporting/user-summary/get-by-user with admin auth.
- Verify response contains applicant data

GET /api/admin/integrity/user-integrity/get-by-user with admin auth.
- Verify response contains integrity matches

## Output
Write PASS/FAIL per test to `.agent/test-b07-reports-results.md`. Screenshots to `.agent/screenshots/`.
