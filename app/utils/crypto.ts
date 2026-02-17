/**
 * Cryptographic utilities for secure token generation and verification.
 * Provides HMAC-signed tokens to prevent forgery and information leakage.
 */

import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Clock skew tolerance for token timestamp validation.
 *
 * Tokens with timestamps beyond `now + CLOCK_SKEW_TOLERANCE` are rejected to prevent
 * extended validity from crafted future timestamps or clock skew.
 *
 * Value: 300 seconds (5 minutes) - common NTP/RTC drift tolerance.
 *
 * @see CLOCK_SKEW_TOLERANCE in auth.ts - should match across token types
 */
export const CLOCK_SKEW_TOLERANCE = 300;

/**
 * Payload structure for upload tokens.
 */
export interface UploadPayload {
  user: string;
  timestamp: number;
  filename: string;
}

/**
 * Generate a cryptographically signed token for upload tracking.
 *
 * Token format: base64url(payload) + "." + base64url(hmac_sha256(secret, payload))
 *
 * The payload is double-encoded:
 * 1. Each component is base64-encoded to prevent delimiter confusion
 * 2. The entire payload string is base64url-encoded
 * 3. An HMAC signature is appended
 *
 * This prevents:
 * - Token forgery (signature verification required)
 * - Information leakage (payload is encoded, not plaintext)
 *
 * @param payload - The upload payload containing user, timestamp, and filename
 * @param secret - The HMAC secret key (use environment variable in production)
 * @returns A signed token in the format: encodedPayload.signature
 */
export function generateUploadToken(payload: UploadPayload, secret: string): string {
  // Encode each component to base64 to handle special characters and prevent delimiter collision
  const encodedUser = Buffer.from(payload.user).toString('base64');
  const encodedFilename = Buffer.from(payload.filename).toString('base64');

  // Create the payload string with encoded components
  const payloadString = `${encodedUser}:${payload.timestamp}:${encodedFilename}`;

  // Double-encode the payload (base64url) for the token format
  const encodedPayload = Buffer.from(payloadString).toString('base64url');

  // Generate HMAC signature
  const signature = createHmac('sha256', secret)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

/**
 * Verify an upload token signature and decode the payload.
 *
 * @param token - The signed token to verify
 * @param secret - The HMAC secret key used to sign the token
 * @returns The decoded payload if valid, null if invalid or expired
 */
export function verifyUploadToken(token: string, secret: string): UploadPayload | null {
  // Split token into payload and signature
  const lastDotIndex = token.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return null; // Invalid format
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
    return null; // Invalid base64url encoding
  }

  // Parse payload components
  const parts = decoded.split(':');
  if (parts.length !== 3) {
    return null; // Invalid payload structure
  }

  const [userB64, timestampStr, filenameB64] = parts;

  // Decode each component
  let user: string;
  let filename: string;
  let timestamp: number;

  try {
    user = Buffer.from(userB64, 'base64').toString();
    filename = Buffer.from(filenameB64, 'base64').toString();
    timestamp = parseInt(timestampStr, 10);

    if (isNaN(timestamp) || !user || !filename) {
      return null;
    }
  } catch {
    return null; // Invalid base64 encoding in components
  }

  return { user, timestamp, filename };
}

/**
 * Check if an upload token has expired.
 *
 * A token is considered expired if:
 * 1. It is older than maxAgeSeconds (too old)
 * 2. Its timestamp is beyond now + CLOCK_SKEW_TOLERANCE (too far in the future)
 *
 * @param payload - The decoded upload payload
 * @param maxAgeSeconds - Maximum age in seconds (default: 15 minutes)
 * @returns true if the token has expired, false otherwise
 */
export function isUploadTokenExpired(payload: UploadPayload, maxAgeSeconds: number = 15 * 60): boolean {
  const now = Math.floor(Date.now() / 1000);
  const age = now - payload.timestamp;

  // Reject tokens older than maxAge
  if (age > maxAgeSeconds) {
    return true;
  }

  // Reject tokens with timestamps too far in the future (clock skew defense)
  // Negative age means timestamp is in the future
  if (age < -CLOCK_SKEW_TOLERANCE) {
    return true;
  }

  return false;
}

/**
 * Get the HMAC secret for signing upload tokens.
 * Throws if UPLOAD_HMAC_SECRET is not set or if using the default value in production.
 *
 * @throws {Error} If UPLOAD_HMAC_SECRET environment variable is not set
 * @throws {Error} If using the default secret in production mode (NODE_ENV=production)
 * @returns The HMAC secret
 */
export function getHmacSecret(): string {
  const secret = process.env.UPLOAD_HMAC_SECRET;
  if (!secret) {
    throw new Error(
      'UPLOAD_HMAC_SECRET environment variable is required. ' +
      'Set it in your environment or .env file. ' +
      'Generate with: openssl rand -base64 32'
    );
  }

  const DEFAULT_SECRET = 'development-secret-change-in-production';

  // Security: Fail closed outside development/test environments
  // This prevents HMAC token forgery in staging, preview, or unset NODE_ENV scenarios
  const nodeEnv = process.env.NODE_ENV;
  const isDevelopment = nodeEnv === 'development' || nodeEnv === 'test';

  if (!isDevelopment && secret === DEFAULT_SECRET) {
    throw new Error(
      'UPLOAD_HMAC_SECRET is set to the default development value. ' +
      'This is insecure outside development/test environments. ' +
      'Generate a secure random value with: openssl rand -base64 32'
    );
  }

  // Warn if using the default development value (development/test only)
  if (isDevelopment && secret === DEFAULT_SECRET) {
    console.warn(
      'WARNING: Using default UPLOAD_HMAC_SECRET. ' +
      'This is insecure for production. Generate a secure random value.'
    );
  }

  return secret;
}

/**
 * Get the HMAC secret for signing session tokens.
 * Throws if SESSION_HMAC_SECRET is not set and UPLOAD_HMAC_SECRET is also not set,
 * or if using the default value in production.
 *
 * Falls back to UPLOAD_HMAC_SECRET for backward compatibility if SESSION_HMAC_SECRET
 * is not set. This allows existing deployments to continue working while encouraging
 * separation of session and upload token secrets for defense in depth.
 *
 * @throws {Error} If neither SESSION_HMAC_SECRET nor UPLOAD_HMAC_SECRET is set
 * @throws {Error} If using the default secret in production mode (NODE_ENV=production)
 * @returns The HMAC secret for session tokens
 */
export function getSessionHmacSecret(): string {
  const secret = process.env.SESSION_HMAC_SECRET;
  if (secret) {
    // Validate SESSION_HMAC_SECRET if set
    const isProduction = process.env.NODE_ENV === 'production';
    const DEFAULT_SECRET = 'development-secret-change-in-production';

    if (isProduction && secret === DEFAULT_SECRET) {
      throw new Error(
        'SESSION_HMAC_SECRET is set to the default development value. ' +
        'This is insecure for production. ' +
        'Generate a secure random value with: openssl rand -base64 32'
      );
    }

    if (!isProduction && secret === DEFAULT_SECRET) {
      console.warn(
        'WARNING: Using default SESSION_HMAC_SECRET. ' +
        'This is insecure for production. Generate a secure random value.'
      );
    }

    return secret;
  }

  // Fall back to UPLOAD_HMAC_SECRET for backward compatibility
  console.warn(
    'WARNING: SESSION_HMAC_SECRET not set, falling back to UPLOAD_HMAC_SECRET. ' +
    'For better security, set a separate SESSION_HMAC_SECRET environment variable.'
  );
  return getHmacSecret();
}
