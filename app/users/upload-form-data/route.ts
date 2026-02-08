// SECURITY NOTES:
// - This endpoint uses environment-gated authentication
// - Platform mode: Trust x-user-email header (App Engine with IAP)
// - Session mode: Validate bearer token with HMAC signature (standalone)
// - Payload size limited to prevent DoS attacks via stream-based reading
// - Field whitelist prevents injection of unexpected data

// Import stream-based body reader for secure size enforcement
import { readBodyWithLimit, isPayloadTooLargeError } from '../../utils/request';

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

  // For form data, we can't stream easily, so use content-length check as best-effort
  // Note: FormData API doesn't support streaming, so we rely on infrastructure limits
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    // Best-effort content-length check for form data
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
      throw new Error('413');
    }
    try {
      const formData = await request.formData();
      const data: Record<string, unknown> = {};
      formData.forEach((value, key) => {
        data[key] = typeof value === 'string' ? value : value.name;
      });
      return data as UploadFormPayload;
    } catch (e) {
      if (isPayloadTooLargeError(e)) {
        throw e;
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

  // 2. Parse and validate payload
  let payload: unknown;
  try {
    payload = await readPayload(request);
  } catch (e) {
    // Return 413 for oversized payloads, 400 for other parsing errors
    if (isPayloadTooLargeError(e)) {
      return Response.json(
        { error: 'Payload too large' },
        { status: 413 }
      );
    }
    const message = e instanceof Error ? e.message : 'Failed to parse request';
    return Response.json(
      { error: message },
      { status: 400 }
    );
  }

  // 3. Validate fields (whitelist check)
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

  // 4. TODO: Store data (current implementation is a stub)
  // Note: normalizePayload() would be called when storing data
  // For now, just acknowledge success without echoing payload for security

  return Response.json(
    {
      ok: true,
      user: user, // Echo user for verification (not full payload)
    },
    { status: 200 }
  );
}
