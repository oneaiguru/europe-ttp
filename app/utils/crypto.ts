/**
 * Cryptographic utilities for secure token generation and verification.
 * Provides HMAC-signed tokens to prevent forgery and information leakage.
 */

import { createHmac, timingSafeEqual } from 'crypto';

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
 * @param payload - The decoded upload payload
 * @param maxAgeSeconds - Maximum age in seconds (default: 15 minutes)
 * @returns true if the token has expired, false otherwise
 */
export function isUploadTokenExpired(payload: UploadPayload, maxAgeSeconds: number = 15 * 60): boolean {
  const now = Math.floor(Date.now() / 1000);
  const age = now - payload.timestamp;
  return age > maxAgeSeconds;
}

/**
 * Get the HMAC secret for signing upload tokens.
 * Throws if UPLOAD_HMAC_SECRET is not set.
 *
 * @throws {Error} If UPLOAD_HMAC_SECRET environment variable is not set
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
  // Warn if using the default development value
  if (secret === 'development-secret-change-in-production') {
    console.warn(
      'WARNING: Using default UPLOAD_HMAC_SECRET. ' +
      'This is insecure for production. Generate a secure random value.'
    );
  }
  return secret;
}
