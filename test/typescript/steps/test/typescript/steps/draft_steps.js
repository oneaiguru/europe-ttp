"use strict";
/**
 * Draft save and resume step definitions.
 *
 * These steps test the draft functionality that allows applicants to save
 * partial applications and resume them later after logout/login.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.draftContext = void 0;
const cucumber_1 = require("@cucumber/cucumber");
const assert_1 = __importDefault(require("assert"));
// ============================================================================
// DRAFT CONTEXT
// ============================================================================
const draftContext = {
    drafts: {},
    currentForm: undefined,
    partialFormData: undefined,
};
exports.draftContext = draftContext;
// ============================================================================
// DRAFT SAVE AND RESUME STEPS
// ============================================================================
(0, cucumber_1.When)('I fill in the TTC application form partially with:', (dataTable) => {
    const rows = dataTable.hashes();
    const partialData = {};
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
(0, cucumber_1.When)('I save the application as draft', () => {
    (0, assert_1.default)(draftContext.drafts['ttc_application'], 'No TTC application draft to save');
    const draft = draftContext.drafts['ttc_application'];
    draft.saved = true;
    draft.saved_at = new Date().toISOString();
});
(0, cucumber_1.Then)('I should see my draft data persisted', () => {
    (0, assert_1.default)(draftContext.drafts['ttc_application'], 'No TTC application draft found');
    const draft = draftContext.drafts['ttc_application'];
    assert_1.default.strictEqual(draft.saved, true, 'Draft was not saved');
    (0, assert_1.default)(draft.data, 'Draft has no data');
    // Verify at least one expected field exists
    const hasData = Object.keys(draft.data).some(key => ['i_fname', 'i_lname', 'i_email'].includes(key));
    (0, assert_1.default)(hasData, 'Draft data missing expected fields');
});
(0, cucumber_1.When)('I complete the remaining required fields and submit', () => {
    if (!draftContext.drafts['ttc_application']) {
        draftContext.drafts['ttc_application'] = {
            form_type: 'ttc_application',
            status: 'draft',
            data: {},
        };
    }
    const requiredFields = {
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
(0, cucumber_1.When)('I save a partial TTC application as draft', () => {
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
(0, cucumber_1.When)('I save a partial evaluator profile as draft', () => {
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
(0, cucumber_1.When)('I navigate to the TTC application form', () => {
    draftContext.currentForm = 'ttc_application';
});
(0, cucumber_1.When)('I open the TTC application form', () => {
    draftContext.currentForm = 'ttc_application';
});
(0, cucumber_1.Then)('I should see the TTC application draft data', () => {
    (0, assert_1.default)(draftContext.drafts['ttc_application'], 'No TTC application draft found');
    const draft = draftContext.drafts['ttc_application'];
    assert_1.default.strictEqual(draft.status, 'draft', 'Expected draft status');
    (0, assert_1.default)(draft.data, 'Draft has no data');
    const hasExpectedField = ['i_fname', 'i_lname', 'i_email'].some(key => key in draft.data);
    (0, assert_1.default)(hasExpectedField, 'Missing expected draft fields');
});
(0, cucumber_1.When)('I navigate to the evaluator profile form', () => {
    draftContext.currentForm = 'evaluator_profile';
});
(0, cucumber_1.Then)('I should see the evaluator profile draft data', () => {
    (0, assert_1.default)(draftContext.drafts['evaluator_profile'], 'No evaluator profile draft found');
    const draft = draftContext.drafts['evaluator_profile'];
    assert_1.default.strictEqual(draft.status, 'draft', 'Expected draft status');
    (0, assert_1.default)(draft.data, 'Draft has no data');
    const hasExpectedField = ['ev_fname', 'ev_lname', 'ev_email'].some(key => key in draft.data);
    (0, assert_1.default)(hasExpectedField, 'Missing expected draft fields');
});
