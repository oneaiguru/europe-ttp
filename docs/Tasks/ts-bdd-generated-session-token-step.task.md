# TASK-089: ts-bdd-generated-session-token-step

## Goal
Add the missing TypeScript BDD step definition for "I generated a session token for {string}" to match the Python implementation and feature file requirements.

## Feature File
`specs/features/auth/upload_api_auth.feature`

## References
- `test/typescript/steps/auth_steps.ts` - Missing step definition (line ~277-314 for session token steps)
- `test/python/steps/auth_steps.py` - Has the step at line 285-288
- `specs/features/auth/upload_api_auth.feature` - Uses "And I generated a session token..." at line 66
- `test/bdd/step-registry.ts` - Needs to be updated with new step pattern

## Acceptance Criteria
- [ ] TypeScript step `Given('I generated a session token for {string}')` exists in `test/typescript/steps/auth_steps.ts`
- [ ] Step generates a valid session token using `generateSessionToken()` and stores it in `authContext.sessionToken`
- [ ] `bun run bdd:typescript specs/features/auth/upload_api_auth.feature` passes all scenarios
- [ ] `bun run bdd:verify` passes (no orphan steps)
- [ ] `bun run typecheck` passes

## Files to Modify
- [ ] `test/typescript/steps/auth_steps.ts` - Add Given step for "I generated a session token for {string}"

## Test Commands
```bash
bun run bdd:typescript specs/features/auth/upload_api_auth.feature
bun run bdd:verify
bun run typecheck
```
