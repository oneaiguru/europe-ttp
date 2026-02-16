/**
 * Unit tests for cryptographic utilities.
 * Tests focus on timing-safe signature verification and token validation.
 */

// @ts-expect-error - bun:test is a built-in Bun module
import { describe, it, expect } from 'bun:test';
import {
  generateUploadToken,
  verifyUploadToken,
  isUploadTokenExpired,
  getHmacSecret,
  type UploadPayload,
} from '../../app/utils/crypto';

describe('crypto utilities', () => {
  const testSecret = 'test-secret-key-for-unit-testing';
  const validPayload: UploadPayload = {
    user: 'test@example.com',
    timestamp: Math.floor(Date.now() / 1000),
    filename: 'test-file.pdf',
  };

  describe('generateUploadToken', () => {
    it('generates a token with payload and signature separated by dot', () => {
      const token = generateUploadToken(validPayload, testSecret);
      expect(token).toContain('.');
      const parts = token.split('.');
      expect(parts).toHaveLength(2);
      expect(parts[0]).toBeTruthy(); // encodedPayload
      expect(parts[1]).toBeTruthy(); // signature
    });

    it('generates deterministic tokens for same input', () => {
      const token1 = generateUploadToken(validPayload, testSecret);
      const token2 = generateUploadToken(validPayload, testSecret);
      expect(token1).toBe(token2);
    });

    it('generates different tokens for different secrets', () => {
      const token1 = generateUploadToken(validPayload, testSecret);
      const token2 = generateUploadToken(validPayload, 'different-secret');
      expect(token1).not.toBe(token2);
    });

    it('generates different tokens for different payloads', () => {
      const differentPayload = { ...validPayload, user: 'different@example.com' };
      const token1 = generateUploadToken(validPayload, testSecret);
      const token2 = generateUploadToken(differentPayload, testSecret);
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyUploadToken', () => {
    it('verifies a valid token and returns the original payload', () => {
      const token = generateUploadToken(validPayload, testSecret);
      const decoded = verifyUploadToken(token, testSecret);

      expect(decoded).not.toBeNull();
      expect(decoded?.user).toBe(validPayload.user);
      expect(decoded?.timestamp).toBe(validPayload.timestamp);
      expect(decoded?.filename).toBe(validPayload.filename);
    });

    it('returns null for token with invalid signature', () => {
      const token = generateUploadToken(validPayload, testSecret);
      // Tamper with the signature
      const lastDotIndex = token.lastIndexOf('.');
      const tamperedToken = token.substring(0, lastDotIndex + 1) + 'badsignature';

      const decoded = verifyUploadToken(tamperedToken, testSecret);
      expect(decoded).toBeNull();
    });

    it('returns null for token with tampered payload', () => {
      const token = generateUploadToken(validPayload, testSecret);
      // Tamper with the payload
      const lastDotIndex = token.lastIndexOf('.');
      const tamperedPayload = token.substring(0, 10) + 'X' + token.substring(11, lastDotIndex);
      const tamperedToken = tamperedPayload + token.substring(lastDotIndex);

      const decoded = verifyUploadToken(tamperedToken, testSecret);
      expect(decoded).toBeNull();
    });

    it('returns null for token signed with different secret', () => {
      const token = generateUploadToken(validPayload, testSecret);
      const decoded = verifyUploadToken(token, 'wrong-secret');
      expect(decoded).toBeNull();
    });

    it('returns null for empty token', () => {
      const decoded = verifyUploadToken('', testSecret);
      expect(decoded).toBeNull();
    });

    it('returns null for token without dot separator', () => {
      const decoded = verifyUploadToken('invalidtokenformat', testSecret);
      expect(decoded).toBeNull();
    });

    it('returns null for token with empty payload', () => {
      const decoded = verifyUploadToken('.signature', testSecret);
      expect(decoded).toBeNull();
    });

    it('returns null for token with empty signature', () => {
      const decoded = verifyUploadToken('payload.', testSecret);
      expect(decoded).toBeNull();
    });

    it('returns null for token with malformed base64url payload', () => {
      // Create a token-like string with invalid base64url
      const invalidToken = '!@#$%^&*().validsignature';
      const decoded = verifyUploadToken(invalidToken, testSecret);
      expect(decoded).toBeNull();
    });

    it('returns null for token with malformed base64url signature', () => {
      // Generate valid payload, then use invalid signature
      const token = generateUploadToken(validPayload, testSecret);
      const lastDotIndex = token.lastIndexOf('.');
      const payloadPart = token.substring(0, lastDotIndex);
      const invalidToken = payloadPart + '.!@#$%^&*()';

      const decoded = verifyUploadToken(invalidToken, testSecret);
      expect(decoded).toBeNull();
    });

    it('handles special characters in filename correctly', () => {
      const specialPayload: UploadPayload = {
        user: 'user@example.com',
        timestamp: Math.floor(Date.now() / 1000),
        filename: 'file with spaces & special!chars@#.pdf',
      };
      const token = generateUploadToken(specialPayload, testSecret);
      const decoded = verifyUploadToken(token, testSecret);

      expect(decoded).not.toBeNull();
      expect(decoded?.filename).toBe(specialPayload.filename);
    });

    it('handles unicode characters in user field', () => {
      const unicodePayload: UploadPayload = {
        user: 'user@example.com',
        timestamp: Math.floor(Date.now() / 1000),
        filename: 'täst_fïlé_ñamé.pdf',
      };
      const token = generateUploadToken(unicodePayload, testSecret);
      const decoded = verifyUploadToken(token, testSecret);

      expect(decoded).not.toBeNull();
      expect(decoded?.filename).toBe(unicodePayload.filename);
    });

    it('rejects token with wrong signature length (timing-safe length check)', () => {
      const token = generateUploadToken(validPayload, testSecret);
      const lastDotIndex = token.lastIndexOf('.');
      const payloadPart = token.substring(0, lastDotIndex);

      // Create a signature with incorrect length
      const wrongLengthSignature = 'abc';
      const invalidToken = payloadPart + '.' + wrongLengthSignature;

      const decoded = verifyUploadToken(invalidToken, testSecret);
      expect(decoded).toBeNull();
    });
  });

  describe('isUploadTokenExpired', () => {
    it('returns false for fresh token', () => {
      const freshPayload: UploadPayload = {
        user: 'test@example.com',
        timestamp: Math.floor(Date.now() / 1000),
        filename: 'test.pdf',
      };
      expect(isUploadTokenExpired(freshPayload)).toBe(false);
    });

    it('returns true for expired token', () => {
      const expiredPayload: UploadPayload = {
        user: 'test@example.com',
        timestamp: Math.floor(Date.now() / 1000) - (16 * 60), // 16 minutes ago
        filename: 'test.pdf',
      };
      expect(isUploadTokenExpired(expiredPayload)).toBe(true);
    });

    it('returns false for token at exactly max age', () => {
      const edgePayload: UploadPayload = {
        user: 'test@example.com',
        timestamp: Math.floor(Date.now() / 1000) - (15 * 60), // exactly 15 minutes ago
        filename: 'test.pdf',
      };
      expect(isUploadTokenExpired(edgePayload)).toBe(false);
    });

    it('respects custom max age', () => {
      const oldPayload: UploadPayload = {
        user: 'test@example.com',
        timestamp: Math.floor(Date.now() / 1000) - 30, // 30 seconds ago
        filename: 'test.pdf',
      };
      // With 20 second max age, 30 seconds is expired
      expect(isUploadTokenExpired(oldPayload, 20)).toBe(true);
      // With 60 second max age, 30 seconds is not expired
      expect(isUploadTokenExpired(oldPayload, 60)).toBe(false);
    });
  });

  describe('getHmacSecret', () => {
    it('throws when UPLOAD_HMAC_SECRET is not set', () => {
      const originalSecret = process.env.UPLOAD_HMAC_SECRET;
      delete process.env.UPLOAD_HMAC_SECRET;
      expect(() => getHmacSecret()).toThrow('UPLOAD_HMAC_SECRET environment variable is required');
      // Restore
      if (originalSecret) process.env.UPLOAD_HMAC_SECRET = originalSecret;
    });

    it('returns the secret when set', () => {
      const originalSecret = process.env.UPLOAD_HMAC_SECRET;
      process.env.UPLOAD_HMAC_SECRET = 'my-test-secret';
      expect(getHmacSecret()).toBe('my-test-secret');
      // Restore
      if (originalSecret) process.env.UPLOAD_HMAC_SECRET = originalSecret;
      else delete process.env.UPLOAD_HMAC_SECRET;
    });

    it('throws when using default secret in production mode', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      const originalSecret = process.env.UPLOAD_HMAC_SECRET;
      // @ts-expect-error - NODE_ENV not in ProcessEnv, set for test
      process.env.NODE_ENV = 'production';
      process.env.UPLOAD_HMAC_SECRET = 'development-secret-change-in-production';
      expect(() => getHmacSecret()).toThrow('default UPLOAD_HMAC_SECRET');
      // Restore
      if (originalNodeEnv) {
        // @ts-expect-error - NODE_ENV not in ProcessEnv
        process.env.NODE_ENV = originalNodeEnv;
      } else {
        // @ts-expect-error - NODE_ENV not in ProcessEnv
        delete process.env.NODE_ENV;
      }
      if (originalSecret) process.env.UPLOAD_HMAC_SECRET = originalSecret;
      else delete process.env.UPLOAD_HMAC_SECRET;
    });

    it('warns but returns default secret in non-production mode', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      const originalSecret = process.env.UPLOAD_HMAC_SECRET;
      // @ts-expect-error - NODE_ENV not in ProcessEnv, set for test
      process.env.NODE_ENV = 'development';
      process.env.UPLOAD_HMAC_SECRET = 'development-secret-change-in-production';
      // @ts-expect-error - bun:test mock
      const warnSpy = spyOn(console, 'warn').mockImplementation(() => {});
      expect(getHmacSecret()).toBe('development-secret-change-in-production');
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('WARNING'));
      warnSpy.mockRestore();
      // Restore
      if (originalNodeEnv) {
        // @ts-expect-error - NODE_ENV not in ProcessEnv
        process.env.NODE_ENV = originalNodeEnv;
      } else {
        // @ts-expect-error - NODE_ENV not in ProcessEnv
        delete process.env.NODE_ENV;
      }
      if (originalSecret) process.env.UPLOAD_HMAC_SECRET = originalSecret;
      else delete process.env.UPLOAD_HMAC_SECRET;
    });

    it('allows non-default secrets in production mode', () => {
      const originalNodeEnv = process.env.NODE_ENV;
      const originalSecret = process.env.UPLOAD_HMAC_SECRET;
      // @ts-expect-error - NODE_ENV not in ProcessEnv, set for test
      process.env.NODE_ENV = 'production';
      process.env.UPLOAD_HMAC_SECRET = 'secure-random-secret-value';
      expect(getHmacSecret()).toBe('secure-random-secret-value');
      // Restore
      if (originalNodeEnv) {
        // @ts-expect-error - NODE_ENV not in ProcessEnv
        process.env.NODE_ENV = originalNodeEnv;
      } else {
        // @ts-expect-error - NODE_ENV not in ProcessEnv
        delete process.env.NODE_ENV;
      }
      if (originalSecret) process.env.UPLOAD_HMAC_SECRET = originalSecret;
      else delete process.env.UPLOAD_HMAC_SECRET;
    });
  });
});
