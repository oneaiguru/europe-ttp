/* BDD step definitions for upload boundary size tests */
import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import { authContext } from './auth_steps.js';

/**
 * Cucumber World object for boundary test scenarios.
 */
interface BoundaryWorld {
  responseStatus?: number;
  responseBody?: { error?: string; ok?: boolean };
}

let boundaryWorld: BoundaryWorld = {};

/**
 * Reset boundary world state between scenarios.
 *
 * Called from the centralized Before hook in common.ts to prevent
 * cross-scenario state contamination.
 */
export function resetBoundaryWorld(): void {
  boundaryWorld = {};
}

/**
 * Create a JSON payload of exact byte size.
 *
 * Uses ASCII characters for deterministic byte count.
 * Each character in the generated string counts as 1 byte.
 *
 * @param targetBytes - Exact byte size for the payload
 * @returns JSON string of exact byte size
 */
function createExactPayload(targetBytes: number): string {
  // Use form_data field which is allowed by UploadFormPayload validation
  // Overhead = 16 bytes for {"form_data":"..."}: {"form_data":" = 14, "} = 2
  const overhead = '{"form_data":"'.length + '"}'.length; // 16 bytes

  // For sizes under 16 bytes, return empty object
  // Note: The assertion will fail for sizes under 16 bytes, but those are invalid
  // payloads for our structure. The minimum valid payload is 16 bytes ({"form_data":""})
  if (targetBytes < overhead) {
    return '{}';
  }

  const dataBytes = targetBytes - overhead;
  const data = 'a'.repeat(dataBytes);

  return JSON.stringify({ form_data: data });
}

/**
 * Verify exact byte size of a string.
 *
 * @param str - String to measure
 * @returns Exact byte count
 */
function getByteLength(str: string): number {
  return Buffer.byteLength(str, 'utf8');
}

Given('I am using the upload-form-data endpoint', function () {
  // No-op - endpoint selection is implicit in the When step
  // Reset is handled by centralized Before hook in common.ts
});

When('I submit a form with payload size {int} bytes', async function (targetSize: number) {
  // Create payload of exact byte size
  const payload = createExactPayload(targetSize);

  // Verify the payload is exactly the requested size
  const actualSize = getByteLength(payload);
  assert.strictEqual(actualSize, targetSize,
    `Payload verification failed: expected ${targetSize} bytes, got ${actualSize} bytes. ` +
    `This is a test infrastructure issue - the payload helper must create exact-sized payloads.`
  );

  // Import the route handler
  const { POST } = await import('../../../app/users/upload-form-data/route');

  // Import auth utilities
  const { getAuthMode } = await import('../../../app/utils/auth');
  const mode = getAuthMode();

  // Build headers based on auth mode
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  if (mode === 'session') {
    // For session mode, use the session token from authContext
    // This is set by the Background step "Given I am authenticated as a TTC applicant"
    if (authContext.sessionToken) {
      headers["authorization"] = `Bearer ${authContext.sessionToken}`;
    }
  } else if (mode === 'platform') {
    headers['x-user-email'] = 'test.applicant@example.com';
  }

  // Create request with exact byte size
  const url = new URL('/users/upload-form-data', 'http://localhost');
  const request = new Request(url.toString(), {
    method: 'POST',
    headers,
    body: payload,
  });

  const response = await POST(request);
  boundaryWorld.responseStatus = response.status;
  boundaryWorld.responseBody = await response.json() as { error?: string; ok?: boolean };
});

Then('the submission should succeed', function () {
  assert.strictEqual(boundaryWorld.responseStatus, 200,
    `Expected 200 OK, got ${boundaryWorld.responseStatus}: ${JSON.stringify(boundaryWorld.responseBody)}`
  );
});

Then('I should receive a 413 error', function () {
  assert.strictEqual(boundaryWorld.responseStatus, 413,
    `Expected 413 Payload Too Large, got ${boundaryWorld.responseStatus}`
  );
});

Then('the error should mention size limit', function () {
  if (!boundaryWorld.responseBody) {
    throw new Error('No response body received');
  }
  const body = boundaryWorld.responseBody;
  const errorText = (body.error || '').toLowerCase();
  // Error should indicate size/limit/payload issue
  const sizeKeywords = ['size', 'limit', 'payload', 'large', 'too'];
  const hasSizeKeyword = sizeKeywords.some(keyword => errorText.includes(keyword));
  assert.ok(hasSizeKeyword,
    `Error message should mention size limit. Got: ${body.error}`
  );
});
