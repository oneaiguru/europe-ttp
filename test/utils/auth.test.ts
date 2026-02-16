/**
 * Unit tests for authentication utilities.
 * Tests focus on session token generation, validation, and environment-based authentication modes.
 */

// @ts-expect-error - bun:test is a built-in Bun module
import { describe, it, expect } from 'bun:test';
import { createHmac } from 'crypto';
import { SignJWT, importPKCS8 } from 'jose';
import {
  getAuthMode,
  getSessionMaxAge,
  generateSessionToken,
  verifySessionToken,
  extractBearerToken,
  getAuthenticatedUser,
} from '../../app/utils/auth';
import { generateUploadToken, type UploadPayload } from '../../app/utils/crypto';
import {
  TEST_IAP_AUDIENCE,
  TEST_IAP_ISSUER,
  TEST_IAP_PRIVATE_KEY,
  TEST_IAP_PUBLIC_KEY,
} from '../fixtures/test-config';

describe('auth utilities', () => {
  const testSecret = 'test-secret-key-for-unit-testing';
  const testEmail = 'test@example.com';

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

  // Helper function to create a mock Request (shared across test blocks)
  function createMockRequest(headers: Record<string, string | null>): Request {
    return {
      headers: {
        get: (name: string) => headers[name.toLowerCase()] ?? null,
      },
    } as unknown as Request;
  }

  function setStrictPlatformEnv() {
    const saved = {
      AUTH_MODE: process.env.AUTH_MODE,
      AUTH_MODE_PLATFORM_STRICT: process.env.AUTH_MODE_PLATFORM_STRICT,
      IAP_JWT_AUDIENCE: process.env.IAP_JWT_AUDIENCE,
      IAP_JWT_ISSUER: process.env.IAP_JWT_ISSUER,
      IAP_JWT_PUBLIC_KEY: process.env.IAP_JWT_PUBLIC_KEY,
    };

    process.env.AUTH_MODE = 'platform';
    process.env.AUTH_MODE_PLATFORM_STRICT = 'true';
    process.env.IAP_JWT_AUDIENCE = TEST_IAP_AUDIENCE;
    process.env.IAP_JWT_ISSUER = TEST_IAP_ISSUER;
    process.env.IAP_JWT_PUBLIC_KEY = TEST_IAP_PUBLIC_KEY;

    return () => {
      if (saved.AUTH_MODE !== undefined) process.env.AUTH_MODE = saved.AUTH_MODE;
      else delete process.env.AUTH_MODE;

      if (saved.AUTH_MODE_PLATFORM_STRICT !== undefined) {
        process.env.AUTH_MODE_PLATFORM_STRICT = saved.AUTH_MODE_PLATFORM_STRICT;
      } else {
        delete process.env.AUTH_MODE_PLATFORM_STRICT;
      }

      if (saved.IAP_JWT_AUDIENCE !== undefined) {
        process.env.IAP_JWT_AUDIENCE = saved.IAP_JWT_AUDIENCE;
      } else {
        delete process.env.IAP_JWT_AUDIENCE;
      }

      if (saved.IAP_JWT_ISSUER !== undefined) {
        process.env.IAP_JWT_ISSUER = saved.IAP_JWT_ISSUER;
      } else {
        delete process.env.IAP_JWT_ISSUER;
      }

      if (saved.IAP_JWT_PUBLIC_KEY !== undefined) {
        process.env.IAP_JWT_PUBLIC_KEY = saved.IAP_JWT_PUBLIC_KEY;
      } else {
        delete process.env.IAP_JWT_PUBLIC_KEY;
      }
    };
  }

  describe('getAuthMode', () => {
    it('returns "session" by default (fail-secure)', () => {
      const originalMode = process.env.AUTH_MODE;
      delete process.env.AUTH_MODE;
      expect(getAuthMode()).toBe('session');
      if (originalMode) process.env.AUTH_MODE = originalMode;
    });

    it('returns "session" when AUTH_MODE=session', () => {
      const originalMode = process.env.AUTH_MODE;
      process.env.AUTH_MODE = 'session';
      expect(getAuthMode()).toBe('session');
      if (originalMode) process.env.AUTH_MODE = originalMode;
      else delete process.env.AUTH_MODE;
    });

    it('returns "platform" when AUTH_MODE=platform (explicit opt-in)', () => {
      const originalMode = process.env.AUTH_MODE;
      process.env.AUTH_MODE = 'platform';
      expect(getAuthMode()).toBe('platform');
      if (originalMode) process.env.AUTH_MODE = originalMode;
      else delete process.env.AUTH_MODE;
    });

    it('returns "session" for invalid values (fail-secure)', () => {
      const originalMode = process.env.AUTH_MODE;
      process.env.AUTH_MODE = 'invalid';
      expect(getAuthMode()).toBe('session');
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
      expect(() => getSessionMaxAge()).toThrow('SESSION_MAX_AGE_SECONDS must be a positive integer');
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

    it('throws when SESSION_MAX_AGE_SECONDS has trailing junk (e.g., "3600abc")', () => {
      const originalMaxAge = process.env.SESSION_MAX_AGE_SECONDS;
      process.env.SESSION_MAX_AGE_SECONDS = '3600abc';
      expect(() => getSessionMaxAge()).toThrow('SESSION_MAX_AGE_SECONDS must be a positive integer');
      if (originalMaxAge) process.env.SESSION_MAX_AGE_SECONDS = originalMaxAge;
      else delete process.env.SESSION_MAX_AGE_SECONDS;
    });

    it('throws when SESSION_MAX_AGE_SECONDS has leading zeros (e.g., "03600")', () => {
      const originalMaxAge = process.env.SESSION_MAX_AGE_SECONDS;
      process.env.SESSION_MAX_AGE_SECONDS = '03600';
      expect(() => getSessionMaxAge()).toThrow('SESSION_MAX_AGE_SECONDS must be a positive integer');
      if (originalMaxAge) process.env.SESSION_MAX_AGE_SECONDS = originalMaxAge;
      else delete process.env.SESSION_MAX_AGE_SECONDS;
    });

    it('throws when SESSION_MAX_AGE_SECONDS has scientific notation (e.g., "1e3")', () => {
      const originalMaxAge = process.env.SESSION_MAX_AGE_SECONDS;
      process.env.SESSION_MAX_AGE_SECONDS = '1e3';
      expect(() => getSessionMaxAge()).toThrow('SESSION_MAX_AGE_SECONDS must be a positive integer');
      if (originalMaxAge) process.env.SESSION_MAX_AGE_SECONDS = originalMaxAge;
      else delete process.env.SESSION_MAX_AGE_SECONDS;
    });

    it('uses default when SESSION_MAX_AGE_SECONDS is whitespace only', () => {
      const originalMaxAge = process.env.SESSION_MAX_AGE_SECONDS;
      process.env.SESSION_MAX_AGE_SECONDS = '   ';
      expect(getSessionMaxAge()).toBe(3600);
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
      // Create a token in the past by mocking timestamp (using new 4-field format)
      const oldTimestamp = Math.floor(Date.now() / 1000) - 4000; // > 1 hour ago
      const nonce = Buffer.alloc(16).toString('base64url');
      const encodedEmail = Buffer.from(testEmail).toString('base64');
      // New format: session:email:timestamp:nonce (4 fields)
      const payloadString = `session:${encodedEmail}:${oldTimestamp}:${nonce}`;
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

    it('returns null for token with timestamp far in the future', () => {
      // Create a token with a timestamp 10 minutes in the future (beyond CLOCK_SKEW_TOLERANCE)
      const futureTimestamp = Math.floor(Date.now() / 1000) + 600; // 10 minutes ahead
      const nonce = Buffer.alloc(16).toString('base64url');
      const encodedEmail = Buffer.from(testEmail).toString('base64');
      const payloadString = `session:${encodedEmail}:${futureTimestamp}:${nonce}`;
      const encodedPayload = Buffer.from(payloadString).toString('base64url');

      const signature = createHmac('sha256', testSecret)
        .update(encodedPayload)
        .digest('base64url');

      const futureToken = `${encodedPayload}.${signature}`;
      const decoded = verifySessionToken(futureToken, testSecret);
      expect(decoded).toBeNull();
    });

    it('accepts token with timestamp within clock skew tolerance', () => {
      // Create a token with a timestamp 2 minutes in the future (within CLOCK_SKEW_TOLERANCE)
      const nearFutureTimestamp = Math.floor(Date.now() / 1000) + 120; // 2 minutes ahead
      const nonce = Buffer.alloc(16).toString('base64url');
      const encodedEmail = Buffer.from(testEmail).toString('base64');
      const payloadString = `session:${encodedEmail}:${nearFutureTimestamp}:${nonce}`;
      const encodedPayload = Buffer.from(payloadString).toString('base64url');

      const signature = createHmac('sha256', testSecret)
        .update(encodedPayload)
        .digest('base64url');

      const nearFutureToken = `${encodedPayload}.${signature}`;
      const decoded = verifySessionToken(nearFutureToken, testSecret);
      expect(decoded).toBe(testEmail);
    });

    it('accepts token with timestamp slightly in the past', () => {
      // Create a token with a timestamp 2 minutes in the past
      const pastTimestamp = Math.floor(Date.now() / 1000) - 120;
      const nonce = Buffer.alloc(16).toString('base64url');
      const encodedEmail = Buffer.from(testEmail).toString('base64');
      const payloadString = `session:${encodedEmail}:${pastTimestamp}:${nonce}`;
      const encodedPayload = Buffer.from(payloadString).toString('base64url');

      const signature = createHmac('sha256', testSecret)
        .update(encodedPayload)
        .digest('base64url');

      const pastToken = `${encodedPayload}.${signature}`;
      const decoded = verifySessionToken(pastToken, testSecret);
      expect(decoded).toBe(testEmail);
    });
  });

  describe('extractBearerToken', () => {
    it('extracts token from "Bearer <token>" header', () => {
      const testToken = 'my-test-token';
      const authHeader = `Bearer ${testToken}`;
      expect(extractBearerToken(authHeader)).toBe(testToken);
    });

    it('accepts lowercase "bearer" scheme', () => {
      const testToken = 'my-test-token';
      const authHeader = `bearer ${testToken}`;
      expect(extractBearerToken(authHeader)).toBe(testToken);
    });

    it('accepts uppercase "BEARER" scheme', () => {
      const testToken = 'my-test-token';
      const authHeader = `BEARER ${testToken}`;
      expect(extractBearerToken(authHeader)).toBe(testToken);
    });

    it('accepts mixed-case "BeArEr" scheme', () => {
      const testToken = 'my-test-token';
      const authHeader = `BeArEr ${testToken}`;
      expect(extractBearerToken(authHeader)).toBe(testToken);
    });

    it('rejects lowercase "basic" scheme (non-bearer)', () => {
      const authHeader = 'basic abc123';
      expect(extractBearerToken(authHeader)).toBeNull();
    });

    it('rejects mixed-case "BaSiC" scheme (non-bearer)', () => {
      const authHeader = 'BaSiC abc123';
      expect(extractBearerToken(authHeader)).toBeNull();
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
      process.env.AUTH_MODE = 'platform';

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
      process.env.AUTH_MODE = 'platform';

      const request = createMockRequest({});

      const user = await getAuthenticatedUser(request);
      expect(user).toBeNull();

      if (originalMode) process.env.AUTH_MODE = originalMode;
      else delete process.env.AUTH_MODE;
    });

    it('platform mode: returns null for invalid email format', async () => {
      const originalMode = process.env.AUTH_MODE;
      process.env.AUTH_MODE = 'platform';

      const request = createMockRequest({
        'x-user-email': 'not-an-email',
      });

      const user = await getAuthenticatedUser(request);
      expect(user).toBeNull();

      if (originalMode) process.env.AUTH_MODE = originalMode;
      else delete process.env.AUTH_MODE;
    });

    it('platform mode with strict: rejects request without IAP JWT assertion', async () => {
      const restoreEnv = setStrictPlatformEnv();

      const request = createMockRequest({
        'x-user-email': testEmail,
      });

      const user = await getAuthenticatedUser(request);
      expect(user).toBeNull();

      restoreEnv();
    });

    it('platform mode with strict: accepts request with verified IAP JWT assertion', async () => {
      const restoreEnv = setStrictPlatformEnv();
      const assertion = await createTestIapJwt(testEmail);

      const request = createMockRequest({
        'x-user-email': testEmail,
        'x-goog-iap-jwt-assertion': assertion,
      });

      const user = await getAuthenticatedUser(request);
      expect(user).toBe(testEmail);

      restoreEnv();
    });

    it('platform mode with strict: rejects mismatched x-user-email', async () => {
      const restoreEnv = setStrictPlatformEnv();
      const assertion = await createTestIapJwt(testEmail);

      const request = createMockRequest({
        'x-user-email': 'spoof@example.com',
        'x-goog-iap-jwt-assertion': assertion,
      });

      const user = await getAuthenticatedUser(request);
      expect(user).toBeNull();

      restoreEnv();
    });
  });

  describe('getAuthenticatedUser - NODE_ENV combinations', () => {
    /**
     * Test matrix for platform mode behavior across NODE_ENV and AUTH_MODE_PLATFORM_STRICT.
     *
     * Core logic (from app/utils/auth.ts lines 374-386):
     * - isProduction = process.env.NODE_ENV === 'production'
     * - isStrictMode = process.env.AUTH_MODE_PLATFORM_STRICT === 'true'
     * - if (isProduction && !isStrictMode) return null
     *
     * Expected behaviors:
     * - production + !strict: reject (fail closed)
     * - production + strict: require IAP JWT
     * - !production + !strict: allow x-user-email
     * - !production + strict: require IAP JWT
     * - unset NODE_ENV: treat as non-production
     * - case variations: NODE_ENV is case-sensitive
     */

    interface TestCase {
      nodeEnv: string | undefined;
      strictMode: string | undefined;
      expectedResult: 'reject' | 'allow_header' | 'requires_iap';
      description: string;
    }

    const testCases: TestCase[] = [
      // Production environment tests
      {
        nodeEnv: 'production',
        strictMode: undefined,
        expectedResult: 'reject',
        description: 'production without strict should reject',
      },
      {
        nodeEnv: 'production',
        strictMode: 'false',
        expectedResult: 'reject',
        description: 'production with strict=false should reject',
      },
      {
        nodeEnv: 'production',
        strictMode: 'true',
        expectedResult: 'requires_iap',
        description: 'production with strict=true should require IAP',
      },

      // Development environment tests
      {
        nodeEnv: 'development',
        strictMode: undefined,
        expectedResult: 'allow_header',
        description: 'development without strict should allow header',
      },
      {
        nodeEnv: 'development',
        strictMode: 'false',
        expectedResult: 'allow_header',
        description: 'development with strict=false should allow header',
      },
      {
        nodeEnv: 'development',
        strictMode: 'true',
        expectedResult: 'requires_iap',
        description: 'development with strict=true should require IAP',
      },

      // Test environment tests
      {
        nodeEnv: 'test',
        strictMode: undefined,
        expectedResult: 'allow_header',
        description: 'test without strict should allow header',
      },
      {
        nodeEnv: 'test',
        strictMode: 'false',
        expectedResult: 'allow_header',
        description: 'test with strict=false should allow header',
      },
      {
        nodeEnv: 'test',
        strictMode: 'true',
        expectedResult: 'requires_iap',
        description: 'test with strict=true should require IAP',
      },

      // Staging environment tests
      {
        nodeEnv: 'staging',
        strictMode: undefined,
        expectedResult: 'allow_header',
        description: 'staging without strict should allow header',
      },
      {
        nodeEnv: 'staging',
        strictMode: 'false',
        expectedResult: 'allow_header',
        description: 'staging with strict=false should allow header',
      },
      {
        nodeEnv: 'staging',
        strictMode: 'true',
        expectedResult: 'requires_iap',
        description: 'staging with strict=true should require IAP',
      },

      // Unset NODE_ENV tests
      {
        nodeEnv: undefined,
        strictMode: undefined,
        expectedResult: 'allow_header',
        description: 'unset NODE_ENV without strict should allow header',
      },
      {
        nodeEnv: undefined,
        strictMode: 'false',
        expectedResult: 'allow_header',
        description: 'unset NODE_ENV with strict=false should allow header',
      },
      {
        nodeEnv: undefined,
        strictMode: 'true',
        expectedResult: 'requires_iap',
        description: 'unset NODE_ENV with strict=true should require IAP',
      },

      // Case sensitivity tests (NODE_ENV is case-sensitive)
      {
        nodeEnv: 'Production',
        strictMode: undefined,
        expectedResult: 'allow_header',
        description: 'Production (capitalized) without strict should allow header (case-sensitive)',
      },
      {
        nodeEnv: 'PRODUCTION',
        strictMode: undefined,
        expectedResult: 'allow_header',
        description: 'PRODUCTION (uppercase) without strict should allow header (case-sensitive)',
      },
      {
        nodeEnv: 'Production',
        strictMode: 'true',
        expectedResult: 'requires_iap',
        description: 'Production (capitalized) with strict=true should require IAP',
      },

      // AUTH_MODE_PLATFORM_STRICT non-boolean values (only 'true' is truthy)
      {
        nodeEnv: 'production',
        strictMode: 'yes',
        expectedResult: 'reject',
        description: 'production with strict=yes should reject (not literal "true")',
      },
      {
        nodeEnv: 'production',
        strictMode: '1',
        expectedResult: 'reject',
        description: 'production with strict=1 should reject (not literal "true")',
      },
      {
        nodeEnv: 'production',
        strictMode: 'TRUE',
        expectedResult: 'reject',
        description: 'production with strict=TRUE should reject (case-sensitive)',
      },
      {
        nodeEnv: 'development',
        strictMode: 'yes',
        expectedResult: 'allow_header',
        description: 'development with strict=yes should allow header',
      },
    ];

    // Helper to set up platform mode environment
    function setupPlatformEnv(nodeEnv: string | undefined, strictMode: string | undefined) {
      const saved = {
        AUTH_MODE: process.env.AUTH_MODE,
        NODE_ENV: process.env.NODE_ENV,
        AUTH_MODE_PLATFORM_STRICT: process.env.AUTH_MODE_PLATFORM_STRICT,
        IAP_JWT_AUDIENCE: process.env.IAP_JWT_AUDIENCE,
        IAP_JWT_ISSUER: process.env.IAP_JWT_ISSUER,
        IAP_JWT_PUBLIC_KEY: process.env.IAP_JWT_PUBLIC_KEY,
      };

      process.env.AUTH_MODE = 'platform';
      // Use bracket notation to work around TypeScript readonly property
      if (nodeEnv === undefined) {
        // @ts-expect-error - NODE_ENV not in ProcessEnv
        delete process.env['NODE_ENV'];
      } else {
        // @ts-expect-error - NODE_ENV not in ProcessEnv
        process.env['NODE_ENV'] = nodeEnv;
      }
      if (strictMode === undefined) {
        delete process.env.AUTH_MODE_PLATFORM_STRICT;
      } else {
        process.env.AUTH_MODE_PLATFORM_STRICT = strictMode;
      }
      // Set IAP config for strict mode tests
      if (strictMode === 'true') {
        process.env.IAP_JWT_AUDIENCE = TEST_IAP_AUDIENCE;
        process.env.IAP_JWT_ISSUER = TEST_IAP_ISSUER;
        process.env.IAP_JWT_PUBLIC_KEY = TEST_IAP_PUBLIC_KEY;
      }

      return () => {
        if (saved.AUTH_MODE !== undefined) process.env.AUTH_MODE = saved.AUTH_MODE;
        else delete process.env.AUTH_MODE;
        if (saved.NODE_ENV !== undefined) {
          // @ts-expect-error - NODE_ENV not in ProcessEnv
          process.env['NODE_ENV'] = saved.NODE_ENV;
        } else {
          // @ts-expect-error - NODE_ENV not in ProcessEnv
          delete process.env['NODE_ENV'];
        }
        if (saved.AUTH_MODE_PLATFORM_STRICT !== undefined) {
          process.env.AUTH_MODE_PLATFORM_STRICT = saved.AUTH_MODE_PLATFORM_STRICT;
        } else {
          delete process.env.AUTH_MODE_PLATFORM_STRICT;
        }
        if (saved.IAP_JWT_AUDIENCE !== undefined) {
          process.env.IAP_JWT_AUDIENCE = saved.IAP_JWT_AUDIENCE;
        } else {
          delete process.env.IAP_JWT_AUDIENCE;
        }
        if (saved.IAP_JWT_ISSUER !== undefined) {
          process.env.IAP_JWT_ISSUER = saved.IAP_JWT_ISSUER;
        } else {
          delete process.env.IAP_JWT_ISSUER;
        }
        if (saved.IAP_JWT_PUBLIC_KEY !== undefined) {
          process.env.IAP_JWT_PUBLIC_KEY = saved.IAP_JWT_PUBLIC_KEY;
        } else {
          delete process.env.IAP_JWT_PUBLIC_KEY;
        }
      };
    }

    // Generate tests from the matrix
    for (const tc of testCases) {
      it(tc.description, async () => {
        const restoreEnv = setupPlatformEnv(tc.nodeEnv, tc.strictMode);

        try {
          if (tc.expectedResult === 'reject') {
            // Should return null even with valid x-user-email header
            const request = createMockRequest({
              'x-user-email': testEmail,
            });
            const user = await getAuthenticatedUser(request);
            expect(user).toBeNull();
          } else if (tc.expectedResult === 'allow_header') {
            // Should return email from x-user-email header
            const request = createMockRequest({
              'x-user-email': testEmail,
            });
            const user = await getAuthenticatedUser(request);
            expect(user).toBe(testEmail);
          } else if (tc.expectedResult === 'requires_iap') {
            // Without IAP JWT, should return null
            const requestWithoutIap = createMockRequest({
              'x-user-email': testEmail,
            });
            const userWithoutIap = await getAuthenticatedUser(requestWithoutIap);
            expect(userWithoutIap).toBeNull();

            // With valid IAP JWT, should return email
            const assertion = await createTestIapJwt(testEmail);
            const requestWithIap = createMockRequest({
              'x-user-email': testEmail,
              'x-goog-iap-jwt-assertion': assertion,
            });
            const userWithIap = await getAuthenticatedUser(requestWithIap);
            expect(userWithIap).toBe(testEmail);
          }
        } finally {
          restoreEnv();
        }
      });
    }
  });

  describe('token-type separation defense', () => {
    // Regression tests for TASK-236: prevent upload keys from being replayed as session tokens

    it('rejects upload tokens presented as session bearer tokens', () => {
      const uploadPayload: UploadPayload = {
        user: testEmail,
        timestamp: Math.floor(Date.now() / 1000),
        filename: 'test-file.pdf',
      };
      const uploadToken = generateUploadToken(uploadPayload, testSecret);

      // Upload tokens should be rejected when presented as session tokens
      const decoded = verifySessionToken(uploadToken, testSecret);
      expect(decoded).toBeNull();
    });

    it('generates session tokens with type marker', () => {
      const token = generateSessionToken(testEmail, testSecret);

      // Decode the token to check for type marker
      const lastDotIndex = token.lastIndexOf('.');
      const encodedPayload = token.substring(0, lastDotIndex);
      const decoded = Buffer.from(encodedPayload, 'base64url').toString();

      // Payload should start with 'session:' (4-field format)
      expect(decoded).toMatch(/^session:/);
    });

    it('rejects tokens without type marker (old 3-field format)', () => {
      // Create a token in the old 3-field format (without type marker)
      const nonce = Buffer.alloc(16).toString('base64url');
      const encodedEmail = Buffer.from(testEmail).toString('base64');
      const timestamp = Math.floor(Date.now() / 1000);

      // Old format: email:timestamp:nonce (3 fields)
      const oldPayloadString = `${encodedEmail}:${timestamp}:${nonce}`;
      const encodedPayload = Buffer.from(oldPayloadString).toString('base64url');

      const signature = createHmac('sha256', testSecret)
        .update(encodedPayload)
        .digest('base64url');

      const oldFormatToken = `${encodedPayload}.${signature}`;

      // Old format tokens should be rejected
      const decoded = verifySessionToken(oldFormatToken, testSecret);
      expect(decoded).toBeNull();
    });

    it('rejects tokens with wrong type marker', () => {
      // Create a token with wrong type marker
      const nonce = Buffer.alloc(16).toString('base64url');
      const encodedEmail = Buffer.from(testEmail).toString('base64');
      const timestamp = Math.floor(Date.now() / 1000);

      // Use 'upload' as type marker instead of 'session'
      const wrongPayloadString = `upload:${encodedEmail}:${timestamp}:${nonce}`;
      const encodedPayload = Buffer.from(wrongPayloadString).toString('base64url');

      const signature = createHmac('sha256', testSecret)
        .update(encodedPayload)
        .digest('base64url');

      const wrongTypeToken = `${encodedPayload}.${signature}`;

      // Tokens with wrong type marker should be rejected
      const decoded = verifySessionToken(wrongTypeToken, testSecret);
      expect(decoded).toBeNull();
    });

    it('accepts valid session tokens with type marker', () => {
      const token = generateSessionToken(testEmail, testSecret);
      const decoded = verifySessionToken(token, testSecret);
      expect(decoded).toBe(testEmail);
    });
  });

  describe('IAP public key cache race prevention', () => {
    it('handles concurrent authentication requests without race', async () => {
      const restoreEnv = setStrictPlatformEnv();
      const assertion = await createTestIapJwt(testEmail);

      // Create multiple concurrent requests
      const requests = Array(10)
        .fill(null)
        .map(() =>
          createMockRequest({
            'x-user-email': testEmail,
            'x-goog-iap-jwt-assertion': assertion,
          })
        );

      // Fire all requests concurrently
      const results = await Promise.all(
        requests.map((request) => getAuthenticatedUser(request))
      );

      // All should succeed with the same user
      expect(results.every((user) => user === testEmail)).toBe(true);

      restoreEnv();
    });

    it('uses cached key for sequential requests', async () => {
      const restoreEnv = setStrictPlatformEnv();
      const assertion = await createTestIapJwt(testEmail);

      const request = createMockRequest({
        'x-user-email': testEmail,
        'x-goog-iap-jwt-assertion': assertion,
      });

      // First call
      const user1 = await getAuthenticatedUser(request);
      expect(user1).toBe(testEmail);

      // Second call should also succeed (using cached key)
      const user2 = await getAuthenticatedUser(request);
      expect(user2).toBe(testEmail);

      restoreEnv();
    });
  });
});
