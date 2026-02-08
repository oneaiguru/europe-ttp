# TASK-067: tsconfig-missing-test-bdd

## Goal
Ensure TypeScript typecheck covers `test/bdd` sources so registry/tooling drift is caught early.

## References
- File: `tsconfig.json:13-14`
- File: `test/bdd/step-registry.ts:1`
- Review: `docs/review/REVIEW_DRAFTS.md` (entry: tsconfig-missing-test-bdd)

## Problem Statement
The current `tsconfig.json` configuration:
- `include` covers `test/typescript/**/*.ts`, `scripts/**/*.ts`, `app/**/*.tsx`, `app/**/*.ts`
- **Missing**: `test/bdd/**/*.ts` (contains `step-registry.ts` and other BDD tooling)

This means type errors in BDD tooling (like the step registry) are not caught by `bun run typecheck`, leading to potential silent failures or runtime errors.

## Acceptance Criteria
1. `bun run typecheck` fails on type errors in `test/bdd/**/*.ts` (either by including it in `tsconfig.json` or using a dedicated typecheck config)
2. Verify that existing `test/bdd/step-registry.ts` passes typecheck (no errors introduced)
3. All BDD verification scripts (`scripts/bdd/**/*.ts`) continue to pass typecheck

## Files to Modify
- `tsconfig.json` - Add `test/bdd/**/*.ts` to `include` array

## Test Commands
```bash
# Verify typecheck passes (after change)
bun run typecheck

# Verify BDD verification still works
bun run bdd:verify

# Verify all tests still pass
bun run bdd:typescript
```

## Notes
- This is part of Phase 3 infra/tooling hardening
- Related to TASK-068 (tsconfig-excludes-app-api) which addresses the `app/api` exclusion
- Both tasks can potentially be addressed together for a complete tsconfig fix
