# TASK-017: Research - Post-TTC Feedback

## Task Information
- **Task ID**: TASK-017
- **Feature File**: `specs/features/forms/post_ttc_feedback.feature`
- **Research Date**: 2026-02-04

---

## 1. Legacy Python Implementation

### Form Configuration Location
- **File**: `form.py:580-581`
- **Form Type**: `post_ttc_feedback_form`
- **Form Object**: `form/post_ttc_feedback_form.html`
- **Config File Pattern**: `constants.FORM_CONFIG_LOCATION + user_home_country_iso + '/post_ttc_feedback_form.json'`

### Form Configuration Files
The form configuration exists in multiple country variants:
- `storage/forms/US/post_ttc_feedback_form.json`
- `storage/forms/CA/post_ttc_feedback_form.json`
- `storage/forms/IN/post_ttc_feedback_form.json`

### Form Details (from US config)
- **Form Name**: "TTC Graduate feedback from Co-Teacher"
- **Form Description**: "Note: This co-teacher evaluation form is for teachers to evaluate TTC graduates while fulfilling their co-teaching requirement"
- **Multi-instance Form**: `true` (can be submitted multiple times)
- **Key Identifiers**:
  - `i_ttc_graduate_email` - form instance identifier
  - `i_course_start` - form instance identifier
  - `i_course_end` - course end date
  - `i_course_city` - course city
  - `i_course_format` - course format (hp_3_day_format, yesplus, other)

### Questions Pages
1. **Course Information** - Graduate details, course dates/location
2. **Your Personal Information** - Evaluator's contact info
3. **Co-Teaching Experience** - Ratings and feedback on multiple criteria

---

## 2. Existing TypeScript Context

### Similar Forms Already Implemented
The codebase already has TypeScript implementations for similar post-TTC forms:

1. **post_ttc_self_evaluation** - Fully implemented
   - Python step: `test/python/steps/forms_steps.py:183-189`
   - TypeScript step: `test/typescript/steps/forms_steps.ts:244-257`
   - Render module: `app/forms/post_ttc_self_evaluation/render.ts`

2. **post_sahaj_ttc_feedback** - Fully implemented
   - Python step: `test/python/steps/forms_steps.py:73-81`
   - TypeScript step: `test/typescript/steps/forms_steps.ts:79-94`

### Pattern to Follow

The existing `post_ttc_self_evaluation` form shows the pattern:

**Python Step Pattern** (`test/python/steps/forms_steps.py:183-189`):
```python
@when('I open the post-TTC self evaluation form')
def step_open_post_ttc_self_evaluation_form(context):
    body = (
        '<h1>Post-TTC Self Evaluation</h1>'
        '<div id="post-ttc-self-evaluation-form">post_ttc_self_evaluation_form</div>'
    )
    context.response_body = body
```

**TypeScript Step Pattern** (`test/typescript/steps/forms_steps.ts:244-257`):
```typescript
When('I open the post-TTC self evaluation form', async function () {
  const world = getWorld(this);

  try {
    const module = await import('../../../app/forms/post_ttc_self_evaluation/render');
    if (typeof module.renderPostTtcSelfEvaluationForm === 'function') {
      world.responseHtml = module.renderPostTtcSelfEvaluationForm();
    } else {
      world.responseHtml = POST_TTC_SELF_EVALUATION_FALLBACK_HTML;
    }
  } catch {
    world.responseHtml = POST_TTC_SELF_EVALUATION_FALLBACK_HTML;
  }
});
```

**Render Module Pattern** (`app/forms/post_ttc_self_evaluation/render.ts`):
```typescript
export function renderPostTtcSelfEvaluationForm(): string {
  return (
    '<h1>Post-TTC Self Evaluation</h1>' +
    '<div id="post-ttc-self-evaluation-form">post_ttc_self_evaluation_form</div>'
  );
}
```

---

## 3. Step Registry Status

From `test/bdd/step-registry.ts`:

### Step: "I open the post-TTC feedback form"
- **Pattern**: `/^I\ open\ the\ post\-TTC\ feedback\ form$/`
- **Current Python Path**: `test/python/steps/forms_steps.py:1` (PLACEHOLDER - needs update)
- **Current TypeScript Path**: `test/typescript/steps/forms_steps.ts:1` (PLACEHOLDER - needs update)
- **Features**: `specs/features/forms/post_ttc_feedback.feature:9`

### Step: "I should see the post-TTC feedback questions"
- **Pattern**: `/^I\ should\ see\ the\ post\-TTC\ feedback\ questions$/`
- **Current Python Path**: `test/python/steps/forms_steps.py:1` (PLACEHOLDER - needs update)
- **Current TypeScript Path**: `test/typescript/steps/forms_steps.ts:1` (PLACEHOLDER - needs update)
- **Features**: `specs/features/forms/post_ttc_feedback.feature:10`

### Already Implemented Step
- **"I am authenticated as a TTC graduate"**: ✅ Already in registry
  - Python: `test/python/steps/forms_steps.py:178`
  - TypeScript: `test/typescript/steps/forms_steps.ts:238`

---

## 4. Implementation Notes

### For Python Steps
Add to `test/python/steps/forms_steps.py`:

1. **"I open the post-TTC feedback form"**
   - Follow pattern from `step_open_post_ttc_self_evaluation_form` (lines 183-189)
   - Create mock HTML response with:
     - Heading: "Post-TTC Feedback" or similar
     - Div with id: `post-ttc-feedback-form`
     - Content: `post_ttc_feedback_form`

2. **"I should see the post-TTC feedback questions"**
   - Follow pattern from `step_see_post_ttc_self_evaluation_questions` (lines 192-196)
   - Assert heading text is present
   - Assert form div id is present

### For TypeScript Implementation
Create directory: `app/forms/post_ttc_feedback/`

1. **Create `app/forms/post_ttc_feedback/render.ts`**
   - Follow pattern from `post_ttc_self_evaluation/render.ts`
   - Export function `renderPostTtcFeedbackForm()`
   - Return HTML string with heading and form div

2. **Add to `test/typescript/steps/forms_steps.ts`**
   - Follow pattern from lines 244-264 (post-TTC self evaluation)
   - Add fallback HTML constant
   - Implement When step that tries to import render module
   - Implement Then step that asserts HTML content

### Key Identifiers to Match
Based on the form config, ensure the mock HTML contains:
- **Heading**: "TTC Graduate feedback from Co-Teacher" or "Post-TTC Feedback"
- **Form Div ID**: `post-ttc-feedback-form` (kebab-case, following the pattern)
- **Form Type Reference**: `post_ttc_feedback_form` (snake_case, as in config)

---

## 5. Verification Requirements

After implementation, verify:

1. **Python BDD Test**:
   ```bash
   bun scripts/bdd/run-python.ts specs/features/forms/post_ttc_feedback.feature
   ```

2. **TypeScript BDD Test**:
   ```bash
   bun scripts/bdd/run-typescript.ts specs/features/forms/post_ttc_feedback.feature
   ```

3. **Step Registry Alignment**:
   ```bash
   bun scripts/bdd/verify-alignment.ts
   ```
   Must show: 0 orphan steps, 0 dead steps

---

## Summary

**What needs to be implemented:**
1. Python step definition for opening the form (mock response)
2. Python step definition for verifying questions (assertions)
3. TypeScript render module in `app/forms/post_ttc_feedback/render.ts`
4. TypeScript step definitions with fallback pattern

**Key locations:**
- Legacy config: `storage/forms/US/post_ttc_feedback_form.json`
- Python steps: `test/python/steps/forms_steps.py` (add after line 196)
- TypeScript steps: `test/typescript/steps/forms_steps.ts` (add after line 264)
- TypeScript render: `app/forms/post_ttc_feedback/render.ts` (new file)

**Pattern to follow:**
- Use `post_ttc_self_evaluation` as the reference implementation
- Mock HTML with heading and form div
- Fallback pattern for TypeScript (try import, catch returns fallback HTML)
