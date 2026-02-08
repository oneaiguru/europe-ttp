# TASK-095: isolate-process-env-in-tests - Research

## Summary

Current TypeScript BDD tests and unit tests read from `process.env` directly or indirectly, creating implicit dependencies on the host environment. This research identifies all `process.env` usage patterns in test files and proposes strategies for isolation.

## Files Analyzed

### 1. test/typescript/steps/auth_steps.ts

**Lines with `process.env` usage:**

| Line | Usage | Purpose |
|------|-------|---------|
| 140-148 | `process.env.UPLOAD_HMAC_SECRET`, `process.env.AUTH_MODE`, `process.env.SESSION_MAX_AGE_SECONDS` | Sets default environment variables in "the test environment is configured" step |
| 152 | `process.env.AUTH_MODE = 'platform'` | Sets platform auth mode |
| 157 | `process.env.AUTH_MODE = 'session'` | Sets session auth mode |
| 167 | `process.env.UPLOAD_HMAC_SECRET \|\| 'test-secret-for-hmac-signing'` | Gets HMAC secret with fallback |
| 174 | `process.env.UPLOAD_HMAC_SECRET \|\| 'test-secret-for-hmac-signing'` | Gets HMAC secret for expired token |
| 194 | `process.env.UPLOAD_HMAC_SECRET \|\| 'test-secret-for-hmac-signing'` | Gets HMAC secret for tampered token |
| 279 | `process.env.UPLOAD_HMAC_SECRET \|\| 'test-secret-for-hmac-signing'` | Gets HMAC secret for token generation |
| 285 | `process.env.UPLOAD_HMAC_SECRET \|\| 'test-secret-for-hmac-signing'` | Gets HMAC secret for token verification |
| 318 | `process.env.UPLOAD_HMAC_SECRET \|\| 'test-secret-for-hmac-signing'` | Gets HMAC secret for token generation |

**Pattern:** Mix of setting defaults and reading with fallback values.

### 2. test/typescript/steps/common.ts

**Lines with `process.env` usage:**

No direct `process.env` usage. This file only resets module-level state via Before hook.

### 3. test/utils/crypto.test.ts

**Lines with `process.env` usage:**

| Line | Usage | Purpose |
|------|-------|---------|
| 213-217 | Saves, deletes, restores `process.env.UPLOAD_HMAC_SECRET` | Tests getHmacSecret() throws when not set |
| 221-226 | Saves, sets, restores `process.env.UPLOAD_HMAC_SECRET` | Tests getHmacSecret() returns the secret |

**Pattern:** Standard save/restore pattern for testing error conditions. This is **acceptable** for unit tests testing the actual `getHmacSecret()` function which reads from `process.env`.

### 4. test/utils/auth.test.ts

**Lines with `process.env` usage:**

| Lines | Usage | Purpose |
|-------|-------|---------|
| 24-27 | Saves, deletes, restores `process.env.AUTH_MODE` | Tests getAuthMode() defaults to 'platform' |
| 31-35 | Saves, sets, restores `process.env.AUTH_MODE` | Tests getAuthMode() returns 'session' |
| 39-43 | Saves, sets, restores `process.env.AUTH_MODE` | Tests getAuthMode() returns 'platform' for invalid values |
| 49-52 | Saves, deletes, restores `process.env.SESSION_MAX_AGE_SECONDS` | Tests getSessionMaxAge() defaults to 3600 |
| 56-60 | Saves, sets, restores `process.env.SESSION_MAX_AGE_SECONDS` | Tests getSessionMaxAge() parses value |
| 64-68 | Saves, sets, restores `process.env.SESSION_MAX_AGE_SECONDS` | Tests getSessionMaxAge() throws for NaN |
| 72-76 | Saves, sets, restores `process.env.SESSION_MAX_AGE_SECONDS` | Tests getSessionMaxAge() throws for negative |
| 80-84 | Saves, sets, restores `process.env.SESSION_MAX_AGE_SECONDS` | Tests getSessionMaxAge() throws for zero |
| 88-92 | Saves, sets, restores `process.env.SESSION_MAX_AGE_SECONDS` | Tests getSessionMaxAge() throws for >30 days |
| 96-100 | Saves, sets, restores `process.env.SESSION_MAX_AGE_SECONDS` | Tests getSessionMaxAge() accepts exactly 30 days |
| 229-245 | Saves, sets, restores `process.env.AUTH_MODE`, `process.env.UPLOAD_HMAC_SECRET` | Tests getAuthenticatedUser() in session mode with valid token |
| 249-264 | Saves, sets, restores `process.env.AUTH_MODE`, `process.env.UPLOAD_HMAC_SECRET` | Tests getAuthenticatedUser() in session mode with invalid token |
| 268-279 | Saves, deletes, restores `process.env.AUTH_MODE` | Tests getAuthenticatedUser() in platform mode with x-user-email |
| 283-292 | Saves, deletes, restores `process.env.AUTH_MODE` | Tests getAuthenticatedUser() in platform mode missing x-user-email |
| 296-307 | Saves, deletes, restores `process.env.AUTH_MODE` | Tests getAuthenticatedUser() in platform mode with invalid email |

**Pattern:** Standard save/restore pattern for testing environment-dependent functions. This is **acceptable** for unit tests of functions that read from `process.env`.

### 5. test/typescript/steps/uploads_steps.ts

**Lines with `process.env` usage:**

| Line | Usage | Purpose |
|------|-------|---------|
| 223 | `process.env.UPLOAD_HMAC_SECRET \|\| 'development-secret-change-in-production'` | Gets HMAC secret for token verification |
| 240 | `process.env.UPLOAD_HMAC_SECRET \|\| 'development-secret-change-in-production'` | Gets HMAC secret for forged token test |

**Pattern:** Reads with fallback value. Should be replaced with test constant.

## Dependencies on Application Code

The following application utility functions read from `process.env`:

- **app/utils/auth.ts:34-36** - `getAuthMode()` reads `process.env.AUTH_MODE`
- **app/utils/auth.ts:47-74** - `getSessionMaxAge()` reads `process.env.SESSION_MAX_AGE_SECONDS`
- **app/utils/auth.ts:183** - `verifySessionToken()` calls `getSessionMaxAge()`
- **app/utils/auth.ts:240** - `getAuthenticatedUser()` calls `getHmacSecret()`
- **app/utils/crypto.ts:149-166** - `getHmacSecret()` reads `process.env.UPLOAD_HMAC_SECRET`

## Existing Test Fixtures

**test/fixtures/test-users.json** - Contains test user data including email, role, home_country, name, password.

**test/fixtures/** - No existing test constants file for environment configuration.

## Proposed Strategy

### For BDD Step Files (auth_steps.ts, uploads_steps.ts)

1. Create `test/fixtures/test-config.ts` with test constants:
   ```typescript
   export const TEST_HMAC_SECRET = 'test-secret-for-hmac-signing';
   export const TEST_AUTH_MODE = 'platform' as const;
   export const TEST_SESSION_MAX_AGE = '3600';
   ```

2. Replace all `process.env.UPLOAD_HMAC_SECRET || '...'` with `TEST_HMAC_SECRET`
3. Replace `process.env.AUTH_MODE = 'platform'/'session'` with a context variable
4. Remove "the test environment is configured" step that sets defaults

### For Unit Tests (auth.test.ts, crypto.test.ts)

**Keep current pattern** - The save/restore pattern is appropriate for unit tests that explicitly test environment-dependent functions. These tests verify that the application code correctly reads from environment variables, which requires testing with `process.env`.

### For common.ts

No changes needed - no `process.env` usage.

## Files to Modify

1. **test/typescript/steps/auth_steps.ts** - Replace `process.env` reads with test constants
2. **test/typescript/steps/uploads_steps.ts** - Replace `process.env` reads with test constants
3. **test/fixtures/test-config.ts** - Create new file with test constants

## Files NOT to Modify

1. **test/utils/auth.test.ts** - Unit tests should keep save/restore pattern
2. **test/utils/crypto.test.ts** - Unit tests should keep save/restore pattern
3. **test/typescript/steps/common.ts** - No `process.env` usage

## Test Verification Commands

```bash
# Verify TypeScript auth tests
bun run bdd:typescript specs/features/auth/*.feature

# Verify unit tests
bun run test

# Verify type checking
bun run typecheck

# Verify linting
bun run lint

# Verify step alignment
bun run bdd:verify
```

## Risk Assessment

- **Low risk** - Changes are isolated to test infrastructure
- **No production code changes** - Application code remains unchanged
- **BDD tests may need updates** - Feature files may reference the "the test environment is configured" step
