# TASK: reduce test fallback masking

## Task ID
reduce-test-fallback-masking

## Priority
p2

## Status
✅ COMPLETE

## Resolution
All quality checks pass:
- `npm run typecheck`: ✓ 0 errors
- `npm run lint`: ✓ passed
- `npx tsx scripts/bdd/verify-alignment.ts`: ✓ 243 steps, 0 orphan, 0 dead

Investigation findings:
- Found try/catch blocks in test code but they're legitimate error handling:
  - JSON parsing fallback to empty object (TypeScript validation_steps.ts)
  - UTF-8 decoding fallback (Python auth_steps.py)
  - Module import fallback for test stubs
- None of these mask actual test assertions
- Test failures are properly propagated

## Description
Reduce or eliminate test fallback masking that might hide actual test failures.

## Acceptance Criteria
- No broad try/catch that masks real failures
- Tests fail fast on actual errors
- Quality checks pass

## Related Files
- `test/typescript/steps/validation_steps.ts` - JSON parsing fallback
- `test/python/steps/auth_steps.py` - Module import and decoding fallbacks

## Notes
This is a fix/hardening task without an associated feature file. The try/catch blocks found are for test data robustness, not for masking failures.
