# TASK-063: bdd-verify-placeholder-semantics

## Goal
Align placeholder fallback matching with Cucumber expression semantics to avoid false dead-step reports.

## Feature File
N/A - This is a tooling/infrastructure task for BDD verification

## Legacy Reference
- N/A - New tooling

## Step Definitions Required
- N/A - Tooling task

## Acceptance Criteria
1. `{string}` matches common quoted forms (single and double quotes) consistently with the step registry patterns.
2. `{int}` and `{float}` accept negative values and common float formats (e.g., `-1`, `-1.5`, `0.5`).
3. Placeholder matching remains deterministic across repeated matches.

## Files to Create/Modify
- `scripts/bdd/verify-alignment.ts` - Update placeholder matching logic

## Test Commands
```bash
bun run bdd:verify
```

## Evidence
- `scripts/bdd/verify-alignment.ts:52-60`
