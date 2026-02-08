# TASK-068: tsconfig-excludes-app-api

## Goal
Prevent false-green typechecks for server/API code by including `app/api` in TypeScript typechecking.

## References
- File: `tsconfig.json`
- Review: `docs/review/REVIEW_DRAFTS.md`

## Acceptance Criteria
1. `bun run typecheck` fails on type errors in `app/api/**` (either by including it in `tsconfig.json` or using a dedicated typecheck config).
2. Existing typecheck remains passing (no regressions).
3. `bun run bdd:verify` passes (no orphan steps).

## Files to Create/Modify
- [ ] `tsconfig.json` - Remove `app/api` from exclude array

## Test Commands
```bash
bun run typecheck
bun run bdd:verify
```

## Evidence Locations
- `tsconfig.json:14` - Currently excludes `app/api`
