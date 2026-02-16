# Implementation: P2-PR97-GCS-PACKAGE-ERROR

## Issue
GCS package error detection was incomplete - ESM modules report "Cannot find package" while CommonJS reports "Cannot find module". The signed-url route was not catching the ESM variant.

## Files Modified

### `/Users/m/git/clients/aol/europe-ttp/app/api/upload/signed-url/route.ts`

**Line 241** - Added ESM package error detection:

```typescript
// Before:
if (errorMessage.includes('Cannot find module') || errorMessage.includes('Cannot resolve package')) {

// After:
if (errorMessage.includes('Cannot find module') || errorMessage.includes('Cannot resolve package') || errorMessage.includes('Cannot find package')) {
```

## Changes Applied

1. **Added `errorMessage.includes('Cannot find package')`** to the error detection condition
2. **Added comment** explaining why both checks are needed (ESM vs CommonJS error message differences)

## Test Results

### TypeCheck
```
> npm run typecheck
✓ PASSED - No TypeScript errors
```

### BDD Tests (TypeScript)
```
227 scenarios (227 passed)
1017 steps (1017 passed)
0m00.539s (executing steps: 0m00.372s)
✓ ALL PASSED
```

## Verification

The fix ensures that when the `@google-cloud/storage` package is not installed:
- CommonJS environments report: "Cannot find module '@google-cloud/storage'"
- ESM environments report: "Cannot find package '@google-cloud/storage'"

Both cases now properly return HTTP 501 with `GCS_PACKAGE_NOT_INSTALLED` error code instead of HTTP 500 with `SIGNED_URL_GENERATION_FAILED`.

## Notes

- This is a minimal, targeted fix with no changes to test infrastructure
- The change is backward compatible - existing error paths continue to work
- Production mode error redaction is preserved (detailed errors only in dev/test)
