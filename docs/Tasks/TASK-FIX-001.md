# TASK-FIX-001: Fix TypeScript Type Errors

## Task Definition

**ID**: TASK-FIX-001
**Name**: Fix TypeScript Type Errors
**Priority**: p1 (Blocking - typecheck must pass)
**Type**: Bug Fix
**Status**: IN PROGRESS

## Problem

TypeScript compilation fails with 12 type errors:

```
app/api/reports/participant-list/route.ts(1,43):
  error TS2307: Cannot find module 'next/server' or its corresponding type declarations.

test/typescript/steps/draft_steps.ts(18,3):
  error TS2740: Type '{}' is missing properties from World state

test/typescript/steps/integrity_steps.ts:
  - Multiple TS2538, TS2532, TS18048 errors (undefined/possible undefined issues)
```

## Files to Fix

1. `app/api/reports/participant-list/route.ts` - Missing `next/server` import
2. `test/typescript/steps/draft_steps.ts` - World state initialization
3. `test/typescript/steps/integrity_steps.ts` - Undefined handling

## Acceptance Criteria

- [ ] `bun run typecheck` passes with no errors
- [ ] `bun run lint` continues to pass
- [ ] Python BDD tests continue to pass (93 scenarios)
- [ ] TypeScript BDD tests continue to pass (93 scenarios)
- [ ] `verify-alignment.js` passes (0 orphan, 0 dead)

## Context

All BDD scenarios pass in both Python and TypeScript:
- Python: 48 features, 93 scenarios, 420 steps - all passed
- TypeScript: 93 scenarios, 420 steps - all passed
- Alignment: 231 steps defined, 0 orphan, 0 dead

However, typecheck failures block the completion of the build loop.

## Previous Work (Python BDD Fixes)

This task file previously addressed Python BDD test failures, which are now resolved:
- Removed temporary test features
- Fixed urllib Python 3 compatibility
- Enhanced mock reporting client
- Fixed form data upload test expectation
