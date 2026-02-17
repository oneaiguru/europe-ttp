/**
 * Rate Limiting Utility
 *
 * Simple in-memory rate limiter for API endpoints.
 * Tracks per-user request counts within a sliding time window.
 *
 * DESIGN NOTES:
 * 1. In-memory storage - resets on deploy, acceptable for this security layer
 * 2. Deterministic behavior - no external dependencies, testable in CI
 * 3. Automatic cleanup - expired entries are removed to prevent memory leaks
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

// Per-user rate limit tracking
const rateLimitStore = new Map<string, RateLimitEntry>();

// Counter for total checkRateLimit calls (used for cleanup scheduling)
let checkCount = 0;

/**
 * AsyncMutex - Promise-based mutex for atomic operations
 *
 * Prevents race conditions in async code by ensuring only one operation
 * can hold the lock at a time for a given key.
 */
class AsyncMutex {
  private locked = false;
  private queue: Array<() => void> = [];

  async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    const next = this.queue.shift();
    if (next) {
      next();
    } else {
      this.locked = false;
    }
  }
}

// Per-user mutex locks for atomic rate limit operations
const userMutexes = new Map<string, AsyncMutex>();

/**
 * Get or create a mutex for a specific user.
 */
function getUserMutex(userEmail: string): AsyncMutex {
  let mutex = userMutexes.get(userEmail);
  if (!mutex) {
    mutex = new AsyncMutex();
    userMutexes.set(userEmail, mutex);
  }
  return mutex;
}

/**
 * Parse and validate a positive integer from an environment variable.
 *
 * Validates that the raw string is a canonical positive integer (no trailing
 * characters, no scientific notation, no whitespace). Malformed values fall
 * back to the default with a warning.
 *
 * @param envVar - Name of the environment variable (for error messages)
 * @param value - Raw string value from process.env
 * @param defaultValue - Fallback value if parsing fails
 * @returns Validated positive integer
 */
function parsePositiveInt(envVar: string, value: string | undefined, defaultValue: number): number {
  // Skip validation for unset env vars - defaults are intentional baseline
  if (value === undefined || value === '') {
    return defaultValue;
  }

  const trimmed = value.trim();

  // Empty after trim is also "unset" for practical purposes
  if (trimmed === '') {
    return defaultValue;
  }

  // Strict format check: must be a canonical positive integer string (e.g., "10", "123")
  // Rejects: "10abc", "1e3", "", "  ", "-5", "0", " 10" (after trim)
  if (!/^[1-9]\d*$/.test(trimmed)) {
    // biome-ignore lint/suspicious/noConsole: Intentional warning for misconfiguration
    console.warn(
      `Rate limit: Invalid value for ${envVar}="${value}". Using default: ${defaultValue}. ` +
        `Value must be a positive integer (canonical form, no leading zeros).`
    );
    return defaultValue;
  }

  const parsed = parseInt(trimmed, 10);

  // Double-check (should never fail given regex above, but defend against edge cases)
  if (Number.isNaN(parsed) || parsed <= 0 || !Number.isFinite(parsed)) {
    // biome-ignore lint/suspicious/noConsole: Intentional warning for misconfiguration
    console.warn(
      `Rate limit: Invalid value for ${envVar}="${value}". Using default: ${defaultValue}. ` +
        `Value must be a positive integer.`
    );
    return defaultValue;
  }

  return parsed;
}

// Configuration from environment variables with validation
const DEFAULT_MAX_REQUESTS = 10;
const DEFAULT_WINDOW_MS = 60000;

const RATE_LIMIT_MAX = parsePositiveInt(
  'UPLOAD_RATE_LIMIT_MAX',
  process.env.UPLOAD_RATE_LIMIT_MAX,
  DEFAULT_MAX_REQUESTS
);

const RATE_LIMIT_WINDOW_MS = parsePositiveInt(
  'UPLOAD_RATE_LIMIT_WINDOW_MS',
  process.env.UPLOAD_RATE_LIMIT_WINDOW_MS,
  DEFAULT_WINDOW_MS
);

/**
 * Cleanup expired entries from the rate limit store.
 * Called periodically to prevent memory leaks.
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
      rateLimitStore.delete(key);
      // NOTE: We intentionally do NOT delete mutexes here. Deleting mutexes while
      // they may be in use by concurrent requests creates a race condition where:
      // 1. Request A holds mutex for user X
      // 2. Cleanup deletes mutex for user Y (expired)
      // 3. Request B for user Y creates a NEW mutex, bypassing the old one
      // The memory cost of keeping mutexes (~100 bytes each) is acceptable
      // compared to the security risk of rate limit bypass.
    }
  }
}

/**
 * Check if a user has exceeded their rate limit.
 *
 * Uses async mutex locking to prevent race conditions under concurrent access.
 *
 * @param userEmail - The user's email address (used as the rate limit key)
 * @returns RateLimitResult with allowed status and metadata
 */
export async function checkRateLimit(userEmail: string): Promise<RateLimitResult> {
  const mutex = getUserMutex(userEmail);
  await mutex.acquire();

  try {
    // Increment check counter (for cleanup scheduling)
    checkCount++;

    const now = Date.now();

    // Periodic cleanup (every 100 checks to avoid overhead on every call)
    if (checkCount % 100 === 0) {
      cleanupExpiredEntries();
    }

    const existing = rateLimitStore.get(userEmail);

    // No previous entry or window expired - create new entry
    if (!existing || now - existing.windowStart >= RATE_LIMIT_WINDOW_MS) {
      const newEntry: RateLimitEntry = {
        count: 1,
        windowStart: now,
      };
      rateLimitStore.set(userEmail, newEntry);
      return {
        allowed: true,
        limit: RATE_LIMIT_MAX,
        remaining: RATE_LIMIT_MAX - 1,
        resetAt: now + RATE_LIMIT_WINDOW_MS,
      };
    }

    // Within window - check if limit exceeded BEFORE incrementing
    if (existing.count >= RATE_LIMIT_MAX) {
      return {
        allowed: false,
        limit: RATE_LIMIT_MAX,
        remaining: 0,
        resetAt: existing.windowStart + RATE_LIMIT_WINDOW_MS,
      };
    }

    // Increment count
    const newCount = existing.count + 1;
    const updatedEntry: RateLimitEntry = {
      count: newCount,
      windowStart: existing.windowStart,
    };
    rateLimitStore.set(userEmail, updatedEntry);

    return {
      allowed: true,
      limit: RATE_LIMIT_MAX,
      remaining: RATE_LIMIT_MAX - newCount,
      resetAt: existing.windowStart + RATE_LIMIT_WINDOW_MS,
    };
  } finally {
    mutex.release();
  }
}

/**
 * Reset rate limit for a specific user.
 * Useful for testing or admin operations.
 *
 * Uses async mutex locking to prevent race conditions with concurrent
 * checkRateLimit() calls. Without the mutex, a reset during an active
 * check could be silently overwritten.
 *
 * @param userEmail - The user's email address
 */
export async function resetRateLimit(userEmail: string): Promise<void> {
  const mutex = getUserMutex(userEmail);
  await mutex.acquire();
  try {
    rateLimitStore.delete(userEmail);
  } finally {
    mutex.release();
  }
}

/**
 * Clear all rate limit entries.
 * Useful for testing.
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
  checkCount = 0; // Reset counter for test isolation
}

/**
 * Get current rate limit configuration.
 * Useful for testing and debugging.
 */
export function getRateLimitConfig(): {
  max: number;
  windowMs: number;
} {
  return {
    max: RATE_LIMIT_MAX,
    windowMs: RATE_LIMIT_WINDOW_MS,
  };
}

/**
 * Get current check count (for testing cleanup scheduling).
 * @internal
 */
export function getCheckCount(): number {
  return checkCount;
}
