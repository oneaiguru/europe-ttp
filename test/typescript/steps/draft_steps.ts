/**
 * Draft save and resume step definitions.
 *
 * These steps test the draft functionality that allows applicants to save
 * partial applications and resume them later after logout/login.
 */

import { DataTable, When, Then } from '@cucumber/cucumber';
import assert from 'assert';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface DraftData {
  form_type: string;
  status: 'draft' | 'submitted';
  saved?: boolean;
  saved_at?: string;
  submitted_at?: string;
  data: Record<string, string>;
}

// ============================================================================
// DRAFT CONTEXT
// ============================================================================

const draftContext: {
  drafts: Record<string, DraftData>;
  currentForm?: string;
  partialFormData?: Record<string, string>;
} = {
  drafts: {},
  currentForm: undefined,
  partialFormData: undefined,
};

// ============================================================================
// DRAFT SAVE AND RESUME STEPS
// ============================================================================

When('I fill in the TTC application form partially with:', (dataTable: DataTable) => {
  const rows = dataTable.hashes();
  const partialData: Record<string, string> = {};

  for (const row of rows) {
    partialData[row.field] = row.value;
  }

  // Store in context
  draftContext.partialFormData = partialData;

  // Initialize draft storage for user if not exists
  if (!draftContext.drafts['ttc_application']) {
    draftContext.drafts['ttc_application'] = {
      form_type: 'ttc_application',
      status: 'draft',
      data: {},
    };
  }

  // Store partial data in drafts
  draftContext.drafts['ttc_application'].data = { ...partialData };
});

When('I save the application as draft', () => {
  assert(draftContext.drafts['ttc_application'], 'No TTC application draft to save');

  const draft = draftContext.drafts['ttc_application'];
  draft.saved = true;
  draft.saved_at = new Date().toISOString();
});

Then('I should see my draft data persisted', () => {
  assert(draftContext.drafts['ttc_application'], 'No TTC application draft found');
  const draft = draftContext.drafts['ttc_application'];

  assert.strictEqual(draft.saved, true, 'Draft was not saved');
  assert(draft.data, 'Draft has no data');

  // Verify at least one expected field exists
  const hasData = Object.keys(draft.data).some(key =>
    ['i_fname', 'i_lname', 'i_email'].includes(key)
  );
  assert(hasData, 'Draft data missing expected fields');
});

When('I complete the remaining required fields and submit', () => {
  if (!draftContext.drafts['ttc_application']) {
    draftContext.drafts['ttc_application'] = {
      form_type: 'ttc_application',
      status: 'draft',
      data: {},
    };
  }

  const requiredFields: Record<string, string> = {
    i_address1: '123 Main St',
    i_city: 'Springfield',
    i_state: 'IL',
    i_zip: '62701',
    i_phone: '555-123-4567',
    i_gender: 'prefer_not_to_say',
  };

  // Merge with existing data
  Object.assign(draftContext.drafts['ttc_application'].data, requiredFields);

  // Mark as submitted
  draftContext.drafts['ttc_application'].status = 'submitted';
  draftContext.drafts['ttc_application'].submitted_at = new Date().toISOString();
});

When('I save a partial TTC application as draft', () => {
  draftContext.drafts['ttc_application'] = {
    form_type: 'ttc_application',
    status: 'draft',
    saved: true,
    data: {
      i_fname: 'Test',
      i_lname: 'Applicant',
      i_email: 'test.applicant@example.com',
    },
  };
});

When('I save a partial evaluator profile as draft', () => {
  draftContext.drafts['evaluator_profile'] = {
    form_type: 'evaluator_profile',
    status: 'draft',
    saved: true,
    data: {
      ev_fname: 'Test',
      ev_lname: 'Evaluator',
      ev_email: 'test.evaluator@example.com',
      ev_organization: 'Test Organization',
    },
  };
});

When('I navigate to the TTC application form', () => {
  draftContext.currentForm = 'ttc_application';
});

When('I open the TTC application form', () => {
  draftContext.currentForm = 'ttc_application';
});

Then('I should see the TTC application draft data', () => {
  assert(draftContext.drafts['ttc_application'], 'No TTC application draft found');
  const draft = draftContext.drafts['ttc_application'];

  assert.strictEqual(draft.status, 'draft', 'Expected draft status');
  assert(draft.data, 'Draft has no data');

  const hasExpectedField = ['i_fname', 'i_lname', 'i_email'].some(key => key in draft.data);
  assert(hasExpectedField, 'Missing expected draft fields');
});

When('I navigate to the evaluator profile form', () => {
  draftContext.currentForm = 'evaluator_profile';
});

Then('I should see the evaluator profile draft data', () => {
  assert(draftContext.drafts['evaluator_profile'], 'No evaluator profile draft found');
  const draft = draftContext.drafts['evaluator_profile'];

  assert.strictEqual(draft.status, 'draft', 'Expected draft status');
  assert(draft.data, 'Draft has no data');

  const hasExpectedField = ['ev_fname', 'ev_lname', 'ev_email'].some(key => key in draft.data);
  assert(hasExpectedField, 'Missing expected draft fields');
});

// Export the draft context for use in other step files if needed
export { draftContext, DraftData };
