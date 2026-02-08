# TASK-061: bdd-verify-symlink-cycle

## Goal
Prevent `bun run bdd:verify` from hanging or escaping the repo when feature directories contain symlink cycles or unreadable paths.

## Legacy Reference
- File: `scripts/bdd/verify-alignment.ts`
- Lines: 9-20 (feature walker logic)

## Review Reference
- `docs/review/REVIEW_DRAFTS.md` - "bdd-verify-symlink-cycle" entry

## Acceptance Criteria
1. The feature walker in `verify-alignment.ts` does not follow symlinked directories (uses `lstat`, or tracks visited realpaths/inodes).
2. Broken symlinks or unreadable paths do not crash the verifier (skip with warning or fail with a clear error).
3. `bun run bdd:verify` passes without hanging.
4. A small test or comment documents the symlink handling behavior.

## Files to Create/Modify
- [ ] `scripts/bdd/verify-alignment.ts` - Update feature walker to handle symlinks safely
- [ ] `docs/Tasks/bdd-verify-symlink-cycle.research.md` - Research findings
- [ ] `docs/Tasks/bdd-verify-symlink-cycle.plan.md` - Implementation plan

## Test Commands
```bash
# After implementation, verify that the script handles symlinks correctly
bun run bdd:verify

# Test with a symlink cycle (manual test)
ln -s ../specs specs/features/test_cycle && bun run bdd:verify && rm specs/features/test_cycle
```

## Notes
From `docs/review/REVIEW_DRAFTS.md`:
> Goal: Prevent `bdd:verify` from hanging or escaping the repo when feature directories contain symlink cycles.
>
> Acceptance Criteria:
> 1. The feature walker does not follow symlinked directories (use `lstat`, or track visited realpaths/inodes).
> 2. Broken symlinks or unreadable paths do not crash the verifier (skip with warning or fail with a clear error).
>
> Evidence: `scripts/bdd/verify-alignment.ts:9-20`
