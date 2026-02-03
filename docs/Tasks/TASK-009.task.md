# TASK-009: Admin Reports Pages

## Goal
Allow an admin user to open the reports list page and see the available report pages.

## Feature File
`specs/features/admin/reports_pages.feature`

## Scenario
Admin opens report pages

## Legacy Reference
- File: TBD (research needed)
- Lines: TBD

## Step Definitions Required
- When I open the admin reports list page → `test/python/steps/admin_steps.py`, `test/typescript/steps/admin_steps.ts`
- Then I should see the list of available report pages → `test/python/steps/admin_steps.py`, `test/typescript/steps/admin_steps.ts`

## Acceptance Criteria
- [ ] Scenario "Admin opens report pages" passes (Python)
- [ ] Scenario "Admin opens report pages" passes (TypeScript)
- [ ] `bun run bdd:verify` passes (no orphan steps)
- [ ] `bun run typecheck` passes
- [ ] docs/coverage_matrix.md updated

## Files to Create/Modify
- [ ] test/bdd/step-registry.ts
- [ ] test/python/steps/admin_steps.py
- [ ] test/typescript/steps/admin_steps.ts
- [ ] specs/features/admin/reports_pages.feature (no changes expected)

## Test Commands
```bash
bun run bdd:python specs/features/admin/reports_pages.feature
bun run bdd:typescript specs/features/admin/reports_pages.feature
bun run bdd:verify
```
