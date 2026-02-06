# TASK-053: reduce-test-fallbacks-typescript

## Goal
Stop TypeScript BDD steps from passing when implementation is missing/broken.

## Type
Fix/Hardening - No BDD scenarios required

## Source
docs/review/REVIEW_DRAFTS.md

## Description
TypeScript BDD steps currently have fallback logic that masks real failures. When implementations are missing or broken, steps return fake responses instead of failing, leading to false-green test results.

## Evidence Locations
- `test/typescript/steps/api_steps.ts:83` - Fallback response logic
- `test/typescript/steps/forms_steps.ts:23` - Potential fallback
- `test/typescript/steps/portal_steps.ts:81` - Potential fallback

## Acceptance Criteria
1. Import/runtime failures fail scenarios unless explicit mock mode is enabled
2. Shared state is reset per scenario via `Before` hooks
3. No fake responses that mask missing implementations

## Files to Investigate
- `test/typescript/steps/api_steps.ts`
- `test/typescript/steps/forms_steps.ts`
- `test/typescript/steps/portal_steps.ts`

## Test Commands
```bash
bun run bdd:typescript
bun run typecheck
bun run lint
```

## Status
PENDING - Research required
