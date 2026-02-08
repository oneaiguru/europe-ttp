# TASK-070: fix-ts-typecheck-next-alias - Implementation Plan

## Summary
Replace Next.js-specific imports (`NextRequest`, `NextResponse`, `next/server`) with standard Web API types (`Request`, `Response`) in upload API routes to match the existing working route pattern. Convert `@/` path aliases to relative imports.

## Implementation Steps

### Step 1: Fix `app/api/upload/signed-url/route.ts`
1. Replace `import { NextRequest, NextResponse } from 'next/server'` with `import { Request } from 'bun'` (or no import needed for standard Web API)
2. Replace `import { generateUploadToken } from '@/utils/crypto'` with relative path: `import { generateUploadToken } from '../../utils/crypto'`
3. Update function signature:
   - `export async function POST(request: NextRequest)` → `export async function POST(request: Request)`
4. Update response handling:
   - `NextResponse.json()` → `new Response(JSON.stringify(...), { headers: { 'Content-Type': 'application/json' } })`
   - Or use `Response.json()` if available in Bun

### Step 2: Fix `app/api/upload/verify/route.ts`
1. Replace `import { NextRequest, NextResponse } from 'next/server'` with standard Web API types
2. Replace `import { verifyUploadToken, isUploadTokenExpired } from '@/utils/crypto'` with `import { verifyUploadToken, isUploadTokenExpired } from '../../utils/crypto'`
3. Update function signature and response handling same as Step 1

### Step 3: Verify TypeScript Configuration
1. Confirm `tsconfig.json` does not need `paths` configuration (we're using relative imports)
2. Verify `@types/node` is in devDependencies (already present per research)

### Step 4: Run Verification Commands
```bash
bun run typecheck  # Must pass with no errors
bun run lint       # Must pass
bun run bdd:verify # Ensure BDD step registry still aligned
```

## Files to Change
| File | Lines | Change |
|------|-------|--------|
| app/api/upload/signed-url/route.ts | 18-19 | Replace imports with relative paths |
| app/api/upload/signed-url/route.ts | 23 | Update function signature type |
| app/api/upload/signed-url/route.ts | 41, 47, 53, 59 | Replace `NextResponse.json()` with `Response.json()` |
| app/api/upload/verify/route.ts | 11-12 | Replace imports with relative paths |
| app/api/upload/verify/route.ts | 14 | Update function signature type |
| app/api/upload/verify/route.ts | 35, 44, 48, 54 | Replace `NextResponse.json()` with `Response.json()` |

## Reference Pattern
**app/users/upload-form-data/route.ts:109-154** - Working example using standard `Request`/`Response` types with Bun.

## Risks / Rollback
| Risk | Mitigation |
|------|------------|
| Response.json() may not be available in Bun | Test with `bun run typecheck` first; if unavailable, use `new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })` |
| Runtime behavior changes | The HTTP API behavior should be identical; verify with BDD tests |
| Import path errors | Use correct relative paths: `app/api/upload/` → `../../utils/crypto` |

## Rollback Plan
If issues occur:
1. Revert changes to both route files
2. Restore original `next/server` and `@/` imports
3. Consider alternative approach (add Next.js as devDependency)

## Acceptance Criteria Verification
After implementation, verify:
- [ ] `bun run typecheck` passes with no errors
- [ ] `bun run lint` passes
- [ ] `bun run bdd:verify` passes
- [ ] No `next/server` imports remain in codebase
- [ ] No `@/` path aliases remain in codebase (unless tsconfig paths added later)
