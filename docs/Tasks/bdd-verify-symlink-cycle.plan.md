# TASK-061: bdd-verify-symlink-cycle - Implementation Plan

## Summary
Fix the `walk()` function in `scripts/bdd/verify-alignment.ts` to use `lstatSync()` instead of `statSync()`, preventing symlink cycles, repo escapes, and crashes from broken symlinks.

## Implementation Steps

### Step 1: Update import statement
**File:** `scripts/bdd/verify-alignment.ts:1`
- Change: `import { readdirSync, readFileSync, statSync } from 'fs';`
- To: `import { lstatSync, readdirSync, readFileSync } from 'fs';`

### Step 2: Replace `statSync` with `lstatSync` in `walk()` function
**File:** `scripts/bdd/verify-alignment.ts:14`
- Change: `const stat = statSync(full);`
- To: `const stat = lstatSync(full);`

**Effect:** `lstatSync()` does NOT follow symlinks, so:
- Symlinked directories are treated as symlinks (not directories), not recursed into
- Symlinked files are treated as symlinks (not files), not processed
- Broken symlinks return `isSymbolicLink()` = true, safe to ignore

### Step 3: Add documentation comment
**File:** `scripts/bdd/verify-alignment.ts:9`
- Add a comment above `walk()` function explaining symlink handling:
```typescript
/**
 * Walk a directory tree and return all .feature files.
 * Uses lstatSync() to avoid following symlinks, preventing:
 * - Infinite loops from symlink cycles
 * - Escaping the repo via parent directory symlinks
 * - Crashes from broken symlinks
 */
function walk(dir: string): string[] {
```

## Verification Commands

```bash
# Verify normal operation still works
bun run bdd:verify

# Test with symlink cycle (should not hang)
cd specs/features && ln -s ../test test_cycle && bun run bdd:verify && rm test_cycle

# Test with broken symlink (should not crash)
ln -s /nonexistent specs/features/broken_link && bun run bdd:verify && rm specs/features/broken_link
```

## Files to Change

1. `scripts/bdd/verify-alignment.ts` - 3 changes:
   - Import: Add `lstatSync`, remove `statSync`
   - Line 14: Replace `statSync` with `lstatSync`
   - Line 9: Add JSDoc comment documenting symlink handling

## Risks

| Risk | Mitigation |
|------|------------|
| Breaking existing functionality if `.feature` files are behind symlinks | Unlikely - the existing symlink `specs/features/steps` points to a file, not a directory, so `.feature` files are not affected |
| Performance regression | `lstatSync()` is equivalent to `statSync()` in performance |

## Rollback

If issues arise, revert to `statSync()` by:
1. Restoring import: `statSync` instead of `lstatSync`
2. Restoring line 14: `statSync(full)` instead of `lstatSync(full)`
3. Removing the JSDoc comment

## Success Criteria

1. `bun run bdd:verify` passes (existing behavior preserved)
2. Symlink cycles do not cause infinite loops
3. Broken symlinks do not crash the script
4. Code comment documents the symlink handling behavior
