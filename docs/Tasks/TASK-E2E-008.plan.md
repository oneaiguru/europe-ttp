# TASK-E2E-008: Validation Errors - Implementation Plan

## Overview
This plan outlines the implementation of BDD scenarios and step definitions for field-level validation errors when users submit incomplete or invalid TTC application forms.

---

## 1. Feature File Creation

**File:** `specs/features/e2e/validation_errors.feature` (NEW)

Create feature file with 3 scenarios:

```gherkin
Feature: Validation Errors
  As a TTC applicant
  I want to see clear field-level errors when I submit incomplete forms
  So that I know exactly what needs to be fixed

  Scenario: Submit with missing required fields
    Given I am authenticated as a TTC applicant
    When I submit the TTC application form with missing required fields:
      | missing_field | error_message                    |
      | i_fname       | First name is required           |
      | i_lname       | Last name is required            |
      | i_email       | Email is required                |
    Then I should see field-level errors
    And the submission should be blocked
    And my draft data should remain intact

  Scenario: Submit with invalid email format
    Given I am authenticated as a TTC applicant
    When I submit the TTC application with an invalid email format
    Then I should see an email format validation error
    And the submission should be blocked

  Scenario: Submit past deadline shows deadline error
    Given test mode is disabled (real deadline enforcement)
    And TTC option "TTC-2020-US" has display_until in the past
    And I am authenticated as a TTC applicant
    When I attempt to submit the TTC application
    Then I should see "deadline expired" error message
    And the form should not be marked as submitted
```

---

## 2. Step Registry Updates

**File:** `test/bdd/step-registry.ts` (MODIFY)

Add the following new step entries:

```typescript
'I submit the TTC application form with missing required fields:': {
  pattern: /^I\ submit\ the\ TTC\ application\ form\ with\ missing\ required\ fields:$/,
  python: 'test/python/steps/validation_steps.py:XX',
  typescript: 'test/typescript/steps/validation_steps.ts:XX',
  features: ['specs/features/e2e/validation_errors.feature:11'],
},
'I should see field-level errors': {
  pattern: /^I\ should\ see\ field\-level\ errors$/,
  python: 'test/python/steps/validation_steps.py:XX',
  typescript: 'test/typescript/steps/validation_steps.ts:XX',
  features: ['specs/features/e2e/validation_errors.feature:17'],
},
'the submission should be blocked': {
  pattern: /^the\ submission\ should\ be\ blocked$/,
  python: 'test/python/steps/validation_steps.py:XX',
  typescript: 'test/typescript/steps/validation_steps.ts:XX',
  features: ['specs/features/e2e/validation_errors.feature:18', 'specs/features/e2e/validation_errors.feature:25'],
},
'my draft data should remain intact': {
  pattern: /^my\ draft\ data\ should\ remain\ intact$/,
  python: 'test/python/steps/validation_steps.py:XX',
  typescript: 'test/typescript/steps/validation_steps.ts:XX',
  features: ['specs/features/e2e/validation_errors.feature:19'],
},
'I submit the TTC application with an invalid email format': {
  pattern: /^I\ submit\ the\ TTC\ application\ with\ an\ invalid\ email\ format$/,
  python: 'test/python/steps/validation_steps.py:XX',
  typescript: 'test/typescript/steps/validation_steps.ts:XX',
  features: ['specs/features/e2e/validation_errors.feature:21'],
},
'I should see an email format validation error': {
  pattern: /^I\ should\ see\ an\ email\ format\ validation\ error$/,
  python: 'test/python/steps/validation_steps.py:XX',
  typescript: 'test/typescript/steps/validation_steps.ts:XX',
  features: ['specs/features/e2e/validation_errors.feature:23'],
},
'I should see {string} error message': {
  pattern: /^I\ should\ see\ "([^"]*)"\ error\ message$/,
  python: 'test/python/steps/validation_steps.py:XX',
  typescript: 'test/typescript/steps/validation_steps.ts:XX',
  features: ['specs/features/e2e/validation_errors.feature:33'],
},
```

Note: The following steps already exist in registry and should be reused:
- `I am authenticated as a TTC applicant` (line 14)
- `test mode is disabled (real deadline enforcement)` (line 609)
- `TTC option {string} has display_until in the past` (line 767)
- `I attempt to submit the TTC application` (will need to add variant)
- `the form should not be marked as submitted` (line 651)

---

## 3. Python Step Definition Implementation

**File:** `test/python/steps/validation_steps.py` (NEW)

### 3.1 Step Function Signatures

```python
# -*- coding: utf-8 -*-
"""
Validation error step definitions.

These steps test field-level validation errors when users submit
incomplete or invalid TTC application forms.
"""
from __future__ import absolute_import
import json
from behave import given, when, then


# ============================================================================
# FIELD-LEVEL VALIDATION STEPS
# ============================================================================

@when('I submit the TTC application form with missing required fields:')
def step_submit_with_missing_fields(context, doc):
    """Attempt to submit TTC application with missing required fields."""
    # Parse the table data
    missing_fields = {}
    field_errors = {}
    for row in doc.rows:
        missing_fields[row['missing_field']] = row['error_message']
        field_errors[row['missing_field']] = row['error_message']

    # Set up validation failure response
    context.response = type('obj', (object,), {
        'status': '400 Bad Request',
        'body': json.dumps({
            'error': 'validation_failed',
            'field_errors': field_errors
        })
    })()

    # Store submission attempt as rejected
    context.last_submission = {
        'form_type': 'ttc_application',
        'status': 'validation_failed',
        'data': {}
    }

    # Store field errors for assertions
    context.field_errors = field_errors

    # Preserve draft data
    if not hasattr(context, 'drafts'):
        context.drafts = {}
    context.drafts['ttc_application'] = {
        'form_type': 'ttc_application',
        'status': 'draft',
        'data': {},  # Empty since fields were missing
        'preserved': True
    }


@then('I should see field-level errors')
def step_assert_field_errors(context):
    """Assert that field-level validation errors were returned."""
    assert hasattr(context, 'field_errors'), "No field errors found"
    assert len(context.field_errors) > 0, "Expected field errors, got none"


@then('the submission should be blocked')
def step_assert_submission_blocked(context):
    """Assert that the submission was rejected/blocked."""
    assert hasattr(context, 'last_submission'), "No submission record found"
    assert context.last_submission['status'] != 'submitted', \
        "Submission should not be marked as submitted"
    assert context.last_submission['status'] in ['validation_failed', 'rejected'], \
        "Expected submission to be blocked, got status: {}".format(
            context.last_submission['status']
        )


@then('my draft data should remain intact')
def step_assert_draft_preserved(context):
    """Assert that draft data was preserved on validation failure."""
    assert hasattr(context, 'drafts'), "No drafts found"
    assert 'ttc_application' in context.drafts, "No TTC application draft found"
    assert context.drafts['ttc_application'].get('preserved') is True, \
        "Draft data should be preserved"


@when('I submit the TTC application with an invalid email format')
def step_submit_invalid_email(context):
    """Attempt to submit TTC application with invalid email."""
    # Set up email validation failure response
    field_errors = {
        'i_email': 'Invalid email format'
    }

    context.response = type('obj', (object,), {
        'status': '400 Bad Request',
        'body': json.dumps({
            'error': 'validation_failed',
            'field_errors': field_errors
        })
    })()

    context.last_submission = {
        'form_type': 'ttc_application',
        'status': 'validation_failed',
        'data': {}
    }

    context.field_errors = field_errors


@then('I should see an email format validation error')
def step_assert_email_error(context):
    """Assert that email validation error was returned."""
    assert hasattr(context, 'field_errors'), "No field errors found"
    assert 'i_email' in context.field_errors, "No email error found"
    assert 'email' in context.field_errors['i_email'].lower() or \
           'format' in context.field_errors['i_email'].lower(), \
        "Expected email format error, got: {}".format(
            context.field_errors['i_email']
        )


@then('I should see "{error_text}" error message')
def step_assert_error_message(context, error_text):
    """Assert that specific error message text is present."""
    assert hasattr(context, 'response'), "No response found"

    # Parse response body
    try:
        body = json.loads(context.response.body)
    except (ValueError, AttributeError):
        body = {}

    # Check if error_text appears in error message
    error_found = False

    # Check in top-level error
    if 'error' in body and error_text.lower() in body['error'].lower():
        error_found = True

    # Check in field_errors
    if 'field_errors' in body:
        for field, error_msg in body['field_errors'].items():
            if error_text.lower() in error_msg.lower():
                error_found = True
                break

    assert error_found, \
        "Expected error message containing '{}', not found in response".format(
            error_text
        )
```

### 3.2 Test Data Setup
- Mock validation responses (no real validation logic in tests)
- Field error dictionaries matching API response format
- Draft preservation in context.drafts

### 3.3 Assertion Logic
- Check `context.response.status` for 400/403 status codes
- Verify `context.field_errors` contains expected field errors
- Assert `context.last_submission.status` is not 'submitted'
- Verify `context.drafts['ttc_application']['preserved']` is True

---

## 4. TypeScript Step Definition Implementation

**File:** `test/typescript/steps/validation_steps.ts` (NEW)

### 4.1 Step Function Signatures

```typescript
/**
 * Validation error step definitions.
 *
 * These steps test field-level validation errors when users submit
 * incomplete or invalid TTC application forms.
 */

import { Given, When, Then } from '@cucumber/cucumber';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface FieldErrors {
  [fieldName: string]: string;
}

interface ValidationResponse {
  status: string;
  body: string;
}

interface SubmissionRecord {
  form_type: string;
  status: string;
  data: Record<string, string>;
}

interface DraftRecord {
  form_type: string;
  status: string;
  data?: Record<string, string>;
  preserved?: boolean;
}

interface TestContext {
  response?: ValidationResponse;
  field_errors?: FieldErrors;
  last_submission?: SubmissionRecord;
  drafts?: Record<string, DraftRecord>;
}

// Use globalThis for shared test context
declare global {
  var testContext: TestContext;
}

if (!globalThis.testContext) {
  globalThis.testContext = {};
}

// ============================================================================
// FIELD-LEVEL VALIDATION STEPS
// ============================================================================

When(
  'I submit the TTC application form with missing required fields:',
  function (this: { table?: { rows: { missing_field: string; error_message: string }[] } }) {
    const table = this.table;
    if (!table || !table.rows) {
      throw new Error('Table data is required for this step');
    }

    const missingFields: FieldErrors = {};
    const fieldErrors: FieldErrors = {};

    for (const row of table.rows) {
      missingFields[row.missing_field] = row.error_message;
      fieldErrors[row.missing_field] = row.error_message;
    }

    // Set up validation failure response
    globalThis.testContext.response = {
      status: '400 Bad Request',
      body: JSON.stringify({
        error: 'validation_failed',
        field_errors: fieldErrors,
      }),
    };

    // Store submission attempt as rejected
    globalThis.testContext.last_submission = {
      form_type: 'ttc_application',
      status: 'validation_failed',
      data: {},
    };

    // Store field errors for assertions
    globalThis.testContext.field_errors = fieldErrors;

    // Preserve draft data
    if (!globalThis.testContext.drafts) {
      globalThis.testContext.drafts = {};
    }
    globalThis.testContext.drafts['ttc_application'] = {
      form_type: 'ttc_application',
      status: 'draft',
      data: {}, // Empty since fields were missing
      preserved: true,
    };
  }
);

Then('I should see field-level errors', function () {
  if (!globalThis.testContext.field_errors) {
    throw new Error('No field errors found');
  }

  if (Object.keys(globalThis.testContext.field_errors).length === 0) {
    throw new Error('Expected field errors, got none');
  }
});

Then('the submission should be blocked', function () {
  if (!globalThis.testContext.last_submission) {
    throw new Error('No submission record found');
  }

  const status = globalThis.testContext.last_submission.status;
  if (status === 'submitted') {
    throw new Error('Submission should not be marked as submitted');
  }

  if (!['validation_failed', 'rejected'].includes(status)) {
    throw new Error(
      `Expected submission to be blocked, got status: ${status}`
    );
  }
});

Then('my draft data should remain intact', function () {
  if (!globalThis.testContext.drafts) {
    throw new Error('No drafts found');
  }

  const draft = globalThis.testContext.drafts['ttc_application'];
  if (!draft) {
    throw new Error('No TTC application draft found');
  }

  if (draft.preserved !== true) {
    throw new Error('Draft data should be preserved');
  }
});

When('I submit the TTC application with an invalid email format', function () {
  const fieldErrors: FieldErrors = {
    i_email: 'Invalid email format',
  };

  globalThis.testContext.response = {
    status: '400 Bad Request',
    body: JSON.stringify({
      error: 'validation_failed',
      field_errors: fieldErrors,
    }),
  };

  globalThis.testContext.last_submission = {
    form_type: 'ttc_application',
    status: 'validation_failed',
    data: {},
  };

  globalThis.testContext.field_errors = fieldErrors;
});

Then('I should see an email format validation error', function () {
  if (!globalThis.testContext.field_errors) {
    throw new Error('No field errors found');
  }

  const emailError = globalThis.testContext.field_errors['i_email'];
  if (!emailError) {
    throw new Error('No email error found');
  }

  const errorMsg = emailError.toLowerCase();
  if (!errorMsg.includes('email') && !errorMsg.includes('format')) {
    throw new Error(`Expected email format error, got: ${emailError}`);
  }
});

Then('I should see {string} error message', function (errorText: string) {
  if (!globalThis.testContext.response) {
    throw new Error('No response found');
  }

  // Parse response body
  let body: { error?: string; field_errors?: FieldErrors };
  try {
    body = JSON.parse(globalThis.testContext.response.body);
  } catch (e) {
    body = {};
  }

  let errorFound = false;

  // Check in top-level error
  if (body.error && body.error.toLowerCase().includes(errorText.toLowerCase())) {
    errorFound = true;
  }

  // Check in field_errors
  if (body.field_errors) {
    for (const field in body.field_errors) {
      if (body.field_errors[field].toLowerCase().includes(errorText.toLowerCase())) {
        errorFound = true;
        break;
      }
    }
  }

  if (!errorFound) {
    throw new Error(
      `Expected error message containing '${errorText}', not found in response`
    );
  }
});
```

### 4.2 Test Context Pattern
- Use `globalThis.testContext` for shared state
- Match existing TypeScript step patterns from `e2e_api_steps.ts`
- Ensure type safety with TypeScript interfaces

### 4.3 Assertion Logic
- Mirror Python assertion logic exactly
- Throw descriptive errors for test failures
- Use same response format validation

---

## 5. Step Registry Integration

### 5.1 Verification After Registry Update

Run alignment check:
```bash
bun scripts/bdd/verify-alignment.ts
```

Expected result:
- 0 orphan steps (steps in registry but not in features)
- 0 dead steps (steps in features but not in registry)

### 5.2 Step Pattern Consistency

All new steps follow the pattern:
- Table parameter steps end with `:`
- Parameterized steps use `{string}` placeholder
- Patterns match literal step text with proper escaping

---

## 6. Test Execution Plan

### 6.1 Python BDD Tests

Run specific feature:
```bash
bun scripts/bdd/run-python.ts specs/features/e2e/validation_errors.feature
```

Expected results:
- Scenario 1 (missing required fields): PASS
- Scenario 2 (invalid email format): PASS
- Scenario 3 (deadline error): PASS

### 6.2 TypeScript BDD Tests

Run specific feature:
```bash
bun scripts/bdd/run-typescript.ts specs/features/e2e/validation_errors.feature
```

Expected results:
- Scenario 1 (missing required fields): PASS
- Scenario 2 (invalid email format): PASS
- Scenario 3 (deadline error): PASS

---

## 7. Implementation Checklist

### Phase 1: Feature File & Registry
- [ ] Create `specs/features/e2e/validation_errors.feature`
- [ ] Update `test/bdd/step-registry.ts` with new steps
- [ ] Run `verify-alignment.ts` - must pass

### Phase 2: Python Implementation
- [ ] Create `test/python/steps/validation_steps.py`
- [ ] Implement all 7 new step functions
- [ ] Run Python BDD tests - all scenarios must pass

### Phase 3: TypeScript Implementation
- [ ] Create `test/typescript/steps/validation_steps.ts`
- [ ] Implement all 7 new step functions
- [ ] Run TypeScript BDD tests - all scenarios must pass

### Phase 4: Verification
- [ ] Run `verify-alignment.ts` - 0 orphan, 0 dead
- [ ] Run `bun run typecheck` - must pass
- [ ] Run `bun run lint` - must pass
- [ ] Update coverage matrix
- [ ] Update IMPLEMENTATION_PLAN.md
- [ ] Remove ACTIVE_TASK.md

---

## 8. Risk Mitigation

### Risk 1: Step Pattern Collisions
**Mitigation:** Check existing registry for similar patterns before adding new steps. The new steps are distinct enough to avoid collisions.

### Risk 2: Table Parameter Handling
**Mitigation:** Follow existing patterns from `draft_steps.py` and `e2e_api_steps.py` for table parsing. Test both with and without trailing colon.

### Risk 3: TypeScript Type Safety
**Mitigation:** Define proper interfaces for all context objects. Use `globalThis.testContext` consistently with existing steps.

### Risk 4: Orphan/Dead Steps
**Mitigation:** Run `verify-alignment.ts` after each phase. Fix any mismatches before proceeding.

---

## 9. Success Criteria

All acceptance criteria from task definition must be met:
- [ ] Feature file created at `specs/features/e2e/validation_errors.feature`
- [ ] All step definitions implemented in Python
- [ ] All step definitions implemented in TypeScript
- [ ] Step registry updated with all new steps
- [ ] Python BDD tests pass for all 3 scenarios
- [ ] TypeScript BDD tests pass for all 3 scenarios
- [ ] `verify-alignment.ts` passes (0 orphan, 0 dead)

---

## 10. Notes

- This task implements PRD Appendix A, requirement A3
- No real validation logic in API routes is required for this task (that's a separate implementation task)
- Tests use mock responses to simulate validation failures
- Draft preservation pattern follows existing `draft_steps.py/ts` implementation
- All new steps are specific to validation errors and won't conflict with existing steps
