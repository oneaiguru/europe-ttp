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
 * 3. This is a placeholder implementation. Real signed URLs require the
 *    @google-cloud/storage library and proper GCS credentials.
 */

import { generateUploadToken, getHmacSecret } from '../../../utils/crypto';
import { getAuthenticatedUser } from '../../../utils/auth';

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

// Security: Signed URL expiration time (15 minutes)
const URL_EXPIRATION_MINUTES = 15;

interface SignedUrlRequest {
  filename?: string;
  filepath?: string;
  content_type?: string;
}

interface SignedUrlResponse {
  url?: string;
  key?: string;
  error?: string;
}

export async function POST(request: Request): Promise<Response> {
  // 1. Security: Check authentication (uses AUTH_MODE to determine method)
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return Response.json({ error: 'Authentication required' }, { status: 401 });
  }

  // 2. Parse request body
  let body: SignedUrlRequest;
  try {
    body = (await request.json()) as SignedUrlRequest;
  } catch {
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
    // Only allow alphanumeric, hyphens, underscores, and forward slashes
    if (!/^[\w\-/]+$/.test(filepath)) {
      return Response.json({ error: 'Invalid filepath characters' }, { status: 400 });
    }
  }

  // 4. Security: Validate content type against whitelist
  if (content_type && !ALLOWED_CONTENT_TYPES.includes(content_type as (typeof ALLOWED_CONTENT_TYPES)[number])) {
    return Response.json({ error: 'Invalid content type' }, { status: 400 });
  }

  // 5. Generate server-controlled filename (ignore client input for security)
  const timestamp = Math.floor(Date.now() / 1000);
  // Security: Sanitize user email and generate unique filename
  // Client-provided filename is intentionally ignored to prevent path traversal
  // and malicious filenames. All filenames are server-controlled.
  const sanitizedUser = user.replace(/[^a-zA-Z0-9_-]/g, '_');
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const safeFilename = `${sanitizedUser}_${timestamp}_${randomSuffix}`;
  const fullFilename = filepath ? `${filepath}/${safeFilename}` : safeFilename;

  // 6. Generate signed URL
  // Note: This is a placeholder implementation. In production, this would use
  // the Google Cloud Storage client library to generate actual signed URLs.
  // Example: const [signedUrl] = await storage.bucket(bucketName).file(fullFilename).getSignedUrl({ ... });
  const expiresAt = timestamp + URL_EXPIRATION_MINUTES * 60;
  const bucketName = process.env.BUCKET_NAME || 'test-bucket';
  // Security: URL-encode filename to handle special characters safely
  const encodedFilename = encodeURIComponent(fullFilename);
  const signedUrl = `https://storage.googleapis.com/${bucketName}/${encodedFilename}?Expires=${expiresAt}&GoogleAccessId=`;

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
