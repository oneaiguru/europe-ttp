/**
 * Deterministic test data constants.
 *
 * These constants replace dynamic values like Date.now() and Math.random()
 * in test steps to ensure test reproducibility and debuggability.
 *
 * Values are intentionally fixed to produce consistent test output across runs.
 */

/**
 * Fixed test timestamp: 2024-01-01T00:00:00Z (Unix timestamp in seconds).
 * Used for all time-based test data generation.
 */
export const TEST_TIMESTAMP = 1704067200;

/**
 * Fixed test multipart boundary string.
 * Used for multipart/form-data payload construction.
 */
export const TEST_BOUNDARY = '----WebKitFormBoundarya1b2c3d4e5f6g7h8';

/**
 * Fixed test nonce for token generation.
 * Used as a deterministic entropy source in test tokens.
 */
export const TEST_NONCE = 'dGVzdC1ub25jZS12YWx1ZQ'; // base64url of "test-nonce-value"

/**
 * Fixed test ISO timestamp: 2024-01-01T00:00:00.000Z.
 * ISO 8601 representation of TEST_TIMESTAMP for use with string timestamp fields.
 */
export const TEST_ISO_TIMESTAMP = '2024-01-01T00:00:00.000Z';

/**
 * Fixed test ISO date: 2024-01-01.
 * Date-only portion of TEST_ISO_TIMESTAMP for use with date fields (YYYY-MM-DD format).
 */
export const TEST_ISO_DATE = '2024-01-01';
