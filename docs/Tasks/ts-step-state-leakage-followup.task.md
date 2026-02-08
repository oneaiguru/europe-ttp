# TASK-072: TypeScript Step State Leakage Followup

## Goal
Fix remaining cross-scenario state leakage in TS BDD steps by ensuring all extended context properties are reset between scenarios.

## Refs
- `test/typescript/steps/e2e_api_steps.ts` - Main testContext with extended E2ETestContext properties
- `test/typescript/steps/draft_steps.ts` - Module-level draftContext (already reset via common.ts)
- `test/typescript/steps/common.ts` - Central Before hook for state reset

## Background
TASK-064 addressed state leakage by adding Before hooks in `e2e_api_steps.ts` and `common.ts`. However, the review found that some extended context properties are still not being reset:

**E2ETestContext properties not reset in e2e_api_steps.ts Before hook (lines 111-139):**
- `applicantSubmissions` (Record<string, ApplicantSubmission>)
- `applicantUploads` (Record<string, ApplicantUploads>)
- `currentApplicantEmail` (string)
- `currentApplicantSubmission` (ApplicantSubmission)
- `currentView` (string)

These are used in TASK-E2E-009 evaluator workflow steps (lines 920-1218) but leak across scenarios.

## Acceptance Criteria
- [ ] All `E2ETestContext` extended properties are reset in the `e2e_api_steps.ts` Before hook
- [ ] `bun run bdd:typescript` passes (all scenarios still pass)
- [ ] `bun run bdd:verify` passes (no orphan steps)
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes

## Files to Modify
- [ ] `test/typescript/steps/e2e_api_steps.ts` - Add reset for E2ETestContext extended properties

## Test Commands
```bash
bun run bdd:typescript
bun run bdd:verify
bun run typecheck
bun run lint
```
