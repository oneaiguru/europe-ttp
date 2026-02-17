/**
 * HTML escape utilities for preventing XSS when rendering user-controlled content.
 * Based on OWASP recommendations and the legacy pattern in javascript/utils.js.
 */

/**
 * Escape HTML text content (interpolated outside tags/attributes).
 * Converts: < > & → &lt; &gt; &amp;
 *
 * Example: "<script>" → "&lt;script&gt;"
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Escape HTML attribute values (interpolated inside double-quoted attributes).
 * Converts: < > & " ' → &lt; &gt; &amp; &quot; &#x27;
 *
 * Example: '" onclick="alert(1)' → '&quot; onclick=&#x27;alert(1)&#x27;'
 */
export function escapeHtmlAttr(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Sanitize URL href values to prevent XSS via dangerous URI schemes.
 * Allows only http:, https:, and relative paths (root-relative or plain relative).
 * Rejects javascript:, data:, vbscript:, file:, and other unsafe schemes.
 *
 * ## Security Policy: HTTP URLs Allowed
 * This function allows http:// URLs (not just https://) for backward compatibility
 * with existing data that may contain legacy or intranet URLs. HTTP URLs to external
 * resources are permitted because:
 * 1. External resources (partner sites, intranets) may only be available via HTTP
 * 2. HSTS at the deployment level should enforce HTTPS upgrades where applicable
 * 3. This is a data-level concern, not a code-level concern
 *
 * **Recommendation**: Deploy with HSTS enabled to enforce HTTPS at the browser level.
 *
 * ## Security Policy: Relative URLs Allowed
 * This function allows plain relative URLs (e.g., "report.html") and root-relative
 * paths (e.g., "/admin/report.html") for internal application navigation. This is
 * safe because:
 * 1. Relative URLs cannot contain protocol schemes (no javascript:, data:, etc.)
 * 2. They are resolved relative to the current page origin
 * 3. Protocol-relative URLs (//evil.com) are explicitly blocked
 *
 * Example:
 * - "https://example.com/report" → "https://example.com/report"
 * - "http://legacy-site.example/report" → "http://legacy-site.example/report"
 * - "/reports.html" → "/reports.html"
 * - "ttc_applicants_reports.html" → "/ttc_applicants_reports.html"
 * - "javascript:alert(1)" → ""
 * - "data:text/html,<script>alert(1)</script>" → ""
 * - "//evil.com" → ""
 *
 * @param href - The URL to sanitize
 * @returns Sanitized URL (relative paths are normalized to root-relative), or empty string if unsafe
 */
export function sanitizeHref(href: string | null | undefined): string {
  if (href === null || href === undefined) {
    return '';
  }
  const trimmed = String(href).trim();
  if (!trimmed) {
    return '';
  }

  // Check for dangerous schemes first (before any URL parsing)
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return '';
  }

  // Allow root-relative paths (e.g., "/path") but NOT protocol-relative URLs (e.g., "//evil.com")
  // Also reject backslash-based bypasses (e.g., "/\evil.com" or "\\evil.com")
  // Browsers normalize backslashes as path separators, treating these as network-path references
  if (trimmed.charAt(0) === '/' || trimmed.charAt(0) === '\\') {
    if (trimmed.charAt(1) === '/' || trimmed.charAt(1) === '\\') {
      return ''; // Reject protocol-relative URL or backslash bypass
    }
    // Normalize leading backslash to forward slash for root-relative URLs
    return trimmed.charAt(0) === '\\' ? '/' + trimmed.slice(1) : trimmed;
  }

  // Use URL constructor to check for absolute URLs with protocols
  try {
    const url = new URL(trimmed);
    const protocol = url.protocol.toLowerCase();
    // Allow only http: and https: schemes
    if (protocol === 'http:' || protocol === 'https:') {
      return url.href;
    }
    return ''; // Reject all other schemes
  } catch {
    // Not an absolute URL with a protocol - treat as a relative path
    // Normalize to root-relative by prepending "/" for consistent handling
    // This is safe because we've already checked for dangerous schemes above
    return '/' + trimmed;
  }
}
