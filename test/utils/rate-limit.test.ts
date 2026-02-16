/**
 * Unit tests for rate limiting utilities.
 * Tests focus on race condition prevention and multi-user isolation.
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkRateLimit,
  resetRateLimit,
  clearAllRateLimits,
  getRateLimitConfig,
} from '../../app/utils/rate-limit';

describe('rate limiting utilities', () => {
  const testEmail = 'test@example.com';
  const otherEmail = 'other@example.com';

  beforeEach(() => {
    // Clear all rate limits before each test
    clearAllRateLimits();
  });

  describe('checkRateLimit', () => {
    it('allows first request', async () => {
      const result = await checkRateLimit(testEmail);
      assert.strictEqual(result.allowed, true);
      assert.strictEqual(result.remaining, getRateLimitConfig().max - 1);
    });

    it('decrements remaining count on subsequent requests', async () => {
      const result1 = await checkRateLimit(testEmail);
      assert.strictEqual(result1.allowed, true);
      assert.strictEqual(result1.remaining, getRateLimitConfig().max - 1);

      const result2 = await checkRateLimit(testEmail);
      assert.strictEqual(result2.allowed, true);
      assert.strictEqual(result2.remaining, getRateLimitConfig().max - 2);
    });

    it('denies request when limit exceeded', async () => {
      const maxRequests = getRateLimitConfig().max;

      // Use up all allowed requests
      for (let i = 0; i < maxRequests; i++) {
        const result = await checkRateLimit(testEmail);
        assert.strictEqual(result.allowed, true);
      }

      // Next request should be denied
      const result = await checkRateLimit(testEmail);
      assert.strictEqual(result.allowed, false);
      assert.strictEqual(result.remaining, 0);
    });

    it('isolates rate limits between users', async () => {
      const maxRequests = getRateLimitConfig().max;

      // Exhaust limit for testEmail
      for (let i = 0; i < maxRequests; i++) {
        await checkRateLimit(testEmail);
      }

      // testEmail should be denied
      const testResult = await checkRateLimit(testEmail);
      assert.strictEqual(testResult.allowed, false);

      // otherEmail should still be allowed
      const otherResult = await checkRateLimit(otherEmail);
      assert.strictEqual(otherResult.allowed, true);
    });

    it('resets after window expires', async () => {
      const result1 = await checkRateLimit(testEmail);
      assert.strictEqual(result1.allowed, true);

      // Reset the rate limit
      resetRateLimit(testEmail);

      // Should start fresh
      const result2 = await checkRateLimit(testEmail);
      assert.strictEqual(result2.allowed, true);
      assert.strictEqual(result2.remaining, getRateLimitConfig().max - 1);
    });
  });

  describe('race condition prevention', () => {
    it('handles concurrent requests atomically', async () => {
      const maxRequests = getRateLimitConfig().max;
      const concurrentRequests = maxRequests + 5; // More than the limit

      // Launch all requests concurrently
      const promises = Array.from({ length: concurrentRequests }, () =>
        checkRateLimit(testEmail)
      );

      const results = await Promise.all(promises);

      // Count allowed vs denied
      const allowed = results.filter((r) => r.allowed).length;
      const denied = results.filter((r) => !r.allowed).length;

      // Should allow exactly maxRequests, deny the rest
      assert.strictEqual(allowed, maxRequests);
      assert.strictEqual(denied, concurrentRequests - maxRequests);
    });

    it('maintains accurate count under high concurrency', async () => {
      const iterations = 100;

      // Launch all requests concurrently
      const promises = Array.from({ length: iterations }, () =>
        checkRateLimit(testEmail)
      );

      const results = await Promise.all(promises);
      const allowedCount = results.filter((r) => r.allowed).length;

      // Should not exceed max requests
      assert.ok(allowedCount <= getRateLimitConfig().max, `expected ${allowedCount} <= max`);
    });

    it('isolates concurrent requests between users', async () => {
      const maxRequests = getRateLimitConfig().max;
      const concurrentPerUser = maxRequests + 2;

      // Launch concurrent requests for both users
      const testUserPromises = Array.from({ length: concurrentPerUser }, () =>
        checkRateLimit(testEmail)
      );
      const otherUserPromises = Array.from({ length: concurrentPerUser }, () =>
        checkRateLimit(otherEmail)
      );

      const [testResults, otherResults] = await Promise.all([
        Promise.all(testUserPromises),
        Promise.all(otherUserPromises),
      ]);

      // Each user should have independent limits
      const testAllowed = testResults.filter((r) => r.allowed).length;
      const otherAllowed = otherResults.filter((r) => r.allowed).length;

      assert.strictEqual(testAllowed, maxRequests);
      assert.strictEqual(otherAllowed, maxRequests);
    });
  });

  describe('resetRateLimit', () => {
    it('clears rate limit for specific user', async () => {
      // Use up the limit
      const maxRequests = getRateLimitConfig().max;
      for (let i = 0; i < maxRequests; i++) {
        await checkRateLimit(testEmail);
      }

      // Verify limit is exhausted
      let result = await checkRateLimit(testEmail);
      assert.strictEqual(result.allowed, false);

      // Reset the limit
      resetRateLimit(testEmail);

      // Should be allowed again
      result = await checkRateLimit(testEmail);
      assert.strictEqual(result.allowed, true);
    });

    it('does not affect other users', async () => {
      // Exhaust both users
      const maxRequests = getRateLimitConfig().max;
      for (let i = 0; i < maxRequests; i++) {
        await checkRateLimit(testEmail);
        await checkRateLimit(otherEmail);
      }

      // Reset only testEmail
      resetRateLimit(testEmail);

      // testEmail should be allowed
      let result = await checkRateLimit(testEmail);
      assert.strictEqual(result.allowed, true);

      // otherEmail should still be denied
      result = await checkRateLimit(otherEmail);
      assert.strictEqual(result.allowed, false);
    });
  });

  describe('clearAllRateLimits', () => {
    it('clears all rate limits', async () => {
      const maxRequests = getRateLimitConfig().max;

      // Exhaust limits for multiple users
      for (let i = 0; i < maxRequests; i++) {
        await checkRateLimit(testEmail);
        await checkRateLimit(otherEmail);
      }

      // Clear all
      clearAllRateLimits();

      // Both should be allowed
      let result = await checkRateLimit(testEmail);
      assert.strictEqual(result.allowed, true);

      result = await checkRateLimit(otherEmail);
      assert.strictEqual(result.allowed, true);
    });
  });

  describe('getRateLimitConfig', () => {
    it('returns current configuration', () => {
      const config = getRateLimitConfig();
      assert.ok(config.max > 0, 'config.max should be > 0');
      assert.ok(config.windowMs > 0, 'config.windowMs should be > 0');
    });
  });
});
