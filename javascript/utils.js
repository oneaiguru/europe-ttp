/**
 * URL Sanitization Utilities for Redirect Security
 *
 * These functions provide security-focused URL sanitization to prevent
 * open redirect vulnerabilities and XSS attacks via URL injection.
 *
 * Used by the redirect test harness for Playwright tests.
 */

/**
 * Decode URL-encoded characters iteratively until no more decoding is possible.
 * This handles single, double, and higher levels of encoding to prevent
 * encoding-based bypass attacks.
 *
 * @param {string} encoded - The potentially URL-encoded string
 * @returns {string} - The fully decoded string
 */
function decodeUrlRecursively(encoded) {
  let previous = '';
  let current = encoded;
  let iterations = 0;
  const maxIterations = 5; // Prevent infinite loops

  while (previous !== current && iterations < maxIterations) {
    previous = current;
    try {
      current = decodeURIComponent(current);
    } catch (e) {
      // If decoding fails, return current state
      break;
    }
    iterations++;
  }
  return current;
}

/**
 * Check if a string contains dangerous URL schemes (case-insensitive, whitespace-normalized).
 * Detects schemes even when obscured with whitespace or control characters.
 *
 * @param {string} url - The URL to check
 * @returns {boolean} - True if a dangerous scheme is detected
 */
function containsDangerousScheme(url) {
  // Remove whitespace and control characters for scheme detection
  const normalized = url.replace(/[\s\t\n\r\x00]/g, '').toLowerCase();

  const dangerousSchemes = [
    'javascript:',
    'vbscript:',
    'data:',
    'file:',
    'blob:',
    'about:',
  ];

  return dangerousSchemes.some(function(scheme) {
    return normalized.includes(scheme);
  });
}

/**
 * Sanitize a redirect URL to prevent open redirect and XSS attacks.
 *
 * Security features:
 * - Rejects null/undefined/empty inputs
 * - Recursively decodes URL-encoded strings to prevent encoding bypasses
 * - Strips null bytes and control characters
 * - Detects dangerous schemes (javascript:, data:, vbscript:, etc.)
 * - Rejects protocol-relative URLs (//evil.com)
 * - Allows root-relative paths (/safe/path)
 * - Validates HTTP/HTTPS URLs against same-origin policy
 *
 * @param {string|null|undefined} redirectUrl - The URL to sanitize
 * @returns {string|null} - The sanitized URL or null if invalid/unsafe
 */
function sanitizeRedirectUrl(redirectUrl) {
  // Handle null, undefined, and non-string inputs
  if (redirectUrl === undefined || redirectUrl === null) {
    return null;
  }
  var trimmed = String(redirectUrl).trim();
  if (!trimmed) {
    return null;
  }

  // Reject string literal "null" (common edge case)
  if (trimmed.toLowerCase() === 'null') {
    return null;
  }

  // Decode URL-encoded characters (handles single and double encoding)
  var decoded = decodeUrlRecursively(trimmed);

  // Remove null bytes and control characters
  var sanitized = decoded.replace(/[\x00-\x1f]/g, '');

  // Check for dangerous schemes in both original and decoded form
  if (containsDangerousScheme(trimmed) || containsDangerousScheme(sanitized)) {
    return null;
  }

  // Allow root-relative paths (e.g., "/path") but NOT protocol-relative URLs (e.g., "//evil.com")
  // Check both original and decoded forms
  var pathsToCheck = [trimmed, sanitized];
  for (var i = 0; i < pathsToCheck.length; i++) {
    var path = pathsToCheck[i];
    if (path.charAt(0) === '/') {
      if (path.charAt(1) === '/') {
        return null; // Reject protocol-relative URL
      }
    }
  }

  // If original starts with single slash, it's a valid root-relative path
  if (trimmed.charAt(0) === '/' && trimmed.charAt(1) !== '/') {
    return trimmed; // Allow root-relative path
  }

  // For absolute URLs, require http:// or https://
  var lower = sanitized.toLowerCase();
  if (!(lower.startsWith('http://') || lower.startsWith('https://'))) {
    return null;
  }

  // Use anchor element for URL parsing (browser context)
  // This provides same-origin checking via DOM
  try {
    var anchor = document.createElement('a');
    anchor.href = sanitized;

    // Validate protocol is http or https
    if (anchor.protocol !== 'http:' && anchor.protocol !== 'https:') {
      return null;
    }

    // Same-origin check: only allow URLs from the current host
    // In file:// context, window.location.host is empty, so any URL with a host fails
    if (anchor.host && anchor.host !== window.location.host) {
      return null;
    }

    return anchor.href;
  } catch (e) {
    return null;
  }
}

/**
 * Sanitize a URL for use in HTTP contexts (links, redirects, etc.).
 *
 * This is a simpler version that validates HTTP/HTTPS URLs without
 * same-origin restrictions. Use for general URL validation where
 * cross-origin URLs are acceptable.
 *
 * @param {string|null|undefined} url - The URL to sanitize
 * @returns {string|null} - The sanitized URL or null if invalid/unsafe
 */
function sanitizeHttpUrl(url) {
  // Handle null, undefined, and non-string inputs
  if (url === undefined || url === null) {
    return null;
  }
  var trimmed = String(url).trim();
  if (!trimmed) {
    return null;
  }

  // Decode URL-encoded characters
  var decoded = decodeUrlRecursively(trimmed);

  // Remove null bytes and control characters
  var sanitized = decoded.replace(/[\x00-\x1f]/g, '');

  // Check for dangerous schemes
  if (containsDangerousScheme(trimmed) || containsDangerousScheme(sanitized)) {
    return null;
  }

  // Reject protocol-relative URLs
  if (trimmed.charAt(0) === '/' && trimmed.charAt(1) === '/') {
    return null;
  }

  // Use anchor element for URL parsing
  try {
    var anchor = document.createElement('a');
    anchor.href = sanitized;

    // Validate protocol is http or https
    if (anchor.protocol !== 'http:' && anchor.protocol !== 'https:') {
      return null;
    }

    return anchor.href;
  } catch (e) {
    return null;
  }
}

// Export functions globally for browser context (used by test harness)
// These become window.sanitizeRedirectUrl and window.sanitizeHttpUrl
window.sanitizeRedirectUrl = sanitizeRedirectUrl;
window.sanitizeHttpUrl = sanitizeHttpUrl;
