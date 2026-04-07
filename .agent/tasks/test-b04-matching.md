# Task: Evaluation Matching Verification (B04)

## Goal
Verify evaluation matching algorithm: exact match, messy input match, low rating flagging, not-ready-now, unmatched evaluation, lifetime vs current separation.

## Prerequisites
- Seed data from B00 complete (includes 4 evaluators seeded for applicant.alpha)
- Reporting job has run (user_summary_by_user.json exists)

## Tests

Read the summary data from GCS emulator:
```bash
curl -s "http://localhost:4443/download/storage/v1/b/artofliving-ttcdesk.appspot.com/o/user_data%2Fsummary%2Fuser_summary_by_user.json?alt=media"
```

### EVAL-02+03: Current TTC evaluations matched
Check applicant.alpha@ttc.test in summary. Verify:
- evaluations_submitted_count >= 3 (evaluators 1, 2, 3 for current TTC)
- reporting_status contains "complete" (3+ evals threshold met)

### EVAL-04: Lifetime evaluation separate
Verify applicant.alpha has lifetime evaluation count > current count (evaluator.4 on prior TTC).

### EVAL-05: Messy input matching
Verify evaluator.2 (case-different name "alpha APPLICANT") matched to applicant.alpha despite case difference.

### EVAL-06: Low rating flagged
Verify evaluator.3's rating=2 appears in evaluator_ratings_below_3 for applicant.alpha.

### EVAL-07: Not-ready-now
Verify evaluator.3's teaching_readiness=not_ready_now is captured.

### EVAL-08: Integrity cross-match
Read integrity data:
```bash
curl -s "http://localhost:4443/download/storage/v1/b/artofliving-ttcdesk.appspot.com/o/user_data%2Fintegrity%2Fuser_integrity_by_user.json?alt=media"
```
Verify applicant.alpha and applicant.beta are flagged as enrolled_matches (shared "John Doe").

## Output
Write PASS/FAIL per test to `.agent/test-b04-matching-results.md`.
