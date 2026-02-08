import { When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { authContext } from './auth_steps';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface FormSubmission {
  id?: string;
  form_type?: string;
  email?: string;
  ttc_option?: string;
  status?: string;
  data?: Record<string, unknown>;
  form_instance_page_data?: Record<string, unknown>;
}

interface TestConfig {
  api_endpoints?: {
    upload_form_data?: string;
  };
}

export const apiContext: {
  responseStatus?: number;
  lastPayload?: Record<string, unknown>;
  lastResponseBody?: Record<string, unknown>;
} = {};

export let cachedConfig: TestConfig | null = null;
export let cachedSubmissions: FormSubmission[] | null = null;

/**
 * Reset cached data between test scenarios.
 * Called by common.ts Before hook to prevent state leakage.
 */
export function resetApiStepsCache(): void {
  cachedConfig = null;
  cachedSubmissions = null;
  apiContext.responseStatus = undefined;
  apiContext.lastPayload = undefined;
  apiContext.lastResponseBody = undefined;
}

/**
 * Load test configuration from fixtures.
 *
 * Reads the test-config.json file which contains API endpoint mappings
 * and other test configuration. Results are cached for performance.
 *
 * @returns Parsed test configuration object
 */
function loadTestConfig(): TestConfig {
  if (cachedConfig) {
    return cachedConfig;
  }
  const configPath = path.resolve(__dirname, '../../fixtures/test-config.json');
  const raw = fs.readFileSync(configPath, 'utf-8');
  cachedConfig = JSON.parse(raw) as TestConfig;
  return cachedConfig;
}

/**
 * Load form submission fixtures for testing.
 *
 * Reads the form-submissions.json file which contains sample form data
 * for testing API endpoints. Results are cached for performance.
 *
 * @returns Array of form submission fixtures
 */
function loadFormSubmissions(): FormSubmission[] {
  if (cachedSubmissions) {
    return cachedSubmissions;
  }
  const submissionsPath = path.resolve(__dirname, '../../fixtures/form-submissions.json');
  const raw = fs.readFileSync(submissionsPath, 'utf-8');
  const parsed = JSON.parse(raw) as { submissions?: FormSubmission[] };
  cachedSubmissions = parsed.submissions ?? [];
  return cachedSubmissions;
}

/**
 * Resolve a form submission fixture for API testing.
 *
 * Prefers the 'ttc_application' form type if available, otherwise returns
 * the first submission or a minimal default object.
 *
 * @returns A form submission fixture for building test payloads
 */
function resolveSubmission(): FormSubmission {
  const submissions = loadFormSubmissions();
  const preferred = submissions.find((submission) => submission.form_type === 'ttc_application');
  return preferred ?? submissions[0] ?? { form_type: 'ttc_application', data: {} };
}

/**
 * Build an API payload from a form submission fixture.
 *
 * Merges the submission data with required API fields, using defaults
 * for any missing values.
 *
 * @param submission - The form submission fixture to convert to a payload
 * @returns A complete API request payload object
 */
function buildPayload(submission: FormSubmission): Record<string, unknown> {
  const formInstanceDisplay = submission.id ?? submission.ttc_option ?? 'default';
  return {
    form_type: submission.form_type ?? 'ttc_application',
    form_instance: 'default',
    form_data: submission.data ?? {},
    form_instance_page_data: submission.form_instance_page_data ?? {},
    form_instance_display: formInstanceDisplay,
    user_home_country_iso: 'US',
  };
}

When('I submit form data to the upload form API', async () => {
  const submission = resolveSubmission();
  const payload = buildPayload(submission);
  apiContext.lastPayload = payload;

  const config = loadTestConfig();
  const endpoint = config.api_endpoints?.upload_form_data ?? '/users/upload-form-data';
  const url = new URL(endpoint, 'http://localhost');

  const { POST } = await import('../../../app/users/upload-form-data/route');
  const response = await POST(
    new Request(url.toString(), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-email': authContext.currentUser?.email ?? 'test.applicant@example.com',
      },
      body: JSON.stringify(payload),
    }),
  );
  apiContext.responseStatus = response.status;
  // Store response body for validation
  apiContext.lastResponseBody = await response.json() as Record<string, unknown>;
});

Then('the API should accept the form submission', () => {
  assert.equal(apiContext.responseStatus, 200);
});

/**
 * Create a JSON payload of exactly the specified byte size.
 * Used to test body size enforcement limits.
 *
 * @param byteSize - The target size in bytes
 * @returns A JSON string of exactly the specified size
 */
function createPayloadOfSize(byteSize: number): string {
  const basePayload = {
    form_type: 'ttc_application',
    form_instance: 'default',
    form_data: {},
    form_instance_page_data: {},
    form_instance_display: 'test',
    user_home_country_iso: 'US',
  };
  const baseStr = JSON.stringify(basePayload);
  const baseSize = Buffer.byteLength(baseStr, 'utf8');

  if (byteSize <= baseSize) {
    return baseStr;
  }

  // Add padding to reach exactly the desired size
  const paddingSize = byteSize - baseSize;
  const padding = 'x'.repeat(paddingSize - 3); // -3 for quotes around pad
  return JSON.stringify({ ...basePayload, _pad: padding });
}

When('I submit a valid form data payload of {int} bytes', async (size: number) => {
  const payloadStr = createPayloadOfSize(size);
  apiContext.lastPayload = JSON.parse(payloadStr);

  const config = loadTestConfig();
  const endpoint = config.api_endpoints?.upload_form_data ?? '/users/upload-form-data';
  const url = new URL(endpoint, 'http://localhost');

  const { POST } = await import('../../../app/users/upload-form-data/route');
  const response = await POST(
    new Request(url.toString(), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': String(size),
        'x-user-email': authContext.currentUser?.email ?? 'test.applicant@example.com',
      },
      body: payloadStr,
    }),
  );
  apiContext.responseStatus = response.status;
  // Store response body for validation
  apiContext.lastResponseBody = await response.json() as Record<string, unknown>;
});

When('I submit a form data payload of {int} bytes', async (size: number) => {
  const payloadStr = createPayloadOfSize(size);
  apiContext.lastPayload = JSON.parse(payloadStr);

  const config = loadTestConfig();
  const endpoint = config.api_endpoints?.upload_form_data ?? '/users/upload-form-data';
  const url = new URL(endpoint, 'http://localhost');

  const { POST } = await import('../../../app/users/upload-form-data/route');
  const response = await POST(
    new Request(url.toString(), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': String(size),
        'x-user-email': authContext.currentUser?.email ?? 'test.applicant@example.com',
      },
      body: payloadStr,
    }),
  );
  apiContext.responseStatus = response.status;
  // Store response body for validation
  apiContext.lastResponseBody = await response.json() as Record<string, unknown>;
});

When('I submit a form data payload of {int} bytes without content-length header', async (size: number) => {
  const payloadStr = createPayloadOfSize(size);
  apiContext.lastPayload = JSON.parse(payloadStr);

  const config = loadTestConfig();
  const endpoint = config.api_endpoints?.upload_form_data ?? '/users/upload-form-data';
  const url = new URL(endpoint, 'http://localhost');

  const { POST } = await import('../../../app/users/upload-form-data/route');
  // Intentionally omit content-length header
  const response = await POST(
    new Request(url.toString(), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-email': authContext.currentUser?.email ?? 'test.applicant@example.com',
      },
      body: payloadStr,
    }),
  );
  apiContext.responseStatus = response.status;
  // Store response body for validation
  apiContext.lastResponseBody = await response.json() as Record<string, unknown>;
});

Then('the API should return status {int}', (status: number) => {
  assert.equal(apiContext.responseStatus, status);
});

Then(/^the API response should have ([^\s]+) equal to "([^"]+)"$/, async (key: string, value: string) => {
  if (!apiContext.lastResponseBody) {
    throw new Error('No response body was stored');
  }
  const actualValue = apiContext.lastResponseBody[key];
  const expectedValue = value === 'true' ? true : value === 'false' ? false : value;
  if (actualValue !== expectedValue) {
    throw new Error(`Expected response body to have ${key} = ${expectedValue}, got ${actualValue}`);
  }
});
