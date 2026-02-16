/**
 * Request utility functions for secure body reading.
 *
 * Provides stream-based body size enforcement to prevent DoS attacks
 * via large payloads, missing content-length headers, or chunked transfer encoding.
 */

/**
 * Error code thrown when payload size exceeds limit.
 * Used by route handlers to return proper HTTP 413 status.
 */
const PAYLOAD_TOO_LARGE_ERROR = '413';

/**
 * Read the request body as a stream with a size limit.
 *
 * This function enforces the size limit regardless of:
 * - Whether the content-length header is present
 * - Whether chunked transfer encoding is used
 * - What the content-length header claims
 *
 * If the limit is exceeded, the stream is cancelled and an error is thrown
 * with message '413' that can be detected by route handlers.
 *
 * @param request - The incoming HTTP request
 * @param maxSize - Maximum allowed payload size in bytes
 * @returns The decoded body as a string
 * @throws {Error} With message '413' if payload exceeds maxSize
 * @throws {Error} If request body is null or unreadable
 */
export async function readBodyWithLimit(
  request: Request,
  maxSize: number
): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) {
    throw new Error('No readable stream');
  }

  const chunks: Uint8Array[] = [];
  let totalSize = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      totalSize += value.length;

      if (totalSize > maxSize) {
        // Cancel the stream to stop reading
        await reader.cancel();
        throw new Error(PAYLOAD_TOO_LARGE_ERROR);
      }

      chunks.push(value);
    }
  } catch (e) {
    // Re-throw with our specific error code if size limit exceeded
    if (e instanceof Error && e.message === PAYLOAD_TOO_LARGE_ERROR) {
      throw e;
    }
    // Wrap other errors
    throw new Error(`Failed to read request body: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  // Decode chunks to string
  const decoder = new TextDecoder();
  let result = '';
  for (const chunk of chunks) {
    result += decoder.decode(chunk, { stream: true });
  }
  // Flush any remaining bytes
  result += decoder.decode();

  return result;
}

/**
 * Read the request body as raw bytes with a size limit.
 *
 * This is useful for `multipart/form-data` where decoding to UTF-8 would corrupt
 * binary payloads. It enforces the limit regardless of content-length.
 *
 * @param request - The incoming HTTP request
 * @param maxSize - Maximum allowed payload size in bytes
 * @returns The raw body bytes
 * @throws {Error} With message '413' if payload exceeds maxSize
 * @throws {Error} If request body is null or unreadable
 */
export async function readBodyBytesWithLimit(
  request: Request,
  maxSize: number
): Promise<Uint8Array<ArrayBuffer>> {
  const reader = request.body?.getReader();
  if (!reader) {
    throw new Error('No readable stream');
  }

  const chunks: Uint8Array[] = [];
  let totalSize = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      totalSize += value.length;

      if (totalSize > maxSize) {
        await reader.cancel();
        throw new Error(PAYLOAD_TOO_LARGE_ERROR);
      }

      chunks.push(value);
    }
  } catch (e) {
    if (e instanceof Error && e.message === PAYLOAD_TOO_LARGE_ERROR) {
      throw e;
    }
    throw new Error(`Failed to read request body: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }

  const result = new Uint8Array(totalSize) as Uint8Array<ArrayBuffer>;
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

/**
 * Check if an error represents a payload-too-large condition.
 *
 * @param e - The error to check
 * @returns True if the error indicates payload size exceeded
 */
export function isPayloadTooLargeError(e: unknown): boolean {
  return e instanceof Error && e.message === PAYLOAD_TOO_LARGE_ERROR;
}
