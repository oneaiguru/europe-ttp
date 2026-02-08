/**
 * Unit tests for authentication utilities.
 * Tests focus on session token generation, validation, and environment-based authentication modes.
 */

// @ts-expect-error - bun:test is a built-in Bun module
import { describe, it, expect } from 'bun:test';
import { createHmac } from 'crypto';
import {
  getAuthMode,
  getSessionMaxAge,
  generateSessionToken,
  verifySessionToken,
  extractBearerToken,
  getAuthenticatedUser,
} from '../../app/utils/auth';

describe('auth utilities', () => {
  const testSecret = 'test-secret-key-for-unit-testing';
  const testEmail = 'test@example.com';

  describe('getAuthMode', () => {
    it('returns "platform" by default', () => {
      const originalMode = process.env.AUTH_MODE;
      delete process.env.AUTH_MODE;
      expect(getAuthMode()).toBe('platform');
      if (originalMode) process.env.AUTH_MODE = originalMode;
    });

    it('returns "session" when AUTH_MODE=session', () => {
      const originalMode = process.env.AUTH_MODE;
      process.env.AUTH_MODE = 'session';
      expect(getAuthMode()).toBe('session');
      if (originalMode) process.env.AUTH_MODE = originalMode;
      else delete process.env.AUTH_MODE;
    });

    it('returns "platform" for any other value', () => {
      const originalMode = process.env.AUTH_MODE;
      process.env.AUTH_MODE = 'invalid';
      expect(getAuthMode()).toBe('platform');
      if (originalMode) process.env.AUTH_MODE = originalMode;
      else delete process.env.AUTH_MODE;
    });
  });

  describe('getSessionMaxAge', () => {
    it('returns 3600 when SESSION_MAX_AGE_SECONDS is not set', () => {
      const originalMaxAge = process.env.SESSION_MAX_AGE_SECONDS;
      delete process.env.SESSION_MAX_AGE_SECONDS;
      expect(getSessionMaxAge()).toBe(3600);
      if (originalMaxAge) process.env.SESSION_MAX_AGE_SECONDS = originalMaxAge;
    });

    it('returns parsed value when SESSION_MAX_AGE_SECONDS is valid', () => {
      const originalMaxAge = process.env.SESSION_MAX_AGE_SECONDS;
      process.env.SESSION_MAX_AGE_SECONDS = '7200';
      expect(getSessionMaxAge()).toBe(7200);
      if (originalMaxAge) process.env.SESSION_MAX_AGE_SECONDS = originalMaxAge;
      else delete process.env.SESSION_MAX_AGE_SECONDS;
    });

    it('throws when SESSION_MAX_AGE_SECONDS is "invalid" (NaN)', () => {
      const originalMaxAge = process.env.SESSION_MAX_AGE_SECONDS;
      process.env.SESSION_MAX_AGE_SECONDS = 'invalid';
      expect(() => getSessionMaxAge()).toThrow('SESSION_MAX_AGE_SECONDS must be a valid integer');
      if (originalMaxAge) process.env.SESSION_MAX_AGE_SECONDS = originalMaxAge;
      else delete process.env.SESSION_MAX_AGE_SECONDS;
    });

    it('throws when SESSION_MAX_AGE_SECONDS is "-1" (negative)', () => {
      const originalMaxAge = process.env.SESSION_MAX_AGE_SECONDS;
      process.env.SESSION_MAX_AGE_SECONDS = '-1';
      expect(() => getSessionMaxAge()).toThrow('SESSION_MAX_AGE_SECONDS must be a positive integer');
      if (originalMaxAge) process.env.SESSION_MAX_AGE_SECONDS = originalMaxAge;
      else delete process.env.SESSION_MAX_AGE_SECONDS;
    });

    it('throws when SESSION_MAX_AGE_SECONDS is "0" (zero)', () => {
      const originalMaxAge = process.env.SESSION_MAX_AGE_SECONDS;
      process.env.SESSION_MAX_AGE_SECONDS = '0';
      expect(() => getSessionMaxAge()).toThrow('SESSION_MAX_AGE_SECONDS must be a positive integer');
      if (originalMaxAge) process.env.SESSION_MAX_AGE_SECONDS = originalMaxAge;
      else delete process.env.SESSION_MAX_AGE_SECONDS;
    });

    it('throws when SESSION_MAX_AGE_SECONDS exceeds 30 days', () => {
      const originalMaxAge = process.env.SESSION_MAX_AGE_SECONDS;
      process.env.SESSION_MAX_AGE_SECONDS = '2600000'; // > 2,592,000 (30 days)
      expect(() => getSessionMaxAge()).toThrow('SESSION_MAX_AGE_SECONDS must be at most 30 days');
      if (originalMaxAge) process.env.SESSION_MAX_AGE_SECONDS = originalMaxAge;
      else delete process.env.SESSION_MAX_AGE_SECONDS;
    });

    it('accepts exactly 30 days (2,592,000 seconds)', () => {
      const originalMaxAge = process.env.SESSION_MAX_AGE_SECONDS;
      process.env.SESSION_MAX_AGE_SECONDS = '2592000';
      expect(getSessionMaxAge()).toBe(2592000);
      if (originalMaxAge) process.env.SESSION_MAX_AGE_SECONDS = originalMaxAge;
      else delete process.env.SESSION_MAX_AGE_SECONDS;
    });
  });

  describe('generateSessionToken', () => {
    it('generates token with payload.signature format', () => {
      const token = generateSessionToken(testEmail, testSecret);
      expect(token).toContain('.');
      const parts = token.split('.');
      expect(parts).toHaveLength(2);
      expect(parts[0]).toBeTruthy(); // encodedPayload
      expect(parts[1]).toBeTruthy(); // signature
    });

    it('generates different nonces each time (tokens are unique)', () => {
      const token1 = generateSessionToken(testEmail, testSecret);
      const token2 = generateSessionToken(testEmail, testSecret);
      // Tokens should be different due to random nonce
      expect(token1).not.toBe(token2);
      // But both should verify successfully
      expect(verifySessionToken(token1, testSecret)).toBe(testEmail);
      expect(verifySessionToken(token2, testSecret)).toBe(testEmail);
    });

    it('generates different tokens for different inputs', () => {
      const token1 = generateSessionToken(testEmail, testSecret);
      const token2 = generateSessionToken('different@example.com', testSecret);
      expect(token1).not.toBe(token2);
    });

    it('generates different tokens for different secrets', () => {
      const token1 = generateSessionToken(testEmail, testSecret);
      const token2 = generateSessionToken(testEmail, 'different-secret');
      expect(token1).not.toBe(token2);
    });

    it('handles special characters in email', () => {
      const specialEmail = 'user+test@example.com';
      const token = generateSessionToken(specialEmail, testSecret);
      expect(token).toContain('.');
      const decoded = verifySessionToken(token, testSecret);
      expect(decoded).toBe(specialEmail);
    });

    it('handles unicode characters in email', () => {
      const unicodeEmail = 'tëst@ëxåmplé.com';
      const token = generateSessionToken(unicodeEmail, testSecret);
      expect(token).toContain('.');
      const decoded = verifySessionToken(token, testSecret);
      expect(decoded).toBe(unicodeEmail);
    });
  });

  describe('verifySessionToken', () => {
    it('verifies valid token', () => {
      const token = generateSessionToken(testEmail, testSecret);
      const decoded = verifySessionToken(token, testSecret);
      expect(decoded).toBe(testEmail);
    });

    it('returns null for invalid signature', () => {
      const token = generateSessionToken(testEmail, testSecret);
      const lastDotIndex = token.lastIndexOf('.');
      const tamperedToken = token.substring(0, lastDotIndex + 1) + 'badsignature';
      const decoded = verifySessionToken(tamperedToken, testSecret);
      expect(decoded).toBeNull();
    });

    it('returns null for expired token', () => {
      // Create a token in the past by mocking timestamp
      const oldTimestamp = Math.floor(Date.now() / 1000) - 4000; // > 1 hour ago
      const nonce = Buffer.alloc(16).toString('base64url');
      const encodedEmail = Buffer.from(testEmail).toString('base64');
      const payloadString = `${encodedEmail}:${oldTimestamp}:${nonce}`;
      const encodedPayload = Buffer.from(payloadString).toString('base64url');

      const signature = createHmac('sha256', testSecret)
        .update(encodedPayload)
        .digest('base64url');

      const expiredToken = `${encodedPayload}.${signature}`;
      const decoded = verifySessionToken(expiredToken, testSecret);
      expect(decoded).toBeNull();
    });

    it('returns null for malformed tokens', () => {
      expect(verifySessionToken('', testSecret)).toBeNull();
      expect(verifySessionToken('no-dot', testSecret)).toBeNull();
      expect(verifySessionToken('.only-signature', testSecret)).toBeNull();
      expect(verifySessionToken('only-payload.', testSecret)).toBeNull();
    });

    it('returns null for token with wrong secret', () => {
      const token = generateSessionToken(testEmail, testSecret);
      const decoded = verifySessionToken(token, 'wrong-secret');
      expect(decoded).toBeNull();
    });
  });

  describe('extractBearerToken', () => {
    it('extracts token from "Bearer <token>" header', () => {
      const testToken = 'my-test-token';
      const authHeader = `Bearer ${testToken}`;
      expect(extractBearerToken(authHeader)).toBe(testToken);
    });

    it('returns null for missing header', () => {
      expect(extractBearerToken(null)).toBeNull();
    });

    it('returns null for malformed header', () => {
      expect(extractBearerToken('Basic abc123')).toBeNull();
      expect(extractBearerToken('Bearer')).toBeNull();
      expect(extractBearerToken('Bearer token extra')).toBeNull();
      expect(extractBearerToken('token-without-bearer')).toBeNull();
    });
  });

  describe('getAuthenticatedUser', () => {
    // Helper function to create a mock Request
    function createMockRequest(headers: Record<string, string | null>): Request {
      return {
        headers: {
          get: (name: string) => headers[name.toLowerCase()] ?? null,
        },
      } as unknown as Request;
    }

    it('session mode: returns user for valid token', async () => {
      const originalMode = process.env.AUTH_MODE;
      const originalSecret = process.env.UPLOAD_HMAC_SECRET;
      process.env.AUTH_MODE = 'session';
      process.env.UPLOAD_HMAC_SECRET = testSecret;

      const token = generateSessionToken(testEmail, testSecret);
      const request = createMockRequest({
        authorization: `Bearer ${token}`,
      });

      const user = await getAuthenticatedUser(request);
      expect(user).toBe(testEmail);

      if (originalMode) process.env.AUTH_MODE = originalMode;
      else delete process.env.AUTH_MODE;
      if (originalSecret) process.env.UPLOAD_HMAC_SECRET = originalSecret;
      else delete process.env.UPLOAD_HMAC_SECRET;
    });

    it('session mode: returns null for invalid token', async () => {
      const originalMode = process.env.AUTH_MODE;
      const originalSecret = process.env.UPLOAD_HMAC_SECRET;
      process.env.AUTH_MODE = 'session';
      process.env.UPLOAD_HMAC_SECRET = testSecret;

      const request = createMockRequest({
        authorization: 'Bearer invalid-token',
      });

      const user = await getAuthenticatedUser(request);
      expect(user).toBeNull();

      if (originalMode) process.env.AUTH_MODE = originalMode;
      else delete process.env.AUTH_MODE;
      if (originalSecret) process.env.UPLOAD_HMAC_SECRET = originalSecret;
      else delete process.env.UPLOAD_HMAC_SECRET;
    });

    it('platform mode: returns user for valid x-user-email', async () => {
      const originalMode = process.env.AUTH_MODE;
      delete process.env.AUTH_MODE; // defaults to platform

      const request = createMockRequest({
        'x-user-email': testEmail,
      });

      const user = await getAuthenticatedUser(request);
      expect(user).toBe(testEmail);

      if (originalMode) process.env.AUTH_MODE = originalMode;
      else delete process.env.AUTH_MODE;
    });

    it('platform mode: returns null for missing x-user-email', async () => {
      const originalMode = process.env.AUTH_MODE;
      delete process.env.AUTH_MODE; // defaults to platform

      const request = createMockRequest({});

      const user = await getAuthenticatedUser(request);
      expect(user).toBeNull();

      if (originalMode) process.env.AUTH_MODE = originalMode;
      else delete process.env.AUTH_MODE;
    });

    it('platform mode: returns null for invalid email format', async () => {
      const originalMode = process.env.AUTH_MODE;
      delete process.env.AUTH_MODE; // defaults to platform

      const request = createMockRequest({
        'x-user-email': 'not-an-email',
      });

      const user = await getAuthenticatedUser(request);
      expect(user).toBeNull();

      if (originalMode) process.env.AUTH_MODE = originalMode;
      else delete process.env.AUTH_MODE;
    });
  });
});
