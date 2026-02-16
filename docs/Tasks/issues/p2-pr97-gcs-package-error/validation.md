# Validation: P2-PR97-GCS-PACKAGE-ERROR

## Original Issue Recap

**Problem:** The signed-url route only checked for "Cannot find module" or "Cannot resolve package" error messages when detecting a missing `@google-cloud/storage` package. However, Node.js ESM import failures use a different error message format: "Cannot find package".

**Impact:** When the GCS package was missing in ESM environments, the error was not properly caught and the API returned HTTP 500 with `SIGNED_URL_GENERATION_FAILED` instead of the correct HTTP 501 with `GCS_PACKAGE_NOT_INSTALLED`.

**Root Cause:** Incomplete error message pattern matching in the catch block of the dynamic import.

## Fix Verification

### Specific Problem Resolved

**Location:** `/Users/m/git/clients/aol/europe-ttp/app/api/upload/signed-url/route.ts` line 242

**Change Applied:**
```typescript
// Before:
if (errorMessage.includes('Cannot find module') || errorMessage.includes('Cannot resolve package')) {

// After:
if (errorMessage.includes('Cannot find module') || errorMessage.includes('Cannot resolve package') || errorMessage.includes('Cannot find package')) {
```

**Verification:**
- [x] The `errorMessage.includes('Cannot find package')` condition is now present
- [x] The comment on line 241 explains why both checks are needed (ESM vs CommonJS)
- [x] Error returns HTTP 501 with `GCS_PACKAGE_NOT_INSTALLED` error code
- [x] Production mode error redaction is preserved (detailed errors only in dev/test)

### Test Results

**TypeScript Compilation:**
```
> npm run typecheck
[check-node-version] OK: Node.js v20.20.0
PASSED - No TypeScript errors
```

**BDD Step Registry Verification:**
```
> npm run bdd:verify
375 steps defined, 0 orphan, 0 dead, 0 ambiguous, 0 overlapping
PASSED
```

**BDD Tests (TypeScript):**
```
> npm run bdd:typescript
227 scenarios (227 passed)
1017 steps (1017 passed)
0m00.542s (executing steps: 0m00.365s)
PASSED
```

**Unit Tests:**
```
> npm run test:unit
Overlap Detection suite - all tests passed
PASSED
```

### Regression Check

**Related Functionality Verified:**
1. **Upload Security Feature** (`specs/features/uploads/upload_security.feature`)
   - 8 scenarios covering authentication, directory traversal, content type validation
   - All scenarios pass (verified via full BDD run)

2. **Photo Upload Feature** (`specs/features/uploads/photo_upload.feature`)
   - 1 scenario for signed URL generation
   - Passes (verified via full BDD run)

3. **Document Upload Feature** (`specs/features/uploads/document_upload.feature`)
   - 1 scenario for signed URL generation
   - Passes (verified via full BDD run)

4. **GCS Mock Cleanup** (`test/typescript/steps/uploads_steps.ts` After hook)
   - Properly clears `__MOCK_GCS_SIGNED_URL__` after each scenario
   - No cross-scenario contamination observed

5. **Rate Limiting** - Unaffected by this change
6. **Error Redaction** - Production mode still redacts detailed errors

**No Regressions Detected:**
- All 227 BDD scenarios pass
- No new test failures
- No type errors introduced
- Step registry remains aligned

## Evidence

### Code Review

**File:** `/Users/m/git/clients/aol/europe-ttp/app/api/upload/signed-url/route.ts`

```typescript
// Lines 236-254 (catch block handling)
} catch (error) {
  // Handle missing package or configuration errors
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';

  // If the package is not found, provide a helpful error
  // Note: ESM can report "Cannot find package" vs CommonJS "Cannot find module"
  if (errorMessage.includes('Cannot find module') || errorMessage.includes('Cannot resolve package') || errorMessage.includes('Cannot find package')) {
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
  // ... rest of error handling
}
```

### Test Execution Log

```
227 scenarios (227 passed)
1017 steps (1017 passed)
0m00.542s (executing steps: 0m00.365s)
[run-typescript] Cucumber completed successfully
```

## Verdict

**PASS**

The fix correctly addresses the issue by adding `errorMessage.includes('Cannot find package')` to the error detection condition. This ensures that both ESM ("Cannot find package") and CommonJS ("Cannot find module") error message formats are properly handled, returning HTTP 501 with `GCS_PACKAGE_NOT_INSTALLED` instead of HTTP 500.

**Summary:**
- Specific problem: RESOLVED
- All tests: PASS (227 scenarios, 1017 steps)
- Regressions: NONE
- Code quality: Clean, well-commented

---

*Validated by: Claude Code Agent 4 (VALIDATE)*
*Date: 2026-02-16*
