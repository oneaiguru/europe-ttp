# Task: Evaluation Matching Verification v2 (B04)

## Goal
Verify evaluation matching works with correctly shaped seed data.

## Prerequisites
- Dev server at http://localhost:8009
- GCS emulator at http://localhost:4443
- B00 seed complete (applicant.alpha has ttc_application data)

## Step 1: Seed evaluations with CORRECT field names

The matching algorithm reads these specific fields from evaluation data:
- `i_volunteer_name` — name of the person being evaluated (NOT i_applicant_fname)
- `i_volunteer_email` — comes from the form instance key, not a field
- `i_volunteer_teaching_readiness` — "ready", "not_ready_now", etc.
- `i_volunteer_rating_1`, `i_volunteer_rating_2`, etc. — numeric ratings (rating <= 2 triggers below_3 flag)

Seed 3 evaluations for applicant.alpha by uploading as each evaluator:

**evaluator.1** — exact match:
```bash
TOKEN=$(curl -s -X POST http://localhost:8009/api/auth/login -H "Content-Type: application/json" -d '{"email":"evaluator.1@ttc.test"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
curl -s -X POST http://localhost:8009/users/upload-form-data -b "session=$TOKEN" \
  -d 'form_type=ttc_evaluation&form_instance=TTC_OPEN_US_2026&form_data={"i_volunteer_name":"Alpha Applicant","i_volunteer_email":"applicant.alpha@ttc.test","i_volunteer_teaching_readiness":"ready","i_volunteer_rating_1":"4","i_volunteer_rating_2":"5","i_agreement_accepted":"true","i_form_submitted":"true"}&form_instance_page_data={}&form_instance_display=Eval1'
```

**evaluator.2** — messy match (case difference):
Same pattern but with `i_volunteer_name":"alpha APPLICANT"` (different case)

**evaluator.3** — low rating + not ready:
Same pattern but with `i_volunteer_rating_1":"2"` and `i_volunteer_teaching_readiness":"not_ready_now"`

## Step 2: Run summary job
```bash
curl -s http://localhost:8009/jobs/reporting/user-summary/load -H "x-appengine-cron: true"
```

## Step 3: Read summary data and verify
```bash
curl -s "http://localhost:4443/download/storage/v1/b/artofliving-ttcdesk.appspot.com/o/user_data%2Fsummary%2Fuser_summary_by_user.json?alt=media"
```

Check applicant.alpha@ttc.test in the output:
- Has `evaluations_submitted_count` >= 1 → PASS
- Has `evaluator_ratings_below_3` with at least one entry → PASS  
- Has `eval_teaching_readiness` with "not_ready_now" → PASS

Also check integrity:
```bash
curl -s "http://localhost:4443/download/storage/v1/b/artofliving-ttcdesk.appspot.com/o/user_data%2Fintegrity%2Fuser_integrity_by_user.json?alt=media"
```
- applicant.alpha and applicant.beta appear with enrolled_matches → PASS

## Output
Write PASS/FAIL per check to `.agent/test-b04-matching-v2-results.md`.
