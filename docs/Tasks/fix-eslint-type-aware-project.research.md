# TASK-088: fix-eslint-type-aware-project - Research

## Current State Analysis

### ESLint Configuration (`eslint.config.js`)
- Located at `eslint.config.js:1-54`
- ESLint v9 flat config with type-aware linting enabled
- `parserOptions.project: "./tsconfig.json"` set at `eslint.config.js:30`
- Files pattern at `eslint.config.js:19-24`: `["scripts/**/*.ts", "test/**/*.ts", "app/**/*.ts", "app/**/*.tsx"]`
- Base ignores at `eslint.config.js:8-15`: legacy code, build outputs, compiled artifacts

### TypeScript Configuration (`tsconfig.json`)
- Located at `tsconfig.json:1-26`
- `include` at `tsconfig.json:15`: `["test/typescript/**/*.ts", "scripts/**/*.ts", "app/**/*.tsx", "app/**/*.ts"]`
- `exclude` at `tsconfig.json:16`: `["node_modules", "test/typescript/node_modules", "app/api"]`

### Mismatch Analysis

#### Problem 1: `app/api` excluded from tsconfig
- `tsconfig.json:16` excludes `"app/api"`
- `eslint.config.js:23` includes `"app/**/*.ts"` (which covers `app/api/**/*.ts`)
- Files affected:
  - `app/api/upload/signed-url/route.ts` (117 lines)
  - `app/api/upload/verify/route.ts` (81 lines)
- Both files use type-aware ESLint rules but are not in the tsconfig project

#### Problem 2: `test/utils/**/*.ts` not in tsconfig include
- `eslint.config.js:21` includes `"test/**/*.ts"` (which covers `test/utils/**/*.ts`)
- `tsconfig.json:15` includes `"test/typescript/**/*.ts"` only
- File affected:
  - `test/utils/crypto.test.ts` (230 lines)

### Dependencies
The API routes import from utility files that ARE in the tsconfig:
- `app/utils/crypto.ts` (167 lines) - exported from `app/` root which IS in tsconfig
- `app/utils/auth.ts` (220 lines) - exported from `app/` root which IS in tsconfig

### Current Verification Status
- `bun run typecheck` passes without errors
- `bun run lint` fails with 3 parsing errors:
  ```
  app/api/upload/signed-url/route.ts:0:0  Parsing error: file not found in project
  app/api/upload/verify/route.ts:0:0  Parsing error: file not found in project
  test/utils/crypto.test.ts:0:0  Parsing error: file not found in project
  ```

## Implementation Constraints

### File: `tsconfig.json`
- Must remove `"app/api"` from `exclude` array (line 16)
- Must add `"test/utils/**/*.ts"` to `include` array (line 15)
- Preserve existing include/exclude patterns

### Potential Risks
1. **Type errors in API routes**: Adding `app/api` to tsconfig may expose existing type errors
2. **Module resolution**: Need to verify that imports resolve correctly after changes
3. **Test file imports**: `test/utils/crypto.test.ts:14` imports from `../../app/utils/crypto`

## Files to Modify
1. `tsconfig.json` - Remove `app/api` from exclude, add `test/utils/**/*.ts` to include

## Verification Commands
```bash
bun run lint      # Should pass without parsing errors
bun run typecheck # Should pass
bun run bdd:verify # Should pass
```

## Next Steps
Proceed to planning phase (P) to create implementation plan.
