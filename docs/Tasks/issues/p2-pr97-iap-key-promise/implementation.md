# Implementation: P2-PR97 IAP Key Promise Cache - Env Change Detection

## Status: COMPLETED

## Summary
Fixed a subtle bug in `getIapPublicKey()` where if the `IAP_JWT_PUBLIC_KEY` environment variable changed while a promise was cached, the function would continue returning the old promise instead of detecting the change and importing the new key.

## Files Modified

### 1. app/utils/auth.ts
**Location:** Lines 31-73

**Changes:**
1. Added new module-level variable `iapPublicKeyPromisePem` to track the PEM value associated with the cached promise
2. Modified promise deduplication logic to check if the env var matches the promise's PEM before returning the cached promise
3. Updated promise creation to store the PEM value
4. Updated error handling to also clear `iapPublicKeyPromisePem` on failure

**Diff:**
```diff
 let cachedIapPublicKey: KeyLike | null = null;
 let cachedIapPublicKeyPem: string | null = null;
 let iapPublicKeyPromise: Promise<KeyLike | null> | null = null;
+let iapPublicKeyPromisePem: string | null = null;

 async function getIapPublicKey(): Promise<KeyLike | null> {
   // ...
   // If already fetching, return the existing promise to deduplicate concurrent calls
-  if (iapPublicKeyPromise) {
+  // If already fetching for the same PEM, return the existing promise to deduplicate concurrent calls
+  // If PEM changed, discard old promise and start fresh
+  if (iapPublicKeyPromise && iapPublicKeyPromisePem === publicKey) {
     return iapPublicKeyPromise;
   }

   // Create and store the promise for concurrent callers to share
+  // Store the PEM associated with this promise for env change detection
+  iapPublicKeyPromisePem = publicKey;
   iapPublicKeyPromise = (async () => {
     try {
       // ...
     } catch {
       // Reset promise on failure to allow retry on next call
       iapPublicKeyPromise = null;
+      iapPublicKeyPromisePem = null;
       return null;
     }
   })();
```

### 2. test/utils/auth.test.ts
**Location:** Lines 907-995 (in `IAP public key cache race prevention` describe block)

**Changes:**
Added two new test cases:
1. `detects IAP_JWT_PUBLIC_KEY env change and reloads key` - Verifies that when the env var changes to an invalid key, authentication fails (proving the new key is being used)
2. `handles key rotation to a new valid key` - Verifies key rotation works correctly when rotating to a new valid key

## Test Results

### Typecheck
```
$ npx tsc --noEmit
(no errors)
```

### Unit Tests
```
$ bun test test/utils/auth.test.ts

 76 pass
 0 fail
 98 expect() calls
Ran 76 tests across 1 file. [195.00ms]
```

### All Utils Tests
```
$ bun test test/utils/

 160 pass
 0 fail
 176 expect() calls
Ran 160 tests across 4 files. [145.00ms]
```

## Verification
- [x] TypeScript type checking passes
- [x] All existing tests pass
- [x] New tests pass
- [x] No regression in other test files

## Root Cause Analysis
The original code had a race condition where:
1. Initial call creates and caches a promise
2. Key rotation changes `IAP_JWT_PUBLIC_KEY`
3. Next call sees `iapPublicKeyPromise` is not null, returns OLD promise
4. The cache hit check (line 46) is never reached because we return early from the promise check
5. Result: New key is never imported until process restart

## Fix Strategy
Track the PEM value associated with the cached promise (`iapPublicKeyPromisePem`) and check it before returning the cached promise. If the env var changed, the old promise is discarded and a new one is created.
