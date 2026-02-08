# TASK-088: fix-eslint-type-aware-project - Implementation Plan

## Implementation Steps

### Step 1: Modify `tsconfig.json`
Update the TypeScript configuration to include all files that ESLint lints:

1. **Remove `"app/api"` from `exclude` array** (line 16)
   - Before: `"exclude": ["node_modules", "test/typescript/node_modules", "app/api"]`
   - After: `"exclude": ["node_modules", "test/typescript/node_modules"]`

2. **Add `"test/utils/**/*.ts"` to `include` array** (line 15)
   - Before: `"include": ["test/typescript/**/*.ts", "scripts/**/*.ts", "app/**/*.tsx", "app/**/*.ts"]`
   - After: `"include": ["test/typescript/**/*.ts", "test/utils/**/*.ts", "scripts/**/*.ts", "app/**/*.tsx", "app/**/*.ts"]`

### Step 2: Verify TypeScript compilation
```bash
bun run typecheck
```
Expected: Pass without errors (typecheck already passes with `app/api` excluded, so including it should not introduce new errors since the code is already valid TypeScript)

### Step 3: Verify ESLint
```bash
bun run lint
```
Expected: Pass without parsing errors (the 3 parsing errors should be resolved)

### Step 4: Verify BDD alignment
```bash
bun run bdd:verify
```
Expected: Pass without errors

## Files to Change
1. `tsconfig.json` - Remove `app/api` from exclude, add `test/utils/**/*.ts` to include

## Acceptance Criteria Verification
- [ ] All files in ESLint's `files` patterns are included in tsconfig
- [ ] `bun run lint` passes without parsing errors
- [ ] Existing type-checking still passes (`bun run typecheck`)
- [ ] No regressions in BDD tests (`bun run bdd:verify`)

## Risks and Rollback

### Risk 1: Type errors emerge in `app/api/**/*.ts`
- **Mitigation**: The files are already valid TypeScript code; including them in tsconfig should not introduce errors
- **Rollback**: Re-add `"app/api"` to exclude if type errors emerge

### Risk 2: Module resolution issues
- **Mitigation**: Imports use relative paths (`../../../utils/crypto`) which resolve correctly
- **Rollback**: N/A - this is unlikely to cause issues

## Summary
Minimal change to `tsconfig.json` to align ESLint and TypeScript project boundaries. The change is low-risk because:
1. Typecheck already passes with the current settings
2. Files are valid TypeScript code
3. Only removing an unnecessary exclusion and adding a missing include pattern
