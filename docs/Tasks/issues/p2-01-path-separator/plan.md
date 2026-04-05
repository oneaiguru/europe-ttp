# P2-01: Use Platform-Safe Separator in Repo-Root Path Check

## Plan Status: READY FOR EXECUTION

---

## Approach

The fix is straightforward: replace the hardcoded `'/'` separator with `path.sep` to ensure cross-platform compatibility. The codebase already has a correct pattern in `test/playwright/helpers/parity.ts` that demonstrates this approach.

**Change Type:** Minimal - Single import modification + single character replacement

---

## Files to Modify

| File | Line | Change Description |
|------|------|-------------------|
| `scripts/ui/capture-new-ui-snapshots.ts` | 13 | Add `sep` to named imports from `node:path` |
| `scripts/ui/capture-new-ui-snapshots.ts` | 34 | Replace `'/'` with `sep` |

---

## Code Changes

### Change 1: Add `sep` to imports (Line 13)

**Old String:**
```typescript
import { join, dirname, relative, resolve } from 'node:path';
```

**New String:**
```typescript
import { join, dirname, relative, resolve, sep } from 'node:path';
```

### Change 2: Replace hardcoded separator (Line 34)

**Old String:**
```typescript
  if (!resolved.startsWith(normalizedRoot + '/') && resolved !== normalizedRoot) {
```

**New String:**
```typescript
  if (!resolved.startsWith(normalizedRoot + sep) && resolved !== normalizedRoot) {
```

---

## Reference Pattern (Already in Codebase)

The correct pattern exists at `test/playwright/helpers/parity.ts:101`:

```typescript
import path from 'node:path';

// ...

if (!resolved.startsWith(normalizedBase + path.sep) && resolved !== normalizedBase) {
```

Our fix uses the same approach but with named imports to match the existing import style in `capture-new-ui-snapshots.ts`.

---

## Validation Commands

### 1. Verify TypeScript compilation
```bash
npx tsc --noEmit scripts/ui/capture-new-ui-snapshots.ts
```

### 2. Run the script to verify functionality
```bash
npm run ui:snapshot:new
```

### 3. Verify the fix on Windows (if available)
```bash
# On Windows, the script should no longer reject valid in-repo paths
npm run ui:snapshot:new
```

### 4. Run any existing tests
```bash
npm test
```

---

## Rollback Strategy

If issues arise, revert the two changes:

1. Remove `sep` from the import on line 13
2. Change `sep` back to `'/'` on line 34

**Git rollback command:**
```bash
git checkout scripts/ui/capture-new-ui-snapshots.ts
```

---

## Risk Assessment

| Factor | Value | Notes |
|--------|-------|-------|
| Change Scope | Minimal | 2 lines in 1 file |
| Breaking Changes | None | Backward compatible on POSIX |
| Security Impact | None | No change to security logic |
| Test Coverage | Manual | No unit tests exist for this function |

---

## Summary

| Aspect | Value |
|--------|-------|
| Complexity | **Trivial** |
| Estimated Time | 2 minutes |
| Priority | P2 |
| Dependencies | None |
