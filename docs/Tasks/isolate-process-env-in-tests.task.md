# TASK-095: isolate-process-env-in-tests

## Goal
Ensure TypeScript BDD test steps do not read or depend on Node.js/Bun process environment variables, eliminating implicit test dependencies and improving test isolation.

## Legacy Reference
N/A (TypeScript test infrastructure only)

## Files Referenced
- `test/typescript/steps/auth_steps.ts` - Authentication step definitions
- `test/typescript/steps/common.ts` - Common test utilities and fixtures
- `test/utils/crypto.test.ts` - Cryptographic utility tests

## Problem Description
Current TypeScript BDD tests may read from `process.env` directly or indirectly, creating implicit dependencies on the host environment. This reduces test reliability and makes tests harder to debug. Tests should use explicit fixture data or test-mode configuration instead of reading real environment variables.

## Acceptance Criteria
- [ ] No direct reads of `process.env` in test step files (auth_steps.ts, common.ts)
- [ ] `test/utils/crypto.test.ts` does not rely on live environment variables
- [ ] All environment-dependent values use test fixtures or constants
- [ ] Tests still pass: `bun run bdd:typescript specs/features/auth/*.feature`
- [ ] `bun run test` passes for crypto.test.ts
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes

## Files to Modify
- [ ] `test/typescript/steps/auth_steps.ts` - Replace process.env reads with fixtures
- [ ] `test/typescript/steps/common.ts` - Replace process.env reads with fixtures
- [ ] `test/utils/crypto.test.ts` - Use test fixtures instead of live env

## Test Commands
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

## Notes
- Test fixtures are in `test/fixtures/` directory
- The test mode flag (`MOCK_MODE` or similar) should be used where applicable
- Consider creating test-only constants file if needed
