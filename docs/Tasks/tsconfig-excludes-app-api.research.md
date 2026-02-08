# TASK-068: tsconfig-excludes-app-api - Research

## Current State

### Evidence 1: tsconfig.json excludes app/api
File: `tsconfig.json:14`
```json
"exclude": ["node_modules", "test/typescript/node_modules", "app/api"]
```

The `app/api` directory is excluded from TypeScript type checking. This means any type errors in API routes are silently ignored, creating a false-green typecheck result.

### Evidence 2: API routes exist that should be typechecked
Files:
- `app/api/upload/signed-url/route.ts` (122 lines)
- `app/api/upload/verify/route.ts` (83 lines)
- `app/utils/crypto.ts` (132 lines) - utility imported by API routes

### Evidence 3: Type errors exist when app/api is included
When the exclusion is removed from `tsconfig.json`, `bun run typecheck` reports:

```
app/api/upload/signed-url/route.ts(18,43): error TS2307: Cannot find module 'next/server' or its corresponding type declarations.
app/api/upload/signed-url/route.ts(19,37): error TS2307: Cannot find module '@/utils/crypto' or its corresponding type declarations.
app/api/upload/verify/route.ts(11,43): error TS2307: Cannot find module 'next/server' or its corresponding type declarations.
app/api/upload/verify/route.ts(12,57): error TS2307: Cannot find module '@/utils/crypto' or its corresponding type declarations.
```

### Evidence 4: Missing module resolution configuration
The `tsconfig.json` lacks:
- `baseUrl` configuration (needed for `@/` path aliases)
- `paths` mapping for `@/*` to `app/*`
- Dependencies for `next/server` types

Current imports in API routes:
- Line 18 of `app/api/upload/signed-url/route.ts`: `import { NextRequest, NextResponse } from 'next/server';`
- Line 19 of `app/api/upload/signed-url/route.ts`: `import { generateUploadToken } from '@/utils/crypto';`

### Evidence 5: next package not installed
```bash
$ ls node_modules/next
# No output - next is not in dependencies or devDependencies
```

The `package.json` contains only devDependencies for testing (`@cucumber/cucumber`, `@playwright/test`, `typescript`, etc.) but not `next`.

## Root Cause Analysis

1. **Primary Issue**: The `app/api` exclusion was likely added to suppress type errors during initial development, but this creates a false-green CI where type errors in API routes go undetected.

2. **Secondary Issues Blocking Inclusion**:
   - Missing `next` dependency (no type declarations for `next/server`)
   - Missing `baseUrl` in `tsconfig.json` for `@/` path resolution
   - The project appears to be in a migration state (Python 2.7 App Engine → Bun + Next.js) with incomplete Next.js setup

## Constraints

1. **Legacy is read-only** - Python 2.7 files in repo root cannot be modified
2. **BDD+CE methodology** - Tests must be written first (RED phase)
3. **Acceptance criteria require**:
   - `bun run typecheck` fails on type errors in `app/api/**`
   - Existing typecheck remains passing (no regressions)
   - `bun run bdd:verify` passes (no orphan steps)

## Decision Points for Planning

1. **Approach A: Remove exclusion + add baseUrl**
   - Add `"baseUrl": "."` to `tsconfig.json`
   - Remove `app/api` from exclude array
   - Result: Type errors for `next/server` will appear (expected red)

2. **Approach B: Create dedicated typecheck config**
   - Create `tsconfig.typecheck.json` that includes app/api
   - Add `baseUrl` and potentially `paths` mappings
   - Keep main `tsconfig.json` for development compatibility

3. **Approach C: Install next as devDependency**
   - Add `next` and `@types/react` to devDependencies
   - Configure `baseUrl` in tsconfig
   - Remove exclusion

Given the project state ("Europe TTP Migration: Python 2.7 App Engine → Bun + Next.js 15"), Approach A seems most aligned - the exclusion is hiding real issues that should be addressed as part of the migration.

## Related Tasks

From `docs/review/REVIEW_DRAFTS.md`, this task is part of addressing "false-green typechecks" alongside:
- `tsconfig-missing-test-bdd` (already addressed - test/bdd was added to include)
- `eslint-coverage-gaps` (pending)

## File References

- `tsconfig.json:14` - Current exclusion of app/api
- `app/api/upload/signed-url/route.ts:18-19` - Import statements causing type errors
- `app/api/upload/verify/route.ts:11-12` - Import statements causing type errors
- `app/utils/crypto.ts:1-132` - Utility module imported by API routes
- `package.json:15-32` - Dependencies (no `next` package)
