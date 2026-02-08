# TASK-080: tighten-ts-bdd-step-assertions

## Goal
Add meaningful assertions to TypeScript BDD steps that currently lack proper validation or have tautological/weak assertions, ensuring test failures are detected.

## Refs
- `test/typescript/steps/uploads_steps.ts`
- `test/typescript/steps/form_prerequisites_steps.ts`
- `test/typescript/steps/e2e_api_steps.ts`

## Context
From the review backlog (`docs/review/REVIEW_DRAFTS.md`), several TypeScript BDD steps were identified as having weak or missing assertions:
1. Some `Then` steps only set state without asserting
2. Some steps have tautological assertions (always pass)
3. Some steps lack error message validation

## Acceptance Criteria
- [ ] All `Then` steps in referenced files have meaningful assertions
- [ ] No steps merely set state without validating expected conditions
- [ ] Error messages are validated where applicable
- [ ] `bun run bdd:verify` passes (no orphan steps)
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes

## Files to Create/Modify
- [ ] `test/typescript/steps/uploads_steps.ts` - Review and tighten assertions
- [ ] `test/typescript/steps/form_prerequisites_steps.ts` - Review and tighten assertions
- [ ] `test/typescript/steps/e2e_api_steps.ts` - Review and tighten assertions

## Test Commands
```bash
bun run bdd:verify
bun run bdd:typescript specs/features/uploads/*.feature
bun run bdd:typescript specs/features/e2e/*.feature
bun run typecheck
bun run lint
```
