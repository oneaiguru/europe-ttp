# TASK-081: bdd-verify-detect-ambiguous-steps - Implementation Plan

## Overview
Add ambiguity detection to the BDD verification script to identify when multiple step registry patterns could match the same feature file step, which would cause runtime errors in Cucumber/behave.

## Implementation Steps

### Step 1: Add Pattern Compilation Helper
**File:** `scripts/bdd/verify-alignment.ts`

Add a helper function to get or build the compiled regex pattern for a registry entry:

```typescript
/**
 * Get the compiled regex pattern for a step registry entry.
 * Uses pre-compiled pattern if available, otherwise builds from registry key.
 */
function getCompiledPattern(registryKey: string, stepEntry: StepMap[string]): RegExp {
  // If pre-compiled pattern exists, use it
  if (stepEntry.pattern) {
    return stepEntry.pattern;
  }

  // Otherwise, build from registry key (same logic as stepMatchesPattern fallback)
  const hasPlaceholders = registryKey.includes('{string}') || registryKey.includes('{int}') || registryKey.includes('{float}');
  if (hasPlaceholders) {
    const escaped = registryKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const patternStr = escaped
      .replace(/\\\{string\\\}/g, '("([^"]*)"|\'([^\']*)\')')
      .replace(/\\\{int\\\}/g, '-?\\d+')
      .replace(/\\\{float\\\}/g, '-?\\d+\\.?\\d*');
    return new RegExp(`^${patternStr}$`);
  }

  // Exact match pattern (no placeholders)
  return new RegExp(`^${registryKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
}
```

### Step 2: Add Ambiguity Detection Function
**File:** `scripts/bdd/verify-alignment.ts`

Add a function to test if two patterns could match the same input:

```typescript
/**
 * Test if two patterns could match the same step text.
 * Returns true if there's potential ambiguity.
 */
function patternsAreAmbiguous(pattern1: RegExp, pattern2: RegExp): boolean {
  // Exact duplicate check - same regex source
  if (pattern1.source === pattern2.source) {
    return true;
  }

  // Generate test cases based on pattern structure
  // For now, focus on exact duplicates and simple overlaps
  // TODO: Could expand to generate sample inputs and test both patterns

  return false;
}
```

### Step 3: Add Pairwise Ambiguity Detection
**File:** `scripts/bdd/verify-alignment.ts`

After the orphan/dead steps checks (after line 141), add:

```typescript
// Check for ambiguous step patterns (multiple registry entries could match the same feature step)
type Ambiguity = {
  key1: string;
  key2: string;
  pattern1: string;
  pattern2: string;
  file1: string;
  file2: string;
};

const ambiguities: Ambiguity[] = [];
const stepKeys = Object.keys(STEPS);
const compiledPatterns = new Map<string, RegExp>();

for (const key of stepKeys) {
  compiledPatterns.set(key, getCompiledPattern(key, STEPS[key]));
}

// Pairwise comparison
for (let i = 0; i < stepKeys.length; i++) {
  for (let j = i + 1; j < stepKeys.length; j++) {
    const key1 = stepKeys[i];
    const key2 = stepKeys[j];
    const pattern1 = compiledPatterns.get(key1)!;
    const pattern2 = compiledPatterns.get(key2)!;

    if (pattern1.source === pattern2.source) {
      // Exact duplicate - definitely ambiguous
      ambiguities.push({
        key1,
        key2,
        pattern1: pattern1.source,
        pattern2: pattern2.source,
        file1: (STEPS[key1] as StepMap[string]).typescript || 'unknown',
        file2: (STEPS[key2] as StepMap[string]).typescript || 'unknown',
      });
    }
  }
}
```

### Step 4: Update Error Reporting
**File:** `scripts/bdd/verify-alignment.ts`

Modify the error condition at line 142 to include ambiguities:

```typescript
if (orphanSteps.length || deadSteps.length || missingPython.length || missingTypescript.length || ambiguities.length) {
  console.error('BDD alignment failed');
  // ... existing error outputs ...

  if (ambiguities.length) {
    console.error(`Ambiguous step patterns: ${ambiguities.length}`);
    ambiguities.forEach((a) => {
      console.error(`  - Duplicate pattern detected:`);
      console.error(`      Pattern: ${a.pattern1}`);
      console.error(`      Entry 1: "${a.key1}" -> ${a.file1}`);
      console.error(`      Entry 2: "${a.key2}" -> ${a.file2}`);
    });
  }

  process.exit(1);
}
```

### Step 5: Update Success Message
**File:** `scripts/bdd/verify-alignment.ts`

Update line 163 to include ambiguity count:

```typescript
console.log(`✓ ${Object.keys(STEPS).length} steps defined, ${orphanSteps.length} orphan, ${deadSteps.length} dead, ${ambiguities.length} ambiguous`);
```

## Files to Change

| File | Lines | Change |
|------|-------|--------|
| `scripts/bdd/verify-alignment.ts` | 71-100 | Add `getCompiledPattern` helper (after existing helpers) |
| `scripts/bdd/verify-alignment.ts` | 142-161 | Add ambiguity detection before existing error reporting |
| `scripts/bdd/verify-alignment.ts` | 142 | Update error condition to check `ambiguities.length` |
| `scripts/bdd/verify-alignment.ts` | 163 | Update success message |

## Tests to Run

```bash
# Run the verification script (should detect any ambiguities)
bun run bdd:verify

# Run full TypeScript BDD tests
bun run bdd:typescript

# Type check
bun run typecheck
```

## Expected Outcomes

1. **No ambiguities found (ideal case):** Verification passes with `0 ambiguous` in output
2. **Ambiguities found:** Script exits with code 1 and lists all duplicate/ambiguous patterns
3. **False positives:** If detection is too aggressive, adjust `patternsAreAmbiguous` logic

## Rollback Plan

If ambiguity detection causes issues:
1. Comment out the pairwise comparison loop
2. Remove `ambiguities` from the error condition
3. Revert success message change

The changes are additive and isolated to the verification script, so rollback is straightforward.

## Notes

- Initial implementation focuses on **exact duplicate patterns** (same regex source)
- Future enhancement could generate sample inputs to detect functional equivalence
- Performance impact: O(n²) comparison with ~100 steps = ~5,000 comparisons (negligible)
- The `getCompiledPattern` helper consolidates pattern building logic currently duplicated in `stepMatchesPattern`
