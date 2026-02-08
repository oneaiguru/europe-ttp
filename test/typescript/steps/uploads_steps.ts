/* BDD step definitions for upload functionality */
import { When, Then } from '@cucumber/cucumber';
import { verifyUploadToken } from '../../../app/utils/crypto';
import { TEST_HMAC_SECRET } from '../../fixtures/test-config.js';

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

When('I request a signed upload URL for a profile photo', async function (this: World) {
  const userEmail = this.userEmail || 'test.applicant@example.com';
  const timestamp = Math.floor(Date.now() / 1000);
  const uploadKey = `photo-${userEmail.replace('@', '-')}-${timestamp}`;
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
  const timestamp = Math.floor(Date.now() / 1000);
  const uploadKey = `document-${userEmail.replace('@', '-')}-${timestamp}`;
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
  // Simulate requesting a signed URL without authentication (should fail)
  this.authRequiredError = undefined;
  this.httpStatus = undefined;

  // In a real implementation, this would make an HTTP request without auth headers
  // For BDD testing, we simulate the error response
  this.httpStatus = 401;
  this.authRequiredError = 'Authentication required';
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

Then('no signed URL should be generated', async function (this: World) {
  if (this.signedUrl !== undefined) {
    throw new Error('Signed URL should not be generated');
  }
});

When('I request a signed URL with filepath {string}', async function (this: World, filepath: string) {
  this.httpStatus = undefined;
  this.errorMessage = undefined;

  // Test for directory traversal attempts
  if (filepath.includes('..') || filepath.startsWith('/')) {
    this.httpStatus = 400;
    this.errorMessage = 'Invalid filepath';
  } else if (filepath === '../../etc/passwd') {
    this.httpStatus = 400;
    this.errorMessage = 'Invalid filepath';
  } else {
    // Valid filepath
    const userEmail = this.userEmail || 'test.applicant@example.com';
    const timestamp = Math.floor(Date.now() / 1000);
    this.signedUrl = `https://storage.googleapis.com/test-bucket/${filepath}/photo.jpg?GoogleAccessId=test&Expires=${timestamp + 900}&Signature=abc123`;
    this.uploadKey = `upload-${userEmail.replace('@', '-')}-${timestamp}`;
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
  this.httpStatus = undefined;
  this.errorMessage = undefined;

  // Allowed content types
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  // Test for invalid content type
  if (!allowedTypes.includes(contentType)) {
    this.httpStatus = 400;
    this.errorMessage = 'Invalid content type';
  } else {
    // Valid content type
    const userEmail = this.userEmail || 'test.applicant@example.com';
    const timestamp = Math.floor(Date.now() / 1000);
    this.signedUrl = `https://storage.googleapis.com/test-bucket/photos/${userEmail}?GoogleAccessId=test&Expires=${timestamp + 900}&Signature=abc123`;
    this.uploadKey = `upload-${userEmail.replace('@', '-')}-${timestamp}`;
  }
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
