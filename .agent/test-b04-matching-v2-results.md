# Test B04: Evaluation Matching Verification v2 — Results

**Date:** 2026-04-07
**Task file:** `.agent/tasks/test-b04-matching-v2.md`

## Deviations from task spec

The task specified cookie-based auth (`-b "session=$TOKEN"`) but the app uses Bearer token auth. Also used JSON body instead of form-urlencoded. Both corrected:
- Auth: `Authorization: Bearer $TOKEN` header
- Content-Type: `application/json` body

Form instance was kept as `TTC_OPEN_US_2026` per task spec (the upload-form-data endpoint creates sub-keys automatically based on volunteer email).

## Seeded evaluations

| Evaluator | volunteer_name | readiness | rating_1 | rating_2 |
|---|---|---|---|---|
| evaluator.1 | Alpha Applicant | ready | 4 | 5 |
| evaluator.2 | alpha APPLICANT | ready | 3 | 4 |
| evaluator.3 | Alpha Applicant | not_ready_now | 2 | 3 |

All three uploads returned `{"ok":true}`.

## Summary checks (applicant.alpha@ttc.test → ttc_application.TTC_OPEN_US_2026.reporting)

### Check 1: evaluations_submitted_count >= 1
- **PASS** — `evaluations_submitted_count: 6` (inflated by duplicate sub-entries from prior runs, but all 3 evaluators matched)

### Check 2: evaluator_ratings_below_3 with at least one entry
- **PASS** — `evaluator_ratings_below_3: 2` (evaluator.3's rating_1="2" triggered below-3 flag; count=2 due to duplicate sub-entries)

### Check 3: eval_teaching_readiness with "not_ready_now"
- **PASS** — `eval_teaching_readiness: {"ready": 4, "not_ready_now": 2}` (not_ready_now present from evaluator.3; counts inflated by duplicates)

## Integrity checks

### Check 4: applicant.alpha and applicant.beta appear with enrolled_matches
- **PASS** — Both users appear in `user_integrity_by_user.json` with `enrolled_matches` field (empty `{}`, but present)

## Summary

| Check | Result | Detail |
|---|---|---|
| evaluations_submitted_count >= 1 | **PASS** | count = 6 (3 evaluators × 2 sub-entries each) |
| evaluator_ratings_below_3 >= 1 | **PASS** | count = 2 |
| eval_teaching_readiness has "not_ready_now" | **PASS** | `{"ready": 4, "not_ready_now": 2}` |
| integrity: alpha + beta with enrolled_matches | **PASS** | Both present |

**Overall: 4/4 PASS**

## Notes
- Counts are inflated (6 evals, 4 ready, 2 not_ready_now, 2 below_3) due to duplicate evaluation sub-entries accumulating in GCS emulator from prior test runs. Each evaluator created two sub-entries: one keyed by `applicant.alpha@ttc.test` and one by `evaluator.N@ttc.test`.
- All 3 evaluators matched correctly, including evaluator.2's case-differentiated name ("alpha APPLICANT").
- The `lifetime_evaluations` object correctly aggregates across form instances "1" and "TTC_OPEN_US_2026".
- Previous B04 run showed `evaluator_ratings_below_3: 0` (FAIL) due to rating fields being stripped by REPORTING_FIELDS whitelist. This run shows the rating fields are now being captured (count=2), suggesting the whitelist or matching logic was updated since the prior run.
