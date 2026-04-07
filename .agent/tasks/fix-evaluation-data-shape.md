# Task: Fix Evaluation Data Shape Mismatch

## Goal
The evaluation matching algorithm in `user-summary.ts` iterates evaluation data expecting entries nested by evaluator email, but `upload-form-data` stores evaluation data flat. Fix so matching works with data as uploaded.

## Context
The matching loop at `user-summary.ts:297` does:
```
for (const ve of Object.keys(ttcEvalFi)) {  // expects ve = evaluator email
  const e = ttcEvalFi[ve];                   // expects e = {data: {...}, ...}
  const ed = e['data'];                      // reads i_volunteer_name from data
```

But the actual stored structure (from upload-form-data) is:
```
ttc_evaluation -> TTC_OPEN_US_2026 -> {
  data: { i_volunteer_name: "...", ... },
  form_instance_display: "...",
  is_form_submitted: true,
  ...
}
```

The keys of `ttcEvalFi` are `data`, `form_instance_display`, etc. — NOT evaluator emails.

## Read These Files First
1. `/Users/m/ttp-split-experiment/app/utils/reporting/user-summary.ts` (lines 290-310) — the matching loop
2. `/Users/m/Downloads/europe-ttp-master@44c225683f8/reporting/user_summary.py` (lines 298-380) — how Python does it
3. `/Users/m/Downloads/europe-ttp-master@44c225683f8/ttc_portal_user.py` (lines 36-88) — how Python stores form data
4. `/Users/m/ttp-split-experiment/app/utils/ttc-portal-user.ts` — how TS stores form data
5. Check GCS emulator for actual stored shape: `curl -s "http://localhost:4443/download/storage/v1/b/artofliving-ttcdesk.appspot.com/o/user_data%2Fevaluator.1%40ttc.test.json?alt=media"`

## What to Fix
Compare how Python stores evaluation data vs how TS stores it. The issue is one of:

A) The TS upload stores data flat but should nest by email (fix TTCPortalUser.setFormData)
B) The matching loop should read flat data structure instead of expecting nested (fix user-summary.ts)
C) Both need adjustment

Read the Python source to determine the correct data shape. Port EXACTLY — don't invent a new structure.

## Verification
- `npx tsc --noEmit` must pass
- After fix: re-seed evaluations, re-run summary job, verify `evaluations_submitted_count >= 3` for applicant.alpha
- Verify `is_reporting_matched: "Y"` on evaluation entries

## Constraints
- Do NOT change the matching algorithm logic — only fix the data access pattern
- Do NOT break existing seeded data for other tests
- Port the Python storage/access pattern exactly

## Commit
`fix: align evaluation data storage with matching algorithm expectations`
