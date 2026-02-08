# TASK-067: tsconfig-missing-test-bdd - Implementation Plan

## Implementation Steps

### Step 1: Verify Current State
- Confirm `test/bdd/step-registry.ts` exists and compiles
- Run `bun run typecheck` to capture current baseline (should pass)

### Step 2: Update tsconfig.json
- Add `"test/bdd/**/*.ts"` to the `include` array in `tsconfig.json:13`
- The updated line should be:
  ```json
  "include": ["test/typescript/**/*.ts", "scripts/**/*.ts", "app/**/*.tsx", "app/**/*.ts", "test/bdd/**/*.ts"],
  ```

### Step 3: Verify Typecheck Still Passes
- Run `bun run typecheck` to ensure no new errors are introduced
- The registry file uses simple types and `as const`, so should pass cleanly

### Step 4: Verify BDD Tooling Still Works
- Run `bun run bdd:verify` to ensure step registry validation still works
- Run `bun run bdd:typescript` to ensure TypeScript tests still pass

## Files to Change

| File | Change | Lines |
|------|--------|-------|
| `tsconfig.json` | Add `"test/bdd/**/*.ts"` to `include` array | 13 |

## Tests to Run

```bash
# Typecheck should now include test/bdd/**/*.ts
bun run typecheck

# BDD verification should still work
bun run bdd:verify

# TypeScript BDD tests should still pass
bun run bdd:typescript
```

## Expected Outcome

After the change:
1. `bun run typecheck` will analyze `test/bdd/step-registry.ts`
2. Any type errors in the registry or files it imports will be caught
3. All existing tests and verification scripts continue to work

## Risks / Rollback

### Risk: Low
- The change only affects typecheck, not runtime behavior
- The registry file uses only built-in types and has no complex dependencies
- No breaking changes to existing functionality

### Rollback Plan
If issues arise:
1. Remove `"test/bdd/**/*.ts"` from the `include` array
2. Run `bun run typecheck` to verify baseline restored
3. Investigate any type errors in the registry separately

## Related Work

- **TASK-068 (tsconfig-excludes-app-api)**: Addresses the `app/api` exclusion - could be addressed together
- **Phase 3 Infra/Tooling Hardening**: This task is part of overall typecheck coverage improvements
