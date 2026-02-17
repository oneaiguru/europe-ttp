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

// ============================================================================
// IAP Test Keys
// ============================================================================

/**
 * IAP test constants for testing IAP JWT verification.
 *
 * SECURITY NOTE: These keys are for TESTING ONLY and must never be used in production.
 * Production IAP keys should be injected via environment variables (IAP_JWT_PUBLIC_KEY).
 *
 * The private key is loaded from environment first (TEST_IAP_PRIVATE_KEY),
 * with a hardcoded fallback for local development convenience.
 * This allows CI/CD systems to inject the key via secrets while maintaining
 * backward compatibility for local development.
 */

/** IAP JWT audience for tests */
export const TEST_IAP_AUDIENCE = 'test-iap-audience';

/** IAP JWT issuer for tests */
export const TEST_IAP_ISSUER = 'https://cloud.google.com/iap';

/**
 * TEST-ONLY IAP private key (2048-bit RSA).
 *
 * For CI/CD: Set TEST_IAP_PRIVATE_KEY environment variable to inject via secrets.
 * For local dev: Falls back to this hardcoded test key.
 *
 * WARNING: This key is committed to source control for testing purposes only.
 * NEVER use this key in production environments.
 */
export const TEST_IAP_PRIVATE_KEY =
  process.env.TEST_IAP_PRIVATE_KEY ??
  `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCzmiz26PHtlPDd
E5IWZyLjaMvCM7c6VmSecii0GGanY7WcJwu6TDYhPPITQRijRZpqK7mEKf9yaAKc
K1O5KpYUIi1+YaktF+xMupWVzQtl5Ii1Wq1o3RS3DLBvYu8DuNqjN4caJcXUlEMf
XxmAyWSvQ2JVOskWkEMn6J4EyHZVKPoPdxQrWw29NvvPgazIGjisZPVREPn4m5WK
pflL20Puwjsq5X/w9RgOxbnfBEexMrl89MqFl4L9lhOy79mcW/eDOrMXMkHBBWya
Ge8Gv4rs5lVL5QMGPKDS845kb2wXpUF9a3PAfRbqDG0ZntOTu63kaPcMKgd5kPr9
Wdfi/R3HAgMBAAECggEAdrNlGGLo0i7n6hUvLiNICaiPUnC/nozOv3GPuUePQP5D
X0rnE1+fPuR60YLqd65e2eDAIbtoGwLnBrQUB4M/4VqdWrPNDgKLqEKA7pqv983N
FJ8zkOTc9gYq7dMjSQB5b/oZDoz8bPz4R9mgj1+LbdJJQS8zC/iYid3R4jNjEfB/
+mBUGZ88sdMlHru79Ek4t7uayTq2iycnbx3wuo6KMPSWAAsMrixWOven0Epa1VGF
YmlqLnM5dMMS6wt5zIG4mN4QZCY67KM2HHd4MI60wWq9Pien8JlTL9utnW2OL/r6
YIQgAO9SeltxOKFQhy2QQR6A8zWaI4PxvbSqJFW9EQKBgQDvdKIrbB6G5nZ+0hwZ
u4nIG6g5ItgEdhn+a40S3KEJvXrgSnkAEc6Z4NjjwjVbsAYcBI8eGxKfMGE/LWEq
hTjHCliE29hnEf6hpGvYXz9zIpkM4M7dYW0+qRdKTN6kKi442Jhf4rfExzMdhmiK
aclIAovwn8xVvOXQUZen+6j2VQKBgQDAAuMaW84SlpcfRsAwAPAD/7IkBSYPI0Ta
MLa3+fJ7uq1uu0z+QD0+yhCc5p8TuVODQ6kVTTUW0dM6l6cHjmkmOF/Qn27OUGzM
+Joqs7Sv5dLIEHbKzO8KWkjXg0S6p96v36ov1us1o285EW4Mf1CrzCT0EUjYs/3k
XR0BkpNHqwKBgAQ3Z4ugMcFqWXfON1R0qu5tHj8zT950Pezu8+L7I5LKVVmRtiO8
LIklHmyUROBCbzkbE3ISQ/etoGi+YdGf2uoWUoy0WlEmTfeGr6d1teZPG6bQZpQb
XRMXYyOZyunVHE8/8R7vHRFH+Kxya3DUgAjWkqRADBcOZnWOmj8I/WapAoGAEDIu
JdMIltjM9n5pR6NMm4m95PvqMeyvqhfh0bLrmTQt3OE/pVKV1+4DaLirQmanfLMA
WCOjDsG0J4UTObfxdp/atSY9mnl+M+vkVSXDX/LqzKVW39RZdW4YJtWTvoraZctf
95kRTfzzLMUjmzpB+7vEgjHTCzRjfhe8kp1ifvECgYAB5e/+txzlCUVIuKWxnLbE
/hKLWBzbb+arUhjL2dHdxGkUkvjBIdWPKfPfliHbSAx/qVDjPLr862Q0qUHUJIdo
4TWAvsjoOTElSRGb5PCC2jo2vOmQeb7kjLmGPwNR8oLuuD5ZfBTiW6Sfk0qoI8Nf
RWf5hNW6giGsWOhQCPJc+g==
-----END PRIVATE KEY-----`;

/**
 * TEST-ONLY IAP public key (corresponds to TEST_IAP_PRIVATE_KEY).
 *
 * WARNING: This key is committed to source control for testing purposes only.
 * NEVER use this key in production environments.
 */
export const TEST_IAP_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAs5os9ujx7ZTw3ROSFmci
42jLwjO3OlZknnIotBhmp2O1nCcLukw2ITzyE0EYo0Waaiu5hCn/cmgCnCtTuSqW
FCItfmGpLRfsTLqVlc0LZeSItVqtaN0Utwywb2LvA7jaozeHGiXF1JRDH18ZgMlk
r0NiVTrJFpBDJ+ieBMh2VSj6D3cUK1sNvTb7z4GsyBo4rGT1URD5+JuViqX5S9tD
7sI7KuV/8PUYDsW53wRHsTK5fPTKhZeC/ZYTsu/ZnFv3gzqzFzJBwQVsmhnvBr+K
7OZVS+UDBjyg0vOOZG9sF6VBfWtzwH0W6gxtGZ7Tk7ut5Gj3DCoHeZD6/VnX4v0d
xwIDAQAB
-----END PUBLIC KEY-----`;

// ============================================================================
// Multipart form data size constants
// ============================================================================

/**
 * Estimated overhead per duplicate field in multipart/form-data encoding.
 *
 * Breakdown:
 * - Boundary delimiter: ~15 bytes (--boundary123\r\n)
 * - Content-Disposition header: ~45 bytes (Content-Disposition: form-data; name="field"\r\n)
 * - Blank line + value: ~20 bytes (\r\nvalue\r\n)
 * - Closing CRLF: ~10 bytes
 * Total: ~90 bytes (±10 byte variance depending on boundary length)
 */
export const MULTIPART_DUPLICATE_FIELD_OVERHEAD = 90;

/**
 * Conservative estimate for multipart/form-data base overhead.
 * Includes boundary markers and headers for a minimal form with 3-4 fields.
 */
export const MULTIPART_BASE_SIZE_ESTIMATE = 400;

/**
 * Estimated bytes for closing boundary and footer in multipart bodies.
 * Used when constructing raw multipart payloads for testing.
 */
export const MULTIPART_CLOSING_OVERHEAD = 100;

/**
 * Default form data size fallback when no size was previously recorded.
 */
export const DEFAULT_FORM_DATA_SIZE = 1000;

/**
 * Overhead for URL-encoded padding field: 'form_instance_display=' = 22 chars
 * plus URL encoding overhead, rounded up.
 */
export const URL_ENCODED_PAD_OVERHEAD = 26;

/**
 * Overhead for adding a padding field to JSON form_instance_page_data.
 * Replaces {} with {"_pad":"x"} = 9 bytes (quotes, colon, one x).
 */
export const JSON_PAD_FIELD_OVERHEAD = 9;

// ============================================================================
// Multipart size verification constants
// ============================================================================

/**
 * Tolerance for FormData size verification in BDD tests.
 *
 * FormData in Node.js uses a random boundary string that varies in length,
 * causing actual multipart body size to vary. This tolerance allows tests
 * to pass when actual size is within this range of the claimed size.
 *
 * Actual variance depends on:
 * - Boundary string length (varies by ~10 bytes)
 * - Multipart encoding overhead (varies by ~30-50 bytes)
 *
 * IMPORTANT: If actual size differs by more than this tolerance, the test
 * will fail with a clear error message. This prevents false confidence
 * that exact boundaries are being tested.
 */
export const MULTIPART_SIZE_TOLERANCE = 100;
