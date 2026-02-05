# TASK-FIX-005: Fix Step Registry Build Synchronization

## Task ID
TASK-FIX-005

## Task Name
fix-step-registry-build-sync

## Priority
p1 (Blocking - alignment check fails)

## Status
TODO

## Goal
Ensure `step-registry.js` is kept in sync with `step-registry.ts` so that the alignment verification passes.

## Problem Statement
The `test/bdd/step-registry.js` file is stale (last updated Feb 5 01:14) while `test/bdd/step-registry.ts` is the source of truth (last updated Feb 5 12:44). The verification script `scripts/bdd/verify-alignment.js` imports the `.js` version, causing it to report 14 "dead steps" that actually exist in the `.ts` registry.

Current error output:
```
Dead steps (in features, not matched in registry): 14
  - I have a registry entry with placeholder but no pattern
  - the alignment check runs
  - the step should match correctly
  - test placeholder step with value "example value"
  - I request a signed upload URL without authentication
  - I should receive a 401 error
  - no signed URL should be generated
  - I request a signed URL with filepath "../../etc/passwd"
  - I should receive a 400 error
  - the error should mention "Invalid filepath"
  - I request a signed URL with content type "application/exe"
  - the error should mention "Invalid content type"
  - I request a signed URL with content type "image/jpeg"
  - the signed URL should expire within 15 minutes
```

All of these steps ARE defined in `step-registry.ts` but not in the stale `step-registry.js`.

## Affected Files
- `test/bdd/step-registry.ts` - Source of truth (231 steps)
- `test/bdd/step-registry.js` - Stale output (missing steps)
- `scripts/bdd/verify-alignment.js` - Imports the .js file

## Acceptance Criteria
1. `bun scripts/bdd/verify-alignment.ts` passes with 0 orphan, 0 dead steps
2. Build process automatically syncs .js from .ts, OR verification script uses .ts directly
3. All 231 steps from .ts registry are available to verification script

## Solution Options
1. **Build step**: Add TypeScript compilation step to generate .js from .ts
2. **Direct import**: Update verify-alignment.js to import the .ts file directly (requires tsx/loader)
3. **Use tsx**: Change scripts to use tsx which can execute .ts directly

## Related Files
- `test/bdd/step-registry.ts:1-1471` - Source registry
- `test/bdd/step-registry.js:1-1398` - Stale compiled output
- `scripts/bdd/verify-alignment.js:3` - Imports from .js
- `specs/features/uploads/upload_security.feature` - Feature with dead steps
- `specs/features/test/placeholder_matching.feature` - Feature with dead steps
