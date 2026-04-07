# Test B04: Evaluation Matching Verification v2 — Results

**Date:** 2026-04-07
**Task file:** `.agent/tasks/test-b04-matching-v2.md`

## Deviations from task spec

The task specified `form_instance=TTC_OPEN_US_2026` but the matching algorithm requires the volunteer email to be embedded in the form instance key (e.g., `applicant.alpha@ttc.test-TTC_OPEN_US_2026`) because `ve` (the sub-key under the form instance) is used as the volunteer identifier in match criteria. The original task curl also used cookie auth (`-b "session=$TOKEN"`) but the Next.js app uses Bearer token auth. Both were corrected:

- Auth: `Bearer $TOKEN` via `Authorization` header (instead of cookie)
- Form instance: `applicant.alpha@ttc.test-TTC_OPEN_US_2026` (instead of `TTC_OPEN_US_2026`)
- Content-Type: `application/json` body (instead of form-urlencoded)

## Seeded evaluations

| Evaluator | Form instance | volunteer_name | readiness | rating_1 | rating_2 |
|---|---|---|---|---|---|
| evaluator.1 | `applicant.alpha@ttc.test-TTC_OPEN_US_2026` | Alpha Applicant | ready | 4 | 5 |
| evaluator.2 | `applicant.alpha@ttc.test-TTC_OPEN_US_2026` | alpha APPLICANT | ready | 3 | 4 |
| evaluator.3 | `applicant.alpha@ttc.test-TTC_OPEN_US_2026` | Alpha Applicant | not_ready_now | 2 | 3 |

## Summary checks (applicant.alpha@ttc.test → ttc_application.TTC_OPEN_US_2026.reporting)

### Check 1: evaluations_submitted_count >= 1
- **PASS** — `evaluations_submitted_count: 3`
- All 3 evaluators matched via `ve.toLowerCase() === c.toLowerCase()` (email match)

### Check 2: evaluator_ratings_below_3 with at least one entry
- **FAIL** — `evaluator_ratings_below_3: 0`
- evaluator.3 submitted `i_volunteer_rating_1: "2"` (should trigger below_3 flag)
- Root cause: `i_volunteer_rating_*` fields are NOT in the `REPORTING_FIELDS` whitelist in `app/utils/reporting/user-summary.ts` (lines 40-56). The whitelist filtering (lines 153-168) strips these fields from `fd['data']` before the matching loop processes them, so `ed['i_volunteer_rating_1']` is `undefined` at match time.

### Check 3: eval_teaching_readiness with "not_ready_now"
- **PASS** — `eval_teaching_readiness: {"ready": 2, "not_ready_now": 1}`
- evaluator.3's `i_volunteer_teaching_readiness: "not_ready_now"` was correctly recorded

## Integrity checks

### Check 4: applicant.alpha and applicant.beta appear with enrolled_matches
- **PASS** — Both users appear in `user_integrity_by_user.json` with `enrolled_matches` field (empty `{}`, but present)

## Summary

| Check | Result | Detail |
|---|---|---|
| evaluations_submitted_count >= 1 | **PASS** | count = 3 |
| evaluator_ratings_below_3 >= 1 | **FAIL** | count = 0 (rating fields stripped by whitelist) |
| eval_teaching_readiness has "not_ready_now" | **PASS** | `{"ready": 2, "not_ready_now": 1}` |
| integrity: alpha + beta with enrolled_matches | **PASS** | Both present |

**Overall: 3/4 PASS**

## Bugs found

1. **REPORTING_FIELDS whitelist missing rating fields** — `i_volunteer_rating_*` fields are not in the whitelist at `app/utils/reporting/user-summary.ts:40-56`, causing them to be stripped before the matching loop can count below-3 ratings. Fix: add rating fields to whitelist, or read ratings from the unfiltered source data before the whitelist filtering step.

2. **Task spec: form_instance must contain volunteer email** — The task's curl commands used `form_instance=TTC_OPEN_US_2026` but matching requires the email in the key (e.g., `volunteer_email-form_instance`). The `i_volunteer_email` field in form_data is not used for matching — only `ve` (the sub-key extracted from the form instance) is compared against applicant emails.
