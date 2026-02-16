/**
 * Certificate generation step definitions with completion gating.
 */

import { DataTable, Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { TEST_ISO_DATE } from './test-data.js';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ApplicantRequirements {
  ttc_application: string;
  ttc_evaluation_count: number;
  post_ttc_self_eval: string;
  post_ttc_feedback: string;
  name: string;
  completion_date?: string;
}

type CertificateWorld = {
  // Certificate request state
  certificateRequestEmail?: string;
  certificateStatus?: number;
  certificateError?: string;
  certificateBody?: string;
  certificateAppName?: string;
  certificateAppDate?: string;
  certificateContentType?: string;

  // Applicant requirements tracking
  applicantRequirements: Record<string, ApplicantRequirements>;

  // Current user context (shared with e2e_api_steps)
  currentEmail?: string;
  currentRole?: string;
};

function getWorld(world: unknown): CertificateWorld {
  return world as CertificateWorld;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getApplicantRequirements(world: CertificateWorld, email?: string): ApplicantRequirements {
  const applicantEmail = email || world.currentEmail || 'test.applicant@example.com';

  // Initialize applicantRequirements if not exists
  if (!world.applicantRequirements) {
    world.applicantRequirements = {};
  }

  if (!world.applicantRequirements[applicantEmail]) {
    // Default incomplete state
    world.applicantRequirements[applicantEmail] = {
      ttc_application: 'not_submitted',
      ttc_evaluation_count: 0,
      post_ttc_self_eval: 'not_submitted',
      post_ttc_feedback: 'not_submitted',
      name: 'Test Applicant',
      completion_date: undefined,
    };
  }

  return world.applicantRequirements[applicantEmail];
}

function checkCompletionStatus(
  reqs: ApplicantRequirements
): { isComplete: boolean; blockingReason: string | null } {
  const evalCount = reqs.ttc_evaluation_count;

  if (reqs.ttc_application !== 'submitted') {
    return { isComplete: false, blockingReason: 'Missing TTC application submission' };
  }

  if (evalCount < 2) {
    return {
      isComplete: false,
      blockingReason: `Missing evaluations (${evalCount}/2 required)`,
    };
  }

  if (reqs.post_ttc_self_eval !== 'submitted') {
    return { isComplete: false, blockingReason: 'Missing post-TTC self-evaluation' };
  }

  if (reqs.post_ttc_feedback !== 'submitted') {
    return { isComplete: false, blockingReason: 'Missing co-teacher feedback' };
  }

  return { isComplete: true, blockingReason: null };
}

// ============================================================================
// GIVEN STEPS - Setup Completion Status
// ============================================================================

// Step without colon (for backward compatibility)
Given('applicant has completed all TTC requirements', function (this: unknown, dataTable: DataTable) {
  const world = getWorld(this);
  world.currentEmail = 'test.applicant@example.com';
  const reqs = getApplicantRequirements(world);

  // Process the table data
  dataTable.hashes().forEach((row) => {
    const requirement = row.requirement as string;
    const status = row.status as string;

    switch (requirement) {
      case 'ttc_application':
        reqs.ttc_application = status;
        break;
      case 'ttc_evaluation_count':
        reqs.ttc_evaluation_count = parseInt(status, 10);
        break;
      case 'post_ttc_self_eval':
        reqs.post_ttc_self_eval = status;
        break;
      case 'post_ttc_feedback':
        reqs.post_ttc_feedback = status;
        break;
    }
  });

  // Set completion date if all requirements met
  const { isComplete } = checkCompletionStatus(reqs);
  if (isComplete) {
    reqs.completion_date = TEST_ISO_DATE;
  }
});

// Step with colon (for table data)
Given('applicant has completed all TTC requirements:', function (this: unknown, dataTable: DataTable) {
  const world = getWorld(this);
  world.currentEmail = 'test.applicant@example.com';
  const reqs = getApplicantRequirements(world);

  // Process the table data
  dataTable.hashes().forEach((row) => {
    const requirement = row.requirement as string;
    const status = row.status as string;

    switch (requirement) {
      case 'ttc_application':
        reqs.ttc_application = status;
        break;
      case 'ttc_evaluation_count':
        reqs.ttc_evaluation_count = parseInt(status, 10);
        break;
      case 'post_ttc_self_eval':
        reqs.post_ttc_self_eval = status;
        break;
      case 'post_ttc_feedback':
        reqs.post_ttc_feedback = status;
        break;
    }
  });

  // Set completion date if all requirements met
  const { isComplete } = checkCompletionStatus(reqs);
  if (isComplete) {
    reqs.completion_date = TEST_ISO_DATE;
  }
});

Given('applicant has submitted TTC application', function (this: unknown) {
  const world = getWorld(this);
  world.currentEmail = 'test.applicant@example.com';
  const reqs = getApplicantRequirements(world);
  reqs.ttc_application = 'submitted';
});

Given(/^applicant has only (\d+) evaluation \(requires (\d+)\)$/, function (this: unknown, currentEval: string, _requiredEval: string) {
  const world = getWorld(this);
  world.currentEmail = 'test.applicant@example.com';
  const reqs = getApplicantRequirements(world);
  reqs.ttc_application = 'submitted';
  reqs.ttc_evaluation_count = parseInt(currentEval, 10); // Below required 2
  reqs.post_ttc_self_eval = 'submitted';
  reqs.post_ttc_feedback = 'submitted';
});

Given('applicant has completed TTC and evaluations', function (this: unknown) {
  const world = getWorld(this);
  world.currentEmail = 'test.applicant@example.com';
  const reqs = getApplicantRequirements(world);
  reqs.ttc_application = 'submitted';
  reqs.ttc_evaluation_count = 2; // Meets requirement
  reqs.post_ttc_self_eval = 'submitted';
  // post_ttc_feedback left as 'not_submitted' - will be set by next step
});

Given('post-TTC co-teacher feedback is missing', function (this: unknown) {
  const world = getWorld(this);
  const reqs = getApplicantRequirements(world);
  reqs.post_ttc_feedback = 'not_submitted';
});

// ============================================================================
// WHEN STEPS - Certificate Request
// ============================================================================

When('I request a certificate PDF for {string}', function (this: unknown, email: string) {
  const world = getWorld(this);
  world.certificateRequestEmail = email;

  // Get applicant requirements
  const reqs = getApplicantRequirements(world, email);

  // Check completion status
  const { isComplete, blockingReason } = checkCompletionStatus(reqs);

  if (isComplete) {
    // Generate mock certificate PDF
    world.certificateStatus = 200;
    // Remove error attribute if it exists
    delete world.certificateError;

    // Include applicant data in PDF
    const applicantName = reqs.name || 'Test Applicant';
    const completionDate = reqs.completion_date || TEST_ISO_DATE;

    // Mock PDF content with applicant data
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 123
>>
stream
BT
/F1 12 Tf
50 700 Td
(Certificate of Completion) Tj
0 -20 Td
(This certifies that ${applicantName}) Tj
0 -20 Td
(has completed TTC on ${completionDate}) Tj
ET
endstream
endobj
endobj
%%EOF`;

    world.certificateBody = pdfContent;
    world.certificateAppName = applicantName;
    world.certificateAppDate = completionDate;
    world.certificateContentType = 'application/pdf';
  } else {
    // Block with error
    world.certificateStatus = 400;
    world.certificateError = blockingReason!;
    world.certificateBody = undefined;
  }
});

// ============================================================================
// THEN STEPS - Assertions
// ============================================================================

Then('the certificate should include the applicant\'s name', function (this: unknown) {
  const world = getWorld(this);
  assert.ok(
    world.certificateAppName !== undefined,
    'Certificate not generated or applicant name not set'
  );
  assert.ok(world.certificateAppName, 'Applicant name should not be empty');

  // Verify name is in the PDF content
  if (world.certificateBody) {
    assert.ok(
      world.certificateBody.includes(world.certificateAppName),
      'Applicant name should be in certificate PDF content'
    );
  }
});

Then('the certificate should include the TTC completion date', function (this: unknown) {
  const world = getWorld(this);
  assert.ok(
    world.certificateAppDate !== undefined,
    'Certificate not generated or completion date not set'
  );
  assert.ok(world.certificateAppDate, 'Completion date should not be empty');

  // Verify date is in the PDF content
  if (world.certificateBody) {
    assert.ok(
      world.certificateBody.includes(world.certificateAppDate),
      'Completion date should be in certificate PDF content'
    );
  }
});

Then('certificate generation should be blocked', function (this: unknown) {
  const world = getWorld(this);
  assert.ok(
    world.certificateStatus !== undefined,
    'Certificate request was not executed'
  );

  // Should have non-200 status
  assert.notStrictEqual(
    world.certificateStatus,
    200,
    'Certificate generation should be blocked but returned status 200'
  );

  // Should have an error reason
  assert.ok(
    world.certificateError !== undefined,
    'Blocking reason should be set'
  );
  assert.ok(
    world.certificateError !== null,
    'Blocking reason should not be null'
  );
});

Then('I should see the reason: {string}', function (this: unknown, expectedMessage: string) {
  const world = getWorld(this);
  assert.ok(
    world.certificateError !== undefined,
    'No error message was set'
  );

  assert.strictEqual(
    world.certificateError,
    expectedMessage,
    `Expected error "${expectedMessage}" but got "${world.certificateError}"`
  );
});
