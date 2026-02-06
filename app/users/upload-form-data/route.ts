// SECURITY NOTES:
// - This endpoint uses x-user-email header for authentication (App Engine compatibility)
// - Platform-level auth is REQUIRED in production (App Engine sets this header)
// - For standalone Next.js deployments, implement NextAuth.js or similar
// - Payload size limited to prevent DoS attacks
// - Field whitelist prevents injection of unexpected data

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

async function requireAuth(request: Request): Promise<string | null> {
  // WARNING: Uses x-user-email header for compatibility with legacy App Engine
  // Platform-level auth is REQUIRED in production
  // TODO: Replace with NextAuth.js for standalone deployments
  const user = request.headers.get('x-user-email');
  if (!user) {
    return null;
  }
  // Basic email format validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user)) {
    return null;
  }
  return user;
}

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

async function readPayload(request: Request): Promise<UploadFormPayload> {
  // Security: Check payload size before parsing
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_SIZE) {
    throw new Error('Payload too large');
  }

  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      return (await request.json()) as UploadFormPayload;
    } catch (e) {
      throw new Error('Invalid JSON body');
    }
  }

  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    try {
      const formData = await request.formData();
      const data: Record<string, unknown> = {};
      formData.forEach((value, key) => {
        data[key] = typeof value === 'string' ? value : value.name;
      });
      return data as UploadFormPayload;
    } catch (e) {
      throw new Error('Invalid form data');
    }
  }

  try {
    return (await request.json()) as UploadFormPayload;
  } catch (e) {
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
