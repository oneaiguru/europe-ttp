# TASK-E2E-006B: Deadline Whitelist Override - Whitelisted Applicant Submits Past Deadline

## Goal
Ensure a whitelisted applicant can submit after the deadline and that whitelist checks target the applicant (not the current admin user).

## Feature File
`specs/features/e2e/deadline_and_whitelist_override.feature`

## Scenario
Whitelisted applicant can submit past deadline

## Legacy Reference
- File: TBD (research needed)
- Lines: TBD

## Step Definitions Required
- Then the user should be in the whitelist config → `test/python/steps/e2e_api_steps.py`, `test/typescript/steps/e2e_api_steps.ts`
- And the applicant should be able to submit within grace period → `test/python/steps/e2e_api_steps.py`, `test/typescript/steps/e2e_api_steps.ts`

## Acceptance Criteria
- [ ] Scenario "Whitelisted applicant can submit past deadline" passes (Python)
- [ ] Scenario "Whitelisted applicant can submit past deadline" passes (TypeScript)
- [ ] `bun run bdd:verify` passes (no orphan steps)
- [ ] `bun run typecheck` passes
- [ ] docs/coverage_matrix.md updated

## Files to Create/Modify
- [ ] test/bdd/step-registry.ts
- [ ] test/python/steps/e2e_api_steps.py
- [ ] test/typescript/steps/e2e_api_steps.ts
- [ ] specs/features/e2e/deadline_and_whitelist_override.feature (no changes expected)

## Test Commands
```bash
bun run bdd:python specs/features/e2e/deadline_and_whitelist_override.feature
bun run bdd:typescript specs/features/e2e/deadline_and_whitelist_override.feature
bun run bdd:verify
```
