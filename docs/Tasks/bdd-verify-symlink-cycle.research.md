# TASK-061: bdd-verify-symlink-cycle - Research

## Problem Statement

The `walk()` function in `scripts/bdd/verify-alignment.ts` uses `statSync()` which follows symlinks. This creates two potential issues:

1. **Symlink cycles** - If a directory symlink creates a cycle (e.g., `a/ -> b/` and `b/ -> a/`), the walker will recurse infinitely
2. **Escaping the repo** - A symlink to a parent directory could cause the walker to traverse outside the intended `specs/features` directory
3. **Broken symlinks** - `statSync()` will throw on broken symlinks, crashing the verifier

## Evidence

### Current Implementation

**File:** `scripts/bdd/verify-alignment.ts:9-20`

```typescript
function walk(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = statSync(full);  // ← Follows symlinks
    if (stat.isDirectory()) {
      files.push(...walk(full));   // ← No cycle detection
    } else if (stat.isFile() && entry.endsWith('.feature')) {
      files.push(full);
    }
  }
  return files;
}
```

### Existing Symlinks in the Repo

**File:** `specs/features/steps -> ../../test/python/steps`

The walker currently does not follow this symlink because it points to a file, not a directory. But directory symlinks could be added (accidentally or maliciously) and would cause issues.

### Related Work

**File:** `scripts/bdd/run-typescript.ts:30-31`

The TS runner uses `--preserve-symlinks` and `--preserve-symlinks-main` flags, which suggests symlinks are part of the development workflow.

## Solution Approaches

### Option 1: Use `lstatSync()` (Simplest, Recommended)

Replace `statSync()` with `lstatSync()` which does NOT follow symlinks:

```typescript
import { lstatSync, readdirSync, readFileSync } from 'fs';

function walk(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const stat = lstatSync(full);  // ← Does NOT follow symlinks
    if (stat.isDirectory()) {
      files.push(...walk(full));
    } else if (stat.isFile() && entry.endsWith('.feature')) {
      files.push(full);
    }
    // Symlinks are ignored (stat.isSymbolicLink())
  }
  return files;
}
```

**Pros:**
- Simple one-line change
- No risk of following symlinks
- No risk of infinite loops
- No performance overhead

**Cons:**
- Won't find `.feature` files behind symlinks (but that's probably fine for this use case)

### Option 2: Track Visited Paths (More Complex)

Track visited paths using `realpath()` to detect cycles:

```typescript
import { realpathSync, statSync, readdirSync, readFileSync } from 'fs';

function walk(dir: string, visited = new Set<string>()): string[] {
  const realPath = realpathSync(dir);
  if (visited.has(realPath)) {
    return [];  // Cycle detected
  }
  visited.add(realPath);

  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    try {
      const stat = statSync(full);
      if (stat.isDirectory()) {
        files.push(...walk(full, visited));
      } else if (stat.isFile() && entry.endsWith('.feature')) {
        files.push(full);
      }
    } catch (e) {
      // Skip unreadable paths
      console.warn(`Skipping ${full}: ${e}`);
    }
  }
  return files;
}
```

**Pros:**
- Can follow legitimate symlinks
- Detects and breaks cycles

**Cons:**
- More complex
- Still risks escaping the repo
- Performance overhead of `realpathSync()`
- Need to handle errors for broken symlinks

### Option 3: Combined Approach

Use `lstatSync()` but with explicit error handling for broken symlinks:

```typescript
import { lstatSync, readdirSync, readFileSync } from 'fs';

function walk(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch (e) {
    console.warn(`Cannot read directory ${dir}: ${e}`);
    return [];
  }

  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    try {
      const stat = lstatSync(full);
      if (stat.isDirectory()) {
        files.push(...walk(full));
      } else if (stat.isFile() && entry.endsWith('.feature')) {
        files.push(full);
      }
      // Ignore symlinks (stat.isSymbolicLink())
    } catch (e) {
      // Skip broken symlinks and unreadable paths
      console.warn(`Skipping ${full}: ${e}`);
    }
  }
  return files;
}
```

## Recommendation

**Use Option 1 (lstatSync)** for simplicity and safety. The BDD verifier should only process actual files in `specs/features`, not follow symlinks. This is the safest approach and prevents all three risks (cycles, escape, broken symlinks).

## Test Cases

After implementation, test with:

```bash
# Test 1: Verify normal operation still works
bun run bdd:verify

# Test 2: Test with symlink cycle (should not hang)
cd specs/features
ln -s ../test test_cycle && bun run bdd:verify && rm test_cycle

# Test 3: Test with broken symlink (should not crash)
ln -s /nonexistent broken_link && bun run bdd:verify && rm broken_link
```

## Files to Modify

- `scripts/bdd/verify-alignment.ts` - Replace `statSync` with `lstatSync`, add error handling
