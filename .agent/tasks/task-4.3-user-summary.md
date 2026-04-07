# Task: Port User Summary Aggregation

## Goal
Port the user summary cron job from Python to TypeScript — the most complex module in the system. Reads all user data from GCS, matches evaluations to applicants using Levenshtein + name decomposition, computes reporting status, and writes aggregated summary files.

## Read These Files First
1. `/Users/m/Downloads/europe-ttp-master@44c225683f8/reporting/user_summary.py` (full file, ~750 lines) — the source to port
2. `/Users/m/ttp-split-experiment/app/utils/reporting/reporting-utils.ts` — `getReportingStatus()`, `getTtcList()` (created in Task 4.1)
3. `/Users/m/ttp-split-experiment/app/utils/reporting/matching.ts` — `levenshteinB()` (created in Task 4.2)
4. `/Users/m/ttp-split-experiment/app/utils/ttc-portal-user.ts` — user data model
5. `/Users/m/ttp-split-experiment/app/utils/gcs.ts` — `readJson()`, `writeJson()`, `listFiles()`, `GCS_PATHS`
6. `/Users/m/ttp-split-experiment/app/api/admin/mock-data.ts` — `MOCK_SUMMARY_DATA` and `MOCK_REPORTS_DATA` shapes (these are the output format to match)

## Changes Required

**Create `app/utils/reporting/user-summary.ts`:**

Port `Reporting.load_user_summary()` as `async function loadUserSummary()`.

**High-level steps (matching Python structure):**

1. Read TTC list from GCS
2. Load existing summary from GCS (or empty dict if not found)
3. List all user JSON files in `user_data/` prefix
4. For each user file:
   - Parse JSON, iterate form_data by form_type and form_instance
   - Skip `default` instances
   - Apply `reporting_fields` whitelist (Python lines 76-116)
   - Calculate initial reporting_status via `getReportingStatus()`
   - Count prereq_no answers, list lengths
   - Attach TTC metadata
   - Parse form_instance key for email extraction (Python lines 223-235)
   - Build nested structure: `_user_data_by_email[email][form_type][instance]`
5. KEYRESET: Clear past evaluation assignments (Python lines 252-293)
6. Evaluation matching — O(n²) loop (Python lines 298-525):
   - For each `ttc_evaluation`, try to match to a `ttc_application` user
   - Match criteria: email exact match OR name Levenshtein ≤ 1 with multi-word decomposition
   - On match: add to `evaluations` dict, update counts, check teaching_readiness, ratings_below_3
   - Track both current-TTC and lifetime evaluations separately
7. Post-TTC feedback matching (Python lines 528-650):
   - Similar to #6 but matches `post_ttc_feedback_form` to `post_ttc_self_evaluation_form`
   - Levenshtein threshold = 2 (more lenient)
   - Also matches by `i_course_start` date
8. Post-Sahaj feedback matching (Python lines 650+):
   - Same pattern as #7 for Sahaj forms
9. Write output files:
   - `user_summary_by_user.json` — the full aggregated data
   - `user_summary_by_form_type.json` — **intentional divergence**: legacy only writes `_by_user`, but TS also writes `_by_form_type` because the summary page JS needs it

**Also create route handlers:**
- `app/reporting/user-summary/load/route.ts` — GET: `requireAdminOrCron()`, POST: `requireAdmin()`
- `app/jobs/reporting/user-summary/load/route.ts` — same auth, alias
- `app/reporting/user-summary/get-by-user/route.ts` — GET: `requireAdminOrCron()`, reads `USER_SUMMARY_BY_USER`

## Constraints
- Port logic EXACTLY — do not optimize the O(n²) matching loop
- Do NOT add `_by_form_type` generation logic that wasn't in the original — instead, transform `_by_user` into `_by_form_type` by restructuring the same data (invert the key hierarchy)
- Keep `text/plain` content-type on get-by-user response
- `DATA_RETENTION_DAYS = 730` (from constants.py line 66) — skip records older than this

## Verification
- `npx tsc --noEmit` must pass

## Completion
- Commit with message: `feat: port user summary aggregation with evaluation matching`
- Report: files changed, verification result
