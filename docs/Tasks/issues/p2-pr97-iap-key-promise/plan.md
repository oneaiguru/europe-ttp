# Plan: P2-PR97 IAP Key Promise Cache - Env Change Detection

## Issue Summary
The `getIapPublicKey()` function has a subtle bug where if the `IAP_JWT_PUBLIC_KEY` environment variable changes while a promise is cached, the function will continue returning the old promise/key instead of detecting the change and importing the new key.

## Current Behavior
```typescript
// Line 50: Deduplication for concurrent calls
if (iapPublicKeyPromise) {
  return iapPublicKeyPromise;  // Returns cached promise without checking env change
}
```

## Problem Scenario
1. Initial call: Promise created and cached
2. Key rotation: IAP_JWT_PUBLIC_KEY changes
3. Next call: `iapPublicKeyPromise` is not null, so returns OLD promise
4. The cache hit check (line 45) is NEVER reached because we return early
5. Result: New key is never imported until process restart

## Fix
Track the PEM value when creating the promise and check it before returning the cached promise.

## Changes Required

### File: app/utils/auth.ts
1. Add module-level variable to track the PEM associated with the promise:
   - `let iapPublicKeyPromisePem: string | null = null;`

2. Modify promise deduplication logic:
   - Check if env var matches the promise's PEM before returning cached promise
   - If env var changed, clear the old promise and create a new one

### File: test/utils/auth.test.ts
Add test case to verify key rotation detection works correctly.

## Implementation Steps
1. Add `iapPublicKeyPromisePem` variable
2. Update `getIapPublicKey()` to:
   - Store the PEM when creating the promise
   - Check PEM match before returning cached promise
   - Clear old promise if PEM changed
3. Add test for env change detection
4. Run typecheck and tests
