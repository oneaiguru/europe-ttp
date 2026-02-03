# TASK-E2E-006: Deadline Enforcement and Whitelist Override

## Goal
Ensure expired TTC options are rejected when test mode is disabled for applicants submitting via API.

## Feature File
`specs/features/e2e/deadline_and_whitelist_override.feature`

## Scenario
Applicant blocked when TTC option is expired

## Legacy Reference
- File: TBD (research needed)
- Lines: TBD

## Step Definitions Required
- Given test mode is disabled (real deadline enforcement) → `test/python/steps/e2e_api_steps.py`, `test/typescript/steps/e2e_api_steps.ts`
- And TTC option "test_expired" has display_until in the past → `test/python/steps/e2e_api_steps.py`, `test/typescript/steps/e2e_api_steps.ts`
- And I am authenticated as applicant with email "test.applicant@example.com" → `test/python/steps/e2e_api_steps.py`, `test/typescript/steps/e2e_api_steps.ts`
- And I navigate to the TTC application form → `test/python/steps/e2e_api_steps.py`, `test/typescript/steps/e2e_api_steps.ts`
- When I attempt to submit TTC application via API for "test_expired" → `test/python/steps/e2e_api_steps.py`, `test/typescript/steps/e2e_api_steps.ts`
- Then the submission should be rejected with deadline error → `test/python/steps/e2e_api_steps.py`, `test/typescript/steps/e2e_api_steps.ts`
- And the form should not be marked as submitted → `test/python/steps/e2e_api_steps.py`, `test/typescript/steps/e2e_api_steps.ts`

## Acceptance Criteria
- [ ] Scenario "Applicant blocked when TTC option is expired" passes (Python)
- [ ] Scenario "Applicant blocked when TTC option is expired" passes (TypeScript)
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
