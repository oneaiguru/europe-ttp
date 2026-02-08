# TASK-081: bdd-verify-detect-ambiguous-steps

## Goal
Detect and report ambiguous step patterns in the BDD step registry where multiple step definitions could match the same feature file step.

## Feature File
N/A - This is a tooling/infrastructure task for BDD verification

## Legacy Reference
- N/A - New tooling

## Step Definitions Required
- N/A - Tooling task

## Acceptance Criteria
1. The verify-alignment.ts script detects when multiple registry patterns could match the same feature step
2. Ambiguous matches are reported with clear error output listing all conflicting patterns
3. The verification fails with non-zero exit code when ambiguities are detected
4. Existing unambiguous steps continue to pass verification

## Files to Create/Modify
- `scripts/bdd/verify-alignment.ts` - Add ambiguity detection logic
- `test/bdd/step-registry.ts` - May need updates if patterns are identified as ambiguous

## Test Commands
```bash
bun run bdd:verify
```

## Evidence
- `scripts/bdd/verify-alignment.ts:1-164` - Current verification logic
- `test/bdd/step-registry.ts:1-5000+` - Step registry with all defined patterns
