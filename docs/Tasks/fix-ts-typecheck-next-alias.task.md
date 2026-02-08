# TASK-070: fix-ts-typecheck-next-alias

## Goal
Fix TypeScript typecheck errors related to the Next.js `next` alias and path resolution in tsconfig.json and API routes.

## References
- `tsconfig.json`
- `package.json`
- `app/api/upload/signed-url/route.ts`
- `app/api/upload/verify/route.ts`
- `app/utils/crypto.ts`

## Problem Description
TypeScript typecheck is failing due to `next` module resolution issues. The tsconfig.json has `next` in its exclude list and may have incorrect path alias configuration, causing type errors in API routes that use Next.js types.

## Acceptance Criteria
- [ ] `bun run typecheck` passes with no errors
- [ ] `next` module imports resolve correctly
- [ ] Path aliases are properly configured in tsconfig.json
- [ ] All API routes type-check successfully
- [ ] `bun run lint` passes

## Files to Modify
- [ ] `tsconfig.json` - Fix paths/excludes for `next`
- [ ] `app/api/upload/signed-url/route.ts` - May need import adjustments
- [ ] `app/api/upload/verify/route.ts` - May need import adjustments
- [ ] `app/utils/crypto.ts` - May need import adjustments

## Test Commands
```bash
bun run typecheck
bun run lint
```

## Risk/Rollback
- Low risk: tsconfig changes are configuration-only
- If path aliases break imports, revert tsconfig.json changes
- Keep backup of current tsconfig.json before modifying
