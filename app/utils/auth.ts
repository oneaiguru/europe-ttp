/**
 * Authentication utilities for API routes.
 *
 * Provides environment-gated authentication to support both:
 * - Platform mode: Trust x-user-email header (App Engine with IAP)
 * - Session mode: Validate bearer token with HMAC signature (standalone)
 */

import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { importSPKI, jwtVerify, type KeyLike } from 'jose';
import { getSessionHmacSecret } from './crypto';

/**
 * Supported authentication modes.
 */
export type AuthMode = 'platform' | 'session';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_IAP_ISSUER = 'https://cloud.google.com/iap';

/**
 * Clock skew tolerance for token timestamp validation.
 *
 * Tokens with timestamps beyond `now + CLOCK_SKEW_TOLERANCE` are rejected to prevent
 * extended validity from crafted future timestamps or clock skew.
 *
 * Value: 300 seconds (5 minutes) - common NTP/RTC drift tolerance.
 */
export const CLOCK_SKEW_TOLERANCE = 300;

let cachedIapPublicKey: KeyLike | null = null;
let cachedIapPublicKeyPem: string | null = null;
let iapPublicKeyPromise: Promise<KeyLike | null> | null = null;
let iapPublicKeyPromisePem: string | null = null;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

async function getIapPublicKey(): Promise<KeyLike | null> {
  const publicKey = process.env.IAP_JWT_PUBLIC_KEY;
  if (!publicKey) {
    return null;
  }

  if (cachedIapPublicKey && cachedIapPublicKeyPem === publicKey) {
    return cachedIapPublicKey;
  }

  // If already fetching for the same PEM, return the existing promise to deduplicate concurrent calls
  // If PEM changed, discard old promise and start fresh
  if (iapPublicKeyPromise && iapPublicKeyPromisePem === publicKey) {
    return iapPublicKeyPromise;
  }

  // Create and store the promise for concurrent callers to share
  // Store the PEM associated with this promise for env change detection
  iapPublicKeyPromisePem = publicKey;
  iapPublicKeyPromise = (async () => {
    try {
      const imported = await importSPKI(publicKey, 'RS256');
      cachedIapPublicKey = imported;
      cachedIapPublicKeyPem = publicKey;
      return imported;
    } catch {
      // Reset promise on failure to allow retry on next call
      iapPublicKeyPromise = null;
      iapPublicKeyPromisePem = null;
      return null;
    }
  })();

  return iapPublicKeyPromise;
}

async function verifyIapJwt(assertion: string): Promise<string | null> {
  const audience = process.env.IAP_JWT_AUDIENCE;
  if (!audience) {
    return null;
  }

  const issuer = process.env.IAP_JWT_ISSUER || DEFAULT_IAP_ISSUER;
  const publicKey = await getIapPublicKey();
  if (!publicKey) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(assertion, publicKey, {
      audience,
      issuer,
    });

    const email = typeof payload.email === 'string' ? payload.email : null;
    if (!email || !isValidEmail(email)) {
      return null;
    }

    return email;
  } catch {
    return null;
  }
}

/**
 * Session token payload structure (internal).
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface SessionPayload {
  typ: 'session'; // Token type marker to prevent upload-key replay
  email: string;
  timestamp: number;
  nonce: string;
}

/**
 * Get the current authentication mode from environment.
 * Defaults to 'session' (fail-secure) - requires explicit opt-in for platform mode.
 *
 * @returns The current authentication mode
 */
export function getAuthMode(): AuthMode {
  const mode = process.env.AUTH_MODE as AuthMode;
  // Default to 'session' (fail-secure) - requires explicit opt-in for platform mode
  return mode === 'platform' ? 'platform' : 'session';
}

/**
 * Get the session token max age from environment.
 * Defaults to 3600 seconds (1 hour).
 * Validates the value and throws if invalid.
 *
 * @throws {Error} If SESSION_MAX_AGE_SECONDS is set but not a valid positive integer
 * @returns The session token max age in seconds
 */
export function getSessionMaxAge(): number {
  const maxAge = process.env.SESSION_MAX_AGE_SECONDS;
  if (!maxAge) {
    return 3600;
  }

  // Trim whitespace for consistent validation
  const trimmed = maxAge.trim();

  // Empty after trim is treated as unset (use default)
  if (trimmed === '') {
    return 3600;
  }

  // Strict format check: must be a canonical positive integer string (e.g., "3600", "7200")
  // Rejects: "3600abc", "1e3", "", "  ", "-5", "0", " 3600 " (after trim)
  if (!/^[1-9]\d*$/.test(trimmed)) {
    throw new Error(
      'SESSION_MAX_AGE_SECONDS must be a positive integer in canonical form (no leading zeros, no trailing characters). Got: ' + maxAge
    );
  }

  const parsed = parseInt(trimmed, 10);

  // Double-check (should never fail given regex above, but defend against edge cases)
  if (Number.isNaN(parsed) || parsed <= 0 || !Number.isFinite(parsed)) {
    throw new Error(
      'SESSION_MAX_AGE_SECONDS must be a positive integer. Got: ' + maxAge
    );
  }

  // Reasonable upper bound: 30 days
  const MAX_MAX_AGE = 30 * 24 * 60 * 60; // 2,592,000 seconds
  if (parsed > MAX_MAX_AGE) {
    throw new Error(
      'SESSION_MAX_AGE_SECONDS must be at most 30 days (2,592,000 seconds). Got: ' + parsed
    );
  }

  return parsed;
}

/**
 * Generate a cryptographically signed session token.
 *
 * Token format: base64url(typ + ":" + email + ":" + timestamp + ":" + nonce) + "." + base64url(hmac)
 *
 * The `typ` field is included to prevent upload tokens from being replayed as session tokens.
 *
 * @param email - The user email to embed in the token
 * @param secret - The HMAC secret key (use SESSION_HMAC_SECRET in production)
 * @returns A signed session token
 */
export function generateSessionToken(email: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = randomBytes(16).toString('base64url');

  // Encode email to handle special characters
  const encodedEmail = Buffer.from(email).toString('base64');

  // Create payload string with type marker
  const payloadString = `session:${encodedEmail}:${timestamp}:${nonce}`;

  // Encode the payload
  const encodedPayload = Buffer.from(payloadString).toString('base64url');

  // Generate HMAC signature
  const signature = createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

/**
 * Verify a session token signature and expiration.
 *
 * The token must include a `typ=session` marker to prevent upload tokens from
 * being replayed as session tokens (token-type confusion defense).
 *
 * @param token - The signed session token to verify
 * @param secret - The HMAC secret key used to sign the token
 * @param maxAgeSeconds - Maximum token age in seconds (defaults to getSessionMaxAge())
 * @returns The user email if valid, null if invalid or expired
 */
export function verifySessionToken(
  token: string,
  secret: string,
  maxAgeSeconds?: number
): string | null {
  // Split token into payload and signature
  const lastDotIndex = token.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return null;
  }

  const encodedPayload = token.substring(0, lastDotIndex);
  const signature = token.substring(lastDotIndex + 1);

  if (!encodedPayload || !signature) {
    return null;
  }

  // Verify signature using constant-time comparison to prevent timing attacks
  const expectedSignature = createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');

  // Convert base64url strings to Buffers for timing-safe comparison
  const sigBuf = Buffer.from(signature, 'base64url');
  const expectedBuf = Buffer.from(expectedSignature, 'base64url');

  // Length check is acceptable here since HMAC-SHA256 always produces 32 bytes (43 chars base64url)
  if (sigBuf.length !== expectedBuf.length) {
    return null;
  }

  if (!timingSafeEqual(sigBuf, expectedBuf)) {
    return null; // Signature mismatch - token may have been tampered with
  }

  // Decode payload
  let decoded: string;
  try {
    decoded = Buffer.from(encodedPayload, 'base64url').toString();
  } catch {
    return null;
  }

  // Parse payload components (expecting 4 fields with type marker)
  const parts = decoded.split(':');
  if (parts.length !== 4) {
    return null; // Invalid payload structure - rejects old 3-field tokens without type marker
  }

  const [typ, emailB64, timestampStr, nonce] = parts;

  // Verify token type marker - prevents upload tokens from being replayed as session tokens
  if (typ !== 'session') {
    return null; // Wrong token type - rejects upload tokens
  }

  // Decode email
  let email: string;
  let timestamp: number;

  try {
    email = Buffer.from(emailB64, 'base64').toString();
    timestamp = parseInt(timestampStr, 10);

    if (isNaN(timestamp) || !email || !nonce) {
      return null;
    }
  } catch {
    return null;
  }

  // Check expiration (both too old and too far in the future)
  const maxAge = maxAgeSeconds ?? getSessionMaxAge();
  const now = Math.floor(Date.now() / 1000);
  const age = now - timestamp;

  // Reject tokens older than maxAge
  if (age > maxAge) {
    return null;
  }

  // Reject tokens with timestamps too far in the future (clock skew defense)
  // Negative age means timestamp is in the future
  if (age < -CLOCK_SKEW_TOLERANCE) {
    return null;
  }

  return email;
}

/**
 * Extract the bearer token from the Authorization header.
 *
 * HTTP schemes are case-insensitive per RFC 2616 Section 3.8.
 * Accepts "Bearer", "bearer", "BEARER", and any mixed-case variant.
 *
 * @param authHeader - The Authorization header value
 * @returns The bearer token, or null if not present/invalid
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  // Use regex to be tolerant of multiple spaces between "Bearer" and the token
  // e.g., "Bearer    <token>" should be valid
  const match = authHeader.match(/^bearer\s+(.+)$/i);
  if (!match) {
    return null;
  }

  return match[1];
}

/**
 * Get the authenticated user from a request.
 *
 * This is the unified entry point for authentication across all API routes.
 * Behavior depends on AUTH_MODE environment variable:
 *
 * **Platform mode** (opt-in only, AUTH_MODE=platform):
 * - Requires IAP JWT verification in production (AUTH_MODE_PLATFORM_STRICT=true).
 * - In production, rejects all requests without verified IAP JWT assertion (fail closed).
 * - In development/testing, non-strict mode accepts x-user-email directly.
 * - Safe ONLY when deployment infrastructure validates the header (e.g., App Engine IAP).
 *
 * **Session mode** (default, AUTH_MODE=session or unset):
 * - Validates bearer token against HMAC secret.
 * - Safe for standalone deployments where client controls headers.
 *
 * @param request - The incoming HTTP request
 * @returns The authenticated user email, or null if authentication fails
 */
export async function getAuthenticatedUser(request: Request): Promise<string | null> {
  const mode = getAuthMode();

  if (mode === 'session') {
    // Session mode: Validate bearer token
    const authHeader = request.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    if (!token) {
      return null;
    }

    const secret = getSessionHmacSecret();
    return verifySessionToken(token, secret);
  }

  // Platform mode: Trust x-user-email header (unless strict mode is enabled)
  const headerEmail = request.headers.get('x-user-email');

  // Security: Fail closed outside development/test unless strict mode is enabled
  // This prevents auth bypass in staging, preview, or unset NODE_ENV scenarios
  const nodeEnv = process.env.NODE_ENV;
  const isDevelopment = nodeEnv === 'development' || nodeEnv === 'test';
  const isStrictMode = process.env.AUTH_MODE_PLATFORM_STRICT === 'true';

  if (!isDevelopment && !isStrictMode) {
    // Fail closed when not in explicit dev/test environment and strict mode is disabled
    // Non-strict platform mode is ONLY allowed for development/testing
    console.warn(
      'Platform mode requires AUTH_MODE_PLATFORM_STRICT=true outside development. ' +
        'Request rejected for security.'
    );
    return null;
  }

  // Strict mode: require verified IAP JWT assertion and ignore header spoofing.
  if (isStrictMode) {
    const assertion = request.headers.get('x-goog-iap-jwt-assertion');
    if (!assertion) {
      return null;
    }

    const verifiedEmail = await verifyIapJwt(assertion);
    if (!verifiedEmail) {
      return null;
    }

    if (headerEmail && headerEmail !== verifiedEmail) {
      return null;
    }

    return verifiedEmail;
  }

  if (!headerEmail) {
    return null;
  }

  // Basic email format validation (applies to both modes)
  if (!isValidEmail(headerEmail)) {
    return null;
  }

  return headerEmail;
}
