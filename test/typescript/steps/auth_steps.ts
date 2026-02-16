import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SignJWT, importPKCS8 } from 'jose';
import {
  TEST_HMAC_SECRET,
  TEST_AUTH_MODE_PLATFORM,
  TEST_AUTH_MODE_SESSION,
  TEST_SESSION_MAX_AGE_SECONDS,
  TEST_IAP_AUDIENCE,
  TEST_IAP_ISSUER,
  TEST_IAP_PRIVATE_KEY,
  TEST_IAP_PUBLIC_KEY,
} from '../../fixtures/test-config.js';
import { TEST_TIMESTAMP, TEST_NONCE } from './test-data.js';

// Lazy load auth utilities to avoid import issues during initial load
let authUtils: typeof import('../../../app/utils/auth') | null = null;

async function getAuthUtils() {
  if (!authUtils) {
    authUtils = await import('../../../app/utils/auth');
  }
  return authUtils;
}

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestUser {
  email: string;
  role: string;
  [key: string]: unknown;
}

export const authContext: {
  currentUser?: TestUser;
  currentPage?: string;
  passwordResetEmail?: string;
  responseHtml?: string;
  authMode?: 'platform' | 'session';
  sessionToken?: string;
  lastAuthResult?: string | null;
} = {};

/**
 * Create a mock Request object for testing authenticated requests.
 *
 * This helper constructs a real Request object with the specified headers,
 * avoiding unsafe `as Request` casts while providing only what getAuthenticatedUser
 * actually uses (request.headers.get()).
 *
 * @param headers - Record of header names to values
 * @returns A Request object usable in auth tests
 */
function createMockRequest(headers: Record<string, string>): Request {
  // Create a real Request with a dummy URL
  // The URL doesn't matter for getAuthenticatedUser - only headers are used
  const request = new Request('https://test.example.com', {
    headers: new Headers(headers),
  });
  return request;
}

/**
 * Cached parsed IAP private key for test JWT generation.
 *
 * INTENTIONAL: Not reset between scenarios because it caches an immutable
 * constant (TEST_IAP_PRIVATE_KEY). The key never changes during test runs,
 * so the parsed CryptoKey can be safely reused across all scenarios.
 * This is a performance optimization for the expensive importPKCS8() call.
 */
let cachedIapPrivateKey: Awaited<ReturnType<typeof importPKCS8>> | null = null;

async function getTestIapPrivateKey() {
  if (cachedIapPrivateKey) {
    return cachedIapPrivateKey;
  }
  cachedIapPrivateKey = await importPKCS8(TEST_IAP_PRIVATE_KEY, 'RS256');
  return cachedIapPrivateKey;
}

async function createTestIapJwt(email: string): Promise<string> {
  const privateKey = await getTestIapPrivateKey();
  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .setAudience(TEST_IAP_AUDIENCE)
    .setIssuer(TEST_IAP_ISSUER)
    .sign(privateKey);
}

// ============================================================================
// Environment Variable State Save/Restore
// ============================================================================

/**
 * Environment variable state tracked for save/restore.
 * These are the variables that auth steps mutate during test scenarios.
 */
interface EnvState {
  AUTH_MODE?: string;
  UPLOAD_HMAC_SECRET?: string;
  SESSION_HMAC_SECRET?: string;
  SESSION_MAX_AGE_SECONDS?: string;
  AUTH_MODE_PLATFORM_STRICT?: string;
  IAP_JWT_AUDIENCE?: string;
  IAP_JWT_PUBLIC_KEY?: string;
  IAP_JWT_ISSUER?: string;
  BUCKET_NAME?: string;
  NODE_ENV?: string;
  [key: string]: string | undefined; // Index signature for type-safe env access
}

/**
 * Saved environment variable state, restored by restoreEnvState().
 * Each scenario gets a clean save/restore cycle via Before/After hooks.
 */
let savedEnvState: EnvState = {};

/**
 * Save current auth-related environment variable state.
 * Called by the Before hook in common.ts to preserve external environment
 * configuration before auth steps mutate process.env.
 */
export function saveEnvState(): void {
  savedEnvState = {
    AUTH_MODE: process.env.AUTH_MODE,
    UPLOAD_HMAC_SECRET: process.env.UPLOAD_HMAC_SECRET,
    SESSION_HMAC_SECRET: process.env.SESSION_HMAC_SECRET,
    SESSION_MAX_AGE_SECONDS: process.env.SESSION_MAX_AGE_SECONDS,
    AUTH_MODE_PLATFORM_STRICT: process.env.AUTH_MODE_PLATFORM_STRICT,
    IAP_JWT_AUDIENCE: process.env.IAP_JWT_AUDIENCE,
    IAP_JWT_PUBLIC_KEY: process.env.IAP_JWT_PUBLIC_KEY,
    IAP_JWT_ISSUER: process.env.IAP_JWT_ISSUER,
    BUCKET_NAME: process.env.BUCKET_NAME,
    NODE_ENV: process.env.NODE_ENV,
  };
}

/**
 * Type-safe helper to set process.env variables.
 * Works around readonly TypeScript types for process.env properties.
 */
function setEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}

/**
 * Restore previously saved auth-related environment variable state.
 * Called by the After hook in common.ts to prevent cross-scenario contamination.
 * If an environment variable was not set originally, it is deleted.
 */
export function restoreEnvState(): void {
  const keys: string[] = [
    'AUTH_MODE',
    'UPLOAD_HMAC_SECRET',
    'SESSION_HMAC_SECRET',
    'SESSION_MAX_AGE_SECONDS',
    'AUTH_MODE_PLATFORM_STRICT',
    'IAP_JWT_AUDIENCE',
    'IAP_JWT_PUBLIC_KEY',
    'IAP_JWT_ISSUER',
    'BUCKET_NAME',
    'NODE_ENV',
  ];

  for (const key of keys) {
    setEnv(key, savedEnvState[key as keyof EnvState]);
  }

  // Clear saved state after restore
  savedEnvState = {};
}

/**
 * Reset the authContext to its initial empty state.
 * Called by the Before hook in common.ts before each scenario.
 */
export function resetAuthContext(): void {
  authContext.currentUser = undefined;
  authContext.currentPage = undefined;
  authContext.passwordResetEmail = undefined;
  authContext.responseHtml = undefined;
  authContext.authMode = undefined;
  authContext.sessionToken = undefined;
  authContext.lastAuthResult = undefined;
}

/**
 * Cached test users loaded from fixtures.
 *
 * INTENTIONAL: Not reset between scenarios because the fixture file
 * (test-users.json) is immutable during test runs. Unlike admin_steps.ts
 * which exports a reset function for consistency with other caches,
 * this cache can safely persist across scenarios.
 */
let cachedUsers: TestUser[] | null = null;

function loadTestUsers(): TestUser[] {
  if (cachedUsers) {
    return cachedUsers;
  }
  const fixturesPath = path.resolve(__dirname, '../../fixtures/test-users.json');
  const raw = fs.readFileSync(fixturesPath, 'utf-8');
  const parsed = JSON.parse(raw) as { users?: TestUser[] };
  cachedUsers = parsed.users ?? [];
  return cachedUsers;
}

function getUserByRole(role: string): TestUser | undefined {
  return loadTestUsers().find((user) => user.role === role);
}

Given('I am on the TTC portal login page', () => {
  authContext.currentUser = undefined;
  authContext.currentPage = 'login';
  authContext.responseHtml = 'LOGIN';
});

Given('I am authenticated on the TTC portal', () => {
  const applicant = getUserByRole('applicant') || {
    email: 'test.applicant@example.com',
    role: 'applicant',
  };
  authContext.currentUser = applicant;
  authContext.currentPage = 'home';
  authContext.responseHtml = `Logged in as ${applicant.email} LOGOUT`;
});

When('I sign in with a valid Google account', () => {
  const applicant = getUserByRole('applicant') || {
    email: 'test.applicant@example.com',
    role: 'applicant',
  };
  authContext.currentUser = applicant;
  authContext.currentPage = 'home';
  authContext.responseHtml = `Logged in as ${applicant.email} LOGOUT`;
});

When('I sign out of the TTC portal', () => {
  authContext.currentUser = undefined;
  authContext.currentPage = 'login';
  authContext.responseHtml = 'LOGIN';
  authContext.sessionToken = undefined;
});

When('I request a password reset for my Google account', () => {
  const applicant = getUserByRole('applicant') || {
    email: 'test.applicant@example.com',
    role: 'applicant',
  };
  authContext.currentUser = undefined;
  authContext.passwordResetEmail = applicant.email;
  authContext.currentPage = 'password_reset';
  authContext.responseHtml = 'PASSWORD RESET PROMPT';
});

Then('I should be redirected to the TTC portal home', () => {
  assert.equal(authContext.currentPage, 'home');
  assert.ok(authContext.responseHtml, 'Expected responseHtml to be set');
  const email = authContext.currentUser?.email;
  if (email) {
    assert.ok(authContext.responseHtml?.includes(email));
  }
  assert.ok(authContext.responseHtml?.includes('LOGOUT'));
});

Then('I should be redirected to the TTC portal login page', () => {
  assert.equal(authContext.currentPage, 'login');
  assert.ok(authContext.responseHtml, 'Expected responseHtml to be set');
  assert.ok(authContext.responseHtml?.includes('LOGIN'));
  assert.ok(!authContext.responseHtml?.includes('LOGOUT'));
});

Then('I should receive a password reset prompt from the identity provider', () => {
  assert.equal(authContext.currentPage, 'password_reset');
  assert.ok(authContext.responseHtml, 'Expected responseHtml to be set');
  assert.ok(authContext.responseHtml?.includes('PASSWORD RESET PROMPT'));
});

// ============================================================================
// Upload API Authentication Step Definitions
// ============================================================================

Given('I am in platform auth mode', () => {
  process.env.AUTH_MODE = TEST_AUTH_MODE_PLATFORM;
  process.env.UPLOAD_HMAC_SECRET = TEST_HMAC_SECRET;
  process.env.SESSION_MAX_AGE_SECONDS = TEST_SESSION_MAX_AGE_SECONDS.toString();
  authContext.authMode = TEST_AUTH_MODE_PLATFORM;
  authContext.sessionToken = undefined;
});

Given('I am in session auth mode', () => {
  process.env.AUTH_MODE = TEST_AUTH_MODE_SESSION;
  process.env.UPLOAD_HMAC_SECRET = TEST_HMAC_SECRET;
  process.env.SESSION_HMAC_SECRET = TEST_HMAC_SECRET;
  process.env.SESSION_MAX_AGE_SECONDS = TEST_SESSION_MAX_AGE_SECONDS.toString();
  authContext.authMode = TEST_AUTH_MODE_SESSION;
  authContext.sessionToken = undefined;
});

Given('I have a valid user email {string}', (email: string) => {
  authContext.currentUser = { email, role: 'applicant' };
});

Given('I have a valid session token for {string}', async (email: string) => {
  const auth = await getAuthUtils();
  const secret = TEST_HMAC_SECRET;
  const token = auth.generateSessionToken(email, secret);
  authContext.sessionToken = token;
});

Given('I have an expired session token for {string}', async (email: string) => {
  // Create a token with an old timestamp to make it expired
  const secret = TEST_HMAC_SECRET;

  // Use deterministic timestamp (2 hours before TEST_TIMESTAMP)
  const timestamp = TEST_TIMESTAMP - 7200; // 2 hours ago
  // Use deterministic nonce for reproducible tests
  const nonce = TEST_NONCE;
  const encodedEmail = Buffer.from(email).toString('base64');
  // New format: session:email:timestamp:nonce (4 fields)
  const payloadString = `session:${encodedEmail}:${timestamp}:${nonce}`;
  const encodedPayload = Buffer.from(payloadString).toString('base64url');

  // Generate HMAC signature
  const { createHmac } = await import('node:crypto');
  const signature = createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');

  authContext.sessionToken = `${encodedPayload}.${signature}`;
});

Given('I have a tampered session token for {string}', async (email: string) => {
  const auth = await getAuthUtils();
  const secret = TEST_HMAC_SECRET;
  const token = auth.generateSessionToken(email, secret);

  // Tamper with the token by changing a character
  const parts = token.split('.');
  parts[0] = parts[0].substring(0, parts[0].length - 1) + 'X';
  authContext.sessionToken = parts.join('.');
});

When('I call getAuthenticatedUser with x-user-email header {string}', async (email: string) => {
  const auth = await getAuthUtils();
  const mockRequest = createMockRequest({ 'x-user-email': email });
  authContext.lastAuthResult = await auth.getAuthenticatedUser(mockRequest);
});

When('I call getAuthenticatedUser without x-user-email header', async () => {
  const auth = await getAuthUtils();
  const mockRequest = createMockRequest({});
  authContext.lastAuthResult = await auth.getAuthenticatedUser(mockRequest);
});

When('I call getAuthenticatedUser with bearer token', async () => {
  const auth = await getAuthUtils();
  const token = authContext.sessionToken ?? '';
  const mockRequest = createMockRequest({ authorization: `Bearer ${token}` });
  authContext.lastAuthResult = await auth.getAuthenticatedUser(mockRequest);
});

When('I call getAuthenticatedUser with bearer token {string}', async (token: string) => {
  const auth = await getAuthUtils();
  const mockRequest = createMockRequest({ authorization: `Bearer ${token}` });
  authContext.lastAuthResult = await auth.getAuthenticatedUser(mockRequest);
});

When('I call getAuthenticatedUser without authorization header', async () => {
  const auth = await getAuthUtils();
  const mockRequest = createMockRequest({});
  authContext.lastAuthResult = await auth.getAuthenticatedUser(mockRequest);
});

When('I call getAuthenticatedUser with x-user-email header {string} and no bearer token', async (email: string) => {
  const auth = await getAuthUtils();
  const mockRequest = createMockRequest({ 'x-user-email': email });
  authContext.lastAuthResult = await auth.getAuthenticatedUser(mockRequest);
});

When('I generate a session token for {string}', async (email: string) => {
  const auth = await getAuthUtils();
  const secret = TEST_HMAC_SECRET;
  authContext.sessionToken = auth.generateSessionToken(email, secret);
});

When('I verify the session token', async () => {
  const auth = await getAuthUtils();
  const secret = TEST_HMAC_SECRET;
  const token = authContext.sessionToken ?? '';
  authContext.lastAuthResult = auth.verifySessionToken(token, secret);
});

Then('the response should be the user {string}', (expectedEmail: string) => {
  assert.equal(authContext.lastAuthResult, expectedEmail);
});

Then('the response should be null', () => {
  assert.equal(authContext.lastAuthResult, null);
});

Then('the token should have a valid format', () => {
  const token = authContext.sessionToken;
  assert.ok(token, 'Expected session token to be set');

  // Token format: base64url(payload) + "." + base64url(signature)
  const parts = token?.split('.') ?? [];
  assert.equal(parts.length, 2, 'Token should have exactly two parts separated by a dot');

  const [payload, signature] = parts;
  assert.ok(payload, 'Token payload should not be empty');
  assert.ok(signature, 'Token signature should not be empty');

  // Verify base64url format (only alphanumeric, hyphen, underscore)
  const base64urlRegex = /^[A-Za-z0-9_-]+$/;
  assert.ok(base64urlRegex.test(payload), 'Token payload should be base64url encoded');
  assert.ok(base64urlRegex.test(signature), 'Token signature should be base64url encoded');
});

Given('I generated a session token for {string}', async (email: string) => {
  const auth = await getAuthUtils();
  const secret = TEST_HMAC_SECRET;
  authContext.sessionToken = auth.generateSessionToken(email, secret);
});

// ============================================================================
// New steps for fail-secure default behavior and IAP verification
// ============================================================================

Given('I have not set AUTH_MODE environment variable', () => {
  delete process.env.AUTH_MODE;
  process.env.UPLOAD_HMAC_SECRET = TEST_HMAC_SECRET;
  process.env.SESSION_MAX_AGE_SECONDS = TEST_SESSION_MAX_AGE_SECONDS.toString();
  authContext.authMode = undefined;
});

Given('I am in platform auth mode with strict IAP verification', () => {
  process.env.AUTH_MODE = TEST_AUTH_MODE_PLATFORM;
  process.env.AUTH_MODE_PLATFORM_STRICT = 'true';
  process.env.UPLOAD_HMAC_SECRET = TEST_HMAC_SECRET;
  process.env.SESSION_MAX_AGE_SECONDS = TEST_SESSION_MAX_AGE_SECONDS.toString();
  process.env.IAP_JWT_AUDIENCE = TEST_IAP_AUDIENCE;
  process.env.IAP_JWT_PUBLIC_KEY = TEST_IAP_PUBLIC_KEY;
  process.env.IAP_JWT_ISSUER = TEST_IAP_ISSUER;
  authContext.authMode = TEST_AUTH_MODE_PLATFORM;
});

When('I call getAuthenticatedUser with x-user-email header {string} without IAP JWT assertion', async (email: string) => {
  const auth = await getAuthUtils();
  const mockRequest = createMockRequest({ 'x-user-email': email });
  authContext.lastAuthResult = await auth.getAuthenticatedUser(mockRequest);
});

When('I call getAuthenticatedUser with x-user-email header {string} with verified IAP JWT assertion', async (email: string) => {
  const auth = await getAuthUtils();
  const assertion = await createTestIapJwt(email);
  const mockRequest = createMockRequest({
    'x-user-email': email,
    'x-goog-iap-jwt-assertion': assertion,
  });
  authContext.lastAuthResult = await auth.getAuthenticatedUser(mockRequest);
});

When(
  'I call getAuthenticatedUser with x-user-email header {string} and a verified IAP JWT assertion for {string}',
  async (headerEmail: string, jwtEmail: string) => {
    const auth = await getAuthUtils();
    const assertion = await createTestIapJwt(jwtEmail);
    const mockRequest = createMockRequest({
      'x-user-email': headerEmail,
      'x-goog-iap-jwt-assertion': assertion,
    });
    authContext.lastAuthResult = await auth.getAuthenticatedUser(mockRequest);
  }
);

Then('my session should be invalidated', () => {
  assert.equal(authContext.sessionToken, undefined, 'Session token should be cleared after logout');
});

// ============================================================================
// Production strict-mode enforcement test scenarios
// ============================================================================

Given('I am in platform auth mode in production', () => {
  process.env.AUTH_MODE = TEST_AUTH_MODE_PLATFORM;
  setEnv('NODE_ENV', 'production');
  process.env.UPLOAD_HMAC_SECRET = TEST_HMAC_SECRET;
  process.env.SESSION_MAX_AGE_SECONDS = TEST_SESSION_MAX_AGE_SECONDS.toString();
  authContext.authMode = TEST_AUTH_MODE_PLATFORM;
});

Given('I am in platform auth mode in development', () => {
  process.env.AUTH_MODE = TEST_AUTH_MODE_PLATFORM;
  setEnv('NODE_ENV', 'development');
  process.env.UPLOAD_HMAC_SECRET = TEST_HMAC_SECRET;
  process.env.SESSION_MAX_AGE_SECONDS = TEST_SESSION_MAX_AGE_SECONDS.toString();
  authContext.authMode = TEST_AUTH_MODE_PLATFORM;
});

When('I call getAuthenticatedUser in platform mode without strict verification', async () => {
  const auth = await getAuthUtils();
  const mockRequest = createMockRequest({ 'x-user-email': 'test@example.com' });
  authContext.lastAuthResult = await auth.getAuthenticatedUser(mockRequest);
});

Then('the response should be null in production without strict mode', () => {
  assert.equal(authContext.lastAuthResult, null, 'Platform mode without strict verification should fail in production');
});

Then('the response should be the user in development without strict mode', () => {
  assert.equal(authContext.lastAuthResult, 'test@example.com', 'Platform mode without strict should work in development');
});

// ============================================================================
// NODE_ENV and AUTH_MODE_PLATFORM_STRICT combination steps
// ============================================================================

/**
 * Set platform auth mode with a specific NODE_ENV value.
 * Handles 'unset' as a special value to delete NODE_ENV.
 */
Given('I am in platform auth mode with NODE_ENV {string}', (nodeEnv: string) => {
  process.env.AUTH_MODE = TEST_AUTH_MODE_PLATFORM;
  process.env.UPLOAD_HMAC_SECRET = TEST_HMAC_SECRET;
  process.env.SESSION_MAX_AGE_SECONDS = TEST_SESSION_MAX_AGE_SECONDS.toString();
  // Use setEnv to handle NODE_ENV read-only property in TypeScript
  setEnv('NODE_ENV', nodeEnv === 'unset' ? undefined : nodeEnv);
  authContext.authMode = TEST_AUTH_MODE_PLATFORM;
});

/**
 * Set AUTH_MODE_PLATFORM_STRICT value.
 * Handles 'unset' as a special value to delete the env var.
 * Only the literal string 'true' enables strict mode.
 */
Given('AUTH_MODE_PLATFORM_STRICT is {string}', (strict: string) => {
  if (strict === 'unset') {
    delete process.env.AUTH_MODE_PLATFORM_STRICT;
  } else {
    process.env.AUTH_MODE_PLATFORM_STRICT = strict;
  }
});

/**
 * Set IAP configuration for strict mode testing.
 */
Given('IAP is configured for testing', () => {
  process.env.IAP_JWT_AUDIENCE = TEST_IAP_AUDIENCE;
  process.env.IAP_JWT_ISSUER = TEST_IAP_ISSUER;
  process.env.IAP_JWT_PUBLIC_KEY = TEST_IAP_PUBLIC_KEY;
});

/**
 * Verify that the auth result requires IAP verification.
 * This means null is returned without IAP JWT.
 */
Then('the response should require IAP verification', () => {
  assert.equal(
    authContext.lastAuthResult,
    null,
    'Should require IAP verification when strict mode is enabled'
  );
});

/**
 * Verify that the auth result matches the expected value.
 * Handles both "null" literal and email addresses for Scenario Outline compatibility.
 */
Then('the response should be {string}', (expectedValue: string) => {
  if (expectedValue === 'null') {
    assert.equal(
      authContext.lastAuthResult,
      null,
      'Should return null for rejected auth'
    );
  } else {
    assert.equal(
      authContext.lastAuthResult,
      expectedValue,
      `Should return the user email: ${expectedValue}`
    );
  }
});

/**
 * Verify that the auth result is the expected user email.
 */
Then('the response should allow the user email {string}', (expectedEmail: string) => {
  assert.equal(
    authContext.lastAuthResult,
    expectedEmail,
    'Should allow x-user-email header in non-strict mode'
  );
});

// ============================================================================
// Upload API authentication scenarios
// ============================================================================

Given('I am authenticated as user {string}', async (userEmail: string) => {
  const auth = await getAuthUtils();
  // Set up session mode for upload API testing
  process.env.AUTH_MODE = TEST_AUTH_MODE_SESSION;
  process.env.UPLOAD_HMAC_SECRET = TEST_HMAC_SECRET;
  process.env.SESSION_HMAC_SECRET = TEST_HMAC_SECRET;
  process.env.SESSION_MAX_AGE_SECONDS = TEST_SESSION_MAX_AGE_SECONDS.toString();

  authContext.authMode = TEST_AUTH_MODE_SESSION;
  authContext.currentUser = { email: userEmail, role: 'user' };
  // Generate a valid session token for the user
  authContext.sessionToken = auth.generateSessionToken(userEmail, TEST_HMAC_SECRET);
});
