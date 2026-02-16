/**
 * Signed Upload URL API
 *
 * Generates a signed URL for uploading files to Google Cloud Storage.
 *
 * SECURITY NOTES:
 * 1. Authentication: Uses environment-gated authentication based on AUTH_MODE:
 *    - platform: Trust x-user-email header (App Engine with IAP)
 *    - session: Validate bearer token with HMAC signature (standalone)
 *
 * 2. Filenames: Server-controlled only. Client-provided filenames are ignored
 *    to prevent path traversal and malicious file naming.
 *
 * 3. GCS Configuration: Returns real signed URLs when GCS is configured,
 *    or HTTP 501 (Not Implemented) when GCS is not available.
 */

import { randomBytes } from 'crypto';
import { generateUploadToken, getHmacSecret } from '../../../utils/crypto';
import { getAuthenticatedUser } from '../../../utils/auth';
import { readBodyWithLimit, isPayloadTooLargeError } from '../../../utils/request';
import { checkRateLimit } from '../../../utils/rate-limit';

// GCS Configuration interface
interface GCSConfig {
  bucketName: string;
  credentials?: string; // JSON string of service account
}

/**
 * Get GCS configuration from environment variables.
 * Returns null if GCS is not configured.
 */
function getGCSConfig(): GCSConfig | null {
  const bucketName = process.env.BUCKET_NAME;
  const credentials = process.env.GCS_CREDENTIALS; // Optional: uses ADC if not set

  if (!bucketName) {
    return null;
  }

  return { bucketName, credentials };
}

// Security: Content-type whitelist for allowed file uploads
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

// Security: Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Security: Maximum JSON body size (16KB)
const MAX_BODY_SIZE = 16 * 1024;

// Security: Signed URL expiration time (15 minutes)
const URL_EXPIRATION_MINUTES = 15;

/**
 * Check if the application is running in production mode.
 *
 * IMPORTANT: This is evaluated at REQUEST time, not module load time.
 * This ensures that tests which mutate NODE_ENV during runtime get
 * the correct error redaction behavior (generic vs detailed).
 *
 * See TASK-263: upload-signed-url-runtime-node-env-evaluation
 */
function isProductionMode(): boolean {
  const env = process.env.NODE_ENV;
  // Fail-safe: assume production unless explicitly in development/test mode.
  // This prevents info leaks if NODE_ENV is unset, misconfigured, or set to
  // values like "staging", "prod", "PRODUCTION" (case-sensitive).
  return env !== 'development' && env !== 'test';
}

interface SignedUrlRequest {
  filename?: string;
  filepath?: string;
  content_type: string; // Required for security - prevents bypass of content type whitelist
}

export async function POST(request: Request): Promise<Response> {
  // 1. Security: Check authentication (uses AUTH_MODE to determine method)
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
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

  // 2. Parse request body with size limit
  let body: SignedUrlRequest;
  try {
    const bodyText = await readBodyWithLimit(request, MAX_BODY_SIZE);
    body = JSON.parse(bodyText) as SignedUrlRequest;
  } catch (e) {
    if (isPayloadTooLargeError(e)) {
      return Response.json({ error: 'Payload too large' }, { status: 413 });
    }
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }
  // Security: Client-provided filename is intentionally ignored
  const { filepath, content_type } = body;

  // 3. Security: Validate filepath to prevent directory traversal attacks
  if (filepath) {
    // Reject directory traversal attempts
    if (filepath.includes('..') || filepath.startsWith('/')) {
      return Response.json({ error: 'Invalid filepath' }, { status: 400 });
    }
    // Allow alphanumeric, hyphens, underscores, @ and . (for user emails), and forward slashes
    // Note: @ and . are allowed but cross-user @ segments are validated later
    if (!/^[\w@./-]+$/.test(filepath)) {
      return Response.json({ error: 'Invalid filepath characters' }, { status: 400 });
    }
  }

  // 4. Security: Validate content type is present and against whitelist
  if (!content_type) {
    return Response.json({ error: 'content_type is required in request body' }, { status: 400 });
  }
  if (!ALLOWED_CONTENT_TYPES.includes(content_type as (typeof ALLOWED_CONTENT_TYPES)[number])) {
    return Response.json({ error: 'Invalid content type' }, { status: 400 });
  }

  // 5. Generate server-controlled filename (ignore client input for security)
  const timestamp = Math.floor(Date.now() / 1000);
  // Security: Sanitize user email and generate unique filename
  // Client-provided filename is intentionally ignored to prevent path traversal
  // and malicious filenames. All filenames are server-controlled.
  // SECURITY: Use cryptographically secure random bytes for filename suffix
  // to prevent predictability attacks (Math.random is not CSPRNG).
  const sanitizedUser = user.replace(/[^a-zA-Z0-9_-]/g, '_');
  const randomSuffix = randomBytes(6).toString('base64url');
  const safeFilename = `${sanitizedUser}_${timestamp}_${randomSuffix}`;
  const fullFilename = filepath ? `${filepath}/${safeFilename}` : safeFilename;

  // 5.5. Security: Prevent cross-user filepath injection
  // Users cannot specify another user's email in the filepath
  // Check for email patterns in the filepath (with or without path separators)
  if (filepath && filepath.includes('@')) {
    // Split by / to handle paths like "photos/bob@example.com" or "bob@example.com/photos"
    const segments = filepath.split('/');
    for (const segment of segments) {
      // Check if segment looks like an email (contains @)
      if (segment.includes('@')) {
        // Compare against raw user email (not sanitized) - both contain @
        // Same-user email segments are allowed per comment at line 136-137
        if (segment !== user) {
          return Response.json(
            { error: 'Unauthorized filepath scope - authorization required', message: 'Cannot specify another user in filepath' },
            { status: 403 }
          );
        }
      }
    }
  }

  // 6. Check GCS configuration
  const gcsConfig = getGCSConfig();

  if (!gcsConfig) {
    // Production error redaction: do not expose configuration state or setup guidance
    const production = isProductionMode();
    return Response.json(
      {
        error: production ? 'STORAGE_UNAVAILABLE' : 'GCS_NOT_CONFIGURED',
        message: production
          ? 'Storage service is not available'
          : 'Google Cloud Storage is not configured. Signed URL generation is disabled.',
        ...(production ? {} : {
          documentation: 'See SETUP.md for GCS configuration. Set BUCKET_NAME environment variable to enable.',
        }),
      },
      { status: 501 }
    );
  }

  let signedUrl: string;

  // Check for test mode mock (for BDD testing without real GCS credentials)
  if (globalThis.__MOCK_GCS_SIGNED_URL__ && process.env.NODE_ENV !== 'production') {
    signedUrl = globalThis.__MOCK_GCS_SIGNED_URL__;
  } else {
    try {
      // Dynamic import to handle optional dependency
      // This allows the package to be missing in dev/staging while working in production
      const gcsModule = await import('@google-cloud/storage');
      const { Storage } = gcsModule;

      // Create Storage client with explicit credentials or Application Default Credentials
      const storage = gcsConfig.credentials
        ? new Storage({ credentials: JSON.parse(gcsConfig.credentials) })
        : new Storage(); // Use Application Default Credentials (ADC)

      const bucket = storage.bucket(gcsConfig.bucketName);
      const file = bucket.file(fullFilename);

      // Generate real signed URL with v4 signing
      const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + URL_EXPIRATION_MINUTES * 60 * 1000,
        contentType: content_type,
        extensionHeaders: {
          'x-goog-content-length-range': `0,${MAX_FILE_SIZE}`,
        },
      });

      signedUrl = url;
    } catch (error) {
    // Handle missing package or configuration errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // If the package is not found, provide a helpful error
    if (errorMessage.includes('Cannot find module') || errorMessage.includes('Cannot resolve package')) {
      const production = isProductionMode();
      return Response.json(
        {
          error: 'GCS_PACKAGE_NOT_INSTALLED',
          message: production
            ? 'Storage service is not available'
            : '@google-cloud/storage package is not installed. Run: npm install',
          ...(production ? {} : { documentation: 'See SETUP.md for GCS setup instructions.' }),
        },
        { status: 501 }
      );
    }

    // Other errors (credentials, bucket access, etc.)
    console.error('Failed to generate signed URL:', error);
    const production = isProductionMode();
    return Response.json(
      {
        error: 'SIGNED_URL_GENERATION_FAILED',
        message: production ? 'Failed to generate signed URL' : errorMessage,
      },
      { status: 500 }
    );
    }
  }

  // 7. Generate upload key (for tracking)
  // SECURITY: Use HMAC-signed token instead of base64 to prevent:
  // - Token forgery (clients cannot encode arbitrary values)
  // - Information leakage (user email and filepath are not visible in base64)
  const uploadKey = generateUploadToken(
    { user, timestamp, filename: fullFilename },
    getHmacSecret()
  );

  return Response.json({
    url: signedUrl,
    key: uploadKey,
  });
}
