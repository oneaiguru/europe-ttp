# TASK-010: Admin Settings

## Goal
Allow an admin user to open the admin settings page and see the settings content.

## Feature File
`specs/features/admin/settings.feature`

## Scenario
Admin opens settings page

## Legacy Reference
- File: TBD (research needed)
- Lines: TBD

## Step Definitions Required
- When I open the admin settings page → `test/python/steps/admin_steps.py`, `test/typescript/steps/admin_steps.ts`
- Then I should see the admin settings content → `test/python/steps/admin_steps.py`, `test/typescript/steps/admin_steps.ts`

## Acceptance Criteria
- [ ] Scenario "Admin opens settings page" passes (Python)
- [ ] Scenario "Admin opens settings page" passes (TypeScript)
- [ ] `bun run bdd:verify` passes (no orphan steps)
- [ ] `bun run typecheck` passes
- [ ] docs/coverage_matrix.md updated

## Files to Create/Modify
- [ ] test/bdd/step-registry.ts
- [ ] test/python/steps/admin_steps.py
- [ ] test/typescript/steps/admin_steps.ts
- [ ] specs/features/admin/settings.feature (no changes expected)

## Test Commands
```bash
bun run bdd:python specs/features/admin/settings.feature
bun run bdd:typescript specs/features/admin/settings.feature
bun run bdd:verify
```
