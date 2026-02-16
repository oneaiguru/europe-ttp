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
 * Allows only http:, https:, and root-relative paths (starting with / but not //).
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
 * Example:
 * - "https://example.com/report" → "https://example.com/report"
 * - "http://legacy-site.example/report" → "http://legacy-site.example/report"
 * - "/reports.html" → "/reports.html"
 * - "javascript:alert(1)" → ""
 * - "data:text/html,<script>alert(1)</script>" → ""
 * - "//evil.com" → ""
 *
 * @param href - The URL to sanitize
 * @returns Sanitized URL, or empty string if unsafe
 */
export function sanitizeHref(href: string | null | undefined): string {
  if (href === null || href === undefined) {
    return '';
  }
  const trimmed = String(href).trim();
  if (!trimmed) {
    return '';
  }

  // Allow root-relative paths (e.g., "/path") but NOT protocol-relative URLs (e.g., "//evil.com")
  if (trimmed.charAt(0) === '/') {
    if (trimmed.charAt(1) === '/') {
      return ''; // Reject protocol-relative URL
    }
    return trimmed; // Allow root-relative path
  }

  // Use URL constructor for robust parsing
  try {
    const url = new URL(trimmed);
    const protocol = url.protocol.toLowerCase();
    // Allow only http: and https: schemes
    if (protocol === 'http:' || protocol === 'https:') {
      return url.href;
    }
    return ''; // Reject all other schemes (javascript:, data:, vbscript:, file:, etc.)
  } catch {
    // Invalid URL (e.g., "javascript:" without // may not throw, check below)
    const lower = trimmed.toLowerCase();
    // Explicitly check for dangerous schemes
    if (
      lower.startsWith('javascript:') ||
      lower.startsWith('data:') ||
      lower.startsWith('vbscript:') ||
      lower.startsWith('file:')
    ) {
      return '';
    }
    // For other invalid URLs, return empty to be safe
    return '';
  }
}
