# TASK-096: bdd-verify-detect-overlapping-patterns

## Goal
Add detection to `verify-alignment.ts` for overlapping step patterns that could cause ambiguous step matching at runtime.

## References
- File: `scripts/bdd/verify-alignment.ts`
- Related: `test/bdd/step-registry.ts`

## Problem Statement
The BDD step alignment verifier currently checks for orphan steps and missing implementations, but does not detect overlapping step patterns. Overlapping patterns (e.g., `I click on {string}` and `I click on {string} button`) can cause:
- Ambiguous step matching at runtime
- Non-deterministic behavior
- Hard-to-debug failures when Cucumber/behave picks the wrong step

## Acceptance Criteria
- [ ] Add pattern overlap detection to `verify-alignment.ts`
- [ ] Detect cases where multiple step patterns could match the same Gherkin step text
- [ ] Report overlapping patterns with file:line references
- [ ] Test the detection with a fixture containing intentional overlaps
- [ ] `bun run bdd:verify` passes with no false positives
- [ ] `bun run typecheck` passes

## Files to Create/Modify
- [ ] `scripts/bdd/verify-alignment.ts` - Add overlap detection logic
- [ ] `test/fixtures/` (potentially) - Add test fixture with overlapping patterns

## Test Commands
```bash
bun run bdd:verify
bun run typecheck
```

## Notes
- Pattern overlap is a known issue in BDD frameworks (Cucumber/behave)
- The verifier should be conservative: only flag definite overlaps, not potential ones
- Consider edge cases: placeholders ({string}, {int}, etc.), wildcards, regex special chars
