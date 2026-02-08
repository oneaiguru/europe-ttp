# TASK-088: fix-eslint-type-aware-project

## Goal
Fix ESLint type-aware linting errors by ensuring all files linted by ESLint are included in the tsconfig project reference.

## Problem Statement
ESLint type-aware linting is configured with `parserOptions.project: "./tsconfig.json"`, but the current tsconfig:
1. Excludes `app/api/**` which contains upload routes (`app/api/upload/signed-url/route.ts`, `app/api/upload/verify/route.ts`)
2. Does not include `test/utils/**` which contains `crypto.test.ts`

When ESLint tries to lint these files with type-aware rules, it fails because they're not in the project:
```
Parsing error: "parserOptions.project" has been provided for @typescript-eslint/parser.
The file was not found in any of the provided project(s): app/api/upload/signed-url/route.ts
```

## Legacy Reference
N/A - This is a build/tooling configuration issue, not a legacy migration.

## Refs
- `eslint.config.js` - ESLint v9 flat config with `parserOptions.project: "./tsconfig.json"`
- `tsconfig.json` - Current configuration with `exclude: ["app/api"]` and missing `test/utils`
- `app/api/upload/signed-url/route.ts` - Upload route not in tsconfig
- `app/api/upload/verify/route.ts` - Verify route not in tsconfig
- `test/utils/crypto.test.ts` - Test file not in tsconfig

## Acceptance Criteria
- [ ] All files in ESLint's `files` patterns are included in tsconfig
- [ ] `bun run lint` passes without parsing errors
- [ ] Existing type-checking still passes (`bun run typecheck`)
- [ ] No regressions in BDD tests (`bun run bdd:verify`)

## Implementation Options

### Option 1: Remove app/api from tsconfig exclude
- Pro: Simple, enables type-checking for API routes
- Con: May expose existing type errors in API routes (which is actually good)

### Option 2: Add test/utils to tsconfig include
- Pro: Enables type-checking for test utilities
- Con: None obvious

### Option 3: Exclude problematic files from ESLint
- Pro: Quick workaround
- Con: Loses type-aware linting for these files (not recommended)

## Recommended Approach
1. Remove `app/api` from tsconfig exclude (to enable type-checking)
2. Add `test/utils/**/*.ts` to tsconfig include (for crypto.test.ts)
3. Fix any type errors that emerge
4. Verify lint passes

## Test Commands
```bash
bun run lint      # Should pass without parsing errors
bun run typecheck # Should pass
bun run bdd:verify # Should pass
```
