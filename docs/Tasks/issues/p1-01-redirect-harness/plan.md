# P1-01: Redirect Harness Points to Non-Existent Script

## Plan Status: READY FOR EXECUTION

---

## Executive Summary

The redirect test harness attempts to load `javascript/utils.js` which does not exist. The fix involves:
1. Creating the missing `javascript/utils.js` file with `sanitizeRedirectUrl` and `sanitizeHttpUrl` functions
2. Implementing these functions based on the existing simulation in `redirect_sanitization_steps.ts`
3. The implementation must work in browser context (DOM APIs available)

---

## Approach

### Selected Strategy: Create Runtime Implementation (Option A from research)

**Rationale:**
- The test harness was designed to test actual runtime code
- The `app/utils/html.ts` already has `sanitizeHref` which is similar but returns empty string instead of null
- Creating `javascript/utils.js` preserves the test architecture
- We can reuse logic from both the simulation and `sanitizeHref`

### Key Design Decisions

1. **Location:** Create `javascript/utils.js` at project root (as expected by the harness path `../../../javascript/utils.js`)

2. **Function Signatures:** Match the expected interface:
   - `sanitizeRedirectUrl(url: string | null | undefined): string | null`
   - `sanitizeHttpUrl(url: string | null | undefined): string | null`

3. **Return Values:** Return `null` (not empty string) for invalid inputs, matching test expectations

4. **Security Features:** Include the enhanced security features from the simulation:
   - URL decoding bypass protection (recursive decode)
   - Dangerous scheme detection before anchor parsing
   - Null byte/control character stripping
   - Protocol-relative URL rejection

5. **Browser Context:** Use DOM anchor element for URL parsing (as documented in tests)

---

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `javascript/utils.js` | **CREATE** | Runtime implementation of sanitization functions |
| (none) | (none) | Harness and tests should work without modification |

### Path Verification

From `test/playwright/helpers/redirect-test-harness.html`:
```
../../../javascript/utils.js
```
Resolves to:
```
/Users/m/git/clients/aol/europe-ttp/javascript/utils.js
```

---

## Code Changes

### 1. CREATE: `javascript/utils.js`

Create a new file at `/Users/m/git/clients/aol/europe-ttp/javascript/utils.js`:

```javascript
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
```

---

## Test Cases

### Unit Tests (Existing - should pass after fix)

The existing Playwright tests in `test/playwright/redirect-sanitization.spec.ts` should all pass:

| Test Category | Test Name | Expected Result |
|--------------|-----------|-----------------|
| Basic validation | null input returns null | PASS |
| Basic validation | undefined input returns null | PASS |
| Basic validation | empty string returns null | PASS |
| Basic validation | whitespace-only string returns null | PASS |
| Basic validation | string literal "null" returns null | PASS |
| Root-relative paths | root-relative path is allowed | PASS |
| Root-relative paths | root-relative path with query string | PASS |
| Root-relative paths | root-relative path with fragment | PASS |
| Protocol-relative URLs | protocol-relative URL is rejected | PASS |
| Protocol-relative URLs | protocol-relative with subdomain rejected | PASS |
| Absolute URLs | cross-origin HTTPS URL rejected | PASS |
| Absolute URLs | cross-origin HTTP URL rejected | PASS |
| Dangerous protocols | javascript: URL rejected | PASS |
| Dangerous protocols | data: URL rejected | PASS |
| Dangerous protocols | vbscript: URL rejected | PASS |
| Dangerous protocols | file: URL rejected | PASS |
| Mixed case handling | mixed case javascript: rejected | PASS |
| Mixed case handling | HTTP/HTTPS case-insensitive | PASS |

### Security Gap Tests (Document behavior)

The "GAP" tests in lines 144-196 document actual runtime behavior for edge cases:
- URL-encoded protocol-relative URL
- Double-encoded protocol-relative URL
- URL-encoded javascript:
- Null byte injection
- Tab character in javascript: URL

These tests should now show improved behavior with the new implementation.

---

## Validation Commands

### 1. Verify file creation
```bash
ls -la javascript/utils.js
```

### 2. Verify file path resolution from harness
```bash
# From test/playwright/helpers/
cd test/playwright/helpers && ls ../../../javascript/utils.js
```

### 3. Run Playwright redirect sanitization tests
```bash
npx playwright test test/playwright/redirect-sanitization.spec.ts
```

### 4. Run all Playwright tests
```bash
npm run test:playwright
```

### 5. Verify syntax (no parse errors)
```bash
node --check javascript/utils.js
```

### 6. Manual verification in browser console
```javascript
// After loading the harness in a browser:
console.log(sanitizeRedirectUrl('/safe-path'));      // '/safe-path'
console.log(sanitizeRedirectUrl('//evil.com'));      // null
console.log(sanitizeRedirectUrl('javascript:alert(1)')); // null
console.log(sanitizeRedirectUrl(null));              // null
```

---

## Rollback Strategy

### Quick Rollback
```bash
rm javascript/utils.js
rmdir javascript 2>/dev/null || true
```

### Full Rollback (if issues found)
1. Delete the created file:
   ```bash
   rm -f javascript/utils.js
   ```

2. Remove directory if empty:
   ```bash
   rmdir javascript 2>/dev/null || true
   ```

3. No other files are modified, so rollback is complete

### Backup (optional)
```bash
# Before execution, backup is not needed since this is a new file
# After execution, can backup the working version:
cp javascript/utils.js javascript/utils.js.backup
```

---

## Dependencies and Impact

### Dependencies (None)
- This is a new file with no imports
- Uses only browser DOM APIs (document.createElement, window.location)

### Files That Depend On This
| File | Dependency Type |
|------|-----------------|
| `test/playwright/helpers/redirect-test-harness.html` | Script import |
| `test/playwright/redirect-sanitization.spec.ts` | Test harness loader |

### Impact Analysis
- **Low Risk:** New file creation, no existing code modified
- **Test Coverage:** Existing tests validate the implementation
- **Backward Compatibility:** N/A (file never existed)

---

## Additional Notes

1. **ES5 Syntax:** The implementation uses ES5 syntax (var, function declarations) to maximize browser compatibility since this is a runtime file loaded in test harness.

2. **Global Scope:** Functions are attached to `window` object for access via Playwright's `page.evaluate()`.

3. **Same-Origin Policy:** In `file://` context (Playwright's default), `window.location.host` is empty, so all absolute URLs with a host are rejected. This is expected behavior.

4. **Relationship to app/utils/html.ts:** The `sanitizeHref` function in `app/utils/html.ts` serves a similar purpose but returns empty string instead of null. These are intentionally separate:
   - `javascript/utils.js` - for redirect testing (returns null)
   - `app/utils/html.ts` - for HTML attribute sanitization (returns empty string)

---

## Verification Checklist

- [ ] File created at `javascript/utils.js`
- [ ] File contains `sanitizeRedirectUrl` function
- [ ] File contains `sanitizeHttpUrl` function
- [ ] Functions attached to `window` object
- [ ] No syntax errors (`node --check javascript/utils.js`)
- [ ] Playwright tests pass (`npx playwright test test/playwright/redirect-sanitization.spec.ts`)
- [ ] No regression in other tests (`npm run test:playwright`)
