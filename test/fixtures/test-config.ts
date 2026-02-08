/**
 * Test environment constants.
 *
 * These constants replace direct process.env reads in BDD step files,
 * ensuring tests have explicit, predictable configuration independent
 * of the host environment.
 */

/** HMAC secret used for signing upload tokens in tests */
export const TEST_HMAC_SECRET = 'test-secret-for-hmac-signing';

/** Authentication mode for platform auth tests */
export const TEST_AUTH_MODE_PLATFORM = 'platform' as const;

/** Authentication mode for session auth tests */
export const TEST_AUTH_MODE_SESSION = 'session' as const;

/** Default session max age in seconds (1 hour) */
export const TEST_SESSION_MAX_AGE_SECONDS = 3600;
