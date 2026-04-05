# P2-02: Auth Test Matrix Verification Research

## Verification Status: **CONFIRMED**

The issue is confirmed. Test cases in `test/utils/auth.test.ts` expect `allow_header` behavior for NODE_ENV=staging and unset NODE_ENV scenarios, but the current `getAuthenticatedUser` implementation in `app/utils/auth.ts` now rejects all non-development/test requests unless `AUTH_MODE_PLATFORM_STRICT=true`.

---

## Location

### Implementation (Fail-Closed Logic)
**File:** `/Users/m/git/clients/aol/europe-ttp/app/utils/auth.ts`
**Lines:** 379-393

```typescript
// Security: Fail closed outside development/test unless strict mode is enabled
// This prevents auth bypass in staging, preview, or unset NODE_ENV scenarios
const nodeEnv = process.env.NODE_ENV;
const isDevelopment = nodeEnv === 'development' || nodeEnv === 'test';
const isStrictMode = process.env.AUTH_MODE_PLATFORM_STRICT === 'true';

if (!isDevelopment && !isStrictMode) {
  // Fail closed when not in explicit dev/test environment and strict mode is disabled
  // Non-strict platform mode is ONLY allowed for development/testing
  console.warn(
    'Platform mode requires AUTH_MODE_PLATFORM_STRICT=true outside development. ' +
      'Request rejected for security.'
  );
  return null;
}
```

**Key Logic:**
- `isDevelopment` = `nodeEnv === 'development' || nodeEnv === 'test'`
- If NOT development AND NOT strict mode -> **REJECT** (return null)

### Test Matrix (Inconsistent Expectations)
**File:** `/Users/m/git/clients/aol/europe-ttp/test/utils/auth.test.ts`
**Lines:** 573-719 (test case definitions)

---

## Current State: Inconsistent Test Cases

The following test cases expect `allow_header` behavior but the implementation now **rejects** them:

### 1. Staging Environment Tests (Lines 634-652)

```typescript
// Staging environment tests
{
  nodeEnv: 'staging',
  strictMode: undefined,
  expectedResult: 'allow_header',  // INCORRECT - should be 'reject'
  description: 'staging without strict should allow header',
},
{
  nodeEnv: 'staging',
  strictMode: 'false',
  expectedResult: 'allow_header',  // INCORRECT - should be 'reject'
  description: 'staging with strict=false should allow header',
},
```

### 2. Unset NODE_ENV Tests (Lines 654-672)

```typescript
// Unset NODE_ENV tests
{
  nodeEnv: undefined,
  strictMode: undefined,
  expectedResult: 'allow_header',  // INCORRECT - should be 'reject'
  description: 'unset NODE_ENV without strict should allow header',
},
{
  nodeEnv: undefined,
  strictMode: 'false',
  expectedResult: 'allow_header',  // INCORRECT - should be 'reject'
  description: 'unset NODE_ENV with strict=false should allow header',
},
```

### 3. Case Sensitivity Tests (Lines 675-692)

```typescript
// Case sensitivity tests (NODE_ENV is case-sensitive)
{
  nodeEnv: 'Production',
  strictMode: undefined,
  expectedResult: 'allow_header',  // INCORRECT - should be 'reject'
  description: 'Production (capitalized) without strict should allow header (case-sensitive)',
},
{
  nodeEnv: 'PRODUCTION',
  strictMode: undefined,
  expectedResult: 'allow_header',  // INCORRECT - should be 'reject'
  description: 'PRODUCTION (uppercase) without strict should allow header (case-sensitive)',
},
```

---

## Expected Values (Aligned with Fail-Closed Logic)

The test matrix should be updated to match the security-hardened implementation:

| NODE_ENV | AUTH_MODE_PLATFORM_STRICT | Current Test Expectation | **Corrected Expectation** |
|----------|---------------------------|--------------------------|---------------------------|
| `staging` | undefined | `allow_header` | **`reject`** |
| `staging` | `false` | `allow_header` | **`reject`** |
| `staging` | `true` | `requires_iap` | `requires_iap` (correct) |
| undefined | undefined | `allow_header` | **`reject`** |
| undefined | `false` | `allow_header` | **`reject`** |
| undefined | `true` | `requires_iap` | `requires_iap` (correct) |
| `Production` | undefined | `allow_header` | **`reject`** |
| `PRODUCTION` | undefined | `allow_header` | **`reject`** |
| `Production` | `true` | `requires_iap` | `requires_iap` (correct) |

### Logic Explanation

The implementation uses:
```typescript
const isDevelopment = nodeEnv === 'development' || nodeEnv === 'test';
```

This means:
- Only `'development'` and `'test'` (exact lowercase match) are treated as development environments
- All other values (including `undefined`, `'staging'`, `'Production'`, `'PRODUCTION'`) are treated as non-development
- Non-development + no strict mode = **REJECT**

---

## Test Cases Already Correct

The following test cases are already aligned with the implementation:

| NODE_ENV | AUTH_MODE_PLATFORM_STRICT | Expected | Status |
|----------|---------------------------|----------|--------|
| `production` | undefined | `reject` | Correct |
| `production` | `false` | `reject` | Correct |
| `production` | `true` | `requires_iap` | Correct |
| `development` | undefined | `allow_header` | Correct |
| `development` | `false` | `allow_header` | Correct |
| `development` | `true` | `requires_iap` | Correct |
| `test` | undefined | `allow_header` | Correct |
| `test` | `false` | `allow_header` | Correct |
| `test` | `true` | `requires_iap` | Correct |

---

## Risk Assessment

### Severity: **Medium**

- **Security Impact:** Tests currently pass despite expecting incorrect behavior because the test runner's NODE_ENV is likely set to 'test', making the staging/unset tests inadvertently pass. This masks the inconsistency.
- **Production Risk:** If tests were run with NODE_ENV unset or set to 'staging', they would fail, revealing the mismatch.
- **Documentation Risk:** Test descriptions claim insecure behavior is expected, which could confuse future developers.

### Why Tests Currently Pass

The test file is likely executed with `NODE_ENV=test`, which means:
1. Tests that set `nodeEnv: 'staging'` temporarily change NODE_ENV
2. But the `setupPlatformEnv` function correctly manages NODE_ENV
3. The issue is that the **expected results** in the test matrix are wrong

When these specific test cases run:
- They set NODE_ENV to 'staging' or undefined
- They expect `allow_header` (user should be returned)
- But the implementation returns `null` (reject)
- **The tests would fail** if run correctly

---

## Recommended Approach

### Option A: Update Test Expectations (Recommended)

Align the test matrix with the security-hardened implementation by changing `expectedResult` from `allow_header` to `reject` for the 7 affected test cases.

**Rationale:**
- The fail-closed logic is correct and intentional
- Staging and unset NODE_ENV environments should not allow header-based auth bypass
- This prevents security misconfiguration in non-production deployments

### Option B: Update Implementation (Not Recommended)

Relax the implementation to allow `allow_header` for staging and unset NODE_ENV.

**Rationale against:**
- Would re-introduce the security vulnerability
- Defeats the purpose of the fail-closed fix
- Inconsistent with security best practices

---

## Summary

| Item | Value |
|------|-------|
| Verification Status | **CONFIRMED** |
| Affected Test Cases | 7 (staging, unset, and case variations) |
| Files to Update | `test/utils/auth.test.ts` lines 634-692 |
| Change Required | Change `expectedResult: 'allow_header'` to `expectedResult: 'reject'` |
| Security Impact | Tests mask inconsistency, implementation is correct |
| Recommended Action | Update test expectations to match implementation |
