# Task: Seed Test Data (B00)

## Goal
Seed 16 personas, 5 TTC sessions, and test data relationships into the GCS emulator. Run reporting and integrity jobs. This must complete before any other test bundle.

## Prerequisites
- Dev server running at http://localhost:8009 (with .env.local loaded)
- GCS emulator running at http://localhost:4443

## Step 1: Seed TTC list
Upload the TTC country and dates config to GCS emulator:
```bash
curl -X POST "http://localhost:4443/upload/storage/v1/b/artofliving-ttcdesk.appspot.com/o?uploadType=media&name=config/forms/ttc_country_and_dates.json" \
  -H "Content-Type: application/json" \
  -d '[
    {"value":"TTC_OPEN_US_2026","display":"US TTC June 2026","country":"US","display_countries":["US","CA"]},
    {"value":"TTC_EXPIRED_CA_2026","display":"Canada TTC February 2026","country":"CA","display_countries":["CA"]},
    {"value":"TTC_GRACE_IN_2026","display":"India TTC April 2026","country":"IN","display_countries":["IN"]},
    {"value":"TTC_CLOSED_IN_2026","display":"India TTC January 2026","country":"IN","display_countries":["IN"]},
    {"value":"TTC_PRIOR_EU_2025","display":"Europe TTC August 2025","country":"EU","display_countries":["EU"]}
  ]'
```

## Step 2: Seed admin config
Upload admin config with whitelisted test users:
```bash
curl -X POST "http://localhost:4443/upload/storage/v1/b/artofliving-ttcdesk.appspot.com/o?uploadType=media&name=config/admin_config.json" \
  -H "Content-Type: application/json" \
  -d '{"raw_config":{"i_whitelisted_user":[{"i_whitelisted_user_email":"applicant.gamma@ttc.test"}]},"whitelisted_user_emails":["applicant.gamma@ttc.test"]}'
```

## Step 3: Login all 16 personas and save tokens
POST to /api/auth/login with each email. Save tokens for later use.

Personas:
- superadmin@ttc.test, summaryadmin@ttc.test, outsider@ttc.test
- applicant.alpha@ttc.test, applicant.beta@ttc.test, applicant.gamma@ttc.test, applicant.multi@ttc.test
- evaluator.1@ttc.test through evaluator.4@ttc.test
- graduate.post@ttc.test, teacher.post@ttc.test
- graduate.sahaj@ttc.test, teacher.sahaj@ttc.test
- upload.attacker@ttc.test

## Step 4: Seed applicant data
Use upload-form-data to create application data:

**applicant.alpha** — US, TTC_OPEN_US_2026:
- form_type=ttc_application, form_instance=TTC_OPEN_US_2026
- i_fname=Alpha, i_lname=Applicant, i_email=applicant.alpha@ttc.test
- i_home_country=US, i_agreement_accepted=true, i_form_submitted=true
- i_enrolled_people=[{i_first_name:John, i_last_name:Doe, i_email:john@example.com, i_city:New York, i_state:NY}]
- i_org_courses=[{i_from_date:2026-01-01, i_to_date:2026-01-15, i_city:New York, i_state:NY, i_lead_teacher:Jane Smith}]

**applicant.beta** — CA, share enrolled person "John Doe" with alpha for integrity match:
- form_type=ttc_application, form_instance=TTC_OPEN_US_2026
- i_fname=Beta, i_lname=Applicant, i_email=applicant.beta@ttc.test
- i_enrolled_people=[{i_first_name:John, i_last_name:Doe, i_email:john@example.com, i_city:Toronto, i_state:ON}]

**applicant.alpha prior TTC** — for lifetime evaluation matching:
- form_type=ttc_application, form_instance=TTC_PRIOR_EU_2025
- Same user, previous TTC record

## Step 5: Seed evaluator data
Submit 3 current + 1 lifetime evaluations for applicant.alpha:

**evaluator.1** — perfect match data:
- form_type=ttc_evaluation, form_instance=TTC_OPEN_US_2026
- i_applicant_fname=Alpha, i_applicant_lname=Applicant, i_applicant_email=applicant.alpha@ttc.test
- i_teaching_readiness=ready, i_overall_rating=4

**evaluator.2** — messy but matchable (case difference):
- i_applicant_fname=alpha, i_applicant_lname=APPLICANT, i_applicant_email=Applicant.Alpha@ttc.test
- i_teaching_readiness=ready, i_overall_rating=5

**evaluator.3** — low rating case:
- i_applicant_fname=Alpha, i_applicant_lname=Applicant
- i_teaching_readiness=not_ready_now, i_overall_rating=2

**evaluator.4** — lifetime (prior TTC):
- form_type=ttc_evaluation, form_instance=TTC_PRIOR_EU_2025
- i_applicant_fname=Alpha, i_applicant_lname=Applicant

## Step 6: Seed post-TTC feedback
**graduate.post** — post-TTC self-evaluation:
- form_type=post_ttc_self_evaluation_form, form_instance=TTC_OPEN_US_2026

**teacher.post** — post-TTC teacher feedback (matches graduate.post):
- form_type=post_ttc_feedback_form, form_instance=TTC_OPEN_US_2026
- i_applicant_fname=Post, i_applicant_lname=Graduate

**graduate.sahaj + teacher.sahaj** — same pattern for Sahaj forms.

## Step 7: Run reporting jobs
Use a real admin email for auth (one from LIST_OF_ADMIN_PERMISSIONS in auth-middleware.ts):
```bash
# Login as real admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8009/api/auth/login -H "Content-Type: application/json" -d '{"email":"akshay.ponda@artofliving.org"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Run summary job
curl -s -X GET http://localhost:8009/jobs/reporting/user-summary/load -H "x-appengine-cron: true"

# Run integrity job
curl -s -X GET http://localhost:8009/jobs/integrity/user-integrity/load -H "x-appengine-cron: true"
```

## Step 8: Verify seed
- Check user_summary_by_user.json exists in GCS emulator
- Check user_integrity_by_user.json exists in GCS emulator
- Verify applicant.alpha has evaluations_submitted_count >= 3

## Output
Write results to `.agent/test-b00-seed-results.md`. List all seeded personas with their tokens.
Save the admin token separately — other bundles will need it.

## Constraints
- Do NOT modify source code
- Do NOT commit anything
