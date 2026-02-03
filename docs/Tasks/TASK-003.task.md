# TASK-003: Password Reset

## Goal
Allow a user to request a password reset via the identity provider and see the reset prompt.

## Feature File
`specs/features/auth/password_reset.feature`

## Scenario
Password reset via identity provider

## Legacy Reference
- File: TBD (research needed)
- Lines: TBD

## Step Definitions Required
- When I request a password reset for my Google account → `test/python/steps/auth_steps.py`, `test/typescript/steps/auth_steps.ts`
- Then I should receive a password reset prompt from the identity provider → `test/python/steps/auth_steps.py`, `test/typescript/steps/auth_steps.ts`

## Acceptance Criteria
- [ ] Scenario "Password reset via identity provider" passes (Python)
- [ ] Scenario "Password reset via identity provider" passes (TypeScript)
- [ ] `bun run bdd:verify` passes (no orphan steps)
- [ ] `bun run typecheck` passes
- [ ] docs/coverage_matrix.md updated

## Files to Create/Modify
- [ ] test/bdd/step-registry.ts
- [ ] test/python/steps/auth_steps.py
- [ ] test/typescript/steps/auth_steps.ts
- [ ] specs/features/auth/password_reset.feature (no changes expected)

## Test Commands
```bash
bun run bdd:python specs/features/auth/password_reset.feature
bun run bdd:typescript specs/features/auth/password_reset.feature
bun run bdd:verify
```
