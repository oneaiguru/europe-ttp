# TASK-083: bdd-verify-deterministic-output - Research

## File Analyzed
- `scripts/bdd/verify-alignment.ts`

## Potential Non-Determinism Sources

### 1. `readdirSync()` Order (Line 17)
**Location:** `scripts/bdd/verify-alignment.ts:17`
```typescript
const entries = readdirSync(dir);
```

**Finding:** The order of entries returned by `readdirSync()` is **filesystem-dependent** and not guaranteed by Node.js. On macOS APFS, entries often appear in sorted order, but this behavior varies across filesystems (ext4, NTFS, etc.).

**Impact:** LOW - The `walk()` function recursively collects all `.feature` files, but the final output only uses:
- `featureSteps` Set (insertion order from file discovery + step extraction)
- Cardinality counts (e.g., `270 steps defined`)

The error messages that list specific steps (`deadSteps`, `orphanSteps`) iterate over arrays that are built from:
1. `Object.keys(STEPS)` - insertion order (deterministic for given build)
2. `featureSteps` Set - insertion order from file traversal

**Risk:** If filesystem returns entries in different order, the `featureSteps` Set will have different insertion order. While this doesn't affect the success message (which only shows counts), error messages could list issues in different order.

### 2. `Object.entries(STEPS)` Order (Lines 165, 181, 185)
**Location:** `scripts/bdd/verify-alignment.ts:165,181,185`
```typescript
for (const [registryKey, stepEntry] of Object.entries(STEPS))
```

**Finding:** In JavaScript, `Object.entries()` returns keys in **insertion order** for string keys. The `STEPS` object in `test/bdd/step-registry.ts` is defined with literal object syntax, meaning the insertion order is deterministic based on the source code order.

**Verified:** Keys are NOT alphabetically sorted (e.g., "I request a signed upload URL without authentication" comes before "I request a signed URL with filepath {string}"), but they maintain consistent insertion order.

**Impact:** NONE - Deterministic for a given version of the step-registry.ts file.

### 3. `Set` Iteration Order (Lines 163, 168)
**Location:** `scripts/bdd/verify-alignment.ts:163,168`
```typescript
for (const featureStep of featureSteps)
```

**Finding:** JavaScript `Set` maintains **insertion order**. The insertion order depends on `walk()` which depends on `readdirSync()`.

**Impact:** LOW - Only affects the order of `deadSteps` array when errors occur. The final success message only shows counts, which are deterministic.

### 4. Timestamps, Random Values
**Finding:** None found. The script does not use:
- `Date.now()` or `new Date()`
- `Math.random()`
- `process.hrtime()`
- Any environment-dependent values

**Impact:** NONE

## Error Message Output Order

When errors occur, the script outputs:
- `orphanSteps` - from `Object.keys(STEPS).filter()` - insertion order (deterministic)
- `deadSteps` - from `featureSteps` iteration - depends on `walk()` order (filesystem-dependent)
- `missingPython` - from `Object.entries().filter()` - insertion order (deterministic)
- `missingTypescript` - from `Object.entries().filter()` - insertion order (deterministic)
- `ambiguities` - from pairwise comparison with indices `i, j` - deterministic

**Conclusion:** Only `deadSteps` output order could be non-deterministic if `readdirSync()` returns entries in different order across runs/filesystems.

## Current Behavior Verification

```bash
# Test: Run 5 times - all outputs identical
for i in 1 2 3 4 5; do
  bun run bdd:verify 2>&1
done
# Output: ✓ 270 steps defined, 0 orphan, 0 dead, 0 ambiguous (consistent)

# Test: Diff two runs - no differences
bun run bdd:verify > /tmp/run1.txt
bun run bdd:verify > /tmp/run2.txt
diff /tmp/run1.txt /tmp/run2.txt
# Result: No differences
```

## Existing Determinism Characteristics

### Deterministic Elements:
1. **Success message** - Only shows counts, which are deterministic
2. **Orphan steps** - Derived from `Object.keys(STEPS)` (insertion order)
3. **Missing Python/TS steps** - Derived from `Object.entries(STEPS)` (insertion order)
4. **Ambiguities** - Derived from sorted index loop (`for (let i = 0; i < stepKeys.length; i++)`)

### Potentially Non-Deterministic Elements:
1. **Dead steps list order** - Depends on `readdirSync()` order via `walk()` function

### Not an Issue Because:
- Dead steps array is only used in error messages
- Currently 0 dead steps exist
- Even if dead steps existed, the content is deterministic, only order varies

## Recommendations

### Minimal Fix (If Needed):
Sort the `walk()` output to guarantee deterministic file traversal:

```typescript
// Line 17 in walk()
const entries = readdirSync(dir).sort();  // Add .sort()
```

Or sort at the call site:

```typescript
// Line 149
const featureFiles = walk('specs/features').sort();  // Add .sort()
```

### Current Assessment:
The script is **effectively deterministic** for its primary use case (CI/CD validation) because:
1. Success case only shows counts (deterministic)
2. Error cases have deterministic content, only order may vary
3. No timestamps or random values
4. Step registry uses deterministic insertion order

The `.sort()` addition would be a **hardening measure** rather than a fix for an observed bug.

## References
- Node.js `fs.readdirSync` documentation: "The order of the returned files is not specified"
- JavaScript `Object.entries()` specification: Returns keys in insertion order for string keys
- JavaScript `Set` specification: Maintains insertion order
