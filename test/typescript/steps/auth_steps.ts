import { Given, When, Then } from '@cucumber/cucumber';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TEST_HMAC_SECRET,
  TEST_AUTH_MODE_PLATFORM,
  TEST_AUTH_MODE_SESSION,
  TEST_SESSION_MAX_AGE_SECONDS,
} from '../../fixtures/test-config.js';

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
});

Given('I am in session auth mode', () => {
  process.env.AUTH_MODE = TEST_AUTH_MODE_SESSION;
  process.env.UPLOAD_HMAC_SECRET = TEST_HMAC_SECRET;
  process.env.SESSION_MAX_AGE_SECONDS = TEST_SESSION_MAX_AGE_SECONDS.toString();
  authContext.authMode = TEST_AUTH_MODE_SESSION;
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
  const auth = await getAuthUtils();
  const secret = TEST_HMAC_SECRET;

  // Create a token with an old timestamp to make it expired
  const timestamp = Math.floor(Date.now() / 1000) - 7200; // 2 hours ago
  const nonce = Buffer.from(Math.random().toString()).toString('base64url');
  const encodedEmail = Buffer.from(email).toString('base64');
  const payloadString = `${encodedEmail}:${timestamp}:${nonce}`;
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

  // Create a mock Request object with the x-user-email header
  const mockRequest = {
    headers: {
      get: (name: string) => name === 'x-user-email' ? email : null,
    },
  } as Request;

  authContext.lastAuthResult = await auth.getAuthenticatedUser(mockRequest);
});

When('I call getAuthenticatedUser without x-user-email header', async () => {
  const auth = await getAuthUtils();

  const mockRequest = {
    headers: {
      get: (name: string) => null,
    },
  } as Request;

  authContext.lastAuthResult = await auth.getAuthenticatedUser(mockRequest);
});

When('I call getAuthenticatedUser with bearer token', async () => {
  const auth = await getAuthUtils();
  const token = authContext.sessionToken ?? '';

  const mockRequest = {
    headers: {
      get: (name: string) => name === 'authorization' ? `Bearer ${token}` : null,
    },
  } as Request;

  authContext.lastAuthResult = await auth.getAuthenticatedUser(mockRequest);
});

When('I call getAuthenticatedUser with bearer token {string}', async (token: string) => {
  const auth = await getAuthUtils();

  const mockRequest = {
    headers: {
      get: (name: string) => name === 'authorization' ? `Bearer ${token}` : null,
    },
  } as Request;

  authContext.lastAuthResult = await auth.getAuthenticatedUser(mockRequest);
});

When('I call getAuthenticatedUser without authorization header', async () => {
  const auth = await getAuthUtils();

  const mockRequest = {
    headers: {
      get: (name: string) => null,
    },
  } as Request;

  authContext.lastAuthResult = await auth.getAuthenticatedUser(mockRequest);
});

When('I call getAuthenticatedUser with x-user-email header {string} and no bearer token', async (email: string) => {
  const auth = await getAuthUtils();

  const mockRequest = {
    headers: {
      get: (name: string) => name === 'x-user-email' ? email : null,
    },
  } as Request;

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
