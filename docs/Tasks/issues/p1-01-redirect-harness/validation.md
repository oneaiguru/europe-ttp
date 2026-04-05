# P1-01: Redirect Harness Points to Non-Existent Script

## Validation Report

---

## Original Issue Recap

The redirect test harness at `test/playwright/helpers/redirect-test-harness.html` attempted to load `../../../javascript/utils.js`, but the file and directory did not exist, causing all Playwright redirect sanitization tests to fail with `ReferenceError: sanitizeRedirectUrl is not defined`.

### Root Cause
- The `javascript/` directory and `utils.js` file were never committed to the repository
- Only a simulation existed in `test/typescript/steps/redirect_sanitization_steps.ts` for BDD tests
- The Playwright tests were designed to test actual runtime code that never existed

### Expected Functions
The harness required these global functions:
- `sanitizeRedirectUrl(url: string | null | undefined): string | null`
- `sanitizeHttpUrl(url: string | null | undefined): string | null`

---

## Fix Verification Checklist

| Check | Status | Notes |
|-------|--------|-------|
| 1. File `javascript/utils.js` exists | **YES** | Created at project root |
| 2. File contains `sanitizeRedirectUrl` function | **YES** | Lines 77-147 |
| 3. File contains `sanitizeHttpUrl` function | **YES** | Lines 159-199 |
| 4. Functions attached to `window` object | **YES** | Lines 203-204 |
| 5. Path resolution from harness works | **YES** | `../../../javascript/utils.js` resolves correctly |
| 6. No JavaScript syntax errors | **YES** | `node --check` passes |
| 7. TypeScript typecheck passes | **YES** | `npm run typecheck` passes |
| 8. Playwright redirect tests pass | **YES** | All 23 tests pass |
| 9. No regressions in other tests | **YES** | Only unrelated pre-existing failures |

---

## Evidence

### 1. File Existence
```bash
$ ls -la /Users/m/git/clients/aol/europe-ttp/javascript/utils.js
-rw-r--r--  1 m  staff  6125 17 Feb 12:46 /Users/m/git/clients/aol/europe-ttp/javascript/utils.js
```

### 2. Path Resolution from Harness
```bash
$ cd test/playwright/helpers && ls ../../../javascript/utils.js
../../../javascript/utils.js
```

### 3. Syntax Check
```bash
$ node --check javascript/utils.js
(no output - no errors)
```

### 4. TypeScript Type Check
```bash
$ npm run typecheck
> europe-ttp-migration@0.1.0 pretypecheck
> node scripts/check-node-version.mjs
[check-node-version] OK: Node.js v20.20.0

> europe-ttp-migration@0.1.0 typecheck
> tsc --noEmit
(no errors)
```

### 5. Playwright Redirect Sanitization Tests
```
$ npx playwright test test/playwright/redirect-sanitization.spec.ts --reporter=list

Running 23 tests using 1 worker

  ✓   1 test/playwright/redirect-sanitization.spec.ts:49:5 › Redirect Sanitization - Runtime Implementation › Basic validation › null input returns null (188ms)
  ✓   2 test/playwright/redirect-sanitization.spec.ts:54:5 › Redirect Sanitization - Runtime Implementation › Basic validation › undefined input returns null (56ms)
  ✓   3 test/playwright/redirect-sanitization.spec.ts:59:5 › Redirect Sanitization - Runtime Implementation › Basic validation › empty string returns null (78ms)
  ✓   4 test/playwright/redirect-sanitization.spec.ts:64:5 › Redirect Sanitization - Runtime Implementation › Basic validation › whitespace-only string returns null (45ms)
  ✓   5 test/playwright/redirect-sanitization.spec.ts:69:5 › Redirect Sanitization - Runtime Implementation › Basic validation › string literal "null" returns null (45ms)
  ✓   6 test/playwright/redirect-sanitization.spec.ts:76:5 › Redirect Sanitization - Runtime Implementation › Root-relative paths › root-relative path is allowed (44ms)
  ✓   7 test/playwright/redirect-sanitization.spec.ts:81:5 › Redirect Sanitization - Runtime Implementation › Root-relative paths › root-relative path with query string is allowed (43ms)
  ✓   8 test/playwright/redirect-sanitization.spec.ts:86:5 › Redirect Sanitization - Runtime Implementation › Root-relative paths › root-relative path with fragment is allowed (44ms)
  ✓   9 test/playwright/redirect-sanitization.spec.ts:93:5 › Redirect Sanitization - Runtime Implementation › Protocol-relative URLs › protocol-relative URL is rejected (56ms)
  ✓  10 test/playwright/redirect-sanitization.spec.ts:98:5 › Redirect Sanitization - Runtime Implementation › Protocol-relative URLs › protocol-relative URL with subdomain is rejected (44ms)
  ✓  11 test/playwright/redirect-sanitization.spec.ts:109:5 › Redirect Sanitization - Runtime Implementation › Absolute URLs › cross-origin HTTPS URL is rejected (59ms)
  ✓  12 test/playwright/redirect-sanitization.spec.ts:115:5 › Redirect Sanitization - Runtime Implementation › Absolute URLs › cross-origin HTTP URL is rejected (42ms)
  ✓  13 test/playwright/redirect-sanitization.spec.ts:122:5 › Redirect Sanitization - Runtime Implementation › Dangerous protocols › javascript: URL is rejected (41ms)
  ✓  14 test/playwright/redirect-sanitization.spec.ts:128:5 › Redirect Sanitization - Runtime Implementation › Dangerous protocols › data: URL is rejected (42ms)
  ✓  15 test/playwright/redirect-sanitization.spec.ts:133:5 › Redirect Sanitization - Runtime Implementation › Dangerous protocols › vbscript: URL is rejected (45ms)
  ✓  16 test/playwright/redirect-sanitization.spec.ts:138:5 › Redirect Sanitization - Runtime Implementation › Dangerous protocols › file: URL is rejected (41ms)
  ✓  17 test/playwright/redirect-sanitization.spec.ts:157:5 › Redirect Sanitization - Runtime Implementation › Security gaps (tests expected to FAIL against runtime) › GAP: URL-encoded protocol-relative URL may bypass runtime (43ms)
  ✓  18 test/playwright/redirect-sanitization.spec.ts:170:5 › Redirect Sanitization - Runtime Implementation › Security gaps (tests expected to FAIL against runtime) › GAP: Double-encoded protocol-relative URL may bypass runtime (122ms)
  ✓  19 test/playwright/redirect-sanitization.spec.ts:176:5 › Redirect Sanitization - Runtime Implementation › Security gaps (tests expected to FAIL against runtime) › GAP: URL-encoded javascript: may bypass runtime (54ms)
  ✓  20 test/playwright/redirect-sanitization.spec.ts:183:5 › Redirect Sanitization - Runtime Implementation › Security gaps (tests expected to FAIL against runtime) › GAP: Null byte injection may not be stripped (41ms)
  ✓  21 test/playwright/redirect-sanitization.spec.ts:190:5 › Redirect Sanitization - Runtime Implementation › Security gaps (tests expected to FAIL against runtime) › GAP: Tab character in javascript: URL (41ms)
  ✓  22 test/playwright/redirect-sanitization.spec.ts:199:5 › Redirect Sanitization - Runtime Implementation › Mixed case handling › mixed case javascript: URL is rejected (42ms)
  ✓  23 test/playwright/redirect-sanitization.spec.ts:205:5 › Redirect Sanitization - Runtime Implementation › Mixed case handling › HTTP and HTTPS protocols are handled case-insensitively (52ms)

  23 passed (5.3s)
```

### 6. Code Snippets from Implementation

**File:** `/Users/m/git/clients/aol/europe-ttp/javascript/utils.js`

Key functions implemented:

```javascript
// Main sanitization function for redirect URLs (lines 77-147)
function sanitizeRedirectUrl(redirectUrl) {
  // Handle null, undefined, and non-string inputs
  if (redirectUrl === undefined || redirectUrl === null) {
    return null;
  }
  // ... security checks ...
}

// Simpler URL validation for HTTP contexts (lines 159-199)
function sanitizeHttpUrl(url) {
  // Handle null, undefined, and non-string inputs
  if (url === undefined || url === null) {
    return null;
  }
  // ... validation ...
}

// Global exports for test harness (lines 203-204)
window.sanitizeRedirectUrl = sanitizeRedirectUrl;
window.sanitizeHttpUrl = sanitizeHttpUrl;
```

**Security features implemented:**
- Recursive URL decoding (up to 5 iterations) to prevent encoding bypasses
- Dangerous scheme detection (javascript:, vbscript:, data:, file:, blob:, about:)
- Null byte and control character stripping
- Protocol-relative URL rejection (//evil.com)
- Root-relative path support (/safe/path)
- Same-origin validation for absolute URLs

---

## Regression Analysis

### Other Playwright Tests
The `ui_parity.spec.ts` tests fail, but this is a **pre-existing issue** unrelated to P1-01:

- Missing manifest files:
  - `docs/ui/legacy/manifest.json`
  - `docs/ui/new/manifest.json`
  - `docs/ui/parity-mapping.json`

These files were never created, so the ui_parity tests have always failed since they require configuration data that doesn't exist.

### Git Status
```
?? javascript/
```
The `javascript/` directory is the only new addition related to P1-01. No existing files were modified.

---

## Verdict: **PASS**

### Summary
The fix has been successfully implemented and validated:

1. **File Created:** `javascript/utils.js` exists at the correct location
2. **Functions Implemented:** Both `sanitizeRedirectUrl` and `sanitizeHttpUrl` are properly implemented
3. **Security Features:** All documented security features are present:
   - Recursive URL decoding
   - Dangerous scheme detection
   - Null byte/control character stripping
   - Protocol-relative URL rejection
   - Same-origin validation
4. **Tests Pass:** All 23 Playwright redirect sanitization tests pass
5. **No Regressions:** No existing functionality was broken
6. **Bonus:** The GAP tests now also pass (tests that were expected to fail now pass because the implementation includes the enhanced security features)

### Unexpected Bonus
The implementation went beyond the minimum requirements. The "GAP" tests (tests 17-21) were documented as "expected to FAIL against runtime" in the original test file, but they all pass with the new implementation. This indicates the implementation is **more secure** than originally anticipated, as it handles:
- URL-encoded protocol-relative URLs
- Double-encoded protocol-relative URLs
- URL-encoded javascript: URLs
- Null byte injection
- Tab character injection

---

## Remaining Concerns

### 1. Documentation Update (Minor)
The test file `redirect-sanitization.spec.ts` contains comments (lines 24-31) that describe a "GAP" between simulation and runtime behavior. These comments may need updating since the new implementation closes those gaps.

### 2. TypeScript Version (Future Consideration)
The implementation uses ES5 syntax for maximum browser compatibility. A future enhancement could be to:
- Create a TypeScript version at `app/utils/sanitize.ts`
- Use build tools to generate the browser-compatible JavaScript
- This would allow sharing code between server-side and client-side

### 3. Integration with App (Out of Scope)
This implementation is specifically for the test harness. The actual application may need its own sanitization implementation in the Next.js app directory. This is outside the scope of P1-01.

---

## Validation Complete

**Date:** 2026-02-17
**Validator:** Claude Agent (VALIDATE phase)
**Status:** PASS
