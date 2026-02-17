// SECURITY NOTES:
// - This endpoint uses environment-gated authentication
// - Platform mode: Trust x-user-email header (App Engine with IAP)
// - Session mode: Validate bearer token with HMAC signature (standalone)
// - Payload size limited to prevent DoS attacks via stream-based reading
// - Field whitelist prevents injection of unexpected data
// - Error messages are redacted in production to prevent information disclosure

// Import stream-based body reader for secure size enforcement
import { readBodyWithLimit, readBodyBytesWithLimit, isPayloadTooLargeError } from '../../utils/request';
import { checkRateLimit } from '../../utils/rate-limit';

/**
 * Check if the application is running in production mode.
 *
 * IMPORTANT: This is evaluated at REQUEST time, not module load time.
 * This ensures that tests which mutate NODE_ENV during runtime get
 * the correct error redaction behavior (generic vs detailed).
 */
function isProductionMode(): boolean {
  const env = process.env.NODE_ENV;
  // Fail-safe: assume production unless explicitly in development/test mode.
  // This prevents info leaks if NODE_ENV is unset, misconfigured, or set to
  // values like "staging", "prod", "PRODUCTION" (case-sensitive).
  return env !== 'development' && env !== 'test';
}

// Maximum payload size (5MB for form data)
const MAX_PAYLOAD_SIZE = 5 * 1024 * 1024;

// Strict interface for allowed form data fields (no [key: string]: unknown)
interface UploadFormPayload {
  form_type?: string;
  form_instance?: string;
  form_data?: unknown;
  form_instance_page_data?: unknown;
  form_instance_display?: string;
  user_home_country_iso?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

/**
 * Extract and validate the authenticated user from the request.
 *
 * Uses environment-gated authentication based on AUTH_MODE:
 * - platform: Trust x-user-email header (App Engine with IAP)
 * - session: Validate bearer token with HMAC signature (standalone)
 *
 * @param request - The incoming HTTP request
 * @returns The validated user email, or null if authentication fails
 */
async function requireAuth(request: Request): Promise<string | null> {
  const { getAuthenticatedUser } = await import('../../utils/auth');
  return getAuthenticatedUser(request);
}

/**
 * Validate request payload against field whitelist and type constraints.
 *
 * Performs security validation by:
 * - Ensuring payload is a valid object
 * - Rejecting any fields not in the allowed whitelist (prevents injection)
 * - Returning detailed validation errors for each rejected field
 *
 * @param payload - The parsed request body to validate
 * @returns Validation result with success flag, errors array, and typed data if valid
 */
function validatePayload(payload: unknown): { valid: boolean; errors: ValidationError[]; data?: UploadFormPayload } {
  const errors: ValidationError[] = [];

  if (typeof payload !== 'object' || payload === null) {
    return { valid: false, errors: [{ field: 'body', message: 'Invalid request body' }] };
  }

  const data = payload as Record<string, unknown>;

  // Check for unknown fields (reject any field not in our whitelist)
  const allowedFields = new Set([
    'form_type',
    'form_instance',
    'form_data',
    'form_instance_page_data',
    'form_instance_display',
    'user_home_country_iso',
  ]);

  for (const key of Object.keys(data)) {
    if (!allowedFields.has(key)) {
      errors.push({ field: key, message: `Unknown field '${key}' is not allowed` });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, errors: [], data: data as UploadFormPayload };
}

/**
 * Read and parse the request payload with security checks.
 *
 * Handles multiple content types (JSON, form-urlencoded, multipart/form-data)
 * and enforces payload size limits to prevent DoS attacks.
 *
 * SECURITY NOTE: Uses stream-based body reading to enforce size limits
 * regardless of content-length header presence or chunked transfer encoding.
 *
 * @param request - The incoming HTTP request
 * @returns Parsed and typed form data payload
 * @throws {Error} With message '413' if payload exceeds size limit
 * @throws {Error} If payload cannot be parsed
 */
async function readPayload(request: Request): Promise<UploadFormPayload> {
  const contentType = request.headers.get('content-type') ?? '';

  // For JSON content, use stream-based reading with size limit
  if (contentType.includes('application/json')) {
    const bodyText = await readBodyWithLimit(request, MAX_PAYLOAD_SIZE);
    try {
      return JSON.parse(bodyText) as UploadFormPayload;
    } catch {
      throw new Error('Invalid JSON body');
    }
  }

  // For form data, require content-length for deterministic behavior (matches BDD spec),
  // but still enforce the TRUE size limit by streaming the body ourselves. This prevents
  // a client from lying about Content-Length to bypass the limit before `formData()` runs.
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const contentLength = request.headers.get('content-length');
    if (!contentLength) {
      // Reject requests without content-length (could be chunked/abuse)
      throw new Error('411'); // Length Required
    }
    const size = parseInt(contentLength, 10);
    if (isNaN(size) || size > MAX_PAYLOAD_SIZE) {
      throw new Error('413'); // Payload Too Large
    }
    try {
      // Read body with a hard cap regardless of what the header claims.
      const bodyBytes = await readBodyBytesWithLimit(request, MAX_PAYLOAD_SIZE);

      // Re-create a new Request so we can safely call formData() after reading the body.
      // Note: Content-Length may be a lie; omit it so parsing relies on actual bytes.
      const headers = new Headers(request.headers);
      headers.delete('content-length');

      const replayRequest = new Request(request.url, {
        method: request.method,
        headers,
        // Use Blob to satisfy BodyInit typing across different fetch implementations.
        body: new Blob([bodyBytes]),
      });

      const formData = await replayRequest.formData();

      // Detect duplicate keys in multipart/form-data
      // When the same field name appears multiple times, formData.getAll(key) returns all values
      // Note: formData.keys() may return duplicate keys multiple times, so we use Set to deduplicate
      const allKeys = Array.from(new Set(formData.keys())); // Use Set to get unique keys
      const duplicates = allKeys.filter(key => formData.getAll(key).length > 1);
      if (duplicates.length > 0) {
        const errors = duplicates.map(dup => ({
          field: dup,
          message: `Duplicate field '${dup}' is not allowed`
        }));
        throw new Error(JSON.stringify({ errors }));
      }

      const data: Record<string, unknown> = {};
      formData.forEach((value, key) => {
        data[key] = typeof value === 'string' ? value : value.name;
      });
      return data as UploadFormPayload;
    } catch (e) {
      if (isPayloadTooLargeError(e)) {
        throw e;
      }
      // Check if this is our structured duplicate key error
      // If so, re-throw it so the outer handler can parse it properly
      if (e instanceof Error) {
        let parsed: unknown = null;
        try {
          parsed = JSON.parse(e.message);
        } catch {
          // Not JSON, fall through
        }
        if (parsed && typeof parsed === 'object' && 'errors' in parsed && Array.isArray(parsed.errors)) {
          // This is our structured error - throw it directly
          throw e;
        }
      }
      throw new Error('Invalid form data');
    }
  }

  // Default: try JSON
  try {
    const bodyText = await readBodyWithLimit(request, MAX_PAYLOAD_SIZE);
    return JSON.parse(bodyText) as UploadFormPayload;
  } catch (e) {
    if (isPayloadTooLargeError(e)) {
      throw e;
    }
    throw new Error('Invalid request body');
  }
}

export async function POST(request: Request): Promise<Response> {
  // 1. Authentication check
  const user = await requireAuth(request);
  if (!user) {
    return Response.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // 2. Security: Rate limiting to prevent abuse
  const rateLimit = await checkRateLimit(user);
  if (!rateLimit.allowed) {
    const retryAfterSeconds = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
    return Response.json(
      {
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retryAfter: retryAfterSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfterSeconds.toString(),
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetAt.toString(),
        },
      }
    );
  }

  // 3. Parse and validate payload
  let payload: unknown;
  try {
    payload = await readPayload(request);
  } catch (e) {
    // Return 413 for oversized payloads
    if (isPayloadTooLargeError(e)) {
      return Response.json(
        { error: 'Payload too large' },
        { status: 413 }
      );
    }
    // Return 411 for missing content-length on form-data requests
    if (e instanceof Error && e.message === '411') {
      return Response.json(
        { error: 'Content-Length header required' },
        { status: 411 }
      );
    }
    // Check if error contains structured validation errors (e.g., duplicate keys)
    if (e instanceof Error) {
      try {
        const parsed = JSON.parse(e.message);
        if ('errors' in parsed && Array.isArray(parsed.errors)) {
          return Response.json(
            {
              error: 'Validation failed',
              details: parsed.errors,
            },
            { status: 400 }
          );
        }
      } catch {
        // Not a structured error, fall through to default handling
      }
    }
    const production = isProductionMode();
    const message = production
      ? 'Failed to parse request'
      : (e instanceof Error ? e.message : 'Failed to parse request');
    return Response.json(
      { error: message },
      { status: 400 }
    );
  }

  // 4. Validate fields (whitelist check)
  const validation = validatePayload(payload);
  if (!validation.valid) {
    return Response.json(
      {
        error: 'Validation failed',
        details: validation.errors,
      },
      { status: 400 }
    );
  }

  // 5. Form data persistence is intentionally deferred.
  // The current implementation validates and acknowledges submissions without storing them.
  // See MIGRATION_DECISIONS.md for the full rationale and future work items.
  // Note: normalizePayload() would be called when storing data in a future implementation.

  return Response.json(
    {
      ok: true,
      user: user, // Echo user for verification (not full payload)
    },
    { status: 200 }
  );
}
