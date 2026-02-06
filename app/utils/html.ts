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
