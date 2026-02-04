# TASK-015: TTC Evaluator Profile Form - Research

## Task Information
- **Task ID**: TASK-015
- **Feature File**: `specs/features/forms/ttc_evaluator_profile.feature`
- **Date**: 2026-02-04

## Research Findings

### 1. Python Implementation (Legacy)

#### Form Configuration Location
- **File**: `/workspace/storage/forms/US/ttc_evaluator_profile.json`
- **Form Type**: `ttc_evaluator_profile`
- **Form Name**: "TTC Evaluator Profile"

#### Form Structure
The form configuration contains:
- **Description**: "Note: This profile information needs to be filled by Art of Living Teachers only. Please answer all questions truthfully and with detail and clarity. Your responses will remain confidential and will only be reviewed by the TTC Trainers and the TTC desk team."
- **Page**: "Evaluating Teacher's Personal Information"
- **Questions**:
  1. `i_name` - Name (First and Last) [text]
  2. `i_email_aol` - Email Address (artofliving.org) [text]
  3. `i_primaryphone` - Primary Phone Number [text]
  4. `i_teaching_cities` - City/Cities where you teach [textarea]
  5. `i_teaching_start_date` - Date you began teaching (month/year) [text]
  6. `i_taught_count` - Header: "Please state the number of courses that you have taught in the last 3 years" [header]
  7. `i_taught_count_newformat` - Art of Living Course/ Yesplus Course (new 5-day format) [text]
  8. `i_taught_count_oldformat` - Art of Living Course/ Yesplus Course (old format) [text]
  9. `i_taught_count_sahaj` - Sahaj Samadhi Meditation Course [text]
  10. `i_taught_count_other` - Other [text]

#### Legacy Code References
- **form.py:576-577**: Defines the questions_file path for `form/ttc_evaluator_profile.html`
  ```python
  elif obj == "form/ttc_evaluator_profile.html":
      questions_file = constants.FORM_CONFIG_LOCATION + user_home_country_iso + '/ttc_evaluator_profile.json'
  ```

- **form.py:238**: `evaluator_profile_data` dictionary in TTCPortalUser class
- **form.py:249-250**: `set_evaluator_profile_data()` method
- **form.py:313**: Loads `evaluator_profile_data` from user object

### 2. TypeScript Implementation Context

#### Existing Pattern
The existing forms follow this pattern:
- **Directory**: `/workspace/app/forms/{form_name}/`
- **File**: `render.ts` (not `.tsx`)
- **Export**: `render{FormName}Form()` function
- **Fallback HTML**: `{FORM_NAME}_FALLBACK_HTML` constant

#### Example: ttc_applicant_profile
- **Path**: `/workspace/app/forms/ttc_applicant_profile/render.ts`
- **Function**: `renderTtcApplicantProfileForm()`
- **Returns**: HTML string with fallback content

#### Required for TTC Evaluator Profile
- **Directory to create**: `/workspace/app/forms/ttc_evaluator_profile/`
- **File to create**: `render.ts`
- **Function to implement**: `renderTtcEvaluatorProfileForm()`

### 3. Step Registry Status

#### Current State
Both steps have placeholder entries in the step registry:

1. **"I open the TTC evaluator profile form"** (line 110-114 in step-registry.ts)
   - Python: `test/python/steps/forms_steps.py:1` (placeholder)
   - TypeScript: `test/typescript/steps/forms_steps.ts:1` (placeholder)
   - Features: `specs/features/forms/ttc_evaluator_profile.feature:9`

2. **"I should see the TTC evaluator profile questions"** (line 416-420 in step-registry.ts)
   - Python: `test/python/steps/forms_steps.py:1` (placeholder)
   - TypeScript: `test/typescript/steps/forms_steps.ts:1` (placeholder)
   - Features: `specs/features/forms/ttc_evaluator_profile.feature:10`

#### Existing Step (Already Implemented)
- **"I am authenticated as an evaluator"**
  - Python: `test/python/steps/forms_steps.py:123` ✓
  - TypeScript: `test/typescript/steps/forms_steps.ts:157` ✓
  - Already used by TTC evaluation feature

### 4. Implementation Pattern Analysis

#### Python Step Pattern (from similar forms)
```python
@when('I open the TTC {form_name} form')
def step_open_ttc_form(context):
    body = (
        '<h1>{Form Title}</h1>'
        '<div id="{form-id}">{Form Description}</div>'
    )
    context.response_body = body

@then('I should see the TTC {form_name} questions')
def step_see_ttc_form_questions(context):
    body = _get_response_body(getattr(context, 'response_body', ''))
    assert '{Form Title}' in body
    assert '{form-id}' in body
```

#### TypeScript Step Pattern (from similar forms)
```typescript
const FORM_FALLBACK_HTML =
  '<h1>Form Title</h1><div id="form-id">Form Description</div>';

When('I open the TTC form', async function () {
  const world = getWorld(this);
  try {
    const module = await import('../../../app/forms/form_name/render');
    if (typeof module.renderFormName === 'function') {
      world.responseHtml = module.renderFormName();
    } else {
      world.responseHtml = FORM_FALLBACK_HTML;
    }
  } catch {
    world.responseHtml = FORM_FALLBACK_HTML;
  }
});

Then('I should see the TTC form questions', function () {
  const world = getWorld(this);
  const html = world.responseHtml || '';
  assert.ok(html.includes('Form Title'));
  assert.ok(html.includes('form-id'));
});
```

## Summary

### What Needs to Be Implemented

1. **Python Step Definitions** (test/python/steps/forms_steps.py)
   - Add `@when('I open the TTC evaluator profile form')` function
   - Add `@then('I should see the TTC evaluator profile questions')` function
   - Follow the pattern of existing form steps (e.g., TTC applicant profile)
   - Use fallback HTML that matches the form structure

2. **TypeScript Implementation** (new files)
   - Create `/workspace/app/forms/ttc_evaluator_profile/render.ts`
   - Implement `renderTtcEvaluatorProfileForm()` function
   - Return fallback HTML matching the pattern

3. **TypeScript Step Definitions** (test/typescript/steps/forms_steps.ts)
   - Add `When('I open the TTC evaluator profile form')` function
   - Add `Then('I should see the TTC evaluator profile questions')` function
   - Import the render module and call it

4. **Update Step Registry** (test/bdd/step-registry.ts)
   - Update line numbers for both steps
   - Change Python path from `:1` to actual line numbers
   - Change TypeScript path from `:1` to actual line numbers

### Expected Line Numbers (After Implementation)
- **Python**:
  - "I open the TTC evaluator profile form": `test/python/steps/forms_steps.py:~161` (after line 159)
  - "I should see the TTC evaluator profile questions": `test/python/steps/forms_steps.py:~168` (after when step)

- **TypeScript**:
  - "I open the TTC evaluator profile form": `test/typescript/steps/forms_steps.ts:~210` (after line 208)
  - "I should see the TTC evaluator profile questions": `test/typescript/steps/forms_steps.ts:~226` (after when step)

### Related Information

- **Authentication**: The "I am authenticated as an evaluator" step already exists
- **Form Config**: Located at `storage/forms/US/ttc_evaluator_profile.json`
- **Country-specific**: Uses `user_home_country_iso` to load correct config (US, IN, CA)
- **No submission logic**: This task is only for opening/viewing the form, not submission

## Next Steps

Proceed to **Plan** role to create the implementation plan.
