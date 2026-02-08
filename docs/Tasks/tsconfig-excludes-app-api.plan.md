# TASK-068: tsconfig-excludes-app-api - Implementation Plan

## Summary
Add `baseUrl` configuration to `tsconfig.json` and remove `app/api` from the exclude array to enable typechecking of API routes.

## Approach
**Approach A** (from research): Add `baseUrl` + remove exclusion

This is the minimal fix that:
1. Enables `@/` path alias resolution for imports like `@/utils/crypto`
2. Removes the false-green typecheck for `app/api`
3. Exposes legitimate type errors that need to be addressed (migration awareness)

Note: Type errors for `next/server` will appear after this change. This is **expected and correct** - it exposes the real state of the migration rather than hiding it behind an exclusion.

## Implementation Steps

### Step 1: Add baseUrl to tsconfig.json
File: `tsconfig.json`

Change the `compilerOptions` section from:
```json
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "types": ["node"],
    "jsx": "react"
  },
```

To:
```json
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "types": ["node"],
    "jsx": "react",
    "baseUrl": "."
  },
```

### Step 2: Remove app/api from exclude array
File: `tsconfig.json`

Change line 14 from:
```json
  "exclude": ["node_modules", "test/typescript/node_modules", "app/api"],
```

To:
```json
  "exclude": ["node_modules", "test/typescript/node_modules"],
```

### Step 3: Verify typecheck behavior
Run `bun run typecheck`:
- **Expected**: Type errors for `next/server` will now be reported
- This is the **correct behavior** - the exclusion was hiding these errors
- The `@/utils/crypto` import should resolve correctly with `baseUrl`

### Step 4: Verify BDD alignment
Run `bun run bdd:verify` to ensure no orphan steps were introduced.

## Files to Modify

| File | Change |
|------|--------|
| `tsconfig.json` | Add `"baseUrl": "."` to compilerOptions |
| `tsconfig.json` | Remove `"app/api"` from exclude array |

## Expected Type Errors After Change

The following errors are **expected and correct** - they represent the actual migration state:

```
app/api/upload/signed-url/route.ts(18,43): error TS2307: Cannot find module 'next/server' or its corresponding type declarations.
app/api/upload/signed-url/route.ts(19,37): error TS2307: Cannot find module '@/utils/crypto' or its corresponding type declarations.
app/api/upload/verify/route.ts(11,43): error TS2307: Cannot find module 'next/server' or its corresponding type declarations.
app/api/upload/verify/route.ts(12,57): error TS2307: Cannot find module '@/utils/crypto' or its corresponding type declarations.
```

Note: The `@/utils/crypto` errors should be resolved by the `baseUrl` addition. If they persist, verify the file exists at `app/utils/crypto.ts` (it does per research).

## Acceptance Criteria Verification

1. **`bun run typecheck` fails on type errors in `app/api/**`**
   - After removing exclusion, type errors in API routes will be reported
   - This passes the criterion (the criterion is "fails on type errors", not "passes with no errors")

2. **Existing typecheck remains passing (no regressions)**
   - Run typecheck on non-API files: `tsc --noEmit` currently passes for `test/**/*.ts` and `scripts/**/*.ts`
   - After change, these should continue to pass
   - Only `app/api` files should show new errors

3. **`bun run bdd:verify` passes**
   - No changes to test files, so alignment should remain valid

## Risks

| Risk | Mitigation |
|------|------------|
| Type errors may block CI/CD | This is intentional - the current exclusion gives false confidence. Exposing errors is the first step toward fixing them. |
| `@/` imports may not resolve | Adding `baseUrl: "."` is the standard solution for path aliases. |

## Rollback Plan

If needed, revert the two changes to `tsconfig.json`:
1. Remove `"baseUrl": "."` from compilerOptions
2. Add `"app/api"` back to exclude array

## Notes

- Installing `next` as a dependency is **out of scope** for this task
- Fixing the type errors is **out of scope** for this task
- The goal is to **expose** the errors, not fix them
- A follow-up task should be created to address the `next/server` type declarations (either install next or use type-only stubs)
