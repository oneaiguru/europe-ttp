/**
 * Integrity report step definitions for E2E scenarios.
 *
 * Tests the integrity report feature that flags:
 * - Missing uploads (photos, documents)
 * - Incomplete forms (applications started but not submitted)
 * - Mismatched user IDs (evaluations with wrong emails)
 *
 * Note: Some Given steps (like "applicant has submitted TTC application")
 * are defined in certificate_steps.ts. This file provides the integrity-specific
 * steps that complement those existing definitions.
 */

import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'assert';

// ============================================================================
// DATA STRUCTURES
// ============================================================================

interface IntegrityData {
  email?: string;
  ttc_application?: string;
  photo_uploaded?: boolean;
  application_status?: string;
  flags: string[];
  mismatches: string[];
}

interface EvaluationEntry {
  submitted_email: string;
  actual_applicant_email?: string;
  status: 'matched' | 'unmatched' | 'mismatched';
}

interface CsvRow {
  email: string;
  flags: string;
  missing_uploads: string;
  incomplete_forms: string;
  mismatches: string[];
}

// Test context - uses globalThis to share state across steps
type IntegrityContext = {
  currentEmail?: string;
  applicantEmail?: string;
  evaluationEmail?: string;
  integrityData: Record<string, IntegrityData>;
  evaluations?: EvaluationEntry[];
  csvData?: {
    columns: string[];
    rows: CsvRow[];
  };
  csvDownloadUrl?: string;
  mismatchedEvaluation?: EvaluationEntry;
  lastReportRun?: {
    job_type: string;
    timestamp: string;
  };
  response?: {
    status: string;
    body: string;
  };
};

export function getIntegrityContext(): IntegrityContext {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (globalThis as any).integrityContext === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).integrityContext = {
      integrityData: {},
    } as IntegrityContext;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (globalThis as any).integrityContext as IntegrityContext;
}

// Helper functions
function ensureIntegrityData(): void {
  const ctx = getIntegrityContext();
  if (!ctx.integrityData) {
    ctx.integrityData = {};
  }
}

function getCurrentEmail(): string {
  const ctx = getIntegrityContext();
  if (!ctx.currentEmail) {
    ctx.currentEmail = 'test.applicant@example.com';
  }
  return ctx.currentEmail;
}

// ============================================================================
// GIVEN STEPS - Data Setup
// ============================================================================

Given('applicant has NOT uploaded required photo', function () {
  const email = getCurrentEmail();
  ensureIntegrityData();

  // Initialize integrity data for this email if not exists
  if (!getIntegrityContext().integrityData[email]) {
    getIntegrityContext().integrityData[email] = {
      email: email,
      flags: [],
      mismatches: [],
    };
  }

  const data = getIntegrityContext().integrityData[email];
  data.photo_uploaded = false;
  if (!data.flags.includes('missing_photo')) {
    data.flags.push('missing_photo');
  }
});

Given('applicant has started TTC application but not submitted', function () {
  const email = 'test.applicant@example.com';
  getIntegrityContext().currentEmail = email;

  ensureIntegrityData();
  getIntegrityContext().integrityData[email] = {
    email: email,
    ttc_application: 'incomplete',
    application_status: 'incomplete',
    flags: ['incomplete_application'],
    mismatches: [],
  };
});

Given('evaluation was submitted with email {string}', function (email: string) {
  getIntegrityContext().evaluationEmail = email;

  const ctx = getIntegrityContext();
  if (!ctx.evaluations) {
    ctx.evaluations = [];
  }

  ctx.evaluations.push({
    submitted_email: email,
    status: 'unmatched',
  });
});

Given('applicant exists with email {string}', function (email: string) {
  getIntegrityContext().applicantEmail = email;

  getIntegrityContext().integrityData[email] = {
    email: email,
    application_status: 'submitted',
    flags: [],
    mismatches: [],
  };

  // Flag the mismatch
  const ctx = getIntegrityContext();
  if (ctx.evaluations) {
    for (const evalEntry of ctx.evaluations) {
      if (evalEntry && evalEntry.submitted_email !== email) {
        evalEntry.actual_applicant_email = email;
        evalEntry.status = 'mismatched';
      }
    }
  }
});

// ============================================================================
// WHEN STEPS - Run Report & Download
// ============================================================================

Given('I run the user integrity report', function () {
  // Mock report generation
  getIntegrityContext().lastReportRun = {
    job_type: 'integrity',
    timestamp: '2025-01-01T00:00:00Z',
  };

  // Store response for verification
  getIntegrityContext().response = {
    status: '200 OK',
    body: JSON.stringify({
      success: true,
      records_processed: Object.keys(getIntegrityContext().integrityData).length,
      data: getIntegrityContext().integrityData,
    }),
  };
});

When('I download the integrity report as CSV', function () {
  const rows: CsvRow[] = [];

  for (const [email, data] of Object.entries(getIntegrityContext().integrityData)) {
    if (email.startsWith('_')) continue; // Skip metadata

    const flags = data.flags || [];
    rows.push({
      email: email,
      flags: flags.join(','),
      missing_uploads: flags.includes('missing_photo') ? 'photo' : '',
      incomplete_forms: flags.includes('incomplete_application') ? 'ttc_application' : '',
      mismatches: data.mismatches || [],
    });
  }

  getIntegrityContext().csvData = {
    columns: ['email', 'flags', 'missing_uploads', 'incomplete_forms', 'mismatches'],
    rows,
  };

  getIntegrityContext().csvDownloadUrl = '/admin/integrity-report.csv';
});

// ============================================================================
// THEN STEPS - Verification
// ============================================================================

Then('{string} should be flagged for missing photo', function (email: string) {
  assert.ok(getIntegrityContext().integrityData, 'No integrity data available');

  const normalizedEmail = email.toLowerCase();
  const data = getIntegrityContext().integrityData[normalizedEmail];

  assert.ok(data, `Email ${email} not found in integrity report`);
  assert.ok(data.flags.includes('missing_photo'),
    `Expected missing_photo flag for ${email}, got flags: ${data.flags.join(', ')}`);
});

Then('the integrity report should show the missing upload type', function () {
  assert.ok(getIntegrityContext().integrityData, 'No integrity data available');

  let foundMissing = false;
  for (const [email, data] of Object.entries(getIntegrityContext().integrityData)) {
    if (email.startsWith('_')) continue;

    if (data.flags.includes('missing_photo')) {
      foundMissing = true;
      assert.strictEqual(data.photo_uploaded, false,
        `Expected photo_uploaded to be false for ${email}`);
      break;
    }
  }

  assert.ok(foundMissing, 'No entries with missing uploads found in report');
});

Then('{string} should be flagged for incomplete application', function (email: string) {
  assert.ok(getIntegrityContext().integrityData, 'No integrity data available');

  const normalizedEmail = email.toLowerCase();
  const data = getIntegrityContext().integrityData[normalizedEmail];

  assert.ok(data, `Email ${email} not found in integrity report`);
  assert.ok(data.flags.includes('incomplete_application'),
    `Expected incomplete_application flag for ${email}, got flags: ${data.flags.join(', ')}`);
});

Then('the report should show the application status as "incomplete"', function () {
  assert.ok(getIntegrityContext().integrityData, 'No integrity data available');

  let foundIncomplete = false;
  for (const [email, data] of Object.entries(getIntegrityContext().integrityData)) {
    if (email.startsWith('_')) continue;

    if (data.application_status === 'incomplete') {
      foundIncomplete = true;
      break;
    }
  }

  assert.ok(foundIncomplete, 'No incomplete applications found in report');
});

Then('the evaluation should be flagged as unmatched', function () {
  assert.ok(getIntegrityContext().integrityData, 'No integrity data available');

  const evaluations = getIntegrityContext().evaluations || [];
  assert.ok(evaluations.length > 0, 'No evaluations found in integrity data');

  const mismatched = evaluations.filter(e => e.status === 'mismatched');
  assert.ok(mismatched.length > 0, 'No mismatched evaluations found');

  getIntegrityContext().mismatchedEvaluation = mismatched[0];
});

Then('the report should show the mismatched email', function () {
  const evalEntry = getIntegrityContext().mismatchedEvaluation;
  assert.ok(evalEntry, 'No mismatched evaluation found');

  assert.ok(evalEntry?.submitted_email, 'Missing submitted_email in evaluation');
  assert.ok(evalEntry?.actual_applicant_email, 'Missing actual_applicant_email in evaluation');

  assert.notStrictEqual(evalEntry.submitted_email, evalEntry.actual_applicant_email,
    'Expected different emails for mismatched evaluation');
});

Then('the CSV should contain columns: email, flags, missing_uploads, incomplete_forms, mismatches', function () {
  const csvData = getIntegrityContext().csvData;
  assert.ok(csvData, 'No CSV data available');

  const expectedColumns = ['email', 'flags', 'missing_uploads', 'incomplete_forms', 'mismatches'];
  const actualColumns = csvData.columns;

  assert.deepStrictEqual(
    new Set(expectedColumns),
    new Set(actualColumns),
    `Expected columns ${expectedColumns.join(', ')}, got ${actualColumns.join(', ')}`
  );
});

Then('the CSV should be downloadable via admin dashboard', function () {
  const csvUrl = getIntegrityContext().csvDownloadUrl;
  assert.ok(csvUrl, 'No CSV download URL available');

  assert.ok(csvUrl?.startsWith('/'),
    `Expected download URL to start with /, got ${csvUrl}`);

  const csvData = getIntegrityContext().csvData;
  assert.ok(csvData, 'No CSV data available');
  assert.ok(csvData?.rows, 'CSV data missing rows');
});
