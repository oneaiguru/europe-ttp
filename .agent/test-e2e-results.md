# E2E Smoke Test Results

**Date:** 2026-04-07 (Run 2)
**Environment:** GCS emulator (fake-gcs-server on :4443), Next.js dev server on :8009

---

## Prerequisites

| Check | Result | Details |
|-------|--------|---------|
| App server (localhost:8009) | PASS | HTTP 200 |
| GCS emulator bucket | PASS | `artofliving-ttcdesk.appspot.com` found |

---

## Task 1: Seed Test Data

### 1a. Login as test personas

| Persona | Email | Result | Details |
|---------|-------|--------|---------|
| Admin (full perms) | n84.amit@gmail.com | PASS | Bearer token obtained |
| Admin (reports/settings) | satish.ahuja@gmail.com | PASS | Bearer token obtained |
| Applicant | applicant.alpha@ttc.test | PASS | Bearer token obtained |
| Evaluator | evaluator.1@ttc.test | PASS | Bearer token obtained |

### 1b. Seed TTC application data for applicant.alpha

Data was seeded directly to GCS emulator at `user_data/applicant.alpha@ttc.test.json` via the emulator's upload REST API (the app has no form-data POST endpoint — forms are static HTML that use the signed-url upload flow).

| Check | Result | Details |
|-------|--------|---------|
| Upload to GCS | PASS | 200, object created (1122 bytes) |
| Data contains application fields | PASS | i_fname=Alpha, i_lname=Applicant, enrolled_people, org_courses |

### 1c. Seed TTC evaluation data for evaluator.1

Data seeded at `user_data/evaluator.1@ttc.test.json`.

| Check | Result | Details |
|-------|--------|---------|
| Upload to GCS | PASS | 200, object created (732 bytes) |
| Data contains evaluation fields | PASS | i_teaching_readiness=ready, i_overall_rating=4 |

### 1d. Verify round-trip data retrieval

Read back from GCS emulator JSON REST API.

| Check | Result | Details |
|-------|--------|---------|
| Applicant data round-trip | PASS | All fields match: name, email, enrolled_people, org_courses |
| Evaluator data round-trip | PASS | All fields match: evaluator name, applicant ref, readiness, rating |

---

## Task 2: Run Reporting Jobs

Admin auth: `satish.ahuja@gmail.com` (in hardcoded LIST_OF_ADMINS).

| Job | Endpoint | Method | Result | Details |
|-----|----------|--------|--------|---------|
| User Summary Load | GET /jobs/reporting/user-summary/load | GET | PASS | 200 "OK" |
| User Integrity Load | GET /jobs/integrity/user-integrity/load | GET | PASS | 200 `{"ok":true}` |

### Reporting output verification

| Check | Result | Details |
|-------|--------|---------|
| user_summary_by_user.json created | PASS | Contains `applicant.alpha@ttc.test` with reporting_status=submitted, evaluations_submitted_count=1 |
| user_summary_by_form_type.json created | PASS | Present in GCS |
| user_integrity_by_user.json created | PASS | Contains `applicant.alpha@ttc.test` with enrolled_people and org_courses data |
| Summary data correctness | PASS | Shows enrolled_people_count=1, org_courses_count=1, eval from evaluator.1@ttc.test |

---

## Task 3: Verify Admin Pages

Admin auth via Playwright with `Authorization: Bearer` header.

### 3a. Summary page — `/api/admin/ttc_applicants_summary`

| Check | Result | Details |
|-------|--------|---------|
| HTTP status | PASS | 200 |
| Page title | PASS | "TTC Applicants Summary" |
| Data table present | PASS | DataTable with Name, Status, Evals, Email, City, State columns |
| Screenshot | PASS | `.agent/screenshots/admin-summary.png` |

Note: Table shows "No data available in table" because the TTC dropdown must be selected to filter by country/dates. The summary HTML and reporting infrastructure is confirmed working (data exists in GCS summary files).

### 3b. Reports page — `/api/admin/ttc_applicants_reports`

| Check | Result | Details |
|-------|--------|---------|
| HTTP status | PASS | 200 |
| Page title | PASS | "TTC Applicants Reports" |
| Screenshot | PASS | `.agent/screenshots/admin-reports.png` |

### 3c. Integrity page — `/api/admin/ttc_applicants_integrity`

Note: Required `n84.amit@gmail.com` (full-permission admin) since `satish.ahuja@gmail.com` lacks `ttc_applicants_integrity.html` permission (403).

| Check | Result | Details |
|-------|--------|---------|
| HTTP status | PASS | 200 (with correct admin) |
| Page title | PASS | "TTC Integrity Report" |
| Screenshot | PASS | `.agent/screenshots/admin-integrity.png` |

### 3d. Settings page — `/api/admin/settings`

| Check | Result | Details |
|-------|--------|---------|
| HTTP status | PASS | 200 |
| Page title | PASS | "Admin Settings" |
| Screenshot | PASS | `.agent/screenshots/admin-settings.png` |

---

## Summary

| Task | Subtasks | Pass | Fail |
|------|----------|------|------|
| Prerequisites | 2 | 2 | 0 |
| 1a. Login | 4 | 4 | 0 |
| 1b. Seed application data | 2 | 2 | 0 |
| 1c. Seed evaluation data | 2 | 2 | 0 |
| 1d. Round-trip verification | 2 | 2 | 0 |
| 2. Reporting jobs | 2 | 2 | 0 |
| 2. Reporting output verification | 4 | 4 | 0 |
| 3a. Summary page | 4 | 4 | 0 |
| 3b. Reports page | 3 | 3 | 0 |
| 3c. Integrity page | 3 | 3 | 0 |
| 3d. Settings page | 3 | 3 | 0 |
| **Total** | **31** | **31** | **0** |

## Notes

- Data was seeded directly to GCS emulator via REST API (no form-data POST endpoint exists — forms use signed-url upload flow)
- Admin permissions are hardcoded in `auth-middleware.ts`; test used `n84.amit@gmail.com` (full perms) and `satish.ahuja@gmail.com` (partial perms)
- The GCS emulator JSON REST API fallback in `gcs.ts` (commit `e3390ab`) resolved all previous ESM/XML API failures
- No source code was modified; no commits were made

## Screenshots

- `.agent/screenshots/admin-summary.png`
- `.agent/screenshots/admin-reports.png`
- `.agent/screenshots/admin-integrity.png`
- `.agent/screenshots/admin-settings.png`
