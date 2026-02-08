# TASK-095: isolate-process-env-in-tests - Implementation Plan

## Overview

Replace direct `process.env` reads in TypeScript BDD step files with test constants, eliminating implicit dependencies on host environment variables while preserving proper environment testing in unit tests.

## Implementation Steps

### Step 1: Create Test Constants File

**File:** `test/fixtures/test-config.ts` (new)

Create a centralized constants file for test environment configuration:

```typescript
/**
 * Test environment constants.
 *
 * These constants replace direct process.env reads in BDD step files,
 * ensuring tests have explicit, predictable configuration independent
 * of the host environment.
 */

/** HMAC secret used for signing upload tokens in tests */
export const TEST_HMAC_SECRET = 'test-secret-for-hmac-signing';

/** Authentication mode for platform auth tests */
export const TEST_AUTH_MODE_PLATFORM = 'platform' as const;

/** Authentication mode for session auth tests */
export const TEST_AUTH_MODE_SESSION = 'session' as const;

/** Default session max age in seconds (1 hour) */
export const TEST_SESSION_MAX_AGE_SECONDS = 3600;
```

### Step 2: Update auth_steps.ts

**File:** `test/typescript/steps/auth_steps.ts`

Changes:
1. Import test constants from `test/fixtures/test-config.ts`
2. Remove the "the test environment is configured" step (lines 140-148) that sets default environment variables
3. Replace all `process.env.UPLOAD_HMAC_SECRET || 'test-secret-for-hmac-signing'` with `TEST_HMAC_SECRET`
4. Replace `process.env.AUTH_MODE = 'platform'/'session'` with direct setting for test scenarios

**Specific replacements:**
- Line 167: `process.env.UPLOAD_HMAC_SECRET || 'test-secret-for-hmac-signing'` → `TEST_HMAC_SECRET`
- Line 174: Same replacement
- Line 194: Same replacement
- Line 279: Same replacement
- Line 285: Same replacement
- Line 318: Same replacement

### Step 3: Update uploads_steps.ts

**File:** `test/typescript/steps/uploads_steps.ts`

Changes:
1. Import test constants from `test/fixtures/test-config.ts`
2. Replace all `process.env.UPLOAD_HMAC_SECRET || 'development-secret-change-in-production'` with `TEST_HMAC_SECRET`

**Specific replacements:**
- Line 223: Replace with `TEST_HMAC_SECRET`
- Line 240: Replace with `TEST_HMAC_SECRET`

### Step 4: Update Feature Files (if needed)

**Files:** `specs/features/auth/*.feature`, `specs/features/uploads/*.feature`

Check for any feature files that use the "the test environment is configured" step and remove those lines since the step will be deleted.

### Step 5: Verify No Other Test Files Use process.env

Run grep to ensure no other test step files have been missed:
```bash
grep -r "process\.env" test/typescript/steps/*.ts
```

## Files to Create

| File | Purpose |
|------|---------|
| `test/fixtures/test-config.ts` | Centralized test constants |

## Files to Modify

| File | Changes |
|------|---------|
| `test/typescript/steps/auth_steps.ts` | Remove env config step, replace process.env with constants |
| `test/typescript/steps/uploads_steps.ts` | Replace process.env with constants |

## Files NOT to Modify

| File | Reason |
|------|--------|
| `test/utils/auth.test.ts` | Unit tests should keep save/restore pattern |
| `test/utils/crypto.test.ts` | Unit tests should keep save/restore pattern |
| `test/typescript/steps/common.ts` | No process.env usage |

## Verification Commands

```bash
# Verify step alignment
bun run bdd:verify

# Verify TypeScript auth tests
bun run bdd:typescript specs/features/auth/*.feature

# Verify upload tests if affected
bun run bdd:typescript specs/features/uploads/*.feature

# Verify unit tests
bun run test

# Verify type checking
bun run typecheck

# Verify linting
bun run lint
```

## Risks and Mitigation

| Risk | Mitigation |
|------|------------|
| Feature files may reference deleted step | Search feature files for "the test environment is configured" and update |
| Different test constants break existing tests | Use same default values previously used as fallbacks |
| Import path issues | Verify `test/fixtures/test-config.ts` can be imported from step files |

## Rollback Strategy

If tests fail after changes:
1. Revert all modified files
2. Delete `test/fixtures/test-config.ts`
3. Restore original `process.env` usage pattern
4. Investigate root cause and retry

## Success Criteria

- [ ] No `process.env` reads remain in `test/typescript/steps/*.ts` files
- [ ] All BDD tests pass: `bun run bdd:typescript specs/features/auth/*.feature`
- [ ] All unit tests pass: `bun run test`
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes
- [ ] `bun run bdd:verify` passes
