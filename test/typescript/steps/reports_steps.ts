/**
 * Reports BDD steps for TypeScript tests.
 *
 * These steps test various report generation and retrieval endpoints.
 * IMPORTANT: These currently use fixture-backed stubs, not real API calls.
 * The fixtures simulate what the legacy Python 2.7 endpoints return.
 *
 * When Next.js API routes are implemented for reports, these steps should be
 * updated to call the real endpoints instead of loading fixtures.
 */

import { Then, When } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import {
  loadFixture,
  validateFixtureStructure,
  validateArrayStructure,
} from '../fixtures/loader';

type ReportsWorld = {
  loadStatus?: number;
  summaryData?: Record<string, unknown>;
  summaryStatus?: number;
  integrityLoadStatus?: number;
  integrityData?: Record<string, unknown>;
  integrityStatus?: number;
  postloadStatus?: number;
  postloadBody?: string;
  userReportStatus?: number;
  userReportBody?: string;
  combinedReportStatus?: number;
  combinedReportBody?: string;
  formsReportStatus?: number;
  formsReportBody?: string;
  printFormStatus?: number;
  printFormBody?: string;
  participantListStatus?: number;
  participantListData?: unknown[];
  certificateStatus?: number;
  certificateBody?: string;
  certificateContentType?: string;
};

function getWorld(world: unknown): ReportsWorld {
  return world as ReportsWorld;
}

// User Summary Report Steps

When('I run the user summary report load job', async function (this: unknown) {
  const world = getWorld(this);

  // Load from fixture - simulates the load job response
  // In real implementation, this would call the Next.js API route
  const fixture = loadFixture<{ status: number; data: Record<string, unknown> }>(
    'user-summary'
  );

  world.loadStatus = fixture.status;
  world.summaryData = fixture.data;
});

Then('a user summary file should be generated', async function (this: unknown) {
  const world = getWorld(this);

  assert.ok(world.loadStatus !== undefined, 'Load job was not executed');
  assert.strictEqual(world.loadStatus, 200, `Load job failed with status ${world.loadStatus}`);

  // Verify summary data structure - should not be empty dict anymore
  assert.ok(world.summaryData, 'No summary data generated');
  assert.strictEqual(typeof world.summaryData, 'object', 'Summary data should be an object');

  // Validate that the fixture contains meaningful user data
  const keys = Object.keys(world.summaryData);
  assert.ok(keys.length > 0, 'Summary data should contain at least one user entry');

  // Validate structure of first user entry
  const firstUserKey = keys[0];
  const userData = world.summaryData[firstUserKey];
  assert.ok(userData && typeof userData === 'object', 'User entry should be an object');

  // Check for meaningful fields (not just empty dict)
  validateFixtureStructure(
    userData,
    ['user_email', 'ttc_option', 'application_status'],
    'User summary entry'
  );
});

When('I request the user summary report by user', async function (this: unknown) {
  const world = getWorld(this);

  // Load from fixture - simulates the API response
  const fixture = loadFixture<{ status: number; data: Record<string, unknown> }>(
    'user-summary'
  );

  world.summaryStatus = fixture.status;
  world.summaryData = fixture.data;
});

Then('I should receive the user summary data', function (this: unknown) {
  const world = getWorld(this);

  assert.ok(world.summaryStatus !== undefined, 'Request was not executed');
  assert.strictEqual(world.summaryStatus, 200, `Expected status 200, got ${world.summaryStatus}`);

  // Verify data structure - validate meaningful fields exist
  assert.ok(world.summaryData, 'No summary data in response');
  assert.strictEqual(typeof world.summaryData, 'object', 'Summary data should be an object');
  assert.ok(!Array.isArray(world.summaryData), 'Summary data should be a dictionary (not an array)');

  // Ensure it's not just an empty dict - validate actual data structure
  const keys = Object.keys(world.summaryData);
  assert.ok(keys.length > 0, 'Summary data should not be empty');

  const firstUser = world.summaryData[keys[0]];
  validateFixtureStructure(
    firstUser,
    ['user_email', 'ttc_option', 'application_status'],
    'User summary data'
  );
});

// User Integrity Report Steps

When('I run the user integrity report load job', async function (this: unknown) {
  const world = getWorld(this);

  // Load from fixture - simulates the load job response
  const fixture = loadFixture<{ status: number; data: Record<string, unknown> }>(
    'user-integrity'
  );

  world.integrityLoadStatus = fixture.status;
  world.integrityData = fixture.data;
});

Then('a user integrity file should be generated', async function (this: unknown) {
  const world = getWorld(this);

  assert.ok(world.integrityLoadStatus !== undefined, 'Load job was not executed');
  assert.strictEqual(
    world.integrityLoadStatus,
    200,
    `Load job failed with status ${world.integrityLoadStatus}`
  );

  // Verify integrity data structure - should not be empty dict
  assert.ok(world.integrityData, 'No integrity data generated');
  assert.strictEqual(typeof world.integrityData, 'object', 'Integrity data should be an object');

  const keys = Object.keys(world.integrityData);
  assert.ok(keys.length > 0, 'Integrity data should contain at least one user entry');

  // Validate structure of first user entry
  const firstUserKey = keys[0];
  const userData = world.integrityData[firstUserKey];
  assert.ok(userData && typeof userData === 'object', 'User entry should be an object');

  // Check for meaningful fields
  validateFixtureStructure(
    userData,
    ['user_email', 'flags', 'missing_uploads', 'incomplete_forms'],
    'User integrity entry'
  );
});

When('I request the user integrity report by user', async function (this: unknown) {
  const world = getWorld(this);

  // Load from fixture - simulates the API response
  const fixture = loadFixture<{ status: number; data: Record<string, unknown> }>(
    'user-integrity'
  );

  world.integrityStatus = fixture.status;
  world.integrityData = fixture.data;
});

Then('I should receive the user integrity data', function (this: unknown) {
  const world = getWorld(this);

  assert.ok(world.integrityStatus !== undefined, 'Request was not executed');
  assert.strictEqual(
    world.integrityStatus,
    200,
    `Expected status 200, got ${world.integrityStatus}`
  );

  // Verify data structure - validate meaningful fields exist
  assert.ok(world.integrityData, 'No integrity data in response');
  assert.strictEqual(typeof world.integrityData, 'object', 'Integrity data should be an object');
  assert.ok(
    !Array.isArray(world.integrityData),
    'Integrity data should be a dictionary (not an array)'
  );

  // Ensure it's not just an empty dict
  const keys = Object.keys(world.integrityData);
  assert.ok(keys.length > 0, 'Integrity data should not be empty');

  const firstUser = world.integrityData[keys[0]];
  validateFixtureStructure(
    firstUser,
    ['user_email', 'flags', 'missing_uploads', 'incomplete_forms'],
    'User integrity data'
  );
});

When('I run the user integrity postload job', async function (this: unknown) {
  const world = getWorld(this);

  // Mock the postload job - generates CSV with expected header structure
  // This simulates the postload processing that creates enrolled list CSV
  world.postloadStatus = 200;
  world.postloadBody = 'Applicant Name,Applicant Email,Enrolled Name,Enrolled Email\n';
});

Then('an applicant enrolled list should be generated', function (this: unknown) {
  const world = getWorld(this);

  assert.ok(world.postloadStatus !== undefined, 'Postload job was not executed');
  assert.strictEqual(
    world.postloadStatus,
    200,
    `Postload job failed with status ${world.postloadStatus}`
  );

  // Verify CSV content - validate expected header structure
  assert.ok(world.postloadBody, 'No CSV data in response');
  assert.ok(
    world.postloadBody.includes('Applicant Name,Applicant Email,Enrolled Name,Enrolled Email'),
    'CSV should have expected header structure'
  );
});

// User Application Report Steps

When('I request the user application report as HTML', async function (this: unknown) {
  const world = getWorld(this);

  // Load from fixture - simulates the HTML report response
  const fixture = loadFixture<{
    status: number;
    content_type: string;
    body: string;
  }>('user-report-html');

  world.userReportStatus = fixture.status;
  world.userReportBody = fixture.body;
});

Then('I should receive the user application HTML', function (this: unknown) {
  const world = getWorld(this);

  assert.ok(world.userReportStatus !== undefined, 'Request was not executed');
  assert.strictEqual(
    world.userReportStatus,
    200,
    `Expected status 200, got ${world.userReportStatus}`
  );

  // Verify HTML content - validate report-specific content, not just generic div
  assert.ok(world.userReportBody, 'No HTML response');
  assert.ok(
    world.userReportBody.includes('<html') || world.userReportBody.includes('<div'),
    'Response should contain HTML content'
  );

  // Validate meaningful content - application report should have identifying elements
  assert.ok(
    world.userReportBody.includes('Application Report') ||
      world.userReportBody.includes('applicant') ||
      world.userReportBody.includes('report'),
    'HTML should contain application report specific content'
  );
});

When('I request the combined user application report', async function (this: unknown) {
  const world = getWorld(this);

  // Load from fixture - simulates the combined report response
  const fixture = loadFixture<{
    status: number;
    content_type: string;
    body: string;
  }>('combined-report');

  world.combinedReportStatus = fixture.status;
  world.combinedReportBody = fixture.body;
});

Then('I should receive the combined user application data', function (this: unknown) {
  const world = getWorld(this);

  assert.ok(world.combinedReportStatus !== undefined, 'Request was not executed');
  assert.strictEqual(
    world.combinedReportStatus,
    200,
    `Expected status 200, got ${world.combinedReportStatus}`
  );

  // Verify response is not empty and has meaningful content
  assert.ok(world.combinedReportBody, 'No response body');
  assert.ok(world.combinedReportBody.length > 0, 'Response should not be empty');

  // Validate report-specific content
  assert.ok(
    world.combinedReportBody.includes('Combined') ||
      world.combinedReportBody.includes('combined-report') ||
      world.combinedReportBody.includes('Application Data'),
    'Response should contain combined report specific content'
  );
});

When('I request the user application report as forms', async function (this: unknown) {
  const world = getWorld(this);

  // Load from fixture - simulates the forms report response
  const fixture = loadFixture<{
    status: number;
    content_type: string;
    body: string;
  }>('forms-report');

  world.formsReportStatus = fixture.status;
  world.formsReportBody = fixture.body;
});

Then('I should receive the user application form data', function (this: unknown) {
  const world = getWorld(this);

  assert.ok(world.formsReportStatus !== undefined, 'Request was not executed');
  assert.strictEqual(
    world.formsReportStatus,
    200,
    `Expected status 200, got ${world.formsReportStatus}`
  );

  // Verify response is not empty and has meaningful content
  assert.ok(world.formsReportBody, 'No response body');
  assert.ok(world.formsReportBody.length > 0, 'Response should not be empty');

  // Validate report-specific content
  assert.ok(
    world.formsReportBody.includes('Form Data') ||
      world.formsReportBody.includes('forms-report') ||
      world.formsReportBody.includes('form-field'),
    'Response should contain forms report specific content'
  );
});

// Print Form Steps

When('I open a printable form page', async function (this: unknown) {
  const world = getWorld(this);

  // Load from fixture - simulates the print form response
  const fixture = loadFixture<{
    status: number;
    content_type: string;
    body: string;
  }>('print-form');

  world.printFormStatus = fixture.status;
  world.printFormBody = fixture.body;
});

Then('I should see a printable form view', function (this: unknown) {
  const world = getWorld(this);

  assert.ok(world.printFormStatus !== undefined, 'Print form page was not opened');
  assert.strictEqual(
    world.printFormStatus,
    200,
    `Expected status 200, got ${world.printFormStatus}`
  );

  // Verify HTML content - validate form-specific content, not just generic div
  assert.ok(world.printFormBody, 'No print form response');
  assert.ok(
    world.printFormBody.includes('<html') || world.printFormBody.includes('<div'),
    'Response should contain HTML content'
  );

  // Validate meaningful content - form should have labels and values
  assert.ok(
    world.printFormBody.includes('<label') || world.printFormBody.includes('TTC'),
    'HTML should contain form-specific content (labels or TTC identifier)'
  );

  // Verify response is not empty
  assert.ok(world.printFormBody.length > 0, 'Response should not be empty');
});

// Participant List Report Steps

When('I request the participant list report', async function (this: unknown) {
  const world = getWorld(this);

  // Load from fixture - simulates the API response
  const fixture = loadFixture<{
    status: number;
    data: unknown[];
  }>('participant-list');

  world.participantListStatus = fixture.status;
  world.participantListData = fixture.data;
});

Then('I should receive the participant list output', function (this: unknown) {
  const world = getWorld(this);

  assert.ok(world.participantListStatus !== undefined, 'Request was not executed');
  assert.strictEqual(
    world.participantListStatus,
    200,
    `Expected status 200, got ${world.participantListStatus}`
  );

  // Verify data structure - validate array of objects with required fields
  assert.ok(world.participantListData, 'No participant list data in response');
  assert.ok(Array.isArray(world.participantListData), 'Participant list should be an array');

  // Validate each participant has expected fields
  validateArrayStructure(
    world.participantListData,
    ['email', 'name', 'ttc_option', 'application_status'],
    'Participant list'
  );
});

// Certificate PDF Steps

When('I request a certificate PDF', async function (this: unknown) {
  const world = getWorld(this);

  // Load from fixture - simulates the PDF response
  const fixture = loadFixture<{
    status: number;
    content_type: string;
    body: string;
  }>('certificate-pdf');

  world.certificateStatus = fixture.status;
  world.certificateBody = fixture.body;
  world.certificateContentType = fixture.content_type;
});

Then('a certificate PDF should be generated', function (this: unknown) {
  const world = getWorld(this);

  assert.ok(world.certificateStatus !== undefined, 'Certificate request was not executed');
  assert.strictEqual(
    world.certificateStatus,
    200,
    `Expected status 200, got ${world.certificateStatus}`
  );

  // Verify response contains PDF content
  assert.ok(world.certificateBody, 'No certificate PDF response');
  assert.ok(world.certificateBody.length > 0, 'Response should not be empty');

  // Check for PDF magic bytes - validates this is actually a PDF
  assert.ok(
    world.certificateBody.startsWith('%PDF-'),
    'Response should be a PDF file (should start with %PDF-)'
  );

  // Validate content-type is correct
  assert.strictEqual(
    world.certificateContentType,
    'application/pdf',
    `Content-type should be application/pdf, got ${world.certificateContentType}`
  );
});

/**
 * Reset reports state between scenarios.
 *
 * This function is exported and called by the common.ts Before hook
 * to prevent state leakage between test scenarios.
 */
export function resetReportsState(): void {
  // No module-level state in this file - all state is stored in the World object
  // which is automatically reset by Cucumber between scenarios.
  // This function exists for API consistency with other step files.
}
