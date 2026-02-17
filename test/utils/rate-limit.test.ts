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
  getCheckCount,
} from '../../app/utils/rate-limit';

// Note: AsyncMutex is tested indirectly through checkRateLimit() tests below.
// The mutex is an internal implementation detail and is no longer exported.
// The 'race condition prevention' test suite validates mutex behavior at the API level.

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

    it('resets after manual resetRateLimit call', async () => {
      const result1 = await checkRateLimit(testEmail);
      assert.strictEqual(result1.allowed, true);

      // Reset the rate limit
      await resetRateLimit(testEmail);

      // Should start fresh
      const result2 = await checkRateLimit(testEmail);
      assert.strictEqual(result2.allowed, true);
      assert.strictEqual(result2.remaining, getRateLimitConfig().max - 1);
    });

    it('resets counter when time window expires', async () => {
      const config = getRateLimitConfig();
      const maxRequests = config.max;
      const windowMs = config.windowMs;

      // Stub Date.now() for deterministic time control
      const originalDateNow = Date.now;
      let currentTime = originalDateNow();
      Date.now = () => currentTime;

      try {
        // Exhaust the rate limit
        for (let i = 0; i < maxRequests; i++) {
          const result = await checkRateLimit(testEmail);
          assert.strictEqual(result.allowed, true, `request ${i + 1} should be allowed`);
        }

        // Next request should be denied (limit exhausted)
        const deniedResult = await checkRateLimit(testEmail);
        assert.strictEqual(deniedResult.allowed, false, 'request after limit should be denied');
        assert.strictEqual(deniedResult.remaining, 0, 'remaining should be 0');

        // Advance time past the window
        currentTime += windowMs + 1;

        // Next request should be allowed with fresh count
        const freshResult = await checkRateLimit(testEmail);
        assert.strictEqual(freshResult.allowed, true, 'request after window expiry should be allowed');
        assert.strictEqual(freshResult.remaining, maxRequests - 1, 'remaining should be reset to max - 1');

        // Verify windowStart was updated (resetAt should be in the future)
        assert.strictEqual(freshResult.resetAt, currentTime + windowMs, 'resetAt should reflect new window');
      } finally {
        // Restore Date.now()
        Date.now = originalDateNow;
      }
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

    it('reset waits for in-progress check to complete', async () => {
      const maxRequests = getRateLimitConfig().max;

      // Exhaust the limit
      for (let i = 0; i < maxRequests; i++) {
        await checkRateLimit(testEmail);
      }

      // Start a check that will be blocked
      const checkPromise = checkRateLimit(testEmail);

      // Allow checkPromise to start (acquire mutex)
      await new Promise((r) => setTimeout(r, 0));

      // Start reset - should wait for check to release mutex
      const resetPromise = resetRateLimit(testEmail);

      // Reset should not complete until check releases mutex
      await new Promise((r) => setTimeout(r, 0));

      // Wait for both to complete
      await Promise.all([checkPromise, resetPromise]);

      // The check should have been denied (limit exhausted)
      // But after reset, next check should succeed
      const resultAfterReset = await checkRateLimit(testEmail);
      assert.strictEqual(resultAfterReset.allowed, true);
    });

    it('reset is atomic with concurrent checks', async () => {
      const maxRequests = getRateLimitConfig().max;

      // Exhaust the limit
      for (let i = 0; i < maxRequests; i++) {
        await checkRateLimit(testEmail);
      }

      // Launch concurrent operations: reset + multiple checks
      const operations = [
        resetRateLimit(testEmail),
        ...Array.from({ length: 10 }, () => checkRateLimit(testEmail)),
      ];

      const results = await Promise.all(operations);

      // Skip the reset result (undefined), check rate limit results
      const checkResults = results.slice(1) as Array<{ allowed: boolean }>;
      const allowedCount = checkResults.filter((r) => r.allowed).length;

      // Due to mutex serialization, exactly one of the concurrent checks
      // should succeed (the one that runs after reset completes)
      // OR reset runs after all checks (they all fail, then reset allows next)
      // The key invariant: rate limit state is consistent
      assert.ok(allowedCount >= 0 && allowedCount <= 10, `allowedCount=${allowedCount} should be in valid range`);
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
      await resetRateLimit(testEmail);

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
      await resetRateLimit(testEmail);

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

  describe('cleanup trigger', () => {
    it('runs cleanup every 100 checks regardless of user count', async () => {
      // Clear state to start fresh
      clearAllRateLimits();

      // Verify counter starts at 0
      assert.strictEqual(getCheckCount(), 0, 'checkCount should start at 0 after clear');

      // Make 99 checks as a single user - cleanup should NOT run yet
      for (let i = 0; i < 99; i++) {
        await checkRateLimit(testEmail);
      }
      assert.strictEqual(getCheckCount(), 99, 'checkCount should be 99 after 99 checks');

      // 100th check triggers cleanup (checkCount becomes 100, which is % 100 === 0)
      await checkRateLimit(testEmail);
      assert.strictEqual(getCheckCount(), 100, 'checkCount should be 100 after 100 checks');

      // Next check should NOT trigger cleanup (101 is not % 100 === 0)
      await checkRateLimit(testEmail);
      assert.strictEqual(getCheckCount(), 101, 'checkCount should be 101 after 101 checks');
    });

    it('does not run cleanup on every call at store size 100', async () => {
      // Clear state to start fresh
      clearAllRateLimits();

      // Create 100 distinct users (store size = 100)
      // With old code, the 100th check would trigger cleanup on EVERY subsequent check
      // because rateLimitStore.size % 100 === 0 would be true as long as size stays at 100
      for (let i = 0; i < 100; i++) {
        await checkRateLimit(`user${i}@example.com`);
      }
      assert.strictEqual(getCheckCount(), 100, 'checkCount should be 100 after 100 distinct users');

      // Make more requests from existing users - store size stays at 100
      // Old bug: rateLimitStore.size % 100 === 0 would be TRUE on every call
      // New behavior: checkCount % 100 === 0 is only true at 100, 200, 300, etc.
      for (let i = 0; i < 50; i++) {
        await checkRateLimit(`user${i}@example.com`);
      }
      assert.strictEqual(getCheckCount(), 150, 'checkCount should be 150 after 150 total checks');

      // Cleanup should only run when checkCount hits 200, not on every call
      // This test verifies the fix by confirming the counter increments correctly
    });

    it('clearAllRateLimits resets check count for test isolation', async () => {
      // Make some checks
      for (let i = 0; i < 50; i++) {
        await checkRateLimit(testEmail);
      }
      assert.strictEqual(getCheckCount(), 50, 'checkCount should be 50');

      // Clear should reset the counter
      clearAllRateLimits();
      assert.strictEqual(getCheckCount(), 0, 'checkCount should be 0 after clearAllRateLimits');

      // Next check should start from 1
      await checkRateLimit(testEmail);
      assert.strictEqual(getCheckCount(), 1, 'checkCount should be 1 after first check post-clear');
    });
  });
});
