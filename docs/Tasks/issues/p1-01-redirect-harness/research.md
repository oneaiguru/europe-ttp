# P1-01: Redirect Harness Points to Non-Existent Script

## Verification Status: **CONFIRMED**

---

## Issue Summary

The redirect test harness at `test/playwright/helpers/redirect-test-harness.html` attempts to load `../../../javascript/utils.js`, but:
1. The `javascript/` directory **does not exist** at the project root
2. No `utils.js` or `utils.ts` file containing `sanitizeRedirectUrl` or `sanitizeHttpUrl` exists in the source code
3. The test will fail because the script cannot be loaded and the functions are undefined

---

## Exact File Paths and Line Numbers

### Problematic File
**File:** `/Users/m/git/clients/aol/europe-ttp/test/playwright/helpers/redirect-test-harness.html`

**Lines 18-23:**
```html
<script src="../../../javascript/utils.js"></script>
<script>
  // Expose the runtime function for Playwright evaluation
  window.__testSanitizeRedirectUrl = sanitizeRedirectUrl;
  window.__testSanitizeHttpUrl = sanitizeHttpUrl;
</script>
```

### Test File That Uses the Harness
**File:** `/Users/m/git/clients/aol/europe-ttp/test/playwright/redirect-sanitization.spec.ts`

**Lines 8 and 34-37:**
```typescript
const HARNESS_PATH = path.resolve(__dirname, 'helpers/redirect-test-harness.html');

test.describe('Redirect Sanitization - Runtime Implementation', () => {
  test.beforeEach(async ({ page }) => {
    // Load the test harness which exposes sanitizeRedirectUrl
    await page.goto(`file://${HARNESS_PATH}`);
  });
```

### Related Simulation (Not Runtime)
**File:** `/Users/m/git/clients/aol/europe-ttp/test/typescript/steps/redirect_sanitization_steps.ts`

**Lines 108-168:** Contains `simulateSanitizeRedirectUrl()` function
- This is a **simulation** used for BDD tests, NOT the actual runtime code
- Explicitly documented in the comments (lines 34-38):
  ```typescript
  // IMPORTANT: This tests a SIMULATED implementation, not the actual runtime.
  // The simulation in simulateSanitizeRedirectUrl() has enhanced security features
  // that may not exist in the runtime javascript/utils.js.
  ```

---

## Current State Analysis

### What Exists
| Location | Content | Notes |
|----------|---------|-------|
| `test/playwright/helpers/redirect-test-harness.html` | HTML harness | References non-existent script |
| `test/playwright/redirect-sanitization.spec.ts` | Playwright test spec | Loads harness via `file://` URL |
| `test/typescript/steps/redirect_sanitization_steps.ts` | Simulated implementation | Used for BDD, not runtime |

### What Does NOT Exist
| Expected Path | Status |
|---------------|--------|
| `javascript/utils.js` | **MISSING** |
| `javascript/` directory | **MISSING** |
| `app/utils/sanitize.ts` or similar | **MISSING** |

### Path Resolution
From `test/playwright/helpers/redirect-test-harness.html`, the path `../../../javascript/utils.js` resolves to:
```
/Users/m/git/clients/aol/europe-ttp/javascript/utils.js
```
This path does not exist.

---

## Root Cause Analysis

The test harness was designed to test the **actual runtime implementation** of `sanitizeRedirectUrl` and `sanitizeHttpUrl`, but:

1. **The runtime implementation was never committed** - The `javascript/utils.js` file does not exist in the repository
2. **Only a simulation exists** - The BDD tests use a simulated version in `redirect_sanitization_steps.ts`
3. **Comment acknowledges this** - Line 12 of the harness says "loads the actual runtime javascript/utils.js" but this file never existed

The comment in `redirect-sanitization.spec.ts` (lines 24-31) explicitly documents this gap:
```typescript
* NOTE: The existing BDD tests in specs/features/security/redirect_sanitization.feature
* use a SIMULATED implementation that has additional security features not present
* in the runtime. This file tests the actual runtime behavior.
*
* GAP ANALYSIS: Compare results between BDD (simulated) and Playwright (runtime) tests
* to identify security gaps in the implementation.
```

---

## Dependencies and Related Files

### Direct Dependencies
1. `test/playwright/redirect-sanitization.spec.ts` - Test spec that requires the harness
2. `test/playwright/helpers/redirect-test-harness.html` - Harness that loads the missing script

### Indirect Dependencies
1. `test/typescript/steps/redirect_sanitization_steps.ts` - Contains simulation logic
2. `specs/features/security/redirect_sanitization.feature` - BDD feature file (if exists)

### Required Functions
The harness expects these global functions from `javascript/utils.js`:
- `sanitizeRedirectUrl(url: string | null | undefined): string | null`
- `sanitizeHttpUrl(url: string | null | undefined): string | null`

---

## Risk Assessment: **HIGH**

| Factor | Assessment | Reasoning |
|--------|------------|-----------|
| Test Execution | **FAILING** | Tests will fail immediately with ReferenceError |
| Security Coverage | **GAP** | Runtime sanitization is not being tested |
| CI/CD Impact | **HIGH** | Playwright tests will fail in CI |
| Fix Complexity | **MEDIUM** | Requires creating runtime implementation OR rewriting tests |

---

## Recommended Approach for Next Agent

### Option A: Create Runtime Implementation (Recommended)
1. Create `javascript/utils.js` (or `app/utils/sanitize.ts` for TypeScript)
2. Implement `sanitizeRedirectUrl` and `sanitizeHttpUrl` based on the simulation
3. Ensure the implementation works in browser context (DOM APIs required)
4. Update harness path if using TypeScript/Next.js location

### Option B: Rewrite Tests to Use Simulation
1. Convert `redirect-sanitization.spec.ts` to use `simulateSanitizeRedirectUrl` directly
2. Remove the HTML harness dependency
3. Accept that these are simulation tests, not runtime tests

### Option C: Create Hybrid Approach
1. Create a test utilities file that exports the functions
2. Use Playwright's `page.evaluate()` with inline implementation
3. This allows testing the logic without requiring a separate file

---

## Additional Notes

1. **The simulation has more features than expected runtime:**
   - URL decoding bypass protection
   - Dangerous scheme detection before anchor parsing
   - Null byte/control character stripping

2. **Security Gap Documentation:** The spec file (lines 144-196) contains tests marked as "GAP" tests that document where runtime would fall short of the simulation's security model.

3. **Context Note:** This appears to be a TypeScript migration project (branch `ts-migration-review-final`), so the original JavaScript implementation may have been lost during migration.

---

## Evidence

```bash
# Verify javascript directory does not exist
$ ls -la /Users/m/git/clients/aol/europe-ttp/javascript/
ls: cannot access '.../javascript/': No such file or directory

# Search for sanitizeRedirectUrl implementation
$ grep -r "function sanitizeRedirectUrl" --include="*.ts" --include="*.js"
(no results in source files, only in trace logs)

# Search for sanitizeHttpUrl implementation
$ grep -r "function sanitizeHttpUrl" --include="*.ts" --include="*.js"
(no results)
```

---

## Files to Modify (for fix agent)

1. **CREATE:** `javascript/utils.js` OR `app/utils/sanitize.ts`
2. **UPDATE:** `test/playwright/helpers/redirect-test-harness.html` (path may need adjustment)
3. **VERIFY:** `test/playwright/redirect-sanitization.spec.ts` (should work after fix)
