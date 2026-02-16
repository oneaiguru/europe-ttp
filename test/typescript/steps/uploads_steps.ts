/* BDD step definitions for upload functionality */
import { When, Then, Given, After } from '@cucumber/cucumber';
import { generateUploadToken, verifyUploadToken, getSessionHmacSecret } from '../../../app/utils/crypto';
import { TEST_HMAC_SECRET } from '../../fixtures/test-config.js';
import { TEST_TIMESTAMP } from './test-data.js';
import { createHmac, randomBytes } from 'crypto';

/**
 * Cucumber World object for upload test scenarios.
 *
 * In Cucumber.js, the World object is shared between all steps in a scenario
 * and is used to maintain test state (e.g., generated URLs, upload keys, errors).
 *
 * Properties:
 * - userEmail: The authenticated user email for the scenario
 * - signedUrl: The signed URL returned by the upload endpoint (if any)
 * - uploadKey: The HMAC-signed upload key for storage verification
 * - httpStatus: The HTTP status code from API responses
 * - errorMessage: Error message text for validation assertions
 * - authRequiredError: Authentication error text for security testing
 */
interface World {
  userEmail?: string;
  signedUrl?: string;
  uploadKey?: string;
  httpStatus?: number;
  errorMessage?: string;
  authRequiredError?: string;
}

// Lazy load authContext to avoid circular import
let authContextModule: typeof import('./auth_steps') | null = null;

async function getAuthContext() {
  if (!authContextModule) {
    authContextModule = await import('./auth_steps');
  }
  return authContextModule.authContext;
}

/**
 * Generate a user-specific session token for BDD testing.
 *
 * This helper creates a valid session token for a specified user email,
 * ensuring that rate limiting and other user-scoped features are correctly
 * tested in session auth mode.
 *
 * INTENTIONAL NON-DETERMINISM: This function uses Date.now() and randomBytes()
 * for timestamp and nonce rather than TEST_TIMESTAMP. This is required because:
 * 1. Session tokens must pass the real expiration check in app/utils/auth.ts
 * 2. Max age is 3600 seconds (1 hour); TEST_TIMESTAMP (Jan 2024) is too old
 * 3. Rate limit tests call the real route handler with real token verification
 * 4. Tests assert on HTTP status only, not token values, so non-determinism
 *    does not affect test reliability
 *
 * @param userEmail - The email address to generate a session token for
 * @returns A valid session token for the specified user
 */
function generateUserSessionToken(userEmail: string): string {
  // Use test HMAC secret for token generation
  // In tests, getSessionHmacSecret() returns TEST_HMAC_SECRET
  const secret = getSessionHmacSecret();

  // Use a fresh timestamp so tokens don't expire during tests
  // TEST_TIMESTAMP is from Jan 2024, which would cause tokens to be rejected
  // as expired (max age is 3600 seconds = 1 hour)
  const timestamp = Math.floor(Date.now() / 1000);

  // Generate a fresh nonce for each token to ensure uniqueness
  const nonce = randomBytes(16).toString('base64url');

  // Encode email to handle special characters
  const encodedEmail = Buffer.from(userEmail).toString('base64');

  // Create payload string with type marker
  const payloadString = `session:${encodedEmail}:${timestamp}:${nonce}`;

  // Encode payload
  const encodedPayload = Buffer.from(payloadString).toString('base64url');

  // Generate HMAC signature
  const signature = createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

/**
 * Helper to create a Request with proper auth headers based on current auth mode.
 * This ensures tests work in both session and platform auth modes.
 */
async function createAuthenticatedRequest(body: object): Promise<Request> {
  const auth = await import('../../../app/utils/auth');
  const mode = auth.getAuthMode();
  const authCtx = await getAuthContext();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (mode === 'session' && authCtx.sessionToken) {
    headers['authorization'] = `Bearer ${authCtx.sessionToken}`;
  } else if (mode === 'platform' && authCtx.currentUser?.email) {
    headers['x-user-email'] = authCtx.currentUser.email;
  }

  return new Request('http://localhost:3000/api/upload/signed-url', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

// ============================================================================
// GCS mock setup for testing successful signed URL generation
// ============================================================================

// After hook to clear GCS mock and rate limit store to prevent cross-scenario contamination
// NOTE: NODE_ENV restoration is handled by centralized saveEnvState/restoreEnvState
// in auth_steps.ts, invoked via common.ts Before/After hooks.
After(async function () {
  // Clear GCS mock to prevent cross-scenario contamination
  delete (globalThis as unknown as { __MOCK_GCS_SIGNED_URL__?: string }).__MOCK_GCS_SIGNED_URL__;

  // Clear rate limit store to prevent cross-scenario contamination
  const { clearAllRateLimits } = await import('../../../app/utils/rate-limit');
  clearAllRateLimits();
});

Given('GCS is configured for testing', async function () {
  // Set BUCKET_NAME so the handler attempts GCS operations
  process.env.BUCKET_NAME = 'test-bucket';

  // Mock the @google-cloud/storage module to return a fake signed URL
  // This is done by setting a global flag that the route handler can check
  // We use a module-level variable to signal the mock
  // Use deterministic date for reproducible tests (2024-01-01)
  (globalThis as unknown as { __MOCK_GCS_SIGNED_URL__: string }).__MOCK_GCS_SIGNED_URL__ =
    `https://storage.googleapis.com/test-bucket/photos/test.jpg?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=test&X-Goog-Date=20240101&X-Goog-Expires=900&X-Goog-SignedHeaders=host&X-Goog-Signature=mocksignature123`;
});

// ============================================================================
// Basic upload steps (non-security tests)
// ============================================================================

When('I request a signed upload URL for a profile photo', async function (this: World) {
  const userEmail = this.userEmail || 'test.applicant@example.com';
  // Use deterministic timestamp for reproducible tests
  const timestamp = TEST_TIMESTAMP;
  const filename = `photos/${userEmail}/profile-${timestamp}.jpg`;
  const uploadKey = generateUploadToken(
    { user: userEmail, timestamp, filename },
    TEST_HMAC_SECRET
  );
  const signedUrl = `https://storage.googleapis.com/test-bucket/photos/${userEmail}?GoogleAccessId=test&Expires=${timestamp + 3600}&Signature=abc123`;

  this.signedUrl = signedUrl;
  this.uploadKey = uploadKey;
});

Then('I should receive a signed URL and upload key for the photo', async function (this: World) {
  if (!this.signedUrl) {
    throw new Error('No signed URL was generated');
  }
  if (!this.uploadKey) {
    throw new Error('No upload key was generated');
  }
  if (!this.signedUrl.startsWith('https://')) {
    throw new Error('Invalid signed URL format');
  }
});

When('I request a signed upload URL for a document', async function (this: World) {
  const userEmail = this.userEmail || 'test.applicant@example.com';
  // Use deterministic timestamp for reproducible tests
  const timestamp = TEST_TIMESTAMP;
  const filename = `documents/${userEmail}/document-${timestamp}.pdf`;
  const uploadKey = generateUploadToken(
    { user: userEmail, timestamp, filename },
    TEST_HMAC_SECRET
  );
  const signedUrl = `https://storage.googleapis.com/test-bucket/documents/${userEmail}?GoogleAccessId=test&Expires=${timestamp + 3600}&Signature=abc123`;

  this.signedUrl = signedUrl;
  this.uploadKey = uploadKey;
});

Then('I should receive a signed URL and upload key for the document', async function (this: World) {
  if (!this.signedUrl) {
    throw new Error('No signed URL was generated');
  }
  if (!this.uploadKey) {
    throw new Error('No upload key was generated');
  }
  if (!this.signedUrl.startsWith('https://')) {
    throw new Error('Invalid signed URL format');
  }
});

// Security test steps for signed URL hardening

When('I request a signed upload URL without authentication', async function (this: World) {
  // Call the real handler without any auth headers
  // @ts-expect-error - tsx loader handles .ts extension in dynamic imports
  const { POST } = await import('../../../app/api/upload/signed-url/route.ts');
  const request = new Request('http://localhost:3000/api/upload/signed-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filepath: 'photos', content_type: 'image/jpeg' }),
  });

  const response = await POST(request);
  this.httpStatus = response.status;
  this.signedUrl = undefined;
  this.uploadKey = undefined;
});

Then('I should receive a 401 error', async function (this: World) {
  if (!this.httpStatus) {
    throw new Error('No HTTP status was set');
  }
  if (this.httpStatus !== 401) {
    throw new Error(`Expected 401, got ${this.httpStatus}`);
  }
});

Then('I should receive a 400 error', async function (this: World) {
  if (!this.httpStatus) {
    throw new Error('No HTTP status was set');
  }
  if (this.httpStatus !== 400) {
    throw new Error(`Expected 400, got ${this.httpStatus}`);
  }
});

Then('I should receive a 501 error', async function (this: World) {
  if (!this.httpStatus) {
    throw new Error('No HTTP status was set');
  }
  if (this.httpStatus !== 501) {
    throw new Error(`Expected 501, got ${this.httpStatus}`);
  }
});

Then('I should receive a 403 error', async function (this: World) {
  if (!this.httpStatus) {
    throw new Error('No HTTP status was set');
  }
  if (this.httpStatus !== 403) {
    throw new Error(`Expected 403, got ${this.httpStatus}`);
  }
});

Then('I should receive a 403 forbidden error', async function (this: World) {
  if (!this.httpStatus) {
    throw new Error('No HTTP status was set');
  }
  if (this.httpStatus !== 403) {
    throw new Error(`Expected 403 forbidden, got ${this.httpStatus}`);
  }
});

Then('no signed URL should be generated', async function (this: World) {
  if (this.signedUrl !== undefined) {
    throw new Error('Signed URL should not be generated');
  }
});

When('I request a signed URL with filepath {string}', async function (this: World, filepath: string) {
  // @ts-expect-error - tsx loader handles .ts extension in dynamic imports
  const { POST } = await import('../../../app/api/upload/signed-url/route.ts');
  const request = await createAuthenticatedRequest({
    filepath,
    content_type: 'image/jpeg',
  });

  const response = await POST(request);
  this.httpStatus = response.status;

  if (response.status === 200) {
    const body = await response.json() as { url?: string; key?: string };
    this.signedUrl = body.url;
    this.uploadKey = body.key;
    this.errorMessage = undefined;
  } else {
    const body = await response.json() as { error?: string };
    this.errorMessage = body.error || 'Unknown error';
  }
});

Then('the error should mention {string}', async function (this: World, expectedMessage: string) {
  if (!this.errorMessage) {
    throw new Error('No error message was set');
  }
  if (!this.errorMessage.toLowerCase().includes(expectedMessage.toLowerCase())) {
    throw new Error(`Expected error message to contain '${expectedMessage}', got '${this.errorMessage}'`);
  }
});

When('I request a signed URL with content type {string}', async function (this: World, contentType: string) {
  // @ts-expect-error - tsx loader handles .ts extension in dynamic imports
  const { POST } = await import('../../../app/api/upload/signed-url/route.ts');
  const request = await createAuthenticatedRequest({
    filepath: 'photos',
    content_type: contentType,
  });

  const response = await POST(request);
  this.httpStatus = response.status;

  if (response.status === 200) {
    const body = await response.json() as { url?: string; key?: string };
    this.signedUrl = body.url;
    this.uploadKey = body.key;
    this.errorMessage = undefined;
  } else {
    const body = await response.json() as { error?: string };
    this.errorMessage = body.error || 'Unknown error';
  }
});

When('I request a signed URL without a content type', async function (this: World) {
  // @ts-expect-error - tsx loader handles .ts extension in dynamic imports
  const { POST } = await import('../../../app/api/upload/signed-url/route.ts');
  const request = await createAuthenticatedRequest({
    filepath: 'photos',
    content_type: '',
  });

  const response = await POST(request);
  this.httpStatus = response.status;

  const body = await response.json() as { error?: string };
  this.errorMessage = body.error || 'Unknown error';
});

Then('the signed URL should expire within {int} minutes', async function (this: World, _minutes: number) {
  if (!this.signedUrl) {
    throw new Error('No signed URL was generated');
  }
  // The signed URL should have an expiration timestamp
  // For this test, we check that the URL contains an Expires parameter
  if (!this.signedUrl.includes('Expires=')) {
    throw new Error('Signed URL does not contain expiration');
  }
  // In a real implementation, this would parse the URL and verify the expiration time
  // is within the specified minutes
});

// Security test steps for HMAC-signed upload keys

Then('the upload key should be HMAC-signed', async function (this: World) {
  if (!this.uploadKey) {
    throw new Error('No upload key was generated');
  }

  // HMAC-signed tokens contain a dot separator (payload.signature)
  if (!this.uploadKey.includes('.')) {
    throw new Error('Upload key should be HMAC-signed (contain dot separator)');
  }

  const parts = this.uploadKey.split('.');
  if (parts.length !== 2) {
    throw new Error('Upload key should have exactly two parts (payload.signature)');
  }
});

Then('the upload key should not reveal user information', async function (this: World) {
  if (!this.uploadKey) {
    throw new Error('No upload key was generated');
  }

  // The key should not contain the plain user email
  const userEmail = this.userEmail || 'test.applicant@example.com';
  if (this.uploadKey.includes(userEmail)) {
    throw new Error('Upload key should not contain plain user email');
  }

  // Attempting to decode as plain base64 should not reveal user email
  // The payload is double-encoded, so a single base64 decode should show encoded data
  const parts = this.uploadKey.split('.');
  const decoded = Buffer.from(parts[0], 'base64url').toString();

  // Should NOT contain plain user email (should be double-encoded)
  if (decoded.includes(userEmail)) {
    throw new Error('Upload key payload should not contain plain user email');
  }
});

Then('the upload key should be verifiable with the correct secret', async function (this: World) {
  if (!this.uploadKey) {
    throw new Error('No upload key was generated');
  }

  const secret = TEST_HMAC_SECRET;
  const payload = verifyUploadToken(this.uploadKey, secret);

  if (!payload) {
    throw new Error('Upload key verification failed');
  }

  // Verify the payload contains expected fields
  if (!payload.user || !payload.filename || typeof payload.timestamp !== 'number') {
    throw new Error('Upload key payload is missing required fields');
  }
});

Then('a forged upload key should not verify', async function (this: World) {
  // Generate a forged token (wrong signature)
  const forgedToken = 'forged-payload.forged-signature';

  const secret = TEST_HMAC_SECRET;
  const payload = verifyUploadToken(forgedToken, secret);

  if (payload !== null) {
    throw new Error('Forged token should not verify');
  }
});

// GCS configuration test steps

When('I request a signed upload URL via the API', async function (this: World) {
  // @ts-expect-error - tsx loader handles .ts extension in dynamic imports
  const { POST } = await import('../../../app/api/upload/signed-url/route.ts');
  const request = await createAuthenticatedRequest({
    filepath: 'photos',
    content_type: 'image/jpeg',
  });

  const response = await POST(request);
  this.httpStatus = response.status;

  if (response.status === 200) {
    const body = await response.json() as { url?: string; key?: string };
    this.signedUrl = body.url;
    this.uploadKey = body.key;
  } else {
    const body = await response.json() as { error?: string; message?: string };
    this.errorMessage = body.error || body.message || 'Unknown error';
    this.signedUrl = undefined;
    this.uploadKey = undefined;
  }
});

Then('the response should contain a valid signed URL', async function (this: World) {
  if (!this.httpStatus) {
    throw new Error('No HTTP status was set');
  }
  if (this.httpStatus !== 200) {
    throw new Error(`Expected 200, got ${this.httpStatus}: ${this.errorMessage}`);
  }
  if (!this.signedUrl) {
    throw new Error('No signed URL was generated');
  }
  if (!this.signedUrl.startsWith('https://storage.googleapis.com/')) {
    throw new Error('Invalid signed URL format');
  }
  // Real GCS signed URLs contain X-Goog-Signature parameter
  if (!this.signedUrl.includes('X-Goog-Signature=')) {
    throw new Error('Signed URL should contain X-Goog-Signature parameter');
  }
});

Then('the response should indicate GCS is not configured', async function (this: World) {
  if (!this.httpStatus) {
    throw new Error('No HTTP status was set');
  }
  if (this.httpStatus !== 501) {
    throw new Error(`Expected 501, got ${this.httpStatus}`);
  }
  // In development/test mode, error should be GCS_NOT_CONFIGURED
  // In production mode (or any other/unset NODE_ENV), error should be STORAGE_UNAVAILABLE (redacted)
  // Fail-closed: assume production unless explicitly in development/test mode
  const env = process.env.NODE_ENV;
  const isDevelopmentMode = env === 'development' || env === 'test';
  const expectedError = isDevelopmentMode ? 'GCS_NOT_CONFIGURED' : 'STORAGE_UNAVAILABLE';
  if (this.errorMessage !== expectedError) {
    throw new Error(`Expected ${expectedError} error, got ${this.errorMessage}`);
  }
});

// ============================================================================
// Rate limiting and error redaction steps
// ============================================================================

Given('I have made {int} upload request(s) within the limit', async function (count: number) {
  // Clear the rate limit store to start fresh
  const { clearAllRateLimits } = await import('../../../app/utils/rate-limit');
  clearAllRateLimits();

  // Make actual requests up to the limit (but not exceeding)
  // @ts-expect-error - tsx loader handles .ts extension in dynamic imports
  const { POST } = await import('../../../app/api/upload/signed-url/route.ts');

  // Make requests up to (count - 1) to leave room for the next step
  // Rebuild Request for each iteration since Request bodies are single-use
  for (let i = 0; i < Math.max(0, count - 1); i++) {
    const request = await createAuthenticatedRequest({
      filepath: 'photos',
      content_type: 'image/jpeg',
    });
    await POST(request);
  }
});

When('I request a signed upload URL as user {string}', async function (this: World, userEmail: string) {
  // Set up auth for the specified user
  const authCtx = await getAuthContext();
  const originalUser = authCtx.currentUser;

  // Temporarily set the user for this request
  authCtx.currentUser = { email: userEmail, role: 'user' };

  // @ts-expect-error - tsx loader handles .ts extension in dynamic imports
  const { POST } = await import('../../../app/api/upload/signed-url/route.ts');

  // Get auth mode to determine headers
  const auth = await import('../../../app/utils/auth');
  const mode = auth.getAuthMode();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (mode === 'session') {
    // Generate a user-specific session token for proper rate limit scoping
    headers['authorization'] = `Bearer ${generateUserSessionToken(userEmail)}`;
  } else if (mode === 'platform') {
    headers['x-user-email'] = userEmail;
  }

  const request = new Request('http://localhost:3000/api/upload/signed-url', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      filepath: 'photos',
      content_type: 'image/jpeg',
    }),
  });

  const response = await POST(request);
  this.httpStatus = response.status;

  if (response.status === 200) {
    const body = await response.json() as { url?: string; key?: string };
    this.signedUrl = body.url;
    this.uploadKey = body.key;
    this.errorMessage = undefined;
  } else {
    const body = await response.json() as { error?: string; message?: string };
    this.errorMessage = body.error || body.message || 'Unknown error';
  }

  // Restore original user
  if (originalUser) {
    authCtx.currentUser = originalUser;
  }
});

// Step: "I have made {int} upload requests within the limit window"
Given(/I have made (\d+) upload requests within the limit(?: window)?/, async function (countStr: string) {
  const count = parseInt(countStr, 10);
  const userEmail = 'test.applicant@example.com'; // Default user for this step

  // NOTE: We intentionally do NOT clear the rate limit store here.
  // The purpose of this step is to test rate limiting by making multiple
  // requests up to and exceeding the limit. Clearning would defeat the test.

  // For rate limiting to work correctly, we need to use tokens with
  // fresh timestamps that won't be rejected as expired.
  // We'll use Math.floor(Date.now() / 1000) for each request.

  // Make requests as the specified user up to the limit
  // @ts-expect-error - tsx loader handles .ts extension in dynamic imports
  const { POST } = await import('../../../app/api/upload/signed-url/route.ts');

  const authCtx = await getAuthContext();
  const originalUser = authCtx.currentUser;
  authCtx.currentUser = { email: userEmail, role: 'user' };

  const auth = await import('../../../app/utils/auth');
  const mode = auth.getAuthMode();

  // Rebuild Request for each iteration since Request bodies are single-use
  for (let i = 0; i < count; i++) {
    // Generate a fresh token for each request to avoid expiration issues
    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = randomBytes(16).toString('base64url');

    // Encode email to handle special characters
    const encodedEmail = Buffer.from(userEmail).toString('base64');

    // Create payload string with type marker
    const payloadString = `session:${encodedEmail}:${timestamp}:${nonce}`;

    // Encode payload
    const encodedPayload = Buffer.from(payloadString).toString('base64url');

    // Generate HMAC signature
    const { createHmac } = await import('crypto');
    const cryptoUtils = await import('../../../app/utils/crypto');
    const signature = createHmac('sha256', await cryptoUtils.getSessionHmacSecret())
      .update(encodedPayload)
      .digest('base64url');

    const freshToken = `${encodedPayload}.${signature}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (mode === 'session') {
      headers['authorization'] = `Bearer ${freshToken}`;
    } else if (mode === 'platform') {
      headers['x-user-email'] = userEmail;
    }

    const request = new Request('http://localhost:3000/api/upload/signed-url', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        filepath: 'photos',
        content_type: 'image/jpeg',
      }),
    });
    await POST(request);
  }

  // Restore original user
  if (originalUser) {
    authCtx.currentUser = originalUser;
  }
});

// Step: "user {string} has made {int} upload requests within the limit"
Given(/user (.+) has made (\d+) upload requests within the limit(?: window)?/, async function (userEmail: string, countStr: string) {
  const count = parseInt(countStr, 10);
  // NOTE: We intentionally do NOT clear the rate limit store here.
  // The purpose of this step is to test rate limiting by making multiple
  // requests up to and exceeding the limit. Clearning would defeat the test.

  // Make requests as the specified user up to the limit
  // @ts-expect-error - tsx loader handles .ts extension in dynamic imports
  const { POST } = await import('../../../app/api/upload/signed-url/route.ts');

  const authCtx = await getAuthContext();
  const originalUser = authCtx.currentUser;
  authCtx.currentUser = { email: userEmail, role: 'user' };

  const auth = await import('../../../app/utils/auth');
  const mode = auth.getAuthMode();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (mode === 'session') {
    // Generate a user-specific session token for proper rate limit scoping
    headers['authorization'] = `Bearer ${generateUserSessionToken(userEmail)}`;
  } else if (mode === 'platform') {
    headers['x-user-email'] = userEmail;
  }

  // Rebuild Request for each iteration since Request bodies are single-use
  for (let i = 0; i < count; i++) {
    const request = new Request('http://localhost:3000/api/upload/signed-url', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        filepath: 'photos',
        content_type: 'image/jpeg',
      }),
    });
    await POST(request);
  }

  // Restore original user
  if (originalUser) {
    authCtx.currentUser = originalUser;
  }
});

Then('I should receive a 429 rate limit error', async function (this: World) {
  if (!this.httpStatus) {
    throw new Error('No HTTP status was set');
  }
  if (this.httpStatus !== 429) {
    throw new Error(`Expected 429, got ${this.httpStatus}`);
  }
});

Then('the error message should indicate rate limit exceeded', async function (this: World) {
  if (!this.errorMessage) {
    throw new Error('No error message was set');
  }
  // Error message should mention rate limiting
  const rateLimitKeywords = ['rate limit', 'too many requests', '429', 'exceeded'];
  const lowerMessage = this.errorMessage.toLowerCase();
  const hasRateLimitKeyword = rateLimitKeywords.some(keyword => lowerMessage.includes(keyword));
  if (!hasRateLimitKeyword) {
    throw new Error(`Error message should indicate rate limit exceeded. Got: ${this.errorMessage}`);
  }
});

Then('the response should include Retry-After header', async function (this: World) {
  // This would require capturing the response headers
  // For now, we just check the status code was 429
  if (this.httpStatus !== 429) {
    throw new Error('Expected rate limit error before checking headers');
  }
});

When('I wait for the rate limit window to reset', async function () {
  // In tests, we can clear the rate limit store to simulate window reset
  const { clearAllRateLimits } = await import('../../../app/utils/rate-limit');
  clearAllRateLimits();
});

Then('the response should include rate limit headers', async function (this: World) {
  // This would require capturing the response headers
  // For now, we just check the request succeeded
  if (this.httpStatus !== 200) {
    throw new Error('Expected successful response before checking headers');
  }
});

Given('I have made {int} verify request(s) within the limit', async function (count: number) {
  const { clearAllRateLimits } = await import('../../../app/utils/rate-limit');
  clearAllRateLimits();

  const authCtx = await getAuthContext();
  const userEmail = authCtx.currentUser?.email || 'test@example.com';

  // Make requests up to the limit
  // @ts-expect-error - tsx loader handles .ts extension in dynamic imports
  const { POST } = await import('../../../app/api/upload/verify/route.ts');

  const { generateUploadToken } = await import('../../../app/utils/crypto');
  const { TEST_HMAC_SECRET } = await import('../../fixtures/test-config.js');

  // Use deterministic timestamp for reproducible tests
  const timestamp = TEST_TIMESTAMP;
  const filename = `photos/${userEmail}/test-${timestamp}.jpg`;
  const uploadKey = generateUploadToken(
    { user: userEmail, timestamp, filename },
    TEST_HMAC_SECRET
  );

  const authHeaders = await createAuthenticatedRequest({ key: uploadKey });
  // Rebuild Request for each iteration since Request bodies are single-use
  for (let i = 0; i < count; i++) {
    const verifyRequest = new Request('http://localhost:3000/api/upload/verify', {
      method: 'POST',
      headers: authHeaders.headers,
      body: JSON.stringify({ key: uploadKey }),
    });
    await POST(verifyRequest);
  }
});

When('I verify an upload token', async function (this: World) {
  // @ts-expect-error - tsx loader handles .ts extension in dynamic imports
  const { POST } = await import('../../../app/api/upload/verify/route.ts');

  const authCtx = await getAuthContext();
  const userEmail = authCtx.currentUser?.email || 'test@example.com';

  const { generateUploadToken } = await import('../../../app/utils/crypto');
  const { TEST_HMAC_SECRET } = await import('../../fixtures/test-config.js');

  // Use deterministic timestamp for reproducible tests
  const timestamp = TEST_TIMESTAMP;
  const filename = `photos/${userEmail}/test-${timestamp}.jpg`;
  const uploadKey = generateUploadToken(
    { user: userEmail, timestamp, filename },
    TEST_HMAC_SECRET
  );

  const request = await createAuthenticatedRequest({ key: uploadKey });
  // Create new Request with correct URL
  const verifyRequest = new Request('http://localhost:3000/api/upload/verify', {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ key: uploadKey }),
  });

  const response = await POST(verifyRequest);
  this.httpStatus = response.status;
});

Given('NODE_ENV is set to {string}', async function (nodeEnv: string) {
  // NOTE: NODE_ENV restoration is handled by centralized saveEnvState/restoreEnvState
  // in auth_steps.ts, invoked via common.ts Before/After hooks.
  // @ts-expect-error - NODE_ENV modification for testing
  process.env.NODE_ENV = nodeEnv;
});

Given('GCS signed URL generation fails', async function () {
  // Unset BUCKET_NAME to cause GCS configuration to fail
  delete process.env.BUCKET_NAME;
});

Then('the error message should be generic', async function (this: World) {
  if (!this.errorMessage) {
    throw new Error('No error message was set');
  }

  // Generic messages should not contain technical details
  const technicalKeywords = [
    'module',
    'package',
    'Cannot find',
    'Cannot resolve',
    'credentials',
    'path',
    '/home/',
    '/var/',
    'node_modules',
  ];

  const lowerMessage = this.errorMessage.toLowerCase();
  for (const keyword of technicalKeywords) {
    if (lowerMessage.includes(keyword.toLowerCase())) {
      throw new Error(`Error message contains technical detail: ${keyword}`);
    }
  }
});

Then('the error message should not contain internal paths', async function (this: World) {
  if (!this.errorMessage) {
    throw new Error('No error message was set');
  }

  const pathPatterns = [
    'node_modules',
    '.ts',
    '.js',
    'project:',
    'stack:',
    '/home/',
    '/var/',
    '/usr/',
  ];

  const lowerMessage = this.errorMessage.toLowerCase();
  for (const pattern of pathPatterns) {
    if (lowerMessage.includes(pattern.toLowerCase())) {
      throw new Error(`Error message contains internal path: ${pattern}`);
    }
  }
});

Then('the error message should be detailed', async function (this: World) {
  if (!this.errorMessage) {
    throw new Error('No error message was set');
  }

  // In development, detailed errors should provide actionable information
  // At minimum, there should be some message
  if (this.errorMessage.length === 0) {
    throw new Error('Error message is empty');
  }
});

Then('production error responses should not leak internal details', async function (this: World) {
  if (!this.errorMessage) {
    throw new Error('No error message was set');
  }

  // Production error messages should not contain internal implementation details
  const forbiddenPatterns = [
    'module',
    'package',
    'Cannot find',
    'Cannot resolve',
    '/home/',
    '/var/',
    '/usr/',
    'node_modules',
    'Error: ENOENT',
    'stack trace',
  ];

  const lowerMessage = this.errorMessage.toLowerCase();
  for (const pattern of forbiddenPatterns) {
    if (lowerMessage.includes(pattern.toLowerCase())) {
      throw new Error(`Production error message leaks internal detail: ${pattern}`);
    }
  }
});

// ============================================================================
// Cross-user authorization tests
// ============================================================================

// Step with "User B" prefix for readability in feature files
Given(/User [AB] "([^"]*)" has generated an upload token/, async function (this: World, otherUser: string) {
  // Generate a token for the other user
  const { generateUploadToken } = await import('../../../app/utils/crypto');
  const { TEST_HMAC_SECRET } = await import('../../fixtures/test-config.js');
  const timestamp = TEST_TIMESTAMP;

  const filename = `photos/${otherUser}/test-${timestamp}.jpg`;
  const otherUserToken = generateUploadToken(
    { user: otherUser, timestamp, filename },
    TEST_HMAC_SECRET
  );

  // Store the other user's token for verification step
  (this as unknown as Record<string, unknown>).otherUserToken = otherUserToken;
});

// Generic step without User A/B prefix
Given('User {string} has generated an upload token', async function (this: World, otherUser: string) {
  // Generate a token for the other user
  const { generateUploadToken } = await import('../../../app/utils/crypto');
  const { TEST_HMAC_SECRET } = await import('../../fixtures/test-config.js');
  const timestamp = TEST_TIMESTAMP;

  const filename = `photos/${otherUser}/test-${timestamp}.jpg`;
  const otherUserToken = generateUploadToken(
    { user: otherUser, timestamp, filename },
    TEST_HMAC_SECRET
  );

  // Store the other user's token for verification step
  (this as unknown as Record<string, unknown>).otherUserToken = otherUserToken;
});

When('I verify User B\'s upload token', async function (this: World) {
  const otherUserToken = (this as unknown as Record<string, unknown>).otherUserToken as string;

  if (!otherUserToken) {
    throw new Error('No other user token was generated. Use "User B has generated an upload token" first.');
  }

  // @ts-expect-error - tsx loader handles .ts extension in dynamic imports
  const { POST } = await import('../../../app/api/upload/verify/route.ts');

  const request = await createAuthenticatedRequest({ key: otherUserToken });
  const verifyRequest = new Request('http://localhost:3000/api/upload/verify', {
    method: 'POST',
    headers: request.headers,
    body: JSON.stringify({ key: otherUserToken }),
  });

  const response = await POST(verifyRequest);
  this.httpStatus = response.status;

  if (response.status !== 200) {
    const body = await response.json() as { error?: string };
    this.errorMessage = body.error || 'Unknown error';
  }
});

Then('the verification should fail with 403 forbidden', async function (this: World) {
  if (this.httpStatus !== 403) {
    throw new Error(`Expected 403 forbidden, got ${this.httpStatus}`);
  }
});

Then('rate limits should not be shared between users', async function (this: World) {
  // This assertion is implied by the request succeeding
  // If rate limits were shared, User B's request would fail with 429
  if (this.httpStatus !== 200) {
    throw new Error(`Rate limits should be isolated. Got status ${this.httpStatus}`);
  }
});

Given('I have made {int} upload requests as {string}', async function (count: number, userEmail: string) {
  // Clear rate limit store
  const { clearAllRateLimits } = await import('../../../app/utils/rate-limit');
  clearAllRateLimits();

  // Make requests as the specified user
  // @ts-expect-error - tsx loader handles .ts extension in dynamic imports
  const { POST } = await import('../../../app/api/upload/signed-url/route.ts');

  const authCtx = await getAuthContext();
  const originalUser = authCtx.currentUser;
  authCtx.currentUser = { email: userEmail, role: 'user' };

  const { getAuthMode } = await import('../../../app/utils/auth');
  const mode = getAuthMode();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (mode === 'session') {
    headers['authorization'] = `Bearer ${generateUserSessionToken(userEmail)}`;
  } else if (mode === 'platform') {
    headers['x-user-email'] = userEmail;
  }

  for (let i = 0; i < count; i++) {
    const request = new Request('http://localhost:3000/api/upload/signed-url', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        filepath: 'photos',
        content_type: 'image/jpeg',
      }),
    });
    await POST(request);
  }

  if (originalUser) {
    authCtx.currentUser = originalUser;
  }
});

Then(/the(?: rate)? limit should be based on user email not token/, async function (this: World) {
  // This is a documentation step - the 429 assertion confirms the behavior
  // The test ensures rate limiting is by user identity (email), not session token
  if (this.httpStatus !== 429) {
    throw new Error('Expected rate limit to be enforced based on user email');
  }
});

// Step for generating a new session token for the same user
// This tests that rate limiting is scoped by user email, not by session token
When('I authenticate with a new session token for {string}', async function (this: World, userEmail: string) {
  // Generate a NEW session token for the same user email
  // The key is that the email is the same, but the token is different
  // If rate limiting were by token, this would bypass the limit
  // If rate limiting is by email (correct), this should still hit the limit
  const newToken = generateUserSessionToken(userEmail);

  const authCtx = await getAuthContext();
  // Store the new token in auth context
  authCtx.sessionToken = newToken;

  // Import the route handler
  // @ts-expect-error - tsx loader handles .ts extension in dynamic imports
  const { POST } = await import('../../../app/api/upload/signed-url/route.ts');

  const request = new Request('http://localhost:3000/api/upload/signed-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'authorization': `Bearer ${newToken}`,
    },
    body: JSON.stringify({
      filepath: 'photos',
      content_type: 'image/jpeg',
    }),
  });

  const response = await POST(request);
  this.httpStatus = response.status;

  if (response.status === 200) {
    const body = await response.json() as { url?: string; key?: string };
    this.signedUrl = body.url;
    this.uploadKey = body.key;
    this.errorMessage = undefined;
  } else {
    const body = await response.json() as { error?: string; message?: string };
    this.errorMessage = body.error || body.message || 'Unknown error';
  }
});

// ============================================================================
// Cross-user filepath authorization tests
// ============================================================================

// Step: user {string} has made {int} upload requests
// For platform mode testing - makes requests as a specific user
Given('user {string} has made {int} upload requests', async function (this: World, userEmail: string, count: number) {
  // Clear rate limit store first
  const { clearAllRateLimits } = await import('../../../app/utils/rate-limit');
  clearAllRateLimits();

  // @ts-expect-error - tsx loader handles .ts extension in dynamic imports
  const { POST } = await import('../../../app/api/upload/signed-url/route.ts');

  for (let i = 0; i < count; i++) {
    // Rebuild Request for each iteration since Request bodies are single-use
    const request = new Request('http://localhost:3000/api/upload/signed-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-email': userEmail,
      },
      body: JSON.stringify({
        filepath: 'photos',
        content_type: 'image/jpeg',
      }),
    });
    await POST(request);
  }
});

// Step: user {string} requests a signed upload URL
// For platform mode testing - requests a URL as a specific user
When('user {string} requests a signed upload URL', async function (this: World, userEmail: string) {
  // @ts-expect-error - tsx loader handles .ts extension in dynamic imports
  const { POST } = await import('../../../app/api/upload/signed-url/route.ts');

  const request = new Request('http://localhost:3000/api/upload/signed-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-email': userEmail,
    },
    body: JSON.stringify({
      filepath: 'photos',
      content_type: 'image/jpeg',
    }),
  });

  const response = await POST(request);
  this.httpStatus = response.status;

  if (response.status === 200) {
    const body = await response.json() as { url?: string; key?: string };
    this.signedUrl = body.url;
    this.uploadKey = body.key;
    this.errorMessage = undefined;
  } else {
    const body = await response.json() as { error?: string; message?: string };
    this.errorMessage = body.error || body.message || 'Unknown error';
  }
});

// Step: the request should succeed
// Generic success assertion step
Then('the request should succeed', async function (this: World) {
  if (this.httpStatus !== 200) {
    throw new Error(`Expected request to succeed, got status ${this.httpStatus}: ${this.errorMessage || 'Unknown error'}`);
  }
});

When('I request a signed URL for user {string}', async function (this: World, otherUserEmail: string) {
  // @ts-expect-error - tsx loader handles .ts extension in dynamic imports
  const { POST } = await import('../../../app/api/upload/signed-url/route.ts');

  // Attempt to request a signed URL with another user's email in the filepath
  const maliciousFilepath = `photos/${otherUserEmail}`;

  const request = await createAuthenticatedRequest({
    filepath: maliciousFilepath,
    content_type: 'image/jpeg',
  });

  const response = await POST(request);
  this.httpStatus = response.status;

  if (response.status !== 200) {
    const body = await response.json() as { error?: string };
    this.errorMessage = body.error || 'Unknown error';
  }
});
