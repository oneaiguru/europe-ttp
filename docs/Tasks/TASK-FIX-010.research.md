# TASK-FIX-010: Research Findings

## Current Implementation Analysis

### run-typescript.ts (lines 21-31)
```typescript
const nodeModulesReal = await realpath(path.join(PROJECT_ROOT, 'node_modules')).catch(() => '');
if (nodeModulesReal) {
  const nestedNodeModules = path.join(nodeModulesReal, 'node_modules');
  try {
    await lstat(nestedNodeModules);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      await symlink(nodeModulesReal, nestedNodeModules, 'dir');
    }
  }
}
```

**What it does:**
1. Resolves the real path of `node_modules` (in case it's a symlink, as with bun)
2. Creates a nested symlink `node_modules/node_modules` pointing to itself
3. This creates a filesystem cycle

**Why it was added:**
This was likely a workaround for Node.js module resolution issues when using bun's symlinked node_modules with tsx/cucumber.

## Key Findings

1. **Tests pass without the nested symlink** - Verified by running `bun scripts/bdd/run-typescript.ts` after removing the symlink:
   - All 99 scenarios passed
   - All 441 steps passed
   - No errors or missing modules

2. **The workaround is obsolete** - Current versions of bun, tsx, and cucumber handle module resolution correctly without this workaround.

3. **Filesystem cycles are problematic** - The nested symlink creates:
   - A confusing filesystem structure
   - Potential infinite loops for tools that traverse directories
   - Issues with backup/sync tools

4. **The symlink is auto-created by the script** - Every time the script runs, it recreates the symlink if missing. This means:
   - Manually deleting it doesn't help
   - The code must be removed to permanently eliminate the cycle

## Root Cause

The nested symlink was likely needed when:
- bun's node_modules resolution didn't work well with tsx
- Or older versions of tsx/cucumber had different module resolution behavior

Current versions (as of 2026-02-06):
- bun handles this correctly
- tsx handles this correctly
- cucumber-js handles this correctly

## Recommendation

**Remove the workaround entirely** - Lines 21-31 can be deleted without any functional impact.

## Files Analyzed
- `/Users/m/git/clients/aol/europe-ttp/scripts/bdd/run-typescript.ts:21-31`

## Testing Results
```
# With nested symlink removed
bun scripts/bdd/run-typescript.ts specs/features/
99 scenarios (99 passed)
441 steps (441 passed)
```
