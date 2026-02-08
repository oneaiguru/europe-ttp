# TASK-083: bdd-verify-deterministic-output

## Goal
Ensure the BDD verify-alignment script produces deterministic, consistent output regardless of environment factors like file system ordering, clock time, or random values.

## Refs
- `scripts/bdd/verify-alignment.ts`

## Context
The verify-alignment.ts script checks parity between Python and TypeScript BDD step definitions. Non-deterministic output can cause:
- False positives in CI (different runs show different results)
- Diff noise when reviewing changes
- Hard-to-debug intermittent failures

## Acceptance Criteria
- [ ] Script output order is deterministic (e.g., sorted by file/path)
- [ ] No timestamps or random values in output
- [ ] Multiple runs on same input produce identical output
- [ ] `bun run bdd:verify` passes consistently

## Files to Inspect
- `scripts/bdd/verify-alignment.ts`

## Test Commands
```bash
# Run twice and compare output
bun run bdd:verify > /tmp/run1.txt
bun run bdd:verify > /tmp/run2.txt
diff /tmp/run1.txt /tmp/run2.txt

# Should exit with 0 (no differences)
```
