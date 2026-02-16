import { When, Then, Given } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { authContext } from './auth_steps';
import { TEST_BOUNDARY } from './test-data.js';
import {
  MULTIPART_DUPLICATE_FIELD_OVERHEAD,
  MULTIPART_BASE_SIZE_ESTIMATE,
  MULTIPART_CLOSING_OVERHEAD,
  DEFAULT_FORM_DATA_SIZE,
  URL_ENCODED_PAD_OVERHEAD,
  JSON_PAD_FIELD_OVERHEAD,
  MULTIPART_SIZE_TOLERANCE,
} from '../../fixtures/test-config';

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
  lastFormData?: FormData;
  lastFormDataSize?: number;
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
  apiContext.lastFormData = undefined;
  apiContext.lastFormDataSize = undefined;
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

function buildUploadFormAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (authContext.authMode === 'platform') {
    headers['x-user-email'] = authContext.currentUser?.email ?? 'test.applicant@example.com';
    return headers;
  }

  if (authContext.authMode === 'session' || authContext.sessionToken) {
    if (authContext.sessionToken) {
      headers.authorization = `Bearer ${authContext.sessionToken}`;
    }
  }

  return headers;
}

function buildUploadFormHeaders(baseHeaders: Record<string, string>): Record<string, string> {
  return {
    ...baseHeaders,
    ...buildUploadFormAuthHeaders(),
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
      headers: buildUploadFormHeaders({
        'content-type': 'application/json',
      }),
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

  if (byteSize < baseSize) {
    // Cannot generate valid JSON smaller than base without removing fields
    // This is a documented limitation - minimum size is baseSize (161 bytes)
    throw new Error(`Requested size ${byteSize} is smaller than minimum ${baseSize}`);
  }

  // Add padding to reach exactly the desired size
  const paddingSize = byteSize - baseSize;
  // Overhead for adding _pad field to form_instance_page_data
  // Replaces {} with {"_pad":"x"} = 9 bytes overhead (one x included)
  const padFieldOverhead = JSON_PAD_FIELD_OVERHEAD;

  let result: string;

  if (paddingSize <= padFieldOverhead) {
    // Not enough space for the nested field overhead.
    // Pad inside an existing string field to keep JSON valid and size exact.
    const paddedDisplay = basePayload.form_instance_display + 'x'.repeat(paddingSize);
    result = JSON.stringify({ ...basePayload, form_instance_display: paddedDisplay });
  } else {
    // Enough space for nested field in form_instance_page_data
    const padding = 'x'.repeat(paddingSize - padFieldOverhead);
    result = JSON.stringify({
      ...basePayload,
      form_instance_page_data: { _pad: padding }
    });
  }

  return result;
}

When('I submit a valid form data payload of {int} bytes', async (size: number) => {
  const payloadStr = createPayloadOfSize(size);
  const actualSize = Buffer.byteLength(payloadStr, 'utf8');
  apiContext.lastPayload = JSON.parse(payloadStr);

  const config = loadTestConfig();
  const endpoint = config.api_endpoints?.upload_form_data ?? '/users/upload-form-data';
  const url = new URL(endpoint, 'http://localhost');

  const { POST } = await import('../../../app/users/upload-form-data/route');
  const response = await POST(
    new Request(url.toString(), {
      method: 'POST',
      headers: buildUploadFormHeaders({
        'content-type': 'application/json',
        'content-length': String(actualSize),
      }),
      body: payloadStr,
    }),
  );
  apiContext.responseStatus = response.status;
  // Store response body for validation
  apiContext.lastResponseBody = await response.json() as Record<string, unknown>;
});

When('I submit a form data payload of {int} bytes', async (size: number) => {
  const payloadStr = createPayloadOfSize(size);
  const actualSize = Buffer.byteLength(payloadStr, 'utf8');
  apiContext.lastPayload = JSON.parse(payloadStr);

  const config = loadTestConfig();
  const endpoint = config.api_endpoints?.upload_form_data ?? '/users/upload-form-data';
  const url = new URL(endpoint, 'http://localhost');

  const { POST } = await import('../../../app/users/upload-form-data/route');
  const response = await POST(
    new Request(url.toString(), {
      method: 'POST',
      headers: buildUploadFormHeaders({
        'content-type': 'application/json',
        'content-length': String(actualSize),
      }),
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
      headers: buildUploadFormHeaders({
        'content-type': 'application/json',
      }),
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

/**
 * Get the actual byte size of a FormData object when serialized as multipart/form-data.
 *
 * FormData doesn't expose byte size directly in Node.js, so we serialize it
 * to a Blob and measure the Blob's size.
 *
 * @param formData - The FormData object to measure
 * @returns The actual byte size when serialized
 */
async function getActualFormDataSize(formData: FormData): Promise<number> {
  const blob = await new Response(formData).blob();
  return blob.size;
}

/**
 * Create a FormData payload of approximately the specified byte size.
 * Used to test multipart/form-data body size enforcement limits.
 *
 * Uses form_instance_display field for padding since it's an allowed field.
 *
 * IMPORTANT: The actual size will differ from the target due to multipart
 * encoding overhead and random boundary generation. Callers should use
 * getActualFormDataSize() to get the true size for Content-Length header.
 *
 * @param byteSize - The target size in bytes
 * @returns A FormData object with approximately the specified size
 */
function createFormDataOfSize(byteSize: number): FormData {
  const formData = new FormData();
  formData.append('form_type', 'ttc_application');
  formData.append('form_instance', 'default');
  formData.append('user_home_country_iso', 'US');

  // Calculate approximate base size (FormData multipart encoding adds overhead)
  // Each field adds: Content-Disposition: form-data; name="..." + value + boundaries
  // This is a rough estimate - actual size will vary due to multipart encoding
  const baseSize = MULTIPART_BASE_SIZE_ESTIMATE; // Conservative estimate for multipart overhead
  const displayValue = 'test';

  if (byteSize > baseSize) {
    const paddingSize = byteSize - baseSize;
    const padding = 'x'.repeat(Math.max(0, paddingSize));
    formData.append('form_instance_display', displayValue + padding);
  } else {
    formData.append('form_instance_display', displayValue);
  }

  return formData;
}

/**
 * Create a URL-encoded payload string of approximately the specified byte size.
 * Used to test application/x-www-form-urlencoded body size enforcement limits.
 *
 * Uses form_instance_display field for padding since it's an allowed field.
 *
 * @param byteSize - The target size in bytes
 * @returns A URL-encoded string of approximately the specified size
 */
function createUrlEncodedPayloadOfSize(byteSize: number): string {
  const basePayload = new URLSearchParams();
  basePayload.append('form_type', 'ttc_application');
  basePayload.append('form_instance', 'default');
  basePayload.append('user_home_country_iso', 'US');

  const baseStr = basePayload.toString();
  const baseSize = Buffer.byteLength(baseStr, 'utf8');

  if (byteSize <= baseSize) {
    basePayload.append('form_instance_display', 'test');
    return basePayload.toString();
  }

  // Add padding to reach approximately the target size
  const paddingSize = byteSize - baseSize;
  // Overhead for form_instance_display field: &form_instance_display=
  const padOverhead = URL_ENCODED_PAD_OVERHEAD; // 'form_instance_display=' length

  if (paddingSize > padOverhead) {
    basePayload.append('form_instance_display', 'x'.repeat(paddingSize - padOverhead));
  }

  return basePayload.toString();
}

/**
 * Create a raw multipart/form-data body with a dishonest Content-Length header.
 *
 * This helper constructs a manually crafted multipart body to test DoS protection
 * against dishonest Content-Length headers. The Web Request API's FormData()
 * automatically sets correct Content-Length, so we must build raw multipart bodies.
 *
 * @param claimedSize - The size to claim in Content-Length header
 * @param actualSize - The actual size of the body
 * @returns Object with body string, actual size, and boundary string
 */
function createDishonestMultipartBody(claimedSize: number, actualSize: number): {
  body: string;
  actualSize: number;
  boundary: string;
} {
  // Use deterministic boundary for reproducible tests
  const boundary = TEST_BOUNDARY;

  const fields = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="form_type"',
    '',
    'ttc_application',
    `--${boundary}`,
    'Content-Disposition: form-data; name="form_instance"',
    '',
    'default',
    `--${boundary}`,
    'Content-Disposition: form-data; name="user_home_country_iso"',
    '',
    'US',
  ];

  const baseBody = fields.join('\r\n');
  const baseSize = Buffer.byteLength(baseBody, 'utf8');

  // Add padding to reach actualSize
  const paddingSize = actualSize - baseSize - MULTIPART_CLOSING_OVERHEAD; // -100 for closing boundary and footer
  if (paddingSize > 0) {
    fields.push(
      `--${boundary}`,
      'Content-Disposition: form-data; name="form_instance_display"',
      '',
      'x'.repeat(Math.max(0, paddingSize))
    );
  }

  fields.push(`--${boundary}--`, '');
  const body = fields.join('\r\n');

  return {
    body,
    actualSize: Buffer.byteLength(body, 'utf8'),
    boundary,
  };
}

When('I submit a multipart\\/form-data payload of {int} bytes', async (size: number) => {
  const formData = createFormDataOfSize(size);

  // Verify actual FormData size matches claimed size within tolerance
  // This prevents false confidence that exact boundaries are being tested
  const actualSize = await getActualFormDataSize(formData);
  const sizeDiff = Math.abs(actualSize - size);
  assert.ok(
    sizeDiff <= MULTIPART_SIZE_TOLERANCE,
    `FormData actual size (${actualSize} bytes) differs from claimed size (${size} bytes) by ${sizeDiff} bytes, ` +
    `which exceeds tolerance of ${MULTIPART_SIZE_TOLERANCE} bytes. ` +
    `Consider adjusting the test or MULTIPART_BASE_SIZE_ESTIMATE constant.`
  );

  const config = loadTestConfig();
  const endpoint = config.api_endpoints?.upload_form_data ?? '/users/upload-form-data';
  const url = new URL(endpoint, 'http://localhost');

  const { POST } = await import('../../../app/users/upload-form-data/route');

  // Convert FormData to a Request with explicit content-length header
  // Use ACTUAL size for honest Content-Length (not claimed size)
  // In a real scenario, the browser would set this automatically
  const tempRequest = new Request(url.toString(), {
    method: 'POST',
    headers: buildUploadFormHeaders({}),
    body: formData,
  });

  const headers = new Headers(tempRequest.headers);
  headers.set('content-length', String(actualSize));

  const testRequest = new Request(tempRequest, { headers });

  const response = await POST(testRequest);
  apiContext.responseStatus = response.status;
  apiContext.lastResponseBody = await response.json() as Record<string, unknown>;
});

When('I submit a multipart\\/form-data payload of {int} bytes without content-length header', async (size: number) => {
  const formData = createFormDataOfSize(size);

  const config = loadTestConfig();
  const endpoint = config.api_endpoints?.upload_form_data ?? '/users/upload-form-data';
  const url = new URL(endpoint, 'http://localhost');

  const { POST } = await import('../../../app/users/upload-form-data/route');

  // For FormData, we need to construct the request and manually strip content-length
  // The FormData body will be consumed, so we use a Request constructor
  const tempRequest = new Request(url.toString(), {
    method: 'POST',
    headers: buildUploadFormHeaders({}),
    body: formData,
  });

  // Create a new request without content-length header
  // Note: in a real HTTP scenario, removing content-length from the headers object
  // before the request is sent would prevent it from being sent
  const headers = new Headers(tempRequest.headers);
  headers.delete('content-length');

  const testRequest = new Request(tempRequest, { headers });

  const response = await POST(testRequest);
  apiContext.responseStatus = response.status;
  apiContext.lastResponseBody = await response.json() as Record<string, unknown>;
});

When('I submit a application\\/x-www-form-urlencoded payload of {int} bytes', async (size: number) => {
  const payload = createUrlEncodedPayloadOfSize(size);
  const actualSize = Buffer.byteLength(payload, 'utf8');

  const config = loadTestConfig();
  const endpoint = config.api_endpoints?.upload_form_data ?? '/users/upload-form-data';
  const url = new URL(endpoint, 'http://localhost');

  const { POST } = await import('../../../app/users/upload-form-data/route');
  const response = await POST(
    new Request(url.toString(), {
      method: 'POST',
      headers: buildUploadFormHeaders({
        'content-type': 'application/x-www-form-urlencoded',
        'content-length': String(actualSize),
      }),
      body: payload,
    }),
  );
  apiContext.responseStatus = response.status;
  apiContext.lastResponseBody = await response.json() as Record<string, unknown>;
});

When('I submit a application\\/x-www-form-urlencoded payload of {int} bytes without content-length header', async (size: number) => {
  const payload = createUrlEncodedPayloadOfSize(size);

  const config = loadTestConfig();
  const endpoint = config.api_endpoints?.upload_form_data ?? '/users/upload-form-data';
  const url = new URL(endpoint, 'http://localhost');

  const { POST } = await import('../../../app/users/upload-form-data/route');
  const response = await POST(
    new Request(url.toString(), {
      method: 'POST',
      headers: buildUploadFormHeaders({
        'content-type': 'application/x-www-form-urlencoded',
        // Intentionally omit content-length header
      }),
      body: payload,
    }),
  );
  apiContext.responseStatus = response.status;
  apiContext.lastResponseBody = await response.json() as Record<string, unknown>;
});

When(
  'I submit a multipart\\/form-data payload claiming {int} bytes but actually {int} bytes',
  async (claimedSize: number, actualSize: number) => {
    const { body, boundary } = createDishonestMultipartBody(claimedSize, actualSize);

    const config = loadTestConfig();
    const endpoint = config.api_endpoints?.upload_form_data ?? '/users/upload-form-data';
    const url = new URL(endpoint, 'http://localhost');

    const { POST } = await import('../../../app/users/upload-form-data/route');

    const testRequest = new Request(url.toString(), {
      method: 'POST',
      headers: buildUploadFormHeaders({
        'content-type': `multipart/form-data; boundary=${boundary}`,
        'content-length': String(claimedSize), // DISHONEST
      }),
      body,
    });

    const response = await POST(testRequest);
    apiContext.responseStatus = response.status;
    apiContext.lastResponseBody = await response.json() as Record<string, unknown>;
  }
);

// New step for storing FormData in context (used by duplicate key tests)
When('I have a valid upload form payload of {int} bytes', async (size: number) => {
  const formData = createFormDataOfSize(size);

  // Store ACTUAL size for accurate calculations in subsequent steps
  const actualSize = await getActualFormDataSize(formData);

  // Verify actual size is within tolerance of claimed size
  const sizeDiff = Math.abs(actualSize - size);
  assert.ok(
    sizeDiff <= MULTIPART_SIZE_TOLERANCE,
    `FormData actual size (${actualSize} bytes) differs from claimed size (${size} bytes) by ${sizeDiff} bytes, ` +
    `which exceeds tolerance of ${MULTIPART_SIZE_TOLERANCE} bytes.`
  );

  apiContext.lastFormData = formData;
  apiContext.lastFormDataSize = actualSize;
});

// New step for submitting payload with a duplicate field
When('I submit the payload with a duplicate field {string}', async function (fieldName: string) {
  const existingFormData = apiContext.lastFormData;
  if (!existingFormData) {
    throw new Error('No form data was previously created. Use "I have a valid upload form payload of X bytes" first.');
  }

  // Create new FormData with duplicate key
  const duplicateFormData = new FormData();
  for (const [key, value] of existingFormData.entries()) {
    duplicateFormData.append(key, value);
  }
  // Add the duplicate
  const originalValue = existingFormData.get(fieldName);
  if (originalValue !== null) {
    duplicateFormData.append(fieldName, originalValue);
  }

  const config = loadTestConfig();
  const endpoint = config.api_endpoints?.upload_form_data ?? '/users/upload-form-data';
  const url = new URL(endpoint, 'http://localhost');

  const { POST } = await import('../../../app/users/upload-form-data/route');

  // Get ACTUAL size of the FormData with duplicate field
  // This is more accurate than estimating with magic constants
  const actualSize = await getActualFormDataSize(duplicateFormData);

  // Verify the duplicate overhead matches our expectation within tolerance
  const expectedOverhead = MULTIPART_DUPLICATE_FIELD_OVERHEAD;
  const baseSize = apiContext.lastFormDataSize ?? DEFAULT_FORM_DATA_SIZE;
  const expectedSize = baseSize + expectedOverhead;
  const sizeDiff = Math.abs(actualSize - expectedSize);
  assert.ok(
    sizeDiff <= MULTIPART_SIZE_TOLERANCE,
    `FormData with duplicate field actual size (${actualSize} bytes) differs from expected (${expectedSize} bytes) ` +
    `by ${sizeDiff} bytes, which exceeds tolerance of ${MULTIPART_SIZE_TOLERANCE} bytes. ` +
    `Consider adjusting MULTIPART_DUPLICATE_FIELD_OVERHEAD constant.`
  );

  const contentLength = String(actualSize);

  // Create the request directly without intermediate requests
  // IMPORTANT: Don't create intermediate requests as they consume the FormData body stream
  const testRequest = new Request(url.toString(), {
    method: 'POST',
    headers: buildUploadFormHeaders({
      'content-length': contentLength,
    }),
    body: duplicateFormData,
  });

  const response = await POST(testRequest);
  apiContext.responseStatus = response.status;
  apiContext.lastResponseBody = await response.json() as Record<string, unknown>;
});

// New step for asserting error message content
Then('the API response error details should mention {string}', function (expectedMessage: string) {
  if (!apiContext.lastResponseBody) {
    throw new Error('No response body was stored');
  }
  const body = apiContext.lastResponseBody as { details?: Array<{ message: string }> };
  const messages = body.details?.map(d => d.message) || [];
  // Strip quotes from expected message for comparison
  const cleanExpected = expectedMessage.replace(/"/g, '');
  assert.ok(
    messages.some(m => m.includes(cleanExpected)),
    `Expected error message containing "${cleanExpected}" in ${JSON.stringify(messages)}`
  );
});

// ============================================================================
// Rate limiting steps for upload-form-data endpoint
// ============================================================================

// Step for pre-populating rate limit by making upload-form-data requests
Given(/I have made (\d+) upload form requests within the limit(?: window)?/, async function (countStr: string) {
  const count = parseInt(countStr, 10);

  // Clear rate limit store to start fresh
  const { clearAllRateLimits } = await import('../../../app/utils/rate-limit');
  clearAllRateLimits();

  const { POST } = await import('../../../app/users/upload-form-data/route');
  const submission = resolveSubmission();
  const payload = buildPayload(submission);

  const config = loadTestConfig();
  const endpoint = config.api_endpoints?.upload_form_data ?? '/users/upload-form-data';
  const url = new URL(endpoint, 'http://localhost');

  for (let i = 0; i < count; i++) {
    await POST(
      new Request(url.toString(), {
        method: 'POST',
        headers: buildUploadFormHeaders({
          'content-type': 'application/json',
        }),
        body: JSON.stringify(payload),
      })
    );
  }
});
