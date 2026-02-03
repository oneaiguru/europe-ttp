# TASK-024: Upload Form API

## Goal
Allow an authenticated user to submit form data via the upload form API and receive an accepted response.

## Feature File
`specs/features/api/upload_form.feature`

## Scenario
Submit form data via API

## Legacy Reference
- File: TBD (research needed)
- Lines: TBD

## Step Definitions Required
- When I submit form data to the upload form API → `test/python/steps/api_steps.py`, `test/typescript/steps/api_steps.ts`
- Then the API should accept the form submission → `test/python/steps/api_steps.py`, `test/typescript/steps/api_steps.ts`

## Acceptance Criteria
- [ ] Scenario "Submit form data via API" passes (Python)
- [ ] Scenario "Submit form data via API" passes (TypeScript)
- [ ] `bun run bdd:verify` passes (no orphan steps)
- [ ] `bun run typecheck` passes
- [ ] docs/coverage_matrix.md updated

## Files to Create/Modify
- [ ] test/bdd/step-registry.ts
- [ ] test/python/steps/api_steps.py
- [ ] test/typescript/steps/api_steps.ts
- [ ] specs/features/api/upload_form.feature (no changes expected)

## Test Commands
```bash
bun run bdd:python specs/features/api/upload_form.feature
bun run bdd:typescript specs/features/api/upload_form.feature
bun run bdd:verify
```
