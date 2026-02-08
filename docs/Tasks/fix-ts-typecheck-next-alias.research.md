# TASK-070: fix-ts-typecheck-next-alias - Research

## Current State

### tsconfig.json (lines 1-25)
- No `paths` alias configuration for `@/` prefix
- `exclude` does NOT include `next` (task description was incorrect)
- `baseUrl` is set to `.`
- `moduleResolution: "bundler"` is configured

### package.json (lines 1-32)
- **No `next` package in dependencies or devDependencies**
- Uses `bun` as engine (>= 1.1.0)
- Only devDependencies: testing tools, ESLint, TypeScript

### Current Type Errors
Running `bun run typecheck` produces:
```
app/api/upload/signed-url/route.ts(18,43): error TS2307: Cannot find module 'next/server' or its corresponding type declarations.
app/api/upload/signed-url/route.ts(19,37): error TS2307: Cannot find module '@/utils/crypto' or its corresponding type declarations.
app/api/upload/verify/route.ts(11,43): error TS2307: Cannot find module 'next/server' or its corresponding type declarations.
app/api/upload/verify/route.ts(12,57): error TS2307: Cannot find module '@/utils/crypto' or its corresponding type declarations.
```

### Affected Files
1. **app/api/upload/signed-url/route.ts** (lines 18-19)
   - Imports: `NextRequest`, `NextResponse` from `next/server`
   - Imports: `generateUploadToken` from `@/utils/crypto`

2. **app/api/upload/verify/route.ts** (lines 11-12)
   - Imports: `NextRequest`, `NextResponse` from `next/server`
   - Imports: `verifyUploadToken`, `isUploadTokenExpired` from `@/utils/crypto`

3. **app/utils/crypto.ts** (lines 1-132)
   - Uses Node.js `crypto` module (line 6)
   - No Next.js dependencies

### Comparison: Working Route
**app/users/upload-form-data/route.ts** (lines 109-154)
- Uses standard Web API types: `Request`, `Response`
- Does NOT use Next.js types
- Type-checks successfully

## Root Cause Analysis

The project is a **Bun-based migration** from Python 2.7 App Engine, NOT a Next.js project:
- The `app/` directory follows Bun's file routing convention, not Next.js App Router
- `package.json` has no `next` dependency
- Existing working route uses standard Web API types

The new upload routes incorrectly:
1. Import from `next/server` (not available)
2. Use Next.js-specific types (`NextRequest`, `NextResponse`)
3. Use `@/` path alias (not configured in tsconfig.json)

## Resolution Options

### Option 1: Use Standard Web API Types (Recommended)
Replace Next.js types with standard Web API types to match the existing working route.

**Changes:**
- `NextRequest` → `Request`
- `NextResponse` → `Response`
- `@/utils/crypto` → relative path `../../utils/crypto`

**Pros:**
- No new dependencies
- Matches existing pattern in `app/users/upload-form-data/route.ts`
- Consistent with Bun runtime

**Cons:**
- Need to update imports in 2 files

### Option 2: Add Next.js as Dependency
Install Next.js and configure tsconfig.json with path aliases.

**Changes:**
- Add `next` to devDependencies
- Add `paths: { "@/*": ["./*"] }` to tsconfig.json
- Keep existing imports

**Pros:**
- No import changes needed

**Cons:**
- Adds ~3MB+ dependency for 2 type imports
- Project is not actually using Next.js framework
- Unnecessary complexity

### Option 3: Install @types/node for Web API Types
Ensure Node.js types are available for Web API.

**Current State:**
- `@types/node: ^20.17.0` is already in devDependencies (package.json:19)
- Web API types should be available

**Conclusion:** Option 1 is the correct approach.

## File References

| File | Lines | Issue |
|------|-------|-------|
| tsconfig.json:1-25 | Missing `paths` configuration | No `@/` alias defined |
| package.json:1-32 | No `next` dependency | Cannot import `next/server` |
| app/api/upload/signed-url/route.ts:18 | `import { NextRequest, NextResponse }` | Module not found |
| app/api/upload/signed-url/route.ts:19 | `import { generateUploadToken } from '@/utils/crypto'` | Path alias not resolved |
| app/api/upload/verify/route.ts:11 | `import { NextRequest, NextResponse }` | Module not found |
| app/api/upload/verify/route.ts:12 | `import { ... } from '@/utils/crypto'` | Path alias not resolved |
| app/users/upload-form-data/route.ts:109-154 | Working example using `Request`/`Response` | Reference for correct pattern |
| app/utils/crypto.ts:1-132 | Utility functions | No issues, target of imports |

## Recommendation

**Use Option 1:** Replace Next.js-specific imports with standard Web API types to match the existing working route pattern.

This aligns with:
1. Project's Bun-based runtime (not Next.js)
2. Existing working route pattern (`app/users/upload-form-data/route.ts`)
3. No additional dependencies required
