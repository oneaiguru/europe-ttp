# B04 Evaluation Matching Verification

**Date:** 2026-04-07
**Summary job re-run:** SUCCESS (OK response)
**Integrity job:** Not re-run (using B00 data)

## Root Cause: Seed Data Structure Mismatch

The evaluation matching algorithm (`user-summary.ts:289-503`) expects evaluation data nested as:
```
ttc_evaluation -> TTC_INSTANCE_KEY -> APPLICANT_IDENTIFIER -> { data, ... }
```

Only evaluator.1 has this structure (`ttc_evaluation."applicant.alpha@ttc.test-1"."applicant.alpha@ttc.test".data`).
Evaluators 2-4 have flat data directly under the TTC instance key:
```
ttc_evaluation -> TTC_INSTANCE_KEY -> { data: { i_applicant_fname, ... }, ... }
```

This means the inner loop (`for (const ve of Object.keys(ttcEvalFi))`) iterates over "data", "form_instance_display", etc. instead of an applicant email/name key, so no match is possible.

## Test Results

| Test | Description | Expected | Actual | Result |
|------|-------------|----------|--------|--------|
| EVAL-02+03 | Current TTC evaluations matched (evaluators 1,2,3) | evaluations_submitted_count >= 3 for current TTC | 1 (only evaluator.1 on TTC "1") | **FAIL** |
| EVAL-04 | Lifetime evaluation separate (evaluator.4 on prior TTC) | lifetime_evaluations_submitted_count > current count | lifetime=1, current=1 (same) | **FAIL** |
| EVAL-05 | Messy input matching (evaluator.2: "alpha APPLICANT") | evaluator.2 matched via case-insensitive name | evaluator.2 is_reporting_matched="N" | **FAIL** |
| EVAL-06 | Low rating flagged (evaluator.3: rating=2) | evaluator_ratings_below_3 >= 1 | evaluator_ratings_below_3=0 | **FAIL** |
| EVAL-07 | Not-ready-now (evaluator.3: teaching_readiness=not_ready_now) | eval_teaching_readiness_not_ready_now_count >= 1 | eval_teaching_readiness_not_ready_now_count=0 | **FAIL** |
| EVAL-08 | Integrity cross-match (alpha+beta share "John Doe") | enrolled_matches contains both users | enrolled_matches={} for both | **FAIL** |

## Detailed Evidence

### EVAL-02+03
```
applicant.alpha TTC "1": evals_submitted=1, evals={"evaluator.1@ttc.test": {"applicant.alpha@ttc.test": ""}}
applicant.alpha TTC "TTC_OPEN_US_2026": evals_submitted=0, evals={}
applicant.alpha TTC "TTC_PRIOR_EU_2025": evals_submitted=0, evals={}
Lifetime: evals_submitted=1
```

### EVAL-04
```
lifetime_evaluations_submitted_count=1 (same as current, no evaluator.4 captured)
lifetime_evaluations={"1": {"evaluator.1@ttc.test": {...}}} (only TTC "1" instance)
```

### EVAL-05
```
evaluator.2@ttc.test: is_reporting_matched="N"
Raw data uses i_applicant_fname="alpha", i_applicant_lname="APPLICANT" but these fields are never reached
because the nested applicant-key structure is missing.
```

### EVAL-06
```
evaluator_ratings_below_3=0 on all TTC instances
evaluator.3 has i_overall_rating="2" but matching code checks i_volunteer_rating_* fields,
and the evaluation is never matched so this field is never examined.
```

### EVAL-07
```
eval_teaching_readiness_not_ready_now_count=0 on all TTC instances
evaluator.3 has i_teaching_readiness="not_ready_now" but field name mismatch:
  - Seed uses i_teaching_readiness
  - Matching code checks i_volunteer_teaching_readiness (line 443)
```

### EVAL-08
```
applicant.alpha@ttc.test integrity: enrolled_matches={}, org_course_matches={}
applicant.beta@ttc.test integrity: enrolled_matches={}, org_course_matches={}
Both have John Doe (john@example.com) enrolled but integrity matching failed.
```

## Diagnosis Summary

1. **Seed data structure bug**: Evaluators 2-4 were seeded without the nested `APPLICANT_EMAIL -> { data }` structure the matching algorithm requires. Only evaluator.1 has the correct structure (form instance `applicant.alpha@ttc.test-1` containing key `applicant.alpha@ttc.test`).

2. **Field name mismatch**: Seed uses `i_teaching_readiness` but matching code (line 443) reads `i_volunteer_teaching_readiness`. Seed uses `i_overall_rating` but matching code (line 470) checks `i_volunteer_rating_*` prefix. These field names don't match the form schema the matching algorithm expects.

3. **Integrity matching**: The integrity job may also have matching issues, or the shared "John Doe" enrollment data may not be structured as expected.

## Recommendation

Fix the B00 seed script to:
1. Nest evaluator 2-4 data under applicant identifier keys (e.g., `"applicant.alpha@ttc.test": { data: {...} }`)
2. Use correct field names matching the form schema (`i_volunteer_teaching_readiness`, `i_volunteer_rating_*`)
3. Verify integrity enrollment matching logic accepts the seeded structure
