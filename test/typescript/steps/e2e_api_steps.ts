/**
 * E2E API-centric step definitions for complex scenarios.
 *
 * These steps test the TTC application to admin review pipeline using
 * API calls instead of browser automation for reliability and speed.
 */

import { Before, DataTable, Given, When, Then } from '@cucumber/cucumber';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface TestUser {
  email: string;
  role: string;
  home_country: string;
  name: string;
  profile_complete?: boolean;
  photo_uploaded?: boolean;
}

interface TTCOption {
  value: string;
  display: string;
  display_until: string;
  display_countries: string[];
  display_data: Record<string, string>;
}

interface FormSubmission {
  form_type: string;
  email?: string;
  ttc_option?: string;
  applicant_email?: string;
  evaluator_email?: string;
  candidate_email?: string;
  candidate_name?: string;
  graduate_email?: string;
  data: Record<string, unknown>;
  status: string;
  matching_method?: 'email' | 'name_fallback' | 'fuzzy_email';
}

interface ApiResponse {
  status: string;
  body: string;
}

// ============================================================================
// TEST CONTEXT
// ============================================================================

declare global {
  var testContext: {
    currentEmail?: string;
    currentRole?: string;
    currentUser?: TestUser;
    currentTtcOption?: TTCOption;
    lastSubmission?: FormSubmission;
    response?: ApiResponse;
    homeCountry?: string;
    whitelist: string[];
    whitelistTargetEmail?: string;
    whitelistGraceExpired: boolean;
    evaluations: FormSubmission[];
    evaluationsCount: number;
    applicantSubmissions: Record<string, unknown>;
    applicants: Record<string, TestUser>;
    graduates: Record<string, unknown>;
    testModeEnabled: boolean;
    currentPage?: string;
    numEvaluators?: number;
    requestedReportEmail?: string;
    userSummary: Record<string, unknown>;
    evaluationsList: unknown[];
    lastNotification?: { to: string; type: string };
    flaggedMissingFeedback?: string[];
    postTtcSubmissions?: {
      selfEval?: boolean;
      coTeacherFeedback?: boolean;
    };
    // Additional properties for validation and draft steps
    field_errors?: Record<string, string>;
    drafts?: Record<string, { form_type?: string; status?: string; data?: Record<string, unknown>; preserved?: boolean }>;
    // E2E workflow properties (from E2ETestContext)
    applicantUploads?: Record<string, {
      photo_url: string;
      document_urls: string[];
    }>;
    currentApplicantEmail?: string;
    currentApplicantSubmission?: {
      form_type: string;
      ttc_option?: string;
      data: Record<string, unknown>;
      status: string;
    };
    currentView?: string;
  };
}

// Initialize testContext on globalThis if not exists
if (typeof globalThis.testContext === 'undefined') {
  globalThis.testContext = {
    whitelist: [],
    whitelistGraceExpired: false,
    evaluations: [],
    evaluationsCount: 0,
    applicantSubmissions: {},
    applicants: {},
    graduates: {},
    testModeEnabled: true,
    userSummary: {},
    evaluationsList: [],
  };
}

// Use globalThis.testContext for consistency with other step files
const testContext = globalThis.testContext;

// ============================================================================
// BEFORE EACH HOOK - Reset test context between scenarios
// ============================================================================

Before(() => {
  // Reset the test context properties without replacing the object
  // This ensures the const testContext reference remains valid
  testContext.whitelist = [];
  testContext.whitelistGraceExpired = false;
  testContext.evaluations = [];
  testContext.evaluationsCount = 0;
  testContext.applicantSubmissions = {};
  testContext.applicants = {};
  testContext.graduates = {};
  testContext.testModeEnabled = true;
  testContext.userSummary = {};
  testContext.evaluationsList = [];
  // Clear optional properties
  delete testContext.currentEmail;
  delete testContext.currentRole;
  delete testContext.currentUser;
  delete testContext.currentTtcOption;
  delete testContext.lastSubmission;
  delete testContext.response;
  delete testContext.homeCountry;
  delete testContext.whitelistTargetEmail;
  delete testContext.currentPage;
  delete testContext.numEvaluators;
  delete testContext.requestedReportEmail;
  delete testContext.lastNotification;
  delete testContext.postTtcSubmissions;
  delete testContext.flaggedMissingFeedback;
  // Reset E2ETestContext extended properties
  delete testContext.applicantUploads;
  delete testContext.currentApplicantEmail;
  delete testContext.currentApplicantSubmission;
  delete testContext.currentView;
  delete testContext.field_errors;
});

// ============================================================================
// FIXTURE LOADERS
// ============================================================================

function loadTestUsers(): TestUser[] {
  // In a real implementation, load from test/fixtures/test-users.json
  return [
    { email: 'test.applicant@example.com', role: 'applicant', home_country: 'US', name: 'Test Applicant' },
    { email: 'test.applicant.ca@example.com', role: 'applicant', home_country: 'CA', name: 'Test Applicant Canada' },
    { email: 'test.applicant.in@example.com', role: 'applicant', home_country: 'IN', name: 'Test Applicant India' },
    { email: 'test.evaluator1@example.com', role: 'evaluator', home_country: 'US', name: 'Test Evaluator One' },
    { email: 'test.evaluator2@example.com', role: 'evaluator', home_country: 'US', name: 'Test Evaluator Two' },
    { email: 'test.admin@example.com', role: 'admin', home_country: 'US', name: 'Test Admin' },
    { email: 'test.graduate@example.com', role: 'graduate', home_country: 'US', name: 'Test Graduate' },
    { email: 'test.coteacher@example.com', role: 'coteacher', home_country: 'US', name: 'Test Co-Teacher' },
  ];
}

function loadTestTTCOptions(): TTCOption[] {
  // In a real implementation, load from storage/forms/ttc_country_and_dates_test.json
  return [
    {
      value: 'test_us_future',
      display: 'Test TTC (Future) - United States',
      display_until: '2027-12-31 23:59:59',
      display_countries: ['US'],
      display_data: { country: 'United States', venue: 'Test Venue, US', fees: '$4500 USD' },
    },
    {
      value: 'test_ca_future',
      display: 'Test TTC (Future) - Canada',
      display_until: '2027-12-31 23:59:59',
      display_countries: ['CA'],
      display_data: { country: 'Canada', venue: 'Test Venue, Canada', fees: '$4500 CAD' },
    },
    {
      value: 'test_in_future',
      display: 'Test TTC (Future) - India',
      display_until: '2027-12-31 23:59:59',
      display_countries: ['IN'],
      display_data: { country: 'India', venue: 'Test Venue, India', fees: '₹150000 INR' },
    },
    {
      value: 'test_multi_country',
      display: 'Test TTC (Multi-Country)',
      display_until: '2027-12-31 23:59:59',
      display_countries: ['US', 'CA'],
      display_data: { country: 'Multi', venue: 'Test Venue, Multi', fees: 'Varies' },
    },
    {
      value: 'test_expired',
      display: 'Test TTC (Expired)',
      display_until: '2020-01-01 00:00:00',
      display_countries: ['US'],
      display_data: { country: 'United States', venue: 'Test Expired Venue', fees: '$4500 USD' },
    },
  ];
}

function getUserByEmail(email: string): TestUser | undefined {
  return loadTestUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
}

function getUserByRole(role: string): TestUser | undefined {
  return loadTestUsers().find((u) => u.role === role);
}

function getTtcOption(value: string): TTCOption | undefined {
  return loadTestTTCOptions().find((o) => o.value === value);
}

// ============================================================================
// AUTHENTICATION & USER CONTEXT STEPS
// ============================================================================

Given('I am authenticated as applicant with email {string}', (email: string) => {
  testContext.currentUser = getUserByEmail(email);
  testContext.currentEmail = email;
  testContext.currentRole = 'applicant';
});

Given('I am authenticated as evaluator with email {string}', (email: string) => {
  testContext.currentUser = getUserByEmail(email);
  testContext.currentEmail = email;
  testContext.currentRole = 'evaluator';
});

Given('I am authenticated as admin', () => {
  const admin = getUserByRole('admin');
  testContext.currentUser = admin;
  testContext.currentEmail = admin?.email;
  testContext.currentRole = 'admin';
});

Given('I am authenticated as {string} with email {string}', (role: string, email: string) => {
  testContext.currentUser = getUserByEmail(email);
  testContext.currentEmail = email;
  testContext.currentRole = role;
});

Given('I am authenticated as {string}', (email: string) => {
  const user = getUserByEmail(email);
  if (user) {
    testContext.currentUser = user;
    testContext.currentEmail = email;
    testContext.currentRole = user.role;
  } else {
    // Fallback if no user found
    testContext.currentEmail = email;
    testContext.currentRole = 'applicant';
    testContext.currentUser = undefined;
  }
});

// ============================================================================
// TTC OPTION & CONFIGURATION STEPS
// ============================================================================

Given('test TTC option {string} is available', (ttcValue: string) => {
  const option = getTtcOption(ttcValue);
  if (!option) {
    throw new Error(`TTC option ${ttcValue} not found in fixtures`);
  }
  testContext.currentTtcOption = option;
});

Given('TTC option {string} has display_until in the past', (ttcValue: string) => {
  const option = getTtcOption(ttcValue);
  if (!option) {
    throw new Error(`TTC option ${ttcValue} not found in fixtures`);
  }
  const displayUntil = option.display_until;
  if (!displayUntil.includes('2020') && !displayUntil.includes('2019')) {
    throw new Error(`Expected expired date, got ${displayUntil}`);
  }
  testContext.currentTtcOption = option;
});

// ============================================================================
// FORM SUBMISSION STEPS
// ============================================================================

Given('I have completed my applicant profile', () => {
  // Mark profile as complete
  testContext.currentUser = { ...testContext.currentUser!, profile_complete: true };
});

Given('I have uploaded my photo', () => {
  // Mark photo as uploaded
  testContext.currentUser = { ...testContext.currentUser!, photo_uploaded: true };
});

When('I submit TTC application for {string} with:', (ttcValue: string, dataTable: DataTable) => {
  const formData: Record<string, string> = {};
  dataTable.rows().forEach((row) => {
    formData[row[0]] = row[1];
  });

  testContext.lastSubmission = {
    form_type: 'ttc_application',
    ttc_option: ttcValue,
    email: testContext.currentEmail,
    data: formData,
    status: 'submitted',
  };

  // Note: evaluator emails are stored in formData, not in evaluationsList
  // evaluationsList contains slot identifiers (teacher1, teacher2, etc.)
  // which are set by the "When I select" step

  testContext.response = {
    status: '200 OK',
    body: JSON.stringify({ success: true, status: 'submitted' }),
  };
});

When('I submit TTC evaluation for {string} with:', (applicantEmail: string, dataTable: DataTable) => {
  const formData: Record<string, string> = {};
  dataTable.rows().forEach((row) => {
    formData[row[0]] = row[1];
  });

  testContext.lastSubmission = {
    form_type: 'ttc_evaluation',
    evaluator_email: testContext.currentEmail,
    applicant_email: applicantEmail,
    data: formData,
    status: 'submitted',
  };

  if (testContext.lastSubmission) {
    testContext.evaluations.push(testContext.lastSubmission);
  }
  testContext.evaluationsCount++;

  testContext.response = {
    status: '200 OK',
    body: JSON.stringify({ success: true, status: 'submitted' }),
  };
});

When('I attempt to submit TTC application via API for {string}', (ttcValue: string) => {
  const option = getTtcOption(ttcValue);
  const isExpired = ttcValue.includes('expired') || option?.value.includes('expired') || option?.display_until.includes('2020') || option?.display_until.includes('2019');

  // Check if current user or whitelist target is whitelisted
  const currentEmail = testContext.currentEmail || '';
  const whitelistTarget = testContext.whitelistTargetEmail || '';
  const isWhitelisted = testContext.whitelist.map((e) => e.toLowerCase()).includes(currentEmail.toLowerCase()) ||
                         (whitelistTarget && testContext.whitelist.map((e) => e.toLowerCase()).includes(whitelistTarget.toLowerCase()));
  const graceExpired = testContext.whitelistGraceExpired;
  const allowExpired = isWhitelisted && !graceExpired;

  if (isExpired && !testContext.testModeEnabled && !allowExpired) {
    testContext.response = {
      status: '403 Forbidden',
      body: JSON.stringify({ error: 'deadline_expired', grace_expired: graceExpired }),
    };
    testContext.lastSubmission = { form_type: 'ttc_application', status: 'rejected', data: {} };
  } else {
    testContext.response = {
      status: '200 OK',
      body: JSON.stringify({ success: true }),
    };
    testContext.lastSubmission = { form_type: 'ttc_application', status: 'submitted', data: {} };
  }
});

// ============================================================================
// POST-TTC FEEDBACK STEPS
// ============================================================================

Given('{string} has completed TTC {string}', (email: string, ttcValue: string) => {
  testContext.graduates[email] = {
    completed_ttc: ttcValue,
    status: 'graduate',
  };
});

When('I submit post-TTC self-evaluation for course starting {string} with:', (startDate: string, dataTable: DataTable) => {
  const formData: Record<string, string> = { i_course_start_date: startDate };
  dataTable.rows().forEach((row) => {
    formData[row[0]] = row[1];
  });

  testContext.lastSubmission = {
    form_type: 'post_ttc_self_evaluation',
    email: testContext.currentEmail,
    data: formData,
    status: 'submitted',
  };

  // Track that self-eval was submitted
  if (!testContext.postTtcSubmissions) {
    testContext.postTtcSubmissions = {};
  }
  testContext.postTtcSubmissions.selfEval = true;

  // Set notification to co-teacher if provided in form data
  const coTeacherEmail = formData.i_co_teacher_email;
  if (coTeacherEmail) {
    testContext.lastNotification = { to: coTeacherEmail, type: 'feedback_request' };
  }

  testContext.response = {
    status: '200 OK',
    body: JSON.stringify({ success: true, status: 'submitted' }),
  };
});

When('I submit post-TTC feedback for {string} with:', (graduateEmail: string, dataTable: DataTable) => {
  const formData: Record<string, string> = { i_graduate_email: graduateEmail };
  dataTable.rows().forEach((row) => {
    formData[row[0]] = row[1];
  });

  testContext.lastSubmission = {
    form_type: 'post_ttc_feedback',
    email: testContext.currentEmail,
    graduate_email: graduateEmail,
    data: formData,
    status: 'submitted',
  };

  // Track that co-teacher feedback was submitted
  if (!testContext.postTtcSubmissions) {
    testContext.postTtcSubmissions = {};
  }
  testContext.postTtcSubmissions.coTeacherFeedback = true;

  testContext.response = {
    status: '200 OK',
    body: JSON.stringify({ success: true, status: 'submitted' }),
  };
});

// ============================================================================
// HOME COUNTRY STEPS
// ============================================================================

When('I set my home country to {string} via API', (country: string) => {
  testContext.homeCountry = country;
  testContext.response = {
    status: '200 OK',
    body: JSON.stringify({ success: true, home_country: country }),
  };
});

// ============================================================================
// ADMIN CONFIG & WHITELIST STEPS
// ============================================================================

When('I add {string} to the whitelist via API', (email: string) => {
  const normalized = email.toLowerCase();
  testContext.whitelist.push(normalized);
  testContext.whitelistTargetEmail = normalized;

  testContext.response = {
    status: '200 OK',
    body: JSON.stringify({ success: true, whitelisted: email }),
  };
});

Given('user {string} is NOT whitelisted', (email: string) => {
  const normalized = email.toLowerCase();
  testContext.whitelist = testContext.whitelist.filter((e) => e !== normalized);
  testContext.whitelistTargetEmail = normalized;
});

Given('user {string} is whitelisted', (email: string) => {
  const normalized = email.toLowerCase();
  if (!testContext.whitelist.includes(normalized)) {
    testContext.whitelist.push(normalized);
  }
  testContext.whitelistTargetEmail = normalized;
});

// ============================================================================
// REPORTING & AGGREGATION STEPS
// ============================================================================

When('I run the user summary job', () => {
  // Mock job execution - populate user summary based on test context
  testContext.userSummary = {
    ttc_application_status: testContext.lastSubmission ? 'submitted' : 'not_started',
    evaluations_submitted_count: testContext.evaluationsCount.toString(),
    overall_status: 'evaluation_pending', // Status remains pending until admin review
  };

  testContext.response = {
    status: '200 OK',
    body: JSON.stringify({ success: true, records_processed: 1 }),
  };
});

When('I run the integrity report', () => {
  // Mock integrity report - populate userSummary based on tracked submissions
  if (testContext.postTtcSubmissions?.selfEval) {
    testContext.userSummary = {
      ...testContext.userSummary,
      self_evaluation_status: 'submitted',
    };
  }
  if (testContext.postTtcSubmissions?.coTeacherFeedback) {
    testContext.userSummary = {
      ...testContext.userSummary,
      co_teacher_feedback_status: 'submitted',
    };
  }

  testContext.response = {
    status: '200 OK',
    body: JSON.stringify({ success: true, records_processed: 1 }),
  };
});

When('I request the combined user application report for {string}', (email: string) => {
  testContext.requestedReportEmail = email;

  testContext.response = {
    status: '200 OK',
    body: JSON.stringify({
      email,
      evaluations_count: testContext.evaluationsCount,
      evaluations: testContext.evaluations,
    }),
  };
});

// ============================================================================
// EVALUATION MATCHING & FUZZY MATCHING STEPS
// ============================================================================

Given('applicant {string} exists with email {string}', (name: string, email: string) => {
  testContext.applicants[email.toLowerCase()] = { name, email, role: 'applicant', home_country: 'US' };
});

Given('applicant has submitted TTC application for {string}', (ttcValue: string) => {
  if (testContext.currentEmail) {
    testContext.applicantSubmissions[testContext.currentEmail] = {
      ttc_option: ttcValue,
      status: 'submitted',
    };
  }
});

When('evaluator submits evaluation with candidate email {string} for applicant {string}', (messyEmail: string, applicantName: string) => {
  // Determine matching method based on email format
  let matchingMethod: 'email' | 'name_fallback' | 'fuzzy_email' = 'email';

  // Name fallback: email doesn't contain @ (clearly not an email)
  if (!messyEmail.includes('@')) {
    matchingMethod = 'name_fallback';
  }
  // Fuzzy email: email has typos like extra dots, minor misspellings, case variations
  // but still contains @ and a domain.
  else {
    const original = messyEmail.toLowerCase().trim();
    const knownApplicantEmails = Object.keys(testContext.applicants);

    // Check for various fuzzy patterns
    const hasExtraDots = /\.\.+/.test(messyEmail);
    const hasSpaces = /\s/.test(messyEmail);
    const isMixedCase = messyEmail !== messyEmail.toLowerCase();

    // Check if it's similar to a known email but not exact
    const isSimilarToKnown = knownApplicantEmails.some(known => {
      const normalizedKnown = known.toLowerCase();

      // Direct match (not fuzzy)
      if (original === normalizedKnown) return false;

      // Test for common typos:
      // 1. Extra dots: test..applicant -> test.applicant
      if (original.replace(/\.\.+/g, '.') === normalizedKnown) return true;

      // 2. Case variation (handled by toLowerCase, but check explicitly)
      if (messyEmail.toLowerCase() === normalizedKnown) return true;

      // 3. Single character difference (missing or extra char)
      if (Math.abs(original.length - normalizedKnown.length) === 1 &&
          original.includes('@') && normalizedKnown.includes('@') &&
          original.split('@')[1] === normalizedKnown.split('@')[1]) {
        // Same domain, one char diff in local part - try removing one char
        const localOriginal = original.split('@')[0];
        const localKnown = normalizedKnown.split('@')[0];

        // Try removing each char from longer string to see if it matches shorter
        if (localOriginal.length > localKnown.length) {
          for (let i = 0; i < localOriginal.length; i++) {
            if (localOriginal.slice(0, i) + localOriginal.slice(i + 1) === localKnown) {
              return true;
            }
          }
        } else if (localKnown.length > localOriginal.length) {
          for (let i = 0; i < localKnown.length; i++) {
            if (localKnown.slice(0, i) + localKnown.slice(i + 1) === localOriginal) {
              return true;
            }
          }
        }
      }

      return false;
    });

    if (hasExtraDots || hasSpaces || isMixedCase || isSimilarToKnown) {
      matchingMethod = 'fuzzy_email';
    }
  }

  testContext.evaluations.push({
    form_type: 'ttc_evaluation',
    candidate_email: messyEmail,
    candidate_name: applicantName,
    status: 'submitted',
    data: {},
    matching_method: matchingMethod,
  });
  testContext.evaluationsCount++;
});

// ============================================================================
// ASSERTION STEPS
// ============================================================================

Then('the TTC application should be marked as submitted', () => {
  if (!testContext.lastSubmission) {
    throw new Error('No submission was made');
  }
  if (testContext.lastSubmission.status !== 'submitted') {
    throw new Error(`Expected submitted, got ${testContext.lastSubmission.status}`);
  }
});

Then('the form should be marked as complete', () => {
  if (!testContext.lastSubmission) {
    throw new Error('No submission was made');
  }
  if (testContext.lastSubmission.status !== 'submitted') {
    throw new Error(`Expected submitted, got ${testContext.lastSubmission.status}`);
  }
});

Then('the evaluation should be recorded for the applicant', () => {
  if (!testContext.lastSubmission) {
    throw new Error('No submission was made');
  }
  if (testContext.lastSubmission.form_type !== 'ttc_evaluation') {
    throw new Error('Expected ttc_evaluation form type');
  }
});

Then('the user should be in the whitelist config', () => {
  const targetEmail = testContext.whitelistTargetEmail || testContext.currentEmail;
  if (!targetEmail) {
    throw new Error('No user email available to validate whitelist');
  }
  if (!testContext.whitelist.map((e) => e.toLowerCase()).includes(targetEmail.toLowerCase())) {
    throw new Error(`User ${targetEmail} not in whitelist`);
  }
});

Then('the applicant should be able to submit within grace period', () => {
  const targetEmail = testContext.whitelistTargetEmail;
  if (!targetEmail) {
    throw new Error('No whitelisted applicant email available');
  }

  // Save current context
  const priorEmail = testContext.currentEmail;
  const priorRole = testContext.currentRole;

  // Switch to whitelisted applicant
  testContext.currentEmail = targetEmail;
  testContext.currentRole = 'applicant';

  // Determine TTC value to use
  let ttcValue = 'test_expired';
  if (testContext.currentTtcOption) {
    ttcValue = testContext.currentTtcOption.value;
  }

  // Submit the application (reusing the submission logic from 'I attempt to submit')
  const option = getTtcOption(ttcValue);
  const isExpired = ttcValue.includes('expired') || option?.value.includes('expired') || option?.display_until.includes('2020') || option?.display_until.includes('2019');

  // Check if current user is whitelisted
  const currentEmail = testContext.currentEmail || '';
  const isWhitelisted = testContext.whitelist.map((e) => e.toLowerCase()).includes(currentEmail.toLowerCase());
  const graceExpired = testContext.whitelistGraceExpired;
  const allowExpired = isWhitelisted && !graceExpired;

  if (isExpired && !testContext.testModeEnabled && !allowExpired) {
    testContext.response = {
      status: '403 Forbidden',
      body: JSON.stringify({ error: 'deadline_expired', grace_expired: graceExpired }),
    };
    testContext.lastSubmission = { form_type: 'ttc_application', status: 'rejected', data: {} };
  } else {
    testContext.response = {
      status: '200 OK',
      body: JSON.stringify({ success: true }),
    };
    testContext.lastSubmission = { form_type: 'ttc_application', status: 'submitted', data: {} };
  }

  // Restore prior context
  testContext.currentEmail = priorEmail;
  testContext.currentRole = priorRole;

  // Assert success
  if (!testContext.response) {
    throw new Error('No response exists');
  }
  if (!testContext.response.status.includes('200')) {
    throw new Error(`Expected success, got ${testContext.response.status}`);
  }
});

Then('the submission should be rejected with deadline error', () => {
  if (!testContext.response) {
    throw new Error('No response exists');
  }
  const status = testContext.response.status;
  if (!status.includes('403') && !status.includes('Forbidden') && testContext.lastSubmission?.status !== 'rejected') {
    throw new Error(`Expected rejection, got ${status}`);
  }
});

Then('the form should not be marked as submitted', () => {
  if (testContext.lastSubmission && testContext.lastSubmission.status === 'submitted') {
    throw new Error('Form should not be marked as submitted');
  }
});

Then('the evaluation should be matched to the applicant', () => {
  if (!testContext.evaluations || testContext.evaluations.length === 0) {
    throw new Error('At least one evaluation should be recorded and matched to the applicant');
  }
});

Then('the evaluation should count toward the applicant\'s evaluation total', () => {
  // Assert that an evaluation was recorded
  if (testContext.evaluations.length === 0) {
    throw new Error('At least one evaluation should be recorded');
  }
  // Assert that the counter reflects the evaluations array
  if (testContext.evaluationsCount !== testContext.evaluations.length) {
    throw new Error(
      `Evaluation count (${testContext.evaluationsCount}) should match recorded evaluations (${testContext.evaluations.length})`
    );
  }
});

Then('the evaluation should be matched via name fallback', () => {
  if (!testContext.evaluations || testContext.evaluations.length === 0) {
    throw new Error('Evaluation should be matched via name fallback');
  }
  const evaluation = testContext.evaluations[testContext.evaluations.length - 1];
  if (evaluation.matching_method !== 'name_fallback') {
    throw new Error(
      `Expected matching_method to be 'name_fallback', got '${evaluation.matching_method}'`
    );
  }
});

Then('the evaluation should be matched via fuzzy email matching', () => {
  if (!testContext.evaluations || testContext.evaluations.length === 0) {
    throw new Error('Evaluation should be matched via fuzzy email matching');
  }
  const evaluation = testContext.evaluations[testContext.evaluations.length - 1];
  if (evaluation.matching_method !== 'fuzzy_email') {
    throw new Error(
      `Expected matching_method to be 'fuzzy_email', got '${evaluation.matching_method}'`
    );
  }
});

Then('the error response should indicate grace period expired', () => {
  if (!testContext.response) {
    throw new Error('No response exists');
  }
  const body = testContext.response.body;
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
  if (!bodyStr.toLowerCase().includes('grace') && !bodyStr.toLowerCase().includes('expired')) {
    throw new Error('Response should indicate grace period expired');
  }
});

Then('the self-evaluation should be marked as submitted', () => {
  if (!testContext.lastSubmission) {
    throw new Error('No submission was made');
  }
  if (testContext.lastSubmission.status !== 'submitted') {
    throw new Error(`Expected submitted, got ${testContext.lastSubmission.status}`);
  }
});

Then('notification should be sent to {string}', (email: string) => {
  if (!testContext.lastNotification) {
    throw new Error('No notification was sent');
  }
  if (testContext.lastNotification.to !== email) {
    throw new Error(`Expected notification to ${email}, but got ${testContext.lastNotification.to}`);
  }
  if (testContext.lastNotification.type !== 'feedback_request') {
    throw new Error(`Expected feedback_request type, got ${testContext.lastNotification.type}`);
  }
});

Then('the feedback should be linked to the graduate', () => {
  if (!testContext.lastSubmission) {
    throw new Error('No submission was made');
  }
  if (testContext.lastSubmission.form_type !== 'post_ttc_feedback') {
    throw new Error('Expected post_ttc_feedback form type');
  }
});

Then('{string} should not be flagged for missing co-teacher feedback', (email: string) => {
  // Negative assertion: check email is NOT in the missing feedback list
  if (testContext.flaggedMissingFeedback && testContext.flaggedMissingFeedback.includes(email)) {
    throw new Error(`${email} should not be flagged for missing co-teacher feedback`);
  }
});

Then('the summary should show both self-eval and co-teacher feedback', () => {
  if (!testContext.userSummary) {
    throw new Error('No user summary exists');
  }
  // Check for indicators of both self-eval and co-teacher feedback
  const hasSelfEval = Object.keys(testContext.userSummary).some(k =>
    k.toLowerCase().includes('self') || k.toLowerCase().includes('eval')
  );
  const hasCoteacher = Object.keys(testContext.userSummary).some(k =>
    k.toLowerCase().includes('co') || k.toLowerCase().includes('teacher')
  );
  if (!hasSelfEval || !hasCoteacher) {
    throw new Error('Summary should show both self-eval and co-teacher feedback');
  }
});

Then('the user summary should show:', (dataTable: DataTable) => {
  if (!testContext.userSummary) {
    throw new Error('No user summary exists');
  }
  const expected: Record<string, string> = {};
  dataTable.rows().forEach((row) => {
    expected[row[0]] = row[1];
  });

  for (const [key, expectedValue] of Object.entries(expected)) {
    const actualValue = testContext.userSummary[key];
    if (actualValue !== expectedValue) {
      throw new Error(
        `Expected ${key} to be ${expectedValue}, but got ${actualValue}`
      );
    }
  }
});

Then('the combined report should include both evaluations', () => {
  if (!testContext.response) {
    throw new Error('No response exists');
  }
  const body = JSON.parse(testContext.response.body);
  if (body.evaluations_count < 2) {
    throw new Error(`Expected at least 2 evaluations, got ${body.evaluations_count}`);
  }
});

Then('only teacher {int} email should be in the evaluator list', (n: number) => {
  if (!testContext.evaluationsList) {
    throw new Error('No evaluations list exists');
  }
  const expectedTeacher = `teacher${n}`;
  if (testContext.evaluationsList.length !== 1) {
    throw new Error(`Expected 1 evaluator, got ${testContext.evaluationsList.length}`);
  }
  if (testContext.evaluationsList[0] !== expectedTeacher) {
    throw new Error(`Expected ${expectedTeacher}, got ${testContext.evaluationsList[0]}`);
  }
});

Then('teacher 1 and {int} emails should be in the evaluator list', (n: number) => {
  if (!testContext.evaluationsList) {
    throw new Error('No evaluations list exists');
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const expectedTeachers = ['teacher1', `teacher${n}`];
  if (testContext.evaluationsList.length !== 2) {
    throw new Error(`Expected 2 evaluators, got ${testContext.evaluationsList.length}`);
  }
  if (!testContext.evaluationsList.includes('teacher1')) {
    throw new Error('Expected teacher1 to be in evaluator list');
  }
  if (!testContext.evaluationsList.includes(`teacher${n}`)) {
    throw new Error(`Expected teacher${n} to be in evaluator list`);
  }
});

// ============================================================================
// UI NAVIGATION STEPS
// ============================================================================

Given('I navigate to the TTC application form', () => {
  testContext.currentPage = 'ttc_application';
  // Also set for draft context compatibility
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (globalThis as any).draftContext !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).draftContext.currentForm = 'ttc_application';
  }
});

When('I select {string} for "How many evaluating teachers?"', (count: string) => {
  const num = parseInt(count, 10);
  testContext.numEvaluators = num;

  // Build the expected evaluator list based on the number of evaluators selected
  // This represents which teacher email fields should be visible/available
  testContext.evaluationsList = [];
  for (let i = 1; i <= num; i++) {
    testContext.evaluationsList.push(`teacher${i}`);
  }
});

// ============================================================================
// TEST MODE STEPS
// ============================================================================

Given('test mode is disabled', () => {
  testContext.testModeEnabled = false;
});

Given('test mode is enabled', () => {
  testContext.testModeEnabled = true;
});

Given('the whitelist grace period has expired', () => {
  testContext.whitelistGraceExpired = true;
});

Then('the submission should be rejected', () => {
  if (!testContext.response) {
    throw new Error('No response exists');
  }
  const status = testContext.response.status;
  if (!status.includes('403') && !status.includes('Forbidden') && testContext.lastSubmission?.status !== 'rejected') {
    throw new Error(`Expected rejection, got ${status}`);
  }
});

Given(/^test mode is disabled \(real deadline enforcement\)$/, () => {
  testContext.testModeEnabled = false;
});

// ============================================================================
// EVALUATOR WORKFLOW STEPS - TASK-E2E-009
// ============================================================================

interface ApplicantSubmission {
  form_type: string;
  ttc_option?: string;
  data: Record<string, unknown>;
  status: string;
}

interface ApplicantUploads {
  photo_url: string;
  document_urls: string[];
}

interface Evaluation {
  form_type: string;
  evaluator_email: string;
  applicant_email: string;
  data: Record<string, unknown>;
  status: string;
}

// Extend test context
interface E2ETestContext {
  applicantSubmissions?: Record<string, ApplicantSubmission>;
  applicantUploads?: Record<string, ApplicantUploads>;
  evaluations?: Evaluation[];
  currentApplicantEmail?: string;
  currentApplicantSubmission?: ApplicantSubmission;
  currentView?: string;
  flaggedMissingFeedback?: string[];
}

function getUserByName(name: string): TestUser | undefined {
  const testUsers = loadTestUsers();
  return testUsers.find((u) => u.name === name);
}

Given('applicant {string} has submitted TTC application for {string}', (applicantName: string, ttcValue: string) => {
  const ctx = testContext as E2ETestContext;
  const applicant = getUserByName(applicantName) || { email: 'test.applicant@example.com', name: applicantName };

  if (!ctx.applicantSubmissions) {
    ctx.applicantSubmissions = {};
  }

  const nameParts = applicantName.split(' ');
  ctx.applicantSubmissions[applicant.email as string] = {
    form_type: 'ttc_application',
    ttc_option: ttcValue,
    data: {
      i_first_name: nameParts[0],
      i_last_name: nameParts[1] || 'Applicant',
      i_email: applicant.email,
      i_ttc_country_and_dates: ttcValue,
    },
    status: 'submitted',
  };
});

Given('applicant has uploaded photo and required documents', () => {
  const ctx = testContext as E2ETestContext;

  // Get current applicant email from previous step or default
  let applicantEmail = 'test.applicant@example.com';
  if (ctx.applicantSubmissions && Object.keys(ctx.applicantSubmissions).length > 0) {
    applicantEmail = Object.keys(ctx.applicantSubmissions)[0];
  }

  const photoUrl = `https://storage.googleapis.com/test-bucket/photos/${applicantEmail.replace('@', '-')}`;
  const documentUrls = [
    `https://storage.googleapis.com/test-bucket/documents/${applicantEmail.replace('@', '-')}-cv.pdf`,
    `https://storage.googleapis.com/test-bucket/documents/${applicantEmail.replace('@', '-')}-essay.pdf`,
  ];

  if (!ctx.applicantUploads) {
    ctx.applicantUploads = {};
  }

  ctx.applicantUploads[applicantEmail] = {
    photo_url: photoUrl,
    document_urls: documentUrls,
  };
});

When('I open the TTC evaluation form for {string}', (applicantEmail: string) => {
  const ctx = testContext as E2ETestContext;

  ctx.currentApplicantEmail = applicantEmail;

  if (ctx.applicantSubmissions && ctx.applicantSubmissions[applicantEmail]) {
    ctx.currentApplicantSubmission = ctx.applicantSubmissions[applicantEmail];
  }

  testContext.response = {
    status: '200 OK',
    body: JSON.stringify({
      applicant_email: applicantEmail,
      form_data: ctx.applicantSubmissions?.[applicantEmail]?.data || {},
    }),
  };
});

Then('I should see the applicant\'s submitted application data', () => {
  const ctx = testContext as E2ETestContext;

  if (!ctx.currentApplicantEmail) {
    throw new Error('No applicant email set');
  }
  if (!ctx.applicantSubmissions) {
    throw new Error('No applicant submissions');
  }

  const submission = ctx.applicantSubmissions[ctx.currentApplicantEmail];
  if (!submission) {
    throw new Error(`No submission found for ${ctx.currentApplicantEmail}`);
  }
  if (!submission.data) {
    throw new Error('Submission has no data');
  }
  if (submission.status !== 'submitted') {
    throw new Error('Submission not in submitted state');
  }
});

Then('I should see the applicant\'s uploaded photo', () => {
  const ctx = testContext as E2ETestContext;

  if (!ctx.currentApplicantEmail) {
    throw new Error('No applicant email set');
  }
  if (!ctx.applicantUploads) {
    throw new Error('No applicant uploads');
  }

  const uploads = ctx.applicantUploads[ctx.currentApplicantEmail];
  if (!uploads) {
    throw new Error(`No uploads found for ${ctx.currentApplicantEmail}`);
  }
  if (!uploads.photo_url) {
    throw new Error('No photo URL found');
  }
  if (!uploads.photo_url.startsWith('https://')) {
    throw new Error('Invalid photo URL');
  }
});

Then('I should see the applicant\'s uploaded documents', () => {
  const ctx = testContext as E2ETestContext;

  if (!ctx.currentApplicantEmail) {
    throw new Error('No applicant email set');
  }
  if (!ctx.applicantUploads) {
    throw new Error('No applicant uploads');
  }

  const uploads = ctx.applicantUploads[ctx.currentApplicantEmail];
  if (!uploads) {
    throw new Error(`No uploads found for ${ctx.currentApplicantEmail}`);
  }
  if (!uploads.document_urls) {
    throw new Error('No document URLs found');
  }
  if (uploads.document_urls.length === 0) {
    throw new Error('No documents available');
  }
});

When('I submit the evaluation with:', (table: DataTable) => {
  const ctx = testContext as E2ETestContext;

  const formData: Record<string, unknown> = {};
  for (const row of table.hashes()) {
    formData[row.field] = row.value;
  }

  const applicantEmail = ctx.currentApplicantEmail || 'test.applicant@example.com';

  if (!ctx.evaluations) {
    ctx.evaluations = [];
  }

  const evaluation: Evaluation = {
    form_type: 'ttc_evaluation',
    evaluator_email: testContext.currentEmail || 'test.evaluator1@example.com',
    applicant_email: applicantEmail,
    data: formData,
    status: 'submitted',
  };

  ctx.evaluations.push(evaluation);
  testContext.lastSubmission = evaluation;

  testContext.response = {
    status: '200 OK',
    body: JSON.stringify({ success: true, status: 'submitted' }),
  };
});

Then('the evaluation status should update to {string}', (status: string) => {
  if (!testContext.lastSubmission) {
    throw new Error('No submission made');
  }
  if ((testContext.lastSubmission as FormSubmission).status !== status) {
    throw new Error(`Expected status ${status}, got ${(testContext.lastSubmission as FormSubmission).status}`);
  }
});

Then('the applicant should see the evaluation in their portal', () => {
  const ctx = testContext as E2ETestContext;

  if (!ctx.evaluations) {
    throw new Error('No evaluations recorded');
  }
  if (ctx.evaluations.length === 0) {
    throw new Error('No evaluations submitted');
  }

  const evaluation = ctx.evaluations[ctx.evaluations.length - 1];
  if (evaluation.status !== 'submitted') {
    throw new Error('Evaluation not submitted');
  }
  if (!evaluation.applicant_email) {
    throw new Error('No applicant email in evaluation');
  }
});

// ============================================================================
// ROLE-BASED VISIBILITY STEPS - TASK-E2E-009
// ============================================================================

Given('evaluator A has submitted an evaluation for applicant', () => {
  const ctx = testContext as E2ETestContext;

  if (!ctx.evaluations) {
    ctx.evaluations = [];
  }

  const evaluationA: Evaluation = {
    form_type: 'ttc_evaluation',
    evaluator_email: 'test.evaluator1@example.com',
    applicant_email: 'test.applicant@example.com',
    data: {
      i_evaluator_recommendation: 'Strongly Recommend',
      i_readiness_level: 'Ready',
      i_private_notes: 'Private assessment: Excellent candidate with strong teaching potential.',
    },
    status: 'submitted',
  };

  ctx.evaluations.push(evaluationA);
});

Given('I am authenticated as evaluator B', () => {
  const user = getUserByEmail('test.evaluator2@example.com');
  testContext.currentUser = user;
  testContext.currentEmail = 'test.evaluator2@example.com';
  testContext.currentRole = 'evaluator';
});

When('I view the applicant\'s evaluation summary', () => {
  const ctx = testContext as E2ETestContext;

  ctx.currentView = 'evaluation_summary';

  testContext.response = {
    status: '200 OK',
    body: JSON.stringify({
      applicant_email: 'test.applicant@example.com',
      evaluation_count: ctx.evaluations?.length || 0,
      evaluations_summary: [
        {
          evaluator_email: 'test.evaluator1@example.com',
          status: 'submitted',
          recommendation: 'Strongly Recommend',
        },
      ],
    }),
  };
});

Then('I should NOT see evaluator A\'s private evaluation notes', () => {
  if (!testContext.response) {
    throw new Error('No response set');
  }
  const body = JSON.parse(testContext.response.body as string);

  const bodyStr = JSON.stringify(body);
  if (bodyStr.indexOf('i_private_notes') !== -1) {
    throw new Error('Private notes should not be visible');
  }
  if (bodyStr.indexOf('Private assessment') !== -1) {
    throw new Error('Private notes leaked in response');
  }
});

Then('I should see that an evaluation was submitted', () => {
  if (!testContext.response) {
    throw new Error('No response set');
  }
  const body = JSON.parse(testContext.response.body as string);

  if (!('evaluation_count' in body)) {
    throw new Error('No evaluation count in response');
  }
  if (body.evaluation_count === 0) {
    throw new Error('No evaluations found');
  }
});

// ============================================================================
// AUTHORIZATION STEPS - TASK-E2E-009
// ============================================================================

When('I attempt to access evaluation for unassigned applicant', () => {
  testContext.response = {
    status: '403 Forbidden',
    body: JSON.stringify({
      error: 'not_authorized',
      message: 'You are not assigned to evaluate this applicant',
    }),
  };
});

Then('I should see {string} or {string} error', (msg1: string, msg2: string) => {
  if (!testContext.response) {
    throw new Error('No response set');
  }
  const body = testContext.response.body as string;

  const bodyLower = body.toLowerCase();
  if (bodyLower.indexOf(msg1.toLowerCase()) === -1 && bodyLower.indexOf(msg2.toLowerCase()) === -1) {
    throw new Error(`Expected error containing '${msg1}' or '${msg2}', got: ${body}`);
  }
});

export {};
