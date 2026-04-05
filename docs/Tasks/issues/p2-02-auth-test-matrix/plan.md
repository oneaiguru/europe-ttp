# P2-02: Auth Test Matrix Alignment - Implementation Plan

## Overview

Align test expectations in `test/utils/auth.test.ts` with the fail-closed authentication logic in `app/utils/auth.ts`.

**Issue:** 7 test cases expect `allow_header` behavior for non-development environments, but the implementation now rejects these scenarios (fail-closed security model).

---

## Approach

Update the `expectedResult` field from `'allow_header'` to `'reject'` for 7 test cases in the test matrix array. This aligns test expectations with the security-hardened implementation that:

- Only allows header-based auth in `development` or `test` NODE_ENV
- Rejects all other environments (staging, undefined, case variations) unless `AUTH_MODE_PLATFORM_STRICT=true`

---

## Files to Modify

| File | Lines | Description |
|------|-------|-------------|
| `/Users/m/git/clients/aol/europe-ttp/test/utils/auth.test.ts` | 634-692 | Update 7 test case `expectedResult` values |

---

## Code Changes

### Change 1: Staging without strict (Line 638)

```typescript
// OLD
{
  nodeEnv: 'staging',
  strictMode: undefined,
  expectedResult: 'allow_header',
  description: 'staging without strict should allow header',
},

// NEW
{
  nodeEnv: 'staging',
  strictMode: undefined,
  expectedResult: 'reject',
  description: 'staging without strict should reject',
},
```

### Change 2: Staging with strict=false (Line 644)

```typescript
// OLD
{
  nodeEnv: 'staging',
  strictMode: 'false',
  expectedResult: 'allow_header',
  description: 'staging with strict=false should allow header',
},

// NEW
{
  nodeEnv: 'staging',
  strictMode: 'false',
  expectedResult: 'reject',
  description: 'staging with strict=false should reject',
},
```

### Change 3: Unset NODE_ENV without strict (Line 658)

```typescript
// OLD
{
  nodeEnv: undefined,
  strictMode: undefined,
  expectedResult: 'allow_header',
  description: 'unset NODE_ENV without strict should allow header',
},

// NEW
{
  nodeEnv: undefined,
  strictMode: undefined,
  expectedResult: 'reject',
  description: 'unset NODE_ENV without strict should reject',
},
```

### Change 4: Unset NODE_ENV with strict=false (Line 664)

```typescript
// OLD
{
  nodeEnv: undefined,
  strictMode: 'false',
  expectedResult: 'allow_header',
  description: 'unset NODE_ENV with strict=false should allow header',
},

// NEW
{
  nodeEnv: undefined,
  strictMode: 'false',
  expectedResult: 'reject',
  description: 'unset NODE_ENV with strict=false should reject',
},
```

### Change 5: Production (capitalized) without strict (Line 678)

```typescript
// OLD
{
  nodeEnv: 'Production',
  strictMode: undefined,
  expectedResult: 'allow_header',
  description: 'Production (capitalized) without strict should allow header (case-sensitive)',
},

// NEW
{
  nodeEnv: 'Production',
  strictMode: undefined,
  expectedResult: 'reject',
  description: 'Production (capitalized) without strict should reject',
},
```

### Change 6: PRODUCTION (uppercase) without strict (Line 684)

```typescript
// OLD
{
  nodeEnv: 'PRODUCTION',
  strictMode: undefined,
  expectedResult: 'allow_header',
  description: 'PRODUCTION (uppercase) without strict should allow header (case-sensitive)',
},

// NEW
{
  nodeEnv: 'PRODUCTION',
  strictMode: undefined,
  expectedResult: 'reject',
  description: 'PRODUCTION (uppercase) without strict should reject',
},
```

---

## Edit Tool Ready Strings

### Edit 1 (Lines 634-640)
**old_string:**
```
      // Staging environment tests
      {
        nodeEnv: 'staging',
        strictMode: undefined,
        expectedResult: 'allow_header',
        description: 'staging without strict should allow header',
      },
```

**new_string:**
```
      // Staging environment tests
      {
        nodeEnv: 'staging',
        strictMode: undefined,
        expectedResult: 'reject',
        description: 'staging without strict should reject',
      },
```

### Edit 2 (Lines 641-646)
**old_string:**
```
      {
        nodeEnv: 'staging',
        strictMode: 'false',
        expectedResult: 'allow_header',
        description: 'staging with strict=false should allow header',
      },
```

**new_string:**
```
      {
        nodeEnv: 'staging',
        strictMode: 'false',
        expectedResult: 'reject',
        description: 'staging with strict=false should reject',
      },
```

### Edit 3 (Lines 654-660)
**old_string:**
```
      // Unset NODE_ENV tests
      {
        nodeEnv: undefined,
        strictMode: undefined,
        expectedResult: 'allow_header',
        description: 'unset NODE_ENV without strict should allow header',
      },
```

**new_string:**
```
      // Unset NODE_ENV tests
      {
        nodeEnv: undefined,
        strictMode: undefined,
        expectedResult: 'reject',
        description: 'unset NODE_ENV without strict should reject',
      },
```

### Edit 4 (Lines 661-666)
**old_string:**
```
      {
        nodeEnv: undefined,
        strictMode: 'false',
        expectedResult: 'allow_header',
        description: 'unset NODE_ENV with strict=false should allow header',
      },
```

**new_string:**
```
      {
        nodeEnv: undefined,
        strictMode: 'false',
        expectedResult: 'reject',
        description: 'unset NODE_ENV with strict=false should reject',
      },
```

### Edit 5 (Lines 674-680)
**old_string:**
```
      // Case sensitivity tests (NODE_ENV is case-sensitive)
      {
        nodeEnv: 'Production',
        strictMode: undefined,
        expectedResult: 'allow_header',
        description: 'Production (capitalized) without strict should allow header (case-sensitive)',
      },
```

**new_string:**
```
      // Case sensitivity tests (NODE_ENV is case-sensitive)
      {
        nodeEnv: 'Production',
        strictMode: undefined,
        expectedResult: 'reject',
        description: 'Production (capitalized) without strict should reject',
      },
```

### Edit 6 (Lines 681-686)
**old_string:**
```
      {
        nodeEnv: 'PRODUCTION',
        strictMode: undefined,
        expectedResult: 'allow_header',
        description: 'PRODUCTION (uppercase) without strict should allow header (case-sensitive)',
      },
```

**new_string:**
```
      {
        nodeEnv: 'PRODUCTION',
        strictMode: undefined,
        expectedResult: 'reject',
        description: 'PRODUCTION (uppercase) without strict should reject',
      },
```

---

## Validation Commands

After applying changes, run:

```bash
# Run the auth tests
bun test test/utils/auth.test.ts

# Run all tests to ensure no regressions
bun test

# Type check
bunx tsc --noEmit
```

**Expected Results:**
- All 7 modified test cases should pass with `reject` expectation
- All other auth tests should continue to pass
- No type errors

---

## Rollback Strategy

If issues arise, revert the changes:

```bash
# Option 1: Git restore
git restore test/utils/auth.test.ts

# Option 2: Revert to previous commit
git checkout HEAD~1 -- test/utils/auth.test.ts
```

Or manually restore each `expectedResult` from `'reject'` back to `'allow_header'` for the 7 affected test cases.

---

## Summary

| Metric | Value |
|--------|-------|
| Files Modified | 1 |
| Test Cases Updated | 7 |
| Changes per Test | `expectedResult: 'allow_header'` -> `'reject'` |
| Risk Level | Low (test-only changes) |
| Security Impact | Positive (aligns tests with secure implementation) |
