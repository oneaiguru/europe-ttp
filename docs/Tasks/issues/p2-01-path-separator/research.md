# P2-01: Use Platform-Safe Separator in Repo-Root Path Check

## Verification Status: CONFIRMED

The issue exists as described. The code uses a hardcoded forward slash (`/`) for path separator comparison, which will fail on Windows systems where `path.resolve()` returns backslash-separated paths.

---

## Location

**File:** `/Users/m/git/clients/aol/europe-ttp/scripts/ui/capture-new-ui-snapshots.ts`
**Function:** `getValidatedModuleUrl`
**Line:** 34

---

## Current State Code Snippet

```typescript
// Lines 30-39
export function getValidatedModuleUrl(modulePath: string): string {
  const resolved = resolve(REPO_ROOT, modulePath);
  const normalizedRoot = resolve(REPO_ROOT);

  if (!resolved.startsWith(normalizedRoot + '/') && resolved !== normalizedRoot) {
    throw new Error(`Path traversal rejected: ${modulePath} resolves outside repo root`);
  }

  return pathToFileURL(resolved).href;
}
```

**Problem:** Line 34 uses `normalizedRoot + '/'` (hardcoded POSIX separator)

---

## Issue Analysis

### On POSIX Systems (macOS, Linux)
- `resolve('/path/to/repo', 'subdir/file.ts')` returns `/path/to/repo/subdir/file.ts`
- `normalizedRoot + '/'` = `/path/to/repo/`
- `resolved.startsWith(...)` works correctly

### On Windows
- `resolve('C:\\path\\to\\repo', 'subdir\\file.ts')` returns `C:\\path\\to\\repo\\subdir\\file.ts`
- `normalizedRoot + '/'` = `C:\\path\\to\\repo/` (mixed separator!)
- `resolved.startsWith(...)` returns `false` even for valid paths
- **Result:** All in-repo module paths incorrectly rejected

---

## Correct Pattern (Already in Codebase)

The correct platform-safe pattern is already implemented in the same codebase:

**File:** `/Users/m/git/clients/aol/europe-ttp/test/playwright/helpers/parity.ts`
**Line:** 101

```typescript
import * as path from 'node:path';

// ...
if (!resolved.startsWith(normalizedBase + path.sep) && resolved !== normalizedBase) {
  throw new Error(`Path traversal rejected: ${snapshotPath} resolves outside ${basePath}`);
}
```

**Key difference:** Uses `path.sep` instead of hardcoded `'/'`

---

## Risk Assessment

| Factor | Rating | Notes |
|--------|--------|-------|
| Severity | **Medium** | Script fails entirely on Windows |
| Likelihood | **Medium** | Depends on Windows usage in team/CI |
| Impact Scope | **Single File** | Only affects `capture-new-ui-snapshots.ts` |
| Security Impact | **None** | The bug is overly restrictive, not permissive |
| Breaking Changes | **None** | Fix is backward compatible |

---

## Recommended Approach

### Fix Complexity: **LOW**

1. **Add missing import:**
   ```typescript
   import { join, dirname, relative, resolve, sep } from 'node:path';
   ```
   Or use namespace import:
   ```typescript
   import * as path from 'node:path';
   ```

2. **Replace hardcoded separator:**
   ```typescript
   // Before
   if (!resolved.startsWith(normalizedRoot + '/') && resolved !== normalizedRoot)

   // After
   if (!resolved.startsWith(normalizedRoot + sep) && resolved !== normalizedRoot)
   ```

### Alternative: Use path.relative()

An even safer approach using `path.relative()`:
```typescript
const relativePath = relative(normalizedRoot, resolved);
if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
  throw new Error(`Path traversal rejected: ${modulePath} resolves outside repo root`);
}
```

This avoids separator issues entirely by checking if the relative path escapes upward.

---

## Files to Modify

| File | Change |
|------|--------|
| `scripts/ui/capture-new-ui-snapshots.ts` | Add `sep` to imports, replace `'/'` with `sep` on line 34 |

---

## Test Coverage

- No existing tests found for `getValidatedModuleUrl` function
- Recommend adding unit tests:
  - Test with valid in-repo path
  - Test with path traversal attempt (`../../../etc/passwd`)
  - Test with repo root itself (edge case)

---

## Summary

| Aspect | Value |
|--------|-------|
| Status | **CONFIRMED** - Issue exists at line 34 |
| Fix Complexity | **Low** - Single line change + import |
| Pattern Available | **Yes** - See `test/playwright/helpers/parity.ts:101` |
| Priority | P2 - Non-blocking but should be fixed |
