# P2-02: Auth Test Matrix Alignment - Validation Report

## Summary

Validated that the test cases in `test/utils/auth.test.ts` have been updated to expect `'reject'` instead of `'allow_header'` for non-development environments without strict mode.

---

## Fix Verification Checklist

| Check | Status | Details |
|-------|--------|---------|
| 1. TypeScript type check | PASS | No type errors |
| 2. Auth unit tests pass | PASS | All 76 auth tests pass |
| 3. No regressions in utils tests | PASS | All 160 utility tests pass |
| 4. Staging tests expect 'reject' | PASS | Lines 634-652 updated |
| 5. Unset NODE_ENV tests expect 'reject' | PASS | Lines 654-672 updated |
| 6. Case sensitivity tests expect 'reject' | PASS | Lines 674-692 updated |

---

## Evidence

### Test Case Verification (Lines 634-692)

**Staging environment tests (Lines 634-652):**
```typescript
// Staging environment tests
{
  nodeEnv: 'staging',
  strictMode: undefined,
  expectedResult: 'reject',  // CORRECT - was 'allow_header'
  description: 'staging without strict should reject',
},
{
  nodeEnv: 'staging',
  strictMode: 'false',
  expectedResult: 'reject',  // CORRECT - was 'allow_header'
  description: 'staging with strict=false should reject',
},
```

**Unset NODE_ENV tests (Lines 654-672):**
```typescript
// Unset NODE_ENV tests
{
  nodeEnv: undefined,
  strictMode: undefined,
  expectedResult: 'reject',  // CORRECT - was 'allow_header'
  description: 'unset NODE_ENV without strict should reject',
},
{
  nodeEnv: undefined,
  strictMode: 'false',
  expectedResult: 'reject',  // CORRECT - was 'allow_header'
  description: 'unset NODE_ENV with strict=false should reject',
},
```

**Case sensitivity tests (Lines 674-692):**
```typescript
// Case sensitivity tests (NODE_ENV is case-sensitive)
{
  nodeEnv: 'Production',
  strictMode: undefined,
  expectedResult: 'reject',  // CORRECT - was 'allow_header'
  description: 'Production (capitalized) without strict should reject',
},
{
  nodeEnv: 'PRODUCTION',
  strictMode: undefined,
  expectedResult: 'reject',  // CORRECT - was 'allow_header'
  description: 'PRODUCTION (uppercase) without strict should reject',
},
```

### TypeScript Type Check Output
```
$ npm run typecheck
> europe-ttp-migration@0.1.0 pretypecheck
> node scripts/check-node-version.mjs
[check-node-version] OK: Node.js v20.20.0

> europe-ttp-migration@0.1.0 typecheck
> tsc --noEmit

(No errors - clean exit)
```

### Unit Test Output
```
$ bun test test/utils/auth.test.ts

test/utils/auth.test.ts:
WARNING: SESSION_HMAC_SECRET not set, falling back to UPLOAD_HMAC_SECRET. For better security, set a separate SESSION_HMAC_SECRET environment variable.
Platform mode requires AUTH_MODE_PLATFORM_STRICT=true outside development. Request rejected for security.
(11 identical warning messages - confirms fail-closed logic is working)

 76 pass
 0 fail
 98 expect() calls
Ran 76 tests across 1 file. [46.00ms]
```

### Full Utils Test Output (No Regressions)
```
$ bun test test/utils/

test/utils/auth.test.ts:
(76 tests pass)

test/utils/crypto.test.ts:
(84 tests pass)

 160 pass
 0 fail
 176 expect() calls
Ran 160 tests across 4 files. [57.00ms]
```

---

## Test Cases Changed

| # | NODE_ENV | AUTH_MODE_PLATFORM_STRICT | Old Expected | New Expected | Description |
|---|----------|---------------------------|--------------|--------------|-------------|
| 1 | `staging` | undefined | `allow_header` | `reject` | staging without strict should reject |
| 2 | `staging` | `'false'` | `allow_header` | `reject` | staging with strict=false should reject |
| 3 | undefined | undefined | `allow_header` | `reject` | unset NODE_ENV without strict should reject |
| 4 | undefined | `'false'` | `allow_header` | `reject` | unset NODE_ENV with strict=false should reject |
| 5 | `Production` | undefined | `allow_header` | `reject` | Production (capitalized) without strict should reject |
| 6 | `PRODUCTION` | undefined | `allow_header` | `reject` | PRODUCTION (uppercase) without strict should reject |

---

## Security Verification

The console warnings in the test output confirm the fail-closed security logic is working:
```
Platform mode requires AUTH_MODE_PLATFORM_STRICT=true outside development. Request rejected for security.
```

This message appears 11 times, corresponding to the test cases where:
- NODE_ENV is staging, undefined, or non-lowercase production
- AUTH_MODE_PLATFORM_STRICT is not 'true'

---

## Verdict: **PASS**

All validation criteria met:
- Test cases correctly expect `'reject'` for non-development environments without strict mode
- TypeScript type check passes
- All 76 auth tests pass
- All 160 utility tests pass (no regressions)
- Fail-closed security logic is correctly enforced
