/**
 * Authentication utilities for API routes.
 *
 * Provides environment-gated authentication to support both:
 * - Platform mode: Trust x-user-email header (App Engine with IAP)
 * - Session mode: Validate bearer token with HMAC signature (standalone)
 */

import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { getHmacSecret } from './crypto';

/**
 * Supported authentication modes.
 */
export type AuthMode = 'platform' | 'session';

/**
 * Session token payload structure (internal).
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface SessionPayload {
  email: string;
  timestamp: number;
  nonce: string;
}

/**
 * Get the current authentication mode from environment.
 * Defaults to 'platform' for backward compatibility.
 *
 * @returns The current authentication mode
 */
export function getAuthMode(): AuthMode {
  const mode = process.env.AUTH_MODE as AuthMode;
  return mode === 'session' ? 'session' : 'platform';
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

  const parsed = parseInt(maxAge, 10);
  if (isNaN(parsed)) {
    throw new Error(
      'SESSION_MAX_AGE_SECONDS must be a valid integer. Got: ' + maxAge
    );
  }

  if (parsed < 1) {
    throw new Error(
      'SESSION_MAX_AGE_SECONDS must be a positive integer. Got: ' + parsed
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
 * Token format: base64url(email + ":" + timestamp + ":" + nonce) + "." + base64url(hmac)
 *
 * @param email - The user email to embed in the token
 * @param secret - The HMAC secret key (use UPLOAD_HMAC_SECRET in production)
 * @returns A signed session token
 */
export function generateSessionToken(email: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = randomBytes(16).toString('base64url');

  // Encode email to handle special characters
  const encodedEmail = Buffer.from(email).toString('base64');

  // Create payload string
  const payloadString = `${encodedEmail}:${timestamp}:${nonce}`;

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

  // Parse payload components
  const parts = decoded.split(':');
  if (parts.length !== 3) {
    return null;
  }

  const [emailB64, timestampStr, nonce] = parts;

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

  // Check expiration
  const maxAge = maxAgeSeconds ?? getSessionMaxAge();
  const now = Math.floor(Date.now() / 1000);
  const age = now - timestamp;

  if (age > maxAge) {
    return null;
  }

  return email;
}

/**
 * Extract the bearer token from the Authorization header.
 *
 * @param authHeader - The Authorization header value
 * @returns The bearer token, or null if not present/invalid
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Get the authenticated user from a request.
 *
 * This is the unified entry point for authentication across all API routes.
 * Behavior depends on AUTH_MODE environment variable:
 *
 * - `platform` (default): Returns x-user-email header value directly.
 *   Safe for App Engine with IAP where platform validates the header.
 *
 * - `session`: Validates bearer token against HMAC secret.
 *   Safe for standalone deployments where client controls headers.
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

    const secret = getHmacSecret();
    return verifySessionToken(token, secret);
  }

  // Platform mode: Trust x-user-email header
  const user = request.headers.get('x-user-email');
  if (!user) {
    return null;
  }

  // Basic email format validation (applies to both modes)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user)) {
    return null;
  }

  return user;
}
