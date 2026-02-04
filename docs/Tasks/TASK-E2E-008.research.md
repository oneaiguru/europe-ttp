# TASK-E2E-008: Validation Errors - Research Document

## Overview
Research findings for implementing BDD scenarios and step definitions for field-level validation errors when users submit incomplete or invalid forms.

---

## 1. Python Implementation Context

### 1.1 Legacy Code Structure

**Form Rendering** (`/workspace/form.py:40-521`)
- Form fields have `required` attribute set based on question config
- Required field checking: `q_is_required = question.get('required',True)`
- Required flag applied to inputs: `required=q_required`
- Form has HTML5 validation attributes: `<input ... required autocomplete="off">`

**API Endpoint** (`/workspace/api.py:105-217`)
- Legacy `UploadForm` class handles form data submission
- Stores form data to Google Cloud Storage
- No explicit validation error handling in legacy code
- Relies on frontend HTML5 validation

**Form Data Storage** (`/workspace/ttc_portal_user.py`)
- `TTCPortalUser` class stores form data
- Methods: `set_app_form_data()`, `set_eval_form_data()`
- Draft data preserved in session/context

### 1.2 Existing Python Test Steps

**Deadline Validation** (`test/python/steps/e2e_api_steps.py:64-76`)
```python
@given('TTC option "{ttc_value}" has display_until in the past')
def step_ttc_option_expired(context, ttc_value):
    """Verify a test TTC option exists with an expired deadline."""
    option = context.get_ttc_option(ttc_value)
    display_until = option.get('display_until', '')
    # Verify it's in the past (2020 dates)
```

**Deadline Enforcement** (`test/python/steps/e2e_api_steps.py:138-182`)
```python
@when('I attempt to submit TTC application via API for "{ttc_value}"')
def step_attempt_submit_via_api(context, ttc_value):
    """Attempt to submit a TTC application (may fail)."""
    # Returns 403 with deadline_expired error when expired
    context.response = type('obj', (object,), {
        'status': '403 Forbidden',
        'body': json.dumps({'error': 'deadline_expired', 'grace_expired': grace_expired})
    })()
```

**Deadline Error Assertion** (`test/python/steps/e2e_api_steps.py:436-444`)
```python
@then('the submission should be rejected with deadline error')
def step_assert_submission_rejected_deadline(context):
    """Assert submission was rejected due to deadline."""
    assert hasattr(context, 'response'), "No response exists"
    status = getattr(context.response, 'status', '')
    assert '403' in status or 'Forbidden' in status
```

**Draft Preservation** (`test/python/steps/draft_steps.py:16-67`)
```python
@when('I fill in the TTC application form partially with:')
def step_fill_partial_form(context, doc):
    """Store partial form data in context for later save."""
    context.partial_form_data = {}
    for row in doc.rows:
        context.partial_form_data[row['field']] = row['value']

    context.drafts['ttc_application'] = {
        'form_type': 'ttc_application',
        'status': 'draft',
        'data': context.partial_form_data.copy()
    }
```

### 1.3 Python Validation Patterns

**Required Field Pattern:**
- HTML5 `required` attribute on form inputs
- Field names: `i_fname`, `i_lname`, `i_email`, `i_address1`, `i_city`, etc.
- Frontend validation prevents submission if required fields are empty

**Deadline Pattern:**
- Test mode bypass: `@bypass_deadline_check` decorator in `/workspace/pyutils/test_mode.py:90-106`
- Error response: `{'error': 'deadline_expired', 'grace_expired': boolean}`
- Grace period handling for whitelisted users

**Email Validation:**
- HTML5 `type="email"` provides basic format validation
- Legacy code does not have explicit email regex validation

---

## 2. TypeScript Implementation Context

### 2.1 Existing TypeScript Code

**Upload Form API Route** (`/workspace/app/users/upload-form-data/route.ts`)
```typescript
async function POST(request: Request): Promise<Response> {
  const payload = await readPayload(request);
  const normalized = normalizePayload(payload);

  return Response.json({
    ok: true,
    received: normalized,
  }, { status: 200 });
}
```
- Currently accepts all data without validation
- No validation error handling
- Need to add validation logic

### 2.2 Existing TypeScript Test Steps

**Deadline Enforcement** (`test/typescript/steps/e2e_api_steps.ts:253-267`)
```typescript
When('I attempt to submit TTC application via API for "{string}"', (ttcValue: string) => {
  // Returns 403 with deadline_expired error when expired
  testContext.response = {
    status: '403 Forbidden',
    body: JSON.stringify({ error: 'deadline_expired', grace_expired: graceExpired }),
  };
  testContext.lastSubmission = { form_type: 'ttc_application', status: 'rejected', data: {} };
});
```

**Deadline Error Assertion** (`test/typescript/steps/e2e_api_steps.ts:533-541`)
```typescript
Then('the submission should be rejected with deadline error', () => {
  if (!testContext.response) {
    throw new Error('No response exists');
  }
  const status = testContext.response.status;
  if (!status.includes('403') && !status.includes('Forbidden')) {
    throw new Error(`Expected rejection, got ${status}`);
  }
});
```

**Form Not Submitted Assertion** (`test/typescript/steps/e2e_api_steps.ts:543-547`)
```typescript
Then('the form should not be marked as submitted', () => {
  if (testContext.lastSubmission && testContext.lastSubmission.status === 'submitted') {
    throw new Error('Form should not be marked as submitted');
  }
});
```

**Draft Context** (`test/typescript/steps/draft_steps.ts:47-55`)
```typescript
const draftContext: {
  drafts: Record<string, DraftData>;
  currentForm?: string;
  partialFormData?: Record<string, string>;
} = {
  drafts: {},
  currentForm: undefined,
  partialFormData: undefined,
};
```

### 2.3 TypeScript Test Patterns

- Uses `globalThis.testContext` for shared state
- Response objects have `status` and `body` properties
- Draft data stored in `draftContext.drafts[form_type]`
- Submission status tracked in `testContext.lastSubmission.status`

---

## 3. Step Registry Analysis

### 3.1 Existing Related Steps

From `/workspace/test/bdd/step-registry.ts`:

**Already Implemented:**
- `I am authenticated as a TTC applicant` (line 14)
- `test mode is disabled (real deadline enforcement)` (line 609)
- `the submission should be rejected with deadline error` (line 645)
- `the form should not be marked as submitted` (line 651)

**New Steps Needed:**
1. `I submit the TTC application form with missing required fields` - with table parameter
2. `I should see field-level errors`
3. `the submission should be blocked` (generic assertion)
4. `my draft data should remain intact` (draft preservation check)
5. `I submit the TTC application with an invalid email format`
6. `I should see an email format validation error`
7. `I should see {string} error message` - parameterized
8. `TTC option {string} has display_until in the past` - already exists but needs verification

### 3.2 Parameterized Steps Pattern

From step registry, existing parameterized steps:
```typescript
'I submit TTC application for {string} with:': {
  pattern: /^I\ submit\ TTC\ application\ for\ "([^"]*)"\ with:$/,
  features: ['specs/features/e2e/ttc_application_to_admin_review.feature:12'],
}
```

Table parameter handling pattern in Python:
```python
@when('I submit TTC application for "{ttc_value}" with:')
def step_submit_ttc_application(context, ttc_value, doc):
    form_data = {}
    for row in doc.rows:
        form_data[row['field']] = row['value']
```

---

## 4. Feature File Requirements

The feature file at `specs/features/e2e/validation_errors.feature` needs to be created with 3 scenarios:

1. **Submit with missing required fields** - Table of field→error mappings
2. **Submit with invalid email format** - Email validation error
3. **Submit past deadline shows deadline error** - Deadline error message

**Key Data Structures:**

Table format for missing fields:
```gherkin
When I submit the TTC application form with missing required fields:
  | missing_field | error_message |
  | i_fname | First name is required |
  | i_lname | Last name is required |
  | i_email | Email is required |
```

---

## 5. Implementation Notes

### 5.1 Field-Level Validation Error Response Format

Expected JSON response structure (consistent with deadline error):
```json
{
  "error": "validation_failed",
  "field_errors": {
    "i_fname": "First name is required",
    "i_lname": "Last name is required",
    "i_email": "Email is required"
  }
}
```

For email format validation:
```json
{
  "error": "validation_failed",
  "field_errors": {
    "i_email": "Invalid email format"
  }
}
```

### 5.2 Draft Preservation Pattern

When validation fails:
- Draft data MUST remain in `context.drafts[form_type].data`
- Submission status should be `'rejected'` or `'validation_failed'`
- `last_submission.status` should NOT be `'submitted'`

### 5.3 Common Required Fields

Based on form.py and draft_steps.py:
- `i_fname` - First name (required)
- `i_lname` - Last name (required)
- `i_email` - Email (required)
- `i_address1` - Address (required for complete submission)
- `i_city` - City (required)
- `i_state` - State (required)
- `i_zip` - ZIP code (required)
- `i_phone` - Phone (required)
- `i_gender` - Gender (required)

### 5.4 Email Validation Pattern

HTML5 email validation accepts:
- Basic format: `user@domain.tld`
- Allows: `+` in local part, subdomains, etc.

Should reject:
- Missing `@` symbol
- Missing domain
- Missing TLD

---

## 6. File Locations

### 6.1 Python Files to Create/Modify

**NEW FILE:** `test/python/steps/validation_steps.py`
- New step definitions for validation scenarios
- Follow pattern from `e2e_api_steps.py`

**MODIFY:** `test/bdd/step-registry.ts`
- Add new step patterns and mappings

### 6.2 TypeScript Files to Create/Modify

**NEW FILE:** `test/typescript/steps/validation_steps.ts`
- Mirror Python validation steps
- Use `globalThis.testContext` pattern

**MODIFY:** `app/users/upload-form-data/route.ts`
- Add validation logic
- Return proper error responses

---

## 7. Test Data Setup

### 7.1 Test Fixtures

Use existing fixtures from `/workspace/test/python/support/fixtures.py`:
- `get_ttc_test_config()` - Active TTC options
- `get_expired_ttc_options()` - Expired TTC options for deadline testing

### 7.2 Mock Data

Invalid email test cases:
- `invalid-email` (no @)
- `@example.com` (no local part)
- `user@` (no domain)
- `user@.com` (invalid domain)

Valid email test cases:
- `test@example.com`
- `user+tag@example.com`
- `user.name@subdomain.example.com`

---

## 8. Open Questions

1. **Should validation be done on frontend or backend?**
   - Legacy relies on HTML5 frontend validation
   - New implementation should add backend validation for API security
   - Both frontend and backend validation recommended

2. **What specific validation rules for each field?**
   - Email: HTML5 email format
   - Required fields: non-empty strings
   - Phone: optional format validation?
   - ZIP: optional format validation?

3. **Should we use a validation library?**
   - Python: `voluptuous` or `marshmallow`?
   - TypeScript: `zod` or manual validation?
   - Keep it simple for now with manual validation

---

## 9. Summary

### Key Findings:
1. **Deadline validation** already exists in both Python and TypeScript
2. **Draft preservation** pattern is established in `draft_steps.py/ts`
3. **Validation error response** format should match deadline error format
4. **New step file needed**: `validation_steps.py` and `validation_steps.ts`
5. **API route needs validation**: `app/users/upload-form-data/route.ts`

### Implementation Strategy:
1. Create feature file with 3 scenarios
2. Create `validation_steps.py` with mock validation logic
3. Create `validation_steps.ts` matching Python implementation
4. Update step registry
5. Later: Add real validation to API route (separate task)

### Dependencies:
- No new dependencies required
- Use existing test context patterns
- Reuse deadline error response format
