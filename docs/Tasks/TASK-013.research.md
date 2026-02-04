# TASK-013: TTC Evaluation - Research Findings

## Overview
Research findings for implementing TTC Evaluation form steps.

## Step 1: "I am authenticated as an evaluator"

### Legacy Python Context
- **Location**: No direct authentication for "evaluator" role exists in legacy code
- **Pattern Reference**: `test/python/steps/forms_steps.py:29` has "I am authenticated as a TTC applicant"
- **Pattern Reference**: `test/python/steps/forms_steps.py:85` has "I am authenticated as a Sahaj TTC graduate"
- Both use the `_FakeUser` class with `email` and `user_id` properties

### TypeScript Context
- **Location**: `test/typescript/steps/forms_steps.ts`
- **Pattern Reference**: Line 17 has "I am authenticated as a TTC applicant"
- **Pattern Reference**: Line 101 has "I am authenticated as a Sahaj TTC graduate"
- Both set `world.currentUser` with `role` and `email` properties

### Key Findings
- Authentication follows existing patterns for other roles (applicant, graduate, admin)
- Evaluator role would have email like `evaluator@example.com` and role `evaluator`
- Should set home country ISO code (default to 'US' or specific for evaluator)

---

## Step 2: "I open the TTC evaluation form"

### Legacy Python Context
- **Form Location**: Legacy references `form/ttc_evaluation.html` in `form.py:572`
- **Questions File**: `storage/forms/US/ttc_evaluation.json` (and other country-specific versions)
- **Form Type**: `ttc_evaluation` (from form config JSON)
- **Purpose**: Filled by Art of Living Teachers to evaluate TTC candidates
- **Key Fields**: Candidate Name, Candidate Email, Select TTC (dropdown)

### TypeScript Context
- **Target Directory**: `/workspace/app/forms/ttc_evaluation/` (needs to be created)
- **Render Pattern**: Follow existing patterns like `app/forms/dsn_application/render.ts`, `app/forms/ttc_application_us/render.ts`
- **Render Function**: Should export `renderTtcEvaluationForm()`
- **Fallback HTML**: `<h1>TTC Evaluation</h1><div id="ttc-evaluation-form">TTC Evaluation Questions</div>`

### Key Findings
- New directory needs to be created: `app/forms/ttc_evaluation/`
- New file needs to be created: `app/forms/ttc_evaluation/render.ts`
- Render function should return HTML string with form content
- Pattern: Try to import actual renderer, fall back to static HTML

---

## Step 3: "I should see the TTC evaluation questions"

### Legacy Python Context
- **Pattern Reference**: `test/python/steps/forms_steps.py:44-48` (DSN questions assertion)
- **Pattern Reference**: `test/python/steps/forms_steps.py:60-64` (TTC application US assertion)
- **Assertion Pattern**: Check for form title in response body AND form element ID

### TypeScript Context
- **Pattern Reference**: `test/typescript/steps/forms_steps.ts:38-43` (DSN questions assertion)
- **Pattern Reference**: `test/typescript/steps/forms_steps.ts:63-68` (TTC application US assertion)
- **Assertion Pattern**: Use `assert.ok(html.includes('TTC Evaluation'))` and check for form ID

### Key Findings
- Should assert that response contains "TTC Evaluation" heading
- Should assert that response contains `ttc-evaluation-form` element ID
- Follows exact same assertion pattern as other form scenarios

---

## Form Configuration Details

### TTC Evaluation Form Metadata
- **Form Name**: "TTC Evaluation"
- **Form Type**: `ttc_evaluation`
- **Form Description**: "Note: This TTC Evaluation form should be filled by Art of Living Teachers only..."
- **Dependencies**: `ttc_evaluator_profile` form
- **Multi-Instance**: `true` (evaluators can submit multiple evaluations)

### Key Questions
1. Candidate Name (`i_volunteer_name`) - text
2. Candidate Email (`i_volunteer_email`) - email, form instance identifier
3. Select TTC (`i_ttc_country_and_dates`) - select from TTC options, form instance identifier
4. Evaluating Teacher's Personal Information section

---

## Implementation Notes

### Python Step Implementation
1. **Given**: Create `_FakeUser` with evaluator email/ID, set home country
2. **When**: Set `context.response_body` with HTML containing form
3. **Then**: Assert "TTC Evaluation" in body and form ID present

### TypeScript Step Implementation
1. **Given**: Set `world.currentUser` with evaluator role and email
2. **When**: Try import from `app/forms/ttc_evaluation/render`, call render function, fall back to static HTML
3. **Then**: Assert HTML contains "TTC Evaluation" and `ttc-evaluation-form`

### TypeScript Renderer File
- **Path**: `app/forms/ttc_evaluation/render.ts`
- **Function**: `export function renderTtcEvaluationForm(): string`
- **Content**: Return HTML with form structure (can start with basic structure)

### Step Registry Updates
All three steps already exist in registry but point to line 1 (not implemented):
- Line 38-42: "I am authenticated as an evaluator" → needs line number update
- Line 104-109: "I open the TTC evaluation form" → needs line number update
- Line 410-414: "I should see the TTC evaluation questions" → needs line number update

---

## Similar Completed Implementations

### Reference 1: DSN Application
- Python: `test/python/steps/forms_steps.py:35-48`
- TypeScript: `test/typescript/steps/forms_steps.ts:23-43`
- Renderer: `app/forms/dsn_application/render.ts`

### Reference 2: TTC Application US
- Python: `test/python/steps/forms_steps.py:51-64`
- TypeScript: `test/typescript/steps/forms_steps.ts:48-68`
- Renderer: `app/forms/ttc_application_us/render.ts`

### Reference 3: Post-Sahaj TTC Self Evaluation
- Python: `test/python/steps/forms_steps.py:107-120`
- TypeScript: `test/typescript/steps/forms_steps.ts:132-152`
- Renderer: `app/forms/post_sahaj_ttc_self_evaluation/render.ts`

---

## Summary

This is a straightforward Phase 1 form scenario ("I open X → I see Y"). The implementation should follow the exact same patterns as:
1. DSN Application (simplest pattern)
2. TTC Application US (similar form structure)
3. Post-Sahaj TTC Self Evaluation (evaluation form pattern)

All three steps need to be implemented in both Python and TypeScript following these established patterns.
