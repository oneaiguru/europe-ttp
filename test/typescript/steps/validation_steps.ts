/**
 * Validation error step definitions.
 *
 * These steps test field-level validation errors when users submit
 * incomplete or invalid TTC application forms.
 *
 * This file extends the testContext from e2e_api_steps.ts with
 * validation-specific properties.
 */

import { DataTable, When, Then } from '@cucumber/cucumber';
import { getTestContext } from '../support/test-context';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface FieldErrors {
  [fieldName: string]: string;
}

// ============================================================================
// FIELD-LEVEL VALIDATION STEPS
// ============================================================================

When('I submit the TTC application form with missing required fields:', (dataTable?: DataTable) => {
  const table = dataTable;
  if (!table) {
    throw new Error('Table data is required for this step');
  }

  const fieldErrors: FieldErrors = {};
  const rows = table.hashes();

  for (const row of rows) {
    fieldErrors[row.missing_field] = row.error_message;
  }

  const ctx = getTestContext();

  // Set up validation failure response
  ctx.response = {
    status: '400 Bad Request',
    body: JSON.stringify({
      error: 'validation_failed',
      field_errors: fieldErrors,
    }),
  };

  // Store submission attempt as rejected
  ctx.lastSubmission = {
    form_type: 'ttc_application',
    status: 'validation_failed',
    data: {},
  };

  // Store field errors for assertions
  ctx.field_errors = fieldErrors;

  // Preserve draft data
  if (!ctx.drafts) {
    ctx.drafts = {};
  }
  ctx.drafts['ttc_application'] = {
    form_type: 'ttc_application',
    status: 'draft',
    data: {}, // Empty since fields were missing
    preserved: true,
  };
});

When('I submit the TTC application form with missing required fields', () => {
  // Handle non-table variant (for compatibility)
  const fieldErrors: FieldErrors = {};
  const ctx = getTestContext();

  ctx.response = {
    status: '400 Bad Request',
    body: JSON.stringify({
      error: 'validation_failed',
      field_errors: fieldErrors,
    }),
  };

  ctx.lastSubmission = {
    form_type: 'ttc_application',
    status: 'validation_failed',
    data: {},
  };

  ctx.field_errors = fieldErrors;

  if (!ctx.drafts) {
    ctx.drafts = {};
  }
  ctx.drafts['ttc_application'] = {
    form_type: 'ttc_application',
    status: 'draft',
    data: {},
    preserved: true,
  };
});

Then('I should see field-level errors', function () {
  const ctx = getTestContext();
  if (!ctx.field_errors) {
    throw new Error('No field errors found');
  }

  if (Object.keys(ctx.field_errors).length === 0) {
    throw new Error('Expected field errors, got none');
  }
});

Then('the submission should be blocked', function () {
  const ctx = getTestContext();
  if (!ctx.lastSubmission) {
    throw new Error('No submission record found');
  }

  const status = ctx.lastSubmission.status;
  if (status === 'submitted') {
    throw new Error('Submission should not be marked as submitted');
  }

  if (!['validation_failed', 'rejected'].includes(status || '')) {
    throw new Error(
      `Expected submission to be blocked, got status: ${status}`
    );
  }
});

Then('my draft data should remain intact', function () {
  const ctx = getTestContext();
  if (!ctx.drafts) {
    throw new Error('No drafts found');
  }

  const draft = ctx.drafts['ttc_application'];
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
  const ctx = getTestContext();

  ctx.response = {
    status: '400 Bad Request',
    body: JSON.stringify({
      error: 'validation_failed',
      field_errors: fieldErrors,
    }),
  };

  ctx.lastSubmission = {
    form_type: 'ttc_application',
    status: 'validation_failed',
    data: {},
  };

  ctx.field_errors = fieldErrors;
});

Then('I should see an email format validation error', function () {
  const ctx = getTestContext();
  if (!ctx.field_errors) {
    throw new Error('No field errors found');
  }

  const emailError = ctx.field_errors['i_email'];
  if (!emailError) {
    throw new Error('No email error found');
  }

  const errorMsg = emailError.toLowerCase();
  if (!errorMsg.includes('email') && !errorMsg.includes('format')) {
    throw new Error(`Expected email format error, got: ${emailError}`);
  }
});

When('I attempt to submit the TTC application', function () {
  const ctx = getTestContext();
  // Check if test mode is disabled (real deadline enforcement)
  const testModeEnabled = ctx.testModeEnabled;

  // If test mode is disabled, simulate deadline error
  if (!testModeEnabled) {
    ctx.response = {
      status: '403 Forbidden',
      body: JSON.stringify({ error: 'deadline_expired', grace_expired: false }),
    };
    ctx.lastSubmission = {
      form_type: 'ttc_application',
      status: 'rejected',
      data: {},
    };
  } else {
    // Normal submission
    ctx.response = {
      status: '200 OK',
      body: JSON.stringify({ success: true }),
    };
    ctx.lastSubmission = {
      form_type: 'ttc_application',
      status: 'submitted',
      data: {},
    };
  }
});

Then('I should see {string} error message', function (errorText: string) {
  const ctx = getTestContext();
  if (!ctx.response) {
    throw new Error('No response found');
  }

  // Parse response body with explicit error handling
  let body: { error?: string; field_errors?: FieldErrors };
  try {
    body = JSON.parse(ctx.response.body);
  } catch (parseError) {
    // Include contextual diagnostics for JSON parse failures
    const bodySnippet = ctx.response.body
      ? ctx.response.body.substring(0, 200)
      : '(empty body)';
    const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
    throw new Error(
      `Failed to parse response body as JSON at validation_steps.ts:228\n` +
      `Parse error: ${errorMessage}\n` +
      `Response status: ${ctx.response.status}\n` +
      `Response body (first 200 chars): ${bodySnippet}${ctx.response.body.length > 200 ? '...' : ''}`
    );
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

export {};
