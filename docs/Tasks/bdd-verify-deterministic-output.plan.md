# TASK-083: bdd-verify-deterministic-output - Implementation Plan

## Summary
Add `.sort()` to `readdirSync()` result in the `walk()` function to guarantee deterministic file traversal order across different filesystems and environments.

## Change Required

### File: `scripts/bdd/verify-alignment.ts`

**Line 17:** Sort the directory entries to ensure deterministic traversal order.

```typescript
// Before:
const entries = readdirSync(dir);

// After:
const entries = readdirSync(dir).sort();
```

**Rationale:**
- Node.js `fs.readdirSync()` does not guarantee ordering (filesystem-dependent)
- The `walk()` function recursively discovers `.feature` files
- While `featureSteps` is a Set (insertion order), and the success message only shows counts
- Error messages list `deadSteps` in the order they were discovered
- Sorting guarantees consistent error output order across runs/filesystems

## Implementation Steps

1. Add `.sort()` to `readdirSync()` at line 17

2. Verify the fix:
   ```bash
   # Run twice and compare output
   bun run bdd:verify > /tmp/run1.txt
   bun run bdd:verify > /tmp/run2.txt
   diff /tmp/run1.txt /tmp/run2.txt
   # Should exit with 0 (no differences)
   ```

3. Run full verification:
   ```bash
   bun run bdd:verify
   bun run typecheck
   bun run lint
   ```

## Tests to Run

```bash
# Determinism test (should have no diff)
bun run bdd:verify > /tmp/run1.txt
bun run bdd:verify > /tmp/run2.txt
diff /tmp/run1.txt /tmp/run2.txt

# Standard verification
bun run bdd:verify
bun run typecheck
bun run lint
```

## Risks / Rollback

**Risk Level:** LOW

**Why Low:**
- Adding `.sort()` is a purely additive change
- Does not change logic, only ordering
- Default string sort is deterministic and sufficient for paths
- No performance impact (sorting ~10-20 entries per directory is negligible)

**Rollback:**
- Remove `.sort()` from line 17
- No other files affected

## Acceptance Criteria Verification

After implementation, verify:
- [ ] Script output order is deterministic (sorted by filesystem traversal)
- [ ] No timestamps or random values in output (already true, verified)
- [ ] Multiple runs on same input produce identical output (verified via diff test)
- [ ] `bun run bdd:verify` passes consistently

## Notes

- This is a **hardening measure** - the script is effectively deterministic for its primary use case (CI validation) since success messages only show counts
- The fix ensures error message output order is also deterministic should any errors occur in the future
- JavaScript's default `Array.prototype.sort()` uses lexicographic string comparison, which is appropriate for file paths
